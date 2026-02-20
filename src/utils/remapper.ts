import { AnyEvent, ChannelEvent, MidiFile, NoteOffEvent, NoteOnEvent } from 'midifile-ts';
import { channelNoteIndex } from './matchers.js';
import { getDeltaTimeBetween, insertMidiEvent, insertNoteWithLength, isMidiNote, markEvent } from './midi.js';
import color from 'ansi-colors';

export type RemappingEntry<TData=any> = [number, number, TData?];

export interface MatchedEvent {
	index: number;
	event: AnyEvent;
}

export interface RemappingHandlerTools<TRemappingData, TState = {}> {
	applyRegularRemapping: () => any;
	addChange: (event: AnyEvent) => void;
	getTicksPerBeat: ()=>number;
	insertRelativeEvent: (event: AnyEvent | ChannelEvent<any>, offset: number) => void;
	insertRelativeNoteWithLength: (newEvent: AnyEvent | ChannelEvent<any>, offset: number, lengthInTicks: number) => void;
	findEvent: (matcher: (event: AnyEvent) => boolean, start?: number) => MatchedEvent|null;
	findNoteEnd: (event: NoteOnEvent|number) => MatchedEvent|null;
	getRemapping: (event: NoteOnEvent | NoteOffEvent) => RemappingEntry<TRemappingData> | null;
	getDeltaTimeBetween: (a: AnyEvent, b: AnyEvent) => number;
	markAs: (event:AnyEvent, type:string) => void,
	isMarked: (event:AnyEvent, type:string) => boolean,
	skipNext: () => void; // helpful when inserting events. Allows to advance the iterator index to skip entries.
	state: TState; // a storage that's persisted throughout the whole replacement process
}

export type RemappingHandlerFn<TRemappingData,TState={}> = (
	track: AnyEvent[],
	event: NoteOnEvent|NoteOffEvent, 
	index: number,
	mapping: RemappingEntry<TRemappingData>,
	tools: RemappingHandlerTools<TRemappingData, TState>
) => void;

export interface BatchRemapConfig {
	fromRange?:[number,number], // start and end
	fromOffset?:[number,number], // start and count
	target:{channel:number, start:number}, 
}

export class Remapper<TRemappingData> {
	protected mappings = new Map<number, RemappingEntry<TRemappingData>>()
	protected changeList:AnyEvent[] = []
	constructor(
		protected srcChannel:number, // 1-16
	) {}

	protected markings = new Map<string, Set<AnyEvent|ChannelEvent<any>>>();

	markEvent(event:AnyEvent|ChannelEvent<any>, type:string) {
		if(this.markings.has(type)) {
			this.markings.get(type).add(event)
		} else {
			const set = new Set<AnyEvent|ChannelEvent<any>>()
			set.add(event)
			this.markings.set(type, set)
		}
		markEvent(event,type)
	}

	isEventMarked(event:AnyEvent|ChannelEvent<any>, type:string):boolean {
		return this.markings.has(type) && this.markings.get(type).has(event)
	}

	remap(srcAddress:number, targetChannel:number, targetAddress:number, data={}) {
		this.mappings.set(
			channelNoteIndex(this.srcChannel, srcAddress), 
			[targetChannel,targetAddress,data as TRemappingData]
		)
	}

	batchRemap(c:BatchRemapConfig) {
		let start, count;
		if(c.fromRange) {
			start = c.fromRange[0]
			count = c.fromRange[1] - c.fromRange[0] + 1;
		} else if(c.fromOffset) {
			start = c.fromOffset[0]
			count = c.fromOffset[1];
		} else {
			throw new Error('batchRemap failed: provide either fromRange or fromOffset!')
		}
		for(let i=0; i<count; i++) {
			this.remap(start+i, c.target.channel, c.target.start+i)
		}
		// console.log('batchRemap entries created', c, this.mappings)
	}

	getRemapping(event:NoteOnEvent|NoteOffEvent):RemappingEntry<TRemappingData>|null {
		if(!this.isEventMarked(event, 'remapped')) return null
		const id = channelNoteIndex(event.channel + 1, event.noteNumber);
		const mapping = this.mappings.get(id);
		return mapping
	}

	apply<TState=Record<string,any>>(
		input: MidiFile|AnyEvent[], 
		// if passed, the customHandler function will be called for every event matching a remapper. 
		// no changes will be auto-applied, instead the handler is responsible for applying changes.
		customHandler?:RemappingHandlerFn<TRemappingData,TState>,
		state:TState = {} as any
	):TState {
		let track:AnyEvent[];
		let ticksPerBeat = 960;
		if(Array.isArray(input)) {
			track = input
		} else {
			track = input.tracks[0];
			ticksPerBeat = input.header.ticksPerBeat;
		}
		// replace events
		let i = 0;
		while(i < track.length) {
			const event = track[i];
			let advanceIndex = 1;
			// when remapping within a channel, events that are being inserted may be interpreted wrongly.
			// ignore them to ensure they wont affect/bug the result.
			if(this.isEventMarked(event, 'generated')) {
				i++;
				continue;
			}
			if(this.isRemappedEvent(event)) {
				this.markEvent(event, 'remapped')
			}
			i+=advanceIndex;
		}

		// console.log('detected events to remap: '+this.markings.get('remapped')?.size || 0)

		i=0;
		while(i < track.length) {
			const event = track[i] as NoteOnEvent|NoteOffEvent;
			let advanceIndex = 1;
			if(this.isEventMarked(event, 'remapped')) {
				const mapping = this.getRemapping(event)
				
				if(!mapping) {
					console.error(mapping, event)
					throw new Error('failed to get mapping for event marked as remapped!')
				}
				// console.log('remapping '+(event.channel+1)+'@'+event.noteNumber+' -> '+id+' -> '+JSON.stringify(mapping))
				const applyRegularRemapping = ()=>{
					event.channel = mapping[0] - 1;
					event.noteNumber = mapping[1];
					this.changeList.push(event);
				}

				if(customHandler) {
					const tools:RemappingHandlerTools<TRemappingData,TState> = {
						applyRegularRemapping,
						getRemapping:(event:NoteOnEvent|NoteOffEvent):RemappingEntry<TRemappingData>|null=>{
							return this.getRemapping(event)
						},
						getTicksPerBeat:()=>ticksPerBeat,
						addChange:(change:AnyEvent)=>{ this.changeList.push(change) },
						markAs:(event:AnyEvent, type:string)=>{ this.markEvent(event,type) },
						isMarked:(event:AnyEvent, type:string)=>{ return this.isEventMarked(event,type) },
						skipNext:()=>{ advanceIndex++ },
						insertRelativeEvent:(newEvent,offset)=>{
							insertMidiEvent(track, newEvent as any, i, offset);
							this.changeList.push(newEvent as any)
							if(offset <= 0) advanceIndex++
						},
						insertRelativeNoteWithLength:(newEvent,offset,lengthInTicks)=>{
							insertNoteWithLength(track, newEvent as any, i, offset,lengthInTicks)
							this.changeList.push(newEvent as any, newEvent as any)
							if(offset <= 0) advanceIndex++
						},
						findEvent:(matcher:(event:AnyEvent)=>boolean, start=i+1):MatchedEvent|null=>{
							for(let searchIndex = start; searchIndex < track.length; searchIndex++) {
								if(matcher(track[searchIndex])) return {index:searchIndex, event: track[searchIndex]}
							}
							return null;
						},
						findNoteEnd: (event: NoteOnEvent|number):MatchedEvent|null => {
							const index = typeof event === 'number' ? event : track.findIndex(e=>e===event);
							if(index < 0) throw new Error('event not part of track')
							const noteOn = track[index] as NoteOnEvent;
							if(noteOn.subtype !== 'noteOn') {
								console.log(noteOn); 
								throw new Error('given event is no noteOn, cannot determine related noteOff')
							}
							for(let searchIndex = index+1; searchIndex < track.length; searchIndex++) {
								const e = track[searchIndex];
								if(e.type!=='channel') continue;
								if(e.subtype!=='noteOff') continue;
								if(e.channel !== noteOn.channel) continue;
								if(e.noteNumber !== noteOn.noteNumber) continue;
								return {index:searchIndex, event: track[searchIndex]}
							}
							return null
						},
						getDeltaTimeBetween:(a:AnyEvent, b:AnyEvent):number=>{
							const aIndex = track.findIndex(e=>e===a);
							const bIndex = track.findIndex(e=>e===b);
							if(!aIndex) throw new Error('getDistanceBetween: Event A not found in track!')
							if(!bIndex) throw new Error('getDistanceBetween: Event B not found in track!')
							return getDeltaTimeBetween(track,aIndex,bIndex)
						},
						state,
					};

					customHandler( track, event, i, mapping, tools);
				} else {
					applyRegularRemapping()
				}
			}
			i+=advanceIndex;
		}

		return state;
	}

	getChangeList() {
		return this.changeList
	}

	reset(resetChangeList=false) {
		this.mappings.clear();
		if(resetChangeList) this.changeList = [];
	}

	isRemappedEvent(event:AnyEvent): event is NoteOnEvent|NoteOffEvent {
		if(!isMidiNote(event)) return false;
		if(this.srcChannel !== event.channel+1) return false;
		const id = channelNoteIndex(event.channel+1, event.noteNumber);
		return this.mappings.has(id)
	}

	reportChanges(file:string):boolean {
		if(this.changeList.length > 0) {
			process.stdout.write(color.green('Updated '+this.changeList.length/2+' MIDI notes in file '+file+'\n'))
			return true;
		} else {
			process.stdout.write(color.gray('No changes in file '+file+'\n'))
			return false;
		}
	}
}


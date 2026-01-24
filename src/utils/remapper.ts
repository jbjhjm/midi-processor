import { AnyEvent, NoteOffEvent, NoteOnEvent } from 'midifile-ts';
import { channelNoteIndex } from './matchers.js';
import { isMidiNote } from './midi.js';
import color from 'ansi-colors';

export type RemappingEntry<TData=any> = [number, number, TData?];

export type RemappingHandlerFn<TRemappingData,TState={}> = (
	track: AnyEvent[],
	event: NoteOnEvent|NoteOffEvent, 
	index: number,
	mapping: RemappingEntry<TRemappingData>,
	tools: {
		applyRegularRemapping:()=>any,
		addChange:(event:AnyEvent)=>void,
		state:TState // a storage that's persisted throughout the whole replacement process
	}
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
		protected srcChannel:number,
	) {}

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

	apply<TState=Record<string,any>>(
		track: AnyEvent[], 
		customHandler?:RemappingHandlerFn<TRemappingData,TState>,
		state:TState = {} as any
	):TState {
		// replace events
		let i = 0;
		while(i < track.length) {
			const event = track[i];
			// when remapping within a channel, events that are being inserted may be interpreted wrongly.
			// ignore them to ensure they wont affect/bug the result.
			if(isGeneratedEvent(event)) {
				i++;
				continue;
			}
			if(this.isRemappedEvent(event)) {
				const id = channelNoteIndex(event.channel + 1, event.noteNumber);
				const applyRegularRemapping = ()=>{
					const [channel, note, config] = this.mappings.get(id);
					// console.log('remapping '+event.noteNumber+' to '+note);
					event.channel = channel - 1;
					event.noteNumber = note;
					this.changeList.push(event);
				}
				if(customHandler) {
					customHandler(
						track,
						event, 
						i,
						this.mappings.get(id),
						{
							applyRegularRemapping,
							addChange:(change:AnyEvent)=>{ this.changeList.push(change) },
							state,
						}
					);
				} else {
					applyRegularRemapping()
				}
			}
			i++;
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


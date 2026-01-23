import color from 'ansi-colors';
import type { AnyEvent, MidiFile, NoteOffEvent, NoteOnEvent } from "midifile-ts";
import { channelNoteIndex as index } from '../utils/matchers.js';
import { globals } from '../globals.js';
import { insertNoteWithLength, isMidiNote } from '../utils/midi.js';

const allowedChannels = [15].map(v=>v-1); // WARNING: 0-15 !!!
type RemappingEntry = [number, number, {white?:boolean, mult:number}];

export default async function (midi:MidiFile, file:string) {
	const track = midi.tracks[0];
	const changes:AnyEvent[] = [];
	
	changes.push(...applyRemapping(track, remappingSuns, globals.channels.suns));

	changes.push(...applyRemapping(track, remappingMic, globals.channels.mic));

	changes.push(...applyRemapping(track, remappingJBMH, globals.channels.jbmh));

	if(changes.length > 0) {
		process.stdout.write(color.green('Updated '+changes.length/2+' MIDI notes in file '+file+'\n'))
		return true;
	} else {
		process.stdout.write(color.gray('No changes in file '+file+'\n'))
		return false;
	}

}

function applyRemapping(track: AnyEvent[], remappings:Map<number, RemappingEntry>, whiteModeChannel:number) {
	let changes = [];

	// replace events
	let i = 0;
	let whiteActive = false;
	let multiplier = 4;
	while(i < track.length) {
		const event = track[i];
		if(isRemappedEvent(event, remappings)) {
			const id = index(event.channel + 1, event.noteNumber);
			const [channel, note, config] = remappings.get(id);
			event.channel = channel - 1;
			event.noteNumber = note;
			changes.push(event);
			// we ignore noteOff events and only trigger white mode on and off based on what is being triggered.
			// this allows for easy manual refinement later.
			if(event.subtype==='noteOn') {
				const useWhiteMode = config.white||false;
				const useMultiplier = config.mult;
				if(whiteActive !== useWhiteMode) {
					// console.log('inserting a white toggle 50 ticks before current event')
					const event = buildWhiteModeEvent(useWhiteMode, whiteModeChannel);
					changes.push(event)
					insertNoteWithLength(track, event, i, -50, 900)
					whiteActive = useWhiteMode;
					i++;
				}
				if(multiplier !== useMultiplier) {
					// console.log('inserting a multiplier 50 ticks before current event')
					const event = buildStrobeSpeedEvent(useMultiplier);
					changes.push(event)
					insertNoteWithLength(track, event, i, -50, 900)
					multiplier = useMultiplier;
					i++;
				}
			}
		}
		i++;
	}
	if(whiteActive) {
		track.push(buildWhiteModeEvent(false, whiteModeChannel));
	}

	return changes;
}

function buildWhiteModeEvent(useWhiteMode: boolean, whiteModeChannel: number): NoteOnEvent {
	// console.log('set white mode toggle to '+useWhiteMode+' after event')
	return {
		deltaTime: 0,
		type: 'channel',
		subtype: 'noteOn',
		channel: whiteModeChannel - 1, // 0-15!
		noteNumber: useWhiteMode ? 15 : 14,
		velocity: 127,
	};
}

function buildStrobeSpeedEvent(multiplier:number): NoteOnEvent {
	// console.log('set white mode toggle to '+useWhiteMode+' after event')
	return {
		deltaTime: 0,
		type: 'channel',
		subtype: 'noteOn',
		channel: 2 - 1, // 0-15!
		noteNumber: 5,
		velocity: multiplier,
	};
}

function isRemappedEvent(event:AnyEvent, remappings:Map<number, RemappingEntry>): event is NoteOnEvent|NoteOffEvent {
	if(!isMidiNote(event)) return false;
	if(!allowedChannels.includes(event.channel)) return false;
	const id = index(event.channel+1, event.noteNumber);
	return remappings.has(id)
}


const ch = globals.channels;
const remappingSuns = new Map<number, RemappingEntry>()
remappingSuns.set(index(15,30), [ch.suns,28,{mult:12}])
remappingSuns.set(index(15,31), [ch.suns,29,{mult:12}])
remappingSuns.set(index(15,32), [ch.suns,30,{mult:12}])
remappingSuns.set(index(15,33), [ch.suns,31,{mult:12}])
remappingSuns.set(index(15,45), [ch.suns,28,{mult:16}])
remappingSuns.set(index(15,46), [ch.suns,29,{mult:16}])
remappingSuns.set(index(15,47), [ch.suns,30,{mult:16}])
remappingSuns.set(index(15,48), [ch.suns,31,{mult:16}])
remappingSuns.set(index(15,60), [ch.suns,28,{mult:24}])
remappingSuns.set(index(15,61), [ch.suns,29,{mult:24}])
remappingSuns.set(index(15,62), [ch.suns,30,{mult:24}])
remappingSuns.set(index(15,63), [ch.suns,31,{mult:24}])

const remappingMic = new Map<number, RemappingEntry>()
remappingMic.set(index(15,34), [ch.mic,28,{mult:12}])
remappingMic.set(index(15,39), [ch.mic,28,{mult:12,white:true}]) 
remappingMic.set(index(15,49), [ch.mic,28,{mult:16}])
remappingMic.set(index(15,54), [ch.mic,28,{mult:16,white:true}])
remappingMic.set(index(15,64), [ch.mic,28,{mult:24}])
remappingMic.set(index(15,69), [ch.mic,28,{mult:24,white:true}])

const remappingJBMH = new Map<number, RemappingEntry>()
remappingJBMH.set(index(15,35), [ch.jbmh,28,{mult:12}])
remappingJBMH.set(index(15,36), [ch.jbmh,29,{mult:12}])
remappingJBMH.set(index(15,37), [ch.jbmh,30,{mult:12}])
remappingJBMH.set(index(15,38), [ch.jbmh,31,{mult:12}])
remappingJBMH.set(index(15,40), [ch.jbmh,28,{mult:12,white:true}])
remappingJBMH.set(index(15,41), [ch.jbmh,29,{mult:12,white:true}])
remappingJBMH.set(index(15,42), [ch.jbmh,30,{mult:12,white:true}])
remappingJBMH.set(index(15,43), [ch.jbmh,31,{mult:12,white:true}])
remappingJBMH.set(index(15,50), [ch.jbmh,28,{mult:16}])
remappingJBMH.set(index(15,51), [ch.jbmh,29,{mult:16}])
remappingJBMH.set(index(15,52), [ch.jbmh,30,{mult:16}])
remappingJBMH.set(index(15,53), [ch.jbmh,31,{mult:16}])
remappingJBMH.set(index(15,55), [ch.jbmh,28,{mult:16,white:true}])
remappingJBMH.set(index(15,56), [ch.jbmh,29,{mult:16,white:true}])
remappingJBMH.set(index(15,57), [ch.jbmh,30,{mult:16,white:true}])
remappingJBMH.set(index(15,58), [ch.jbmh,31,{mult:16,white:true}])
remappingJBMH.set(index(15,65), [ch.jbmh,28,{mult:24}])
remappingJBMH.set(index(15,66), [ch.jbmh,29,{mult:24}])
remappingJBMH.set(index(15,67), [ch.jbmh,30,{mult:24}])
remappingJBMH.set(index(15,68), [ch.jbmh,31,{mult:24}])
remappingJBMH.set(index(15,70), [ch.jbmh,28,{mult:24,white:true}])
remappingJBMH.set(index(15,71), [ch.jbmh,29,{mult:24,white:true}])
remappingJBMH.set(index(15,72), [ch.jbmh,30,{mult:24,white:true}])
remappingJBMH.set(index(15,73), [ch.jbmh,31,{mult:24,white:true}])

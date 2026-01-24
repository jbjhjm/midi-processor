import color from 'ansi-colors';
import type { AnyEvent, MidiFile, NoteOffEvent, NoteOnEvent } from "midifile-ts";
import { channelNoteIndex as index } from '../utils/matchers.js';
import { globals } from '../globals.js';
import { isMidiNote } from '../utils/midi.js';

const allowedChannels = [15].map(v=>v-1); // WARNING: 0-15 !!!
type RemappingEntry = [number, number, boolean?];

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
	while(i < track.length) {
		const event = track[i];
		if(isRemappedEvent(event, remappings)) {
			const id = index(event.channel + 1, event.noteNumber);
			const [channel, note, isWhiteMode] = remappings.get(id);
			const useWhiteMode = isWhiteMode || false;
			event.channel = channel - 1;
			event.noteNumber = note;
			changes.push(event);
			// we ignore noteOff events and only trigger white mode on and off based on what is being triggered.
			// this allows for easy manual refinement later.
			if(event.subtype==='noteOn') {
				if(whiteActive !== useWhiteMode) {
					const event = buildWhiteModeEvent(useWhiteMode, whiteModeChannel);
					changes.push(event)
					track.splice(i,0, event);
					whiteActive = useWhiteMode;
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

function buildWhiteModeEvent(useWhiteMode: boolean, whiteModeChannel: number): AnyEvent {
	// console.log('set white mode toggle to '+useWhiteMode+' after event')
	return {
		deltaTime: 0,
		type: 'channel',
		subtype: useWhiteMode ? 'noteOn' : 'noteOff',
		channel: whiteModeChannel - 1, // 0-15!
		noteNumber: 12,
		velocity: 127,
	};
}

function isRemappedEvent(event:AnyEvent, remappings:Map<number, RemappingEntry>): event is NoteOnEvent|NoteOffEvent {
	if(!isMidiNote(event)) return false;
	if(!allowedChannels.includes(event.channel)) return false;
	const id = index(event.channel+1, event.noteNumber);
	return remappings.has(id)
}


const remappingSuns = new Map<number, RemappingEntry>()
let targetChannel = globals.channels.suns
const baseIndex = 16;
// sun fadein
remappingSuns.set(index(15,15), [targetChannel,baseIndex])
remappingSuns.set(index(15,16), [targetChannel,baseIndex+1])
remappingSuns.set(index(15,17), [targetChannel,baseIndex+2])
remappingSuns.set(index(15,18), [targetChannel,baseIndex+3])
// sun flash
remappingSuns.set(index(15,75), [targetChannel,baseIndex+4])
remappingSuns.set(index(15,76), [targetChannel,baseIndex+5])
remappingSuns.set(index(15,77), [targetChannel,baseIndex+6])
remappingSuns.set(index(15,78), [targetChannel,baseIndex+7])
// sun fadeout
remappingSuns.set(index(15,0), [targetChannel,baseIndex+8])
remappingSuns.set(index(15,1), [targetChannel,baseIndex+9])
remappingSuns.set(index(15,2), [targetChannel,baseIndex+10])
remappingSuns.set(index(15,3), [targetChannel,baseIndex+11])


const remappingMic = new Map<number, RemappingEntry>()
targetChannel = globals.channels.mic
// mic fadein
remappingMic.set(index(15,19), [targetChannel,baseIndex])
remappingMic.set(index(15,24), [targetChannel,baseIndex,true]) // white
// mic flash
remappingMic.set(index(15,29), [targetChannel,baseIndex+4])
remappingMic.set(index(15,84), [targetChannel,baseIndex+4,true]) // white
// mic fadeout
remappingMic.set(index(15,4), [targetChannel,baseIndex+8])
remappingMic.set(index(15,9), [targetChannel,baseIndex+8,true]) // white


const remappingJBMH = new Map<number, RemappingEntry>()
targetChannel = globals.channels.jbmh
// jbmh fadein
remappingJBMH.set(index(15,20), [targetChannel,baseIndex])
remappingJBMH.set(index(15,21), [targetChannel,baseIndex+1])
remappingJBMH.set(index(15,22), [targetChannel,baseIndex+2])
remappingJBMH.set(index(15,23), [targetChannel,baseIndex+3])
remappingJBMH.set(index(15,25), [targetChannel,baseIndex,true]) // white
remappingJBMH.set(index(15,26), [targetChannel,baseIndex+1,true]) // white
remappingJBMH.set(index(15,27), [targetChannel,baseIndex+2,true]) // white
remappingJBMH.set(index(15,28), [targetChannel,baseIndex+3,true]) // white
// jbmh flash
remappingJBMH.set(index(15,80), [targetChannel,baseIndex+4])
remappingJBMH.set(index(15,81), [targetChannel,baseIndex+1+5])
remappingJBMH.set(index(15,82), [targetChannel,baseIndex+6])
remappingJBMH.set(index(15,83), [targetChannel,baseIndex+7])
remappingJBMH.set(index(15,85), [targetChannel,baseIndex+4,true]) // white
remappingJBMH.set(index(15,86), [targetChannel,baseIndex+1+5,true]) // white
remappingJBMH.set(index(15,87), [targetChannel,baseIndex+6,true]) // white
remappingJBMH.set(index(15,88), [targetChannel,baseIndex+7,true]) // white
// jbmh fadeout
remappingJBMH.set(index(15,5), [targetChannel,baseIndex+8])
remappingJBMH.set(index(15,6), [targetChannel,baseIndex+9])
remappingJBMH.set(index(15,7), [targetChannel,baseIndex+10])
remappingJBMH.set(index(15,8), [targetChannel,baseIndex+11])
remappingJBMH.set(index(15,10), [targetChannel,baseIndex+8,true]) // white
remappingJBMH.set(index(15,11), [targetChannel,baseIndex+9,true]) // white
remappingJBMH.set(index(15,12), [targetChannel,baseIndex+10,true]) // white
remappingJBMH.set(index(15,13), [targetChannel,baseIndex+11,true]) // white

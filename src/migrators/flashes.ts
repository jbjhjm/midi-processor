import color from 'ansi-colors';
import type { AnyEvent, MidiFile, NoteOffEvent, NoteOnEvent } from "midifile-ts";
import { isMidiNote, channelNoteIndex as index } from '../utils/matchers.js';
import { globals } from '../globals.js';

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
// sun fadeout
remappingSuns.set(index(15,0), [targetChannel,24])
remappingSuns.set(index(15,1), [targetChannel,25])
remappingSuns.set(index(15,2), [targetChannel,26])
remappingSuns.set(index(15,3), [targetChannel,27])
// sun fadein
remappingSuns.set(index(15,15), [targetChannel,16])
remappingSuns.set(index(15,16), [targetChannel,17])
remappingSuns.set(index(15,17), [targetChannel,18])
remappingSuns.set(index(15,18), [targetChannel,19])
// sun flash
remappingSuns.set(index(15,75), [targetChannel,20])
remappingSuns.set(index(15,76), [targetChannel,21])
remappingSuns.set(index(15,77), [targetChannel,22])
remappingSuns.set(index(15,78), [targetChannel,23])


const remappingMic = new Map<number, RemappingEntry>()
targetChannel = globals.channels.mic
// mic fadeout
remappingMic.set(index(15,4), [targetChannel,24])
remappingMic.set(index(15,9), [targetChannel,24,true]) // white
// mic fadein
remappingMic.set(index(15,19), [targetChannel,16])
remappingMic.set(index(15,24), [targetChannel,16,true]) // white
// mic flash
remappingMic.set(index(15,29), [targetChannel,20])
remappingMic.set(index(15,84), [targetChannel,20,true]) // white


const remappingJBMH = new Map<number, RemappingEntry>()
targetChannel = globals.channels.jbmh
// jbmh fadeout
remappingJBMH.set(index(15,5), [targetChannel,24])
remappingJBMH.set(index(15,6), [targetChannel,25])
remappingJBMH.set(index(15,7), [targetChannel,26])
remappingJBMH.set(index(15,8), [targetChannel,27])
remappingJBMH.set(index(15,10), [targetChannel,24,true]) // white
remappingJBMH.set(index(15,11), [targetChannel,25,true]) // white
remappingJBMH.set(index(15,12), [targetChannel,26,true]) // white
remappingJBMH.set(index(15,13), [targetChannel,27,true]) // white
// jbmh fadein
remappingJBMH.set(index(15,20), [targetChannel,16])
remappingJBMH.set(index(15,21), [targetChannel,17])
remappingJBMH.set(index(15,22), [targetChannel,18])
remappingJBMH.set(index(15,23), [targetChannel,19])
remappingJBMH.set(index(15,25), [targetChannel,16,true]) // white
remappingJBMH.set(index(15,26), [targetChannel,17,true]) // white
remappingJBMH.set(index(15,27), [targetChannel,18,true]) // white
remappingJBMH.set(index(15,28), [targetChannel,19,true]) // white
// jbmh flash
remappingJBMH.set(index(15,80), [targetChannel,20])
remappingJBMH.set(index(15,81), [targetChannel,21])
remappingJBMH.set(index(15,82), [targetChannel,22])
remappingJBMH.set(index(15,83), [targetChannel,23])
remappingJBMH.set(index(15,85), [targetChannel,20,true]) // white
remappingJBMH.set(index(15,86), [targetChannel,21,true]) // white
remappingJBMH.set(index(15,87), [targetChannel,22,true]) // white
remappingJBMH.set(index(15,88), [targetChannel,23,true]) // white

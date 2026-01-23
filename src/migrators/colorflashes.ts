import color from 'ansi-colors';
import type { AnyEvent, MidiFile, NoteOffEvent, NoteOnEvent } from "midifile-ts";
import { channelNoteIndex as index } from '../utils/matchers.js';
import { globals } from '../globals.js';
import { insertNoteWithLength, isMidiNote } from '../utils/midi.js';

const allowedChannels = [8].map(v=>v-1); // WARNING: 0-15 !!!
type RemappingEntry = [number, number, {}];

export default async function (midi:MidiFile, file:string) {
	const track = midi.tracks[0];
	const changes:AnyEvent[] = [];
	const ch = globals.channels;

	const remappings = new Map<number, RemappingEntry>()
	remapTriggers(remappings, 61, 25, ch.globals, 12);
	changes.push(...applyRemapping(track, remappings, globals.channels.suns));

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
	while(i < track.length) {
		const event = track[i];
		if(isRemappedEvent(event, remappings)) {
			const id = index(event.channel + 1, event.noteNumber);
			const [channel, note, config] = remappings.get(id);
			event.channel = channel - 1;
			event.noteNumber = note;
			changes.push(event);
		}
		i++;
	}

	return changes;
}

function isRemappedEvent(event:AnyEvent, remappings:Map<number, RemappingEntry>): event is NoteOnEvent|NoteOffEvent {
	if(!isMidiNote(event)) return false;
	if(!allowedChannels.includes(event.channel)) return false;
	const id = index(event.channel+1, event.noteNumber);
	return remappings.has(id)
}

function remapTriggers(map:Map<any,any>,startAddress:number, numPixels:number, targetChannel:number, targetStartAdress:number) {
	for(let i=0; i<numPixels; i++) {
		map.set(index(8, startAddress+i), [targetChannel,targetStartAdress+i,{}])
	}
}

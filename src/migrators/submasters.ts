import type { MidiFile, NoteOffEvent, NoteOnEvent } from "midifile-ts";
import color from 'ansi-colors';

const allowedSubtypes = ['noteOn', 'noteOff'];
type MatchedSubtype = NoteOnEvent|NoteOffEvent;
const allowedChannels = [7]; // 0-15 !!!

function inRange(val, min, max) {
	return val >= min && val <= max
}

export default async function (midi:MidiFile, file:string) {
	let changes = [];
	for(const entry of midi.tracks[0]){
		if(entry.type!=='channel') continue;
		if(!allowedSubtypes.includes(entry.subtype)) continue;
		if(!allowedChannels.includes(entry.channel)) continue;

		const event = entry as MatchedSubtype;
		if(inRange(event.noteNumber, 40,43)) {
			// mic brightness 100%, 50% 25%, 10%
			// --> ch 4 @ 001
			const index = event.noteNumber - 40;
			event.velocity = [100,50,25,10][index];
			event.channel = 4;
			event.noteNumber = 1;
			changes.push(event);
		} else if(inRange(event.noteNumber, 45,48)) {
			// jbmh brightness 100%, 50% 25%, 10%
			// --> ch 3 @ 001
			const index = event.noteNumber - 45;
			event.velocity = [100,50,25,10][index];
			event.channel = 4;
			event.noteNumber = 1;
			changes.push(event);
		} else if(inRange(event.noteNumber, 50,53)) {
			// suns brightness 100%, 50% 25%, 10%
			// --> ch 5 @ 001
			const index = event.noteNumber - 50;
			event.velocity = [100,50,25,10][index];
			event.channel = 5;
			event.noteNumber = 1;
			changes.push(event);
		}
	}

	if(changes.length > 0) {
		process.stdout.write(color.green('Updated '+changes.length/2+' MIDI notes in file '+file+'\n'))
		return true;
	} else {
		process.stdout.write(color.gray('No changes in file '+file+'\n'))
		return false;
	}

}
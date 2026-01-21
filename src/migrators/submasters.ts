import color from 'ansi-colors';
import type { MidiFile } from "midifile-ts";
import { inRange, isMidiNote } from '../utils/matchers.js';

const allowedChannels = [8].map(v=>v-1); // WARNING: 0-15 !!!

export default async function (midi:MidiFile, file:string) {
	let changes = [];
	for(const event of midi.tracks[0]){
		if(!isMidiNote(event)) continue;
		if(!allowedChannels.includes(event.channel)) continue;
		if(inRange(event.noteNumber, 40,43)) {
			// mic brightness 100%, 50% 25%, 10%
			// --> ch 4 @ 001
			const index = event.noteNumber - 40;
			event.velocity = [100,50,25,10][index];
			event.channel = 4-1; // WARNING: 0-15 !!!
			event.noteNumber = 1;
			changes.push(event);
		} else if(inRange(event.noteNumber, 45,48)) {
			// jbmh brightness 100%, 50% 25%, 10%
			// --> ch 3 @ 001
			const index = event.noteNumber - 45;
			event.velocity = [100,50,25,10][index];
			event.channel = 3-1; // WARNING: 0-15 !!!
			event.noteNumber = 1;
			changes.push(event);
		} else if(inRange(event.noteNumber, 50,53)) {
			// suns brightness 100%, 50% 25%, 10%
			// --> ch 5 @ 001
			const index = event.noteNumber - 50;
			event.velocity = [100,50,25,10][index];
			event.channel = 5-1; // WARNING: 0-15 !!!
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
import color from 'ansi-colors';
import type { MidiFile } from "midifile-ts";
import { inRange } from '../utils/matchers.js';
import { globals } from '../globals.js';
import { isMidiNote } from '../utils/midi.js';

const allowedChannels = [8].map(v=>v-1); // WARNING: 0-15 !!!


export default async function (midi:MidiFile, file:string) {
	let changes = [];
	for(const event of midi.tracks[0]){
		if(!isMidiNote(event)) continue;
		if(!allowedChannels.includes(event.channel)) continue;
		if(inRange(event.noteNumber, 1, 9)) {
			// mic brightness 100%, 50% 25%, 10%
			// --> ch 4 @ 001
			const index = event.noteNumber - 1;
			event.velocity = [100,80,60,40,30,20,10,5,0][index];
			event.channel = globals.channels.jbmh;  // WARNING: 0-15 !!!
			event.noteNumber = 2;
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
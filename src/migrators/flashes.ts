import color from 'ansi-colors';
import type { MidiFile } from "midifile-ts";
import { inRange, isMidiNote, channelNoteIndex as index } from '../utils/matchers.js';

const allowedChannels = [15].map(v=>v-1); // WARNING: 0-15 !!!

export default async function (midi:MidiFile, file:string) {
	let changes = [];
	for(const event of midi.tracks[0]){
		if(!isMidiNote(event)) continue;
		if(!allowedChannels.includes(event.channel)) continue;
		const id = index(event.channel+1, event.noteNumber);
		if(remapping.has(id)) {
			const [channel,note] = remapping.get(id);
			event.channel = channel-1;
			event.noteNumber = note;
			changes.push(event)
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

const remapping = new Map<number,number[]>()
// sun fadeout
remapping.set(index(15,0), [4,20])
remapping.set(index(15,1), [4,21])
remapping.set(index(15,2), [4,22])
remapping.set(index(15,3), [4,23])
// mic fadeout
remapping.set(index(15,4), [5,14])
// jbmh fadeout
remapping.set(index(15,5), [4,20])
remapping.set(index(15,6), [4,21])
remapping.set(index(15,7), [4,22])
remapping.set(index(15,8), [4,23])
// mic fadeout white
remapping.set(index(15,9), [5,18])
// jbmh fadeout white
remapping.set(index(15,10), [4,36])
remapping.set(index(15,11), [4,37])
remapping.set(index(15,12), [4,38])
remapping.set(index(15,13), [4,39])

// sun fadein
remapping.set(index(15,15), [4,12])
remapping.set(index(15,16), [4,13])
remapping.set(index(15,17), [4,14])
remapping.set(index(15,18), [4,15])
// mic fadein
remapping.set(index(15,19), [5,12])
// jbmh fadein
remapping.set(index(15,20), [4,12])
remapping.set(index(15,21), [4,13])
remapping.set(index(15,22), [4,14])
remapping.set(index(15,23), [4,15])
// mic fadein white
remapping.set(index(15,24), [5,16])
// jbmh fadein white
remapping.set(index(15,25), [4,28])
remapping.set(index(15,26), [4,29])
remapping.set(index(15,27), [4,30])
remapping.set(index(15,28), [4,31])

// sun flash
remapping.set(index(15,75), [4,16])
remapping.set(index(15,76), [4,17])
remapping.set(index(15,77), [4,18])
remapping.set(index(15,78), [4,19])
// mic flash
remapping.set(index(15,29), [5,13])
// jbmh flash
remapping.set(index(15,80), [4,16])
remapping.set(index(15,81), [4,17])
remapping.set(index(15,82), [4,18])
remapping.set(index(15,83), [4,19])
// mic flash white
remapping.set(index(15,84), [5,17])
// jbmh flash white
remapping.set(index(15,85), [4,32])
remapping.set(index(15,86), [4,33])
remapping.set(index(15,87), [4,34])
remapping.set(index(15,88), [4,35])

import type { MidiFile } from "midifile-ts";
import { globals } from '../globals.js';
import { Remapper } from '../utils/remapper.js';


export const priority = -5;
export default async function (midi:MidiFile, file:string) {
	const mapper = new Remapper(16);

	// sun pixels 4 * 10
	mapper.batchRemap({
		fromOffset:[1, 40], 
		target:{channel:globals.channels.suns, start:41}, 
	})
	// mic pixels
	mapper.batchRemap({
		fromOffset:[41, 16], 
		target:{channel:globals.channels.mic, start:41}, 
	})

	mapper.apply(midi.tracks[0])

	return mapper.reportChanges(file)

}

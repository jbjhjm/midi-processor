import type { MidiFile } from "midifile-ts";
import { globals } from '../globals.js';
import { Remapper } from '../utils/remapper.js';


export const priority = -5;
export default async function (midi:MidiFile, file:string) {

	const mapper = new Remapper(8);
	// color flashes
	mapper.batchRemap({
		fromOffset:[61, 25], 
		target:{channel:globals.channels.globals, start:12}, 
	})
	mapper.apply(midi.tracks[0])

	return mapper.reportChanges(file)

}
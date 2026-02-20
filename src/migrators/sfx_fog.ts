import type { MidiFile } from "midifile-ts";
import { globals } from '../globals.js';
import { Remapper } from '../utils/remapper.js';


export const priority = -5;
export default async function (midi:MidiFile, file:string) {
	const mapper = new Remapper(15);

	// fog
	mapper.batchRemap({
		fromRange:[110, 114], 
		target:{channel:globals.channels.sfx, start:11}, 
	})
	mapper.apply(midi.tracks[0])

	return mapper.reportChanges(file)

}

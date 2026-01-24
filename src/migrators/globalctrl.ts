import type { MidiFile } from "midifile-ts";
import { globals } from '../globals.js';
import { Remapper } from '../utils/remapper.js';


export default async function (midi:MidiFile, file:string) {

	const mapper = new Remapper(8);

	mapper.remap(118, globals.channels.globals, 8); // tmp blackout
	mapper.remap(119, globals.channels.globals, 9); // all off / reset
	mapper.remap(120, globals.channels.globals, 0); // bpm
	mapper.apply(midi.tracks[0])

	return mapper.reportChanges(file)

}
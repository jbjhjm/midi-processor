import type { MidiFile } from "midifile-ts";
import { globals } from '../globals.js';
import { Remapper } from '../utils/remapper.js';


export default async function (midi:MidiFile, file:string) {

	const mapper = new Remapper(13);
	// positions 1
	mapper.batchRemap({
		fromRange:[76, 89], 
		target:{channel:globals.channels.jbmh, start:41}, 
	})
	mapper.apply(midi.tracks[0])

	// positions INV2
	mapper.reset()
	mapper.batchRemap({
		fromRange:[61,65], 
		target:{channel:globals.channels.jbmh, start:56}, 
	})
	mapper.apply(midi.tracks[0])

	// zoom
	mapper.reset()
	mapper.batchRemap({
		fromRange:[50, 52], 
		target:{channel:globals.channels.jbmh, start:63}, 
	})
	mapper.apply(midi.tracks[0])

	// zoom fx
	mapper.reset()
	mapper.batchRemap({
		fromRange:[11, 15], 
		target:{channel:globals.channels.jbmh, start:66}, 
	})
	mapper.apply(midi.tracks[0])

	// PT fx 1
	mapper.reset()
	mapper.batchRemap({
		fromRange:[16, 25], 
		target:{channel:globals.channels.jbmh, start:71}, 
	})
	mapper.apply(midi.tracks[0])

	// PT fx 2
	mapper.reset()
	mapper.batchRemap({
		fromRange:[31, 43], 
		target:{channel:globals.channels.jbmh, start:81}, 
	})
	mapper.apply(midi.tracks[0])
	
	return mapper.reportChanges(file)

}

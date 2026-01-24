import type { MidiFile } from "midifile-ts";
import { globals } from '../globals.js';
import { Remapper } from '../utils/remapper.js';

interface RemapState {
	count:number
}

export default async function (midi:MidiFile, file:string) {
	
	const mapperCh15 = new Remapper(15);
	mapperCh15.batchRemap({
		fromRange:[90, 93], 
		target:{channel:globals.channels.jbmh, start:100}, 
	})

	const mapperCh16 = new Remapper(16);
	mapperCh16.batchRemap({
		fromRange:[60, 71], 
		target:{channel:globals.channels.suns, start:61}, 
	})
	mapperCh16.batchRemap({
		fromRange:[72, 75], 
		target:{channel:globals.channels.mic, start:61}, 
	})

	mapperCh15.apply<RemapState>(midi.tracks[0])
	mapperCh16.apply<RemapState>(midi.tracks[0])

	return mapperCh15.reportChanges(file) || mapperCh16.reportChanges(file)

}

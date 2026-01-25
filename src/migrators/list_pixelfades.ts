import type { MidiFile } from "midifile-ts";
import { globals } from '../globals.js';
import { Remapper, RemappingHandlerFn } from '../utils/remapper.js';
import color from 'ansi-colors';

interface RemapState {
	count:number
}

export default async function (midi:MidiFile, file:string) {
	
	const mapperCh15 = new Remapper(15);
	// mic segments
	mapperCh15.batchRemap({
		fromRange:[90, 93], 
		target:{channel:-1, start:0}, 
	})

	// sun segments
	const mapperCh16 = new Remapper(16);
	mapperCh16.batchRemap({
		fromRange:[60, 75], 
		target:{channel:-1, start:0}, 
	})

	let state:RemapState = {count:0}
	state = mapperCh15.apply<RemapState>(midi.tracks[0], handler, state)
	state = mapperCh16.apply<RemapState>(midi.tracks[0], handler, state)

	if(state.count > 0) {
		process.stdout.write(color.green('Found '+state.count+' Pixel-Fadeouts triggers in '+file+'\n'))
	} else {
		process.stdout.write(color.grey('No Pixel-Fadeouts found in '+file+'\n'))
	}
	return false;

}

const handler:RemappingHandlerFn<any, RemapState> = (track,event,index,mapping,tools)=>{
	if(event.subtype==='noteOn') {
		const s = tools.state;
		s.count ++;
	}
}

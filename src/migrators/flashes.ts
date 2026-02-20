import type { AnyEvent, MidiFile, NoteOffEvent, NoteOnEvent } from "midifile-ts";
import { globals } from '../globals.js';
import { getDeltaTimeBetween, isMidiNote } from '../utils/midi.js';
import { Remapper, RemappingHandlerFn, RemappingHandlerTools } from '../utils/remapper.js';

type RemappingData = {white:boolean};
type RemappingState = {
	whites:Map<number,boolean> // index = channel number
};

export const priority = 3;
export default async function (midi:MidiFile, file:string) {

	const srcChannel = 15;
	const baseIndex = 16;
	
	// sun fadein
	const mapperSuns = new Remapper<RemappingData>(srcChannel);
	mapperSuns.remap(15	, globals.channels.suns, baseIndex+0, {white:false});
	mapperSuns.remap(16	, globals.channels.suns, baseIndex+1, {white:false});
	mapperSuns.remap(17	, globals.channels.suns, baseIndex+2, {white:false});
	mapperSuns.remap(18	, globals.channels.suns, baseIndex+3, {white:false});
	// sun flash
	mapperSuns.remap(75	, globals.channels.suns, baseIndex+4, {white:false});
	mapperSuns.remap(76	, globals.channels.suns, baseIndex+5, {white:false});
	mapperSuns.remap(77	, globals.channels.suns, baseIndex+6, {white:false});
	mapperSuns.remap(78	, globals.channels.suns, baseIndex+7, {white:false});
	// sun fadeout
	mapperSuns.remap(0	, globals.channels.suns, baseIndex+8, {white:false});
	mapperSuns.remap(1	, globals.channels.suns, baseIndex+9, {white:false});
	mapperSuns.remap(2	, globals.channels.suns, baseIndex+10,{white:false});
	mapperSuns.remap(3	, globals.channels.suns, baseIndex+11,{white:false});

	// mic fadein
	const mapperMic = new Remapper<RemappingData>(srcChannel);
	mapperMic.remap(19	, globals.channels.mic, baseIndex+0, {white:false});
	mapperMic.remap(24	, globals.channels.mic, baseIndex+0, {white:true});
	// mic flash
	mapperMic.remap(29	, globals.channels.mic, baseIndex+4, {white:false});
	mapperMic.remap(84	, globals.channels.mic, baseIndex+4, {white:true});
	// mic fadeout
	mapperMic.remap(4	, globals.channels.mic, baseIndex+8, {white:false});
	mapperMic.remap(9	, globals.channels.mic, baseIndex+8, {white:true});

	// jbmh fadein
	const mapperJbmh = new Remapper<RemappingData>(srcChannel);
	mapperJbmh.remap(20	, globals.channels.jbmh, baseIndex+0, {white:false});
	mapperJbmh.remap(21	, globals.channels.jbmh, baseIndex+1, {white:false});
	mapperJbmh.remap(22	, globals.channels.jbmh, baseIndex+2, {white:false});
	mapperJbmh.remap(23	, globals.channels.jbmh, baseIndex+3, {white:false});
	mapperJbmh.remap(25	, globals.channels.jbmh, baseIndex+0, {white:true});
	mapperJbmh.remap(26	, globals.channels.jbmh, baseIndex+1, {white:true});
	mapperJbmh.remap(27	, globals.channels.jbmh, baseIndex+2, {white:true});
	mapperJbmh.remap(28	, globals.channels.jbmh, baseIndex+3, {white:true});
	// jbmh flash
	mapperJbmh.remap(80	, globals.channels.jbmh, baseIndex+4, {white:false});
	mapperJbmh.remap(81	, globals.channels.jbmh, baseIndex+5, {white:false});
	mapperJbmh.remap(82	, globals.channels.jbmh, baseIndex+6, {white:false});
	mapperJbmh.remap(83	, globals.channels.jbmh, baseIndex+7, {white:false});
	mapperJbmh.remap(85	, globals.channels.jbmh, baseIndex+4, {white:true});
	mapperJbmh.remap(86	, globals.channels.jbmh, baseIndex+5, {white:true});
	mapperJbmh.remap(87	, globals.channels.jbmh, baseIndex+6, {white:true});
	mapperJbmh.remap(88	, globals.channels.jbmh, baseIndex+7, {white:true});
	// jbmh fadeout
	mapperJbmh.remap(5	, globals.channels.jbmh, baseIndex+8, {white:false});
	mapperJbmh.remap(6	, globals.channels.jbmh, baseIndex+9, {white:false});
	mapperJbmh.remap(7	, globals.channels.jbmh, baseIndex+10,{white:false});
	mapperJbmh.remap(8	, globals.channels.jbmh, baseIndex+11,{white:false});
	mapperJbmh.remap(10	, globals.channels.jbmh, baseIndex+8, {white:true});
	mapperJbmh.remap(11	, globals.channels.jbmh, baseIndex+9, {white:true});
	mapperJbmh.remap(12	, globals.channels.jbmh, baseIndex+10,{white:true});
	mapperJbmh.remap(13	, globals.channels.jbmh, baseIndex+11,{white:true});

	let state: RemappingState = {
		whites: new Map<number,boolean>()
	};
	state = mapperMic.apply<RemappingState>(midi, handler, state)
	state = mapperSuns.apply<RemappingState>(midi, handler, state)
	state = mapperJbmh.apply<RemappingState>(midi, handler, state)

	return mapperSuns.reportChanges(file)
		|| mapperMic.reportChanges(file)
		|| mapperJbmh.reportChanges(file)

}

const handler:RemappingHandlerFn<RemappingData, RemappingState> = (track,event,index,mapping,tools)=>{
	// const id = index(event.channel + 1, event.noteNumber);
	const [channel, note, data] = mapping;
	const whiteModeActive = tools.state.whites.get(channel) || false;
	const whiteModeEnable = data.white || false;

	// we ignore noteOff events and only trigger white mode on and off based on what is being triggered.
	// this allows for easy manual refinement later.
	if(event.subtype==='noteOn') {
		if(event !== track[index]) throw new Error('index mismatch!')
		const toggleOff = !whiteModeEnable;
		const mustToggleNow = whiteModeActive !== whiteModeEnable;
		if(toggleOff) {
			if(mustToggleNow) {
				tools.insertRelativeEvent( buildWhiteModeEvent(whiteModeEnable, channel), -1 )
				tools.state.whites.set(channel,false);
			}
		} else if(!toggleOff) {
			// this is a bit tricky. white mode should be toggled on or stay on ... but until when?
			// There may be a bunch of remapped events right next or on top of each other.
			// but it could also be that the next event happens minutes later.
			// or that the current event is the last remapped event in the track.
			// in such cases, we want to auto-end white mode.
			const autoOffAfterTicks = 4 * tools.getTicksPerBeat();
			let ticksToNextRemap = findTicksUntilNextRemappedEvent(track, index, tools) 
			
			// const noteLength = getDeltaTimeBetween(track, index, noteEnd.index) / tools.getTicksPerBeat();
			// console.log('mustToggleNow?',mustToggleNow,'beatsToNextRemap',ticksToNextRemap/ tools.getTicksPerBeat())


			if(mustToggleNow) {
				// off to on
				// some events are following in close range, white should be on but is not on yet.
				// next remapping is close, leave it to another note remapping call to toggle off white mode	
				tools.insertRelativeEvent( buildWhiteModeEvent(true, channel), -1 )
				tools.state.whites.set(channel,true);
			}

			// white enabled is being continued
			// if next note is far away, auto-end white mode
			// now that we know no remapped event is following in short time,
			// we need to find the noteOff event and recheck from there.
			if(ticksToNextRemap > autoOffAfterTicks) {
				const noteEnd = tools.findNoteEnd(event)
				if(!noteEnd) throw new Error('could not find note end ');
				const noteLength = getDeltaTimeBetween(track, index, noteEnd.index);

				// it could be that the distance of note END to next remapped Event is so close that no auto-off should happen!
				if(ticksToNextRemap - noteLength > autoOffAfterTicks) {
					// as the whitemode off note should be x beats after the note ends.
					const tickOffset = noteLength + autoOffAfterTicks
					
					// console.log('>>>> insert white mode auto-off, found note length is ',noteLength / tools.getTicksPerBeat(),
					// 'so insert the auto-off after beats: '+tickOffset/tools.getTicksPerBeat())
					// next use is far away, create an auto-off note
					tools.insertRelativeEvent( buildWhiteModeEvent(false, channel), tickOffset)
					// we know that the white mode will be off'd before the next remapped note so we can safely set it to false.
					tools.state.whites.set(channel,false); 
				}
			}
		}
	}

	// must be done last! findTicksUntilNextRemappedEvent relies on the original event data!
	tools.applyRegularRemapping();

}

// tricky thing: we cannot use the related noteEnd event reliably, because other remapped notes may be triggered parallely.
function findTicksUntilNextRemappedEvent(track:AnyEvent[], index:number, tools:RemappingHandlerTools<RemappingData, RemappingState>) {
	const nextRemappedEvent = tools.findEvent(e=>{
		if(!isMidiNote(e)) return false;
		if((e as NoteOnEvent).subtype!=='noteOn') return false;
		return tools.isMarked(e,'remapped');
	})
	if(nextRemappedEvent) {
		const ticksUntilToggle = getDeltaTimeBetween(track, index, nextRemappedEvent.index)
		// console.log('lookahead: next remapped note is '+(ticksUntilToggle/tools.getTicksPerBeat())+' beats away.',index,nextRemappedEvent)
		return ticksUntilToggle
	}
	// console.log('lookahead: nothing found')
	return 99999999 // there is no remapped event after the current.
}


function buildWhiteModeEvent(useWhiteMode: boolean, whiteModeChannel: number): NoteOnEvent|NoteOffEvent {
	// console.log('set white mode toggle to '+useWhiteMode+' after event')
	return {
		deltaTime: 0,
		type: 'channel',
		subtype: useWhiteMode ? 'noteOn' : 'noteOff',
		channel: whiteModeChannel - 1, // 0-15!
		noteNumber: 13,
		velocity: 127,
	};
}



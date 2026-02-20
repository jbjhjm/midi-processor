import color from 'ansi-colors';
import type { AnyEvent, MidiFile, NoteOffEvent, NoteOnEvent } from "midifile-ts";
import { globals } from '../globals.js';
import { Remapper, RemappingHandlerFn } from '../utils/remapper.js';

type RemappingData = {white?:boolean, mult:number};
type RemappingState = {
	whiteActive:boolean;
	multiplier:number;
	whiteModeChannel:number;
}

const defaultState:RemappingState = {whiteActive:false, multiplier:4, whiteModeChannel:null}

export default async function (midi:MidiFile, file:string) {
	const ch = globals.channels;

	// whiteModeChannel = globals.channels.suns
	const remapSuns = new Remapper<RemappingData>(15);
	remapSuns.remap(30, ch.suns, 28, {mult:12})
	remapSuns.remap(31, ch.suns, 29, {mult:12})
	remapSuns.remap(32, ch.suns, 30, {mult:12})
	remapSuns.remap(33, ch.suns, 31, {mult:12})
	remapSuns.remap(45, ch.suns, 28, {mult:16})
	remapSuns.remap(46, ch.suns, 29, {mult:16})
	remapSuns.remap(47, ch.suns, 30, {mult:16})
	remapSuns.remap(48, ch.suns, 31, {mult:16})
	remapSuns.remap(60, ch.suns, 28, {mult:24})
	remapSuns.remap(61, ch.suns, 29, {mult:24})
	remapSuns.remap(62, ch.suns, 30, {mult:24})
	remapSuns.remap(63, ch.suns, 31, {mult:24})
	
	// whiteModeChannel = globals.channels.mic
	const remapMic = new Remapper<RemappingData>(15);
	remapMic.remap(34, ch.mic, 28, {mult:12})
	remapMic.remap(39, ch.mic, 28, {mult:12,white:true}) 
	remapMic.remap(49, ch.mic, 28, {mult:16})
	remapMic.remap(54, ch.mic, 28, {mult:16,white:true})
	remapMic.remap(64, ch.mic, 28, {mult:24})
	remapMic.remap(69, ch.mic, 28, {mult:24,white:true})

	// whiteModeChannel = globals.channels.jbmh
	const remapJBMH = new Remapper<RemappingData>(15);
	remapJBMH.remap(35, ch.jbmh, 28, {mult:12})
	remapJBMH.remap(36, ch.jbmh, 29, {mult:12})
	remapJBMH.remap(37, ch.jbmh, 30, {mult:12})
	remapJBMH.remap(38, ch.jbmh, 31, {mult:12})
	remapJBMH.remap(40, ch.jbmh, 28, {mult:12,white:true})
	remapJBMH.remap(41, ch.jbmh, 29, {mult:12,white:true})
	remapJBMH.remap(42, ch.jbmh, 30, {mult:12,white:true})
	remapJBMH.remap(43, ch.jbmh, 31, {mult:12,white:true})
	remapJBMH.remap(50, ch.jbmh, 28, {mult:16})
	remapJBMH.remap(51, ch.jbmh, 29, {mult:16})
	remapJBMH.remap(52, ch.jbmh, 30, {mult:16})
	remapJBMH.remap(53, ch.jbmh, 31, {mult:16})
	remapJBMH.remap(55, ch.jbmh, 28, {mult:16,white:true})
	remapJBMH.remap(56, ch.jbmh, 29, {mult:16,white:true})
	remapJBMH.remap(57, ch.jbmh, 30, {mult:16,white:true})
	remapJBMH.remap(58, ch.jbmh, 31, {mult:16,white:true})
	remapJBMH.remap(65, ch.jbmh, 28, {mult:24})
	remapJBMH.remap(66, ch.jbmh, 29, {mult:24})
	remapJBMH.remap(67, ch.jbmh, 30, {mult:24})
	remapJBMH.remap(68, ch.jbmh, 31, {mult:24})
	remapJBMH.remap(70, ch.jbmh, 28, {mult:24,white:true})
	remapJBMH.remap(71, ch.jbmh, 29, {mult:24,white:true})
	remapJBMH.remap(72, ch.jbmh, 30, {mult:24,white:true})
	remapJBMH.remap(73, ch.jbmh, 31, {mult:24,white:true})
	
	const track = midi.tracks[0];
	let state;

	state = remapSuns.apply<RemappingState>(track, handler, {...defaultState, whiteModeChannel:ch.suns})
	finalize(state, track)

	state = remapMic.apply<RemappingState>(track, handler, {...defaultState, whiteModeChannel:ch.mic})
	finalize(state, track)

	state = remapJBMH.apply<RemappingState>(track, handler, {...defaultState, whiteModeChannel:ch.jbmh})
	finalize(state, track)

	return remapSuns.reportChanges(file) || remapMic.reportChanges(file) || remapJBMH.reportChanges(file)

}

const handler:RemappingHandlerFn<RemappingData, RemappingState> = (track,event,index,mapping,tools) => {
	let changes = [];
	const s = tools.state;
	const config = mapping[2]
	// console.log('handler called with state', s)
	tools.applyRegularRemapping()
	// we ignore noteOff events and only trigger white mode on and off based on what is being triggered.
	// this allows for easy manual refinement later.
	if(event.subtype==='noteOn') {
		const useWhiteMode = config.white||false;
		const useMultiplier = config.mult;
		if(s.whiteActive !== useWhiteMode) {
			// console.log('inserting a white toggle 50 ticks before current event')
			const event = buildWhiteModeEvent(useWhiteMode, s.whiteModeChannel);
			tools.insertRelativeNoteWithLength(event, -50, 900)
			s.whiteActive = useWhiteMode;
		}
		if(s.multiplier !== useMultiplier) {
			// console.log('inserting a multiplier 50 ticks before current event')
			const event = buildStrobeSpeedEvent(useMultiplier);
			tools.insertRelativeNoteWithLength(event, -50, 900)
			s.multiplier = useMultiplier;
		}
	}
			
}

const finalize = (state:RemappingState, track:AnyEvent[]) => {
	// TODO: white mode is a toggle. no need to insert an off event. can we skip this?
	// if(state.whiteActive) {
	// 	track.push(buildWhiteModeEvent(false, state.whiteModeChannel));
	// }
}

function buildWhiteModeEvent(useWhiteMode: boolean, whiteModeChannel: number): NoteOnEvent {
	// console.log('set white mode toggle to '+useWhiteMode+' after event')
	return {
		deltaTime: 0,
		type: 'channel',
		subtype: 'noteOn',
		channel: whiteModeChannel - 1, // 0-15!
		noteNumber: useWhiteMode ? 15 : 14,
		velocity: 127,
	};
}

function buildStrobeSpeedEvent(multiplier:number): NoteOnEvent {
	// console.log('set white mode toggle to '+useWhiteMode+' after event')
	return {
		deltaTime: 0,
		type: 'channel',
		subtype: 'noteOn',
		channel: 2 - 1, // 0-15!
		noteNumber: 5,
		velocity: multiplier,
	};
}

import type { AnyEvent, MidiFile } from "midifile-ts";
import { insertMidiEvent } from '../utils/midi.js';
import { Remapper, RemappingHandlerFn } from '../utils/remapper.js';

type RemappingData = {page:number};

export default async function (midi:MidiFile, file:string) {
	const targetChannel = 1;
	const mapper = new Remapper<RemappingData>(1);

	// main cue triggers with page mapping attached
	mapper.remap(4	, targetChannel, 11, {page:35});	//MAS Main
	mapper.remap(11	, targetChannel, 11, {page:36});	//2k Main
	mapper.remap(12	, targetChannel, 12, {page:36});	//2k Short Main
	mapper.remap(17	, targetChannel, 11, {page:37});	//Digivoo Main
	mapper.remap(24	, targetChannel, 11, {page:38});	//MOL Main
	mapper.remap(29	, targetChannel, 11, {page:39});	//ISYS Main
	mapper.remap(35	, targetChannel, 11, {page:40});	//Proto Main
	mapper.remap(43	, targetChannel, 11, {page:41});	//Bastard Main
	mapper.remap(50	, targetChannel, 11, {page:42});	//Voices Main
	mapper.remap(57	, targetChannel, 11, {page:43});	//Obs Main
	mapper.remap(58	, targetChannel, 12, {page:43});	//Obs Short Main
	mapper.remap(65	, targetChannel, 11, {page:24});	//UponReq Main
	mapper.remap(72	, targetChannel, 11, {page:25});	//Echoes Main
	mapper.remap(79	, targetChannel, 11, {page:26});	//Burning Main
	mapper.remap(88	, targetChannel, 11, {page:27});	//Incompetence Main
	mapper.remap(95	, targetChannel, 11, {page:28});	//Wrong Way Main
	mapper.remap(105, targetChannel, 11, {page:30});	//Enemy No1 Main
	mapper.remap(111, targetChannel, 11, {page:33});	//CMP Main
	mapper.remap(118, targetChannel, 11, {page:34});	//Exhale Main
	mapper.remap(120, targetChannel, 11, {page:31});	//Warp Main
	
	// secondary execs
	mapper.remap(5	, targetChannel, 12, {page:35});	//MAS 1 Flash Blau
	mapper.remap(6	, targetChannel, 13, {page:35});	//MAS 2 SS3
	mapper.remap(7	, targetChannel, 14, {page:35});	//MAS 3 Sequ
	mapper.remap(13	, targetChannel, 13, {page:36});	//2k 1 Full Flash
	mapper.remap(18	, targetChannel, 12, {page:37});	//Digivoo 1 Flash Green
	mapper.remap(19	, targetChannel, 13, {page:37});	//Digivoo 2 Flash Orange
	mapper.remap(36	, targetChannel, 12, {page:40});	//Proto 1 Slow Flash
	mapper.remap(44	, targetChannel, 12, {page:41});	//Bastard 1 Intro Stepper
	mapper.remap(45	, targetChannel, 13, {page:41});	//Bastard 2 Intro Alarm
	mapper.remap(51	, targetChannel, 12, {page:42});	//Voices 1 JBMH Blue
	mapper.remap(66	, targetChannel, 12, {page:24});	//UponReq 1 Mic Slow
	mapper.remap(67	, targetChannel, 13, {page:24});	//UponReq 2 Strobe
	mapper.remap(73	, targetChannel, 12, {page:25});	//Echoes 1 JB RGB Chase
	mapper.remap(74	, targetChannel, 13, {page:25});	//Echoes 2 SS Slow Chase
	mapper.remap(75	, targetChannel, 14, {page:25});	//Echoes 3 UV Flash
	mapper.remap(76	, targetChannel, 15, {page:25});	//Echoes 4 Mic RNDM
	mapper.remap(80	, targetChannel, 12, {page:26});	//Burning 1 Orange
	mapper.remap(81	, targetChannel, 13, {page:26});	//Burning 2 SS Chase
	mapper.remap(82	, targetChannel, 14, {page:26});	//Burning 3 White Beam
	mapper.remap(89	, targetChannel, 12, {page:27});	//Incompetence 1 JB Slow Flash
	mapper.remap(96	, targetChannel, 12, {page:28});	//Wrong Way 1 SS RNDM
	mapper.remap(97	, targetChannel, 13, {page:28});	//Wrong Way 2 JB Phase
	mapper.remap(98	, targetChannel, 14, {page:28});	//Wrong Way 3 SS Strobe
	mapper.remap(99	, targetChannel, 15, {page:28});	//Wrong Way 4 Flash Red
	mapper.remap(114, targetChannel, 14, {page:33});	//CMP1 JB vio chase
	mapper.remap(116, targetChannel, 16, {page:33});	//CMP2 stepper
	mapper.remap(121, targetChannel, 12, {page:31});	//Warp 1 JBJ Slow
	mapper.remap(122, targetChannel, 13, {page:31});	//Warp 2 JBH Slow

	// from channel 2
	const mapperCh2 = new Remapper<RemappingData>(2);
	mapperCh2.remap(0, targetChannel, 11, {page:32});	//Fake Main
	mapperCh2.remap(1, targetChannel, 12, {page:32});	//Fake 1 rndm blue
	mapperCh2.remap(2, targetChannel, 13, {page:32});	//Fake 2 ss slow
	mapperCh2.remap(3, targetChannel, 14, {page:32});	//Fake 3 ss rndm (von wrong way)

	function buildPageTriggerEvent(pageNoteNumber: number): AnyEvent {
		return {
			deltaTime: 0,
			type: 'channel',
			subtype: 'noteOn' ,
			channel: 1-1, // 0-15!
			noteNumber: pageNoteNumber,
			velocity: 127,
		};
	}
	
	const track = midi.tracks[0];
	let pageSelectionEvent = null;
	let currentTrackIndex:number;
	
	const handler:RemappingHandlerFn<RemappingData> = (event,index,mapping,tools)=>{
		const [channel, note, config] = mapping;
		const pageTrigger = config?.page;
		tools.applyRegularRemapping();
		currentTrackIndex = index;
		// we ignore noteOff events and only trigger white mode on and off based on what is being triggered.
		// this allows for easy manual refinement later.
		if(pageTrigger && !pageSelectionEvent && event.subtype==='noteOn') {
			pageSelectionEvent = buildPageTriggerEvent(pageTrigger);
			insertMidiEvent(track, pageSelectionEvent, index, -900)
			tools.addChange(pageSelectionEvent)
		}
	}

	mapper.apply(track, handler)
	mapperCh2.apply(track, handler)

	// insert end of page trigger
	if(pageSelectionEvent) {
		const endEvent = { ...pageSelectionEvent, subtype:'noteOff' };
		insertMidiEvent(track, endEvent, currentTrackIndex, 0)
	}

	return mapper.reportChanges(file) || mapperCh2.reportChanges(file)
}

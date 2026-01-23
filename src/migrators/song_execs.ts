import color from 'ansi-colors';
import type { AnyEvent, MidiFile, NoteOffEvent, NoteOnEvent } from "midifile-ts";
import { channelNoteIndex as index } from '../utils/matchers.js';
import { insertMidiEvent, isMidiNote } from '../utils/midi.js';

const allowedChannels = [1].map(v=>v-1); // WARNING: 0-15 !!!
type RemappingEntry = [number, number, {page:number}?];

export default async function (midi:MidiFile, file:string) {
	const track = midi.tracks[0];
	const changes:AnyEvent[] = [];
	changes.push(...applyRemapping(track, remaps));
	if(changes.length > 0) {
		process.stdout.write(color.green('Updated '+changes.length/2+' MIDI notes in file '+file+'\n'))
		return true;
	} else {
		process.stdout.write(color.gray('No changes in file '+file+'\n'))
		return false;
	}
}

function applyRemapping(track: AnyEvent[], remappings:Map<number, RemappingEntry>) {
	let changes = [];

	let indexOfLastRemap = track.length-1;
	for(let x=track.length-1; x>0; x--) {
		if(isRemappedEvent(track[x], remappings)) {
			indexOfLastRemap = x;
			break;
		}
	}

	// replace events
	let i = 0;
	let pageSelectionEvent = null;
	while(i < track.length) {
		const event = track[i];
		if(isRemappedEvent(event, remappings)) {
			const id = index(event.channel + 1, event.noteNumber);
			const [channel, note, config] = remappings.get(id);
			const pageTrigger = config?.page;
			const isPrimary = !!pageTrigger;
			event.channel = channel - 1;
			event.noteNumber = note;
			changes.push(event);
			// we ignore noteOff events and only trigger white mode on and off based on what is being triggered.
			// this allows for easy manual refinement later.
			if(pageTrigger && !pageSelectionEvent && event.subtype==='noteOn') {
				pageSelectionEvent = buildPageTriggerEvent(pageTrigger);
				insertMidiEvent(track, pageSelectionEvent, i, -900)
			}
		}
		i++;
	}
	if(pageSelectionEvent) {
		const endEvent = { ...pageSelectionEvent, subtype:'noteOff' };
		insertMidiEvent(track, endEvent, indexOfLastRemap, 0)
	}

	return changes;
}

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

function isRemappedEvent(event:AnyEvent, remappings:Map<number, RemappingEntry>): event is NoteOnEvent|NoteOffEvent {
	if(!isMidiNote(event)) return false;
	if(!allowedChannels.includes(event.channel)) return false;
	const id = index(event.channel+1, event.noteNumber);
	return remappings.has(id)
}


const remaps = new Map<number, RemappingEntry>()
let targetChannel = 1

// main cue triggers with page mapping attached
remaps.set(index(1, 4	), [targetChannel,11,{page:35}]);	//MAS Main
remaps.set(index(1, 11	), [targetChannel,11,{page:36}]);	//2k Main
remaps.set(index(1, 12	), [targetChannel,12,{page:36}]);	//2k Short Main
remaps.set(index(1, 17	), [targetChannel,11,{page:37}]);	//Digivoo Main
remaps.set(index(1, 24	), [targetChannel,11,{page:38}]);	//MOL Main
remaps.set(index(1, 29	), [targetChannel,11,{page:39}]);	//ISYS Main
remaps.set(index(1, 35	), [targetChannel,11,{page:40}]);	//Proto Main
remaps.set(index(1, 43	), [targetChannel,11,{page:41}]);	//Bastard Main
remaps.set(index(1, 50	), [targetChannel,11,{page:42}]);	//Voices Main
remaps.set(index(1, 57	), [targetChannel,11,{page:43}]);	//Obs Main
remaps.set(index(1, 58	), [targetChannel,12,{page:43}]);	//Obs Short Main
remaps.set(index(1, 65	), [targetChannel,11,{page:24}]);	//UponReq Main
remaps.set(index(1, 72	), [targetChannel,11,{page:25}]);	//Echoes Main
remaps.set(index(1, 79	), [targetChannel,11,{page:26}]);	//Burning Main
remaps.set(index(1, 88	), [targetChannel,11,{page:27}]);	//Incompetence Main
remaps.set(index(1, 95	), [targetChannel,11,{page:28}]);	//Wrong Way Main
remaps.set(index(1, 105	), [targetChannel,11,{page:30}]);	//Enemy No1 Main
remaps.set(index(1, 111	), [targetChannel,11,{page:33}]);	//CMP Main
remaps.set(index(1, 118	), [targetChannel,11,{page:34}]);	//Exhale Main
remaps.set(index(1, 120	), [targetChannel,11,{page:31}]);	//Warp Main
remaps.set(index(2, 0	), [targetChannel,11,{page:32}]);	//Fake Main

// secondary fx
remaps.set(index(1,	5	), [targetChannel, 12,{page:35}]);		//MAS 1 Flash Blau
remaps.set(index(1,	6	), [targetChannel, 13,{page:35}]);		//MAS 2 SS3
remaps.set(index(1,	7	), [targetChannel, 14,{page:35}]);		//MAS 3 Sequ
remaps.set(index(1,	13	), [targetChannel, 13,{page:36}]);		//2k 1 Full Flash
remaps.set(index(1,	18	), [targetChannel, 12,{page:37}]);		//Digivoo 1 Flash Green
remaps.set(index(1,	19	), [targetChannel, 13,{page:37}]);		//Digivoo 2 Flash Orange
// secondaryExecs.set(index(1,	25	), [targetChannel, 12]);		// unknown
remaps.set(index(1,	36	), [targetChannel, 12,{page:40}]);		//Proto 1 Slow Flash
// secondaryExecs.set(index(1,	39	), [targetChannel, 12]);		// ???
remaps.set(index(1,	44	), [targetChannel, 12,{page:41}]);		//Bastard 1 Intro Stepper
remaps.set(index(1,	45	), [targetChannel, 13,{page:41}]);		//Bastard 2 Intro Alarm
remaps.set(index(1,	51	), [targetChannel, 12,{page:42}]);		//Voices 1 JBMH Blue
remaps.set(index(1,	66	), [targetChannel, 12,{page:24}]);		//UponReq 1 Mic Slow
remaps.set(index(1,	67	), [targetChannel, 13,{page:24}]);		//UponReq 2 Strobe
remaps.set(index(1,	73	), [targetChannel, 12,{page:25}]);		//Echoes 1 JB RGB Chase
remaps.set(index(1,	74	), [targetChannel, 13,{page:25}]);		//Echoes 2 SS Slow Chase
remaps.set(index(1,	75	), [targetChannel, 14,{page:25}]);		//Echoes 3 UV Flash
remaps.set(index(1,	76	), [targetChannel, 15,{page:25}]);		//Echoes 4 Mic RNDM
remaps.set(index(1,	80	), [targetChannel, 12,{page:26}]);		//Burning 1 Orange
remaps.set(index(1,	81	), [targetChannel, 13,{page:26}]);		//Burning 2 SS Chase
remaps.set(index(1,	82	), [targetChannel, 14,{page:26}]);		//Burning 3 White Beam
remaps.set(index(1,	89	), [targetChannel, 12,{page:27}]);		//Incompetence 1 JB Slow Flash
remaps.set(index(1,	96	), [targetChannel, 12,{page:28}]);		//Wrong Way 1 SS RNDM
remaps.set(index(1,	97	), [targetChannel, 13,{page:28}]);		//Wrong Way 2 JB Phase
remaps.set(index(1,	98	), [targetChannel, 14,{page:28}]);		//Wrong Way 3 SS Strobe
remaps.set(index(1,	99	), [targetChannel, 15,{page:28}]);		//Wrong Way 4 Flash Red
remaps.set(index(1,	114	), [targetChannel, 14,{page:33}]);		//CMP1 JB vio chase
remaps.set(index(1,	116	), [targetChannel, 16,{page:33}]);		//CMP2 stepper
remaps.set(index(1,	121	), [targetChannel, 12,{page:31}]);		//Warp 1 JBJ Slow
remaps.set(index(1,	122	), [targetChannel, 13,{page:31}]);		//Warp 2 JBH Slow
remaps.set(index(2,	1	), [targetChannel, 12,{page:32}]);		//Fake 1 rndm blue
remaps.set(index(2,	2	), [targetChannel, 13,{page:32}]);		//Fake 2 ss slow
remaps.set(index(2,	3	), [targetChannel, 14,{page:32}]);		//Fake 3 ss rndm (von wrong way)
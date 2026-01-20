import { AnyEvent, MidiFile, NoteOffEvent, NoteOnEvent } from 'midifile-ts';
import { HandlerStructure } from './interfaces.js';
import { Handlers } from './handler.js';


export default async function(midiData:MidiFile) {
	const track = midiData.tracks[0];

	for(var i=0; i<track.length; i++) {
		const event = track[i];

		if(event['subtype'] === 'noteOn' || event['subtype'] === 'noteOff') {
			if(Handlers[event.channel]?.['note']) {
				track[i] = Handlers[event.channel]['note'](event)
			}
		}
		else if(event['subtype'] === 'controller') {
			if(Handlers[event.channel]?.['cc']) {
				track[i] = Handlers[event.channel]['cc'](event)
			}
		}
		else if(event['subtype'] === 'programChange') {
			if(Handlers[event.channel]?.['pc']) {
				track[i] = Handlers[event.channel]['pc'](event)
			}
		}
	}

	return track;
}
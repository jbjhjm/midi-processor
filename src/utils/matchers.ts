import type { AnyEvent, MidiFile, NoteOffEvent, NoteOnEvent } from "midifile-ts";

export function inRange(val, min, max) {
	return val >= min && val <= max
}

export function isMidiNote(event:AnyEvent): event is NoteOnEvent|NoteOffEvent {
	if(event.type!=='channel') return false;
	if(event.subtype==='noteOn' || event.subtype==='noteOff') return true;
	return false;
}

// WARNING: channel must be 1-16!!
export function channelNoteIndex(channel:number, note:number) {
	return (channel << 8) + note
}
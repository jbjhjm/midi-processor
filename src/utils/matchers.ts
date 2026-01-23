import type { AnyEvent, MidiFile, NoteOffEvent, NoteOnEvent } from "midifile-ts";

export function inRange(val, min, max) {
	return val >= min && val <= max
}

// WARNING: channel must be 1-16!!
export function channelNoteIndex(channel:number, note:number) {
	return (channel << 8) + note
}


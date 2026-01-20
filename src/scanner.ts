import { Command } from 'commander';
import * as fs from 'fs/promises';
import * as path from 'path';
import type { AnyEvent, MidiFile, NoteOffEvent, NoteOnEvent } from "midifile-ts";
import { input } from '@inquirer/prompts';
import { glob, globSync, globStream, globStreamSync, Glob } from 'glob';
// const color = require('ansi-colors');
import color from 'ansi-colors';
const midi = await import("midifile-ts");
const program = new Command();

interface Settings {
	save:boolean,
	overwrite:boolean,
}

const defaults = {
	path:'F:\\Sector Live\\Projects\\Audio\\recorded'
}

const customPath = await input({ message: 'This utility searches for Midi Note-On events within a directory. \n'
											+'Enter path or press ENTER (default: '+defaults.path+')' });
const globMatcher = await input({ message: 'You can customize the glob matcher to use.', default:'**/*GrandMA.mid' });
const midiChannel = await input({ message: 'Enter midi channel (1-16) to scan or x-y to search a range of channels' });
const midiNotes = await input({ message: 'Enter midi note number (0-127) to scan or x-y to search a range of notes' });

const filepath = path.normalize(customPath || defaults.path);
const midiChannelParsed = midiChannel.split('-').map(val=>parseInt(val,10));
const multiChannelMatcher = midiChannelParsed.length > 1;
const midiNotesParsed = midiNotes.split('-').map(val=>parseInt(val,10));
const multiNoteMatcher = midiNotesParsed.length > 1;

if(!filepath) {
	console.error('no filepath given!');
	process.exit();
}
const pathInfo = await fs.lstat(filepath);

if(pathInfo.isFile()) {
	await processFile(filepath);
} else {
	const matches = await glob(globMatcher, {cwd:filepath})

	const filesWithMatchingMidi = [];
	const filesWithoutMatchingMidi = [];

	for (const fileName of matches) {
		const fullPath = path.join(filepath, fileName);
		try {
			const hasMatches = await processFile(fullPath);
			(hasMatches ? filesWithMatchingMidi : filesWithoutMatchingMidi).push(fullPath)
		} catch(err) {
			console.error('failed to process file', err)
		}
	}

	process.stdout.write(color.green("Files without matches: \n"+filesWithoutMatchingMidi.join("\n")));
	process.stdout.write(color.red("\n\nFiles with matches: \n"+filesWithMatchingMidi.join("\n")));
	process.stdout.write(color.green("\n\nSearched for: Note(s) "+midiNotesParsed.join(' - ')+" in channel(s) "+midiChannelParsed.join(' - ')+"\n"));
}


async function processFile(filePath:string) {
	console.log('Begin to process file '+filePath)
	const buffer = await fs.readFile(filePath)
	const midiData:MidiFile = await midi.read(buffer)
	const track = midiData.tracks[0];
	const hasMatches = track.some(entry=>{
		if(entry.type !== "channel") return false;
		if(entry.subtype !== "noteOn") return false;
		if(!matchesChannel(entry)) return false;
		if(!matchesNote(entry)) return false;
		return true;
	})

	return hasMatches;

}

function matchesChannel(entry:NoteOnEvent|NoteOffEvent) {
	if(multiChannelMatcher) {
		return entry.channel >= midiChannelParsed[0]-1
			&& entry.channel <= midiChannelParsed[1]-1
	} else {
		return entry.channel === midiChannelParsed[0]-1
	}
}

function matchesNote(entry:NoteOnEvent|NoteOffEvent) {
	if(multiNoteMatcher) {
		return entry.noteNumber >= midiNotesParsed[0]
			&& entry.noteNumber <= midiNotesParsed[1]
	} else {
		return entry.noteNumber === midiNotesParsed[0]
	}
}


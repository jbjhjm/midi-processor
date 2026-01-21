import { input } from '@inquirer/prompts';
import * as fs from 'fs/promises';
import type { MidiFile, NoteOffEvent, NoteOnEvent } from "midifile-ts";
import * as path from 'path';
// const color = require('ansi-colors');
import color from 'ansi-colors';
import { collectFiles, sanitizeFilePath } from './utils/files.js';
import { inRange, isMidiNote } from './utils/matchers.js';
const midi = await import("midifile-ts");

interface Settings {
	save:boolean,
	overwrite:boolean,
}

const defaults = {
	path:'F:\\Sector Live\\Projects\\Audio\\recorded'
}

const inputPath = sanitizeFilePath(await input({ message: 'This utility searches for Midi events within a directory. \n'
											+'Enter custom path or press ENTER', default:defaults.path }));
const globMatcher = await input({ message: 'You can customize the glob matcher to use.', default:'**/*GrandMA.mid' });
const midiChannel = await input({ message: 'Enter midi channel (1-16) to scan or x-y to search a range of channels' });
const midiNotes = await input({ message: 'Enter midi note number (0-127) to scan or x-y to search a range of notes' });

const midiChannelParsed = midiChannel.split('-').map(val=>parseInt(val,10));
const multiChannelMatcher = midiChannelParsed.length > 1;
const midiNotesParsed = midiNotes.split('-').map(val=>parseInt(val,10));
const multiNoteMatcher = midiNotesParsed.length > 1;

const filesWithMatchingMidi = [];
const filesWithoutMatchingMidi = [];

for (const fileName of await collectFiles(inputPath, globMatcher)) {
	const fullPath = path.join(inputPath, fileName);
	try {
		const hasMatches = await (async function processFile(filePath:string) {
			// console.log('Begin to process file '+filePath)
			const buffer = await fs.readFile(filePath)
			const midiData:MidiFile = await midi.read(buffer)
			const track = midiData.tracks[0];
			const hasMatches = track.some(entry=>{
				if(!isMidiNote(entry)) return false;
				if(!matchesChannel(entry)) return false;
				if(!matchesNote(entry)) return false;
				return true;
			})
			return hasMatches;
		})(fullPath);

		(hasMatches ? filesWithMatchingMidi : filesWithoutMatchingMidi).push(fullPath)
	} catch(err) {
		console.error('failed to process file', err)
	}
}

process.stdout.write(color.green("\n\nFiles without matches: \n"+filesWithoutMatchingMidi.join("\n")));
process.stdout.write(color.red("\n\nFiles with matches: \n"+filesWithMatchingMidi.join("\n")));
process.stdout.write(color.green("\n\nSearched for: Note(s) "+midiNotesParsed.join(' - ')+" in channel(s) "+midiChannelParsed.join(' - ')+"\n"));

function matchesChannel(entry:NoteOnEvent|NoteOffEvent) {
	if(multiChannelMatcher) {
		return inRange(entry.channel, midiChannelParsed[0]-1, midiChannelParsed[1]-1)
	} else {
		return entry.channel === midiChannelParsed[0]-1
	}
}

function matchesNote(entry:NoteOnEvent|NoteOffEvent) {
	if(multiNoteMatcher) {
		return inRange(entry.noteNumber, midiNotesParsed[0], midiNotesParsed[1])
	} else {
		return entry.noteNumber === midiNotesParsed[0]
	}
}


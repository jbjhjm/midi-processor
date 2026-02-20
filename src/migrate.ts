import { checkbox, input, select } from '@inquirer/prompts';
import * as fs from 'fs/promises';
import { glob } from 'glob';
import type { MidiFile } from "midifile-ts";
import * as path from 'path';
import color from 'ansi-colors';
import { collectFiles, fileExists, sanitizeFilePath, writeFile } from './utils/files.js';
import { globals } from './globals.js';

/**
 * executes a selected midi migrator against matched midi files
 */

const midi = await import("midifile-ts");


const migrators = await glob('migrators/*.ts', {cwd:path.join(process.cwd(),'src')})
const migratorSelection = await checkbox<string>({ message:'Select which migration to execute', choices:migrators, shortcuts:{all:'a'} })

const migratorFns = await Promise.all(migratorSelection.map(async file => {
	const importPath = './'+path.normalize(file.substring(0, file.length - 3)).replaceAll(/\\/g, '/');
	const mod = await import(importPath);
	return {
		fn:mod.default,
		priority:mod.priority || 0,
	}
}))
migratorFns.sort((a,b)=>b.priority-a.priority)

const fromBackup = await input({ message: 'Use backup data? (y/n)', default:'y' });
const applyChanges = await input({ message: 'Apply changes? (y/n)', default:'y' });

const inputPath = sanitizeFilePath(await input({ message: 'This utility searches for Midi events within a directory. \n'
											+'Enter custom path or press ENTER', default:globals.path }));
const globMatcher = await input({ message: 'You can customize the glob matcher to use.', default:globals.glob });

for (const fileName of await collectFiles(inputPath, globMatcher)) {
	if(fileName.startsWith('alt')) {
		process.stdout.write(color.gray('ignoring "alt" file '+fileName+'\n'))
		continue;
	}
	try {
		await processFile(fileName);
	} catch(err) {
		process.stdout.write(color.red('failed to process file '+fileName+'\n'))
		console.error(err)
	}
}

async function processFile(relPath:string) {
	const fullPath = path.join(inputPath, relPath);
	let buffer:Buffer;
	if(fromBackup==='y') {
		const backupPath = fullPath + '.bak';
		if(await fileExists(backupPath)) {
			buffer = await fs.readFile(backupPath)
		}
	}
	if(!buffer) {
		buffer = await fs.readFile(fullPath)
	} 

	const midiData:MidiFile = await midi.read(buffer);

	if(midiData.tracks.length > 1) throw new Error('Multiple Tracks discovered, this is not supported!')

	let modified = false;
	for(const entry of migratorFns) {	
		const hasChanges = await entry.fn(midiData, relPath);
		if(hasChanges) modified = true;
	}
	if(!modified) return;

	// const diff = midiData.tracks.length - initialLength;
	// console.log(diff+' MIDI events have been added.')

	if(applyChanges==='y') {
		const fileBuffer = await midi.write(midiData.tracks, midiData.header.ticksPerBeat);
		await writeFile(fileBuffer, fullPath, true)
	} else {
		console.log('(dry run) not saving to '+relPath)
	}

}

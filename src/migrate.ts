import { input, select } from '@inquirer/prompts';
import * as fs from 'fs/promises';
import { glob } from 'glob';
import type { MidiFile } from "midifile-ts";
import * as path from 'path';
import color from 'ansi-colors';
import { collectFiles, sanitizeFilePath } from './utils/files.js';
import { globals } from './globals.js';

/**
 * executes a selected midi migrator against matched midi files
 */

const midi = await import("midifile-ts");


const migrators = await glob('migrators/*.ts', {cwd:path.join(process.cwd(),'src')})
const migratorSelection = await select({ message:'Select which migration to execute', choices:migrators })
const importPath = './'+path.normalize(migratorSelection.substring(0, migratorSelection.length - 3)).replaceAll(/\\/g, '/');
console.log('try to import '+importPath)
const migratorFn = await import(importPath).then(m=>m.default)

const applyChanges = await input({ message: 'Apply changes? (y/n)' });
const inputPath = sanitizeFilePath(await input({ message: 'This utility searches for Midi events within a directory. \n'
											+'Enter custom path or press ENTER', default:globals.path }));
const globMatcher = await input({ message: 'You can customize the glob matcher to use.', default:globals.glob });

for (const fileName of await collectFiles(inputPath, globMatcher)) {
	try {
		await processFile(fileName);
	} catch(err) {
		console.error('failed to process file', err)
	}
}

async function processFile(relPath:string) {
		console.log('processFile start '+relPath)
	const fullPath = path.join(inputPath, relPath);
	const buffer = await fs.readFile(fullPath)
	const midiData:MidiFile = await midi.read(buffer);

	if(midiData.tracks.length > 1) throw new Error('Multiple Tracks discovered, this is not supported!')
	const modified = await migratorFn(midiData, relPath);

	if(!modified) return;

	if(applyChanges==='y') {
		const fileBuffer = await midi.write(midiData.tracks, midiData.header.ticksPerBeat);
		await fs.writeFile(fullPath, new Uint8Array(fileBuffer));
		console.log('Saving changes to file '+relPath)
	} else {
		console.log('(dry run) not saving to '+relPath)
	}

}

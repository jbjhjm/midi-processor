import { input, select } from '@inquirer/prompts';
import * as fs from 'fs/promises';
import { glob } from 'glob';
import type { MidiFile } from "midifile-ts";
import * as path from 'path';
import color from 'ansi-colors';
import { globals } from '../globals.js';

export function sanitizeFilePath(p) {
	console.log('sanitizeFilePath',p)
	const filepath = path.normalize(p);
	if(!filepath) {
		console.error('no filepath given!');
		process.exit();
	}
	return filepath
}

export async function collectFiles(filepath, globMatcher) {
	if((await fs.lstat(filepath)).isFile()) {
		return [filepath]
	} else {
		const matches = await glob(globMatcher, {cwd:filepath})
		return matches;		
	}
}

export async function fileExists(path) {
  try {
    await fs.access(path, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export async function writeFile(data:Uint8Array, filePath:string, overwrite:boolean) {
	if(!overwrite) {
		fs.rename(filePath, filePath+'.bak')
	}

	if(globals.renameOutputFile) {
		const filenameWExt = path.basename(filePath);
		const ext = path.extname(filenameWExt); // includes dot!
		const filename = filenameWExt.substring(0, filenameWExt.length - ext.length);
		const customizedFilename = globals.renameOutputFile(filename);
		if(typeof customizedFilename !== 'string' || (customizedFilename as string).length === 0) {
			throw new Error('renameOutputFile has returned no data!')
		}
		filePath = filePath.replace(filenameWExt, customizedFilename + ext);
	}

	await fs.writeFile(filePath, new Uint8Array(data));
	console.log('Saving changes to file '+path.basename(filePath))
}
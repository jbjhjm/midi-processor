import { input, select } from '@inquirer/prompts';
import * as fs from 'fs/promises';
import { glob } from 'glob';
import type { MidiFile } from "midifile-ts";
import * as path from 'path';
import color from 'ansi-colors';

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
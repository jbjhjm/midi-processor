import { input } from '@inquirer/prompts';
import color from 'ansi-colors';
import * as fs from 'fs/promises';
import * as path from 'path';
import { collectFiles, fileExists, sanitizeFilePath } from './utils/files.js';

/**
 * creates backups of matched files ([name].[ext].bak)
 */

const defaults = {
	path:'F:\\Sector Live\\Projects\\Audio\\recorded'
}

const inputPath = sanitizeFilePath(await input({ message: 'This utility searches for Midi events within a directory. \n'
											+'Enter custom path or press ENTER', default:defaults.path }));
const globMatcher = await input({ message: 'You can customize the glob matcher to use.', default:'**/*GrandMA.mid' });

for (const fileName of await collectFiles(inputPath, globMatcher)) {
	try {
		await processFile(fileName);
	} catch(err) {
		console.error('failed to process file', err)
	}
}

async function processFile(relPath:string) {
	const fullPath = path.join(inputPath, relPath);
	const backupPath = fullPath + '.bak';
	if(await fileExists(backupPath)) {
		await fs.rm(fullPath);
		await fs.copyFile(backupPath, fullPath);
		process.stdout.write(color.green('restored file '+relPath)+'\n');
	} else {
		process.stdout.write(color.grey('no backup found, skipped file '+relPath)+'\n');
	}
}

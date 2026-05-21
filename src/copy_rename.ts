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

const overwrite = await input({ message: 'Overwrite existing files? (y/n)' });
const inputPath = sanitizeFilePath(await input({ message: 'This utility searches for Midi events within a directory. \n'
											+'Enter custom path or press ENTER', default:defaults.path }));
const globMatcher = await input({ message: 'You can customize the glob matcher to use.', default:'**/*GrandMA OSC.mid' });
const appendix = await input({ message: 'Appendix for copied files:', default:' SUNRIGS' });

for (const fileName of await collectFiles(inputPath, globMatcher)) {
	try {
		await processFile(fileName);
	} catch(err) {
		console.error('failed to process file', err)
	}
}

async function processFile(relPath:string) {
	const fullPath = path.join(inputPath, relPath);
	const copyPath = fullPath.substring(0,fullPath.length-4) + appendix + '.mid';
	if(await fileExists(copyPath)) {
		if(overwrite==='y') {
			await fs.rm(copyPath);
		} else {
			process.stdout.write(color.grey('skipped file '+relPath)+'\n');
			return;
		}
	}
	await fs.copyFile(fullPath, copyPath);
	process.stdout.write(color.green('copied file '+relPath)+'\n');
}

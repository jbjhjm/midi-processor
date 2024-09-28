import { Command } from 'commander';
import * as fs from 'fs/promises';
import * as path from 'path';
import type { MidiFile } from "midifile-ts";
import processMidiData from './processor.js'

const midi = await import("midifile-ts");
const program = new Command();

interface Settings {
	save:boolean,
	overwrite:boolean,
}


program
	.argument('<string>','filepath or folder to process')
	.option('--save', 'must be passed to actually save the modifications to file')
	.option('--overwrite', 'overwrite files, if not passed, the original files will be retained as *.mid.bak')
	.action(async (filepath, options) => {
		if(!filepath) {
			console.error('no filepath given!');
			process.exit();
		}
		const pathInfo = await fs.lstat(filepath);
		const settings:Settings = {
			save:options.save||false,
			overwrite:options.overwrite||false,
		}
		
		if(pathInfo.isFile()) {
			await processFile(filepath, settings);
		} else {
			const dirInfo = await fs.readdir(filepath);
			const midiFilesInDir = dirInfo.filter(entry=>{
				return entry.endsWith('.mid')
			});

			for (const fileName of midiFilesInDir) {
				const fullPath = path.join(filepath, fileName);
				try {
					await processFile(fullPath, settings);
				} catch(err) {
					console.error('failed to process file', err)
				}
			}
		}
	});


async function processFile(filePath:string, settings:Settings) {
	console.log('Begin to process file '+filePath)
	const buffer = await fs.readFile(filePath)
	const midiData:MidiFile = await midi.read(buffer)

	await processMidiData(midiData);
	console.log('Completed processing of file '+filePath)

	if(settings.save) {
		if(!settings.overwrite) {
			fs.rename(filePath, filePath+'.bak')
		}

		const fileBuffer = await midi.write(midiData.tracks, midiData.header.ticksPerBeat);
		await fs.writeFile(filePath, new Uint8Array(fileBuffer));
		console.log('Updated file.')
	}
}



await program.parseAsync();
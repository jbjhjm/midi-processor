import { Command } from 'commander';
import * as fs from 'fs/promises';
import * as path from 'path';
import type { MidiFile } from "midifile-ts";
import processMidiData from './processor.js'

const midi = await import("midifile-ts");
const program = new Command();


program
	.argument('<string>','filepath or folder to process')
	.option('--save', 'must be passed to actually save the modifications to file')
	.action(async (filepath, options) => {
		if(!filepath) {
			console.error('no filepath given!');
			process.exit();
		}
		const pathInfo = await fs.lstat(filepath);
		const save = options.save;
		if(pathInfo.isFile()) {
			await processFile(filepath, save);
		} else {
			const dirInfo = await fs.readdir(filepath);
			const midiFilesInDir = dirInfo.filter(entry=>{
				return entry.endsWith('.mid')
			});

			for (const fileName of midiFilesInDir) {
				const fullPath = path.join(filepath, fileName);
				try {
					await processFile(fullPath, save);
				} catch(err) {
					console.error('failed to process file', err)
				}
			}
		}
	});


async function processFile(filePath:string, saveChanges:boolean) {
	console.log('Begin to process file '+filePath)
	const buffer = await fs.readFile(filePath)
	const midiData:MidiFile = await midi.read(buffer)

	await processMidiData(midiData);

	console.log('Completed file '+filePath)
	if(saveChanges) {
		const fileBuffer = await midi.write(midiData.tracks, midiData.header.ticksPerBeat);
		await fs.writeFile(filePath, new Uint8Array(fileBuffer));
		console.log('Updated file.')
	}
}



await program.parseAsync();
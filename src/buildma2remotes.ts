import { input } from '@inquirer/prompts';
import color from 'ansi-colors';
import * as fs from 'fs/promises';
import * as path from 'path';
import { collectFiles, fileExists, sanitizeFilePath } from './utils/files.js';
import { globals } from './globals.js';
import ansiColors from 'ansi-colors';

/**
 * creates backups of matched files ([name].[ext].bak)
 */


const filePath = sanitizeFilePath(await input({ message: 'Path to table data. \n'
											+'Enter custom path or press ENTER', default:'remotes_table.csv' }));

const data = await fs.readFile(path.join(process.cwd(), 'src', filePath), {encoding:'utf8'})
const lines = data.split('\n');
const table = lines.map(line=>{
	return line.split(',')
});
let colMapping: {ch, note, remoteType, remoteId};
if(table[1].includes('Note')) {
	// headlines
	if(table[1][3] == 'Channel'
	  && table[1][4] == 'Note'
	  && table[1][5] == 'Remote Type'
	  && table[1][6] == 'Remote ID'
	) {
		colMapping = {
			ch:3, note:4, remoteType:5, remoteId:6
		}
	} else {
		throw new Error('table columns have changed, must fix code')
	}
}

const parsed: {ch, note, remoteType, remoteId}[] = [];
for(let i=2; i<table.length; i++) {
	parsed.push({
		ch: table[i][colMapping.ch], 
		note: table[i][colMapping.note], 
		remoteType: table[i][colMapping.remoteType], 
		remoteId: table[i][colMapping.remoteId]
	})
}

const remotesList:Array<{
	attrs:Record<string,string>,
	content?:string
}> = [];
let index = 0;
for(const entry of parsed) {
	if(!entry.remoteId || entry.remoteId === '-') continue;

	const attributes:Record<string,string> = {
		index: ''+index,
		channel: entry.ch,
		note: entry.note,
	}
	let content = undefined;

	if(entry.remoteType === 'exec') {
		const target = entry.remoteId.split('.')
		attributes.type = 'exec';
		const exec = parseInt(target.length > 1 ? target[1] : target[0], 10);
		attributes.exec = ''+(exec-1); // when exported, MA seems to use zero-indexed executor numbers 
		if(target.length > 1) {
			attributes.page = target[0]
		}
	} else if(entry.remoteType === 'page') {
		attributes.type = 'macro_line';
		const cmd = 'Page '+entry.remoteId;
		content = `<macro_line>${cmd}</macro_line>`;
	} else if(entry.remoteType === 'OSC') {
		continue;
	} else {
		throw new Error('unsupported remoteType '+entry.remoteType)
	}

	remotesList.push({
		attrs:attributes,
		content
	})
	
	index++;
}

const xmlNotes = remotesList.map(({attrs,content}) => {
	const attrString = Object.entries(attrs)
		.map(([k,v])=>`${k}="${v}"`)
		.join(' ')
	
	if(content) {
		return `\t\t<RemoteMidi ${attrString}>\n\t\t\t${content}\n\t\t</RemoteMidi>`
	} else {
		return `\t\t<RemoteMidi ${attrString} />`
	}	
})

const xmlFile = `<?xml version="1.0" encoding="utf-8"?>
<MA xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://schemas.malighting.de/grandma2/xml/MA" xsi:schemaLocation="http://schemas.malighting.de/grandma2/xml/MA http://schemas.malighting.de/grandma2/xml/3.9.60/MA.xsd" major_vers="3" minor_vers="9" stream_vers="60">
	<Info datetime="2026-01-24T23:31:44" showfile="sector_show_def_v1_20260116_rework2" />
	<MidiRemotes index="1">

${xmlNotes.join('\n')}

	</MidiRemotes>
</MA>
`;

// process.stdout.write(xmlFile)

const outFilePath = sanitizeFilePath(await input({ message: 'Where should the xml data be written to? \n'
											+'Enter custom path or press ENTER', default:'ma2remotes2026.xml' }));

await fs.writeFile(path.join(process.cwd(), 'src', outFilePath), xmlFile)

process.stdout.write(ansiColors.green('successfully generated and written data to '+outFilePath))
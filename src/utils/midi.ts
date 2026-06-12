import ansiColors from 'ansi-colors';
import { AnyEvent, ChannelEvent, NoteOffEvent, NoteOnEvent } from 'midifile-ts';

export function isMidiNote(event:AnyEvent): event is NoteOnEvent|NoteOffEvent {
	if(event.type!=='channel') return false;
	if(event.subtype==='noteOn' || event.subtype==='noteOff') return true;
	return false;
}

export function insertNoteWithLength(track:AnyEvent[], start:NoteOnEvent, end:NoteOffEvent, refIndex:number, startTicks:number, noteLengthTicks:number) {
	let noteStartIndex = refIndex;
	if(noteLengthTicks===0) throw new Error('noteLengthTicks must not be 0!')
	// console.log(`\n>>> requested to store a note at index ${refIndex} with tick info [${startTicks}, ${noteLengthTicks}].`)

	const startPosition = findInsertPosition(track, refIndex, startTicks);
	if(startPosition.targetIndex > startPosition.targetIndex) {
		// NOTE: this is because we currently assume we can simply increase current index in a iteration loop after inserting a note.
		throw new Error('the requested note will be inserted later in the track. This will result in unsupported behavior!')
	}
	const endTicks = noteLengthTicks + startTicks;
	const endPosition = findInsertPosition(track, noteStartIndex, endTicks);
	// console.log({startPosition,endPosition})

	const checkNoteLength = getTicksBetween(track, startPosition.targetIndex, endPosition.targetIndex) - startPosition.ticksAfterTarget + endPosition.ticksAfterTarget
	if(checkNoteLength !== noteLengthTicks) {
		throw new Error(`insertNoteWithLength calculation has failed. Check of note length resulted in ${checkNoteLength} instead of ${noteLengthTicks}`)
	} else {
		// console.log('calculated insert positions are ok')
	}

	const ticksBetweenWrappingItems = getTicksBetween(track, startPosition.targetIndex -2, endPosition.targetIndex + 1);
	// logDeltaTimesInRange(startPosition.targetIndex-2, endPosition.targetIndex+3, track, [refIndex]);

	addMidiEvent(track, end, endPosition);
	
	// console.log(`inserted end at ${endPosition.targetIndex} and deltaTime of ${endPosition.ticksAfterTarget}`)
	// logDeltaTimesInRange(startPosition.targetIndex-2, endPosition.targetIndex+3, track, [refIndex]);

	addMidiEvent(track, start, startPosition);

	// console.log(`inserted start at index ${startPosition.targetIndex} and deltaTime of ${startPosition.ticksAfterTarget}`)
	// const refIndexUpdated = refIndex > startPosition.targetIndex ? refIndex +1 : refIndex;
	// logDeltaTimesInRange(startPosition.targetIndex-2, endPosition.targetIndex+3, track, [refIndexUpdated]);

	const ticksBetweenWrappingItemsAfterInsert = getTicksBetween(track, startPosition.targetIndex -2, endPosition.targetIndex + 3);
	if(ticksBetweenWrappingItems !== ticksBetweenWrappingItemsAfterInsert) {
		console.log(`diff should be ${ticksBetweenWrappingItems}, calculated ticks are ${ticksBetweenWrappingItemsAfterInsert}`)
		throw new Error('Inserting the note has changed the ticks between wrapping events!')
	}

}

export function insertMidiEvent(track: AnyEvent[], eventData: ChannelEvent<any>, targetIndex:number, deltaTime:number) {
	// console.log('insertMidiEvent', {eventData,targetIndex,deltaTime})
	const position = findInsertPosition(track, targetIndex, deltaTime);
	addMidiEvent(track, eventData, position);
}


function addMidiEvent(track: AnyEvent[], eventData: ChannelEvent<any>, pos:InsertPositionInfo) {
	
	const event: ChannelEvent<any> = {
		...eventData,
		deltaTime: pos.ticksAfterTarget,
	};
	if(pos.prepend) {
		event.deltaTime = 0;
		track.unshift(event as AnyEvent);
	} else if(track[pos.targetIndex + 1]) {
		if(track[pos.targetIndex + 1].deltaTime < pos.ticksAfterTarget) {
			throw new Error('addMidiEvent failed - requested position conflicts with next event.')
		}
		track[pos.targetIndex + 1].deltaTime -= pos.ticksAfterTarget;
		track.splice(pos.targetIndex + 1, 0, event as AnyEvent);
	} else {
		track.push(event as AnyEvent);
	}
}

export function removeMidiEvents(track: AnyEvent[], targetIndex:number, removeCount=1) {
	let deltaTimeSum = 0;
	for(let i=0; i<removeCount; i++) {
		deltaTimeSum += track[targetIndex + 1].deltaTime;
	}
	track.splice(targetIndex + 1, removeCount);
	track[targetIndex + 1].deltaTime += deltaTimeSum;
}

export function getDeltaTimeBetween(track: AnyEvent[], aIndex:number, bIndex:number):number {
	const startIndex = aIndex < bIndex ? aIndex : bIndex;
	const targetIndex = aIndex < bIndex ? bIndex : aIndex;
	let sum = 0
	for(let i = startIndex+1; i <=targetIndex; i++) {
		sum += track[i].deltaTime
	}
	// console.log('getDeltaTimeBetween',startIndex,targetIndex,sum)
	return sum
}

function logDeltaTimesInRange(startPosition:number, endPosition:number, track: AnyEvent[], highlights:number[]=[]) {
	const times = [];
	for (let i = startPosition; i < endPosition; i++) { 
		if(highlights.includes(i)) {
			times.push(ansiColors.blueBright(''+track[i].deltaTime))
		} else {
			''+times.push(track[i].deltaTime); 
		}
	}
	process.stdout.write(times.join(', ')+'\n');
}

interface InsertPositionInfo {
	prepend: boolean; // special case: the requested position is at or before the beginning of the track.
	targetIndex: number;
	advancedTicks: number;
	ticksAfterTarget: number;
}

// ticks can be negative to rewind!
function findInsertPosition(track: AnyEvent[], startIndex: number, ticks: number): InsertPositionInfo {
	let advancedTicks = 0;
	let index = startIndex;
	let targetIndex = null;
	const backwards = ticks < 0;
	let ticksRemaining = Math.abs(ticks);
	let prepend = false;
	while (index < track.length && index >= 0) {
		if(backwards) {
			const nextTicks = track[index].deltaTime;
			if(index===0) {
				// this means the note shoul be inserted at the beginning of the track.
				ticksRemaining -= nextTicks;
				targetIndex = 0;
				break;
			} else if (ticksRemaining < nextTicks) {
				// console.log('found targetIndex', startIndex,index, ticksRemaining, nextTicks, track[index])
				targetIndex = index;
				break;
			} else {
				ticksRemaining -= nextTicks;
				index--;
			}
		} else {
			// deltaTime describes the ticks BEFORE refNote, immediately jump to the next one!
			const nextTicks = track[index+1]?.deltaTime || 0;
			// console.log('nestTicks at '+index+1+' = '+nextTicks)
			if (ticksRemaining < nextTicks && index < track.length) {
				targetIndex = index;
				break;
			} else {
				ticksRemaining -= nextTicks;
				index++;
			}
		}
	}
	if(targetIndex === null) {
		// no notes in between!
		targetIndex = startIndex;
		advancedTicks = 0;
	} else {
		advancedTicks = Math.abs(ticks) - ticksRemaining;
		if(backwards) {
			if(targetIndex > 0) {
				// we did a look backwards, but ticksRemaining must be calculated in relation to the index BEFORE.
				ticksRemaining = track[targetIndex].deltaTime - ticksRemaining;
				targetIndex--;
			} else {
				// we are at the front. we cannot do anything else.
				targetIndex--;
				prepend = true;
			}
		}
	}

	// in case a track-prepend is required, the check will fail because the numbers are off.
	if(!prepend) {
		const between = getTicksBetween(track, startIndex, targetIndex); 
		let check;
		if(backwards) {
			check = between - ticksRemaining
		} else {
			check = between + ticksRemaining
		}
		if(check !== Math.abs(ticks)) {
			console.log({startIndex,ticks,targetIndex, advancedTicks,prepend,between,ticksRemaining,refEvent:track[startIndex]})
			console.warn('findInsertPosition failed: getTicksBetween calculated tick count of '+check+', but requested tick offset was '+ticks+'!')
		}
	}

	return { targetIndex, advancedTicks, ticksAfterTarget:ticksRemaining, prepend };
}

// ticks between mean we need to sum the deltaTime.
// INCLUDING deltaTime at target index, IGNORING the deltaTime at start idnex.
export function getTicksBetween(track:AnyEvent[], start:number, target:number) {
	if(start===target) return 0;
	let isNegative = start > target;
	let ticks = 0;
	if(isNegative) {
		const tmp = target;
		target = start;
		start = tmp;
	}
	for(let i=start+1; i<=target; i++) {
		ticks += track[i].deltaTime
	}
	
	return ticks;
}
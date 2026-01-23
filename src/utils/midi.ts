import ansiColors from 'ansi-colors';
import { AnyEvent, ChannelEvent, NoteOffEvent, NoteOnEvent } from 'midifile-ts';

export function isMidiNote(event:AnyEvent): event is NoteOnEvent|NoteOffEvent {
	if(event.type!=='channel') return false;
	if(event.subtype==='noteOn' || event.subtype==='noteOff') return true;
	return false;
}

export function insertNoteWithLength(track:AnyEvent[], event:NoteOnEvent, refIndex:number, startTicks:number, noteLengthTicks:number) {
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

	const checkNoteLength = getTicksBetween(track, startPosition.targetIndex, endPosition.targetIndex) - startPosition.ticksAfterTarget + endPosition.ticksAfterTarget
	if(checkNoteLength !== noteLengthTicks) {
		throw new Error(`insertNoteWithLength calculation has failed. Check of note length resulted in ${checkNoteLength} instead of ${noteLengthTicks}`)
	} else {
		// console.log('calculated insert positions are ok')
	}

	const ticksBetweenWrappingItems = getTicksBetween(track, startPosition.targetIndex -2, endPosition.targetIndex + 1);
	// logDeltaTimesInRange(startPosition.targetIndex-2, endPosition.targetIndex+3, track, [refIndex]);

	insertMidiEvent(track, {...event, subtype:'noteOff'}, endPosition.targetIndex, endPosition.ticksAfterTarget);
	
	// console.log(`inserted end at ${endPosition.targetIndex} and deltaTime of ${endPosition.ticksAfterTarget}`)
	// logDeltaTimesInRange(startPosition.targetIndex-2, endPosition.targetIndex+3, track, [refIndex]);

	insertMidiEvent(track, {...event, subtype:'noteOn'}, startPosition.targetIndex, startPosition.ticksAfterTarget);

	// console.log(`inserted start at index ${startPosition.targetIndex} and deltaTime of ${startPosition.ticksAfterTarget}`)
	// const refIndexUpdated = refIndex > startPosition.targetIndex ? refIndex +1 : refIndex;
	// logDeltaTimesInRange(startPosition.targetIndex-2, endPosition.targetIndex+3, track, [refIndexUpdated]);

	const ticksBetweenWrappingItemsAfterInsert = getTicksBetween(track, startPosition.targetIndex -2, endPosition.targetIndex + 3);
	if(ticksBetweenWrappingItems !== ticksBetweenWrappingItemsAfterInsert) {
		console.log(`diff should be ${ticksBetweenWrappingItems}, calculated ticks are ${ticksBetweenWrappingItemsAfterInsert}`)
		throw new Error('Inserting the note has changed the ticks between wrapping events!')
	}

}

function insertMidiEvent(track: AnyEvent[], eventData: ChannelEvent<any>, targetIndex:number, deltaTime:number) {
	const event: ChannelEvent<any> = {
		...eventData,
		deltaTime: deltaTime
	};
	track[targetIndex + 1].deltaTime -= deltaTime;
	track.splice(targetIndex + 1, 0, event as AnyEvent);
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
	targetIndex: number;
	advancedTicks: number;
	ticksAfterTarget: number;
}

// ticks can be negative to rewind!
function findInsertPosition(track: AnyEvent[], startIndex: number, ticks: number): InsertPositionInfo {
	let advancedTicks = 0;
	let index = startIndex;
	let targetIndex = -1;
	const backwards = ticks < 0;
	let ticksRemaining = Math.abs(ticks);
	while (index < track.length && index >= 0) {
		if(backwards) {
			const nextTicks = track[index].deltaTime;
			if (ticksRemaining < nextTicks) {
				targetIndex = index;
				break;
			} else {
				ticksRemaining -= nextTicks;
				index--;
			}
		} else {
			// deltaTime describes the ticks BEFORE refNote, immediately jump to the next one!
			const nextTicks = track[index+1].deltaTime;
			// console.log('nestTicks at '+index+1+' = '+nextTicks)
			if (ticksRemaining < nextTicks) {
				targetIndex = index;
				break;
			} else {
				ticksRemaining -= nextTicks;
				index++;
			}
		}
	}
	if(targetIndex === -1) {
		// no notes in between!
		targetIndex = startIndex;
		advancedTicks = 0;
	} else {
		advancedTicks = Math.abs(ticks) - ticksRemaining;
		if(backwards) {
			// we did a look backwards, but ticksRemaining must be calculated in relation to the index BEFORE.
			ticksRemaining = track[targetIndex].deltaTime - ticksRemaining;
			targetIndex--;
		}
	}

	const between = getTicksBetween(track, startIndex, targetIndex); 
	let check;
	if(backwards) {
		check = between - ticksRemaining
	} else {
		check = between + ticksRemaining
	}
	// console.log(`findInsertPosition from [${startIndex}] +${ticks} ticks resulted in index ${targetIndex}, ticks inbetween are ${between}, remaining ${ticksRemaining}`)
	if(check !== Math.abs(ticks)) {
		throw new Error('This seems off. getTicksBetween calculated tick count of '+check+', which is more than requested tick count '+ticks)
	}

	return { targetIndex, advancedTicks, ticksAfterTarget:ticksRemaining };
}

// ticks between mean we need to sum the deltaTime.
// INCLUDING deltaTime at target index, IGNORING the deltaTime at start idnex.
function getTicksBetween(track:AnyEvent[], start:number, target:number) {
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
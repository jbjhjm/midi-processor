import { AnyEvent } from 'midifile-ts';

export type HandlerFn = (data:AnyEvent)=>AnyEvent;
export type ChannelNum = number;
export type MIDIEventType = 'note'|'cc'|'pc'

export type HandlerStructure = Record<ChannelNum, {
	[x in MIDIEventType]?: HandlerFn;
}>;

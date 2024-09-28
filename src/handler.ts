import { NoteOffEvent, NoteOnEvent } from 'midifile-ts';
import { HandlerStructure } from './interfaces.js';

const ORPHANED_NOTE_INDEX = 126

export const Handlers:HandlerStructure = {
	0: {
		'note':(note:NoteOnEvent|NoteOffEvent)=>{
			// console.log('process note event',note)
			if(note.noteNumber === 0) 		{ note.noteNumber=2; note.channel=0; 	} // mute on
			else if(note.noteNumber === 1) 	{ note.noteNumber=3; note.channel=0; 	} // mute off
			else if(note.noteNumber === 4) 	{ note.noteNumber=0; note.channel=0; 	} // FX BYPASS ALL
			else if(note.noteNumber === 5) 	{ note.noteNumber=1; note.channel=0; 	} // RESET ALL FX
			else if(note.noteNumber === 7) 	{ note.noteNumber=4; note.channel=0; 	} // BPM
			else if(note.noteNumber === 8) 	{ note.noteNumber=5; note.channel=0; 	} // BPM 100+
			else if(note.noteNumber === 9) 	{ note.noteNumber=6; note.channel=0; 	} // Gate Control
			else if(note.noteNumber === 10) { note.noteNumber=7; note.channel=0; 	} // SENDS Source PRE--INS
			
			else if(note.noteNumber === 12) { note.noteNumber=11; note.channel=1; 	} // Active Doubler
			else if(note.noteNumber === 13) { note.noteNumber=24; note.channel=1; 	} // Active Speaker
			else if(note.noteNumber === 14) { note.noteNumber=34; note.channel=1; 	} // Active Vocoder
			else if(note.noteNumber === 15) { note.noteNumber=44; note.channel=1; 	} // Active Trem
			else if(note.noteNumber === 16) { note.noteNumber=55; note.channel=1; 	} // Active Mod
			else if(note.noteNumber === 17) { note.noteNumber=71; note.channel=1; 	} // Active Pitch
			else if(note.noteNumber === 19) { note.noteNumber=10; note.channel=2; 	} // Active Ubermod
			else if(note.noteNumber === 20) { note.noteNumber=45; note.channel=2; 	} // Active Relayer1
			else if(note.noteNumber === 21) { note.noteNumber=68; note.channel=2; 	} // Active Relayer2
			else if(note.noteNumber === 22) { note.noteNumber=72; note.channel=2; 	} // Active Reverb

			else if(note.noteNumber === 24) { note.noteNumber=23; note.channel=1; 	} // Gain Speaker
			else if(note.noteNumber === 25) { note.noteNumber=33; note.channel=1; 	} // Gain Vocoder
			else if(note.noteNumber === 26) { note.noteNumber=43; note.channel=1; 	} // Gain Trem
			else if(note.noteNumber === 27) { note.noteNumber=54; note.channel=1; 	} // Gain Mod
			else if(note.noteNumber === 28) { note.noteNumber=70; note.channel=1; 	} // Gain Pitch
			else if(note.noteNumber === 30) { note.noteNumber=9; note.channel=2; 	} // Gain Ubermod
			else if(note.noteNumber === 31) { note.noteNumber=44; note.channel=2; 	} // Gain Relayer1
			else if(note.noteNumber === 32) { note.noteNumber=67; note.channel=2; 	} // Gain Relayer2
			else if(note.noteNumber === 33) { note.noteNumber=71; note.channel=2; 	} // Gain Reverb

			else if(note.noteNumber === 36) { note.noteNumber=8; note.channel=0; 	} // Presence
			else if(note.noteNumber === 37) { note.noteNumber=9; note.channel=0; 	} // Gain Corr
			else if(note.noteNumber === 38) { note.noteNumber=10; note.channel=0; 	} // Inserts Mix
			else if(note.noteNumber === 39) { note.noteNumber=11; note.channel=0; 	} // Ducking Atten.
			else if(note.noteNumber === 40) { note.noteNumber=12; note.channel=0; 	} // Ducking Rel.

			else if(note.noteNumber === 48) { note.noteNumber=12; note.channel=0; 	} // Ducking Rel.

			else {
				console.warn('detected unhandled event',note)
			}

			return note
		}
	},
	1: {
		'note':(note:NoteOnEvent|NoteOffEvent)=>{
			// doubler presets
			if(note.noteNumber === 0) 			{ note.noteNumber=8; note.channel=1; 	}
			else if(note.noteNumber === 1) 		{ note.noteNumber=7; note.channel=1; 	}
			else if(note.noteNumber === 2) 		{ note.noteNumber=6; note.channel=1; 	}
			else if(note.noteNumber === 3) 		{ note.noteNumber=5; note.channel=1; 	}
			else if(note.noteNumber === 4) 		{ note.noteNumber=4; note.channel=1; 	}
			else if(note.noteNumber === 5) 		{ note.noteNumber=3; note.channel=1; 	}
			else if(note.noteNumber === 6) 		{ note.noteNumber=2; note.channel=1; 	}
			else if(note.noteNumber === 7) 		{ note.noteNumber=1; note.channel=1; 	}
			else if(note.noteNumber === 8) 		{ note.noteNumber=0; note.channel=1; 	}
			else if(note.noteNumber === 9) 		{ note.noteNumber=ORPHANED_NOTE_INDEX; 	}
			else if(note.noteNumber === 10) 	{ note.noteNumber=10; note.channel=1; 	}
			else if(note.noteNumber === 11) 	{ note.noteNumber=9; note.channel=1; 	}

			// speaker presets
			else if(note.noteNumber === 12) 	{ note.noteNumber=22; note.channel=1; 	}
			else if(note.noteNumber === 13) 	{ note.noteNumber=21; note.channel=1; 	}
			else if(note.noteNumber === 14) 	{ note.noteNumber=20; note.channel=1; 	}
			else if(note.noteNumber === 15) 	{ note.noteNumber=19; note.channel=1; 	}
			else if(note.noteNumber === 16) 	{ note.noteNumber=18; note.channel=1; 	}
			else if(note.noteNumber === 17) 	{ note.noteNumber=17; note.channel=1; 	}
			else if(note.noteNumber === 18) 	{ note.noteNumber=16; note.channel=1; 	}
			else if(note.noteNumber === 19) 	{ note.noteNumber=15; note.channel=1; 	}
			else if(note.noteNumber === 20) 	{ note.noteNumber=14; note.channel=1; 	}
			else if(note.noteNumber === 21) 	{ note.noteNumber=ORPHANED_NOTE_INDEX; 	}

			// voc presets
			else if(note.noteNumber === 24) 	{ note.noteNumber=31; note.channel=1; 	}
			else if(note.noteNumber === 25) 	{ note.noteNumber=30; note.channel=1; 	}
			else if(note.noteNumber === 26) 	{ note.noteNumber=29; note.channel=1; 	}
			else if(note.noteNumber === 27) 	{ note.noteNumber=28; note.channel=1; 	}
			else if(note.noteNumber === 28) 	{ note.noteNumber=27; note.channel=1; 	}
			else if(note.noteNumber === 29) 	{ note.noteNumber=ORPHANED_NOTE_INDEX; 	}

			// trem presets
			else if(note.noteNumber === 30) 	{ note.noteNumber=41; note.channel=1; 	}
			else if(note.noteNumber === 31) 	{ note.noteNumber=40; note.channel=1; 	}
			else if(note.noteNumber === 32) 	{ note.noteNumber=39; note.channel=1; 	}
			else if(note.noteNumber === 33) 	{ note.noteNumber=38; note.channel=1; 	}
			else if(note.noteNumber === 34) 	{ note.noteNumber=37; note.channel=1; 	}
			else if(note.noteNumber === 35) 	{ note.noteNumber=ORPHANED_NOTE_INDEX; 	}

			// mod presets
			else if(note.noteNumber === 36) 	{ note.noteNumber=53; note.channel=1; 	}
			else if(note.noteNumber === 37) 	{ note.noteNumber=52; note.channel=1; 	}
			else if(note.noteNumber === 38) 	{ note.noteNumber=51; note.channel=1; 	}
			else if(note.noteNumber === 39) 	{ note.noteNumber=50; note.channel=1; 	}
			else if(note.noteNumber === 40) 	{ note.noteNumber=49; note.channel=1; 	}
			else if(note.noteNumber === 41) 	{ note.noteNumber=48; note.channel=1; 	}
			else if(note.noteNumber === 42) 	{ note.noteNumber=47; note.channel=1; 	}
			else if(note.noteNumber === 43) 	{ note.noteNumber=ORPHANED_NOTE_INDEX; 	}
			else if(note.noteNumber === 44) 	{ note.noteNumber=ORPHANED_NOTE_INDEX; 	}
			else if(note.noteNumber === 45) 	{ note.noteNumber=ORPHANED_NOTE_INDEX; 	}

			// pitch presets
			else if(note.noteNumber === 46) 	{ note.noteNumber=69; note.channel=1; 	}
			else if(note.noteNumber === 47) 	{ note.noteNumber=68; note.channel=1; 	}
			else if(note.noteNumber === 48) 	{ note.noteNumber=67; note.channel=1; 	}
			else if(note.noteNumber === 49) 	{ note.noteNumber=66; note.channel=1; 	}
			else if(note.noteNumber === 50) 	{ note.noteNumber=65; note.channel=1; 	}
			else if(note.noteNumber === 51) 	{ note.noteNumber=64; note.channel=1; 	}
			else if(note.noteNumber === 52) 	{ note.noteNumber=63; note.channel=1; 	}
			else if(note.noteNumber === 53) 	{ note.noteNumber=62; note.channel=1; 	}
			else if(note.noteNumber === 54) 	{ note.noteNumber=61; note.channel=1; 	}
			else if(note.noteNumber === 55) 	{ note.noteNumber=60; note.channel=1; 	}
			else if(note.noteNumber === 56) 	{ note.noteNumber=59; note.channel=1; 	}
			else if(note.noteNumber === 57) 	{ note.noteNumber=58; note.channel=1; 	}

			// ubermod presets
			else if(note.noteNumber === 60) 	{ note.noteNumber=8; note.channel=2; 	}
			else if(note.noteNumber === 61) 	{ note.noteNumber=7; note.channel=2; 	}
			else if(note.noteNumber === 62) 	{ note.noteNumber=6; note.channel=2; 	}
			else if(note.noteNumber === 63) 	{ note.noteNumber=5; note.channel=2; 	}
			else if(note.noteNumber === 64) 	{ note.noteNumber=4; note.channel=2; 	}
			else if(note.noteNumber === 65) 	{ note.noteNumber=3; note.channel=2; 	}
			else if(note.noteNumber === 66) 	{ note.noteNumber=2; note.channel=2; 	}
			else if(note.noteNumber === 67) 	{ note.noteNumber=1; note.channel=2; 	}
			else if(note.noteNumber === 68) 	{ note.noteNumber=0; note.channel=2; 	}
			else if(note.noteNumber === 69) 	{ note.noteNumber=ORPHANED_NOTE_INDEX; 	}

			// relayer1 presets
			else if(note.noteNumber === 72) 	{ note.noteNumber=31; note.channel=2; 	}
			else if(note.noteNumber === 73) 	{ note.noteNumber=30; note.channel=2; 	}
			else if(note.noteNumber === 74) 	{ note.noteNumber=29; note.channel=2; 	}
			else if(note.noteNumber === 75) 	{ note.noteNumber=28; note.channel=2; 	}
			else if(note.noteNumber === 76) 	{ note.noteNumber=27; note.channel=2; 	}
			else if(note.noteNumber === 77) 	{ note.noteNumber=26; note.channel=2; 	}
			else if(note.noteNumber === 78) 	{ note.noteNumber=25; note.channel=2; 	}
			else if(note.noteNumber === 79) 	{ note.noteNumber=24; note.channel=2; 	}
			else if(note.noteNumber === 80) 	{ note.noteNumber=23; note.channel=2; 	}
			else if(note.noteNumber === 81) 	{ note.noteNumber=22; note.channel=2; 	}
			else if(note.noteNumber === 82) 	{ note.noteNumber=21; note.channel=2; 	}
			else if(note.noteNumber === 83) 	{ note.noteNumber=20; note.channel=2; 	}
			else if(note.noteNumber === 84) 	{ note.noteNumber=19; note.channel=2; 	}
			else if(note.noteNumber === 85) 	{ note.noteNumber=18; note.channel=2; 	}
			else if(note.noteNumber === 86) 	{ note.noteNumber=17; note.channel=2; 	}
			else if(note.noteNumber === 87) 	{ note.noteNumber=16; note.channel=2; 	}
			else if(note.noteNumber === 88) 	{ note.noteNumber=15; note.channel=2; 	}
			else if(note.noteNumber === 89) 	{ note.noteNumber=14; note.channel=2; 	}
			else if(note.noteNumber === 90) 	{ note.noteNumber=13; note.channel=2; 	}
			else if(note.noteNumber === 91) 	{ note.noteNumber=ORPHANED_NOTE_INDEX; 	}

			// relayer1 tempo
			else if(note.noteNumber === 96) 	{ note.noteNumber=32; note.channel=2; 	}
			else if(note.noteNumber === 97) 	{ note.noteNumber=33; note.channel=2; 	}
			else if(note.noteNumber === 98) 	{ note.noteNumber=34; note.channel=2; 	}
			else if(note.noteNumber === 99) 	{ note.noteNumber=35; note.channel=2; 	}
			else if(note.noteNumber === 100)	{ note.noteNumber=36; note.channel=2; 	}
			else if(note.noteNumber === 101)	{ note.noteNumber=37; note.channel=2; 	}
			else if(note.noteNumber === 102)	{ note.noteNumber=38; note.channel=2; 	}
			else if(note.noteNumber === 103)	{ note.noteNumber=39; note.channel=2; 	}
			else if(note.noteNumber === 104)	{ note.noteNumber=40; note.channel=2; 	}
			else if(note.noteNumber === 105)	{ note.noteNumber=41; note.channel=2; 	}
			else if(note.noteNumber === 106)	{ note.noteNumber=42; note.channel=2; 	}
			else if(note.noteNumber === 107)	{ note.noteNumber=43; note.channel=2; 	}

			// relayer2 presets
			else if(note.noteNumber === 108) 	{ note.noteNumber=66; note.channel=2; 	}
			else if(note.noteNumber === 109) 	{ note.noteNumber=65; note.channel=2; 	}
			else if(note.noteNumber === 110) 	{ note.noteNumber=64; note.channel=2; 	}
			else if(note.noteNumber === 111) 	{ note.noteNumber=63; note.channel=2; 	}
			else if(note.noteNumber === 112) 	{ note.noteNumber=62; note.channel=2; 	}
			else if(note.noteNumber === 113) 	{ note.noteNumber=61; note.channel=2; 	}
			else if(note.noteNumber === 114) 	{ note.noteNumber=60; note.channel=2; 	}
			else if(note.noteNumber === 115) 	{ note.noteNumber=59; note.channel=2; 	}
			else if(note.noteNumber === 116) 	{ note.noteNumber=58; note.channel=2; 	}
			else if(note.noteNumber === 117) 	{ note.noteNumber=57; note.channel=2; 	}
			else if(note.noteNumber === 118) 	{ note.noteNumber=56; note.channel=2; 	}
			else if(note.noteNumber === 119) 	{ note.noteNumber=55; note.channel=2; 	}
			else if(note.noteNumber === 120) 	{ note.noteNumber=54; note.channel=2; 	}
			else if(note.noteNumber === 121) 	{ note.noteNumber=53; note.channel=2; 	}
			else if(note.noteNumber === 122) 	{ note.noteNumber=52; note.channel=2; 	}
			else if(note.noteNumber === 123) 	{ note.noteNumber=51; note.channel=2; 	}
			else if(note.noteNumber === 124) 	{ note.noteNumber=50; note.channel=2; 	}
			else if(note.noteNumber === 125) 	{ note.noteNumber=49; note.channel=2; 	}
			else if(note.noteNumber === 126) 	{ note.noteNumber=48; note.channel=2; 	}
			else if(note.noteNumber === 127) 	{ note.noteNumber=ORPHANED_NOTE_INDEX; 	}

			else {
				console.warn('detected unhandled event',note)
			}

			return note
		}
	}
}

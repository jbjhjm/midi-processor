# Midi Processor

A utility to transform midi files.
Add the required transformation logic to src/handler.ts.

## Install

`pnpm i`

## Usage

Use the CLI command:

`pnpm process <path> [--save] [--overwrite]`

Where:

- path points to a midi file or to a folder containing a number of *.mid files
- without --save being passed, the script does not overwrite the midi data.
- without passing --overwrite, the original files will stay available as *.mid.bak.

## Migration execution order

Some migrations target channels that will be populated by others.
Important to run these in correct order!

1.
  - ⚠️ song_execs Ch 1/2 -> 1
  - ⚠️globalctrl Ch 8 -> 2
  - ⚠️colorflashes Ch 8 -> 2
2. 
   - ⏭️strobes Ch 15 -> 3, 4, 5
   - ⏭️flashes Ch 15 -> 3, 4, 5
   - ⏭️pixelflashes Ch 16 -> 3, 4
   - ⏭️pixelfades Ch 15, 16 -> 3, 4, 5
3. 
   - ⚙️submasters Ch 8 -> 3, 4, 5
   - ⚙️sfx_fog Ch 15 -> 6
   - ⚙️jbmh_speed Ch 8 -> 4
   - ⚙️jbmh_fx Ch 13 -> 4
4.
   - ⏸️list_pixelfades -- display purposes only
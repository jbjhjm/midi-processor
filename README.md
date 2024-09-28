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
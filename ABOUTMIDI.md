
## Timing

midi file defines midi events relative to each other.
each event starts with a deltaTime value, which contains number of ticks since the previous event.
So to get an events total position, one has to sum all previous deltaTimes.
Using BPM and PPQN (ticks per quarter note), the position in time can then be calculated.
import type { LevelId } from "../logic/types";

/**
 * Original chiptune compositions (written for this game). Notation per step:
 *   "D5"  note on   "."  rest   "-"  hold previous note
 * Each bar has 16 steps (16th notes). Drums: x = hit.
 */
export interface Song {
  bpm: number;
  lead: string;
  counter?: string;
  bass: string;
  kick: string;
  snare: string;
  hat: string;
  /** percussion flavour: dholak-style tom pattern for some levels */
  tom?: string;
  leadWave: OscillatorType;
  bassWave: OscillatorType;
  /** semitones used to "minor-ise" the melody in crisis stages */
  minorShift: Record<string, number>;
}

export const SONGS: Record<LevelId, Song> = {
  // Old City: Phrygian-dominant flavour, bouncy dholak groove
  "old-city": {
    bpm: 112,
    lead:
      "D5 . F#5 G5 A5 - G5 F#5 Eb5 - D5 . . . C5 D5 " +
      "Eb5 . D5 C5 D5 - - . A4 . Bb4 . C5 - D5 . " +
      "A5 . Bb5 A5 G5 - F#5 G5 A5 - . . D5 . F#5 . " +
      "G5 F#5 Eb5 D5 C5 . D5 - - - . . . . . .",
    counter:
      ". . . . D4 . . . . . . . A3 . . . " +
      ". . . . Bb3 . . . . . . . A3 . . . " +
      ". . . . D4 . . . . . . . F#4 . . . " +
      ". . . . G3 . . . . . . . D4 . . .",
    bass:
      "D3 . . D3 . . A2 . D3 . . D3 . . A2 . " +
      "Eb3 . . Eb3 . . Bb2 . D3 . . D3 . . A2 . " +
      "D3 . . D3 . . A2 . F#2 . . F#2 . . A2 . " +
      "G2 . . G2 . . D3 . D3 . . A2 . . D3 .",
    kick: "x.....x.x.....x.",
    snare: "....x.......x...",
    hat: "..x...x...x...x.",
    tom: "x..x..x.x..x.x..",
    leadWave: "square",
    bassWave: "triangle",
    minorShift: { "F#": -1 },
  },
  // Traffic Madness: fast, honky, major
  traffic: {
    bpm: 140,
    lead:
      "C5 . C5 E5 G5 . E5 . F5 . A5 . G5 - - . " +
      "E5 . E5 G5 C6 . G5 . A5 G5 F5 E5 D5 - - . " +
      "C5 . C5 E5 G5 . E5 . F5 . A5 . C6 - B5 . " +
      "A5 G5 F5 E5 D5 . E5 . C5 - - - . . . .",
    bass:
      "C3 . C3 . G2 . C3 . F2 . F2 . G2 . G2 . " +
      "C3 . C3 . E3 . C3 . F2 . A2 . G2 . B2 . " +
      "C3 . C3 . G2 . C3 . F2 . F2 . A2 . G2 . " +
      "F2 . G2 . A2 . B2 . C3 . G2 . C3 . . .",
    kick: "x...x...x...x...",
    snare: "....x.......x..x",
    hat: "x.x.x.x.x.x.x.x.",
    leadWave: "sawtooth",
    bassWave: "square",
    minorShift: { E: -1, A: -1, B: -1 },
  },
  // Pothole Paradise: funky bouncing bass
  pothole: {
    bpm: 118,
    lead:
      ". . F5 . Ab5 . . Bb5 . C6 . Bb5 Ab5 . F5 . " +
      ". . Eb5 . F5 . . . Ab5 . F5 . Eb5 . C5 . " +
      ". . F5 . Ab5 . . Bb5 . C6 . Eb6 C6 . Bb5 . " +
      "Ab5 . F5 . Eb5 . F5 - - - . . . . . .",
    bass:
      "F2 . F3 . F2 . . Eb3 . F2 . . Ab2 . Bb2 . " +
      "F2 . F3 . F2 . . C3 . Eb3 . . C3 . Bb2 . " +
      "Db3 . Db3 . Db2 . . Ab2 . Db3 . . Eb3 . F3 . " +
      "C3 . C3 . C2 . . G2 . C3 . Bb2 . G2 . .",
    kick: "x..x..x...x..x..",
    snare: "....x.......x...",
    hat: "x.xxx.xxx.xxx.xx",
    leadWave: "square",
    bassWave: "square",
    minorShift: {},
  },
  // Water Crisis: dripping triangle arpeggios, pentatonic
  water: {
    bpm: 104,
    lead:
      "A4 C5 E5 A5 G5 E5 D5 C5 A4 C5 E5 G5 - - E5 . " +
      "G4 C5 D5 G5 E5 D5 C5 A4 G4 A4 C5 D5 - - . . " +
      "A4 C5 E5 A5 G5 E5 D5 C5 E5 G5 A5 C6 - - A5 . " +
      "G5 E5 D5 C5 D5 - E5 - A4 - - - . . . .",
    bass:
      "A2 . . . A2 . . . F2 . . . F2 . . . " +
      "C3 . . . C3 . . . G2 . . . G2 . . . " +
      "A2 . . . A2 . . . F2 . . . F2 . . . " +
      "D3 . . . D3 . . . E2 . . . E2 . . .",
    kick: "x.......x.......",
    snare: "....x.......x...",
    hat: "..x...x...x...x.",
    leadWave: "triangle",
    bassWave: "triangle",
    minorShift: {},
  },
  // Secretariat: pompous march with snare rolls
  secretariat: {
    bpm: 126,
    lead:
      "Bb4 . . D5 F5 . . D5 Bb5 - - . A5 . G5 . " +
      "F5 . . Eb5 D5 . . C5 D5 - - . . . . . " +
      "Bb4 . . D5 F5 . . Bb5 D6 - - . C6 . Bb5 . " +
      "A5 . F5 . G5 . A5 . Bb5 - - - . . . .",
    bass:
      "Bb2 . . . F2 . . . Bb2 . . . F2 . . . " +
      "Eb2 . . . Bb2 . . . F2 . . . C3 . . . " +
      "Bb2 . . . F2 . . . Bb2 . . . D3 . . . " +
      "Eb3 . . . F2 . . . Bb2 . F2 . Bb2 . . .",
    kick: "x.......x.......",
    snare: "....x.x.....xxxx",
    hat: "x...x...x...x...",
    leadWave: "square",
    bassWave: "triangle",
    minorShift: { D: -1, A: -1 },
  },
};

const NOTE_INDEX: Record<string, number> = { C: 0, "C#": 1, Db: 1, D: 2, "D#": 3, Eb: 3, E: 4, F: 5, "F#": 6, Gb: 6, G: 7, "G#": 8, Ab: 8, A: 9, "A#": 10, Bb: 10, B: 11 };

export function noteFreq(note: string, shift: Record<string, number> = {}): number {
  const m = /^([A-G][#b]?)(\d)$/.exec(note);
  if (!m) return 0;
  const semis = NOTE_INDEX[m[1]] + (shift[m[1]] ?? 0) + (Number(m[2]) + 1) * 12;
  return 440 * Math.pow(2, (semis - 69) / 12);
}

export function tokens(s: string): string[] {
  return s.trim().split(/\s+/);
}

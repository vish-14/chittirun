import fs from "node:fs";
import { SONGS, noteFreq, tokens } from "../src/game/audio/songs";

const SR = 44100;
const TOTAL = 60;
const out = new Float32Array(SR * TOTAL);
type Stage = "control" | "crisis" | "final" | "lost";
const TEMPO: Record<Stage, number> = { control: 1, crisis: 1.12, final: 1.2, lost: 0.85 };

let seed = 1;
const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 4294967296) * 2 - 1;

function osc(type: string, ph: number) {
  const x = ph % 1;
  if (type === "square") return x < 0.5 ? 1 : -1;
  if (type === "triangle") return 4 * Math.abs(x - 0.5) - 1;
  if (type === "sawtooth") return 2 * x - 1;
  return Math.sin(2 * Math.PI * x);
}
function tone(buf: Float32Array, t: number, f: number, len: number, vol: number, type: string, drop = 0, end = Infinity) {
  const s0 = Math.floor(t * SR), n = Math.floor(len * SR);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const idx = s0 + i;
    if (idx >= buf.length || idx / SR >= end) break;
    const k = i / n;
    const freq = drop ? f * Math.pow(drop, k) : f;
    ph += freq / SR;
    const env = Math.min(1, i / (0.008 * SR)) * Math.pow(1 - k, 1.4);
    buf[idx] += osc(type, ph) * vol * env;
  }
}
function noise(buf: Float32Array, t: number, len: number, vol: number, hp: boolean, end = Infinity) {
  const s0 = Math.floor(t * SR), n = Math.floor(len * SR);
  let prev = 0;
  for (let i = 0; i < n; i++) {
    const idx = s0 + i;
    if (idx >= buf.length || idx / SR >= end) break;
    const r = rnd();
    const v = hp ? r - prev : (prev = prev * 0.6 + r * 0.4);
    if (hp) prev = r;
    buf[idx] += v * vol * Math.pow(1 - i / n, 2);
  }
}

function play(level: keyof typeof SONGS, stage: Stage, from: number, to: number, startStep = 0) {
  const s = SONGS[level];
  const lead = tokens(s.lead), bass = tokens(s.bass), ctr = s.counter ? tokens(s.counter) : null;
  const shift = stage === "crisis" || stage === "final" ? s.minorShift : {};
  const dur = 60 / (s.bpm * TEMPO[stage]) / 4;
  const sus = (arr: string[], i: number) => { let n = 1; while (arr[(i + n) % arr.length] === "-" && n < 16) n++; return n; };
  let step = startStep;
  for (let t = from; t < to; t += dur, step++) {
    const i = step % lead.length, k = step % 16;
    const L = lead[i];
    if (L && L !== "." && L !== "-") {
      const f = noteFreq(L, shift);
      tone(out, t, f, sus(lead, i) * dur * 0.92, 0.11, s.leadWave, 0, to);
      if (stage === "control") tone(out, t, f * 2, dur * 0.6, 0.025, "square", 0, to);
    }
    const C = ctr?.[i];
    if (C && C !== "." && C !== "-") tone(out, t, noteFreq(C, shift), dur * 3, 0.06, "triangle", 0, to);
    const B = bass[i];
    if (B && B !== "." && B !== "-") tone(out, t, noteFreq(B, shift), dur * 1.6, 0.15, s.bassWave, 0, to);
    const kick = stage === "final" ? "x..x....x..x...." : s.kick;
    if (kick[k] === "x") tone(out, t, 140, 0.18, 0.45, "sine", 0.3, to);
    if (s.snare[k] === "x") noise(out, t, 0.1, 0.22, true, to);
    const hats = stage === "control" ? s.hat : "xxxxxxxxxxxxxxxx";
    if (hats[k] === "x") noise(out, t, 0.03, 0.06, true, to);
    if (s.tom?.[k] === "x") tone(out, t, k % 3 ? 180 : 120, 0.12, 0.2, "sine", 0.5, to);
    if ((stage === "crisis" || stage === "final") && k === 0 && i % 32 === 0) {
      for (let j = 0; j < 8; j++) tone(out, t + j * dur, j % 2 ? 660 : 520, dur, 0.03, "square", 0, to);
    }
  }
}
function arp(t: number, notes: number[], step: number, vol = 0.14, type = "square") {
  notes.forEach((f, i) => tone(out, t + i * step, f, step * 1.4, vol, type));
}

// Timeline (matches the HyperFrames edit)
play("old-city", "control", 0, 14.5);             // intro + Old City
play("pothole", "control", 14.5, 27);             // HIDRA demolition
play("traffic", "control", 27, 36);               // Ameerpet metro route
play("water", "crisis", 36, 45.5);                // Political Crisis
play("secretariat", "final", 45.5, 53);           // No-confidence motion
arp(53, [440, 415, 392, 370, 349, 330, 311, 294], 0.16, 0.12, "sawtooth"); // CM position lost
play("secretariat", "lost", 54.6, 60);            // outro, slowed
arp(57.2, [523, 659, 784, 1047], 0.1, 0.1);       // closing sting

// fades at the edges, normalise, write 16-bit WAV
let peak = 0;
for (let i = 0; i < out.length; i++) {
  const t = i / SR;
  const fade = Math.min(1, t / 0.6, (TOTAL - t) / 1.2);
  out[i] *= fade;
  peak = Math.max(peak, Math.abs(out[i]));
}
const gain = 0.89 / peak;
const data = Buffer.alloc(out.length * 2);
for (let i = 0; i < out.length; i++) data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, out[i] * gain)) * 32767), i * 2);
const h = Buffer.alloc(44);
h.write("RIFF", 0); h.writeUInt32LE(36 + data.length, 4); h.write("WAVE", 8); h.write("fmt ", 12);
h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(SR, 24);
h.writeUInt32LE(SR * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write("data", 36); h.writeUInt32LE(data.length, 40);
fs.writeFileSync(process.argv[2], Buffer.concat([h, data]));
console.log("wrote", process.argv[2]);

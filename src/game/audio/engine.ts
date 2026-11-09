import type { GovernanceStage, LevelId } from "../logic/types";
import { SONGS, noteFreq, tokens, type Song } from "./songs";

export type SfxName =
  | "coin"
  | "jump"
  | "slide"
  | "lane"
  | "hit"
  | "powerup"
  | "powerupEnd"
  | "token"
  | "fix"
  | "missionStart"
  | "missionComplete"
  | "missionFail"
  | "stageWarn"
  | "stageUp"
  | "fcStart"
  | "fcWon"
  | "fcLost"
  | "bossStart"
  | "bossHit"
  | "bossDefeated"
  | "shield"
  | "cheer"
  | "boo"
  | "click"
  | "gameOver";

interface Parsed {
  lead: string[];
  counter: string[] | null;
  bass: string[];
  song: Song;
}

/**
 * Procedural WebAudio chiptune engine. Zero audio downloads: every note and effect is
 * synthesised at runtime, which keeps the game tiny on low-bandwidth connections.
 * Safe to construct on the server (does nothing until `unlock()` runs in a browser).
 */
export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private parsed: Parsed | null = null;
  private level: LevelId | null = null;
  private step = 0;
  private nextTime = 0;
  private stage: GovernanceStage = "control";
  private boss = false;
  private ambienceTimer = 0;
  musicVolume = 0.6;
  sfxVolume = 0.8;
  muted = false;

  get available() {
    return typeof window !== "undefined" && ("AudioContext" in window || "webkitAudioContext" in window);
  }

  /** Must be called from a user gesture (browser autoplay policy). */
  unlock() {
    if (!this.available) return;
    try {
      if (!this.ctx) {
        const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ctx = new Ctor({ latencyHint: "interactive" });
        this.master = this.ctx.createGain();
        this.master.connect(this.ctx.destination);
        this.musicBus = this.ctx.createGain();
        this.sfxBus = this.ctx.createGain();
        this.musicBus.connect(this.master);
        this.sfxBus.connect(this.master);
        const len = this.ctx.sampleRate;
        this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
        const d = this.noise.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        this.applyVolumes();
      }
      if (this.ctx.state === "suspended") void this.ctx.resume();
    } catch {
      this.ctx = null; // audio is optional – never crash the game
    }
  }

  setVolumes(music: number, sfx: number, muted: boolean) {
    this.musicVolume = music;
    this.sfxVolume = sfx;
    this.muted = muted;
    this.applyVolumes();
  }

  private applyVolumes() {
    if (!this.ctx || !this.master || !this.musicBus || !this.sfxBus) return;
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(this.muted ? 0 : 0.9, t, 0.02);
    this.musicBus.gain.setTargetAtTime(this.musicVolume * 0.45, t, 0.02);
    this.sfxBus.gain.setTargetAtTime(this.sfxVolume * 0.7, t, 0.02);
  }

  suspend() {
    if (this.ctx && this.ctx.state === "running") void this.ctx.suspend();
  }

  resume() {
    if (this.ctx && this.ctx.state === "suspended") void this.ctx.resume();
  }

  // ───────────────────────────── music ─────────────────────────────

  playMusic(level: LevelId) {
    if (!this.ctx) return;
    this.stopMusic();
    const song = SONGS[level];
    this.level = level;
    this.parsed = {
      song,
      lead: tokens(song.lead),
      counter: song.counter ? tokens(song.counter) : null,
      bass: tokens(song.bass),
    };
    this.step = 0;
    this.nextTime = this.ctx.currentTime + 0.08;
    this.timer = setInterval(() => this.schedule(), 25);
  }

  stopMusic() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.parsed = null;
  }

  setStage(stage: GovernanceStage) {
    this.stage = stage;
  }

  setBoss(on: boolean) {
    this.boss = on;
  }

  private get tempoFactor() {
    return { control: 1, pressure: 1.06, crisis: 1.12, final: 1.2, lost: 0.8 }[this.stage] * (this.boss ? 1.05 : 1);
  }

  private schedule() {
    const ctx = this.ctx;
    const p = this.parsed;
    if (!ctx || !p || ctx.state !== "running") return;
    const stepDur = 60 / (p.song.bpm * this.tempoFactor) / 4;
    while (this.nextTime < ctx.currentTime + 0.12) {
      this.playStep(p, this.step, this.nextTime, stepDur);
      this.nextTime += stepDur;
      this.step = (this.step + 1) % p.lead.length;
    }
  }

  private playStep(p: Parsed, step: number, t: number, dur: number) {
    const s = p.song;
    const minor = this.stage === "crisis" || this.stage === "final";
    const shift = minor ? s.minorShift : {};
    const sustain = (arr: string[], i: number) => {
      let n = 1;
      while (arr[(i + n) % arr.length] === "-" && n < 16) n++;
      return n;
    };
    const lead = p.lead[step];
    if (lead && lead !== "." && lead !== "-") {
      const f = noteFreq(lead, shift);
      const len = sustain(p.lead, step) * dur;
      this.tone(s.leadWave, f, t, len * 0.92, 0.12, this.musicBus, this.stage === "final" ? 9 : this.stage === "pressure" ? 4 : 0);
      if (this.stage === "control") this.tone("square", f * 2, t, Math.min(len, dur) * 0.6, 0.02, this.musicBus);
    }
    const ctr = p.counter?.[step];
    if (ctr && ctr !== "." && ctr !== "-") this.tone("triangle", noteFreq(ctr, shift), t, dur * 3, 0.07, this.musicBus);
    const bass = p.bass[step];
    if (bass && bass !== "." && bass !== "-") this.tone(s.bassWave, noteFreq(bass, shift), t, dur * 1.6, 0.16, this.musicBus);

    const k = step % 16;
    const final = this.stage === "final";
    const kickPat = final ? "x..x....x..x...." : s.kick; // heartbeat in the final stage
    if (kickPat[k] === "x") this.kick(t, final ? 0.5 : 0.4);
    if (s.snare[k] === "x") this.noiseHit(t, 0.09, 1800, 0.18);
    const hats = this.stage === "control" ? s.hat : "xxxxxxxxxxxxxxxx";
    if (hats[k] === "x") this.noiseHit(t, 0.03, 8000, this.stage === "control" ? 0.05 : 0.04);
    if (s.tom && s.tom[k] === "x") this.tone("sine", k % 3 ? 180 : 120, t, 0.12, 0.18, this.musicBus, 0, 0.5);
    if (this.boss && k % 4 === 2) this.tone("square", noteFreq("D3", shift), t, dur, 0.05, this.musicBus);
    // crisis alarm pad on every bar
    if ((this.stage === "crisis" || final) && k === 0 && step % 32 === 0) {
      this.sweep(final ? 660 : 520, final ? 880 : 620, t, dur * 8, 0.035, this.musicBus);
    }
    // level ambience stingers
    if (k === 0 && ++this.ambienceTimer % 3 === 0) this.ambience(t);
  }

  private ambience(t: number) {
    switch (this.level) {
      case "traffic":
        if (Math.random() < 0.6) this.honk(t + Math.random() * 0.5, 0.03);
        break;
      case "water":
        this.tone("sine", 1200 + Math.random() * 600, t + Math.random() * 0.4, 0.06, 0.03, this.musicBus, 0, 0.3);
        break;
      case "old-city":
        if (Math.random() < 0.4) this.bell(t + Math.random() * 0.4, 0.025);
        break;
      case "pothole":
        if (Math.random() < 0.4) this.noiseHit(t + Math.random() * 0.4, 0.05, 400, 0.04);
        break;
      case "secretariat":
        if (Math.random() < 0.3) this.noiseHit(t, 0.02, 5000, 0.03);
        break;
    }
  }

  // ───────────────────────────── primitives ─────────────────────────────

  private tone(
    type: OscillatorType,
    freq: number,
    t: number,
    len: number,
    vol: number,
    bus: GainNode | null,
    vibrato = 0,
    pitchDrop = 0,
  ) {
    const ctx = this.ctx;
    if (!ctx || !bus || !freq) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (pitchDrop) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq * pitchDrop), t + len);
    if (vibrato) {
      const lfo = ctx.createOscillator();
      const lg = ctx.createGain();
      lfo.frequency.value = 6;
      lg.gain.value = vibrato;
      lfo.connect(lg).connect(o.frequency);
      lfo.start(t);
      lfo.stop(t + len + 0.05);
    }
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.03, len));
    o.connect(g).connect(bus);
    o.start(t);
    o.stop(t + len + 0.05);
  }

  private sweep(f0: number, f1: number, t: number, len: number, vol: number, bus: GainNode | null, type: OscillatorType = "square") {
    const ctx = this.ctx;
    if (!ctx || !bus) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(f1, t + len);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    o.connect(g).connect(bus);
    o.start(t);
    o.stop(t + len + 0.02);
  }

  private noiseHit(t: number, len: number, filterFreq: number, vol: number, bus = this.musicBus, type: BiquadFilterType = "highpass") {
    const ctx = this.ctx;
    if (!ctx || !bus || !this.noise) return;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = filterFreq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    src.connect(f).connect(g).connect(bus);
    src.start(t, Math.random() * 0.5);
    src.stop(t + len + 0.02);
  }

  private kick(t: number, vol: number) {
    this.tone("sine", 140, t, 0.18, vol, this.musicBus, 0, 0.3);
  }

  private honk(t: number, vol: number, bus = this.musicBus) {
    this.tone("sawtooth", 392, t, 0.16, vol, bus);
    this.tone("sawtooth", 466, t, 0.16, vol * 0.8, bus);
  }

  private bell(t: number, vol: number, bus = this.musicBus) {
    this.tone("sine", 1760, t, 0.4, vol, bus);
    this.tone("sine", 2637, t, 0.25, vol * 0.5, bus);
  }

  // ───────────────────────────── sfx ─────────────────────────────

  sfx(name: SfxName, level?: LevelId | null) {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== "running") return;
    const t = ctx.currentTime + 0.005;
    const B = this.sfxBus;
    const arp = (notes: number[], step: number, type: OscillatorType = "square", vol = 0.15) =>
      notes.forEach((f, i) => this.tone(type, f, t + i * step, step * 1.4, vol, B));
    switch (name) {
      case "coin":
        this.tone("square", 988, t, 0.05, 0.1, B);
        this.tone("square", 1319, t + 0.05, 0.09, 0.1, B);
        break;
      case "jump":
        this.sweep(280, 720, t, 0.16, 0.12, B);
        break;
      case "slide":
        this.noiseHit(t, 0.25, 1200, 0.18, B, "bandpass");
        break;
      case "lane":
        this.tone("triangle", 520, t, 0.04, 0.05, B);
        break;
      case "hit": {
        this.noiseHit(t, 0.22, 300, 0.4, B, "lowpass");
        this.tone("square", 110, t, 0.25, 0.2, B, 0, 0.5);
        const lv = level ?? this.level;
        if (lv === "traffic") this.honk(t + 0.05, 0.12, B);
        else if (lv === "old-city") this.bell(t + 0.05, 0.1, B);
        else if (lv === "water") this.noiseHit(t + 0.03, 0.4, 900, 0.25, B, "bandpass");
        else if (lv === "pothole") this.tone("square", 70, t + 0.03, 0.3, 0.2, B, 0, 0.6);
        else if (lv === "secretariat") this.noiseHit(t + 0.02, 0.3, 4000, 0.2, B);
        break;
      }
      case "powerup":
        arp([523, 659, 784, 1047], 0.06);
        break;
      case "powerupEnd":
        arp([784, 523], 0.07, "triangle", 0.1);
        break;
      case "token":
        arp([880, 1175], 0.05, "triangle", 0.16);
        break;
      case "fix":
        this.tone("square", 220, t, 0.06, 0.15, B);
        arp([660, 880], 0.05, "triangle", 0.12);
        break;
      case "missionStart":
        arp([392, 523, 659], 0.09, "square", 0.12);
        break;
      case "missionComplete":
        arp([523, 659, 784, 1047, 784, 1047], 0.08, "square", 0.14);
        this.cheer(t + 0.1);
        break;
      case "missionFail":
        arp([392, 370, 349, 262], 0.16, "sawtooth", 0.1);
        this.boo(t + 0.1);
        break;
      case "stageWarn":
        for (let i = 0; i < 3; i++) {
          this.tone("square", 880, t + i * 0.3, 0.14, 0.1, B);
          this.tone("square", 660, t + i * 0.3 + 0.15, 0.14, 0.1, B);
        }
        break;
      case "stageUp":
        arp([523, 784, 1047], 0.07, "triangle", 0.14);
        break;
      case "fcStart":
        for (let i = 0; i < 12; i++) this.noiseHit(t + i * 0.05, 0.05, 1500, 0.1 + i * 0.01, B);
        arp([147, 175, 220, 294], 0.15, "sawtooth", 0.12);
        break;
      case "fcWon":
        arp([523, 659, 784, 1047, 1319, 1568], 0.09, "square", 0.15);
        this.cheer(t);
        break;
      case "fcLost":
      case "gameOver":
        arp([440, 415, 392, 370, 349, 330, 311, 294], 0.14, "sawtooth", 0.1);
        this.boo(t + 0.2);
        break;
      case "bossStart":
        this.tone("sawtooth", 98, t, 0.6, 0.2, B, 3);
        this.tone("sawtooth", 147, t + 0.2, 0.6, 0.15, B, 3);
        break;
      case "bossHit":
        this.sweep(1200, 200, t, 0.15, 0.14, B);
        break;
      case "bossDefeated":
        this.noiseHit(t, 0.6, 200, 0.4, B, "lowpass");
        arp([523, 659, 784, 1047, 1319], 0.08, "square", 0.14);
        this.cheer(t + 0.3);
        break;
      case "shield":
        arp([1047, 1319, 1568, 2093], 0.03, "triangle", 0.12);
        break;
      case "cheer":
        this.cheer(t);
        break;
      case "boo":
        this.boo(t);
        break;
      case "click":
        this.tone("square", 1200, t, 0.03, 0.06, B);
        break;
    }
  }

  private cheer(t: number) {
    const ctx = this.ctx;
    if (!ctx || !this.noise || !this.sfxBus) return;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = 1400;
    f.Q.value = 0.8;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.12, t + 0.15);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
    src.connect(f).connect(g).connect(this.sfxBus);
    src.start(t);
    src.stop(t + 1.2);
  }

  private boo(t: number) {
    this.tone("sawtooth", 140, t, 0.7, 0.06, this.sfxBus, 6);
    this.tone("sawtooth", 150, t + 0.05, 0.7, 0.05, this.sfxBus, 5);
    this.noiseHit(t, 0.7, 500, 0.06, this.sfxBus, "lowpass");
  }
}

let shared: AudioEngine | null = null;
export function getAudio(): AudioEngine {
  if (!shared) shared = new AudioEngine();
  return shared;
}

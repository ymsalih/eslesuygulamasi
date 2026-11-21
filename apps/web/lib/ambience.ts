"use client";
/**
 * Köşe fon müziği ve ortam sesleri. Tamamen tarayıcıda üretilir (Web Audio API):
 *  - Saz benzeri tel sesi (Karplus-Strong), çift tel hafif akortsuz → bağlama tınısı
 *  - Makam dizilerinde (Rast, Uşşak, Hicaz...) tohumlu, her köşeye özgü bir ezgi
 *  - Usule göre def (düm / tek)
 *  - Dem tutan pes ses (drone)
 *  - Kafe uğultusu, çay kaşığı şıngırtısı; şehre göre deniz, martı, rüzgâr veya yağmur
 *
 * Kaydedilmiş bir eser çalınmadığı için telif sorunu yoktur.
 */
import { MAKAMS, USULS, seededRandom, type MusicPreset } from "@sark/shared";

type Rand = () => number;

export interface TrackInfo {
  title: string;
  makam: string;
  usul: string;
}

export class Ambience {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private ambBus: GainNode | null = null;
  private timers: number[] = [];
  private nodes: AudioNode[] = [];
  private pluckCache = new Map<number, AudioBuffer>();
  private noise: AudioBuffer | null = null;
  private white: AudioBuffer | null = null;
  private volume = 0.6;
  private running = false;

  get isRunning() {
    return this.running;
  }

  setVolume(v: number) {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(this.volume * 1.1, this.ctx.currentTime, 0.1);
  }

  /** Bir köşenin müziğini başlatır. Kullanıcı etkileşimi içinde çağrılmalıdır (tarayıcı otomatik çalmayı engeller). */
  async start(preset: MusicPreset, seed: number): Promise<TrackInfo> {
    this.stop();
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx ??= new AC();
    if (this.ctx.state === "suspended") await this.ctx.resume();
    const ctx = this.ctx;

    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 3;
    comp.connect(ctx.destination);
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.gain.setTargetAtTime(this.volume * 1.1, ctx.currentTime, 0.8);
    this.master.connect(comp);
    this.musicBus = ctx.createGain();
    this.musicBus.gain.value = 0.9;
    this.musicBus.connect(this.master);
    this.ambBus = ctx.createGain();
    this.ambBus.gain.value = 1;
    this.ambBus.connect(this.master);
    this.nodes.push(comp, this.master, this.musicBus, this.ambBus);
    this.noise ??= this.makeNoise(ctx, 3, true);
    this.white ??= this.makeNoise(ctx, 2, false);
    this.running = true;

    const rand = seededRandom(seed);
    this.startAmbience(preset, rand);
    this.startMusic(preset, rand);

    const makam = MAKAMS[preset.makam].label;
    const usul = USULS[preset.usul].label;
    return { title: `${makam} ezgi no. ${(seed % 97) + 1}`, makam, usul };
  }

  stop() {
    this.running = false;
    this.timers.forEach((t) => clearInterval(t));
    this.timers.forEach((t) => clearTimeout(t));
    this.timers = [];
    if (this.master && this.ctx) {
      const m = this.master;
      m.gain.setTargetAtTime(0, this.ctx.currentTime, 0.15);
      const toStop = this.nodes;
      window.setTimeout(() => toStop.forEach((n) => { try { (n as AudioScheduledSourceNode).stop?.(); } catch {} try { n.disconnect(); } catch {} }), 600);
    }
    this.nodes = [];
    this.master = null;
  }

  /** Çay bardağına kaşık değmesi. Çay ikramlarında da çalınır. */
  clink(gain = 0.05) {
    if (!this.ctx || !this.ambBus || !this.running) return;
    const ctx = this.ctx;
    const t = ctx.currentTime + 0.01;
    for (const [f, g] of [[2900 + Math.random() * 500, 1], [4600 + Math.random() * 600, 0.5], [6800, 0.2]] as const) {
      const o = ctx.createOscillator();
      const e = ctx.createGain();
      o.frequency.value = f;
      e.gain.setValueAtTime(gain * g, t);
      e.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      o.connect(e).connect(this.ambBus);
      o.start(t);
      o.stop(t + 0.55);
    }
  }

  /* ---------------- Müzik ---------------- */

  private startMusic(preset: MusicPreset, rand: Rand) {
    const ctx = this.ctx!;
    const makam = MAKAMS[preset.makam];
    const pattern = USULS[preset.usul].pattern;
    const bpm = preset.bpm + Math.round((rand() - 0.5) * 8);
    const eighth = 60 / bpm / 2;
    const steps = pattern.length;

    // Perdeler: karar perdesinden 1,5 oktav (0..10)
    const degreeHz = (d: number) => {
      const oct = Math.floor(d / 7);
      const cents = makam.cents[d % 7] + oct * 1200;
      return makam.tonicHz * 2 * Math.pow(2, cents / 1200);
    };

    // Ezgi: A A' B A(karar) yapısında, tohumlu
    const bar = (start: number, end: number | null): (number | null)[] => {
      const out: (number | null)[] = [];
      let d = start;
      for (let i = 0; i < steps * 2; i++) {
        const strong = pattern[i % steps] === "D" || i === 0;
        if (!strong && rand() < 0.35) {
          out.push(null);
          continue;
        }
        const moves = [-2, -1, -1, 0, 1, 1, 2];
        d = Math.max(0, Math.min(10, d + moves[Math.floor(rand() * moves.length)]));
        out.push(d);
      }
      if (end !== null) {
        // Kararla bitir: son notalar karar perdesine iner
        const last = out.length - 1;
        out[last] = null;
        out[last - 1] = end;
        if (out[last - 2] !== null) out[last - 2] = end + 1;
      }
      return out;
    };
    const A = bar(4, null);
    const A2 = A.map((n) => (n !== null && rand() < 0.25 ? Math.max(0, Math.min(10, n + (rand() < 0.5 ? -1 : 1))) : n));
    const B = bar(7, 4);
    const A3 = [...A.slice(0, A.length - 3), 2, 0, null];
    const song = [...A, ...A2, ...B, ...A3];

    this.startDrone(makam.tonicHz);

    let step = 0;
    let nextTime = ctx.currentTime + 0.3;
    const tick = () => {
      if (!this.running) return;
      while (nextTime < ctx.currentTime + 0.25) {
        const beat = pattern[step % steps];
        if (beat === "D") this.dum(nextTime);
        else if (beat === "T") this.tek(nextTime, 0.11);
        else if (beat === "k") this.tek(nextTime, 0.05);
        const note = song[step % song.length];
        if (note !== null && note !== undefined) {
          const f = degreeHz(note);
          this.pluck(f, nextTime, 0.16);
          // Ara sıra sazdaki gibi tez tez vuruş (tremolo)
          if (rand() < 0.12) this.pluck(f, nextTime + eighth / 2, 0.1);
        }
        nextTime += eighth;
        step++;
      }
    };
    this.timers.push(window.setInterval(tick, 50));
  }

  private startDrone(tonic: number) {
    const ctx = this.ctx!;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 500;
    const g = ctx.createGain();
    g.gain.value = 0.02;
    lp.connect(g).connect(this.musicBus!);
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.07;
    lfoGain.gain.value = 0.008;
    lfo.connect(lfoGain).connect(g.gain);
    lfo.start();
    this.nodes.push(lp, g, lfo, lfoGain);
    for (const f of [tonic / 2, (tonic / 2) * 1.5, tonic / 2 + 0.4]) {
      const o = ctx.createOscillator();
      o.type = "triangle";
      o.frequency.value = f;
      o.connect(lp);
      o.start();
      this.nodes.push(o);
    }
  }

  /** Karplus-Strong tel sesi. Bağlamadaki gibi çift tel, hafif akortsuz. */
  private pluck(freq: number, when: number, gain: number) {
    const ctx = this.ctx!;
    for (const detune of [0, 4]) {
      const src = ctx.createBufferSource();
      src.buffer = this.pluckBuffer(freq * Math.pow(2, detune / 1200));
      const g = ctx.createGain();
      g.gain.value = gain * (detune ? 0.6 : 1);
      const pan = ctx.createStereoPanner();
      pan.pan.value = detune ? 0.25 : -0.15;
      src.connect(g).connect(pan).connect(this.musicBus!);
      src.start(when);
    }
  }

  private pluckBuffer(freq: number): AudioBuffer {
    const key = Math.round(freq * 10);
    const cached = this.pluckCache.get(key);
    if (cached) return cached;
    const ctx = this.ctx!;
    const sr = ctx.sampleRate;
    const len = Math.floor(sr * 1.6);
    const buf = ctx.createBuffer(1, len, sr);
    const d = buf.getChannelData(0);
    const N = Math.max(2, Math.round(sr / freq));
    let prev = 0;
    for (let i = 0; i < N; i++) {
      // Biraz yumuşatılmış gürültü: mızrap vuruşu
      const n = Math.random() * 2 - 1;
      prev = prev * 0.5 + n * 0.5;
      d[i] = prev;
    }
    const decay = 0.9965;
    for (let i = N; i < len; i++) d[i] = (d[i - N] + d[i - N + 1]) * 0.5 * decay;
    this.pluckCache.set(key, buf);
    return buf;
  }

  private dum(when: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.setValueAtTime(120, when);
    o.frequency.exponentialRampToValueAtTime(52, when + 0.18);
    g.gain.setValueAtTime(0.32, when);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.35);
    o.connect(g).connect(this.musicBus!);
    o.start(when);
    o.stop(when + 0.4);
  }

  private tek(when: number, gain: number) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.white;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 2600;
    bp.Q.value = 1.2;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, when);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.07);
    src.connect(bp).connect(g).connect(this.musicBus!);
    src.start(when, Math.random() * 1.5);
    src.stop(when + 0.1);
  }

  /* ---------------- Ortam sesleri ---------------- */

  private startAmbience(preset: MusicPreset, rand: Rand) {
    const ctx = this.ctx!;
    // Kafe uğultusu
    this.noiseLayer("lowpass", 380, 0.02);
    // Ara sıra çay kaşığı şıngırtısı
    const clinkLoop = () => {
      if (!this.running) return;
      this.clink(0.03 + Math.random() * 0.02);
      this.timers.push(window.setTimeout(clinkLoop, 9000 + Math.random() * 16000));
    };
    this.timers.push(window.setTimeout(clinkLoop, 4000 + rand() * 4000));

    if (preset.ambience.sea) {
      const g = this.noiseLayer("lowpass", 520, 0.0);
      const lfo = ctx.createOscillator();
      const lg = ctx.createGain();
      lfo.frequency.value = 0.11;
      lg.gain.value = 0.03;
      lfo.connect(lg).connect(g.gain);
      g.gain.value = 0.035;
      lfo.start();
      this.nodes.push(lfo, lg);
    }
    if (preset.ambience.rain) this.noiseLayer("highpass", 1800, 0.012, true);
    if (preset.ambience.wind) {
      const g = this.noiseLayer("bandpass", 450, 0.03);
      const lfo = ctx.createOscillator();
      const lg = ctx.createGain();
      lfo.frequency.value = 0.05;
      lg.gain.value = 0.02;
      lfo.connect(lg).connect(g.gain);
      lfo.start();
      this.nodes.push(lfo, lg);
    }
    if (preset.ambience.gulls) {
      const gullLoop = () => {
        if (!this.running) return;
        this.gull(ctx.currentTime + 0.05);
        if (Math.random() < 0.6) this.gull(ctx.currentTime + 0.45);
        this.timers.push(window.setTimeout(gullLoop, 14000 + Math.random() * 22000));
      };
      this.timers.push(window.setTimeout(gullLoop, 6000));
    }
  }

  private noiseLayer(type: BiquadFilterType, freq: number, gain: number, white = false): GainNode {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = white ? this.white : this.noise;
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.value = gain;
    src.connect(f).connect(g).connect(this.ambBus!);
    src.start();
    this.nodes.push(src, f, g);
    return g;
  }

  private gull(when: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sawtooth";
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 2400;
    o.frequency.setValueAtTime(1500, when);
    o.frequency.linearRampToValueAtTime(2100, when + 0.08);
    o.frequency.linearRampToValueAtTime(1300, when + 0.32);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(0.012, when + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.34);
    o.connect(lp).connect(g).connect(this.ambBus!);
    o.start(when);
    o.stop(when + 0.36);
  }

  /** brown = true: kahverengi gürültü (yumuşak uğultu), false: beyaz gürültü (def, yağmur) */
  private makeNoise(ctx: AudioContext, seconds: number, brown: boolean): AudioBuffer {
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      if (brown) {
        last = (last + 0.02 * white) / 1.02;
        d[i] = last * 3.5;
      } else d[i] = white * 0.5;
    }
    return buf;
  }
}

/** Oda kimliğinden müzik tohumu: her köşenin kendine özgü ezgisi olur. */
export function seedFromId(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return h >>> 0;
}

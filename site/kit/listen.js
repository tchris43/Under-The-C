// @ts-check
/**
 * Listening to a real piano, one note at a time, on the device itself.
 * The microphone starts only after a tap, and the browser asks permission first. Sound is turned into note
 * numbers right here and thrown away: nothing is recorded, saved or sent anywhere.
 */
import { Sound } from './sound.js';

/**
 * The pitch in one window of sound (at least 2048 samples), using the YIN method.
 * Finds notes from about C3 to C7. Returns null when there is no clear note.
 * @param {Float32Array} buf  @param {number} sampleRate
 * @returns {{ freq: number, clarity: number } | null}
 */
export function detectPitch(buf, sampleRate) {
  const W = 1024, minT = Math.floor(sampleRate / 1100), maxT = Math.min(W - 1, Math.ceil(sampleRate / 120));
  if (buf.length < W + maxT + 2) return null;
  const c = new Float32Array(maxT + 2);
  let run = 0;
  c[0] = 1;
  for (let t = 1; t <= maxT + 1; t++) {
    let s = 0;
    for (let i = 0; i < W; i++) { const x = buf[i] - buf[i + t]; s += x * x; }
    run += s; c[t] = run ? s * t / run : 1;
  }
  let best = -1, bestV = 1;
  for (let t = minT; t <= maxT; t++) {
    if (c[t] < 0.15) { while (t + 1 <= maxT && c[t + 1] < c[t]) t++; best = t; bestV = c[t]; break; }
    if (c[t] < bestV) { bestV = c[t]; best = t; }
  }
  if (best < 1 || bestV > 0.3) return null;
  const a = c[best - 1], b = c[best], e = c[best + 1], den = a - 2 * b + e;
  const tau = den ? best + (a - e) / (2 * den) : best;
  return { freq: sampleRate / tau, clarity: 1 - bestV };
}

/** Frequency to the nearest piano key number (MIDI: middle C = 60). */
export const midiOf = (/** @type {number} */ freq) => Math.round(69 + 12 * Math.log2(freq / 440));

/**
 * Turns frames of microphone sound into notes. A note counts when the sound suddenly gets louder (a key was
 * struck) and a steady pitch follows, so the same key played twice counts twice and a ringing note counts once.
 * @param {(midi: number, at: number) => void} onNote  called with the key and the time it was struck
 */
export function noteTracker(onNote) {
  /** @type {number[]} */
  const hist = [];
  let noise = 0.01, lastOnset = -1e9;
  /** @type {{ at: number, from: number, until: number, last: number, n: number } | null} */
  let pending = null;
  return {
    /**
     * @param {Float32Array} buf  the latest window of sound
     * @param {number} sampleRate  @param {number} now  time in ms
     * @param {boolean} [muted]  true while the app itself is making a sound
     * @returns {number} how loud it is, for a level meter
     */
    frame(buf, sampleRate, now, muted = false) {
      let sq = 0;
      for (let i = 0; i < buf.length; i++) sq += buf[i] * buf[i];
      const rms = Math.sqrt(sq / buf.length);
      noise = rms < noise ? rms : noise * 1.003 + 1e-6;
      hist.push(rms); if (hist.length > 6) hist.shift();
      if (muted) { pending = null; return rms; }
      if (rms > Math.max(0.005, noise * 2.2) && rms > hist[0] * 1.25 && now - lastOnset > 110) {
        lastOnset = now;
        // Wait until the window holds only the new note, or the last note's ring is heard instead.
        pending = { at: now, from: now + 1000 * buf.length / sampleRate, until: now + 320, last: -1, n: 0 };
      }
      if (pending && now >= pending.from) {
        const p = detectPitch(buf, sampleRate);
        if (p) {
          const m = midiOf(p.freq);
          if (m === pending.last) pending.n++; else { pending.last = m; pending.n = 1; }
          if (pending.n >= 2) { const at = pending.at; pending = null; onNote(m, at); return rms; }
        }
        if (now > pending.until) { const { last, at } = pending; pending = null; if (last > 0) onNote(last, at); }
      }
      return rms;
    },
  };
}

let quietUntil = 0;
/** Ignore the microphone for a moment while the app itself makes a sound, so it doesn't hear itself. */
export const hush = (/** @type {number} */ ms) => { quietUntil = Math.max(quietUntil, performance.now() + ms); };

/**
 * Start listening. Call it straight from a tap. Rejects with the browser's error (name 'NotAllowedError' when
 * the microphone isn't allowed, 'NotSupportedError' when this browser can't listen here).
 * @param {{ onNote: (midi: number, at: number) => void, onLevel?: (rms: number) => void }} handlers
 * @returns {Promise<{ stop: () => void }>}
 */
export async function listen({ onNote, onLevel }) {
  const ctx = Sound.ensure(); // unlock audio inside the tap, before waiting for permission
  if (!ctx || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw Object.assign(new Error('This browser can’t listen here'), { name: 'NotSupportedError' });
  }
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
  if (ctx.state === 'suspended') await ctx.resume();
  const an = ctx.createAnalyser();
  an.fftSize = 2048;
  const src = ctx.createMediaStreamSource(stream);
  src.connect(an);
  const buf = new Float32Array(an.fftSize), tracker = noteTracker(onNote);
  let on = true, raf = 0;
  const tick = (/** @type {number} */ now) => {
    if (!on) return;
    an.getFloatTimeDomainData(buf);
    const level = tracker.frame(buf, ctx.sampleRate, now, now < quietUntil);
    if (onLevel) onLevel(level);
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return { stop() { on = false; cancelAnimationFrame(raf); src.disconnect(); stream.getTracks().forEach(t => t.stop()); } };
}

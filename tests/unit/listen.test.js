// Listening (site/kit/listen.js): hearing piano notes, one at a time, from made-up piano sound.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectPitch, midiOf, noteTracker } from '../../site/kit/listen.js';

const SR = 48000;
/** A piano-like note: a few slightly stretched overtones that fade, with a sharp start. */
function pianoNote(midi, seconds, loud = 1) {
  const f = 440 * 2 ** ((midi - 69) / 12), n = Math.floor(SR * seconds), out = new Float32Array(n);
  const parts = [[1, 1], [2, .6], [3, .35], [4, .2], [5, .12], [6, .08], [7, .05]];
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    let y = 0;
    for (const [k, a] of parts) { const fk = f * k * Math.sqrt(1 + 0.0004 * k * k); if (fk < SR / 2) y += a * Math.sin(2 * Math.PI * fk * t) * Math.exp(-t * (1.2 + 0.5 * k)); }
    out[i] = loud * 0.3 * y * Math.min(1, t / 0.004);
  }
  return out;
}
/**
 * Notes struck one after another, with a little room noise. Each note keeps ringing under the next,
 * as with the pedal down, unless `lift` is set: then each key is let go as the next is struck, like real fingers.
 */
function played(notes, beat, { lift = false, seed = 7 } = {}) {
  let r = seed;
  const rand = () => ((r = (r * 1103515245 + 12345) % 2147483648) / 2147483648) - .5;
  const total = Math.floor(SR * (0.5 + notes.reduce((a, [, b]) => a + b, 0) * beat + 1.5)), out = new Float32Array(total);
  let pos = Math.floor(SR * 0.5);
  for (const [m, b] of notes) {
    const tone = pianoNote(m, 2.5), held = lift ? Math.floor(SR * b * beat) : tone.length, fade = Math.floor(SR * .03);
    for (let i = 0; i < Math.min(tone.length, held + fade) && pos + i < total; i++) out[pos + i] += tone[i] * (i < held ? 1 : 1 - (i - held) / fade);
    pos += Math.floor(SR * b * beat);
  }
  for (let i = 0; i < total; i++) out[i] += rand() * 0.004;
  return out;
}
/** Feed sound to the tracker the way the page does: a 2048-sample window about every 16 ms. */
function listenTo(sound, mutedUntilMs = -1) {
  const heard = [], tracker = noteTracker(m => heard.push(m));
  for (let start = 0; start + 2048 <= sound.length; start += 768) {
    const now = (start + 2048) / SR * 1000;
    tracker.frame(sound.subarray(start, start + 2048), SR, now, now < mutedUntilMs);
  }
  return heard;
}

test('hears every white and black key from low C to high C exactly', () => {
  for (let m = 48; m <= 84; m++) {
    const p = detectPitch(pianoNote(m, 0.2).subarray(2400, 2400 + 2048), SR);
    assert.ok(p, `no pitch for ${m}`);
    assert.equal(midiOf(p.freq), m);
  }
});

test('silence and noise give no note', () => {
  assert.equal(detectPitch(new Float32Array(2048), SR), null);
  let r = 1;
  const noise = Float32Array.from({ length: 2048 }, () => ((r = (r * 16807) % 2147483647) / 2147483647 - .5) * .2);
  assert.equal(detectPitch(noise, SR), null);
  assert.deepEqual(listenTo(new Float32Array(SR)), []);
});

test('a played line gives one note per key struck, repeated notes included', () => {
  const lightlyRow = [[67, 1], [64, 1], [64, 2], [65, 1], [62, 1], [62, 2], [60, 1], [62, 1], [64, 1], [65, 1], [67, 1], [67, 1], [67, 2]];
  assert.deepEqual(listenTo(played(lightlyRow, .5)), lightlyRow.map(([m]) => m));
});

test('quick notes, fingers lifting between them, and a jump down an octave are heard', () => {
  const line = [[60, .5], [62, .5], [64, .5], [65, .5], [67, 1], [55, 1], [48, 2]];
  assert.deepEqual(listenTo(played(line, .4, { lift: true })), line.map(([m]) => m));
});

test('nothing is heard while the app is making a sound', () => {
  const line = [[60, 1], [64, 1], [67, 1]];
  const sound = played(line, .5);
  assert.deepEqual(listenTo(sound, 1e9), []);
  // muted through the first two notes: only the third is heard
  assert.deepEqual(listenTo(sound, 1350), [67]);
});

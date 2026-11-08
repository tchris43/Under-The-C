// The rules behind the shared settings screen (site/kit/settings.js). No browser needed.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HANDS } from '../../site/kit/notes.js';
import * as S from '../../site/kit/settings.js';
import { notesFromIds, idsOf, handOf, pianoKeys, hasStepOrSkip, loadSettings, saveSettings, checkSettings } from '../../site/kit/settings.js';

/** A pretend device memory, like `memory` in kit/ui.js. */
function fakeStore(/** @type {Record<string, string>} */ start = {}) {
  const data = { ...start };
  return { data, get: (/** @type {string} */ k, /** @type {string} */ f) => data[k] ?? f, set: (/** @type {string} */ k, /** @type {string} */ v) => { data[k] = v; } };
}
const LEFT = [...HANDS.left], RIGHT = [...HANDS.right], BOTH = [...HANDS.both];

test('1. needs at least two friends to play', () => {
  assert.equal(checkSettings({ pool: [3], level: 1 }), 'Choose at least 2 friends');
  assert.equal(checkSettings({ pool: [], level: 1 }), 'Choose at least 2 friends');
  assert.equal(checkSettings({ pool: [3, 4], level: 1 }), '');
});

test('2. the chosen friends are shared: saved in Note Flash, read by Who Lives Here?', () => {
  const store = fakeStore();
  saveSettings('flash', { pool: [1, 2, 7], mode: 'pad', letters: true, level: 1 }, store);
  assert.deepEqual(loadSettings('who', store).pool, [1, 2, 7]);
});

test('3. answer mode, letters and level are saved per game', () => {
  const store = fakeStore();
  saveSettings('flash', { pool: LEFT, mode: 'piano', letters: false, level: 1 }, store);
  saveSettings('who', { pool: LEFT, mode: 'pad', letters: true, level: 2 }, store);
  const flash = loadSettings('flash', store), who = loadSettings('who', store);
  assert.equal(flash.mode, 'piano'); assert.equal(flash.letters, false); assert.equal(flash.level, 1);
  assert.equal(who.mode, 'pad'); assert.equal(who.letters, true); assert.equal(who.level, 2);
});

test('4. unknown or repeated friend names in saved data are dropped, and friends come back low to high', () => {
  assert.deepEqual(notesFromIds('gracie,coco,nobody,coco, charlie'), [0, 7, 11]);
  assert.deepEqual(notesFromIds(''), []);
  assert.deepEqual(notesFromIds(null), []);
  assert.equal(idsOf([7, 0]), 'coco,charlie');
  assert.deepEqual(notesFromIds(idsOf(BOTH)), BOTH);
});

test('5. broken saved data falls back to the defaults', () => {
  const store = fakeStore({ friends: 'nobody,<b>', 'flash-mode': 'banjo', 'flash-letters': '???', 'flash-level': '7' });
  assert.deepEqual(loadSettings('flash', store), { pool: LEFT, mode: 'pad', letters: true, level: 1 });
});

test('6. with no saved friends, the old hand choice is used: Note Flash first, then Who Lives Here?', () => {
  assert.deepEqual(loadSettings('who', fakeStore({ 'flash-hand': 'right', 'who-hand': 'both' })).pool, RIGHT);
  assert.deepEqual(loadSettings('flash', fakeStore({ 'who-hand': 'both' })).pool, BOTH);
  assert.deepEqual(loadSettings('flash', fakeStore({ 'who-hand': 'sideways' })).pool, LEFT);
  assert.deepEqual(loadSettings('flash', fakeStore({ friends: 'coco,daisy', 'flash-hand': 'right' })).pool, [0, 1]);
});

test('7. a hand shortcut lights up only when the friends are exactly that hand', () => {
  assert.equal(handOf(LEFT), 'left');
  assert.equal(handOf([...RIGHT].reverse()), 'right');
  assert.equal(handOf(BOTH), 'both');
  assert.equal(handOf([0, 1, 2, 7]), '');
  assert.equal(handOf([]), '');
});

test('8. Level 2 needs at least one pair of chosen friends a step or skip apart', () => {
  assert.equal(hasStepOrSkip([2, 3]), true);    // E to F: a step
  assert.equal(hasStepOrSkip([2, 4]), true);    // E to G: a skip
  assert.equal(hasStepOrSkip([0, 4, 11]), false); // C, G, G: no step or skip
  assert.equal(checkSettings({ pool: [2, 3], level: 2 }), '');
});

test('9. when Level 2 is not possible, the reason is given so the screen can show it', () => {
  const why = checkSettings({ pool: [0, 4, 11], level: 2 });
  assert.match(why, /step or skip/);
  assert.equal(checkSettings({ pool: [0, 4, 11], level: 1 }), '', 'the same friends are fine for Level 1');
});

test('10. the piano shows the whole hand, or both hands when the friends cross middle C', () => {
  assert.deepEqual(pianoKeys([1, 2]), LEFT);
  assert.deepEqual(pianoKeys([7, 9]), RIGHT);
  assert.deepEqual(pianoKeys([6, 8]), BOTH);
});

test('11. a game saves only the settings it has (friends are always saved)', () => {
  const store = fakeStore();
  saveSettings('flash', { pool: [1, 2], mode: 'piano', letters: false, level: 1 }, store, ['mode', 'letters']);
  saveSettings('who', { pool: [1, 2], mode: 'pad', letters: true, level: 2 }, store, ['level']);
  assert.deepEqual(Object.keys(store.data).sort(), ['flash-letters', 'flash-mode', 'friends', 'who-level']);
});

const sameSettings = (/** @type {any} */ a, /** @type {any} */ b) => S.sameSettings(a, b);

test('12. settings that are the same as before count as unchanged, so Play can go back to the game', () => {
  const a = { pool: [1, 2], mode: 'pad', letters: true, level: 1 };
  assert.equal(sameSettings(a, { ...a, pool: [1, 2] }), true);
  assert.equal(sameSettings(a, { ...a, pool: [1, 3] }), false);
  assert.equal(sameSettings(a, { ...a, level: 2 }), false);
  assert.equal(sameSettings(a, { ...a, mode: 'piano' }), false);
  assert.equal(sameSettings(a, { ...a, letters: false }), false);
});

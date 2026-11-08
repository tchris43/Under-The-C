// @ts-check
/**
 * The rules behind the shared settings screen: defaults, loading, saving and checking.
 * No DOM here, so every rule is unit tested (tests/unit/settings.test.js). kit/setup.js draws the screen.
 *
 * The chosen friends are shared by every game (one student, one set of notes).
 * Answer mode, letters on keys and level are saved per game.
 * Saved keys (through `memory` in kit/ui.js): `friends`, and `<game>-mode`, `<game>-letters`, `<game>-level`.
 *
 * @typedef {'pad' | 'piano'} Mode
 * @typedef {{ pool: number[], mode: Mode, letters: boolean, level: 1 | 2 }} Settings
 * @typedef {{ get(key: string, fallback: string): string, set(key: string, value: string): void }} Store
 */
import { NOTES, HANDS, MIDDLE_C, intervalKind } from './notes.js';

/**
 * Note indexes for a saved list of friend ids ("coco,daisy"), low to high. Unknown and repeated ids are dropped.
 * @param {string | null | undefined} text
 * @returns {number[]}
 */
export function notesFromIds(text) {
  const ids = String(text || '').split(',').map(s => s.trim());
  return NOTES.map((n, i) => (ids.includes(n.id) ? i : -1)).filter(i => i >= 0);
}

/** Friend ids for a set of note indexes, low to high, for saving. @param {readonly number[]} pool */
export const idsOf = pool => [...pool].sort((a, b) => a - b).map(i => NOTES[i].id).join(',');

/**
 * Which hand shortcut a set of friends is exactly, or '' for a custom set.
 * @param {readonly number[]} pool
 * @returns {'left' | 'right' | 'both' | ''}
 */
export function handOf(pool) {
  for (const hand of /** @type {const} */ (['left', 'right', 'both'])) {
    const notes = HANDS[hand];
    if (notes.length === pool.length && notes.every(i => pool.includes(i))) return hand;
  }
  return '';
}

/**
 * The piano keys to show: the left-hand keys, the right-hand keys, or all twelve when the friends cross middle C,
 * so finding the exact key stays a real challenge however few friends are chosen.
 * @param {readonly number[]} pool
 * @returns {number[]}
 */
export function pianoKeys(pool) {
  const lo = Math.min(...pool), hi = Math.max(...pool);
  if (hi <= MIDDLE_C) return [...HANDS.left];
  if (lo >= MIDDLE_C) return [...HANDS.right];
  return [...HANDS.both];
}

/** True when at least two of the friends are a step or a skip apart (needed for Level 2). @param {readonly number[]} pool */
export function hasStepOrSkip(pool) {
  return pool.some(a => pool.some(b => a !== b && intervalKind(a, b) !== null));
}

/** @param {string} hand */
const handPool = hand => (hand === 'left' || hand === 'right' || hand === 'both' ? [...HANDS[hand]] : null);

/**
 * This device's last choices for a game, with safe defaults for anything missing or broken.
 * With no saved friends yet, the old per-game hand choice is used (Note Flash first, then Who Lives Here?).
 * @param {string} game  e.g. 'flash' or 'who'
 * @param {Store} store
 * @returns {Settings}
 */
export function loadSettings(game, store) {
  let pool = notesFromIds(store.get('friends', ''));
  if (pool.length < 2) pool = handPool(store.get('flash-hand', '')) || handPool(store.get('who-hand', '')) || [...HANDS.left];
  return {
    pool,
    mode: store.get(`${game}-mode`, 'pad') === 'piano' ? 'piano' : 'pad',
    letters: store.get(`${game}-letters`, 'on') !== 'off',
    level: store.get(`${game}-level`, '1') === '2' ? 2 : 1,
  };
}

/**
 * Remember the choices on this device: friends for every game, and only the settings this game has.
 * @param {string} game  @param {Settings} s  @param {Store} store
 * @param {readonly ('mode' | 'letters' | 'level')[]} [options]  the settings this game shows
 */
export function saveSettings(game, s, store, options = ['mode', 'letters', 'level']) {
  store.set('friends', idsOf(s.pool));
  if (options.includes('mode')) store.set(`${game}-mode`, s.mode);
  if (options.includes('letters')) store.set(`${game}-letters`, s.letters ? 'on' : 'off');
  if (options.includes('level')) store.set(`${game}-level`, String(s.level));
}

/** True when nothing a player can choose has changed, so Play can go back to the game in progress. @param {Settings} a  @param {Settings} b */
export const sameSettings = (a, b) =>
  idsOf(a.pool) === idsOf(b.pool) && a.mode === b.mode && a.letters === b.letters && a.level === b.level;

/**
 * Why these settings can't be played yet, or '' when they can.
 * @param {{ pool: readonly number[], level: number }} s
 */
export function checkSettings(s) {
  if (s.pool.length < 2) return 'Choose at least 2 friends';
  if (s.level === 2 && !hasStepOrSkip(s.pool)) return 'Level 2 needs two friends that are a step or skip apart';
  return '';
}

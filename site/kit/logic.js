// @ts-check
/**
 * Pure game logic shared by the games: what to ask next and which answers to offer.
 * No DOM here, so every function is unit tested (tests/unit/logic.test.js).
 * `rand` is injectable so tests can make the choices repeatable.
 */
import { NOTES, intervalKind } from './notes.js';

/** @typedef {() => number} Rand */

/**
 * @template T
 * @param {readonly T[]} items
 * @param {Rand} [rand]
 * @returns {T}
 */
export function pick(items, rand = Math.random) {
  if (items.length === 0) throw new Error('pick() needs at least one item');
  return items[Math.min(items.length - 1, Math.floor(rand() * items.length))];
}

/**
 * @template T
 * @param {T[]} items  shuffled in place and returned
 * @param {Rand} [rand]
 */
export function shuffle(items, rand = Math.random) {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

/**
 * The next note to ask about: any note in the pool except the one just asked, so no note repeats twice in a row.
 * @param {readonly number[]} pool  note indexes
 * @param {number} last  index asked last time, or -1
 * @param {Rand} [rand]
 */
export function nextNote(pool, last, rand = Math.random) {
  const options = pool.length > 1 ? pool.filter(i => i !== last) : pool;
  return pick(options, rand);
}

/**
 * Two notes that are a step or a skip apart, both inside the pool. About half steps, half skips.
 * @param {readonly number[]} pool
 * @param {string} lastKey  the previous pair as "a,b", so the same pair doesn't come twice in a row
 * @param {Rand} [rand]
 * @returns {[number, number]}
 */
export function nextPair(pool, lastKey, rand = Math.random) {
  const want = rand() < 0.5 ? 'step' : 'skip';
  /** @type {[number, number][]} */
  const all = [];
  for (const a of pool) for (const b of pool) if (a !== b && intervalKind(a, b)) all.push([a, b]);
  const wanted = all.filter(([a, b]) => intervalKind(a, b) === want);
  const choices = wanted.length ? wanted : all;
  const fresh = choices.filter(p => p.join() !== lastKey);
  return pick(fresh.length ? fresh : choices, rand);
}

/**
 * Animal answer cards for a note: the right friend, a next-door neighbour when there is one
 * (the tricky distractor), then others from the pool, then from outside it. All different.
 * @param {number} target
 * @param {readonly number[]} pool
 * @param {number} count
 * @param {Rand} [rand]
 */
export function animalChoices(target, pool, count, rand = Math.random) {
  const others = NOTES.map((_, i) => i).filter(i => i !== target);
  const near = others.filter(i => Math.abs(i - target) === 1 && pool.includes(i));
  /** @type {number[]} */
  const opts = [target];
  if (near.length) opts.push(pick(near, rand));
  const rest = others.filter(i => !opts.includes(i));
  const inPool = shuffle(rest.filter(i => pool.includes(i)), rand);
  const outPool = shuffle(rest.filter(i => !pool.includes(i)), rand);
  for (const i of [...inPool, ...outPool]) {
    if (opts.length >= count) break;
    opts.push(i);
  }
  return shuffle(opts, rand);
}

// What the games ask and which answers they offer.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NOTES, HANDS, intervalKind } from '../../site/kit/notes.js';
import { pick, shuffle, nextNote, nextPair, animalChoices } from '../../site/kit/logic.js';
import { charSVG } from '../../site/kit/characters.js';

/** Repeatable "random" numbers for tests. */
function seeded(seed = 1) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

test('pick never goes out of range, even when rand returns 1', () => {
  assert.equal(pick(['a', 'b'], () => 0.9999999), 'b');
  assert.equal(pick(['a', 'b'], () => 1), 'b');
  assert.throws(() => pick([]));
});

test('shuffle keeps every item', () => {
  const out = shuffle([1, 2, 3, 4, 5], seeded(3));
  assert.deepEqual([...out].sort(), [1, 2, 3, 4, 5]);
});

for (const [hand, pool] of Object.entries(HANDS)) {
  test(`nextNote stays in the ${hand}-hand notes and never repeats twice in a row`, () => {
    const rand = seeded(7);
    let last = -1;
    for (let r = 0; r < 300; r++) {
      const n = nextNote(pool, last, rand);
      assert.ok(pool.includes(n));
      assert.notEqual(n, last);
      last = n;
    }
  });

  test(`nextPair gives steps and skips inside the ${hand}-hand notes`, () => {
    const rand = seeded(11);
    const kinds = new Set();
    let lastKey = '';
    for (let r = 0; r < 300; r++) {
      const [a, b] = nextPair(pool, lastKey, rand);
      assert.ok(pool.includes(a) && pool.includes(b));
      const kind = intervalKind(a, b);
      assert.ok(kind === 'step' || kind === 'skip');
      kinds.add(kind);
      assert.notEqual(`${a},${b}`, lastKey);
      lastKey = `${a},${b}`;
    }
    assert.deepEqual([...kinds].sort(), ['skip', 'step'], 'both kinds show up');
  });

  test(`animalChoices offers 3 different friends including the right one (${hand} hand)`, () => {
    const rand = seeded(5);
    for (const target of pool) {
      const opts = animalChoices(target, pool, 3, rand);
      assert.equal(opts.length, 3);
      assert.equal(new Set(opts).size, 3);
      assert.ok(opts.includes(target));
    }
  });
}

test('animalChoices includes a next-door neighbour as the tricky option when one is in the pool', () => {
  const rand = seeded(9);
  for (const target of HANDS.left) {
    const opts = animalChoices(target, HANDS.left, 3, rand);
    assert.ok(opts.some(i => Math.abs(i - target) === 1), NOTES[target].name);
  }
});

test('every friend has a drawing', () => {
  for (const n of NOTES) assert.match(charSVG(n.id), /<(path|circle|ellipse)/, n.id);
  assert.equal(charSVG('nobody'), '');
});

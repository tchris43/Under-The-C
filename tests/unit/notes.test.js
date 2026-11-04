// Music facts every game relies on. If one of these fails, a game would teach the wrong thing.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NOTES, HANDS, LETTERS, MIDDLE_C, stemUp, spatialX, intervalKind, yOf } from '../../site/kit/notes.js';

const byId = Object.fromEntries(NOTES.map((n, i) => [n.id, i]));

test('there are 12 friends from low C (C3) up to treble G (G4), in order', () => {
  assert.equal(NOTES.length, 12);
  assert.deepEqual(NOTES.map(n => n.letter).join(''), 'CDEFGABCDEFG');
  assert.deepEqual(NOTES.map(n => n.step), [-7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4]);
});

test('each friend plays the right pitch', () => {
  assert.deepEqual(NOTES.map(n => n.midi), [48, 50, 52, 53, 55, 57, 59, 60, 62, 64, 65, 67]);
});

test('friend names start with their note letter, as in the story', () => {
  for (const n of NOTES) assert.equal(n.name[0], n.letter, n.name);
});

test('each friend lives where the story says', () => {
  const where = Object.fromEntries(NOTES.map(n => [n.id, n.step]));
  assert.equal(where.charlie, 0, 'Charlie Cat is middle C');
  assert.equal(where.benny, -1, 'Benny Blobfish: space above the bass staff');
  assert.equal(where.annie, -2, 'Annie Anemone: top line of the bass staff');
  assert.equal(where.goldie, -3, 'Goldie Goldfish: top space');
  assert.equal(where.finn, -4, 'Finn Flounder: line between the bass clef dots');
  assert.equal(where.eddie, -5, 'Eddie Eel: 2nd space');
  assert.equal(where.daisy, -6, 'Daisy Dolphin: middle line');
  assert.equal(where.coco, -7, 'Coco Clownfish: 3rd space');
  assert.equal(where.donna, 1, 'Donna Dog: space below the treble staff');
  assert.equal(where.ellie, 2, 'Ellie Elephant: treble line 1');
  assert.equal(where.flossy, 3, 'Flossy Fish: treble space 1');
  assert.equal(where.gracie, 4, 'Gracie Gorilla: treble line 2');
});

test('ids and colours are unique', () => {
  assert.equal(new Set(NOTES.map(n => n.id)).size, 12);
  assert.equal(new Set(NOTES.map(n => n.color)).size, 12);
});

test('hands: left is low C to middle C, right is middle C to G, both is everyone', () => {
  assert.deepEqual(HANDS.left.map(i => NOTES[i].id), ['coco', 'daisy', 'eddie', 'finn', 'goldie', 'annie', 'benny', 'charlie']);
  assert.deepEqual(HANDS.right.map(i => NOTES[i].id), ['charlie', 'donna', 'ellie', 'flossy', 'gracie']);
  assert.equal(HANDS.both.length, 12);
  assert.equal(NOTES[MIDDLE_C].id, 'charlie');
});

test('letters are in keyboard order starting from C', () => {
  assert.deepEqual([...LETTERS], ['C', 'D', 'E', 'F', 'G', 'A', 'B']);
});

test('stems: up below the middle line of each staff, down on or above it', () => {
  assert.equal(stemUp(NOTES[byId.coco].step), true, 'low C, below the bass middle line: stem up');
  assert.equal(stemUp(NOTES[byId.daisy].step), false, 'D3 on the bass middle line: stem down');
  assert.equal(stemUp(NOTES[byId.benny].step), false, 'B3 above the bass staff: stem down');
  assert.equal(stemUp(NOTES[byId.charlie].step), true, 'middle C: stem up');
  assert.equal(stemUp(NOTES[byId.gracie].step), true, 'G4, below the treble middle line: stem up');
  assert.equal(stemUp(6), false, 'B4 on the treble middle line: stem down');
});

test('notes sit left to right by pitch, middle C near the middle', () => {
  const xs = NOTES.map(n => spatialX(n.step));
  for (let i = 1; i < xs.length; i++) assert.ok(xs[i] > xs[i - 1]);
  assert.ok(xs[0] >= 150, 'low C stays clear of the bass clef');
  assert.ok(xs[11] <= 560, 'high G stays inside the staff');
});

test('higher notes are drawn higher on the staff', () => {
  assert.ok(yOf(4) < yOf(0) && yOf(0) < yOf(-7));
});

test('step = neighbours, skip = jump over one', () => {
  assert.equal(intervalKind(byId.ellie, byId.flossy), 'step', 'E to F');
  assert.equal(intervalKind(byId.ellie, byId.gracie), 'skip', 'E to G');
  assert.equal(intervalKind(byId.charlie, byId.benny), 'step', 'C to B');
  assert.equal(intervalKind(byId.charlie, byId.annie), 'skip', 'middle C to A');
  assert.equal(intervalKind(byId.coco, byId.finn), null, 'C to F is neither');
});

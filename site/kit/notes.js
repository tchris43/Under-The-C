// @ts-check
/**
 * The one source of truth for the Note Friends: which friend lives on which note.
 *
 * `step` counts staff positions from middle C (0). Each line or space is one step:
 * treble side is positive (E4 first line = 2), bass side negative (A3 top bass line = -2).
 * NOTES is ordered from lowest to highest, so neighbouring indexes are neighbouring notes.
 *
 * @typedef {{ id: string, name: string, letter: string, midi: number, step: number,
 *   color: string, on: string, where: string, story: string }} Note
 */

/** @type {readonly Note[]} */
export const NOTES = Object.freeze([
  { id:'coco',    name:'Coco Clownfish',  letter:'C', midi:48, step:-7, color:'#F2602A', on:'#2A0E04', where:'Bass staff · 3rd space',
    story:"I'm Coco Clownfish! I live inside my circus tent, way down at the bottom of the sea. Come watch Daisy Dolphin jump!" },
  { id:'daisy',   name:'Daisy Dolphin',   letter:'D', midi:50, step:-6, color:'#5FB8C9', on:'#0B2A31', where:'Bass staff · middle line',
    story:"I'm Daisy Dolphin! I jump through my hoop on the middle line. I'm the star of the circus under the sea!" },
  { id:'eddie',   name:'Eddie Eel',       letter:'E', midi:52, step:-5, color:'#5DAA5A', on:'#0F2A10', where:'Bass staff · 2nd space',
    story:"I'm Eddie Eel! I have my very own space, right under Finn Flounder. I wiggle back and forth, but I never leave my space." },
  { id:'finn',    name:'Finn Flounder',   letter:'F', midi:53, step:-4, color:'#D2A863', on:'#2E1F07', where:'Bass staff · 2nd line, between the dots',
    story:"I'm Finn Flounder! I lie flat on my line, right between the two dots of the bass clef. That's my favorite spot!" },
  { id:'goldie',  name:'Goldie Goldfish', letter:'G', midi:55, step:-3, color:'#F5A31A', on:'#2E1C02', where:'Bass staff · top space',
    story:"I'm Goldie Goldfish! I swim in the top space, tucked right under Annie Anemone's wiggly arms." },
  { id:'annie',   name:'Annie Anemone',   letter:'A', midi:57, step:-2, color:'#9B6BE0', on:'#FFFFFF', where:'Bass staff · top line',
    story:"I'm Annie Anemone! I sit on the top line of the bass staff, like a roof. All my sea friends live down below me." },
  { id:'benny',   name:'Benny Blobfish',  letter:'B', midi:59, step:-1, color:'#F49AB0', on:'#33101A', where:'Space above the bass staff',
    story:"I'm Benny Blobfish! I bob at the very top of the sea, in the space right under Charlie Cat. Bob, bob, bob!" },
  { id:'charlie', name:'Charlie Cat',     letter:'C', midi:60, step:0,  color:'#4C8FE0', on:'#0F1E33', where:'Middle C · its own line',
    story:"I'm Charlie Cat! I sit on my own little line in the middle. It looks just like my long whiskers! The sea friends live below me." },
  { id:'donna',   name:'Donna Dog',       letter:'D', midi:62, step:1,  color:'#C8834A', on:'#2A1606', where:'Space below the treble staff',
    story:"I'm Donna Dog! I don't like getting wet, so I stay in the space under the treble staff where the rain can't reach me." },
  { id:'ellie',   name:'Ellie Elephant',  letter:'E', midi:64, step:2,  color:'#A3ACB9', on:'#1E2230', where:'Treble staff · 1st line',
    story:"I'm Ellie Elephant! I play on the first line of the treble staff all day. Line number one is mine!" },
  { id:'flossy',  name:'Flossy Fish',     letter:'F', midi:65, step:3,  color:'#F6C443', on:'#2A1E05', where:'Treble staff · 1st space',
    story:"I'm Flossy Fish! I swim in my little lake in the first space. I wave at Ellie Elephant and Gracie Gorilla!" },
  { id:'gracie',  name:'Gracie Gorilla',  letter:'G', midi:67, step:4,  color:'#E8618C', on:'#2A0C16', where:'Treble staff · 2nd line',
    story:"I'm Gracie Gorilla! I live in my tree on the second line. I look down and watch Flossy Fish swim in her lake." },
]);

/** Note letters in the order kids learn them on the keyboard. */
export const LETTERS = Object.freeze(['C', 'D', 'E', 'F', 'G', 'A', 'B']);

/** Which friends each hand practises. Middle C (Charlie, index 7) belongs to both hands. */
export const HANDS = Object.freeze({
  left: Object.freeze([0, 1, 2, 3, 4, 5, 6, 7]),
  right: Object.freeze([7, 8, 9, 10, 11]),
  both: Object.freeze([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]),
});

/** Index of middle C (Charlie Cat). */
export const MIDDLE_C = 7;

/** Vertical position of a staff step in the shared 600-wide staff drawing. */
export const yOf = (/** @type {number} */ step) => 320 - step * 20;

/**
 * Sheet-music stem rule: notes below the middle line of their staff get stems up,
 * notes on or above it get stems down. Treble middle line = B4 (step 6), bass middle line = D3 (step -6).
 */
export const stemUp = (/** @type {number} */ step) => (step >= 0 ? step < 6 : step < -6);

/** Notes sit left to right by pitch: low C toward the left, middle C in the middle. */
export const spatialX = (/** @type {number} */ step) => 370 + step * 30;

/**
 * Step = next-door neighbours (line to space). Skip = jump over one (line to line, space to space).
 * @param {number} a note index  @param {number} b note index
 * @returns {'step' | 'skip' | null}
 */
export function intervalKind(a, b) {
  const d = Math.abs(NOTES[a].step - NOTES[b].step);
  return d === 1 ? 'step' : d === 2 ? 'skip' : null;
}

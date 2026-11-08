// @ts-check
/**
 * NOTE FLASH (Level 3): flashcards with no animal on the note.
 * Letter Pad: tap the letter. Piano Keys: find the exact key (the right C, not just any C).
 * When the answer is right, the friend who lives there pops onto the note as the reward.
 * After two misses, a faint friend appears on the note as a hint.
 * The shared setup screen (kit/setup.js) comes first: friends, how to answer, letters on keys.
 */
import { NOTES, LETTERS, yOf, spatialX } from '../kit/notes.js';
import { charSVG } from '../kit/characters.js';
import { Sound } from '../kit/sound.js';
import { staffMarkup, noteMarkup, homeMarkup, burst } from '../kit/staff.js';
import { nextNote } from '../kit/logic.js';
import { $, hasKeyboard, stickers, replay, randomFromLink } from '../kit/ui.js';
import { setup } from '../kit/setup.js';
import { pianoKeys } from '../kit/settings.js';
import { enableOffline } from '../kit/offline.js';

const ROUNDS = 10;
const rand = randomFromLink();

const state = {
  round: 0, target: -1, last: -1, misses: 0, locked: true,
  /** @type {{ i: number, first: boolean }[]} */ results: [],
};

const stage = $('#stage');
const screen = setup({
  game: 'flash',
  options: ['mode', 'letters'],
  onPlay: () => { showMode(); newGame(); },
  onOpen: () => { $('#tagline').textContent = 'Level 3 · Set up practice'; },
  onResume: showMode,
});
const settings = screen.settings;
const pool = () => settings.pool;
/** @type {number[]} */
let timers = [];
const later = (/** @type {() => void} */ fn, /** @type {number} */ ms) => { timers.push(window.setTimeout(fn, ms)); };
const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };
const say = (/** @type {string} */ text) => { $('#ask').textContent = text; };

/* ---------- Answer areas ---------- */
$('#pad').innerHTML = LETTERS.map(l => `<button type="button" class="lk" data-l="${l}" aria-label="${l}">${l}</button>`).join('');

function buildPiano() {
  const vis = pianoKeys(pool()), n = vis.length;
  let blacks = '';
  for (let k = 0; k < n - 1; k++) {
    const m = NOTES[vis[k]].midi;
    if (NOTES[vis[k + 1]].midi - m === 2) {
      blacks += `<button type="button" class="bk" tabindex="-1" data-midi="${m + 1}" style="left:calc(${k + 1} * 100% / ${n});width:calc(100% / ${n} * .58)" aria-label="Black key"></button>`;
    }
  }
  const piano = $('#piano');
  piano.innerHTML = vis.map(i => {
    const nt = NOTES[i];
    return `<button type="button" class="pk${nt.step === 0 ? ' midc' : ''}" data-i="${i}" style="--c:${nt.color}" aria-label="${nt.letter} key${nt.step === 0 ? ', middle C' : ''}"><span class="nl">${nt.letter}</span></button>`;
  }).join('') + blacks;
  piano.classList.toggle('hide-letters', !settings.letters);
}

function showMode() {
  $('#pad').hidden = settings.mode !== 'pad';
  $('#pianoWrap').hidden = settings.mode !== 'piano';
  $('#tagline').textContent = settings.mode === 'pad' ? 'Level 3 · Tap the letter of the note' : 'Level 3 · Find the note on the piano';
  $('#kbtip').innerHTML = settings.mode === 'pad'
    ? 'Laptop: type the letter <kbd>A</kbd>–<kbd>G</kbd>.'
    : 'Laptop: type the letter <kbd>A</kbd>–<kbd>G</kbd>. Tap the piano to practise finding the exact key.';
}

/* ---------- Rounds ---------- */
function newGame() {
  clearTimers();
  state.round = 0; state.results = []; state.last = -1;
  $('#finish').hidden = true;
  stickers.build($('#slots'), ROUNDS);
  buildPiano();
  nextCard();
}

function nextCard() {
  state.target = nextNote(pool(), state.last, rand);
  state.last = state.target; state.misses = 0; state.locked = false;
  const n = NOTES[state.target], x = spatialX(n.step);
  $('#noteG').innerHTML = noteMarkup(n.step, x);
  $('#noteG').setAttribute('opacity', '1');
  $('#revealG').innerHTML = ''; $('#homes').innerHTML = ''; $('#ghostG').setAttribute('opacity', '0');
  say('What note is this?');
  $('#count').textContent = `${state.round + 1} / ${ROUNDS}`;
  stickers.markCurrent($('#slots'), state.round);
  document.querySelectorAll('.lk').forEach(b => { b.classList.remove('ok', 'no'); /** @type {HTMLElement} */ (b).style.removeProperty('--c'); });
  document.querySelectorAll('.pk').forEach(k => { k.classList.remove('ok', 'no'); k.querySelector('.mini')?.remove(); });
  stage.dataset.target = String(state.target);
  stage.dataset.phase = 'ask';
}

/**
 * @param {string} letter
 * @param {Element | null} el  the button pressed
 * @param {number} [keyIndex]  set when a piano key was tapped: then only the exact note counts
 */
function answer(letter, el, keyIndex) {
  if (state.locked) return;
  const n = NOTES[state.target];
  const exact = keyIndex !== undefined;
  const right = exact ? keyIndex === state.target : letter === n.letter;
  if (right) win(n);
  else miss(el, exact && letter === n.letter ? 'octave' : '');
}

/** @param {typeof NOTES[number]} n */
function win(n) {
  state.locked = true;
  Sound.play(n.midi);
  const x = spatialX(n.step), y = yOf(n.step);
  // The friend who lives here pops onto the note
  $('#noteG').setAttribute('opacity', '.15');
  $('#ghostG').setAttribute('opacity', '0');
  $('#revealG').innerHTML = `<g transform="translate(${x} ${y}) scale(.95)"><g class="pop">${charSVG(n.id)}</g></g>`;
  $('#homes').innerHTML = homeMarkup(n, x);
  burst(document.getElementById('fx'), x, y, n.color);
  say(`${n.letter}! ${n.name}`);
  const pad = /** @type {HTMLElement | null} */ (document.querySelector(`.lk[data-l="${n.letter}"]`));
  if (pad) { pad.style.setProperty('--c', n.color); pad.style.setProperty('--on-c', n.on); pad.classList.add('ok'); }
  const key = document.querySelector(`.pk[data-i="${state.target}"]`);
  if (key) { key.classList.add('ok'); key.insertAdjacentHTML('afterbegin', `<svg class="mini" viewBox="-44 -44 88 88" aria-hidden="true">${charSVG(n.id)}</svg>`); }
  const firstTry = state.misses === 0;
  state.results.push({ i: state.target, first: firstTry });
  stickers.fill($('#slots'), state.round, [n], firstTry);
  stage.dataset.phase = 'done';
  later(advance, 1700);
}

function advance() {
  clearTimers();
  state.round++;
  if (state.round >= ROUNDS) finish(); else nextCard();
}

/** @param {Element | null} el  @param {string} why */
function miss(el, why) {
  state.misses++;
  Sound.buzz();
  if (el) {
    replay(el, 'no');
    if (!el.classList.contains('lk')) later(() => el.classList.remove('no'), 400);
  }
  const n = NOTES[state.target];
  if (why === 'octave') say(`Right letter! Find the other ${n.letter}.`);
  else if (state.misses >= 2) {
    const g = $('#ghostG');
    g.innerHTML = `<g transform="translate(${spatialX(n.step)} ${yOf(n.step)}) scale(.95)">${charSVG(n.id)}</g>`;
    g.setAttribute('opacity', '.3');
    say('Here’s a hint! Who lives here?');
  } else say('Try again!');
}

function finish() {
  const firsts = state.results.filter(r => r.first).length;
  $('#finishRow').innerHTML = state.results.map((r, k) => `<svg viewBox="-44 -44 88 88" aria-hidden="true" style="animation-delay:${k * 70}ms">${charSVG(NOTES[r.i].id)}</svg>`).join('');
  $('#finishMsg').textContent = firsts === ROUNDS ? 'Every note right on the first try!' : `${firsts} of ${ROUNDS} right on the first try`;
  $('#finish').hidden = false;
  stickers.markCurrent($('#slots'), -1);
  stage.dataset.phase = 'finished';
  Sound.cheer();
}

/* ---------- Input ---------- */
$('#pad').addEventListener('pointerdown', e => {
  const b = /** @type {HTMLElement | null} */ (/** @type {Element} */ (e.target).closest('.lk'));
  if (!b) return;
  e.preventDefault(); answer(b.dataset.l || '', b);
});
$('#pad').addEventListener('click', e => {
  const b = /** @type {HTMLElement | null} */ (/** @type {Element} */ (e.target).closest('.lk'));
  if (b && e.detail === 0) answer(b.dataset.l || '', b);
});

const piano = $('#piano');
piano.addEventListener('pointerdown', e => {
  const k = /** @type {HTMLElement | null} */ (/** @type {Element} */ (e.target).closest('.pk, .bk'));
  if (!k) return;
  e.preventDefault();
  k.classList.add('down');
  if (k.classList.contains('bk')) { Sound.play(Number(k.dataset.midi), 0, .7); if (!state.locked) miss(k, ''); return; }
  const i = Number(k.dataset.i);
  if (state.locked) { Sound.play(NOTES[i].midi, 0, .7); return; }
  answer(NOTES[i].letter, k, i);
});
piano.addEventListener('click', e => { // Enter or Space on a focused key
  const k = /** @type {HTMLElement | null} */ (/** @type {Element} */ (e.target).closest('.pk'));
  if (k && e.detail === 0) answer(NOTES[Number(k.dataset.i)].letter, k, Number(k.dataset.i));
});
const keysUp = () => piano.querySelectorAll('.down').forEach(k => k.classList.remove('down'));
window.addEventListener('pointerup', keysUp);
window.addEventListener('pointercancel', keysUp);
piano.addEventListener('contextmenu', e => e.preventDefault());

if (hasKeyboard()) document.body.classList.add('kb');
document.addEventListener('keydown', e => {
  if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
  const k = e.key.toUpperCase();
  if (!$('#setup').hidden) return; // typing on the setup screen never answers
  if (LETTERS.includes(k)) {
    document.body.classList.add('kb');
    e.preventDefault();
    if (!$('#finish').hidden) return;
    const el = settings.mode === 'pad' ? document.querySelector(`.lk[data-l="${k}"]`) : null;
    answer(k, el); // a typed letter can't pick an octave, so any key with that letter counts
  } else if ((k === ' ' || k === 'ENTER') && !$('#finish').hidden && !/** @type {Element} */ (e.target).closest('button, a')) {
    e.preventDefault(); newGame();
  }
});

$('#hearBtn').addEventListener('click', () => { if (state.target >= 0) Sound.play(NOTES[state.target].midi); });
$('#againBtn').addEventListener('click', newGame);

$('#changeBtn').addEventListener('click', screen.open);

/* ---------- Start: the shared setup screen comes first, with this device's last choices ---------- */
$('#staff').innerHTML = staffMarkup();
screen.open();
enableOffline();

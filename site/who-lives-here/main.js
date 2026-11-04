// @ts-check
/**
 * WHO LIVES HERE?
 * Level 1: a note appears on the staff. Tap the friend who lives there.
 * Level 2: two notes. Name both friends, then decide: step or skip?
 *   step = next-door neighbours (line to space), skip = jump over one (line to line, space to space).
 * Ten rounds a game; a sticker for each, with a gold star when it was right first try.
 */
import { NOTES, HANDS, yOf, spatialX, intervalKind } from '../kit/notes.js';
import { charSVG } from '../kit/characters.js';
import { Sound } from '../kit/sound.js';
import { staffMarkup, noteMarkup, homeMarkup, burst } from '../kit/staff.js';
import { nextNote, nextPair, animalChoices, pick } from '../kit/logic.js';
import { $, radioGroup, memory, hasKeyboard, reducedMotion, stickers, randomFromLink } from '../kit/ui.js';
import { enableOffline } from '../kit/offline.js';

const ROUNDS = 10;
const CHOICES = 3;
const rand = randomFromLink();
const PRAISE = ['Yes!', 'You got it!', 'Great job!', 'Hooray!', 'That’s right!'];

/** @typedef {'left' | 'right' | 'both'} Hand */
const state = {
  level: Number(memory.get('who-level', '1')) === 2 ? 2 : 1,
  hand: /** @type {Hand} */ (memory.get('who-hand', 'left')),
  round: 0,
  /** @type {number[]} */ notes: [],
  idx: 0,
  /** @type {'id' | 'interval' | 'done'} */ phase: 'id',
  tries: 0,
  misses: 0,
  /** @type {{ notes: number[], first: boolean }[]} */ results: [],
  locked: false,
  last: -1,
  lastPair: '',
};
if (!(state.hand in HANDS)) state.hand = 'left';

const staff = /** @type {SVGSVGElement} */ (/** @type {unknown} */ ($('#staff')));
const stage = $('#stage');
const pool = () => HANDS[state.hand];
const first = (/** @type {{ name: string }} */ n) => n.name.split(' ')[0];

/** @type {number[]} */
let timers = [];
const later = (/** @type {() => void} */ fn, /** @type {number} */ ms) => { timers.push(window.setTimeout(fn, ms)); };
const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };
const say = (/** @type {string} */ text) => { $('#ask').textContent = text; };

/** Where each note of this round sits: by pitch, low to the left. Level 2 keeps the pair side by side. */
function xsFor() {
  const [a, b] = state.notes.map(i => spatialX(NOTES[i].step));
  if (state.level === 1) return [a];
  const mid = Math.max(232, Math.min(500, (a + b) / 2));
  return [mid - 62, mid + 62];
}
/** A wrong pick shows that friend at its own spot, nudged aside if it would cover the note being asked about. */
function ghostX(/** @type {{ step: number }} */ n) {
  let gx = spatialX(n.step);
  const tx = xsFor()[state.phase === 'id' ? state.idx : 0];
  if (Math.abs(gx - tx) < 64) gx = tx + (gx < tx ? -72 : 72);
  return Math.max(170, Math.min(545, gx));
}
function syncStage() {
  stage.dataset.level = String(state.level);
  stage.dataset.phase = state.phase;
  stage.dataset.target = state.phase === 'id' ? String(state.notes[state.idx]) : '';
  stage.dataset.answer = state.notes.length === 2 ? String(intervalKind(state.notes[0], state.notes[1])) : '';
}

/* ---------- Rounds ---------- */
function newGame() {
  clearTimers();
  state.round = 0; state.results = []; state.last = -1; state.lastPair = '';
  $('#finish').hidden = true;
  $('#tagline').textContent = state.level === 1 ? 'Find the friend who lives on the note' : 'Name both friends, then: step or skip?';
  stickers.build($('#slots'), ROUNDS);
  nextRound();
}

function nextRound() {
  if (state.level === 1) {
    state.notes = [nextNote(pool(), state.last, rand)];
    state.last = state.notes[0];
  } else {
    state.notes = nextPair(pool(), state.lastPair, rand);
    state.lastPair = state.notes.join();
  }
  state.idx = 0; state.phase = 'id'; state.misses = 0;
  const xs = xsFor();
  $('#noteG').innerHTML = state.notes.map((i, k) => noteMarkup(NOTES[i].step, xs[k], `note${k}`)).join('');
  $('#revealG').innerHTML = ''; $('#arcG').innerHTML = ''; $('#homes').innerHTML = '';
  $('#ghostG').setAttribute('opacity', '0');
  $('#count').textContent = `${state.round + 1} / ${ROUNDS}`;
  stickers.markCurrent($('#slots'), state.round);
  askAnimal();
}

function markCurrent() {
  staff.querySelectorAll('.cur-ring').forEach(e => e.remove());
  if (state.phase !== 'id' || state.level === 1) return;
  const n = NOTES[state.notes[state.idx]];
  const ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  ring.setAttribute('class', 'cur-ring');
  ring.setAttribute('cx', String(xsFor()[state.idx])); ring.setAttribute('cy', String(yOf(n.step))); ring.setAttribute('r', '26');
  $('#noteG').appendChild(ring);
}

function askAnimal() {
  state.tries = 0; state.locked = false; state.phase = 'id';
  const target = state.notes[state.idx];
  const options = animalChoices(target, pool(), CHOICES, rand);
  say(state.level === 1 ? 'Who lives here?' : state.idx === 0 ? 'Who lives on the first note?' : 'Who lives on the second note?');
  markCurrent();
  const ch = $('#choices');
  ch.className = 'choices';
  ch.innerHTML = options.map((i, k) => `<button type="button" class="choice animal" data-i="${i}" style="--c:${NOTES[i].color}" aria-label="${NOTES[i].name}">
      <span class="kcap">${k + 1}</span><svg viewBox="-44 -44 88 88" aria-hidden="true">${charSVG(NOTES[i].id)}</svg><span class="nm">${NOTES[i].name}</span></button>`).join('');
  syncStage();
}

const STEP_ICON = `<svg viewBox="0 0 170 104" aria-hidden="true"><g stroke="#27213D" stroke-width="3" stroke-linecap="round">
  <line x1="10" y1="34" x2="160" y2="34"/><line x1="10" y1="62" x2="160" y2="62"/><line x1="10" y1="90" x2="160" y2="90"/></g>
  <path d="M58 84 Q86 54 108 68" fill="none" stroke="var(--step)" stroke-width="5" stroke-linecap="round"/>
  <ellipse cx="50" cy="90" rx="12" ry="9" fill="#27213D" transform="rotate(-22 50 90)"/>
  <ellipse cx="118" cy="76" rx="12" ry="9" fill="#27213D" transform="rotate(-22 118 76)"/></svg>`;
const SKIP_ICON = `<svg viewBox="0 0 170 104" aria-hidden="true"><g stroke="#27213D" stroke-width="3" stroke-linecap="round">
  <line x1="10" y1="34" x2="160" y2="34"/><line x1="10" y1="62" x2="160" y2="62"/><line x1="10" y1="90" x2="160" y2="90"/></g>
  <path d="M58 80 Q86 30 110 50" fill="none" stroke="var(--skip)" stroke-width="5" stroke-linecap="round"/>
  <ellipse cx="50" cy="90" rx="12" ry="9" fill="#27213D" transform="rotate(-22 50 90)"/>
  <ellipse cx="118" cy="62" rx="12" ry="9" fill="#27213D" transform="rotate(-22 118 62)"/></svg>`;

function askInterval() {
  state.phase = 'interval'; state.tries = 0; state.locked = false;
  markCurrent();
  say('Step or skip?');
  const ch = $('#choices');
  ch.className = 'choices two';
  ch.innerHTML = `
    <button type="button" class="choice int" data-int="step" style="--c:var(--step)" aria-label="Step"><span class="kcap">1</span>${STEP_ICON}<span class="big">Step</span><span class="sub">next-door neighbors</span></button>
    <button type="button" class="choice int" data-int="skip" style="--c:var(--skip)" aria-label="Skip"><span class="kcap">2</span>${SKIP_ICON}<span class="big">Skip</span><span class="sub">jump over one</span></button>`;
  syncStage();
}

/** @param {number} i  @param {HTMLElement} el */
function chooseAnimal(i, el) {
  if (state.locked || state.phase !== 'id') return;
  const n = NOTES[i], target = state.notes[state.idx], x = xsFor()[state.idx];
  state.tries++;
  if (i === target) {
    state.locked = true;
    stage.dataset.phase = 'wait';
    if (state.tries > 1) state.misses++;
    Sound.play(n.midi);
    el.classList.add('yes');
    $('#choices').classList.add('done');
    $('#ghostG').setAttribute('opacity', '0');
    staff.querySelectorAll('.cur-ring').forEach(e => e.remove());
    const k = state.idx;
    fly(el, n, x, () => {
      document.getElementById(`note${k}`)?.setAttribute('opacity', '.18');
      $('#revealG').insertAdjacentHTML('beforeend', `<g transform="translate(${x} ${yOf(n.step)}) scale(${state.level === 1 ? .95 : .85})"><g class="pop">${charSVG(n.id)}</g></g>`);
      $('#homes').insertAdjacentHTML('beforeend', homeMarkup(n, x));
      burst(document.getElementById('fx'), x, yOf(n.step), n.color);
    });
    say(`${pick(PRAISE)} ${n.name}!`);
    if (state.level === 1) finishRound(2300);
    else if (state.idx === 0) later(() => { state.idx = 1; askAnimal(); }, 1500);
    else later(askInterval, 1300);
  } else {
    // Gentle miss: play that friend's own note and show where it really lives
    Sound.play(n.midi, 0, .7);
    el.classList.add('no');
    const g = $('#ghostG');
    g.innerHTML = `<g transform="translate(${ghostX(n)} ${yOf(n.step)}) scale(.75)">${charSVG(n.id)}</g>`;
    g.setAttribute('opacity', '.55');
    later(() => g.setAttribute('opacity', '0'), 1600);
    say(`That's ${n.name}. Try again!`);
  }
}

/** @param {string} kind  @param {HTMLElement} el */
function chooseInterval(kind, el) {
  if (state.locked || state.phase !== 'interval') return;
  const [ia, ib] = state.notes, a = NOTES[ia], b = NOTES[ib];
  const answer = intervalKind(ia, ib);
  const [xa, xb] = xsFor(), ya = yOf(a.step), yb = yOf(b.step);
  state.tries++;
  if (kind === answer) {
    state.locked = true;
    if (state.tries > 1) state.misses++;
    el.classList.add('yes'); $('#choices').classList.add('done');
    Sound.play(a.midi, 0); Sound.play(b.midi, 0.38);
    const top = Math.min(ya, yb) - (answer === 'skip' ? 70 : 44);
    let between = '';
    if (answer === 'skip') {
      // Show the friend they jumped over
      const mid = NOTES[(ia + ib) / 2];
      between = `<g transform="translate(${(xa + xb) / 2} ${yOf(mid.step)}) scale(.55)" opacity=".7">${charSVG(mid.id)}</g>`;
      say(`A skip! ${first(a)} and ${first(b)} jump over ${first(mid)}.`);
    } else {
      say(`A step! ${first(a)} and ${first(b)} are next-door neighbors.`);
    }
    $('#arcG').innerHTML = `${between}<path class="arc" d="M${xa + 18} ${ya - 30} Q${(xa + xb) / 2} ${top - 40} ${xb - 18} ${yb - 30}" fill="none" stroke="var(--${answer})" stroke-width="7" stroke-linecap="round"/>`;
    later(() => burst(document.getElementById('fx'), (xa + xb) / 2, top - 20, answer === 'skip' ? '#B98AE8' : '#6EC3EA'), 500);
    finishRound(3200);
  } else {
    el.classList.add('no');
    Sound.play(a.midi, 0, .7); Sound.play(b.midi, 0.38, .7);
    if (answer === 'skip') {
      const mid = NOTES[(ia + ib) / 2], g = $('#ghostG');
      g.innerHTML = `<g transform="translate(${(xa + xb) / 2} ${yOf(mid.step)}) scale(.55)">${charSVG(mid.id)}</g>`;
      g.setAttribute('opacity', '.6');
      later(() => g.setAttribute('opacity', '0'), 2200);
      say('Not quite. Look, there’s a friend in between!');
    } else {
      say('Not quite. They’re right next to each other!');
    }
  }
}

/** @param {number} delay */
function finishRound(delay) {
  const firstTry = state.misses === 0;
  state.results.push({ notes: state.notes.slice(), first: firstTry });
  stickers.fill($('#slots'), state.round, state.notes.map(i => NOTES[i]), firstTry);
  state.phase = 'done';
  syncStage();
  later(() => {
    state.round++;
    if (state.round >= ROUNDS) finish(); else nextRound();
  }, delay);
}

/** The right friend flies from its card onto the note. */
function fly(/** @type {HTMLElement} */ fromEl, /** @type {{ id: string, step: number }} */ n, /** @type {number} */ x, /** @type {() => void} */ done) {
  const svg = fromEl.querySelector('svg');
  const ctm = staff.getScreenCTM();
  if (!svg || !ctm || reducedMotion()) { done(); return; }
  const r = svg.getBoundingClientRect();
  const pt = staff.createSVGPoint(); pt.x = x; pt.y = yOf(n.step);
  const p = pt.matrixTransform(ctm);
  const endSize = 88 * (state.level === 1 ? .95 : .85) * ctm.a;
  const f = document.createElement('div');
  f.className = 'flyer';
  f.style.width = `${r.width}px`; f.style.height = `${r.height}px`;
  f.innerHTML = `<svg viewBox="-44 -44 88 88">${charSVG(n.id)}</svg>`;
  document.body.appendChild(f);
  const sx = r.left, sy = r.top, ex = p.x - r.width / 2, ey = p.y - r.height / 2, s = endSize / r.width;
  const midY = Math.min(sy, ey) - 60;
  f.animate([
    { transform: `translate(${sx}px, ${sy}px) scale(1)` },
    { transform: `translate(${(sx + ex) / 2}px, ${midY}px) scale(${(1 + s) / 2}) rotate(-8deg)`, offset: .5 },
    { transform: `translate(${ex}px, ${ey}px) scale(${s})` },
  ], { duration: 560, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' }).onfinish = () => { f.remove(); done(); };
}

function finish() {
  const firsts = state.results.filter(r => r.first).length;
  $('#finishRow').innerHTML = state.results.flatMap(r => r.notes).map((i, k) => `<svg viewBox="-44 -44 88 88" aria-hidden="true" style="animation-delay:${k * 60}ms">${charSVG(NOTES[i].id)}</svg>`).join('');
  $('#finishMsg').textContent = firsts === ROUNDS ? 'Every round right on the first try!' : `${firsts} of ${ROUNDS} right on the first try`;
  $('#finish').hidden = false;
  $('#noteG').innerHTML = ''; $('#revealG').innerHTML = ''; $('#arcG').innerHTML = ''; $('#homes').innerHTML = '';
  $('#choices').innerHTML = '';
  stickers.markCurrent($('#slots'), -1);
  state.phase = 'done';
  syncStage();
  Sound.cheer();
}

/* ---------- Input ---------- */
/** @param {HTMLElement} c */
function pickCard(c) {
  if (c.classList.contains('animal')) chooseAnimal(Number(c.dataset.i), c);
  else if (c.classList.contains('int')) chooseInterval(c.dataset.int || '', c);
}
$('#choices').addEventListener('pointerdown', e => {
  const c = /** @type {HTMLElement | null} */ (/** @type {Element} */ (e.target).closest('.choice'));
  if (!c) return;
  e.preventDefault(); pickCard(c);
});
$('#choices').addEventListener('click', e => { // Enter or Space on a focused card
  const c = /** @type {HTMLElement | null} */ (/** @type {Element} */ (e.target).closest('.choice'));
  if (c && e.detail === 0) pickCard(c);
});
if (hasKeyboard()) document.body.classList.add('kb');
document.addEventListener('keydown', e => {
  if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
  const k = e.key.toLowerCase();
  if (['1', '2', '3'].includes(k)) {
    document.body.classList.add('kb');
    const c = /** @type {HTMLElement | undefined} */ (document.querySelectorAll('.choice')[Number(k) - 1]);
    if (c) { e.preventDefault(); pickCard(c); }
  } else if (k === 'h') { hear(); }
  else if ((k === 'enter' || k === ' ') && !$('#finish').hidden && !/** @type {Element} */ (e.target).closest('button, a')) { e.preventDefault(); newGame(); }
});
function hear() {
  if ($('#finish').hidden) state.notes.forEach((i, k) => Sound.play(NOTES[i].midi, k * 0.45));
}
$('#hearBtn').addEventListener('click', hear);
$('#againBtn').addEventListener('click', newGame);

radioGroup($('#levelSeg'), v => { state.level = v === '2' ? 2 : 1; memory.set('who-level', v); newGame(); }, String(state.level));
radioGroup($('#handSeg'), v => { state.hand = /** @type {Hand} */ (v); memory.set('who-hand', v); newGame(); }, state.hand);

/* ---------- Start ---------- */
staff.innerHTML = staffMarkup();
newGame();
enableOffline();

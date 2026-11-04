// @ts-check
/**
 * UNDER THE SEA: meet the Note Friends.
 * Above middle C live the right-hand land friends; below it, the left-hand sea friends.
 * Tap a friend (or a piano key) to hear its note, see where it lives, and read its story.
 */
import { NOTES, HANDS, MIDDLE_C, yOf } from '../kit/notes.js';
import { charSVG, clownfish } from '../kit/characters.js';
import { Sound } from '../kit/sound.js';
import { $, radioGroup, memory, hasKeyboard, reducedMotion, replay } from '../kit/ui.js';

const INK = '#2A2238';
const WATER = 336; // sea surface: just under Charlie Cat's middle-C line
const H = 570;

/** Each section shows a set of friends and zooms the picture to its half of the world. */
const SECTIONS = {
  right: { notes: HANDS.right, tag: 'The right-hand friends live on land', view: [16, 356] },
  all: { notes: HANDS.both, tag: 'Land friends up top, sea friends down below', view: [0, H] },
  sea: { notes: HANDS.left, tag: 'The left-hand friends live under middle C', view: [266, H] },
};
/** @typedef {keyof typeof SECTIONS} Section */

const state = {
  sel: MIDDLE_C,
  section: /** @type {Section} */ (memory.get('sea-section', 'sea')),
  mode: 'piano',
  touched: false,
  /** @type {{ W: number, x0: number, x1: number, s: number, clefX: number, xs: Record<number, number> }} */
  layout: { W: 1000, x0: 205, x1: 950, s: 1, clefX: 24, xs: {} },
  /** @type {Record<string, number>} */ keymap: {},
  /** @type {Record<string, number>} */ blackmap: {},
  /** @type {string[]} */ caps: [],
};
if (!(state.section in SECTIONS)) state.section = 'sea';

const world = $('#world');
const visible = () => SECTIONS[state.section].notes;

/** @param {number} width  @param {number} count */
function layoutFor(width, count) {
  if (width < 700) {
    const W = count > 8 ? 820 : 640;
    return { W, x0: 150, x1: W - 34, s: count > 8 ? .74 : .9, clefX: 16, xs: {} };
  }
  return { W: 1000, x0: 205, x1: 950, s: count > 8 ? .82 : 1, clefX: 24, xs: {} };
}

/* ---------- The world ---------- */
function buildScene() {
  const vis = visible();
  const L = layoutFor($('#scene').clientWidth || 1000, vis.length);
  state.layout = L;
  const { W, s } = L, left = L.clefX, right = W - 20;
  vis.forEach((i, k) => { L.xs[i] = L.x0 + (L.x1 - L.x0) * k / Math.max(1, vis.length - 1); });
  const X = (/** @type {string} */ id) => L.xs[NOTES.findIndex(n => n.id === id)];
  const has = (/** @type {string} */ id) => X(id) !== undefined;
  const waves = Array.from({ length: Math.ceil(W / 24) + 1 }, (_, i) => `Q${i * 24 + 12} ${WATER - 5 + (i % 2) * 10} ${i * 24 + 24} ${WATER}`).join(' ');

  let h = `<defs>
    <linearGradient id="skyG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--sky-top)"/><stop offset="1" style="stop-color:var(--sky-bot)"/></linearGradient>
    <linearGradient id="seaG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--sea-top)"/><stop offset="1" style="stop-color:var(--sea-bot)"/></linearGradient>
  </defs>
  <rect width="${W}" height="${WATER + 8}" fill="url(#skyG)"/>
  <g class="stars" fill="#FFF7D6">${[[90, 40], [210, 70], [330, 28], [470, 58], [590, 24], [700, 80], [820, 36], [530, 100], [150, 104]].map(([x, y]) => `<circle cx="${x * W / 1000}" cy="${y}" r="1.8"/>`).join('')}</g>
  <circle cx="${W - 70}" cy="62" r="30" fill="var(--sun)"/>
  <g fill="var(--cloud)" opacity=".9">
    <g transform="translate(${W * 0.3} 62)"><ellipse rx="42" ry="14"/><circle cx="-14" cy="-8" r="14"/><circle cx="10" cy="-12" r="17"/></g>
    <g transform="translate(${W * 0.62} 44) scale(.8)"><ellipse rx="42" ry="14"/><circle cx="-14" cy="-8" r="14"/><circle cx="10" cy="-12" r="17"/></g>
  </g>
  <path d="M0 ${WATER} ${waves} L${W} ${H} L0 ${H}Z" fill="url(#seaG)"/>
  <path d="M0 ${WATER} ${waves}" fill="none" stroke="var(--foam)" stroke-width="3" opacity=".8"/>
  <g fill="#FFFFFF" opacity=".07">${[0.2, 0.45, 0.72].map(f => `<path d="M${W * f - 20} ${WATER} L${W * f + 30} ${WATER} L${W * f + 90} ${H} L${W * f + 10} ${H}Z"/>`).join('')}</g>
  <g>${[0.14, 0.31, 0.5, 0.69, 0.86, 0.97].map((f, k) => {
    const x = W * f, ht = 60 + (k % 3) * 18;
    return `<path class="weed" style="--dl:${(-k * .7).toFixed(1)}s" d="M${x} ${H - 18} q-10 ${-ht * .25} 0 ${-ht * .5} t0 ${-ht * .5}" fill="none" stroke="var(--weed)" stroke-width="7" stroke-linecap="round"/>`;
  }).join('')}</g>
  <path d="M0 ${H - 22} ${Array.from({ length: Math.ceil(W / 60) + 1 }, (_, i) => `Q${i * 60 + 30} ${H - 30 + (i % 2) * 10} ${i * 60 + 60} ${H - 22}`).join(' ')} L${W} ${H} L0 ${H}Z" fill="var(--sand)"/>
  <g>${Array.from({ length: 14 }, (_, k) => {
    const x = (k * 73 + 40) % (W - 40) + 20, r = 3 + (k % 3) * 1.6;
    return `<circle class="bubble" cx="${x}" cy="${H - 30}" r="${r}" style="--t:${(6 + (k % 4)).toFixed(1)}s;--dl:${(-k * .9).toFixed(1)}s"/>`;
  }).join('')}</g>`;

  // Story homes, behind the staff lines
  if (has('gracie')) {
    const gr = X('gracie');
    h += `<ellipse cx="${gr}" cy="${WATER + 3}" rx="${52 * s}" ry="9" fill="var(--sand)"/>
    <rect x="${gr - 8}" y="258" width="16" height="${WATER - 256}" rx="4" fill="var(--trunk)"/>
    <g fill="var(--leaf)"><circle cx="${gr}" cy="238" r="38"/><circle cx="${gr - 30}" cy="252" r="22"/><circle cx="${gr + 28}" cy="250" r="22"/><circle cx="${gr}" cy="206" r="24"/></g>`;
  }
  if (has('flossy')) h += `<ellipse cx="${X('flossy')}" cy="260" rx="${54 * s}" ry="17" fill="var(--water)"/>`;
  if (has('donna')) h += `<g transform="translate(${X('donna')} 196)"><g fill="var(--raincloud)"><ellipse rx="38" ry="13"/><circle cx="-13" cy="-9" r="13"/><circle cx="10" cy="-13" r="16"/></g>
    <path d="M-20 18 l-3 12 M-4 22 l-3 12 M12 18 l-3 12 M-12 44 l-3 12 M6 44 l-3 12 M22 40 l-3 12" stroke="var(--rain)" stroke-width="3" stroke-linecap="round"/></g>`;
  if (has('benny')) h += `<g fill="none" stroke="var(--foam)" stroke-width="2.4" opacity=".85"><ellipse cx="${X('benny')}" cy="${WATER + 6}" rx="${34 * s}" ry="5"/><ellipse cx="${X('benny')}" cy="${WATER + 8}" rx="${50 * s}" ry="8" opacity=".5"/></g>`;
  if (has('daisy')) {
    const dx = X('daisy') + 24 * s;
    h += `<ellipse cx="${dx}" cy="440" rx="${11 * s}" ry="${34 * s}" fill="none" stroke="#FFC94D" stroke-width="6"/>
    <ellipse cx="${dx}" cy="440" rx="${11 * s}" ry="${34 * s}" fill="none" stroke="#E84B3C" stroke-width="6" stroke-dasharray="9 9"/>`;
  }
  if (has('coco')) {
    // Coco's circus tent fills just his space, between the 3rd and 4th bass lines
    const cx = X('coco'), w = 50 * s, peak = 426, base = 480, seg = 8;
    h += `<g>${Array.from({ length: seg }, (_, k) => `<path d="M${cx} ${peak} L${cx - w + k * 2 * w / seg} ${base} L${cx - w + (k + 1) * 2 * w / seg} ${base}Z" fill="${k % 2 ? '#FFFFFF' : '#E84B3C'}"/>`).join('')}
      <path d="M${cx} ${peak} L${cx - w} ${base} L${cx + w} ${base}Z" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/>
      <path d="M${cx - 24 * s} ${base} C${cx - 24 * s} 458 ${cx - 12 * s} 446 ${cx} 446 C${cx + 12 * s} 446 ${cx + 24 * s} 458 ${cx + 24 * s} ${base}Z" fill="#3A2550" stroke="${INK}" stroke-width="2.4"/>
      <line x1="${cx}" y1="${peak}" x2="${cx}" y2="${peak - 12}" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>
      <path d="M${cx} ${peak - 12} L${cx + 13} ${peak - 8} L${cx} ${peak - 4}Z" fill="#FFD65C" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/></g>`;
  }

  // Highlight band showing where the chosen friend lives
  h += `<rect id="home" class="home" x="${left + 96}" width="${right - left - 96}" y="0" height="0" rx="6" opacity="0"/>`;

  // Staff lines, barline, clefs (each section hides the clef it zooms away from)
  const lines = [2, 4, 6, 8, 10, -2, -4, -6, -8, -10];
  h += `<g stroke="var(--staff)" stroke-width="2.4" stroke-linecap="round">${lines.map(st => `<line x1="${left}" x2="${right}" y1="${yOf(st)}" y2="${yOf(st)}"/>`).join('')}
    <line x1="${left}" x2="${left}" y1="120" y2="520" stroke-width="3"/></g>`;
  if (has('charlie')) h += `<line x1="${X('charlie') - 44 * s}" x2="${X('charlie') + 44 * s}" y1="320" y2="320" stroke="var(--staff)" stroke-width="2.6" stroke-linecap="round"/>`;
  const showTreble = state.section !== 'sea', showBass = state.section !== 'right';
  h += `<g fill="none" stroke="var(--staff)" stroke-linecap="round" stroke-linejoin="round" transform="translate(${left + 10} 0)">
    ${showTreble ? `<path d="M47 262 C28 263 25 236 45 230 C66 224 76 250 57 268 C38 286 14 262 20 232 C25 204 60 186 62 150 C64 118 45 110 42 132 C38 162 50 240 55 300 C57 322 42 332 33 320" stroke-width="6"/>
    <circle cx="36" cy="316" r="7" fill="var(--staff)" stroke="none"/>` : ''}
    ${showBass ? `<path d="M30 400 C26 368 76 358 78 398 C80 440 52 470 22 488" stroke-width="7"/>
    <circle cx="31" cy="400" r="8" fill="var(--staff)" stroke="none"/>
    <circle cx="94" cy="380" r="5" fill="var(--staff)" stroke="none"/><circle cx="94" cy="420" r="5" fill="var(--staff)" stroke="none"/>` : ''}
  </g>`;

  // The friends
  h += vis.map((i, k) => {
    const n = NOTES[i];
    return `<g class="char" data-i="${i}" tabindex="0" role="button" aria-label="${n.name}, note ${n.letter}" transform="translate(${L.xs[i]} ${yOf(n.step)}) scale(${s})">
      <circle class="ring" r="40" fill="${n.color}"/>
      <circle class="focus-ring" r="44"/>
      <g class="bob" style="--d:${(k * -0.37).toFixed(2)}s"><g class="hop">${charSVG(n.id)}</g></g>
      <circle r="44" fill="transparent"/>
    </g>`;
  }).join('');
  h += `<g id="fx"></g>`;
  const [vy0, vy1] = SECTIONS[state.section].view;
  world.setAttribute('viewBox', `0 ${vy0} ${W} ${vy1 - vy0}`);
  world.innerHTML = h;
  $('#seaTag').hidden = state.section === 'right';
  applySel(false);
}

/* ---------- Piano: the keys for the friends on screen ---------- */
function buildPiano() {
  const vis = visible(), n = vis.length;
  const home = "asdfghjkl;'".split(''), upper = 'qwertyuiop[]'.split(''), low = 'zxcvbnm'.split('');
  state.keymap = {}; state.blackmap = {}; state.caps = [];
  vis.forEach((i, k) => {
    const ch = n <= home.length ? home[k] : (NOTES[i].step < 0 ? low[k] : home[k - low.length]);
    state.keymap[ch] = i; state.caps[k] = ch;
  });
  let blacks = '';
  for (let k = 0; k < n - 1; k++) {
    const m = NOTES[vis[k]].midi;
    if (NOTES[vis[k + 1]].midi - m !== 2) continue;
    const hi = home.indexOf(state.caps[k]), hj = home.indexOf(state.caps[k + 1]);
    const ch = hi >= 0 && hj === hi + 1 ? upper[hj] : '';
    if (ch) state.blackmap[ch] = m + 1;
    blacks += `<button type="button" class="key bkey" tabindex="-1" data-midi="${m + 1}" style="left:calc(${k + 1} * 100% / ${n});width:calc(100% / ${n} * .58)" aria-label="Black key">${ch ? `<span class="cap" style="top:auto;bottom:10px">${ch.toUpperCase()}</span>` : ''}</button>`;
  }
  $('#piano').innerHTML = vis.map((i, k) => {
    const nt = NOTES[i];
    return `<button type="button" class="key wkey${nt.step === 0 ? ' midc' : ''}" tabindex="-1" data-i="${i}" style="--c:${nt.color}" aria-label="${nt.letter} key, ${nt.name}">
      <span class="cap">${state.caps[k].toUpperCase()}</span><span class="dot"></span><span class="nl">${nt.letter}</span></button>`;
  }).join('') + blacks;
}

/* ---------- Every input ends up here ---------- */
/** @param {number} i  @param {{ sound?: boolean }} [opts] */
function onNote(i, { sound = true } = {}) {
  state.sel = i;
  if (sound) Sound.play(NOTES[i].midi);
  applySel(true);
  flashKey(i);
  if (!state.touched) { state.touched = true; $('#hint').classList.add('gone'); }
}

/** @param {boolean} animate */
function applySel(animate) {
  const i = state.sel, n = NOTES[i], L = state.layout;
  if (L.xs[i] === undefined) return;
  world.querySelectorAll('.char').forEach(c => c.classList.toggle('sel', Number(/** @type {HTMLElement} */ (c).dataset.i) === i));
  const home = world.querySelector('#home');
  if (home) {
    const y = yOf(n.step), isLine = n.step % 2 === 0, hgt = isLine ? 10 : 34;
    home.setAttribute('y', String(y - hgt / 2)); home.setAttribute('height', String(hgt));
    home.setAttribute('fill', n.color);
    home.setAttribute('opacity', isLine ? '.8' : '.45');
    if (n.step === 0) { home.setAttribute('x', String(L.xs[i] - 50 * L.s)); home.setAttribute('width', String(100 * L.s)); }
    else { home.setAttribute('x', String(L.clefX + 96)); home.setAttribute('width', String(L.W - 20 - L.clefX - 96)); }
  }
  const card = $('#card');
  card.style.setProperty('--c', n.color);
  card.style.setProperty('--on-c', n.on);
  card.dataset.friend = n.id;
  $('#cardAvatar').innerHTML = charSVG(n.id);
  $('#cardLetter').textContent = n.letter;
  $('#cardName').textContent = n.name;
  $('#cardWhere').textContent = n.where;
  $('#cardStory').textContent = n.story;
  if (animate) { hop(i); sparkle(i); replay(card, 'pop'); }
}
/** @param {number} i */
function hop(i) {
  const g = world.querySelector(`.char[data-i="${i}"] .hop`);
  if (g) replay(g, 'go');
}
/** @param {number} i */
function sparkle(i) {
  const L = state.layout, n = NOTES[i], fx = world.querySelector('#fx');
  if (!fx || L.xs[i] === undefined || reducedMotion()) return;
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.setAttribute('transform', `translate(${L.xs[i]} ${yOf(n.step)})`);
  const cols = [n.color, '#FFD65C', '#FFFFFF'];
  g.innerHTML = Array.from({ length: 9 }, (_, k) => {
    const a = (k / 9) * Math.PI * 2 + Math.random() * .4, d = 48 + Math.random() * 18;
    return `<path class="spark" style="--dx:${(Math.cos(a) * d).toFixed(1)}px;--dy:${(Math.sin(a) * d).toFixed(1)}px" d="M0 -6 L1.8 -1.8 L6 0 L1.8 1.8 L0 6 L-1.8 1.8 L-6 0 L-1.8 -1.8Z" fill="${cols[k % 3]}" stroke="${INK}" stroke-width="1"/>`;
  }).join('');
  fx.appendChild(g);
  setTimeout(() => g.remove(), 750);
}
/** @param {number} i */
function flashKey(i) {
  const k = /** @type {HTMLElement & { _t?: number } | null} */ (document.querySelector(`#piano .wkey[data-i="${i}"]`));
  if (!k) return;
  k.classList.add('lit'); clearTimeout(k._t); k._t = window.setTimeout(() => k.classList.remove('lit'), 220);
}

/* ---------- Touch and mouse ---------- */
world.addEventListener('pointerdown', e => {
  const c = /** @type {HTMLElement | null} */ (/** @type {Element} */ (e.target).closest('.char'));
  if (!c) return;
  e.preventDefault();
  onNote(Number(c.dataset.i));
});
const piano = $('#piano');
/** @type {Map<number, HTMLElement>} */
const held = new Map();
/** @param {HTMLElement} key */
function pressKey(key) {
  key.classList.add('down');
  if (key.classList.contains('wkey')) onNote(Number(key.dataset.i));
  else Sound.play(Number(key.dataset.midi));
}
/** @param {HTMLElement | undefined} key */
const releaseKey = key => key && key.classList.remove('down');
piano.addEventListener('pointerdown', e => {
  const key = /** @type {HTMLElement | null} */ (/** @type {Element} */ (e.target).closest('.key'));
  if (!key) return;
  e.preventDefault();
  try { /** @type {Element} */ (e.target).releasePointerCapture?.(e.pointerId); } catch { /* not captured */ }
  held.set(e.pointerId, key); pressKey(key);
});
piano.addEventListener('pointermove', e => {
  if (!held.has(e.pointerId)) return;
  const el = document.elementFromPoint(e.clientX, e.clientY);
  const key = /** @type {HTMLElement | null} */ (el && el.closest('#piano .key'));
  const prev = held.get(e.pointerId);
  if (key && key !== prev) { releaseKey(prev); held.set(e.pointerId, key); pressKey(key); } // slide = glissando
});
const endPointer = (/** @type {PointerEvent} */ e) => { releaseKey(held.get(e.pointerId)); held.delete(e.pointerId); };
window.addEventListener('pointerup', endPointer);
window.addEventListener('pointercancel', endPointer);
piano.addEventListener('contextmenu', e => e.preventDefault());

/* ---------- Laptop keys ---------- */
const markKeyboard = () => document.body.classList.add('kb');
if (hasKeyboard()) markKeyboard();
/** @param {string} letter */
function nearestWithLetter(letter) {
  const vis = visible(), here = vis.indexOf(state.sel);
  let best = -1, bestD = 99;
  vis.forEach((i, k) => {
    if (NOTES[i].letter.toLowerCase() === letter && Math.abs(k - here) < bestD) { bestD = Math.abs(k - here); best = i; }
  });
  return best;
}
/** @type {Map<string, Element>} */
const keyDown = new Map();
document.addEventListener('keydown', e => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const k = e.key.toLowerCase();
  const target = /** @type {Element} */ (e.target);
  const onChar = target.closest && target.closest('.char');
  if (onChar && (k === 'enter' || k === ' ')) { e.preventDefault(); onNote(Number(/** @type {HTMLElement} */ (onChar).dataset.i)); return; }
  if (target.closest && target.closest('button, a') && (k === 'enter' || k === ' ')) return;
  markKeyboard();
  const vis = visible(), at = vis.indexOf(state.sel);
  if (k === 'arrowright' || k === 'arrowup') { e.preventDefault(); if (!e.repeat) onNote(vis[Math.min(vis.length - 1, at + 1)]); return; }
  if (k === 'arrowleft' || k === 'arrowdown') { e.preventDefault(); if (!e.repeat) onNote(vis[Math.max(0, at - 1)]); return; }
  if (k === ' ' || k === 'enter') { e.preventDefault(); if (!e.repeat) onNote(state.sel); return; }
  /** @type {Element | null} */
  let el = null;
  if (state.mode === 'piano') {
    if (k in state.keymap) { if (!e.repeat) onNote(state.keymap[k]); el = document.querySelector(`#piano .wkey[data-i="${state.keymap[k]}"]`); }
    else if (k in state.blackmap) { if (!e.repeat) Sound.play(state.blackmap[k]); el = document.querySelector(`#piano .bkey[data-midi="${state.blackmap[k]}"]`); }
  } else if (k.length === 1 && 'abcdefg'.includes(k)) {
    const i = nearestWithLetter(k);
    if (i >= 0) { if (!e.repeat) onNote(i); el = document.querySelector(`#piano .wkey[data-i="${i}"]`); }
  }
  if (el) { e.preventDefault(); el.classList.add('down'); keyDown.set(k, el); }
});
document.addEventListener('keyup', e => {
  const k = e.key.toLowerCase(), el = keyDown.get(k);
  if (el) { el.classList.remove('down'); keyDown.delete(k); }
});

function updateTip() {
  document.body.classList.toggle('mode-piano', state.mode === 'piano');
  const kb = (/** @type {string} */ c) => `<kbd>${c.toUpperCase()}</kbd>`;
  let tip;
  if (state.mode === 'letters') tip = `Type a note name: ${'CDEFGAB'.split('').map(kb).join(' ')}. Arrows walk up and down.`;
  else if (state.section === 'all') tip = `Sea friends: ${state.caps.slice(0, 7).map(kb).join(' ')}. Land friends: ${state.caps.slice(7).map(kb).join(' ')}.`;
  else tip = `Play with ${state.caps.map(kb).join(' ')}. Black keys are the row above.`;
  $('#kbTip').innerHTML = tip; // built only from the constant key letters above
}
radioGroup($('#modeSeg'), v => { state.mode = v; updateTip(); }, state.mode);

/** @param {string} v */
function setSection(v) {
  if (!(v in SECTIONS)) return;
  state.section = /** @type {Section} */ (v);
  memory.set('sea-section', v);
  $('#tagline').textContent = SECTIONS[state.section].tag;
  if (!visible().includes(state.sel)) state.sel = MIDDLE_C;
  buildPiano(); updateTip(); buildScene();
}
const markSection = radioGroup($('#sectionSeg'), setSection, state.section);

/* ---------- Buttons ---------- */
$('#replayBtn').addEventListener('click', () => onNote(state.sel));
let parading = false;
$('#paradeBtn').addEventListener('click', async () => {
  if (parading) return;
  parading = true;
  const btn = /** @type {HTMLButtonElement} */ ($('#paradeBtn'));
  btn.disabled = true;
  Sound.ensure();
  const vis = visible().slice();
  for (const i of vis) { onNote(i); await new Promise(r => setTimeout(r, 420)); }
  Sound.cheer();
  vis.forEach((i, k) => setTimeout(() => { hop(i); sparkle(i); }, k * 50));
  parading = false; btn.disabled = false;
});

/* ---------- Start ---------- */
$('#brandIcon').innerHTML = clownfish();
markSection(state.section);
setSection(state.section);
new ResizeObserver(() => {
  if (layoutFor($('#scene').clientWidth, visible().length).W !== state.layout.W) buildScene();
}).observe($('#scene'));

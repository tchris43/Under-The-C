// @ts-check
/**
 * The one settings screen every quiz game uses. It comes up before the game, and the settings button
 * in the header brings it back during play. Rules live in settings.js; this file only draws and listens.
 *
 * A game page needs `<section class="setup" id="setup" hidden></section>`, its play area inside
 * `<div id="game" hidden>`, and a header `.top`. Markup comes only from constants and the friends table.
 *
 *   const screen = setup({ game: 'flash', options: ['mode', 'letters'], onPlay: s => newGame(s) });
 *   screen.open();   // e.g. from a "Change settings" button
 *
 * Opening the screen never throws away a game in progress: "Back to game", or Play with nothing changed,
 * returns to it (onResume). Only a real change starts a new game (onPlay).
 */
import { NOTES, HANDS } from './notes.js';
import { charSVG } from './characters.js';
import { Sound } from './sound.js';
import { $, radioGroup, memory } from './ui.js';
import { loadSettings, saveSettings, sameSettings, checkSettings, handOf } from './settings.js';

/** @typedef {import('./settings.js').Settings} Settings */
/** @typedef {'level' | 'mode' | 'letters'} Option  friends are always shown */

const seg = (/** @type {string} */ id, /** @type {string} */ label, /** @type {[string, string][]} */ items) =>
  `<div class="seg" id="${id}" role="radiogroup" aria-label="${label}">${items.map(([v, text]) =>
    `<button type="button" role="radio" data-v="${v}" aria-checked="false">${text}</button>`).join('')}</div>`;

const GEAR = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><circle cx="12" cy="12" r="8.3" stroke-width="3.4" stroke-dasharray="3.26 3.26"/><circle cx="12" cy="12" r="5.6" stroke-width="2.6"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/></svg>`;
const BACK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>`;
const LEVEL_HINT = { 1: 'Name the friend who lives on the note', 2: 'Name two friends, then: step or skip?' };
const PLAY = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z"/></svg>`;

/**
 * @param {{ game: string, options: Option[], onPlay: (s: Settings) => void, onOpen?: () => void, onResume?: () => void }} config
 * @returns {{ open: () => void, settings: Settings }}
 */
export function setup({ game, options, onPlay, onOpen, onResume }) {
  const s = loadSettings(game, memory);
  let started = false;
  /** @type {Settings} */ let before = { ...s, pool: [...s.pool] };
  const has = (/** @type {Option} */ o) => options.includes(o);
  const screen = $('#setup'), gameEl = $('#game');

  screen.innerHTML = `
    <h2>Set up practice</h2>
    <div class="field">
      <h3>Which friends?</h3>
      ${seg('handSeg', 'Hand shortcuts', [['left', 'Left hand'], ['right', 'Right hand'], ['both', 'Both hands']])}
      <div class="friends" id="friends" role="group" aria-label="Friends to practise">${NOTES.map((n, i) =>
        `<button type="button" class="fr${n.step === 0 ? ' midc' : ''}" data-i="${i}" style="--c:${n.color}" aria-pressed="false" aria-label="${n.name}, ${n.letter}${n.step === 0 ? ', middle C' : ''}"><svg viewBox="-44 -44 88 88" aria-hidden="true">${charSVG(n.id)}</svg>${n.letter}</button>`).join('')}</div>
    </div>
    ${has('level') ? `<div class="field"><h3>Level</h3>${seg('levelSeg', 'Level', [['1', 'Level 1'], ['2', 'Level 2']])}<p class="hint" id="levelHint"></p></div>` : ''}
    ${has('mode') ? `<div class="field"><h3>How to answer</h3>${seg('modeSeg', 'How to answer', [['pad', 'Letter Pad'], ['piano', 'Piano Keys']])}</div>` : ''}
    ${has('letters') ? `<div class="field" id="lettersField"><h3>Letters on the piano keys</h3>${seg('lettersSeg', 'Letters on the keys', [['on', 'Letters on keys'], ['off', 'No letters']])}</div>` : ''}
    <div class="play-bar">
      <p class="hint" id="setupHint" aria-live="polite"></p>
      <button type="button" class="btn soft" id="backBtn" hidden>${BACK}Back to game</button>
      <button type="button" class="btn play" id="playBtn">${PLAY}Play!</button>
    </div>`;

  // The settings button sits in the header and shows only during play.
  const gear = document.createElement('button');
  gear.type = 'button'; gear.className = 'btn soft gear'; gear.id = 'settingsBtn';
  gear.setAttribute('aria-label', 'Settings'); gear.innerHTML = GEAR; gear.hidden = true;
  $('.top').appendChild(gear);

  /** Show the chosen friends and the matching hand, and say why Play is off when it is. */
  function refresh() {
    screen.querySelectorAll('.fr').forEach(b => b.setAttribute('aria-pressed', String(s.pool.includes(Number(/** @type {HTMLElement} */ (b).dataset.i)))));
    markHand(handOf(s.pool));
    const why = checkSettings({ pool: s.pool, level: has('level') ? s.level : 1 });
    const hint = $('#setupHint');
    hint.textContent = why || `${s.pool.length} friends`;
    hint.classList.toggle('warn', why !== '');
    /** @type {HTMLButtonElement} */ ($('#playBtn')).disabled = why !== '';
    if (has('letters')) $('#lettersField').hidden = s.mode !== 'piano';
    if (has('level')) $('#levelHint').textContent = LEVEL_HINT[s.level];
  }

  const markHand = radioGroup($('#handSeg'), v => {
    if (v === 'left' || v === 'right' || v === 'both') { s.pool = [...HANDS[v]]; refresh(); }
  });
  $('#friends').addEventListener('click', e => {
    const b = /** @type {HTMLElement | null} */ (/** @type {Element} */ (e.target).closest('.fr'));
    if (!b) return;
    const i = Number(b.dataset.i);
    if (s.pool.includes(i)) s.pool = s.pool.filter(x => x !== i);
    else { s.pool = [...s.pool, i].sort((a, c) => a - c); Sound.play(NOTES[i].midi, 0, .6); }
    refresh();
  });
  if (has('level')) radioGroup($('#levelSeg'), v => { s.level = v === '2' ? 2 : 1; refresh(); }, String(s.level));
  if (has('mode')) radioGroup($('#modeSeg'), v => { s.mode = v === 'piano' ? 'piano' : 'pad'; refresh(); }, s.mode);
  if (has('letters')) radioGroup($('#lettersSeg'), v => { s.letters = v === 'on'; }, s.letters ? 'on' : 'off');

  function open() {
    onOpen?.();
    before = { ...s, pool: [...s.pool] };
    gameEl.hidden = true; gear.hidden = true; screen.hidden = false;
    $('#backBtn').hidden = !started;
    document.body.dataset.screen = 'setup';
    refresh();
  }
  function show() {
    screen.hidden = true; gameEl.hidden = false; gear.hidden = false;
    document.body.dataset.screen = 'play';
  }
  /** Back to the game in progress, with the choices it was started with. */
  function back() {
    Object.assign(s, before, { pool: [...before.pool] });
    show();
    onResume?.();
  }
  function play() {
    if (checkSettings({ pool: s.pool, level: has('level') ? s.level : 1 })) return;
    if (started && sameSettings(s, before)) { back(); return; }
    saveSettings(game, s, memory, options);
    started = true;
    show();
    onPlay(s);
  }
  $('#playBtn').addEventListener('click', play);
  $('#backBtn').addEventListener('click', back);
  gear.addEventListener('click', open);

  return { open, settings: s };
}

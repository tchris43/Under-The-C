// @ts-check
/**
 * PRACTICE BUDDY: a teacher's lesson points for one song become small missions the student plays on a real piano.
 * The page listens through the microphone (after a tap) and hears one note at a time; tapping the keys on screen
 * works too. Plans here are built in: a demo plan a teacher made for "Lightly Row", and one for each starter song.
 * Every song is a public-domain folk or classical tune.
 */
import { NOTES } from '../kit/notes.js';
import { charSVG } from '../kit/characters.js';
import { Sound } from '../kit/sound.js';
import { listen, hush } from '../kit/listen.js';
import { $, memory } from '../kit/ui.js';
import { enableOffline } from '../kit/offline.js';

/** @typedef {'start' | 'find' | 'rhythm' | 'slow' | 'play'} Drill */
/** @typedef {{ drill: Drill, say: string, friend?: string }} Mission */
/** @typedef {{ id: string, title: string, hint: string, bpm: number, start: number, tricky?: number, line: [number, number][],
 *   goal: string, tip: string, missions: Mission[] }} Plan */

const LETTER = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
const name = (/** @type {number} */ m) => LETTER[m % 12];
const isBlack = (/** @type {number} */ m) => [1, 3, 6, 8, 10].includes(m % 12);
const where = (/** @type {number} */ m) => (m === 60 ? 'middle C' : m < 60 ? `low ${name(m)}` : name(m));
/** The Note Friend for a key: the friend with that letter, nearest octave first. */
const friendOf = (/** @type {number} */ m) =>
  (NOTES.find(n => n.midi === m) || NOTES.find(n => n.midi === m - 12) || NOTES.find(n => n.midi === m + 12)
    || NOTES.find(n => n.midi % 12 === m % 12) || NOTES[7]);
const DRILL_LABEL = { start: 'Starting spot', find: 'Find the note', rhythm: 'Rhythm', slow: 'Slow and steady', play: 'Play the song' };

/* ---------- Plans (public-domain songs; n = key, beats) ---------- */
/** @type {Plan} */
const DEMO = {
  id: 'lightly-row', title: 'Lightly Row', hint: 'Demo · a plan your teacher made', bpm: 92, start: 60, tricky: 65,
  line: [[67, 1], [64, 1], [64, 2], [65, 1], [62, 1], [62, 2], [60, 1], [62, 1], [64, 1], [65, 1], [67, 1], [67, 1], [67, 2]],
  goal: 'Play the first line of Lightly Row with a steady beat.',
  tip: 'Your child starts with the right thumb on middle C and keeps the hand still: every note is under a finger. Listen for the long notes and help them count “1, 2”.',
  missions: [
    { drill: 'start', say: 'Thumb on middle C. Your hand lives in C position!', friend: 'charlie' },
    { drill: 'find', say: 'After E comes F. Use finger 4, not your pinky!', friend: 'flossy' },
    { drill: 'rhythm', say: 'Hold the long notes. Count 1, 2!', friend: 'ellie' },
    { drill: 'slow', say: 'Play it slowly first. Slow is smart!', friend: 'donna' },
    { drill: 'play', say: 'Play the whole first line of Lightly Row!', friend: 'gracie' },
  ],
};
const SONGS = [
  { id: 'hot', title: 'Hot Cross Buns', hint: '3 notes · E D C', bpm: 96, start: 64,
    line: [[64, 1], [62, 1], [60, 2], [64, 1], [62, 1], [60, 2], [60, .5], [60, .5], [60, .5], [60, .5], [62, .5], [62, .5], [62, .5], [62, .5], [64, 1], [62, 1], [60, 2]] },
  { id: 'mary', title: 'Mary Had a Little Lamb', hint: 'C position · E D C D', bpm: 100, start: 64,
    line: [[64, 1], [62, 1], [60, 1], [62, 1], [64, 1], [64, 1], [64, 2], [62, 1], [62, 1], [62, 2], [64, 1], [67, 1], [67, 2]] },
  { id: 'twinkle', title: 'Twinkle, Twinkle', hint: 'C position · starts on C', bpm: 96, start: 60,
    line: [[60, 1], [60, 1], [67, 1], [67, 1], [69, 1], [69, 1], [67, 2], [65, 1], [65, 1], [64, 1], [64, 1], [62, 1], [62, 1], [60, 2]] },
  { id: 'ode', title: 'Ode to Joy', hint: 'C position · E E F G', bpm: 100, start: 60,
    line: [[64, 1], [64, 1], [65, 1], [67, 1], [67, 1], [65, 1], [64, 1], [62, 1], [60, 1], [60, 1], [62, 1], [64, 1], [64, 1.5], [62, .5], [62, 2]] },
  { id: 'minuet', title: 'Minuet in G (opening)', hint: 'G position · has F♯', bpm: 92, start: 67, tricky: 78,
    line: [[74, 1], [67, .5], [69, .5], [71, .5], [72, .5], [74, 1], [67, 1], [67, 1], [76, 1], [72, .5], [74, .5], [76, .5], [78, .5], [79, 1], [67, 1], [67, 1]] },
];
/** @param {typeof SONGS[number]} s  @returns {Plan} */
function starterPlan(s) {
  /** @type {Mission[]} */
  const missions = [
    { drill: 'start', say: s.start === 60 ? 'Right thumb on middle C. Ready, set…' : `Put your right hand on ${where(s.start)} to start.` },
    ...(s.tricky ? [{ drill: /** @type {Drill} */ ('find'), say: 'Watch for the sharp. It’s a black key!' }] : []),
    { drill: 'rhythm', say: 'Play the first line in rhythm. Hold the long notes!' },
    { drill: 'slow', say: 'Play it slowly first. Slow is smart!' },
    { drill: 'play', say: `Play all of ${s.title}!` },
  ];
  const friends = [...new Set(s.line.map(([m]) => friendOf(m).id))];
  missions.forEach((r, i) => { r.friend = friends[i % friends.length]; });
  return { ...s, line: /** @type {[number, number][]} */ (s.line), missions, goal: `Play ${s.title} on your piano.`,
    tip: 'Put the iPad on the music stand and press “Listen to my piano”. Your child plays one note at a time; the app shows what it heard.' };
}
const PLANS = [DEMO, ...SONGS.map(starterPlan)];

/* ---------- State and sounds ---------- */
/** @type {{ plan: Plan | null, drill: { onKey?: (m: number, key: HTMLElement, fromPiano: boolean) => void, onTap?: () => void } | null, listening: boolean }} */
const state = { plan: null, drill: null, listening: false };
/** App sounds pause the microphone so it doesn't hear itself. */
const sfx = {
  play: (/** @type {number} */ m, t = 0, v = 1) => { hush(t * 1000 + (m >= 84 ? 140 : 1100)); Sound.play(m, t, v); },
  cheer: () => { hush(1900); Sound.cheer(); },
  buzz: () => { hush(450); Sound.buzz(); },
};
/** A heard note matches when it's the same key, or the same letter: microphones sometimes hear a piano note an octave off. */
const same = (/** @type {number} */ a, /** @type {number} */ b) => a === b || (state.listening && a % 12 === b % 12);
const done = (/** @type {Plan} */ p) => { try { return /** @type {number[]} */ (JSON.parse(memory.get(`buddy-done:${p.id}`, '[]'))); } catch { return []; } };
const markDone = (/** @type {number} */ i) => {
  if (!state.plan) return;
  const d = done(state.plan);
  if (!d.includes(i)) { d.push(i); memory.set(`buddy-done:${state.plan.id}`, JSON.stringify(d)); }
};

/* ---------- Screens ---------- */
$('#planList').innerHTML = PLANS.map((p, i) =>
  `<button type="button" class="plan" data-k="${i}"><strong>${p.title}</strong><span>${p.hint}</span></button>`).join('');
$('#planList').addEventListener('click', e => {
  const b = /** @type {HTMLElement | null} */ (/** @type {Element} */ (e.target).closest('[data-k]'));
  if (b) openPlan(PLANS[Number(b.dataset.k)]);
});
/** @param {Plan} plan */
function openPlan(plan) {
  state.plan = plan;
  show('missionPanel');
  renderMissions();
}
/** @param {'planPanel' | 'missionPanel' | 'drillPanel'} id */
function show(id) {
  for (const p of ['planPanel', 'missionPanel', 'drillPanel']) $('#' + p).hidden = p !== id;
  if (id !== 'drillPanel') { stopMetro(); state.drill = null; }
}
function renderMissions() {
  const plan = /** @type {Plan} */ (state.plan), d = done(plan);
  $('#missionTitle').textContent = plan.title;
  $('#missionGoal').textContent = plan.goal;
  $('#missionTip').textContent = plan.tip;
  $('#missions').innerHTML = plan.missions.map((r, i) => {
    const f = NOTES.find(n => n.id === r.friend) || NOTES[7], ok = d.includes(i);
    return `<div class="mission${ok ? ' done' : ''}" style="--c:${f.color}">
      <div class="av"><svg viewBox="-44 -44 88 88" aria-hidden="true">${charSVG(f.id)}</svg></div>
      <div class="txt"><span class="tag">${DRILL_LABEL[r.drill]}</span><strong>${r.say}</strong></div>
      ${ok ? '<span class="check" aria-label="Done"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg></span>'
           : `<button type="button" class="btn small" data-go="${i}">Practice</button>`}</div>`;
  }).join('');
  $('#dots').innerHTML = plan.missions.map((_, i) => `<i class="${d.includes(i) ? 'on' : ''}"></i>`).join('');
}
$('#missions').addEventListener('click', e => {
  const b = /** @type {HTMLElement | null} */ (/** @type {Element} */ (e.target).closest('[data-go]'));
  if (b) startDrill(Number(b.dataset.go));
});
$('#listBtn').addEventListener('click', () => show('planPanel'));
$('#backBtn').addEventListener('click', () => { show('missionPanel'); renderMissions(); });
$('#hearSongBtn').addEventListener('click', () => { if (state.plan) playLine(state.plan.line, state.plan.bpm); });
/** @param {[number, number][]} line  @param {number} bpm */
function playLine(line, bpm) {
  Sound.ensure();
  let t = 0;
  for (const [m, b] of line) { sfx.play(m, t, .9); t += b * 60 / bpm; }
}

/* ---------- On-screen piano (also shows what the microphone heard) ---------- */
const LOW = 48, HIGH = 84;
const WHITES = [];
for (let m = LOW; m <= HIGH; m++) if (!isBlack(m)) WHITES.push(m);
$('#keys').innerHTML = WHITES.map(m => `<button type="button" class="wk${m === 60 ? ' midc' : ''}" data-m="${m}" aria-label="${name(m)}${m === 60 ? ', middle C' : ''}"><span class="nl">${name(m)}</span></button>`).join('')
  + WHITES.map((m, k) => (isBlack(m + 1) && m + 1 <= HIGH
    ? `<button type="button" class="bk" tabindex="-1" data-m="${m + 1}" aria-label="${name(m + 1)}" style="left:calc(${k + 1} * 100% / ${WHITES.length});width:calc(100% / ${WHITES.length} * .6)"></button>` : '')).join('');
const keyEl = (/** @type {number} */ m) => /** @type {HTMLElement | null} */ (document.querySelector(`#keys [data-m="${m}"]`));
/** @param {HTMLElement | null} el  @param {string} cls */
function flash(el, cls, ms = 400) { if (!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); setTimeout(() => el.classList.remove(cls), ms); }
function clearKeys() {
  document.querySelectorAll('#keys .ok, #keys .glow').forEach(k => k.classList.remove('ok', 'glow'));
  document.querySelectorAll('#keys .mini').forEach(x => x.remove());
}
function scrollToKey(/** @type {number} */ m) {
  const k = keyEl(m), wrap = $('#keysWrap');
  if (k) wrap.scrollLeft = Math.max(0, k.offsetLeft - wrap.clientWidth / 2 + k.offsetWidth / 2);
}
$('#keys').addEventListener('pointerdown', e => {
  const k = /** @type {HTMLElement | null} */ (/** @type {Element} */ (e.target).closest('[data-m]'));
  if (!k) return;
  e.preventDefault();
  const m = Number(k.dataset.m);
  sfx.play(m);
  k.classList.add('down'); setTimeout(() => k.classList.remove('down'), 140);
  if (state.drill && state.drill.onKey) state.drill.onKey(m, k, false);
});
$('#keys').addEventListener('click', e => { // Enter or Space on a focused key
  const k = /** @type {HTMLElement | null} */ (/** @type {Element} */ (e.target).closest('[data-m]'));
  if (k && e.detail === 0 && state.drill && state.drill.onKey) { sfx.play(Number(k.dataset.m)); state.drill.onKey(Number(k.dataset.m), k, false); }
});
$('#keys').addEventListener('contextmenu', e => e.preventDefault());

/* ---------- Missions ---------- */
const STAR = (/** @type {boolean} */ on) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 6 6.6.8-4.9 4.5 1.3 6.5L12 17l-5.9 3.3 1.3-6.5L2.5 9.3l6.6-.8z" fill="${on ? '#FFC94D' : 'none'}" stroke="#2A2238" stroke-width="1.6" stroke-linejoin="round"/></svg>`;
/** @param {Mission} r */
function drillShell(r) {
  $('#drill').innerHTML = `<div class="drill-top"><div class="av"><svg viewBox="-44 -44 88 88" aria-hidden="true">${charSVG(r.friend || 'charlie')}</svg></div><div class="bubble">${r.say}</div></div>
    <div id="drillBody"></div><p class="feedback" id="fb" aria-live="polite"></p>`;
}
function say(/** @type {string} */ text, kind = '') { const fb = $('#fb'); fb.className = 'feedback ' + kind; fb.textContent = text; }
/** @param {number} i  @param {number} mistakes */
function celebrate(i, mistakes) {
  stopMetro(); sfx.cheer(); markDone(i); state.drill = null;
  const stars = mistakes === 0 ? 3 : mistakes <= 3 ? 2 : 1;
  $('#drillBody').innerHTML = `<div class="celebrate"><div class="stars">${[0, 1, 2].map(k => STAR(k < stars)).join('')}</div><h3>Mission done!</h3>
    <div class="row" style="justify-content:center"><button type="button" class="btn soft" id="againBtn">Do it again</button><button type="button" class="btn" id="nextBtn">Next mission</button></div></div>`;
  $('#drillPanel').dataset.phase = 'done';
  say(stars === 3 ? 'Perfect!' : 'Great practising!', 'ok');
  $('#againBtn').onclick = () => startDrill(i);
  $('#nextBtn').onclick = () => {
    const plan = /** @type {Plan} */ (state.plan), d = done(plan);
    const next = plan.missions.findIndex((_, j) => j > i && !d.includes(j));
    if (next >= 0) startDrill(next); else $('#backBtn').click();
  };
}
/** @param {number} i */
function startDrill(i) {
  const r = /** @type {Plan} */ (state.plan).missions[i];
  show('drillPanel'); $('#metroBtn').hidden = true;
  clearKeys(); Sound.ensure();
  $('#drillPanel').dataset.drill = r.drill; $('#drillPanel').dataset.phase = 'play';
  ({ start: drillStart, find: drillFind, rhythm: drillRhythm, slow: drillPlay, play: drillPlay })[r.drill](r, i);
  $('#drillPanel').scrollIntoView({ block: 'start' });
}

/** Starting spot: play (or tap) the key the hand starts on. */
function drillStart(/** @type {Mission} */ r, /** @type {number} */ i) {
  const want = /** @type {Plan} */ (state.plan).start;
  drillShell(r);
  $('#drillBody').innerHTML = '<p class="hint big">Play the key where your right hand starts.</p>';
  scrollToKey(want);
  let misses = 0;
  state.drill = { onKey(m, k) {
    if (same(m, want)) {
      const key = keyEl(want) || k;
      key.classList.add('ok');
      key.insertAdjacentHTML('afterbegin', `<svg class="mini" viewBox="-44 -44 88 88" aria-hidden="true">${charSVG(friendOf(want).id)}</svg>`);
      say(`Yes, ${where(want)}!`, 'ok'); state.drill = null;
      setTimeout(() => celebrate(i, misses), 700);
    } else {
      misses++; sfx.buzz(); flash(k, 'no');
      say(misses >= 2 ? `Look for ${where(want)}. It’s glowing!` : `That’s ${name(m)}. Try again!`, 'no');
      if (misses >= 2) keyEl(want)?.classList.add('glow');
    }
  } };
}

/** Find the note: the tricky note from the lesson, or the first sharp. */
function drillFind(/** @type {Mission} */ r, /** @type {number} */ i) {
  const plan = /** @type {Plan} */ (state.plan);
  const target = plan.tricky ?? plan.line.find(([m]) => isBlack(m))?.[0] ?? plan.line[0][0];
  drillShell(r);
  $('#drillBody').innerHTML = `<p class="hint big">Find <strong>${name(target)}</strong>${isBlack(target) ? `: the black key just to the right of ${name(target - 1)}.` : '.'}</p>`;
  scrollToKey(target);
  let misses = 0;
  state.drill = { onKey(m, k) {
    if (m % 12 === target % 12) {
      (keyEl(target) || k).classList.add('ok'); say(`Yes! That’s ${name(m)}.`, 'ok'); state.drill = null;
      setTimeout(() => celebrate(i, misses), 700);
    } else {
      misses++; sfx.buzz(); flash(k, 'no');
      say(misses >= 2 ? 'It’s glowing. Play it!' : `That’s ${name(m)}. Try again!`, 'no');
      if (misses >= 2) keyEl(target)?.classList.add('glow');
    }
  } };
}

/** Play the song (or play it slowly with a beat): each note in order, the next one lights up. */
function drillPlay(/** @type {Mission} */ r, /** @type {number} */ i) {
  const plan = /** @type {Plan} */ (state.plan), mel = plan.line, slow = r.drill === 'slow';
  drillShell(r);
  $('#drillBody').innerHTML = `<div class="row"><button type="button" class="btn small soft" id="listenBtn">Listen first</button>
    <span class="hint">${slow ? 'One note for each beat. Turn the beat on if it helps.' : 'Play each note in order. Take your time.'}</span></div>
    <div class="seq" id="seq">${mel.map(([m, b]) => `<span class="${b >= 2 ? 'long' : ''}">${name(m)}</span>`).join('')}</div>`;
  $('#listenBtn').onclick = () => playLine(mel, plan.bpm * (slow ? .6 : 1));
  if (slow) { $('#metroBtn').hidden = false; metroBpm = Math.round(plan.bpm * .6); }
  let at = 0, misses = 0, total = 0;
  const seq = [...document.querySelectorAll('#seq span')];
  const paint = () => {
    seq.forEach((s, k) => { s.className = (mel[k][1] >= 2 ? 'long ' : '') + (k < at ? 'done' : k === at ? 'now' : ''); });
    if (at < mel.length) scrollToKey(mel[at][0]);
    $('#drillPanel').dataset.at = String(at);
  };
  paint();
  state.drill = { onKey(m, k) {
    const want = mel[at][0];
    if (same(m, want)) {
      at++; misses = 0; clearKeys();
      const key = keyEl(want) || k; key.classList.add('ok'); setTimeout(() => key.classList.remove('ok'), 250);
      say(at === mel.length ? 'You played the whole song!' : mel[at - 1][1] >= 2 ? 'Nice long note!' : '', 'ok');
      if (at === mel.length) { state.drill = null; setTimeout(() => celebrate(i, total), 600); }
      paint();
    } else {
      misses++; total++; sfx.buzz(); flash(k, 'no');
      say(misses >= 2 ? `Look for ${name(want)}. It’s glowing!` : m % 12 === want % 12 ? `Right letter! Try the other ${name(want)}.` : `Oops, that’s ${name(m)}. Next is ${name(want)}.`, 'no');
      if (misses >= 2) keyEl(want)?.classList.add('glow');
    }
  } };
}

/** Rhythm: play (or tap) the first line with the same long and short notes as the music. */
function drillRhythm(/** @type {Mission} */ r, /** @type {number} */ i) {
  const plan = /** @type {Plan} */ (state.plan);
  /** @type {[number, number][]} */
  const line = [];
  let sum = 0;
  for (const nb of plan.line) { line.push(nb); sum += nb[1]; if (sum >= 7 && nb[1] >= 1) break; }
  drillShell(r);
  $('#drillBody').innerHTML = `<div class="row"><button type="button" class="btn small soft" id="listenBtn">Listen</button>
    <span class="hint">Then play the notes on your piano in the same rhythm. (Or tap the big button.)</span></div>
    <div class="beats" id="beats">${line.map(([, b]) => `<span style="width:${Math.max(34, b * 54)}px">${b >= 1.5 ? 'ta-a' : b <= .5 ? 'ti' : 'ta'}</span>`).join('')}</div>
    <button type="button" class="btn tap" id="tapBtn">Tap</button>`;
  const blocks = [...document.querySelectorAll('#beats span')];
  const beat = 60 / plan.bpm;
  $('#listenBtn').onclick = () => {
    Sound.ensure();
    let t = 0;
    line.forEach(([m, b], k) => {
      sfx.play(m, t, .9);
      const at = t;
      setTimeout(() => { blocks.forEach(x => x.classList.remove('lit')); blocks[k].classList.add('lit'); }, at * 1000);
      t += b * beat;
    });
    setTimeout(() => blocks.forEach(x => x.classList.remove('lit')), t * 1000 + 200);
  };
  /** @type {number[]} */
  let taps = [];
  let tries = 0;
  /** @param {boolean} fromPiano  the note was already heard, so don't play it again */
  const tap = (fromPiano) => {
    const k = taps.length;
    if (k >= line.length) return;
    taps.push(performance.now());
    if (!fromPiano) sfx.play(line[k][0], 0, .8);
    blocks.forEach(x => x.classList.remove('lit')); blocks[k].classList.add('lit');
    if (taps.length < line.length) return;
    tries++;
    // Compare each gap with the written note lengths, at the child's own speed
    const gaps = taps.slice(1).map((t, j) => t - taps[j]);
    const want = line.slice(0, -1).map(([, b]) => b);
    const unit = gaps.reduce((a, g) => a + g, 0) / want.reduce((a, b) => a + b, 0);
    let off = 0;
    blocks.forEach(x => x.classList.remove('lit', 'good', 'short', 'longer'));
    gaps.forEach((g, j) => {
      const ratio = g / (unit * want[j]);
      const cls = ratio < .65 ? 'short' : ratio > 1.5 ? 'longer' : 'good';
      if (cls !== 'good') off++;
      blocks[j].classList.add(cls);
    });
    blocks[blocks.length - 1].classList.add('good');
    const heldShort = gaps.some((g, j) => g / (unit * want[j]) < .65 && want[j] >= 2);
    if (off === 0) { say('Steady as a clock!', 'ok'); state.drill = null; setTimeout(() => celebrate(i, tries - 1), 900); }
    else {
      say(heldShort ? 'Hold the long notes a little longer. Count 1, 2!' : 'Close! Try to match the music. Listen again if it helps.', 'no');
      setTimeout(() => { taps = []; blocks.forEach(x => x.classList.remove('good', 'short', 'longer')); }, 1600);
    }
  };
  $('#tapBtn').addEventListener('pointerdown', e => { e.preventDefault(); tap(false); });
  $('#tapBtn').addEventListener('click', e => { if (e.detail === 0) tap(false); });
  state.drill = { onTap: () => tap(false), onKey: (m, k, fromPiano) => tap(fromPiano) };
}
document.addEventListener('keydown', e => {
  if (e.key === ' ' && state.drill && state.drill.onTap && !/** @type {Element} */ (e.target).closest('button, a')) { e.preventDefault(); state.drill.onTap(); }
});

/* ---------- Beat for slow practice ---------- */
/** @type {number | undefined} */
let metroTimer;
let metroBpm = 60;
function stopMetro() {
  clearInterval(metroTimer); metroTimer = undefined;
  const b = $('#metroBtn'); b.setAttribute('aria-pressed', 'false'); b.textContent = 'Beat: off';
}
$('#metroBtn').addEventListener('click', () => {
  if (metroTimer) { stopMetro(); return; }
  const b = $('#metroBtn'); b.setAttribute('aria-pressed', 'true'); b.textContent = `Beat: on (${metroBpm})`;
  Sound.ensure(); sfx.play(84, 0, .25);
  metroTimer = window.setInterval(() => sfx.play(84, 0, .25), 60000 / metroBpm);
});

/* ---------- Listening to the real piano ---------- */
/** @type {{ stop: () => void } | null} */
let ear = null;
const QUIET_NOTE = 'The sound stays on this device. Nothing is recorded or sent anywhere.';
function stopListening() {
  if (ear) ear.stop();
  ear = null; state.listening = false;
  $('#micBtn').classList.remove('on'); $('#micLabel').textContent = 'Listen to my piano';
  $('#meterFill').style.width = '0'; $('#micStatus').textContent = QUIET_NOTE;
  document.body.dataset.listening = 'off';
}
/** @param {number} m  @param {number} _at */
function heard(m, _at) {
  $('#heardNote').textContent = name(m);
  let d = m;
  while (d < LOW) d += 12;
  while (d > HIGH) d -= 12;
  const k = keyEl(d);
  if (!k) return;
  flash(k, 'heard', 300);
  if (state.drill && state.drill.onKey) state.drill.onKey(d, k, true);
}
$('#micBtn').addEventListener('click', () => {
  if (ear) { stopListening(); return; }
  const status = $('#micStatus');
  status.textContent = 'Asking to use the microphone…';
  listen({ onNote: heard, onLevel: rms => { $('#meterFill').style.width = Math.min(100, rms * 600) + '%'; } })
    .then(handle => {
      ear = handle; state.listening = true;
      $('#micBtn').classList.add('on'); $('#micLabel').textContent = 'Listening… (tap to stop)';
      status.textContent = 'Play one note on your piano. The bar moves when I hear you. The sound stays on this device.';
      document.body.dataset.listening = 'on';
    })
    .catch(err => {
      status.textContent = err && err.name === 'NotAllowedError'
        ? 'The microphone isn’t allowed. You can still tap the keys on screen. To listen, allow the microphone for this site in Settings › Safari.'
        : 'This browser can’t listen here. You can still tap the keys on screen.';
      document.body.dataset.listening = 'off';
    });
});
document.addEventListener('visibilitychange', () => { if (document.hidden && ear) stopListening(); });

enableOffline();

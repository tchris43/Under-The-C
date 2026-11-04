// @ts-check
/** Small DOM helpers shared by the games. */
import { charSVG } from './characters.js';
import { seededRandom } from './logic.js';

/**
 * querySelector that fails loudly, so a missing element is caught by the tests instead of breaking silently.
 * @param {string} sel  @param {ParentNode} [root]
 * @returns {HTMLElement}
 */
export function $(sel, root = document) {
  const el = root.querySelector(sel);
  if (!el) throw new Error(`Missing element: ${sel}`);
  return /** @type {HTMLElement} */ (el);
}

/**
 * Wire a segmented control (buttons with role="radio" and a data-v value).
 * @param {HTMLElement} group  @param {(value: string) => void} onPick  @param {string} [initial]
 */
export function radioGroup(group, onPick, initial) {
  const buttons = /** @type {HTMLButtonElement[]} */ ([...group.querySelectorAll('button[data-v]')]);
  const set = (/** @type {string} */ v) => buttons.forEach(b => b.setAttribute('aria-checked', String(b.dataset.v === v)));
  if (initial) set(initial);
  buttons.forEach(b => b.addEventListener('click', () => { set(b.dataset.v || ''); onPick(b.dataset.v || ''); }));
  return set;
}

/** Per-device memory for small conveniences (last hand chosen). Silently does nothing when storage is blocked. */
export const memory = {
  /** @param {string} key  @param {string} fallback */
  get(key, fallback) { try { return localStorage.getItem(`under-the-c:${key}`) ?? fallback; } catch { return fallback; } },
  /** @param {string} key  @param {string} value */
  set(key, value) { try { localStorage.setItem(`under-the-c:${key}`, value); } catch { /* storage blocked: fine */ } },
};

/** Random numbers for dealing notes: repeatable when the link has ?seed=<number>, otherwise truly random. */
export function randomFromLink() {
  const seed = Number(new URLSearchParams(location.search).get('seed'));
  return Number.isInteger(seed) && seed > 0 ? seededRandom(seed) : Math.random;
}

export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** True on devices with a real mouse and keyboard, where key hints help. */
export const hasKeyboard = () => matchMedia('(hover: hover) and (pointer: fine)').matches;

const STAR = `<svg class="star" viewBox="-12 -12 24 24" aria-hidden="true"><path d="M0 -10 L3 -3 L10 -3 L4.5 1.5 L6.5 9 L0 4.5 L-6.5 9 L-4.5 1.5 L-10 -3 L-3 -3Z" fill="#FFD65C" stroke="#2A2238" stroke-width="1.6" stroke-linejoin="round"/></svg>`;

/** Sticker row: one empty circle per round. */
export const stickers = {
  /** @param {HTMLElement} el  @param {number} rounds */
  build(el, rounds) {
    el.innerHTML = Array.from({ length: rounds }, (_, i) => `<div class="slot" data-r="${i}"></div>`).join('');
  },
  /** @param {HTMLElement} el  @param {number} round */
  markCurrent(el, round) {
    el.querySelectorAll('.slot').forEach(s => s.classList.toggle('now', Number(/** @type {HTMLElement} */ (s).dataset.r) === round));
  },
  /**
   * @param {HTMLElement} el  @param {number} round
   * @param {{ id: string, color: string }[]} friends  one friend, or two for a step/skip round
   * @param {boolean} firstTry  earns a gold star
   */
  fill(el, round, friends, firstTry) {
    const slot = /** @type {HTMLElement | null} */ (el.querySelector(`.slot[data-r="${round}"]`));
    if (!slot) return;
    slot.style.setProperty('--c', friends[0].color);
    slot.classList.toggle('pair', friends.length > 1);
    slot.innerHTML = friends.map(f => `<svg viewBox="-44 -44 88 88" aria-hidden="true">${charSVG(f.id)}</svg>`).join('') + (firstTry ? STAR : '');
    slot.classList.add('filled');
    slot.classList.remove('now');
  },
};

/** Restart a CSS animation class on an element. @param {Element} el  @param {string} cls */
export function replay(el, cls) {
  el.classList.remove(cls);
  void /** @type {HTMLElement} */ (el).offsetWidth;
  el.classList.add(cls);
}

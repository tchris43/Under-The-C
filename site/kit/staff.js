// @ts-check
/**
 * The grand staff used by the quiz games, drawn in a 600 x 470 frame (viewBox "0 80 600 470").
 * Markup is built only from numbers and constants in the kit, never from user input.
 */
import { yOf, stemUp } from './notes.js';

const LEFT = 24, RIGHT = 576;
const LINES = [2, 4, 6, 8, 10, -2, -4, -6, -8, -10];

/** The staff with empty layers the games draw into: #homes, #arcG, #noteG, #ghostG, #revealG, #fx. */
export function staffMarkup() {
  return `
    <g id="homes"></g>
    <g stroke="var(--sheet-ink)" stroke-width="2.4" stroke-linecap="round">${LINES.map(s => `<line x1="${LEFT}" x2="${RIGHT}" y1="${yOf(s)}" y2="${yOf(s)}"/>`).join('')}
      <line x1="${LEFT}" x2="${LEFT}" y1="120" y2="520" stroke-width="3"/><line x1="${RIGHT}" x2="${RIGHT}" y1="120" y2="520" stroke-width="3"/></g>
    <g fill="none" stroke="var(--sheet-ink)" stroke-linecap="round" stroke-linejoin="round" transform="translate(${LEFT + 10} 0)">
      <path d="M47 262 C28 263 25 236 45 230 C66 224 76 250 57 268 C38 286 14 262 20 232 C25 204 60 186 62 150 C64 118 45 110 42 132 C38 162 50 240 55 300 C57 322 42 332 33 320" stroke-width="6"/>
      <circle cx="36" cy="316" r="7" fill="var(--sheet-ink)" stroke="none"/>
      <path d="M30 400 C26 368 76 358 78 398 C80 440 52 470 22 488" stroke-width="7"/>
      <circle cx="31" cy="400" r="8" fill="var(--sheet-ink)" stroke="none"/>
      <circle cx="94" cy="380" r="5" fill="var(--sheet-ink)" stroke="none"/><circle cx="94" cy="420" r="5" fill="var(--sheet-ink)" stroke="none"/>
    </g>
    <g id="arcG"></g>
    <g id="noteG" class="note-g"></g>
    <g id="ghostG" class="ghost" opacity="0"></g>
    <g id="revealG"></g>
    <g id="fx"></g>`;
}

/**
 * A quarter note on the staff, with the right stem direction and a ledger line for middle C.
 * @param {number} step  @param {number} x  @param {string} [id]
 */
export function noteMarkup(step, x, id = '') {
  const y = yOf(step);
  const stem = stemUp(step)
    ? `<line x1="${x + 12.5}" y1="${y - 3}" x2="${x + 12.5}" y2="${y - 72}"/>`
    : `<line x1="${x - 12.5}" y1="${y + 3}" x2="${x - 12.5}" y2="${y + 72}"/>`;
  const ledger = step === 0 ? `<line x1="${x - 26}" x2="${x + 26}" y1="${y}" y2="${y}" stroke-width="2.6"/>` : '';
  return `<g class="note"${id ? ` id="${id}"` : ''} data-step="${step}" data-stem="${stemUp(step) ? 'up' : 'down'}"><g stroke="var(--sheet-ink)" stroke-width="3.2" stroke-linecap="round">${ledger}${stem}</g>
    <ellipse cx="${x}" cy="${y}" rx="14" ry="10.5" fill="var(--sheet-ink)" transform="rotate(-22 ${x} ${y})"/></g>`;
}

/**
 * A coloured band showing the line or space a friend lives on.
 * @param {{ step: number, color: string }} note  @param {number} x
 */
export function homeMarkup(note, x) {
  const y = yOf(note.step), isLine = note.step % 2 === 0, h = isLine ? 10 : 34;
  const x0 = note.step === 0 ? x - 40 : 120, w = note.step === 0 ? 80 : 456;
  return `<rect x="${x0}" y="${y - h / 2}" width="${w}" height="${h}" rx="6" fill="${note.color}" opacity="${isLine ? .75 : .4}"/>`;
}

/**
 * A little burst of sparkles, removed after it plays.
 * @param {Element | null} layer  @param {number} x  @param {number} y  @param {string} color
 */
export function burst(layer, x, y, color) {
  if (!layer || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.setAttribute('transform', `translate(${x} ${y})`);
  const cols = [color, '#FFD65C', '#FFFFFF'];
  g.innerHTML = Array.from({ length: 10 }, (_, k) => {
    const a = (k / 10) * Math.PI * 2 + Math.random() * .4, d = 50 + Math.random() * 22;
    return `<path class="spark" style="--dx:${(Math.cos(a) * d).toFixed(1)}px;--dy:${(Math.sin(a) * d).toFixed(1)}px" d="M0 -7 L2 -2 L7 0 L2 2 L0 7 L-2 2 L-7 0 L-2 -2Z" fill="${cols[k % 3]}" stroke="#2A2238" stroke-width="1"/>`;
  }).join('');
  layer.appendChild(g);
  setTimeout(() => g.remove(), 800);
}

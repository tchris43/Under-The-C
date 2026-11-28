// @ts-check
/** FOR PARENTS: a plain page about the games. Draws the Note Friends and turns on offline play; nothing else. */
import { charSVG } from '../kit/characters.js';
import { enableOffline } from '../kit/offline.js';

document.querySelectorAll('svg[data-char]').forEach(svg => {
  svg.innerHTML = charSVG(/** @type {SVGElement} */ (svg).dataset.char || '');
});
enableOffline();

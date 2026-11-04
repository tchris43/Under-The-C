// @ts-check
import { charSVG } from './kit/characters.js';

document.querySelectorAll('svg[data-char]').forEach(svg => {
  svg.innerHTML = charSVG(/** @type {SVGElement} */ (svg).dataset.char || '');
});

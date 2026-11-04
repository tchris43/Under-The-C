// @ts-check
import { charSVG } from './kit/characters.js';
import { enableOffline, isInstalled } from './kit/offline.js';

document.querySelectorAll('svg[data-char]').forEach(svg => {
  svg.innerHTML = charSVG(/** @type {SVGElement} */ (svg).dataset.char || '');
});

// Show how to add the games to the home screen, unless they were opened from there already.
const install = document.getElementById('install');
if (install) install.hidden = isInstalled();
enableOffline();

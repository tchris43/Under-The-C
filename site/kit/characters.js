// @ts-check
/**
 * Character drawings for every Note Friend, as SVG markup strings.
 * Each drawing is centred on 0,0 and fits a viewBox of "-44 -44 88 88".
 * All markup here is built from constants in this file, never from user input.
 */
const INK = '#2A2238';
const O = `stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"`;
const eyes = (x1, x2, y, r = 3.4) => [x1, x2].map(x =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="${INK}"/><circle cx="${x + r * .35}" cy="${y - r * .35}" r="${r * .33}" fill="#fff"/>`).join('');
const cheeks = (x, y) => `<ellipse cx="${-x}" cy="${y}" rx="4.5" ry="3" fill="#FF7F9E" opacity=".45"/><ellipse cx="${x}" cy="${y}" rx="4.5" ry="3" fill="#FF7F9E" opacity=".45"/>`;
const smile = (x, y, w = 5) => `<path d="M${x - w} ${y} Q${x} ${y + w * .9} ${x + w} ${y}" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>`;

function gorilla(body, face, bow) {
  return `<circle cx="-25" cy="-2" r="8" fill="${body}" ${O}/><circle cx="25" cy="-2" r="8" fill="${body}" ${O}/>
  <circle cx="-25" cy="-2" r="3.6" fill="${face}"/><circle cx="25" cy="-2" r="3.6" fill="${face}"/>
  <circle r="26" fill="${body}" ${O}/>
  <path d="M-16 -6 C-16 -19 -2 -17 0 -9 C2 -17 16 -19 16 -6 C22 4 16 21 0 21 C-16 21 -22 4 -16 -6Z" fill="${face}"/>
  ${eyes(-7, 7, -5)}
  <ellipse cx="-3.4" cy="6" rx="1.8" ry="1.4" fill="${INK}"/><ellipse cx="3.4" cy="6" rx="1.8" ry="1.4" fill="${INK}"/>
  ${smile(0, 12, 6)}${cheeks(12, 9)}
  ${bow ? `<g transform="translate(13 -23) rotate(18)"><path d="M0 0 L-11 -7 L-11 7Z M0 0 L11 -7 L11 7Z" fill="#FFD2E1" ${O}/><circle r="3.6" fill="#FF8FB2" ${O}/></g>` : ''}`;
}
function fish(body, fin, stripes, fancy) {
  const tail = fancy
    ? `<path d="M-20 0 C-30 -22 -44 -22 -41 -6 C-46 -2 -46 2 -41 6 C-44 22 -30 22 -20 0Z" fill="${fin}" ${O}/>`
    : `<path d="M-20 0 L-37 -15 Q-31 0 -37 15Z" fill="${fin}" ${O}/>`;
  return `${tail}
  <path d="M-8 -16 Q2 -31 15 -14Z" fill="${fin}" ${O}/>
  <ellipse rx="25" ry="18" fill="${body}" ${O}/>
  ${stripes ? `<path d="M-7 -16 Q-12 0 -7 16 M-15 -12 Q-19 0 -15 12" fill="none" stroke="${fin}" stroke-width="4" stroke-linecap="round"/>` : `<path d="M-2 4 Q4 12 12 6" fill="none" stroke="${fin}" stroke-width="3" stroke-linecap="round"/>`}
  <circle cx="11" cy="-4" r="6.4" fill="#fff" ${O}/><circle cx="12.5" cy="-4" r="3.4" fill="${INK}"/><circle cx="13.6" cy="-5.2" r="1.1" fill="#fff"/>
  <path d="M15 7 Q19 10 22 5" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>
  <ellipse cx="6" cy="7" rx="3.6" ry="2.4" fill="#FF7F9E" opacity=".5"/>`;
}
function elephant() {
  const b = '#A3ACB9';
  return `<circle cx="-22" cy="-3" r="16" fill="${b}" ${O}/><circle cx="22" cy="-3" r="16" fill="${b}" ${O}/>
  <circle cx="-23" cy="-3" r="9" fill="#F4B8C6"/><circle cx="23" cy="-3" r="9" fill="#F4B8C6"/>
  <circle cy="-3" r="20" fill="${b}" ${O}/>
  <path d="M-4 7 C-4 20 -3 28 5 30 C11 31 13 25 8 23" fill="none" stroke="${INK}" stroke-width="14.4" stroke-linecap="round"/>
  <path d="M-4 7 C-4 20 -3 28 5 30 C11 31 13 25 8 23" fill="none" stroke="${b}" stroke-width="9" stroke-linecap="round"/>
  <path d="M-4 2 L-4 10" stroke="${b}" stroke-width="9"/>
  ${eyes(-8, 8, -7)}${cheeks(12, 4)}`;
}
function dog() {
  return `<ellipse cx="-20" cy="3" rx="8.5" ry="15" fill="#8E5530" ${O} transform="rotate(16 -20 3)"/>
  <ellipse cx="20" cy="3" rx="8.5" ry="15" fill="#8E5530" ${O} transform="rotate(-16 20 3)"/>
  <circle r="21" fill="#C8834A" ${O}/>
  <ellipse cx="0" cy="8" rx="11.5" ry="8.5" fill="#F2D2AE"/>
  <ellipse cx="0" cy="3.6" rx="4.4" ry="3.2" fill="${INK}"/>
  <path d="M0 6.5 L0 10 M-4.5 10.5 Q0 14.5 4.5 10.5" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/>
  ${eyes(-8, 8, -6)}${cheeks(13, 5)}`;
}
export function cat() {
  return `<path d="M-19 -9 L-15 -31 L-2 -19Z" fill="#4C8FE0" ${O}/><path d="M19 -9 L15 -31 L2 -19Z" fill="#4C8FE0" ${O}/>
  <path d="M-14 -13 L-13 -24 L-7 -18Z M14 -13 L13 -24 L7 -18Z" fill="#FFB5C8"/>
  <circle r="21" fill="#4C8FE0" ${O}/>
  <path d="M-9 5 L-42 1 M-9 8 L-42 9 M9 5 L42 1 M9 8 L42 9" stroke="${INK}" stroke-width="1.9" stroke-linecap="round"/>
  <path d="M-3.4 2.5 L3.4 2.5 L0 6.4Z" fill="#FF8FAB" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/>
  <path d="M-4.5 9 Q-2.2 11.5 0 8.6 Q2.2 11.5 4.5 9" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/>
  ${eyes(-8, 8, -4)}`;
}
/* --- Sea friends --- */
function blobfish() {
  return `<path d="M-27 4 L-38 -2 L-33 12Z M27 4 L38 -2 L33 12Z" fill="#E77F99" ${O}/>
  <path d="M-28 4 C-30 -18 -15 -28 0 -28 C15 -28 30 -18 28 4 C26 22 13 26 0 26 C-13 26 -26 22 -28 4Z" fill="#F49AB0" ${O}/>
  <path d="M-12 -22 Q-6 -26 0 -25" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity=".6"/>
  ${eyes(-12, 12, -9, 3.2)}
  <path d="M-8 -3 C-10 10 -6 16 0 16 C6 16 10 10 8 -3 C4 -7 -4 -7 -8 -3Z" fill="#F8B9C8" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>
  <path d="M-6 21 Q0 24.5 6 21" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/>
  ${cheeks(18, 4)}`;
}
function anemone() {
  const xs = [-17, -11, -5.5, 0, 5.5, 11, 17];
  const tent = xs.map((x, k) => `M${x} -4 Q${x + (k % 2 ? 7 : -7)} -16 ${x + (x * .35)} -30`).join(' ');
  return `<ellipse cx="0" cy="25" rx="27" ry="7" fill="#7C8B99" ${O}/>
  <path d="${tent}" fill="none" stroke="${INK}" stroke-width="9.6" stroke-linecap="round"/>
  <path d="${tent}" fill="none" stroke="#C9A3F2" stroke-width="5.2" stroke-linecap="round"/>
  <path d="M-20 -4 Q-23 18 -16 25 L16 25 Q23 18 20 -4Z" fill="#9B6BE0" ${O}/>
  <ellipse cx="0" cy="-4" rx="20.5" ry="5.5" fill="#B48AE8" ${O}/>
  ${eyes(-7, 7, 7, 3.2)}${smile(0, 14, 5)}${cheeks(12, 12)}`;
}
function goldfish() {
  return `${fish('#F5A31A', '#E8701A', false, true)}
  <circle cx="30" cy="-20" r="3.4" fill="none" stroke="#7FD3EF" stroke-width="2"/><circle cx="36" cy="-30" r="2.4" fill="none" stroke="#7FD3EF" stroke-width="2"/>`;
}
function flounder() {
  return `<path d="M-30 0 L-42 -11 L-39 0 L-42 11Z" fill="#B7894A" ${O}/>
  <ellipse rx="33" ry="19" fill="#B7894A" ${O}/>
  <ellipse rx="27" ry="14" fill="#D2A863" stroke="${INK}" stroke-width="1.6"/>
  <circle cx="-14" cy="-4" r="3" fill="#A6763A"/><circle cx="-6" cy="6" r="2.4" fill="#A6763A"/><circle cx="-18" cy="7" r="2" fill="#A6763A"/><circle cx="2" cy="-7" r="2.2" fill="#A6763A"/>
  <circle cx="11" cy="-10" r="5.6" fill="#fff" ${O}/><circle cx="12" cy="-10" r="2.9" fill="${INK}"/>
  <circle cx="21" cy="-6" r="5" fill="#fff" ${O}/><circle cx="22" cy="-6" r="2.6" fill="${INK}"/>
  <path d="M18 6 Q23 9 27 4" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>
  <ellipse cx="12" cy="5" rx="3.6" ry="2.4" fill="#FF7F9E" opacity=".5"/>`;
}
function eel() {
  const body = 'M-40 16 C-30 -4 -20 30 -6 12 C4 -2 10 -10 22 -6';
  return `<path d="${body}" fill="none" stroke="${INK}" stroke-width="17" stroke-linecap="round"/>
  <path d="${body}" fill="none" stroke="#5DAA5A" stroke-width="11.5" stroke-linecap="round"/>
  <path d="M-36 12 C-28 0 -20 22 -8 8" fill="none" stroke="#9AD38F" stroke-width="3" stroke-linecap="round"/>
  <ellipse cx="24" cy="-7" rx="15" ry="12" fill="#5DAA5A" ${O}/>
  <path d="M10 -16 Q16 -24 24 -19" fill="#3E8C40" ${O}/>
  ${eyes(21, 31, -11, 2.8)}
  <path d="M20 -1 Q28 4 37 -2" fill="none" stroke="${INK}" stroke-width="2.3" stroke-linecap="round"/>
  <ellipse cx="17" cy="-3" rx="3" ry="2" fill="#FF7F9E" opacity=".5"/>`;
}
function dolphin() {
  return `<path d="M-30 8 L-43 -4 L-39 10 L-44 22Z" fill="#4A9CAE" ${O}/>
  <path d="M-4 -16 L2 -33 L12 -15Z" fill="#4A9CAE" ${O}/>
  <path d="M-33 9 C-24 -15 6 -24 25 -11 C30 -7 37 -5 41 -1 C36 2 31 2 26 4 C14 17 -14 21 -33 9Z" fill="#5FB8C9" ${O}/>
  <path d="M-22 12 C-8 18 12 14 24 4 C14 10 -6 14 -22 12Z" fill="#CDEFF4"/>
  <path d="M-2 9 L-9 21 L8 13Z" fill="#4A9CAE" ${O}/>
  <circle cx="17" cy="-8" r="3.4" fill="${INK}"/><circle cx="18.2" cy="-9.2" r="1.1" fill="#fff"/>
  <path d="M28 2 Q33 5 38 1" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/>
  <ellipse cx="22" cy="0" rx="3.4" ry="2.2" fill="#FF7F9E" opacity=".5"/>`;
}
export function clownfish() {
  return `<path d="M-20 0 L-36 -14 Q-32 0 -36 14Z" fill="#F2602A" ${O}/>
  <path d="M-8 -16 Q0 -30 12 -14Z" fill="#F2602A" ${O}/>
  <ellipse rx="25" ry="18" fill="#F2602A" ${O}/>
  <path d="M-13 -14.5 Q-7 0 -13 14.5 L-4 17 Q2 0 -4 -17Z" fill="#FFFFFF" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>
  <path d="M5 -17 Q11 0 5 17 L12 14.6 Q16 0 12 -14.6Z" fill="#FFFFFF" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>
  <circle cx="17" cy="-4" r="5.6" fill="#fff" ${O}/><circle cx="18.2" cy="-4" r="3" fill="${INK}"/><circle cx="19.2" cy="-5.1" r="1" fill="#fff"/>
  <path d="M18 7 Q21 9.5 24 5" fill="none" stroke="${INK}" stroke-width="2.3" stroke-linecap="round"/>
  <path d="M-4 -26 L0 -36 L4 -26Z" fill="#FFD65C" ${O}/><circle cx="0" cy="-37" r="2.6" fill="#E84B3C" ${O}/>`;
}
export function charSVG(id) {
  switch (id) {
    case 'gracie':  return gorilla('#E8618C', '#FFC2D4', true);
    case 'flossy':  return fish('#F6C443', '#F29E2E', false);
    case 'ellie':   return elephant();
    case 'donna':   return dog();
    case 'charlie': return cat();
    case 'benny':   return blobfish();
    case 'annie':   return anemone();
    case 'goldie':  return goldfish();
    case 'finn':    return flounder();
    case 'eddie':   return eel();
    case 'daisy':   return dolphin();
    case 'coco':    return clownfish();
  }
  return '';
}

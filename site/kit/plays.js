// @ts-check
/**
 * Counting finished games, privately.
 *
 * Each device counts its own finished games (a game = all ten rounds). On the public site only, when a
 * device finishes its 1st, 2nd ... 10th game, one anonymous milestone such as "home-play-4" is sent to
 * GoatCounter. Nothing identifies the device or the child: no id, no cookie, no name, no referrer. The
 * dashboard then reads like "home-play-1: 48, home-play-4: 19" = 48 devices tried it, 19 came back.
 *
 * "home" = opened from the home screen as an app (Safari keeps its storage, so these counts are reliable);
 * "tab" = a Safari tab (Safari may clear storage after about a week away, so returns there undercount).
 */
import { memory } from './ui.js';
import { CHANNEL } from './channel.js';
import { isInstalled } from './offline.js';

/** GoatCounter site code (the "code" in code.goatcounter.com). Empty = counting is off. */
export const COUNTER_CODE = 'under-the-c';
/** Only the public site sends anything: the beta copy, local testing and copies elsewhere never do. */
export const PUBLIC_HOST = 'tchris43.github.io';
/** Milestones stop here; the last one is "10plus". */
export const CAP = 10;

/** @param {number} n  finished games on this device  @param {boolean} installed  @returns {string} */
export function playEvent(n, installed) {
  return `${installed ? 'home' : 'tab'}-play-${n >= CAP ? `${CAP}plus` : n}`;
}

/** @param {{ code: string, host: string, channel: string, n: number }} at  @returns {boolean} */
export const shouldSend = ({ code, host, channel, n }) =>
  code !== '' && host === PUBLIC_HOST && channel === 'stable' && n >= 1 && n <= CAP;

/** Call when a kid finishes a whole game. Returns this device's finished-game count. */
export function countFinishedGame() {
  const n = (Number(memory.get('gamesFinished', '0')) || 0) + 1;
  memory.set('gamesFinished', String(n));
  if (typeof location === 'undefined' || !shouldSend({ code: COUNTER_CODE, host: location.hostname, channel: CHANNEL, n })) return n;
  const path = encodeURIComponent(`/${playEvent(n, isInstalled())}`);
  fetch(`https://${COUNTER_CODE}.goatcounter.com/count?p=${path}&e=true`, {
    mode: 'no-cors', credentials: 'omit', referrerPolicy: 'no-referrer', cache: 'no-store', keepalive: true,
  }).catch(() => { /* offline or blocked: this play just isn't counted */ });
  return n;
}

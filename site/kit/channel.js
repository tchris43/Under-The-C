// @ts-check
/**
 * Which copy of the site this is. The public site lives at /Under-The-C/; the teacher's beta copy (newest
 * games, tried with students first) lives at /Under-The-C/beta/. Both share one website on a device, so
 * anything a copy saves (offline files, small settings) is labelled with its channel to keep them apart.
 */

/** @param {string} pathname  @returns {'beta' | 'stable'} */
export const channelOf = pathname => (/\/beta\//.test(pathname) ? 'beta' : 'stable');

export const CHANNEL = typeof location === 'undefined' ? 'stable' : channelOf(location.pathname);

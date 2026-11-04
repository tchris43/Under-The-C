// @ts-check
/**
 * Turns on the offline helper (site/sw.js), so the games keep working with no internet after the first
 * visit and can be added to an iPad's home screen as an app. Does nothing where it isn't supported.
 *
 * Updates: each time the app is opened or switched back to, it checks for a new version. A new version
 * downloads in the background; then a small note offers an Update button. It never reloads by itself,
 * so a kid in the middle of a round never loses it.
 */
export function enableOffline() {
  if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
  const sw = navigator.serviceWorker;
  const root = new URL('../', import.meta.url);
  const hadController = Boolean(sw.controller); // false on the very first visit: that's an install, not an update

  sw.register(new URL('sw.js', root), { scope: root.pathname }).then(registration => {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') registration.update().catch(() => {});
    });
  }).catch(() => {
    /* Offline play just isn't available on this device; the games still work online. */
  });

  sw.addEventListener('controllerchange', () => {
    if (hadController) showUpdateNote();
  });
}

/** True when opened from the home screen as an app. */
export const isInstalled = () =>
  matchMedia('(display-mode: standalone)').matches || /** @type {any} */ (navigator).standalone === true;

function showUpdateNote() {
  if (document.getElementById('updateNote')) return;
  const note = document.createElement('div');
  note.id = 'updateNote';
  note.className = 'update-note';
  note.setAttribute('role', 'status');
  note.innerHTML = '<span>New games are ready!</span><button type="button" class="btn">Update</button>';
  note.querySelector('button')?.addEventListener('click', () => location.reload());
  document.body.appendChild(note);
}

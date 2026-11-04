// @ts-check
/**
 * Piano sound made with the Web Audio API: no audio files to download.
 * Browsers only allow sound after the first tap, so the first play() also unlocks audio.
 */
export const Sound = (() => {
  let ctx = null, master = null;
  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC({ latencyHint: 'interactive' });
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -14; comp.ratio.value = 4;
      master = ctx.createGain(); master.gain.value = 0.5;
      master.connect(comp); comp.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function play(midi, when = 0, vel = 1) {
    const a = ensure(); if (!a) return;
    const t = a.currentTime + when + 0.004;
    const f = 440 * Math.pow(2, (midi - 69) / 12);
    const out = a.createGain();
    out.gain.setValueAtTime(0.0001, t);
    out.gain.exponentialRampToValueAtTime(0.9 * vel, t + 0.006);
    out.gain.exponentialRampToValueAtTime(0.25 * vel, t + 0.4);
    out.gain.exponentialRampToValueAtTime(0.0001, t + 2.6);
    const lp = a.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 0.5;
    lp.frequency.setValueAtTime(Math.min(9000, f * 14), t);
    lp.frequency.exponentialRampToValueAtTime(Math.max(700, f * 3), t + 1.2);
    out.connect(lp); lp.connect(master);
    [[1, 1], [2, .5], [3, .28], [4, .16], [5, .1], [6, .06], [8, .03]].forEach(([n, amp]) => {
      const o = a.createOscillator(); o.type = n === 1 ? 'triangle' : 'sine';
      o.frequency.value = f * n * (1 + 0.0005 * n * n);
      const g = a.createGain();
      g.gain.setValueAtTime(amp, t);
      g.gain.exponentialRampToValueAtTime(amp * 0.001 + 1e-5, t + 2.4 / (1 + n * 0.45));
      o.connect(g); g.connect(out); o.start(t); o.stop(t + 2.7);
    });
  }
  function cheer() { [60, 64, 67, 72].forEach((m, i) => play(m, i * 0.09, .8)); }
  /** A soft, low "boop" for a wrong answer. Never a harsh error sound. */
  function buzz() {
    const a = ensure(); if (!a) return;
    const o = a.createOscillator(), g = a.createGain(), t = a.currentTime;
    o.type = 'sine'; o.frequency.setValueAtTime(220, t); o.frequency.exponentialRampToValueAtTime(150, t + .18);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.2, t + .02); g.gain.exponentialRampToValueAtTime(.0001, t + .25);
    o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + .3);
  }
  return { play, cheer, buzz, ensure };
})();

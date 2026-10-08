/* tween.js — original micro tween engine (no dependencies)
 * 替代缺失的 gsap：duration/delay/ease/onUpdate/onComplete，全部手写 easing。
 */
const Easings = {
  linear: (t) => t,
  outCubic: (t) => 1 - Math.pow(1 - t, 3),          // power2.out
  inOutCubic: (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  backOut: (s = 1.70158) => (t) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2),
  outBack: (t) => Easings.backOut(1.4)(t),
};

const active = new Set();
let rafOn = false;
const nowS = () => performance.now() / 1000;

function pump() {
  if (!active.size) { rafOn = false; return; }
  rafOn = true;
  requestAnimationFrame(() => {
    const t = nowS();
    for (const tw of [...active]) {
      let k = (t - tw.t0 - tw.delay) / tw.dur;
      if (k < 0) continue;
      if (k >= 1) k = 1;
      const e = tw.ease(Math.min(1, Math.max(0, k)));
      const out = {};
      for (const key of tw.keys) out[key] = tw.from[key] + (tw.to[key] - tw.from[key]) * e;
      tw.update && tw.update(out, e);
      if (k === 1) { active.delete(tw); tw.complete && tw.complete(); }
    }
    pump();
  });
}

/* tween({from, to, dur, delay, ease, update, complete}) — from/to 为扁平数字对象 */
export function tween(o) {
  const tw = {
    from: o.from, to: o.to,
    keys: Object.keys(o.to),
    dur: o.dur ?? 0.6, delay: o.delay ?? 0,
    ease: typeof o.ease === 'function' ? o.ease : (Easings[o.ease] || Easings.outCubic),
    update: o.update, complete: o.complete,
    t0: nowS(),
    kill() { active.delete(tw); },
  };
  active.add(tw);
  if (!rafOn) pump();
  return tw;
}

export function delayedCall(delay, fn) {
  return tween({ from: {}, to: {}, dur: 0.001, delay, update: null, complete: fn });
}

export function killAll() { active.clear(); }
export { Easings };

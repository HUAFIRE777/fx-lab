/* huafire3d fx-lab — original implementation
 * Timeline: keynote phases (black -> spotlight -> reveal -> callouts -> CTA).
 * All durations come from CONFIG.timeline. sample(t) returns every driven
 * value; the renderer applies them. Nothing here touches the DOM.
 */
export const clamp01 = (v) => Math.min(1, Math.max(0, v));
export const lerp = (a, b, t) => a + (b - a) * t;

export const easeOutExpo = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
export const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
export const easeOutBack = (t) => {
  const c = 1.70158;
  const u = t - 1;
  return 1 + (c + 1) * u * u * u + c * u * u;
};
// progress of t within [start, end], eased
const win = (t, start, end, ease) => ease(clamp01((t - start) / (end - start)));

export function createTimeline(tl) {
  const b1 = tl.black;
  const b2 = b1 + tl.spotlight;
  const b3 = b2 + tl.reveal;
  const b4 = b3 + tl.callouts;
  const total = b4;
  let skipped = false;

  function sample(t) {
    if (skipped) t = total;
    t = Math.min(t, total);

    const revealP = win(t, b2, b3, (x) => x); // raw 0..1 for sub-windows
    const callP = win(t, b3, b4, (x) => x);

    return {
      t,
      done: t >= total,
      blackout: 1 - win(t, b1, b2, easeOutCubic),
      beam: win(t, b1, b2, easeInOutCubic),
      productScale: lerp(0.55, 1, win(t, b2, b3, easeOutExpo)),
      productRotY: lerp(-2.4, 0.5, win(t, b2, b3, easeInOutCubic)),
      productY: lerp(-0.7, 0, win(t, b2, b3, easeOutCubic)),
      rim: win(t, b2, b3, easeInOutCubic),
      fill: win(t, b2 + tl.reveal * 0.3, b3, easeOutCubic),
      headline: [
        win(revealP, 0.1, 0.55, easeOutCubic),
        win(revealP, 0.28, 0.72, easeOutCubic),
      ],
      sub: win(revealP, 0.5, 0.95, easeOutCubic),
      callouts: [0, 1, 2].map((i) => win(callP, 0.06 + i * 0.24, 0.5 + i * 0.24, easeOutBack)),
      cta: win(callP, 0.55, 1.0, easeOutCubic),
      skipVisible: t < b4 - 0.05,
      total,
    };
  }

  return {
    total,
    sample,
    skipToEnd() { skipped = true; },
    get skipped() { return skipped; },
  };
}

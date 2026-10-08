/* MUYU vendor: tiny tween engine + physical easings (no dependencies).
   Used by src/main.js for: scroll-cue nudge, card hover-free JS anims,
   booking success panel, modal open, and the 360 dial sweep.
   License: MIT (c) 2026 HUAFIRE777 */
(function (global) {
  'use strict';

  // ---------- easings: all physical, none linear ----------
  var Easings = {
    // fast attack, long settle — default for entrances
    easeOutExpo: function (t) { return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t); },
    easeInOutCubic: function (t) {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    },
    // overshoot and settle — for pops / marks
    easeOutBack: function (t) {
      var c = 1.70158, c3 = c + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
    },
    // gentle elastic for the dial sweep
    easeOutElastic: function (t) {
      if (t <= 0) return 0; if (t >= 1) return 1;
      var c = (2 * Math.PI) / 3.2;
      return Math.pow(2, -9 * t) * Math.sin((t * 9 - 0.75) * c) + 1;
    },
    easeOutQuart: function (t) { return 1 - Math.pow(1 - t, 4); }
  };

  var active = [];
  var rafId = 0;
  var now = function () {
    return (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
  };

  function tick() {
    rafId = 0;
    var t = now();
    // iterate backwards so completion splice is safe
    for (var i = active.length - 1; i >= 0; i--) {
      var tw = active[i];
      if (tw.paused) continue;
      var el = t - tw.start;
      var p = tw.duration <= 0 ? 1 : Math.min(el / tw.duration, 1);
      var e = tw.ease(p);
      tw.onUpdate(tw.from + (tw.to - tw.from) * e, e, p);
      if (p >= 1) {
        active.splice(i, 1);
        if (tw.onComplete) { try { tw.onComplete(); } catch (err) { setTimeout(function () { throw err; }, 0); } }
      }
    }
    if (active.length) rafId = requestAnimationFrame(tick);
  }

  function schedule() {
    if (!rafId) rafId = requestAnimationFrame(tick);
  }

  // tween({from,to,duration,ease,delay,onUpdate,onComplete}) -> handle {cancel,pause,resume}
  function tween(opts) {
    opts = opts || {};
    var tw = {
      from: typeof opts.from === 'number' ? opts.from : 0,
      to: typeof opts.to === 'number' ? opts.to : 1,
      duration: typeof opts.duration === 'number' ? opts.duration : 600,
      ease: typeof opts.ease === 'function' ? opts.ease
          : (Easings[opts.ease] || Easings.easeOutExpo),
      onUpdate: opts.onUpdate || function () {},
      onComplete: opts.onComplete || null,
      start: now() + (opts.delay || 0),
      paused: false,
      _remain: 0
    };
    active.push(tw);
    schedule();
    return {
      cancel: function () {
        var i = active.indexOf(tw);
        if (i !== -1) active.splice(i, 1);
      },
      pause: function () {
        if (!tw.paused) { tw.paused = true; tw._remain = tw.start + tw.duration - now(); }
      },
      resume: function () {
        if (tw.paused) { tw.paused = false; tw.start = now() + tw._remain - tw.duration; schedule(); }
      }
    };
  }

  // animate a CSS numeric property without touching existing transforms
  function cssNum(el, prop, to, opts) {
    opts = opts || {};
    var from = parseFloat(getComputedStyle(el)[prop]) || 0;
    var unit = opts.unit || '';
    return tween({
      from: from, to: to, duration: opts.duration, ease: opts.ease, delay: opts.delay,
      onUpdate: function (v) { el.style[prop] = v + unit; },
      onComplete: opts.onComplete
    });
  }

  // stagger helper: run fn(i) with i*step delay
  function stagger(count, step, fn, opts) {
    var handles = [];
    for (var i = 0; i < count; i++) {
      (function (i) {
        handles.push(tween({
          from: 0, to: 1, duration: (opts && opts.duration) || 500,
          ease: (opts && opts.ease) || 'easeOutExpo', delay: i * step,
          onUpdate: function (v, e) { fn(i, v, e); }
        }));
      })(i);
    }
    return handles;
  }

  var Tween = {
    tween: tween, css: cssNum, stagger: stagger,
    easings: Easings,
    cancelAll: function () { active.length = 0; if (rafId) { cancelAnimationFrame(rafId); rafId = 0; } }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = Tween;
  global.MUYU_Tween = Tween;
})(typeof window !== 'undefined' ? window : this);

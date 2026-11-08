/**
 * fx-lab · 效果控制台（共享）
 * 注入到全部特效预览页。只用通用机制，不改各特效自己的 JS。
 *
 * 两部分：
 *  A. 立即执行（本脚本在 <head> 最前加载）：包装 window.requestAnimationFrame，
 *     按速度倍率缩放传给回调的时间戳。只对用 rAF 时间戳驱动动画的特效有效；
 *     直接用 performance.now()/Date.now() 或 setTimeout/setInterval 驱动的特效不受影响。
 *  B. DOM 就绪后：搭建控制面板（速度/亮度/色相/饱和度/重置/复制嵌入代码/查看源码）。
 *     亮度/色相/饱和度用 CSS filter，加在特效的 canvas（或主容器）上。
 */
(function () {
  'use strict';

  /* ================= A. 速度：包装 rAF ================= */
  var speed = 1; // 0.25x–2x
  var _raf = window.requestAnimationFrame.bind(window);
  var _lastReal = null;   // 上一次回调的真实时间戳
  var _virtual = 0;       // 累计的虚拟时间戳（按速度缩放后的）
  var _started = false;
  window.requestAnimationFrame = function (cb) {
    return _raf(function (t) {
      if (!_started) { _started = true; _lastReal = t; _virtual = t; }
      else { _virtual += (t - _lastReal) * speed; _lastReal = t; }
      cb(_virtual);
    });
  };
  // 暴露给面板：改速度
  window.__fxlabSetSpeed = function (v) { speed = v; };

  /* ================= B. 面板 ================= */
  var DEFAULTS = { speed: 1, brightness: 100, hue: 0, saturation: 100 };
  var state = { speed: 1, brightness: 100, hue: 0, saturation: 100 };
  var filterTarget = null; // 应用 CSS filter 的元素
  var panelEl = null, bodyEl = null, toggleBtn = null;
  var slug = '';

  function currentSlug() {
    // URL 形如 /fx-lab/aurora-3d/ 或 /fx-lab/aurora-3d/index.html
    var parts = window.location.pathname.split('/').filter(Boolean);
    var i = parts.indexOf('fx-lab');
    if (i >= 0 && parts[i + 1]) return parts[i + 1];
    return parts[parts.length - 1] || '';
  }

  // 找滤镜目标：优先 canvas；没有则找最大的可见容器；都没有则返回 null
  function findTarget() {
    var c = document.querySelector('canvas');
    if (c) return c;
    var cands = [];
    var kids = document.body ? document.body.children : [];
    for (var k = 0; k < kids.length; k++) {
      var el = kids[k];
      if (el === panelEl || el.tagName === 'SCRIPT' || el.tagName === 'STYLE') continue;
      var r = el.getBoundingClientRect();
      if (r.width > 80 && r.height > 80) cands.push({ el: el, area: r.width * r.height });
    }
    if (cands.length) {
      cands.sort(function (a, b) { return b.area - a.area; });
      return cands[0].el;
    }
    return null;
  }

  function applyFilter() {
    if (!filterTarget) filterTarget = findTarget();
    if (!filterTarget) return;
    var b = state.brightness, h = state.hue, s = state.saturation;
    if (b === 100 && h === 0 && s === 100) {
      filterTarget.style.filter = '';
    } else {
      filterTarget.style.filter = 'brightness(' + (b / 100) + ') hue-rotate(' + h + 'deg) saturate(' + (s / 100) + ')';
    }
  }

  function fmtSpeed(v) { return (Math.round(v * 100) / 100).toString().replace(/\.0+$/, '') + 'x'; }

  function buildPanel() {
    slug = currentSlug();
    panelEl = document.createElement('div');
    panelEl.id = 'fxlab-controls';
    panelEl.innerHTML =
      '<button type="button" id="fxlab-controls-toggle" aria-expanded="false">效果设置</button>' +
      '<div id="fxlab-controls-body" hidden>' +
        '<div class="fxlab-row"><label>速度 <span class="fxlab-val" id="fxlab-v-speed">1x</span></label>' +
        '<input type="range" id="fxlab-speed" min="0.25" max="2" step="0.05" value="1"></div>' +
        '<div class="fxlab-row"><label>亮度 <span class="fxlab-val" id="fxlab-v-bright">100%</span></label>' +
        '<input type="range" id="fxlab-bright" min="50" max="150" step="5" value="100"></div>' +
        '<div class="fxlab-row"><label>色相 <span class="fxlab-val" id="fxlab-v-hue">0°</span></label>' +
        '<input type="range" id="fxlab-hue" min="-180" max="180" step="5" value="0"></div>' +
        '<div class="fxlab-row"><label>饱和度 <span class="fxlab-val" id="fxlab-v-sat">100%</span></label>' +
        '<input type="range" id="fxlab-sat" min="0" max="200" step="5" value="100"></div>' +
        '<div class="fxlab-actions">' +
          '<button type="button" id="fxlab-reset">重置</button>' +
          '<button type="button" id="fxlab-copy">复制嵌入代码</button>' +
          '<a id="fxlab-source" href="https://github.com/HUAFIRE777/fx-lab/tree/main/' + encodeURIComponent(slug) + '/src" target="_blank" rel="noopener">查看源码</a>' +
        '</div>' +
        '<div class="fxlab-note" id="fxlab-note" hidden></div>' +
      '</div>';
    document.body.appendChild(panelEl);
    bodyEl = document.getElementById('fxlab-controls-body');
    toggleBtn = document.getElementById('fxlab-controls-toggle');

    toggleBtn.addEventListener('click', function () {
      var open = bodyEl.hidden;
      bodyEl.hidden = !open;
      toggleBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) applyFilter(); // 展开时再找一次目标（canvas 可能刚创建）
    });

    function bind(id, key, fmt, apply) {
      var el = document.getElementById(id);
      el.addEventListener('input', function () {
        var v = parseFloat(el.value);
        state[key] = v;
        document.getElementById('fxlab-v-' + (key === 'speed' ? 'speed' : key === 'brightness' ? 'bright' : key === 'hue' ? 'hue' : 'sat')).textContent = fmt(v);
        apply(v);
      });
    }
    bind('fxlab-speed', 'speed', fmtSpeed, function (v) { window.__fxlabSetSpeed(v); });
    bind('fxlab-bright', 'brightness', function (v) { return v + '%'; }, applyFilter);
    bind('fxlab-hue', 'hue', function (v) { return v + '°'; }, applyFilter);
    bind('fxlab-sat', 'saturation', function (v) { return v + '%'; }, applyFilter);

    document.getElementById('fxlab-reset').addEventListener('click', function () {
      state = { speed: DEFAULTS.speed, brightness: DEFAULTS.brightness, hue: DEFAULTS.hue, saturation: DEFAULTS.saturation };
      window.__fxlabSetSpeed(1);
      document.getElementById('fxlab-speed').value = '1';
      document.getElementById('fxlab-bright').value = '100';
      document.getElementById('fxlab-hue').value = '0';
      document.getElementById('fxlab-sat').value = '100';
      document.getElementById('fxlab-v-speed').textContent = '1x';
      document.getElementById('fxlab-v-bright').textContent = '100%';
      document.getElementById('fxlab-v-hue').textContent = '0°';
      document.getElementById('fxlab-v-sat').textContent = '100%';
      if (filterTarget) filterTarget.style.filter = '';
    });

    document.getElementById('fxlab-copy').addEventListener('click', function () {
      var code = '<iframe src="https://eazyopc.com/fx-lab/' + slug + '/" width="100%" height="600" frameborder="0" loading="lazy"></iframe>';
      var done = function () {
        var btn = document.getElementById('fxlab-copy');
        btn.textContent = '已复制';
        setTimeout(function () { btn.textContent = '复制嵌入代码'; }, 2000);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code).then(done, function () { fallbackCopy(code, done); });
      } else {
        fallbackCopy(code, done);
      }
    });

    function fallbackCopy(text, done) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(ta);
      done();
    }

    // 提示：没有可滤镜的目标时说明原因
    setTimeout(function () {
      filterTarget = findTarget();
      if (!filterTarget) {
        var note = document.getElementById('fxlab-note');
        note.hidden = false;
        note.textContent = '本页无可调的画布，亮度/色相/饱和度不生效。';
      }
      applyFilter();
    }, 600);
    // canvas 可能是 JS 稍后创建的：监听一次
    if (window.MutationObserver && document.body) {
      var mo = new MutationObserver(function () {
        if (!filterTarget) { filterTarget = findTarget(); if (filterTarget) { applyFilter(); mo.disconnect(); } }
      });
      mo.observe(document.body, { childList: true, subtree: true });
      setTimeout(function () { mo.disconnect(); }, 5000);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildPanel);
  } else {
    buildPanel();
  }
})();

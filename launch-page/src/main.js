/* launch-page · Aria Buds Pro 发布页交互
   - 滚动叙事：粘性耳机视觉随滚动进度旋转/缩放/位移（rAF + CSS transform，GSAP 加速）
   - 逐屏揭示、通用 reveal、数字滚动、导航高亮/毛玻璃、移动端汉堡菜单
   - 全部隐藏态仅在 html.js 下生效，无 JS 时内容直接可见 */

/* ===== 公司信息 CONFIG（企业标配：买家只改这一处，全站页脚/预购区/法务区自动同步） ===== */
const SITE = {
  brand: 'Aria',
  address: '北京市朝阳区建国路 88 号 SOHO 现代城 A 座 1201 室',
  email: 'support@aria-audio.com',
  phone: '400-888-8888',
  icp: '京ICP备xxxxxx号'
};

(function () {
  'use strict';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- SITE 配置渲染：data-site="brand|address|email|phone|icp" ---------- */
  $$('[data-site]').forEach(function (el) {
    var k = el.getAttribute('data-site');
    if (SITE[k] !== undefined && SITE[k] !== null) el.textContent = SITE[k];
  });
  var contactMail = $('#contactMail');
  if (contactMail && SITE.email) contactMail.href = 'mailto:' + SITE.email;
  var hasGsap = typeof window.gsap !== 'undefined';
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 加载态：保底 3.5s 强制消失，永不卡死 ---------- */
  var loader = $('#loader');
  var loaderGone = false;
  function hideLoader() {
    if (loaderGone || !loader) return;
    loaderGone = true;
    loader.classList.add('done');
  }
  window.addEventListener('load', function () { setTimeout(hideLoader, 700); });
  setTimeout(hideLoader, 3500);

  /* ---------- Hero 入场编排 ---------- */
  var hero = $('#overview');
  requestAnimationFrame(function () {
    requestAnimationFrame(function () { hero.classList.add('ready'); });
  });

  /* ---------- 导航：滚动吸顶毛玻璃 ---------- */
  var nav = $('#pnav');
  function onNav() { nav.classList.toggle('scrolled', window.scrollY > 24); }
  window.addEventListener('scroll', onNav, { passive: true });
  onNav();

  /* ---------- 移动端汉堡 ---------- */
  var burger = $('#burger');
  burger.addEventListener('click', function () { document.body.classList.toggle('menu-open'); });
  $$('#mnav a').forEach(function (a) {
    a.addEventListener('click', function () { document.body.classList.remove('menu-open'); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') document.body.classList.remove('menu-open');
  });

  /* ---------- 当前锚点高亮 ---------- */
  var links = $$('.pnav nav a');
  var linkById = {};
  links.forEach(function (a) { linkById[a.getAttribute('href').slice(1)] = a; });
  if ('IntersectionObserver' in window) {
    var secIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          links.forEach(function (a) { a.classList.remove('active'); });
          var a = linkById[en.target.id];
          if (a) a.classList.add('active');
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    ['overview', 'anc', 'battery', 'sound', 'specs'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) secIO.observe(el);
    });

    /* ---------- 叙事三屏逐屏揭示 ---------- */
    var scrIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) en.target.classList.add('on');
      });
    }, { threshold: 0.35 });
    $$('.screen').forEach(function (s) { scrIO.observe(s); });

    /* ---------- 通用 reveal ---------- */
    var rvIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          rvIO.unobserve(en.target);
        }
      });
    }, { threshold: 0.2 });
    $$('.rv-all').forEach(function (el) { rvIO.observe(el); });

    /* ---------- 数字滚动 ---------- */
    var numIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          var el = en.target;
          if (!el.dataset.done) { el.dataset.done = '1'; countUp(el); }
          numIO.unobserve(el);
        }
      });
    }, { threshold: 0.5 });
    $$('[data-count]').forEach(function (el) { numIO.observe(el); });
  } else {
    /* 无 IO 降级：全部直接显示 */
    $$('.screen').forEach(function (s) { s.classList.add('on'); });
    $$('.rv-all').forEach(function (el) { el.classList.add('in'); });
    $$('[data-count]').forEach(countUp);
  }

  function countUp(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var pre = el.getAttribute('data-prefix') || '';
    var suf = el.getAttribute('data-suffix') || '';
    if (reduced) { el.textContent = pre + target + suf; return; }
    var dur = 1400, t0 = null;
    function tick(t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / dur, 1);
      var e = 1 - Math.pow(1 - p, 4); /* easeOutQuart，物理感 */
      el.textContent = pre + Math.round(target * e) + suf;
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = pre + target + suf;
    }
    requestAnimationFrame(tick);
  }

  /* ---------- 滚动叙事：粘性视觉随滚动旋转/缩放/位移 ---------- */
  var narr = $('#narr');
  var bud = $('#stageBud');
  var ticking = false;
  function applyBud(x, y, rot, sc) {
    if (hasGsap && !reduced) {
      window.gsap.set(bud, { x: x, y: y, rotation: rot, scale: sc });
    } else {
      bud.style.transform = 'translate(' + x + 'px,' + y + 'px) rotate(' + rot + 'deg) scale(' + sc + ')';
    }
  }
  function narrTick() {
    ticking = false;
    if (reduced) { applyBud(0, 0, 0, 1); return; }
    var r = narr.getBoundingClientRect();
    var vh = window.innerHeight;
    var total = r.height - vh;
    if (total <= 0) { applyBud(0, 0, 0, 1); return; }
    var p = Math.min(Math.max(-r.top / total, 0), 1);
    var rot = -14 + p * 28;          /* −14° → +14° */
    var sc = 1 + p * 0.18;           /* 1 → 1.18 */
    var x = (p - 0.5) * 44;          /* 左右漂移 */
    var y = (p - 0.5) * -34;         /* 轻微上浮 */
    applyBud(x, y, rot, sc);
  }
  function onScroll() {
    if (!ticking) { ticking = true; requestAnimationFrame(narrTick); }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  narrTick();

  /* ---------- Hero 轻微视差 ---------- */
  var heroBuds = $('.hero .buds');
  function heroPar() {
    if (reduced || !heroBuds) return;
    var y = Math.min(window.scrollY, window.innerHeight);
    var off = y * 0.12;
    if (hasGsap) window.gsap.set(heroBuds, { y: off });
    else heroBuds.style.translate = '0 ' + off + 'px';
  }
  window.addEventListener('scroll', function () { requestAnimationFrame(heroPar); }, { passive: true });

  /* ---------- 页脚年份 ---------- */
  var yr = $('#yr');
  if (yr) yr.textContent = new Date().getFullYear();
})();

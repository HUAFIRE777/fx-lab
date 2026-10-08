/* 山涧 SHANJIAN · tea-brand-page 交互
   零外部依赖：Canvas 茶叶粒子 + rAF 视差 + IntersectionObserver reveal */
(function () {
  'use strict';

  /* ---------- 配置：买家改这里，一改全改 ---------- */
  var SITE = {
    name: '山涧 SHANJIAN',
    address: '浙江省杭州市西湖区龙井路 88 号山涧茶寮',
    addr1: '上海市静安区愚园路 68 号',
    phone: '400-800-1234',
    phoneHref: 'tel:4008001234',
    email: 'hello@shanjian.tea',
    emailHref: 'mailto:hello@shanjian.tea',
    hours: '每日 10:00 – 22:00',
    year: '2026'
  };

  /* ---------- 法务三件套文案 ---------- */
  var LEGAL = {
    privacy: {
      en: 'PRIVACY POLICY', title: '隐私政策', updated: '更新于 2026 年 1 月',
      sections: [
        ['我们收集什么', '当你使用点单、会员注册或联系客服时，我们会收集你主动提供的手机号、昵称与订单信息，用于完成交易与会员服务。我们不会收集与此无关的信息。'],
        ['信息怎么用', '收集的信息只用于订单履约、会员权益发放与服务通知。我们不会把你的个人信息出售、出租或分享给任何第三方做营销。'],
        ['你的权利', '你可以随时联系客服查询、更正或删除你的个人信息，也可以注销会员账号。注销后，与账号绑定的个人资料将在 15 个工作日内删除。'],
        ['未成年人', '我们的服务主要面向成年人。如果你是未成年人，请在监护人陪同下使用，并确保已获得监护人同意。']
      ]
    },
    terms: {
      en: 'TERMS OF SERVICE', title: '服务条款', updated: '更新于 2026 年 1 月',
      sections: [
        ['服务内容', '山涧提供现制茶饮的点单、会员积分与门店服务。页面展示的价格、口味描述与供应状态以门店实际为准，季节限定产品售完即止。'],
        ['会员规则', '会员免费注册，积分按实际消费累积。积分可兑换指定饮品，不可转让、不可折现。连续 12 个月无消费，会员等级将重新评定。'],
        ['合理使用', '请勿利用本服务从事任何违法活动，或以程序化手段批量刷单、刷积分。一经发现，我们有权暂停相关账号的服务。'],
        ['责任边界', '因不可抗力（自然灾害、系统故障、政策调整等）导致的服务中断，我们会尽力恢复，但不承担超出服务本身的间接损失。']
      ]
    },
    cookies: {
      en: 'COOKIE POLICY', title: 'Cookie 政策', updated: '更新于 2026 年 1 月',
      sections: [
        ['我们用什么', '本网站使用必要的 Cookie 来记住你的偏好（比如所在城市），以及匿名的访问统计 Cookie 来了解哪些页面受欢迎，从而把网站做得更好用。'],
        ['不会做什么', '我们不使用 Cookie 追踪你在其他网站的行为，不做跨站广告画像。统计数据均为聚合匿名数据，无法定位到个人。'],
        ['你可以关掉', '你可以在浏览器设置里随时禁用或删除 Cookie。关掉后网站照常可用，只是部分偏好（比如记住的城市）需要重新选择。']
      ]
    }
  };

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- SITE 渲染 ---------- */
  function renderSite() {
    var els = document.querySelectorAll('[data-site]');
    for (var i = 0; i < els.length; i++) {
      var k = els[i].getAttribute('data-site');
      if (SITE[k] !== undefined) els[i].textContent = SITE[k];
    }
    var links = document.querySelectorAll('[data-site-href]');
    for (var j = 0; j < links.length; j++) {
      var k2 = links[j].getAttribute('data-site-href');
      if (SITE[k2] !== undefined) links[j].setAttribute('href', SITE[k2]);
    }
  }

  /* ---------- 加载态 → hero 入场 ---------- */
  var hero = document.getElementById('season');
  function enterHero() { hero.classList.add('enter'); }
  function boot() {
    renderSite();
    window.__sjBooted = true;
    var loader = document.getElementById('loader');
    var t0 = Date.now();
    function done() {
      var wait = Math.max(0, 650 - (Date.now() - t0));
      setTimeout(function () {
        loader.classList.add('done');
        enterHero();
        setTimeout(function () { loader.style.display = 'none'; }, 700);
      }, wait);
    }
    if (document.readyState === 'complete') done();
    else window.addEventListener('load', done);
    setTimeout(function () { // 4s 兜底，不卡死
      if (!loader.classList.contains('done')) { loader.classList.add('done'); enterHero(); }
    }, 4000);
  }

  /* ---------- 导航滚动毛玻璃 ---------- */
  var nav = document.getElementById('nav');
  function onScrollNav() {
    if (window.scrollY > 40) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  }

  /* ---------- 滚动 reveal ---------- */
  function initReveal() {
    var els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window) || reduced) {
      for (var i = 0; i < els.length; i++) els[i].classList.add('in');
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- hero 视差（rAF 节流，滚出视口即停） ---------- */
  var PLX_BASE = { 'hero-cup': 'translate(-50%,-50%) ', 'l1': 'rotate(-24deg) ', 'l2': 'rotate(30deg) ', 'l3': 'rotate(12deg) ' };
  function plxBase(el) {
    for (var k in PLX_BASE) if (el.classList.contains(k)) return PLX_BASE[k];
    return '';
  }
  function initParallax() {
    if (reduced) return;
    var items = document.querySelectorAll('[data-plx]');
    if (!items.length) return;
    var ticking = false, heroVisible = true;
    new IntersectionObserver(function (es) { heroVisible = es[0].isIntersecting; }).observe(hero);
    function update() {
      ticking = false;
      if (!heroVisible) return;
      var r = hero.getBoundingClientRect();
      var off = -r.top;
      for (var i = 0; i < items.length; i++) {
        var f = parseFloat(items[i].getAttribute('data-plx')) || 0;
        items[i].style.transform = plxBase(items[i]) + 'translate3d(0,' + (off * f).toFixed(1) + 'px,0)';
      }
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
  }

  /* ---------- 核心动效：hero 茶叶飘落粒子 ---------- */
  function initLeaves() {
    var cv = document.getElementById('leafCanvas');
    if (!cv) return;
    var ctx = cv.getContext('2d');
    var W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    var leaves = [], running = true, heroOn = true;
    var COLORS = ['rgba(157,184,154,', 'rgba(46,75,63,', 'rgba(201,217,196,'];

    function resize() {
      var r = cv.parentElement.getBoundingClientRect();
      W = r.width; H = r.height;
      cv.width = W * dpr; cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function spawn(anyY) {
      return {
        x: Math.random() * W,
        y: anyY ? Math.random() * H : -30 - Math.random() * 60,
        s: 7 + Math.random() * 13,
        vy: 0.35 + Math.random() * 0.85,
        amp: 18 + Math.random() * 42,
        fr: 0.4 + Math.random() * 0.9,
        ph: Math.random() * Math.PI * 2,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.02,
        c: COLORS[(Math.random() * COLORS.length) | 0],
        a: 0.35 + Math.random() * 0.45
      };
    }
    function drawLeaf(l, t) {
      var x = l.x + Math.sin(t * 0.001 * l.fr + l.ph) * l.amp;
      var fade = Math.min(1, Math.max(0, (H - l.y) / 160)) * Math.min(1, Math.max(0, (l.y + 40) / 120));
      ctx.save();
      ctx.translate(x, l.y);
      ctx.rotate(l.rot);
      ctx.globalAlpha = l.a * fade;
      ctx.fillStyle = l.c + '1)';
      ctx.beginPath();
      ctx.moveTo(0, -l.s);
      ctx.quadraticCurveTo(l.s * 0.95, -l.s * 0.25, 0, l.s);
      ctx.quadraticCurveTo(-l.s * 0.95, -l.s * 0.25, 0, -l.s);
      ctx.fill();
      ctx.globalAlpha = l.a * fade * 0.5;
      ctx.strokeStyle = '#F7F3EA';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, -l.s * 0.7); ctx.lineTo(0, l.s * 0.7); ctx.stroke();
      ctx.restore();
    }
    function frame(t) {
      if (!running) return;
      ctx.clearRect(0, 0, W, H);
      if (heroOn) {
        for (var i = 0; i < leaves.length; i++) {
          var l = leaves[i];
          l.y += l.vy; l.rot += l.vr;
          if (l.y > H + 40) leaves[i] = spawn(false);
          drawLeaf(leaves[i], t);
        }
      }
      requestAnimationFrame(frame);
    }
    resize();
    window.addEventListener('resize', resize);
    for (var n = 0; n < 46; n++) leaves.push(spawn(true));
    new IntersectionObserver(function (es) { heroOn = es[0].isIntersecting; }).observe(hero);
    document.addEventListener('visibilitychange', function () {
      running = !document.hidden;
      if (running) requestAnimationFrame(frame);
    });
    if (!reduced) requestAnimationFrame(frame);
    else { // 减弱动效：静态铺一层叶子，不跑动画
      ctx.clearRect(0, 0, W, H);
      leaves.forEach(function (l) { drawLeaf(l, 0); });
    }
  }

  /* ---------- 移动端抽屉 ---------- */
  function initMenu() {
    var burger = document.getElementById('burger');
    var menu = document.getElementById('mMenu');
    function set(open) {
      document.body.classList.toggle('menu-open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      menu.setAttribute('aria-hidden', open ? 'false' : 'true');
    }
    burger.addEventListener('click', function () {
      set(!document.body.classList.contains('menu-open'));
    });
    menu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { set(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.body.classList.contains('menu-open')) set(false);
    });
  }

  /* ---------- 门店搜索 ---------- */
  function initStoreFilter() {
    var input = document.getElementById('storeFilter');
    var empty = document.getElementById('storeEmpty');
    var cards = document.querySelectorAll('#storeGrid .store');
    input.addEventListener('input', function () {
      var q = input.value.trim();
      var shown = 0;
      cards.forEach(function (c) {
        var hit = !q || (c.getAttribute('data-city') || '').indexOf(q) !== -1 ||
          c.querySelector('h3').textContent.indexOf(q) !== -1;
        c.classList.toggle('hide', !hit);
        if (hit) shown++;
      });
      empty.hidden = shown > 0;
    });
  }

  /* ---------- 法务弹窗 ---------- */
  var lastFocus = null;
  var legalTimer = null; // 关闭隐藏定时器：重开时必须清掉，防止旧 timer 把新开的弹窗再藏起来
  function openLegal(key) {
    var d = LEGAL[key]; if (!d) return;
    lastFocus = document.activeElement;
    document.getElementById('legalEn').textContent = d.en;
    document.getElementById('legalTitle').textContent = d.title;
    document.getElementById('legalUpdated').textContent = d.updated;
    var body = document.getElementById('legalBody');
    body.innerHTML = '';
    d.sections.forEach(function (s) {
      var h = document.createElement('h4'); h.textContent = s[0];
      var p = document.createElement('p'); p.textContent = s[1];
      body.appendChild(h); body.appendChild(p);
    });
    var mask = document.getElementById('legalMask');
    if (legalTimer) { clearTimeout(legalTimer); legalTimer = null; }
    mask.hidden = false;
    void mask.offsetWidth; // 强制回流，让 opacity 过渡从 0 起跑（不依赖 rAF）
    mask.classList.add('open');
    document.body.classList.add('lock');
    document.getElementById('legalClose').focus();
  }
  function closeLegal() {
    var mask = document.getElementById('legalMask');
    mask.classList.remove('open');
    document.body.classList.remove('lock');
    if (legalTimer) clearTimeout(legalTimer);
    legalTimer = setTimeout(function () { mask.hidden = true; legalTimer = null; }, 360);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function initLegal() {
    document.querySelectorAll('[data-legal]').forEach(function (b) {
      b.addEventListener('click', function () { openLegal(b.getAttribute('data-legal')); });
    });
    document.getElementById('legalClose').addEventListener('click', closeLegal);
    document.getElementById('legalMask').addEventListener('click', function (e) {
      if (e.target === this) closeLegal();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !document.getElementById('legalMask').hidden) closeLegal();
    });
  }

  /* ---------- 会员按钮微交互 ---------- */
  function initJoin() {
    var btn = document.getElementById('joinBtn');
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      if (btn.dataset.done) return;
      btn.dataset.done = '1';
      btn.textContent = '欢迎加入，山记得你了';
    });
  }

  /* ---------- 启动 ---------- */
  boot();
  window.addEventListener('scroll', onScrollNav, { passive: true });
  onScrollNav();
  initReveal();
  initParallax();
  initLeaves();
  initMenu();
  initStoreFilter();
  initLegal();
  initJoin();
})();

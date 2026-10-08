/* 屿咖 ISLE · coffee-brand-page —— 零依赖 classic 脚本 */
(function () {
  'use strict';
  document.documentElement.classList.add('js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ================= 配置：买家只改这里 ================= */
  var SITE = {
    name: '屿咖 ISLE',
    address: '上海市静安区愚园路 372 号 1 楼',
    phone: '021-6258-8890',
    phoneHref: 'tel:+862162588890',
    email: 'hello@isle.coffee',
    emailHref: 'mailto:hello@isle.coffee',
    hours: '营业时间 8:00 – 22:00（全年无休）',
    icp: '沪ICP备xxxxxxxxxx号-1',
    year: String(new Date().getFullYear())
  };

  var LEGAL = {
    privacy: {
      title: '隐私政策',
      en: 'PRIVACY POLICY',
      updated: '最后更新：2026 年 10 月',
      points: [
        ['我们收集什么', '当你下单、订阅会员或联系客服时，我们会收集你的姓名、电话、收货地址和订单信息。这些都是为了把咖啡准确送到你手上。'],
        ['信息用来做什么', '仅用于订单履约、会员服务通知和售后。不会把你的个人信息出售、出租给任何第三方。'],
        ['信息保存多久', '订单信息按财务规定保存 5 年；会员信息在你注销会员后 30 天内删除。到期自动清理，不留档。'],
        ['你的权利', '你可以随时联系客服查询、更正或删除你的个人信息，也可以要求注销会员。我们会在 7 个工作日内处理。'],
        ['未成年人', '我们的服务面向成年人。如果你未满 18 岁，请在监护人陪同下使用。'],
        ['联系我们', '对隐私政策有任何疑问，发邮件到 hello@isle.coffee，我们会认真回复每一封。']
      ]
    },
    terms: {
      title: '服务条款',
      en: 'TERMS OF SERVICE',
      updated: '最后更新：2026 年 10 月',
      points: [
        ['服务内容', '屿咖提供咖啡豆零售、订阅寄豆和门店堂食服务。豆单价格以页面标价为准，标价含税。'],
        ['订阅规则', '订阅从下一个烘焙日（每周三）起算。你可以随时暂停或取消，取消后当期豆照常寄出，不再扣下一期费用。'],
        ['配送与自提', '订阅豆烘焙后 48 小时内顺丰发出；也可以选择到静安店自提，自提免运费。偏远地区时效以快递为准。'],
        ['退换政策', '未拆封的豆子 7 天内可退；已拆封如有严重质量问题（以烘焙卡批次为准），拍照联系客服换货。'],
        ['优惠券', '优惠券不可叠加使用，不可兑换现金，过期自动作废，页面会提前 3 天提醒。'],
        ['争议解决', '因本服务产生的争议，双方先友好协商；协商不成，提交屿咖所在地人民法院处理。']
      ]
    },
    cookies: {
      title: 'Cookie 政策',
      en: 'COOKIE POLICY',
      updated: '最后更新：2026 年 10 月',
      points: [
        ['什么是 Cookie', 'Cookie 是网站存在你浏览器里的小文本文件，用来记住你的偏好（比如选中的研磨度），让你下次不用重新选。'],
        ['我们用的类型', '必要型（维持页面正常运作）、偏好型（记住你的选择）、统计型（匿名统计访问量，帮我们把页面做得更好）。'],
        ['第三方 Cookie', '支付环节会跳转到持牌支付机构页面，可能产生其自身的 Cookie，以该机构的政策为准。'],
        ['你可以怎么管', '随时在浏览器设置里清除或禁用 Cookie。禁用后页面照常可看，只是偏好记不住。'],
        ['有效期', '偏好型 Cookie 最长保存 1 年，统计型 13 个月，到期自动失效。']
      ]
    }
  };

  var CFG = { navOffset: 40, loaderMin: 650, revealThreshold: 0.12 };

  /* ================= SITE 渲染：一改全改 ================= */
  function renderSite() {
    var els = document.querySelectorAll('[data-site]');
    for (var i = 0; i < els.length; i++) {
      var k = els[i].getAttribute('data-site');
      if (SITE[k] != null) els[i].textContent = SITE[k];
    }
    var links = document.querySelectorAll('[data-site-href]');
    for (var j = 0; j < links.length; j++) {
      var k2 = links[j].getAttribute('data-site-href');
      var v = SITE[k2 + 'Href'] || SITE[k2];
      if (v != null) links[j].setAttribute('href', v);
    }
  }

  /* ================= 加载态 ================= */
  function loader() {
    var el = document.getElementById('loader');
    var hero = document.getElementById('hero');
    if (!el) { if (hero) hero.classList.add('enter'); return; }
    var t0 = Date.now();
    var done = false;
    function finish() {
      if (done) return; done = true;
      el.classList.add('done');
      if (hero) hero.classList.add('enter');
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 600);
    }
    function wait() {
      var left = CFG.loaderMin - (Date.now() - t0);
      if (left <= 0) finish(); else setTimeout(finish, left);
    }
    if (document.readyState === 'complete') wait();
    else {
      window.addEventListener('load', wait);
      setTimeout(wait, 4000); /* 兜底：load 迟迟不来也不卡死 */
    }
  }

  /* ================= 导航滚动态 ================= */
  function nav() {
    var bar = document.getElementById('nav');
    if (!bar) return;
    function onScroll() { bar.classList.toggle('scrolled', window.scrollY > CFG.navOffset); }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ================= 汉堡抽屉 ================= */
  function burger() {
    var btn = document.getElementById('burger');
    var menu = document.getElementById('mMenu');
    if (!btn || !menu) return;
    function set(open) {
      btn.classList.toggle('open', open);
      menu.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.setAttribute('aria-label', open ? '关闭菜单' : '打开菜单');
      menu.setAttribute('aria-hidden', open ? 'false' : 'true');
      document.body.classList.toggle('lock', open);
    }
    btn.addEventListener('click', function () { set(!menu.classList.contains('open')); });
    menu.addEventListener('click', function (e) {
      var a = e.target.closest('a');
      if (a) set(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('open')) set(false);
    });
  }

  /* ================= 滚动 reveal + 数字滚动 ================= */
  function countUp(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    if (isNaN(target)) return;
    var suffix = el.getAttribute('data-suffix') || '';
    if (reduce) { el.textContent = target + suffix; return; }
    var t0 = null, dur = 1200;
    function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur);
      var e = 1 - Math.pow(1 - p, 3); /* easeOutCubic */
      el.textContent = Math.round(target * e) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  function reveal() {
    var els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window) || reduce) {
      for (var i = 0; i < els.length; i++) {
        els[i].classList.add('in');
        if (els[i].hasAttribute('data-count')) countUp(els[i].querySelector('b') || els[i]);
      }
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        var b = en.target.querySelector('[data-count]');
        if (b) countUp(b);
        io.unobserve(en.target);
      });
    }, { threshold: CFG.revealThreshold, rootMargin: '0px 0px -6% 0px' });
    for (var j = 0; j < els.length; j++) io.observe(els[j]);
  }

  /* ================= 蒸汽粒子（核心动效） ================= */
  function steam() {
    var cv = document.getElementById('steam');
    if (!cv || !cv.getContext) return;
    var ctx = cv.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0;
    function size() {
      var r = cv.getBoundingClientRect();
      W = r.width; H = r.height;
      cv.width = Math.max(1, Math.round(W * dpr));
      cv.height = Math.max(1, Math.round(H * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    size();
    window.addEventListener('resize', size);
    if (reduce) return; /* 静止：杯子照常显示 */

    var N = 30, P = [];
    function spawn(p, anywhere) {
      p.bx = W * 0.5 + (Math.random() - 0.5) * W * 0.30;
      p.y = anywhere ? Math.random() * H : H * 0.96;
      p.r = 7 + Math.random() * 15;
      p.vy = 0.45 + Math.random() * 0.75;
      p.ph = Math.random() * Math.PI * 2;
      p.sw = 9 + Math.random() * 20;
      p.ps = 0.008 + Math.random() * 0.012;
      p.maxA = 0.08 + Math.random() * 0.10;
      return p;
    }
    for (var i = 0; i < N; i++) P.push(spawn({}, true));

    var raf = null, visible = true;
    function frame() {
      raf = null;
      if (!visible || document.hidden) return;
      ctx.clearRect(0, 0, W, H);
      for (var k = 0; k < P.length; k++) {
        var p = P[k];
        p.ph += p.ps; p.y -= p.vy;
        if (p.y < -p.r * 2) { spawn(p, false); continue; }
        var t = 1 - p.y / H;                    /* 0 底部 → 1 顶部 */
        var fade = Math.sin(Math.PI * Math.max(0, Math.min(1, t)));
        var x = p.bx + Math.sin(p.ph) * p.sw * (0.5 + t * 0.8);
        var a = fade * p.maxA;
        if (a <= 0.003) continue;
        var g = ctx.createRadialGradient(x, p.y, 0, x, p.y, p.r * (1 + t));
        g.addColorStop(0, 'rgba(245,239,230,' + a.toFixed(3) + ')');
        g.addColorStop(1, 'rgba(245,239,230,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, p.y, p.r * (1 + t), 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    }
    function start() { if (raf == null) raf = requestAnimationFrame(frame); }
    function stop() { if (raf != null) { cancelAnimationFrame(raf); raf = null; } }
    if ('IntersectionObserver' in window) {
      var hero = document.getElementById('hero');
      if (hero) new IntersectionObserver(function (es) {
        visible = es[0].isIntersecting;
        if (visible) start(); else stop();
      }).observe(hero);
    }
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop(); else if (visible) start();
    });
    start();
  }

  /* ================= hero 视差 ================= */
  function parallax() {
    if (reduce) return;
    var layers = document.querySelectorAll('[data-plx]');
    if (!layers.length) return;
    var ticking = false;
    function update() {
      ticking = false;
      var y = window.scrollY;
      if (y > window.innerHeight * 1.4) return; /* hero 已远离，省 */
      for (var i = 0; i < layers.length; i++) {
        var s = parseFloat(layers[i].getAttribute('data-plx')) || 0;
        layers[i].style.transform = 'translate3d(0,' + (y * s).toFixed(1) + 'px,0)';
      }
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
  }

  /* ================= 法务弹窗 ================= */
  function modal() {
    var m = document.getElementById('legalModal');
    if (!m) return;
    var title = document.getElementById('legalTitle');
    var body = document.getElementById('legalBody');
    var lastFocus = null;
    function open(key) {
      var doc = LEGAL[key];
      if (!doc) return;
      lastFocus = document.activeElement;
      title.textContent = '';
      var t = document.createElement('span'); t.textContent = doc.title;
      var en = document.createElement('small'); en.textContent = doc.en + ' · ' + doc.updated;
      title.appendChild(t); title.appendChild(en);
      body.textContent = '';
      doc.points.forEach(function (pt) {
        var h = document.createElement('h5'); h.textContent = pt[0];
        var p = document.createElement('p'); p.textContent = pt[1];
        body.appendChild(h); body.appendChild(p);
      });
      var foot = document.createElement('p');
      foot.className = 'modal-foot';
      foot.textContent = '如有疑问，请联系 hello@isle.coffee，我们会在 2 个工作日内回复。';
      body.appendChild(foot);
      m.classList.add('open');
      m.setAttribute('aria-hidden', 'false');
      document.body.classList.add('lock');
      var x = m.querySelector('.modal-x');
      if (x) x.focus();
    }
    function close() {
      m.classList.remove('open');
      m.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('lock');
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    document.querySelectorAll('[data-legal]').forEach(function (b) {
      b.addEventListener('click', function () { open(b.getAttribute('data-legal')); });
    });
    m.addEventListener('click', function (e) {
      if (e.target.closest('[data-close]')) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && m.classList.contains('open')) close();
    });
  }

  /* ================= 启动 ================= */
  renderSite();
  loader();
  nav();
  burger();
  reveal();
  steam();
  parallax();
  modal();
})();

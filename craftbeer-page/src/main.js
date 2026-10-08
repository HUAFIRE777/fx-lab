/* 麦浪 BREWAVE · craftbeer-page —— 零依赖 classic 脚本
   动效：CSS transition 承接入场（.hero.enter），JS 只负责加类/交互/数据渲染 */
(function () {
  'use strict';
  document.documentElement.classList.add('js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ================= 配置：买家只改这里 ================= */
  var SITE = {
    name: '麦浪 BREWAVE',
    tagline: '把秋天，倒进杯子里。',
    address: '上海市杨浦区隆昌路 640 号（老厂房店 · 酿酒厂）',
    phone: '021-6567-8812',
    email: 'cheers@brewave.club',
    hours: '各门店营业时间见门店区 · 酒厂参观需预约',
    icp: '沪ICP备2026000000号-1',
    year: String(new Date().getFullYear())
  };

  var LEGAL = {
    privacy: {
      title: '隐私政策', en: 'PRIVACY POLICY', updated: '最后更新：2026 年 10 月',
      points: [
        ['我们收集什么', '加入会员、在门店预约品鉴或联系我们时，我们会收集你的手机号、称呼和到店记录，只用来安排品鉴和会员服务。'],
        ['信息用来做什么', '仅用于会员权益、新品通知和到店预约确认。不会出售、出租你的个人信息。'],
        ['信息保存多久', '会员信息在你退会后 30 天内删除；到店预约记录保存 1 年。'],
        ['你的权利', '你可以随时要求查询、更正或删除你的个人信息，也可以随时退会，客服 7 个工作日内处理。'],
        ['未成年人', '我们的会员与到店品鉴仅面向年满 18 岁的成年人，未满 18 岁请勿注册，门店会查验身份证件。']
      ]
    },
    terms: {
      title: '服务条款', en: 'TERMS OF SERVICE', updated: '最后更新：2026 年 10 月',
      points: [
        ['理性饮酒', '请理性饮酒，未满 18 岁请勿饮酒，酒后请勿驾车。各门店备有代驾叫车服务。'],
        ['会员权益', '会员价与专属酒款以门店公示为准；会员可随时退会，按剩余天数折算退款，不收手续费。'],
        ['预约品鉴', '到店品鉴建议提前 1 天预约；包场与共酿活动以实际报名确认为准，名额有限。'],
        ['酒款供应', '酒款为季节性酿造，部分酒款售完即止，以门店当日酒单为准。'],
        ['不可抗力', '因极端天气等不可抗力导致门店临时调整营业时间，我们会提前在公众号公告。']
      ]
    },
    cookies: {
      title: 'Cookie 政策', en: 'COOKIE POLICY', updated: '最后更新：2026 年 10 月',
      points: [
        ['我们用什么', '本站只用维持页面正常运行所必需的本地存储（如记住你选的风味筛选），不跑第三方广告追踪。'],
        ['用来做什么', '记住你的风味偏好和浏览状态，让你下次打开不用重选。'],
        ['保存多久', '本地存储保留 30 天，清除浏览器缓存即清除。'],
        ['你的选择', '你可以在浏览器设置里随时禁用本地存储，页面照常能用。']
      ]
    }
  };

  /* ================= SITE 渲染 ================= */
  function renderSite() {
    var els = document.querySelectorAll('[data-site]');
    for (var i = 0; i < els.length; i++) {
      var key = els[i].getAttribute('data-site');
      var hrefKey = els[i].getAttribute('data-site-href');
      if (SITE[key] !== undefined) els[i].textContent = SITE[key];
      if (hrefKey && SITE[hrefKey]) {
        var v = SITE[hrefKey];
        els[i].setAttribute('href', hrefKey === 'phone' ? 'tel:' + v.replace(/-/g, '') : 'mailto:' + v);
      }
    }
  }
  renderSite();

  /* ================= 加载态（完成态必达） ================= */
  var loader = document.getElementById('loader');
  var loaderDone = false;
  function releaseLoader() {
    if (loaderDone) return;
    loaderDone = true;
    loader.classList.add('done');
    setTimeout(function () { loader.classList.add('gone'); }, 600);
    /* loader 淡出即触发 hero 入场 */
    setTimeout(function () {
      document.getElementById('hero').classList.add('enter');
    }, reduce ? 0 : 250);
  }
  if (document.readyState === 'complete') setTimeout(releaseLoader, 700);
  else window.addEventListener('load', function () { setTimeout(releaseLoader, 700); });
  setTimeout(releaseLoader, 3500); /* 兜底：3.5s 必放行 */

  /* ================= 滚动 reveal ================= */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
    /* 4s 安全网：IO 漏报兜底 */
    setTimeout(function () {
      revealEls.forEach(function (el) { el.classList.add('in'); });
    }, 4000);
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ================= 数字滚动（easeOutCubic） ================= */
  function countUp(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var t0 = null, dur = 1600;
    function tick(t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / dur, 1);
      var e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * e).toLocaleString('en-US');
      if (p < 1) requestAnimationFrame(tick);
    }
    if (reduce) { el.textContent = target.toLocaleString('en-US'); return; }
    requestAnimationFrame(tick);
  }
  var statIO = ('IntersectionObserver' in window)
    ? new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { countUp(e.target); statIO.unobserve(e.target); }
        });
      }, { threshold: 0.5 })
    : null;
  document.querySelectorAll('.count').forEach(function (el) {
    if (statIO) statIO.observe(el);
    else countUp(el);
  });

  /* ================= 导航毛玻璃 ================= */
  var nav = document.getElementById('nav');
  function onScrollNav() { nav.classList.toggle('scrolled', window.scrollY > 24); }
  window.addEventListener('scroll', onScrollNav, { passive: true });
  onScrollNav();

  /* ================= 移动端抽屉 ================= */
  var burger = document.getElementById('burger');
  var drawer = document.getElementById('drawer');
  function setDrawer(open) {
    burger.classList.toggle('open', open);
    drawer.classList.toggle('open', open);
    drawer.setAttribute('aria-hidden', open ? 'false' : 'true');
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? '关闭菜单' : '打开菜单');
    document.body.style.overflow = open ? 'hidden' : '';
  }
  burger.addEventListener('click', function () { setDrawer(!drawer.classList.contains('open')); });
  drawer.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () { setDrawer(false); });
  });

  /* ================= 锚点平滑滚动（JS 驱动） ================= */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (ev) {
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      var t = document.querySelector(id);
      if (!t) return;
      ev.preventDefault();
      setDrawer(false);
      if (reduce) t.scrollIntoView();
      else t.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  /* ================= 风味筛选 tab ================= */
  var tabs = document.querySelectorAll('.flavor-tabs .tab');
  var cards = document.querySelectorAll('.flavor-card');
  var empty = document.getElementById('flavorEmpty');
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (t) {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      var f = tab.getAttribute('data-filter');
      var shown = 0;
      cards.forEach(function (c) {
        var cats = (c.getAttribute('data-cats') || '').split(' ');
        var hit = f === 'all' || cats.indexOf(f) !== -1;
        c.classList.toggle('hide', !hit);
        if (hit) shown++;
      });
      empty.hidden = shown > 0;
    });
  });

  /* ================= 法务弹窗（三通道关闭） ================= */
  var modal = document.getElementById('legalModal');
  var mTitle = document.getElementById('legalTitle');
  var mEn = document.getElementById('legalEn');
  var mUpd = document.getElementById('legalUpdated');
  var mBody = document.getElementById('legalBody');
  var lastFocus = null;
  function openLegal(key) {
    var doc = LEGAL[key];
    if (!doc) return;
    lastFocus = document.activeElement;
    mTitle.textContent = doc.title;
    mEn.textContent = doc.en;
    mUpd.textContent = doc.updated;
    mBody.innerHTML = doc.points.map(function (p) {
      return '<h4>' + p[0].replace(/</g, '&lt;') + '</h4><p>' +
        p[1].replace(/</g, '&lt;') + '</p>';
    }).join('');
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    document.getElementById('legalClose').focus();
  }
  function closeLegal() {
    modal.hidden = true;
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  document.querySelectorAll('[data-legal]').forEach(function (b) {
    b.addEventListener('click', function () { openLegal(b.getAttribute('data-legal')); });
  });
  modal.querySelectorAll('[data-close]').forEach(function (b) {
    b.addEventListener('click', closeLegal);
  });
  document.getElementById('legalClose').addEventListener('click', closeLegal);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (!modal.hidden) closeLegal();
      if (drawer.classList.contains('open')) setDrawer(false);
    }
  });

  /* ================= 酒杯气泡粒子 ================= */
  var canvas = document.getElementById('bubbles');
  if (canvas && !reduce) {
    var ctx = canvas.getContext('2d');
    var W = 0, H = 0, parts = [];
    function size() {
      var r = canvas.parentElement.getBoundingClientRect();
      W = canvas.width = Math.floor(r.width);
      H = canvas.height = Math.floor(r.height);
    }
    function spawn(init) {
      return {
        x: W * 0.28 + Math.random() * W * 0.44,
        y: init ? Math.random() * H : H * 0.92,
        r: 1.5 + Math.random() * 4,
        vy: 0.4 + Math.random() * 0.9,
        ph: Math.random() * Math.PI * 2,
        sway: 6 + Math.random() * 14,
        a: 0.12 + Math.random() * 0.3
      };
    }
    function init() {
      size();
      parts = [];
      var n = Math.min(46, Math.floor(W / 9));
      for (var i = 0; i < n; i++) parts.push(spawn(true));
    }
    var running = true;
    function frame(t) {
      if (!running) return;
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        p.y -= p.vy;
        p.ph += 0.02;
        var x = p.x + Math.sin(p.ph) * p.sway * 0.3;
        if (p.y < H * 0.16) { parts[i] = spawn(false); continue; }
        ctx.beginPath();
        ctx.arc(x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(243,233,210,' + p.a.toFixed(2) + ')';
        ctx.fill();
      }
      requestAnimationFrame(frame);
    }
    init();
    window.addEventListener('resize', init);
    requestAnimationFrame(frame);
    /* 酒杯离开视口时停跑 */
    new IntersectionObserver(function (en) {
      var vis = en[0].isIntersecting;
      if (vis && !running) { running = true; requestAnimationFrame(frame); }
      else if (!vis) running = false;
    }, { threshold: 0 }).observe(canvas);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) running = false;
      else if (!running) { running = true; requestAnimationFrame(frame); }
    });
  }
})();

/* 净驰 SHINEGO · carwash-page —— 零依赖 classic 脚本 */
(function () {
  'use strict';
  document.documentElement.classList.add('js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ================= 配置：买家只改这里 ================= */
  var SITE = {
    name: '净驰 SHINEGO',
    tagline: '把每辆车，都当展车洗。',
    address: '上海市浦东新区张杨路 1888 号',
    phone: '400-820-6633',
    phoneHref: 'tel:+864008206633',
    hours: '营业时间 9:00 – 21:00（全年无休）',
    icp: '沪ICP备xxxxxxxxxx号-1',
    year: String(new Date().getFullYear())
  };

  var LEGAL = {
    privacy: {
      title: '隐私政策', en: 'PRIVACY POLICY', updated: '最后更新：2026 年 10 月',
      points: [
        ['我们收集什么', '预约洗车、办理会员卡或联系客服时，我们会收集你的车牌号、车型、联系电话和预约时间。这些只用来安排工位和联系你确认。'],
        ['信息用来做什么', '仅用于预约履约、会员服务和售后回访。不会出售、出租你的个人信息，也不会用于你没同意过的营销。'],
        ['信息保存多久', '预约记录保存 1 年，到期自动删除；会员信息在你退卡后 30 天内删除。'],
        ['你的权利', '你可以随时要求查询、更正或删除你的个人信息，也可以要求注销会员卡。客服会在 7 个工作日内处理。'],
        ['摄像头', '施工区有监控摄像头，用于保障车辆安全。录像保存 30 天，仅安保人员可查看。'],
        ['未成年人', '我们的服务面向车主本人，未满 18 岁请在监护人陪同下办理会员。']
      ]
    },
    terms: {
      title: '服务条款', en: 'TERMS OF SERVICE', updated: '最后更新：2026 年 10 月',
      points: [
        ['价格', '全部门店执行官网价目，现场加项先报价、你同意了才做。不加项不收钱。'],
        ['洗不干净重洗', '提车时当面验车，发现没洗干净的地方当场免费重洗；离店后 24 小时内反馈同样有效。'],
        ['贵重物品', '洗车前请带走车内贵重物品。施工中如有物品遗失，请第一时间告知店长，我们调取监控核实。'],
        ['会员卡', '会员卡全国门店通用。未用完可退，按剩余次数折算退款，不收手续费，3 个工作日内到账。'],
        ['镀晶质保', '镀晶质保 2 年，质保期内出现非外力损伤的脱落、失光，免费补镀。'],
        ['不可抗力', '因极端天气、停水停电等不可抗力导致预约改期，我们会提前电话通知，免费改到你方便的时间。']
      ]
    },
    cookies: {
      title: 'Cookie 政策', en: 'COOKIE POLICY', updated: '最后更新：2026 年 10 月',
      points: [
        ['我们用什么', '本站只用维持页面正常运行所必需的本地存储（如记住你选的城市），不跑第三方广告追踪。'],
        ['用来做什么', '记住你的城市筛选和表单草稿，让你下次打开不用重选。'],
        ['保存多久', '本地存储保留 30 天，你清浏览器缓存就清掉了。'],
        ['你的选择', '你可以在浏览器设置里随时禁用本地存储，页面照常能用，只是每次要重新选城市。'],
        ['联系我们', '对 Cookie 有疑问，打 400-820-6633 问客服。']
      ]
    }
  };

  var STORES = [
    { city: '上海', name: '浦东张杨路店', addr: '浦东新区张杨路 1888 号', tag: '旗舰店 · 12 工位' },
    { city: '上海', name: '闵行莘庄店', addr: '闵行区莘建东路 118 号', tag: '精洗专区' },
    { city: '上海', name: '静安大宁店', addr: '静安区共和新路 1858 号', tag: '镀晶施工中心' },
    { city: '北京', name: '朝阳大悦城店', addr: '朝阳区朝阳北路 101 号', tag: '商场店 · 地下 B2' },
    { city: '北京', name: '海淀中关村店', addr: '海淀区中关村大街 27 号', tag: '8 工位' },
    { city: '广州', name: '天河城店', addr: '天河区天河路 208 号', tag: '旗舰店 · 12 工位' },
    { city: '广州', name: '番禺万博店', addr: '番禺区万博二路 79 号', tag: '精洗专区' },
    { city: '深圳', name: '南山海岸城店', addr: '南山区文心五路 33 号', tag: '商场店 · 地下 B1' },
    { city: '深圳', name: '福田中心店', addr: '福田区深南大道 6001 号', tag: '镀晶施工中心' },
    { city: '杭州', name: '西湖银泰店', addr: '上城区延安路 98 号', tag: '商场店 · 地下 B2' },
    { city: '成都', name: '高新大源店', addr: '高新区大源南二街 88 号', tag: '10 工位' },
    { city: '成都', name: '武侯双楠店', addr: '武侯区二环路南四段 8 号', tag: '精洗专区' }
  ];
  var CITIES = ['全部', '上海', '北京', '广州', '深圳', '杭州', '成都'];

  /* ================= SITE 渲染 ================= */
  function renderSite() {
    var els = document.querySelectorAll('[data-site]');
    for (var i = 0; i < els.length; i++) {
      var key = els[i].getAttribute('data-site');
      if (SITE[key] !== undefined) els[i].textContent = SITE[key];
      var hrefKey = els[i].getAttribute('data-site-href');
      if (hrefKey && SITE[hrefKey] !== undefined && els[i].tagName === 'A') {
        els[i].setAttribute('href', SITE[hrefKey]);
      }
    }
  }

  /* ================= 加载态 + hero 入场 ================= */
  var loader = document.getElementById('loader');
  var hero = document.getElementById('hero');
  var entered = false;
  function enter() {
    if (entered) return;
    entered = true;
    if (loader) loader.classList.add('done');
    if (hero) hero.classList.add('enter');
  }
  window.addEventListener('load', function () { setTimeout(enter, 650); });
  setTimeout(enter, 4000); /* 4s 兜底 */

  /* ================= 导航毛玻璃 ================= */
  var nav = document.getElementById('nav');
  function onScroll() {
    if (window.scrollY > 40) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ================= 汉堡抽屉 ================= */
  var burger = document.getElementById('burger');
  var drawer = document.getElementById('drawer');
  function setDrawer(open) {
    burger.classList.toggle('open', open);
    drawer.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    drawer.setAttribute('aria-hidden', open ? 'false' : 'true');
    document.body.classList.toggle('lock', open);
  }
  burger.addEventListener('click', function () {
    setDrawer(!drawer.classList.contains('open'));
  });
  drawer.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () { setDrawer(false); });
  });

  /* ================= 滚动 reveal ================= */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ================= 核心动效·泡沫粒子 ================= */
  var canvas = document.getElementById('foam');
  if (canvas && !reduce) {
    var ctx = canvas.getContext('2d');
    var W = 0, H = 0, parts = [], running = true;
    function size() {
      var r = hero.getBoundingClientRect();
      W = canvas.width = Math.floor(r.width);
      H = canvas.height = Math.floor(r.height);
    }
    function spawn(init) {
      var s = 2 + Math.random() * 7;
      return {
        x: Math.random() * W,
        y: init ? Math.random() * H : H + s + 10,
        r: s,
        vy: 0.35 + Math.random() * 0.9,
        sway: 20 + Math.random() * 50,
        ph: Math.random() * Math.PI * 2,
        life: 0, maxLife: 500 + Math.random() * 700,
        a: 0.10 + Math.random() * 0.28
      };
    }
    function init() {
      size();
      parts = [];
      var n = Math.min(90, Math.floor(W / 16));
      for (var i = 0; i < n; i++) parts.push(spawn(true));
    }
    function frame() {
      if (!running) return;
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        p.life++;
        p.y -= p.vy;
        var x = p.x + Math.sin(p.ph + p.life / 60) * p.sway * 0.25;
        var fade = Math.sin(Math.PI * Math.min(1, p.life / p.maxLife));
        var alpha = p.a * fade;
        if (alpha <= 0.004 || p.y < -20) { parts[i] = spawn(false); continue; }
        var g = ctx.createRadialGradient(x, p.y, 0, x, p.y, p.r);
        g.addColorStop(0, 'rgba(255,255,255,' + alpha.toFixed(3) + ')');
        g.addColorStop(0.7, 'rgba(255,255,255,' + (alpha * 0.55).toFixed(3) + ')');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      requestAnimationFrame(frame);
    }
    init();
    frame();
    window.addEventListener('resize', init);
    /* hero 离开视口 / 标签页隐藏时停跑，省电 */
    new IntersectionObserver(function (en) {
      var vis = en[0].isIntersecting;
      if (vis && !running) { running = true; frame(); }
      else if (!vis) { running = false; }
    }, { threshold: 0 }).observe(hero);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) running = false;
      else if (!running) { running = true; frame(); }
    });
  }

  /* ================= 门店城市筛选 ================= */
  var chipsBox = document.getElementById('cityChips');
  var storeGrid = document.getElementById('storeGrid');
  var activeCity = '全部';
  function renderChips() {
    chipsBox.innerHTML = '';
    CITIES.forEach(function (c) {
      var b = document.createElement('button');
      b.className = 'chip' + (c === activeCity ? ' on' : '');
      b.textContent = c;
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', c === activeCity ? 'true' : 'false');
      b.addEventListener('click', function () {
        activeCity = c;
        renderChips();
        renderStores();
      });
      chipsBox.appendChild(b);
    });
  }
  function renderStores() {
    storeGrid.innerHTML = '';
    STORES.filter(function (s) {
      return activeCity === '全部' || s.city === activeCity;
    }).forEach(function (s) {
      var card = document.createElement('article');
      card.className = 'store-card';
      var h = document.createElement('h3');
      h.innerHTML = '<svg viewBox="0 0 48 48" aria-hidden="true"><use href="#i-pin"/></svg>';
      h.appendChild(document.createTextNode(s.name));
      var addr = document.createElement('p');
      addr.textContent = s.addr;
      var hours = document.createElement('p');
      hours.textContent = SITE.hours;
      var tag = document.createElement('span');
      tag.className = 'st-tag';
      tag.textContent = s.tag;
      card.appendChild(h);
      card.appendChild(addr);
      card.appendChild(hours);
      card.appendChild(tag);
      storeGrid.appendChild(card);
    });
  }
  renderChips();
  renderStores();

  /* ================= 预约表单 ================= */
  var form = document.getElementById('bookForm');
  var okMsg = document.getElementById('formOk');
  var errMsg = document.getElementById('formErr');
  var serviceSel = document.getElementById('serviceSel');
  /* 价目/会员卡的"选X"按钮 → 预填服务下拉 */
  document.querySelectorAll('[data-service]').forEach(function (btn) {
    if (btn.tagName !== 'A') return;
    btn.addEventListener('click', function () {
      serviceSel.value = btn.getAttribute('data-service');
    });
  });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var plate = form.plate.value.trim();
    var model = form.model.value.trim();
    var time = form.time.value;
    if (!plate || !model || !time) {
      errMsg.hidden = false;
      okMsg.hidden = true;
      return;
    }
    errMsg.hidden = true;
    okMsg.hidden = false;
    okMsg.textContent = '已收到！' + plate + ' · ' + serviceSel.value + '，门店会在 10 分钟内电话联系你确认。';
    form.querySelector('button[type=submit]').disabled = true;
  });

  /* ================= 法务弹窗（三通道关闭） ================= */
  var modal = document.getElementById('legalModal');
  var legalTitle = document.getElementById('legalTitle');
  var legalEn = document.getElementById('legalEn');
  var legalUpd = document.getElementById('legalUpd');
  var legalList = document.getElementById('legalList');
  var lastFocus = null;
  function openLegal(key) {
    var d = LEGAL[key];
    if (!d) return;
    lastFocus = document.activeElement;
    legalTitle.textContent = d.title;
    legalEn.textContent = d.en;
    legalUpd.textContent = d.updated;
    legalList.innerHTML = '';
    d.points.forEach(function (pt) {
      var li = document.createElement('li');
      var st = document.createElement('strong');
      st.textContent = pt[0];
      li.appendChild(st);
      li.appendChild(document.createTextNode(pt[1]));
      legalList.appendChild(li);
    });
    modal.hidden = false;
    document.body.classList.add('lock');
    modal.querySelector('.modal-x').focus();
  }
  function closeLegal() {
    modal.hidden = true;
    document.body.classList.remove('lock');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  document.querySelectorAll('[data-legal]').forEach(function (b) {
    b.addEventListener('click', function () { openLegal(b.getAttribute('data-legal')); });
  });
  modal.querySelectorAll('[data-close]').forEach(function (b) {
    b.addEventListener('click', closeLegal);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (!modal.hidden) closeLegal();
      if (drawer.classList.contains('open')) setDrawer(false);
    }
  });

  renderSite();
})();

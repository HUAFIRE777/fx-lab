/* 诺言 VOWS · 婚礼策划 — src/main.js
   配置区在顶部：SITE / LEGAL / CFG，买家只改这里。纯原生 JS，零外部库。 */
(function () {
  'use strict';
  document.documentElement.classList.add('js');

  /* ================= 配置 ================= */
  var SITE = {
    name: '诺言婚礼策划工作室',
    phone: '400-880-1314',
    phoneHref: 'tel:4008801314',
    wechat: 'vows-wedding',
    address: '上海市静安区南京西路 1266 号 8 楼',
    icp: '沪ICP备2026000000号-1（占位）'
  };

  var LEGAL = {
    privacy: {
      title: '隐私政策',
      points: [
        '我们收集的信息仅限你主动留下的称呼、电话、婚期与留言，用于档期查询与回电联系，不做他用。',
        '你的联系方式不会出售、出租或共享给任何第三方营销机构。',
        '咨询记录保存 12 个月，到期自动删除；你可随时来电要求提前删除。',
        '婚礼现场照片/视频用于案例展示前，会单独征求你们二人的书面同意。',
        '网站不收集身份证号、银行卡号等敏感信息，签约付款走对公账户与纸质/电子合同。'
      ]
    },
    terms: {
      title: '服务条款',
      points: [
        '策划服务费按签约档位一次性或分三期（签约 40% / 婚前 30 天 40% / 婚礼日 20%）支付，第三方费用（场地、餐饮、花艺等）实报实销。',
        '签约后 7 天内可无理由改期一次；婚期变更需提前 30 天书面确认，档期冲突时按签约顺序优先。',
        '因不可抗力（极端天气、政策原因）导致婚礼取消，已发生且有票据的第三方费用不退，策划服务费按比例退还。',
        '婚礼日执行团队提前 3 小时到场；若我方原因导致关键环节缺失，按合同约定赔付。',
        '本条款最终解释权归诺言婚礼策划工作室，争议优先友好协商，协商不成提交工作室所在地法院。'
      ]
    },
    cookies: {
      title: 'Cookie 政策',
      points: [
        '本站仅使用维持表单填写状态所必需的本地存储，不做跨站追踪。',
        '我们不接入任何第三方广告 Cookie，你的浏览行为不会被用于广告画像。',
        '浏览器清掉本地数据后，下次访问看到的是全新页面，不影响任何功能。',
        '档期查询表单的内容只存在你自己的浏览器里，点「提交」才会发给我们。',
        '如对以上有疑问，欢迎直接拨打 400-880-1314 询问。'
      ]
    }
  };

  var CFG = {
    navOffset: 40,
    revealThreshold: 0.12,
    loaderMin: 700,      // 加载态最短展示 ms
    loaderMax: 3500,     // 兜底放行 ms
    petalCount: 26
  };

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ================= SITE 渲染 ================= */
  function renderSite() {
    var els = document.querySelectorAll('[data-site]');
    for (var i = 0; i < els.length; i++) {
      var key = els[i].getAttribute('data-site');
      var hrefKey = els[i].getAttribute('data-site-href');
      if (SITE[key] !== undefined) els[i].textContent = SITE[key];
      if (hrefKey && SITE[hrefKey]) els[i].setAttribute('href', SITE[hrefKey]);
    }
    document.getElementById('year').textContent = new Date().getFullYear();
  }

  /* ================= 加载态（完成态必达） ================= */
  var loaderDone = false;
  function releaseLoader() {
    if (loaderDone) return;
    loaderDone = true;
    document.body.classList.add('ready');
  }
  var t0 = Date.now();
  window.addEventListener('load', function () {
    var wait = Math.max(0, CFG.loaderMin - (Date.now() - t0));
    setTimeout(releaseLoader, wait);
  });
  setTimeout(releaseLoader, CFG.loaderMax); // 兜底：load 迟迟不来也放行

  /* ================= 导航滚动毛玻璃 ================= */
  var nav = document.getElementById('nav');
  function onScroll() {
    if (window.scrollY > CFG.navOffset) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ================= 移动端抽屉 ================= */
  var burger = document.getElementById('burger');
  var veil = document.getElementById('drawerVeil');
  function closeDrawer() {
    document.body.classList.remove('drawer-open');
    burger.setAttribute('aria-expanded', 'false');
  }
  burger.addEventListener('click', function () {
    var open = document.body.classList.toggle('drawer-open');
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  veil.addEventListener('click', closeDrawer);
  document.querySelectorAll('.drawer [data-scroll]').forEach(function (a) {
    a.addEventListener('click', closeDrawer);
  });

  /* ================= 平滑锚点 ================= */
  document.querySelectorAll('[data-scroll]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (!id || id.charAt(0) !== '#') return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      if (reduceMotion) target.scrollIntoView();
      else target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.replaceState(null, '', id);
    });
  });

  /* ================= 花瓣 canvas（主视觉动效） ================= */
  var canvas = document.getElementById('petals');
  var ctx = canvas.getContext('2d');
  var petals = [];
  var PETAL_COLORS = ['#c6a15b', '#d9b978', '#e9d9b8', '#faf7f0'];
  function sizeCanvas() {
    var r = canvas.parentElement.getBoundingClientRect();
    canvas.width = Math.max(1, Math.floor(r.width));
    canvas.height = Math.max(1, Math.floor(r.height));
  }
  function newPetal(anyY) {
    return {
      x: Math.random() * canvas.width,
      y: anyY ? Math.random() * canvas.height : -30 - Math.random() * 60,
      s: 7 + Math.random() * 11,          // 大小
      a: Math.random() * Math.PI * 2,     // 朝向
      spin: (Math.random() - 0.5) * 1.6,  // 角速度
      fall: 24 + Math.random() * 46,      // 下落 px/s
      swayA: 18 + Math.random() * 34,     // 摇摆幅度
      swayF: 0.5 + Math.random() * 0.9,   // 摇摆频率
      ph: Math.random() * Math.PI * 2,    // 相位
      alpha: 0.35 + Math.random() * 0.45,
      color: PETAL_COLORS[(Math.random() * PETAL_COLORS.length) | 0]
    };
  }
  function drawPetal(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.a);
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    var s = p.s;
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.bezierCurveTo(s * 0.9, -s * 0.6, s * 0.7, s * 0.7, 0, s);
    ctx.bezierCurveTo(-s * 0.7, s * 0.7, -s * 0.9, -s * 0.6, 0, -s);
    ctx.fill();
    ctx.restore();
  }
  var lastT = 0, rafId = 0;
  function tick(t) {
    var dt = Math.min(0.05, (t - lastT) / 1000 || 0.016);
    lastT = t;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (var i = 0; i < petals.length; i++) {
      var p = petals[i];
      p.ph += dt * p.swayF * 2;
      p.y += p.fall * dt;
      p.x += Math.sin(p.ph) * p.swayA * dt;
      p.a += p.spin * dt;
      if (p.y > canvas.height + 40) petals[i] = newPetal(false);
      drawPetal(petals[i]);
    }
    rafId = requestAnimationFrame(tick);
  }
  function startPetals() {
    sizeCanvas();
    petals = [];
    for (var i = 0; i < CFG.petalCount; i++) petals.push(newPetal(true));
    if (reduceMotion) {
      // 静止画一帧，不跑动画
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      petals.forEach(drawPetal);
    } else {
      cancelAnimationFrame(rafId);
      lastT = performance.now();
      rafId = requestAnimationFrame(tick);
    }
  }
  var rsz;
  window.addEventListener('resize', function () {
    clearTimeout(rsz);
    rsz = setTimeout(startPetals, 200);
  });
  startPetals();

  /* ================= 滚动 reveal ================= */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) {
        en.target.classList.add('in');
        io.unobserve(en.target);
      }
    });
  }, { threshold: CFG.revealThreshold });
  document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });

  /* ================= 法务弹窗（三通道关闭） ================= */
  var modal = document.getElementById('legalModal');
  var mTitle = document.getElementById('legalTitle');
  var mBody = document.getElementById('legalBody');
  var lastFocus = null;
  function openLegal(key) {
    var doc = LEGAL[key];
    if (!doc) return;
    lastFocus = document.activeElement;
    mTitle.textContent = doc.title;
    mBody.innerHTML = '<ol>' + doc.points.map(function (p) {
      return '<li>' + p.replace(/</g, '&lt;') + '</li>';
    }).join('') + '</ol>';
    modal.hidden = false;
    requestAnimationFrame(function () { modal.classList.add('open'); });
    document.body.classList.add('modal-open');
    modal.querySelector('.modal-x').focus();
  }
  function closeLegal() {
    modal.classList.remove('open');
    document.body.classList.remove('modal-open');
    setTimeout(function () { modal.hidden = true; }, 380);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  document.querySelectorAll('[data-legal]').forEach(function (b) {
    b.addEventListener('click', function () { openLegal(b.getAttribute('data-legal')); });
  });
  modal.querySelectorAll('[data-close]').forEach(function (b) {
    b.addEventListener('click', closeLegal);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !modal.hidden) closeLegal();
    if (e.key === 'Escape' && document.body.classList.contains('drawer-open')) closeDrawer();
  });

  /* ================= 套餐直达表单预选 ================= */
  document.querySelectorAll('[data-plan]').forEach(function (a) {
    a.addEventListener('click', function () {
      var sel = document.getElementById('fPlan');
      sel.value = a.getAttribute('data-plan');
    });
  });

  /* ================= 档期表单 ================= */
  var form = document.getElementById('bookingForm');
  var errBox = document.getElementById('formErr');
  var okBox = document.getElementById('formOk');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = form.name.value.trim();
    var phone = form.phone.value.trim();
    var date = form.date.value;
    errBox.textContent = '';
    if (!name) { errBox.textContent = '请留个称呼，方便策划师联系你。'; form.name.focus(); return; }
    if (!/^1\d{10}$/.test(phone)) { errBox.textContent = '手机号好像不对，请检查 11 位数字。'; form.phone.focus(); return; }
    if (date) {
      var d = new Date(date + 'T00:00:00');
      var today = new Date(); today.setHours(0, 0, 0, 0);
      if (d < today) { errBox.textContent = '婚期选到了过去，换个未来的日子吧。'; form.date.focus(); return; }
    }
    // 成功态：隐藏表单控件，展示确认
    var no = 'VOWS-' + new Date().getFullYear() +
      String(Math.floor(1000 + Math.random() * 9000));
    document.getElementById('okNo').textContent = no;
    Array.prototype.forEach.call(form.querySelectorAll('.field, .form-err, .btn-block, .form-fine'),
      function (el) { el.style.display = 'none'; });
    okBox.hidden = false;
  });

  renderSite();
})();

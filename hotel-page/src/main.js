/* 云汀度假酒店 · hotel-page —— 零依赖 vanilla JS */
document.documentElement.classList.add('js');

var CFG = {
  navOffset: 40,        // 导航毛玻璃触发距离 px
  revealThreshold: 0.12, // 滚动 reveal 阈值
  loaderMin: 700,        // 加载态最短展示 ms
  loaderMax: 4000        // 加载态兜底上限 ms
};

/* ============ SITE：买家改这里，一改全改 ============ */
var SITE = {
  name: '云汀度假酒店',
  phone: '0571-8888 6666',
  phoneHref: 'tel:+8657188886666',
  address: '杭州市西湖区湖滨路 88 号',
  icp: '浙ICP备2026000000号-1',
  year: '2026'
};

/* ============ 法务三件套文案：真实感通用条款 ============ */
var LEGAL = {
  privacy: {
    title: '隐私政策',
    sections: [
      { h: '我们收集什么', ps: ['预订时你留下的姓名、手机号与入住偏好，仅用于完成订单与入住服务。', '浏览网站时产生的设备与访问日志，用于排查故障与优化页面，不会关联你的真实身份。'] },
      { h: '信息怎么用', ps: ['只做三件事：确认订单、入住前短信提醒、会员优惠通知。', '优惠短信可随时回复 TD 退订，退订后不再打扰。'] },
      { h: '信息给谁看', ps: ['你的信息只在酒店前台、预订系统与支付通道之间流转，不出售、不出租给任何第三方营销公司。', '法律要求或你明确授权时除外。'] },
      { h: '保存多久', ps: ['订单信息按财务规定保存 5 年，到期匿名化处理；浏览日志 90 天滚动删除。'] },
      { h: '你的权利', ps: ['随时致电 ' + SITE.phone + ' 查询、更正或删除你的个人信息，我们在 3 个工作日内处理。'] }
    ]
  },
  terms: {
    title: '服务条款',
    sections: [
      { h: '预订与确认', ps: ['官网提交预订需求后，以酒店短信或电话确认为准，确认前不产生合同关系。', '预订成功后请在入住当日 18:00 前到店，超时未到且未提前联系，房间可能被释放。'] },
      { h: '取消政策', ps: ['入住前 24 小时以上取消，全额退款；24 小时以内取消，收取首晚房费 30% 作为违约金。', '独栋别墅需提前 72 小时取消，规则以预订确认短信为准。'] },
      { h: '入住须知', ps: ['办理入住请出示有效身份证件，未成年人需由监护人陪同。', '全店室内禁烟，吸烟请至指定区域；宠物暂不接待，导盲犬除外。'] },
      { h: '价格说明', ps: ['页面标价为门市价，节假日可能上浮，实际以预订确认时的价格为准。', '会员直订价不与其它券包叠加使用，券包规则以领取页面说明为准。'] },
      { h: '免责', ps: ['因台风、暴雨等不可抗力导致无法入住的，全额退款，酒店不承担行程损失。'] }
    ]
  },
  cookies: {
    title: 'Cookie 政策',
    sections: [
      { h: '我们用什么 Cookie', ps: ['必要型：记住你的预订日期选择与弹窗关闭状态，关掉它页面没法正常用。', '统计型：匿名统计哪个房型被看得最多，帮我们决定先翻新哪一层。'] },
      { h: '管多久', ps: ['必要型 Cookie 随会话结束自动失效；统计型保留 13 个月，到期自动清除。'] },
      { h: '怎么关', ps: ['浏览器设置里随时可以禁用 Cookie，禁用后预订日期可能需要每次手动重选。', '继续使用本网站，即视为你理解并接受上述 Cookie 用途。'] }
    ]
  }
};

/* ============ SITE 渲染 ============ */
(function renderSite(){
  document.querySelectorAll('[data-site]').forEach(function(el){
    var k = el.getAttribute('data-site');
    if (SITE[k] !== undefined) el.textContent = SITE[k];
  });
  document.querySelectorAll('[data-site-href]').forEach(function(el){
    var k = el.getAttribute('data-site-href');
    if (k === 'phone') el.setAttribute('href', SITE.phoneHref);
  });
})();

/* ============ 加载态 ============ */
(function loader(){
  var el = document.getElementById('loader');
  var t0 = Date.now(), done = false;
  function hide(){
    if (done) return; done = true;
    var wait = Math.max(0, CFG.loaderMin - (Date.now() - t0));
    setTimeout(function(){
      el.classList.add('done');
      document.body.classList.add('loaded');
      setTimeout(function(){ el.remove(); }, 900);
    }, wait);
  }
  window.addEventListener('load', hide);
  setTimeout(hide, CFG.loaderMax); // 兜底：4s 必定消失
})();

/* ============ 导航滚动 ============ */
(function nav(){
  var nav = document.getElementById('nav');
  function onScroll(){ nav.classList.toggle('scrolled', window.scrollY > CFG.navOffset); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

/* ============ 移动抽屉 ============ */
(function drawer(){
  var drawer = document.getElementById('drawer'),
      burger = document.getElementById('burger'),
      close = document.getElementById('drawerClose');
  function open(){ drawer.classList.add('open'); burger.setAttribute('aria-expanded','true'); document.body.style.overflow = 'hidden'; }
  function shut(){ drawer.classList.remove('open'); burger.setAttribute('aria-expanded','false'); document.body.style.overflow = ''; }
  burger.addEventListener('click', open);
  close.addEventListener('click', shut);
  drawer.querySelectorAll('a').forEach(function(a){ a.addEventListener('click', shut); });
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape') shut(); });
})();

/* ============ 滚动 reveal ============ */
(function reveal(){
  var items = document.querySelectorAll('[data-reveal]');
  if (!('IntersectionObserver' in window)) {
    items.forEach(function(el){ el.classList.add('in'); });
    return;
  }
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    });
  }, { threshold: CFG.revealThreshold, rootMargin: '0px 0px -6% 0px' });
  items.forEach(function(el){ io.observe(el); });
})();

/* ============ hero 湖面波纹（主视觉动效 · Canvas 程序化） ============ */
(function lake(){
  var cv = document.getElementById('lake');
  var hero = cv.closest('.hero');
  var ctx = cv.getContext('2d');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var W = 0, H = 0, dpr = 1, running = true, t = 0, last = 0;

  function size(){
    var r = hero.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height));
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  size();
  window.addEventListener('resize', size);

  var mx = 0.78, my = 0.2; // 月亮位置（相对）

  function draw(){
    // 夜空
    var sky = ctx.createLinearGradient(0, 0, 0, H * 0.46);
    sky.addColorStop(0, '#061224');
    sky.addColorStop(1, '#0C2340');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H * 0.46);

    // 远山剪影
    ctx.fillStyle = '#050e1d';
    ctx.beginPath();
    ctx.moveTo(0, H * 0.46);
    var n = 24;
    for (var i = 0; i <= n; i++) {
      var x = (W / n) * i;
      var y = H * 0.46 - (Math.sin(i * 1.7) * 0.5 + 0.5) * H * 0.075 - Math.sin(i * 0.6 + 2) * H * 0.03;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W, H * 0.46);
    ctx.closePath();
    ctx.fill();

    // 月亮与光晕
    var mX = W * mx, mY = H * my, mR = Math.min(W, H) * 0.045;
    var glow = ctx.createRadialGradient(mX, mY, 0, mX, mY, mR * 7);
    glow.addColorStop(0, 'rgba(232,214,175,.5)');
    glow.addColorStop(1, 'rgba(232,214,175,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(mX - mR * 7, mY - mR * 7, mR * 14, mR * 14);
    ctx.fillStyle = '#efe3c8';
    ctx.beginPath(); ctx.arc(mX, mY, mR, 0, Math.PI * 2); ctx.fill();

    // 湖面基底
    var hz = H * 0.46;
    var water = ctx.createLinearGradient(0, hz, 0, H);
    water.addColorStop(0, '#0e2a4d');
    water.addColorStop(0.5, '#0C2340');
    water.addColorStop(1, '#061224');
    ctx.fillStyle = water;
    ctx.fillRect(0, hz, W, H - hz);

    // 月影：随时间抖动的金色碎片
    ctx.fillStyle = 'rgba(200,169,106,.5)';
    var rows = 26;
    for (var r2 = 0; r2 < rows; r2++) {
      var yy = hz + 8 + r2 * ((H - hz - 20) / rows);
      var spread = (r2 / rows);
      var wob = Math.sin(t * 1.3 + r2 * 1.9) * (6 + spread * 26);
      var ww = mR * (0.7 + spread * 2.6) * (0.75 + 0.25 * Math.sin(t * 2.1 + r2 * 2.7));
      ctx.globalAlpha = 0.34 * (1 - spread * 0.75);
      ctx.fillRect(mX - ww / 2 + wob, yy, ww, 2.2);
    }
    ctx.globalAlpha = 1;

    // 波纹带：四层正弦波，速度错峰
    var bands = [
      { y: 0.06, amp: 5,  len: 0.010, sp: 0.55, col: 'rgba(160,200,240,.16)', lw: 2 },
      { y: 0.24, amp: 7,  len: 0.008, sp: 0.38, col: 'rgba(200,169,106,.20)', lw: 1.6 },
      { y: 0.48, amp: 9,  len: 0.006, sp: 0.27, col: 'rgba(160,200,240,.12)', lw: 2.4 },
      { y: 0.76, amp: 11, len: 0.005, sp: 0.18, col: 'rgba(200,169,106,.14)', lw: 2 }
    ];
    bands.forEach(function(b, bi){
      var yy = hz + (H - hz) * b.y;
      ctx.strokeStyle = b.col;
      ctx.lineWidth = b.lw;
      ctx.beginPath();
      for (var x = 0; x <= W; x += 8) {
        var y2 = yy + Math.sin(x * b.len * 6.28 + t * b.sp * 2 + bi * 2.1) * b.amp
                   + Math.sin(x * b.len * 17.3 - t * b.sp * 3.2) * b.amp * 0.35;
        if (x === 0) ctx.moveTo(x, y2); else ctx.lineTo(x, y2);
      }
      ctx.stroke();
    });

    // 薄雾：两团缓慢漂移的径向渐变
    function mist(px, py, pr, a){
      var g = ctx.createRadialGradient(px, py, 0, px, py, pr);
      g.addColorStop(0, 'rgba(190,210,235,' + a + ')');
      g.addColorStop(1, 'rgba(190,210,235,0)');
      ctx.fillStyle = g;
      ctx.fillRect(px - pr, py - pr, pr * 2, pr * 2);
    }
    mist(W * (0.3 + 0.06 * Math.sin(t * 0.11)), H * 0.5, W * 0.22, 0.10);
    mist(W * (0.72 + 0.05 * Math.cos(t * 0.09)), H * 0.62, W * 0.26, 0.08);
  }

  function frame(ts){
    if (!running) return;
    if (!last) last = ts;
    var dt = Math.min(0.05, (ts - last) / 1000); last = ts;
    t += dt;
    draw();
    requestAnimationFrame(frame);
  }

  if (reduce) { draw(); return; } // 减弱动效：只画一帧静态

  // 离开视口暂停，省电
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function(es){
      var vis = es[0].isIntersecting && !document.hidden;
      if (vis && !running) { running = true; last = 0; requestAnimationFrame(frame); }
      else if (!vis) running = false;
    }).observe(hero);
  }
  document.addEventListener('visibilitychange', function(){
    if (!document.hidden && running === false) { running = true; last = 0; requestAnimationFrame(frame); }
  });
  requestAnimationFrame(frame);
})();

/* ============ 预订引擎 ============ */
(function booking(){
  var form = document.getElementById('booking');
  var inEl = document.getElementById('inDate'),
      outEl = document.getElementById('outDate'),
      roomEl = document.getElementById('roomType'),
      result = document.getElementById('bookingResult');
  var PRICE = { '湖景大床房': 1288, '行政套房': 2388, '独栋别墅': 5888 };

  function fmt(d){ return d.toISOString().slice(0, 10); }
  function zh(dstr){
    var d = new Date(dstr + 'T00:00:00');
    return (d.getMonth() + 1) + '月' + d.getDate() + '日';
  }
  function money(n){ return '¥' + n.toLocaleString('en-US'); }

  var today = new Date();
  var dIn = new Date(today); dIn.setDate(dIn.getDate() + 7);
  var dOut = new Date(today); dOut.setDate(dOut.getDate() + 9);
  inEl.min = fmt(today); outEl.min = fmt(today);
  inEl.value = fmt(dIn); outEl.value = fmt(dOut);
  inEl.addEventListener('change', function(){
    if (outEl.value <= inEl.value) {
      var d = new Date(inEl.value + 'T00:00:00');
      d.setDate(d.getDate() + 1);
      outEl.value = fmt(d);
    }
  });

  form.addEventListener('submit', function(e){
    e.preventDefault();
    var nights = Math.round((new Date(outEl.value) - new Date(inEl.value)) / 86400000);
    if (!(nights > 0)) {
      result.innerHTML = '离店日期得晚于入住日期，麻烦再选一下。';
      result.classList.add('show');
      return;
    }
    var room = roomEl.value, p = PRICE[room] || 1288;
    result.innerHTML = '查到啦：<strong>' + zh(inEl.value) + ' → ' + zh(outEl.value) + '</strong> · ' + room +
      ' · 共 ' + nights + ' 晚有房，总价 <strong>' + money(p * nights) + '</strong> 起。致电 <strong>' +
      SITE.phone + '</strong> 锁定会员价。';
    result.classList.add('show');
  });

  // 房型卡"预订此房型"：把房型填进引擎并滚回去
  document.querySelectorAll('.room-book').forEach(function(btn){
    btn.addEventListener('click', function(){
      roomEl.value = btn.getAttribute('data-room');
      result.classList.remove('show');
      document.getElementById('booking').scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(function(){ inEl.focus({ preventScroll: true }); }, 700);
    });
  });
})();

/* ============ 会员领券 ============ */
(function coupon(){
  var form = document.getElementById('couponForm'),
      input = document.getElementById('couponPhone'),
      hint = document.getElementById('couponHint');
  form.addEventListener('submit', function(e){
    e.preventDefault();
    var v = input.value.replace(/\D/g, '');
    hint.classList.remove('err');
    if (!/^1\d{10}$/.test(v)) {
      hint.textContent = '手机号好像少了位，再检查一下。';
      hint.classList.add('err');
      input.focus();
      return;
    }
    var masked = v.slice(0, 3) + '****' + v.slice(7);
    hint.textContent = '券包已发往 ' + masked + '，官网预订时自动抵扣。';
    input.value = '';
  });
})();

/* ============ 法务弹窗 ============ */
(function legal(){
  var modal = document.getElementById('legalModal'),
      title = document.getElementById('legalTitle'),
      body = document.getElementById('legalBody'),
      closeBtn = document.getElementById('legalClose'),
      backdrop = document.getElementById('legalBackdrop'),
      lastFocus = null;

  function open(key){
    var doc = LEGAL[key];
    if (!doc) return;
    lastFocus = document.activeElement;
    title.textContent = doc.title;
    body.innerHTML = '';
    doc.sections.forEach(function(s){
      var h = document.createElement('h4'); h.textContent = s.h; body.appendChild(h);
      s.ps.forEach(function(p){
        var el = document.createElement('p'); el.textContent = p; body.appendChild(el);
      });
    });
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  }
  function shut(){
    modal.classList.remove('open');
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  document.querySelectorAll('[data-legal]').forEach(function(btn){
    btn.addEventListener('click', function(){ open(btn.getAttribute('data-legal')); });
  });
  closeBtn.addEventListener('click', shut);
  backdrop.addEventListener('click', shut);
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && modal.classList.contains('open')) shut(); });
})();

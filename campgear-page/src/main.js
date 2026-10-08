/* 野宿 FIELDSTAY · campgear-page 交互脚本（零依赖，原生 JS）
   买家配置只改顶部 SITE / LEGAL 两个对象 */
'use strict';

var SITE = {
  name: '野宿户外装备有限公司',
  brand: '野宿 FIELDSTAY',
  address: '浙江省杭州市西湖区留和路 318 号',
  phone: '400-880-7620',
  phoneHref: 'tel:4008807620',
  email: 'hello@fieldstay.cn',
  emailHref: 'mailto:hello@fieldstay.cn',
  hours: '客服时间 9:00–21:00（全年无休）',
  icp: '浙ICP备2026000000号-1（占位）',
  year: String(new Date().getFullYear())
};

var LEGAL = {
  privacy: { title: '隐私政策', body: [
    ['我们收集什么', '下单与租赁时，我们会收集你的姓名、手机号、收货地址，用于发货、归还提醒与售后。这是完成服务所必需的最少信息。'],
    ['我们不收集什么', '不读取你的通讯录、相册与位置轨迹。浏览页面不做跨站追踪，不卖你的信息。'],
    ['保存多久', '订单信息保存 3 年用于售后与开票，到期匿名化处理。你可以随时要求删除。'],
    ['你的权利', '发邮件到 hello@fieldstay.cn，可查阅、更正或删除你的个人信息，我们在 15 个工作日内回复。']
  ]},
  terms: { title: '服务条款', body: [
    ['购买与租赁', '装备租赁以整天计，不足一天按一天计。取货时请当面验货，离店后外观损伤由承租人承担。'],
    ['押金', '支持芝麻信用免押；未授权免押时按装备价值收取押金，归还验收无损坏后 3 个工作日内原路退回。'],
    ['损坏与赔偿', '正常使用磨损不收费；丢失或人为损坏按官网折旧价赔偿，维修能解决的只收维修费。'],
    ['取消', '出发前 48 小时免费取消；24 小时内取消收首日租金 30% 作为备货成本。']
  ]},
  cookies: { title: 'Cookie 政策', body: [
    ['我们用什么', '只用记住登录态、购物车与偏好设置所必需的 Cookie，不做广告画像。'],
    ['第三方', '支付环节会跳转到支付机构页面，受其隐私政策约束，我们不经手你的支付密码。'],
    ['怎么关', '浏览器设置里随时可以禁用 Cookie，禁用后购物车与登录态可能无法记住，但浏览不受影响。']
  ]}
};

document.documentElement.classList.add('js');

(function bindSite(){
  document.querySelectorAll('[data-site]').forEach(function(el){
    var v = SITE[el.getAttribute('data-site')];
    if (v != null) el.textContent = v;
  });
  document.querySelectorAll('[data-site-href]').forEach(function(el){
    var v = SITE[el.getAttribute('data-site-href')];
    if (v) el.setAttribute('href', v);
  });
})();

/* ---------- 星空 canvas：闪烁星点 + 偶发流星 ---------- */
(function stars(){
  var cv = document.getElementById('stars');
  if (!cv) return;
  var ctx = cv.getContext('2d');
  var W, H, dots = [], meteors = [];
  var DPR = Math.min(window.devicePixelRatio || 1, 2);
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function resize(){
    var r = cv.parentElement.getBoundingClientRect();
    W = r.width; H = r.height;
    cv.width = W * DPR; cv.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    dots = [];
    var n = Math.floor(W * H / 9000);
    for (var i = 0; i < n; i++){
      dots.push({
        x: Math.random() * W, y: Math.random() * H * 0.72,
        r: Math.random() * 1.4 + 0.4,
        p: Math.random() * Math.PI * 2,
        s: 0.6 + Math.random() * 1.6
      });
    }
  }
  function spawnMeteor(){
    meteors.push({
      x: W * (0.3 + Math.random() * 0.6), y: H * Math.random() * 0.25,
      vx: -(5 + Math.random() * 4), vy: 3 + Math.random() * 2,
      life: 1
    });
  }
  var t = 0, nextMeteor = 240;
  function frame(){
    t += 0.016;
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < dots.length; i++){
      var d = dots[i];
      var a = 0.35 + 0.65 * Math.abs(Math.sin(t * d.s + d.p));
      ctx.globalAlpha = a;
      ctx.fillStyle = '#f5f0e6';
      ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, 6.2832); ctx.fill();
    }
    ctx.globalAlpha = 1;
    for (var j = meteors.length - 1; j >= 0; j--){
      var m = meteors[j];
      m.x += m.vx; m.y += m.vy; m.life -= 0.02;
      if (m.life <= 0){ meteors.splice(j, 1); continue; }
      var g = ctx.createLinearGradient(m.x, m.y, m.x - m.vx * 10, m.y - m.vy * 10);
      g.addColorStop(0, 'rgba(245,240,230,' + (0.9 * m.life) + ')');
      g.addColorStop(1, 'rgba(245,240,230,0)');
      ctx.strokeStyle = g; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(m.x, m.y);
      ctx.lineTo(m.x - m.vx * 10, m.y - m.vy * 10); ctx.stroke();
    }
    if (--nextMeteor <= 0){ spawnMeteor(); nextMeteor = 300 + Math.random() * 420; }
    requestAnimationFrame(frame);
  }
  resize();
  window.addEventListener('resize', resize);
  if (!reduced) requestAnimationFrame(frame);
  else { /* 降级：画一帧静态星空 */ t = 1; ctx.clearRect(0,0,W,H);
    dots.forEach(function(d){ ctx.globalAlpha = .7; ctx.fillStyle = '#f5f0e6';
      ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, 6.2832); ctx.fill(); });
    ctx.globalAlpha = 1; }
})();

/* ---------- 导航滚动毛玻璃 ---------- */
(function nav(){
  var nav = document.getElementById('nav');
  function onScroll(){ nav.classList.toggle('scrolled', window.scrollY > 40); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

/* ---------- 移动端抽屉 ---------- */
(function drawer(){
  var burger = document.getElementById('burger');
  var drawer = document.getElementById('drawer');
  var mask = document.getElementById('drawerMask');
  var closeBtn = document.getElementById('drawerClose');
  function open(){
    drawer.classList.add('open'); drawer.setAttribute('aria-hidden', 'false');
    mask.hidden = false;
    requestAnimationFrame(function(){ requestAnimationFrame(function(){ mask.classList.add('show'); }); });
    burger.classList.add('open'); burger.setAttribute('aria-expanded', 'true');
    document.body.classList.add('locked'); closeBtn.focus();
  }
  function close(){
    drawer.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true');
    mask.classList.remove('show'); burger.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('locked'); burger.focus();
    setTimeout(function(){ mask.hidden = true; }, 400);
  }
  burger.addEventListener('click', function(){ drawer.classList.contains('open') ? close() : open(); });
  closeBtn.addEventListener('click', close);
  mask.addEventListener('click', close);
  drawer.querySelectorAll('a').forEach(function(a){ a.addEventListener('click', close); });
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape' && drawer.classList.contains('open')) close();
  });
})();

/* ---------- reveal 入场 + hero 标题 ---------- */
(function reveal(){
  var hero = document.getElementById('hero');
  requestAnimationFrame(function(){ requestAnimationFrame(function(){ hero.classList.add('in'); }); });
  var els = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)){
    els.forEach(function(el){ el.classList.add('in'); });
    return;
  }
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if (en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); }
    });
  }, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
  els.forEach(function(el){ io.observe(el); });
  /* 兜底：3.5 秒后全部点亮，完成态永远可达 */
  setTimeout(function(){ els.forEach(function(el){ el.classList.add('in'); }); }, 3500);
})();

/* ---------- 数字滚动 ---------- */
(function counters(){
  var els = document.querySelectorAll('.count');
  function run(el){
    var target = parseInt(el.getAttribute('data-count'), 10) || 0;
    var dur = 1400, t0 = null;
    function step(ts){
      if (!t0) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1);
      var e = 1 - Math.pow(1 - p, 3); /* easeOutCubic */
      el.textContent = Math.round(target * e);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if (!('IntersectionObserver' in window)){ els.forEach(run); return; }
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if (en.isIntersecting){ run(en.target); io.unobserve(en.target); }
    });
  }, { threshold: 0.5 });
  els.forEach(function(el){ io.observe(el); });
})();

/* ---------- 法务弹窗：× 按钮 / 遮罩 / ESC 三通道 ---------- */
(function legal(){
  var mask = document.getElementById('modalMask');
  var modal = document.getElementById('modal');
  var title = document.getElementById('modalTitle');
  var body = document.getElementById('modalBody');
  var closeBtn = document.getElementById('modalClose');
  var lastFocus = null;

  function open(key){
    var doc = LEGAL[key];
    if (!doc) return;
    lastFocus = document.activeElement;
    title.textContent = doc.title;
    body.innerHTML = '';
    doc.body.forEach(function(sec){
      var h = document.createElement('h5'); h.textContent = sec[0];
      var p = document.createElement('p'); p.textContent = sec[1];
      body.appendChild(h); body.appendChild(p);
    });
    mask.hidden = false; modal.hidden = false;
    requestAnimationFrame(function(){ requestAnimationFrame(function(){
      mask.classList.add('show'); modal.classList.add('open');
    }); });
    document.body.classList.add('locked');
    closeBtn.focus();
  }
  function close(){
    mask.classList.remove('show'); modal.classList.remove('open');
    document.body.classList.remove('locked');
    setTimeout(function(){ mask.hidden = true; modal.hidden = true; }, 380);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  document.querySelectorAll('[data-legal]').forEach(function(btn){
    btn.addEventListener('click', function(){ open(btn.getAttribute('data-legal')); });
  });
  closeBtn.addEventListener('click', close);
  mask.addEventListener('click', close);
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape' && !modal.hidden) close();
  });
})();

/* ---------- CTA 表单 ---------- */
(function cta(){
  var form = document.getElementById('ctaForm');
  var phone = document.getElementById('ctaPhone');
  var tip = document.getElementById('ctaTip');
  form.addEventListener('submit', function(e){
    e.preventDefault();
    var v = phone.value.replace(/\D/g, '');
    if (!/^1\d{10}$/.test(v)){
      tip.textContent = '手机号好像少了几位，再检查一下。';
      tip.classList.remove('ok');
      phone.focus();
      return;
    }
    tip.textContent = '券已锁定，出发前凭短信到店核销。山野见！';
    tip.classList.add('ok');
    phone.value = '';
  });
})();

/* ---------- 加载态：load + 3s 双重关闭兜底 ---------- */
(function loader(){
  var loader = document.getElementById('loader');
  var done = false;
  function hide(){
    if (done) return; done = true;
    loader.classList.add('done');
    setTimeout(function(){ loader.hidden = true; }, 700);
  }
  window.addEventListener('load', function(){ setTimeout(hide, 500); });
  setTimeout(hide, 3000);
})();

/* 安澜保险 ANLAN · main.js (classic script，无依赖，GSAP 全局)
   先加 .js 类：只有脚本真正跑起来才隐藏待入场元素，保证"完成态可达"。 */
document.documentElement.classList.add('js');

/* ================= SITE 配置（一改全改） ================= */
var SITE = {
  brand: '安澜',
  brandEn: 'ANLAN',
  organizer: '安澜保险经纪有限公司',      // 版权主体
  phone: '400-820-9555',                  // 客服热线（示例）
  address: '上海市浦东新区陆家嘴环路 1088 号', // （示例地址）
  email: 'service@anlan-ins.example.com', // （示例邮箱）
  icp: '沪ICP备2026000000号-1'            // （示例备案号）
};

var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* 公司信息渲染 */
document.querySelectorAll('[data-site]').forEach(function (el) {
  var k = el.getAttribute('data-site');
  if (SITE[k] !== undefined) el.textContent = SITE[k];
});

/* ================= 顶栏滚动 ============ */
var nav = document.getElementById('nav');
function onScroll() {
  nav.classList.toggle('scrolled', window.scrollY > 24);
}
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ================= 移动抽屉 ============ */
var burger = document.getElementById('burger');
var drawer = document.getElementById('drawer');
var drawerMask = document.getElementById('drawerMask');
var drawerClose = document.getElementById('drawerClose');
function openDrawer() {
  drawerMask.hidden = false;
  requestAnimationFrame(function () {
    drawerMask.classList.add('show');
    drawer.classList.add('open');
  });
  drawer.setAttribute('aria-hidden', 'false');
  burger.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
}
function closeDrawer() {
  drawerMask.classList.remove('show');
  drawer.classList.remove('open');
  drawer.setAttribute('aria-hidden', 'true');
  burger.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
  setTimeout(function () { drawerMask.hidden = true; }, 320);
}
burger.addEventListener('click', openDrawer);
drawerClose.addEventListener('click', closeDrawer);
drawerMask.addEventListener('click', closeDrawer);
drawer.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', closeDrawer); });

/* ================= hero 入场（核心动效①：逐行升起） ============ */
var hero = document.querySelector('[data-intro]');
var lines = Array.prototype.slice.call(hero.querySelectorAll('.rl-line'));
/* 先清掉 CSS 初值，再交给 GSAP（百分比位移坑修复） */
lines.forEach(function (el) { el.style.transform = 'none'; });
if (window.gsap && !REDUCED) {
  gsap.set(lines, { yPercent: 112 });
  gsap.to(lines, {
    yPercent: 0, duration: 1.05, ease: 'power3.out', stagger: 0.12, delay: 0.15,
    onComplete: function () { hero.classList.add('in'); gsap.set(lines, { clearProps: 'all' }); }
  });
} else {
  /* 降级：直接显示完成态 */
  hero.classList.add('in');
  gsap && gsap.set(lines, { clearProps: 'all' });
}

/* ================= 区块 stagger 入场（核心动效②） ============ */
var rvEls = document.querySelectorAll('.rv');
if (REDUCED || !('IntersectionObserver' in window)) {
  rvEls.forEach(function (el) { el.classList.add('in'); });
} else {
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  /* 同父容器内的 .rv 按出现顺序加微小延迟，形成 stagger */
  rvEls.forEach(function (el) {
    var sibs = Array.prototype.filter.call(el.parentNode.children, function (c) { return c.classList && c.classList.contains('rv'); });
    el.style.transitionDelay = Math.min(sibs.indexOf(el) * 90, 360) + 'ms';
    io.observe(el);
  });
}

/* ================= 保障计算器（核心动效③：实时联动 + 数字滚动） ============ */
var ageInput = document.getElementById('age');
var coverInput = document.getElementById('cover');
var ageVal = document.getElementById('ageVal');
var coverVal = document.getElementById('coverVal');
var premiumEl = document.getElementById('premium');
var rateNote = document.getElementById('rateNote');
var term = 20;

function bandRate(age) {
  if (age < 30) return 2.1;
  if (age < 40) return 3.4;
  if (age < 50) return 5.9;
  return 9.8;
}
var TERM_MULT = { 10: 0.85, 20: 1.0, 30: 1.25 };

function fmtWan(n) {
  return n >= 10000 ? (n / 10000) + ' 万元' : n + ' 元';
}
var shownPremium = 0, rollRAF = null;
function rollTo(target) {
  var from = shownPremium, start = null, DUR = 520;
  if (REDUCED) { premiumEl.textContent = target.toLocaleString('zh-CN'); shownPremium = target; return; }
  if (rollRAF) cancelAnimationFrame(rollRAF);
  function frame(ts) {
    if (!start) start = ts;
    var t = Math.min((ts - start) / DUR, 1);
    var e = 1 - Math.pow(1 - t, 3); /* easeOutCubic，有物理感 */
    var v = Math.round(from + (target - from) * e);
    premiumEl.textContent = v.toLocaleString('zh-CN');
    if (t < 1) { rollRAF = requestAnimationFrame(frame); }
    else { shownPremium = target; rollRAF = null; }
  }
  rollRAF = requestAnimationFrame(frame);
}
function recalc() {
  var age = +ageInput.value, cover = +coverInput.value;
  ageVal.textContent = age + ' 岁';
  coverVal.textContent = fmtWan(cover);
  var rate = bandRate(age) * TERM_MULT[term];
  var premium = Math.round(cover / 1000 * rate); /* 费率为 ‰：保费 = 保额 × 费率 / 1000 */
  rateNote.textContent = '费率 ' + rate.toFixed(1) + '‰';
  rollTo(premium);
}
ageInput.addEventListener('input', recalc);
coverInput.addEventListener('input', recalc);
document.querySelectorAll('.term-seg button').forEach(function (b) {
  b.addEventListener('click', function () {
    document.querySelectorAll('.term-seg button').forEach(function (x) { x.classList.remove('on'); });
    b.classList.add('on');
    term = +b.getAttribute('data-term');
    recalc();
  });
});
/* 加载态：先骨架 shimmer，700ms 后出数字 */
premiumEl.classList.add('loading');
setTimeout(function () {
  premiumEl.classList.remove('loading');
  recalc();
}, 700);

/* ================= 顾问预约表单 ============ */
var form = document.getElementById('advForm');
var formOk = document.getElementById('formOk');
function setErr(name, msg) {
  var e = form.querySelector('[data-err="' + name + '"]');
  var input = form.elements[name];
  e.textContent = msg || '';
  e.classList.toggle('show', !!msg);
  if (input) input.classList.toggle('bad', !!msg);
  return !msg;
}
form.addEventListener('submit', function (ev) {
  ev.preventDefault();
  var name = form.elements.name.value.trim();
  var phone = form.elements.phone.value.trim();
  var ok = true;
  ok = setErr('name', name ? '' : '请填写您的称呼') && ok;
  ok = setErr('phone', /^1[3-9]\d{9}$/.test(phone) ? '' : '请填写正确的 11 位手机号码') && ok;
  if (!ok) return;
  formOk.hidden = false; /* 成功态：覆盖式确认面板 */
});

/* ================= 法务三件套弹窗 ============ */
var LEGAL = {
  privacy: {
    title: '隐私政策',
    body: [
      ['我们收集哪些信息', '为完成顾问预约与保险服务，我们可能收集您的称呼、手机号码及咨询方向。投保环节依法还需收集身份信息与健康告知，均以实际业务需要为限。'],
      ['信息如何使用', '仅用于：①顾问回访与方案沟通；②保单承保、核保与理赔服务；③法律法规要求的合规留存。未经您同意，不会用于其他用途。'],
      ['信息如何保护', '数据加密传输与存储，访问权限最小化，服务器位于中国境内。发生安全事件时，我们将依法及时告知。'],
      ['您的权利', '您有权查阅、更正、删除您的个人信息，或撤回同意。申请请致电客服热线，我们将在 15 个工作日内响应。'],
      ['第三方共享', '除承保必需的再保险与监管报送外，我们不会向第三方出售或共享您的个人信息。']
    ]
  },
  terms: {
    title: '服务条款',
    body: [
      ['本站性质', '本网站为保险产品介绍与预约服务平台，页面展示内容仅为产品介绍，不构成保险合同要约。保障范围、免责条款以正式保险合同载明为准。'],
      ['预约服务', '提交预约后，持证顾问将在 24 小时内与您联系。预约不产生任何费用，您可随时取消。'],
      ['试算说明', '保障计算器的试算结果基于公开费率模型估算，仅供参考，不作为承保承诺。实际保费以核保结论为准。'],
      ['责任限制', '因不可抗力、网络故障导致的服务中断，我们将尽力恢复但不承担间接损失赔偿责任。'],
      ['适用法律', '本条款适用中华人民共和国法律。争议优先协商解决，协商不成提交公司所在地人民法院管辖。']
    ]
  },
  cookies: {
    title: 'Cookie 政策',
    body: [
      ['我们使用 Cookie 做什么', '用于记住您的偏好设置（如计算器参数）、统计页面访问情况以改进服务。'],
      ['Cookie 的类型', '必要型 Cookie 保障页面正常运行；分析型 Cookie 用于匿名访问统计。两类均不收集个人身份信息。'],
      ['如何管理', '您可通过浏览器设置禁用 Cookie。禁用后计算器偏好记忆等功能可能受影响，但核心浏览不受影响。'],
      ['不跨站追踪', '我们不在第三方网站投放追踪代码，不会将您的浏览行为用于跨站广告画像。']
    ]
  }
};
var modalMask = document.getElementById('modalMask');
var modalTitle = document.getElementById('modalTitle');
var modalBody = document.getElementById('modalBody');
var modalX = document.getElementById('modalX');
var lastFocus = null;
function openModal(key) {
  var d = LEGAL[key];
  if (!d) return;
  lastFocus = document.activeElement;
  modalTitle.textContent = d.title;
  modalBody.innerHTML = d.body.map(function (s) {
    return '<h5>' + s[0] + '</h5><p>' + s[1] + '</p>';
  }).join('') + '<p class="modal-upd">最后更新：2026 年 10 月 · ' + SITE.organizer + '</p>';
  modalMask.hidden = false;
  requestAnimationFrame(function () { modalMask.classList.add('show'); });
  document.body.style.overflow = 'hidden';
  modalX.focus();
}
function closeModal() {
  modalMask.classList.remove('show');
  document.body.style.overflow = '';
  setTimeout(function () { modalMask.hidden = true; }, 300);
  if (lastFocus && lastFocus.focus) lastFocus.focus();
}
document.querySelectorAll('[data-modal]').forEach(function (a) {
  a.addEventListener('click', function (ev) { ev.preventDefault(); openModal(a.getAttribute('data-modal')); });
});
modalX.addEventListener('click', closeModal);
modalMask.addEventListener('click', function (ev) { if (ev.target === modalMask) closeModal(); });
document.addEventListener('keydown', function (ev) {
  if (ev.key === 'Escape') {
    if (!modalMask.hidden) closeModal();
    closeDrawer();
  }
});

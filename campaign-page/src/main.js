/* ============================================================
城市夜跑节 2026 · 营销活动页模板 — 交互逻辑（classic script）
零外部依赖：纯原生 JS + CSS，GSAP / three.js 均未使用
------------------------------------------------------------
（改这里即可换活动）
============================================================ */
(function () {
'use strict';

/* ============ SITE 配置：改这里，全站公司信息跟着变 ============ */
var SITE = {
  organizer: '城市夜跑节组委会',               // 主办方（法务区 / 版权行）
  address:   '上海市杨浦区滨江大道 88 号滨江公园管理处', // 联系地址（法务区）
  email:     'run@citynightrun.cn',          // 联系邮箱（法务区）
  phone:     '400-880-2026',                 // 联系电话（法务区）
  icp:       '京ICP备xxxxxx号'               // 备案占位，上线前替换真实号（版权行）
};

/* ---------- 站点信息渲染（法务区 + 页脚版权行引用 SITE） ---------- */
function setText(id, v) { var el = document.getElementById(id); if (el) el.textContent = v; }
setText('legalOrg', SITE.organizer);
setText('legalAddr', SITE.address);
setText('legalPhone', SITE.phone);
setText('legalMail', SITE.email);
setText('copyOrg', SITE.organizer);
setText('icp', SITE.icp);

/* ---------- 配置 ---------- */
var CONFIG = {
EVENT_DATE: '2026-11-08T19:00:00+08:00', // 起跑时间（ISO，决定倒计时）
COUNTUP_MS: 1600, // 数字滚动时长
REVEAL_FALLBACK_MS: 8000,// 兜底：8s 内强制显现所有.reveal（防 IO 失效）
LOADER_MIN_MS: 900, // 加载态最短展示
LOADER_MAX_MS: 2600, // 加载态最长等待
SIGNUP_ENDPOINT: null // 报名接口：填 URL 则 fetch POST，否则纯前端演示成功态
};

var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ============================================================
1. 加载态 → 入场
============================================================ */
var loader = document.getElementById('loader');
var loaderBar = document.getElementById('loaderBar');
var t0 = Date.now();
var progress = 0;

function setProgress(p) {
progress = Math.min(100, p);
if (loaderBar) loaderBar.style.width = progress + '%';
}
// 伪进度：快进到 80%，等 window.load 或超时再收尾
var fakeTimer = setInterval(function () {
if (progress < 80) setProgress(progress + Math.random() * 14);
}, 160);

function finishLoading() {
clearInterval(fakeTimer);
setProgress(100);
var wait = Math.max(0, CONFIG.LOADER_MIN_MS - (Date.now() - t0));
setTimeout(function () {
if (loader) loader.classList.add('done');
document.body.classList.add('ready'); // 触发 hero 入场 stagger
setTimeout(function () { if (loader && loader.parentNode) loader.parentNode.removeChild(loader);}, 600);
}, reduceMotion? 0: wait);
}
if (document.readyState === 'complete') {
finishLoading();
} else {
window.addEventListener('load', finishLoading);
setTimeout(finishLoading, CONFIG.LOADER_MAX_MS); // 兜底：不等 load 卡死
}

/* ============================================================
2. 巨型标题逐字 stagger（无 JS 时 h1 原样显示，保证可达）
============================================================ */
(function splitTitle() {
var h1 = document.getElementById('megaTitle');
if (!h1) return;
var text = h1.textContent;
// 样式分配：城 市=实心 / 夜 跑=描边 / 节=电光绿
var styles = ['solid', 'solid', 'line', 'line', 'hot'];
h1.setAttribute('aria-label', text);
h1.textContent = '';
var frag = document.createDocumentFragment();
for (var i = 0; i < text.length; i++) {
var ch = document.createElement('span');
ch.className = 'ch';
ch.setAttribute('aria-hidden', 'true');
var inner = document.createElement('span');
inner.className = 'ch-in ' + (styles[i] || 'solid');
inner.textContent = text[i];
if (!reduceMotion) inner.style.transitionDelay = (0.12 + i * 0.09) + 's';
ch.appendChild(inner);
frag.appendChild(ch);
}
h1.appendChild(frag);
})();

/* ============================================================
3. 导航：滚动底色 + 移动端抽屉
============================================================ */
var nav = document.getElementById('nav');
var burger = document.getElementById('burger');
var drawer = document.getElementById('drawer');
var scrim = document.getElementById('scrim');

function onScrollNav() {
if (window.scrollY > 40) nav.classList.add('scrolled');
else nav.classList.remove('scrolled');
}
window.addEventListener('scroll', onScrollNav, { passive: true});
onScrollNav();

function setMenu(open) {
document.body.classList.toggle('menu-open', open);
burger.setAttribute('aria-expanded', open? 'true': 'false');
burger.setAttribute('aria-label', open? '关闭菜单': '打开菜单');
drawer.setAttribute('aria-hidden', open? 'false': 'true');
}
burger.addEventListener('click', function () {
setMenu(!document.body.classList.contains('menu-open'));
});
scrim.addEventListener('click', function () { setMenu(false);});
drawer.addEventListener('click', function (e) {
if (e.target.closest('a')) setMenu(false);
});
document.addEventListener('keydown', function (e) {
if (e.key === 'Escape') setMenu(false);
});

/* ============================================================
4. 滚动显现 + 数据卡翻入（IO；无 IO 则直接显现）
============================================================ */
var revealEls = Array.prototype.slice.call(document.querySelectorAll('.reveal'));

function applyDelay(el) {
var d = el.getAttribute('data-delay');
if (d &&!reduceMotion) el.style.transitionDelay = d + 'ms';
}
function revealOne(el) {
if (el.classList.contains('in')) return;
applyDelay(el);
el.classList.add('in');
var num = el.querySelector('[data-count]');
if (num) startCount(num);
// 入场过渡结束后：清掉一次性 delay，加 settled 恢复常态 hover 过渡
var settled = false;
function doSettle() {
if (settled) return;
settled = true;
el.style.transitionDelay = '';
el.classList.add('settled');
}
el.addEventListener('transitionend', function h(e) {
if (e.propertyName === 'transform' || e.propertyName === 'opacity') {
el.removeEventListener('transitionend', h);
doSettle();
}
});
setTimeout(doSettle, 1600); // 兜底：transitionend 未触发时
}

if ('IntersectionObserver' in window &&!reduceMotion) {
var io = new IntersectionObserver(function (entries) {
entries.forEach(function (en) {
if (en.isIntersecting) {
revealOne(en.target);
io.unobserve(en.target);
}
});
}, { threshold: 0.15, rootMargin: '0px 0px -6% 0px'});
revealEls.forEach(function (el) { io.observe(el);});
} else {
revealEls.forEach(revealOne); // 降级：直接终态
}
// 兜底：N 秒后强制全部显现（IO 失效/元素永不可见时）
setTimeout(function () {
revealEls.forEach(function (el) {
if (!el.classList.contains('in')) revealOne(el);
});
}, CONFIG.REVEAL_FALLBACK_MS);

/* ============================================================
5. 数字滚动（easeOutExpo，千分位）
============================================================ */
function easeOutExpo(t) { return t >= 1? 1: 1 - Math.pow(2, -10 * t);}
function fmt(n) { return Math.round(n).toLocaleString('en-US');}

function startCount(el) {
if (el.dataset.done) return;
el.dataset.done = '1';
var target = parseInt(el.getAttribute('data-count'), 10) || 0;
if (reduceMotion) { el.textContent = fmt(target); return;}
var dur = CONFIG.COUNTUP_MS;
var start = null;
function step(ts) {
if (!start) start = ts;
var p = Math.min(1, (ts - start) / dur);
el.textContent = fmt(target * easeOutExpo(p));
if (p < 1) requestAnimationFrame(step);
else el.textContent = fmt(target);
}
requestAnimationFrame(step);
}

/* ============================================================
6. Hero 滚动视差（rAF 节流）
============================================================ */
(function parallax() {
if (reduceMotion) return;
var layers = Array.prototype.slice.call(document.querySelectorAll('[data-speed]'));
if (!layers.length) return;
var ticking = false;
function update() {
ticking = false;
var y = window.scrollY;
if (y > window.innerHeight * 1.2) return; // 离开 hero 区跳过
layers.forEach(function (el) {
var s = parseFloat(el.getAttribute('data-speed')) || 0;
el.style.transform = 'translate3d(0,' + (y * s).toFixed(1) + 'px,0)' +
(el.classList.contains('hero-ghost')? ' translateX(-50%)': '');
});
}
window.addEventListener('scroll', function () {
if (!ticking) { ticking = true; requestAnimationFrame(update);}
}, { passive: true});
update();
})();
// 注意：hero-ghost 初始 transform 含 translateX(-50%)，parallax 里补回，避免跳变

/* ============================================================
7. 倒计时翻牌
============================================================ */
var target = new Date(CONFIG.EVENT_DATE).getTime();
var units = [
{ id: 'f-days', get: function (d) { return d.days;}},
{ id: 'f-hours', get: function (d) { return d.hours;}},
{ id: 'f-mins', get: function (d) { return d.mins;}},
{ id: 'f-secs', get: function (d) { return d.secs;}}
];
var clockNote = document.getElementById('clockNote');

function pad(n) { return (n < 10? '0': '') + n;}
function getDiff() {
var ms = Math.max(0, target - Date.now());
var s = Math.floor(ms / 1000);
return {
over: ms <= 0,
days: Math.floor(s / 86400),
hours: Math.floor(s % 86400 / 3600),
mins: Math.floor(s % 3600 / 60),
secs: s % 60
};
}
function setFaces(flip, val) {
var spans = flip.querySelectorAll('.top span,.bot span');
for (var i = 0; i < spans.length; i++) spans[i].textContent = val;
flip.dataset.val = val;
}
function flipTo(flip, val) {
if (flip.dataset.val === val) return;
if (reduceMotion) { setFaces(flip, val); return;}
var old = flip.dataset.val || '00';
var ft = flip.querySelector('.flap-top span');
var fb = flip.querySelector('.flap-bot span');
ft.textContent = old;
fb.textContent = val;
flip.classList.remove('playing');
void flip.offsetWidth; // 重启动画
flip.classList.add('playing');
// 上半翻完（280ms）后切静态面到底值，下半继续翻
setTimeout(function () { setFaces(flip, val);}, 280);
setTimeout(function () { flip.classList.remove('playing');}, 600);
}
function tick() {
var d = getDiff();
units.forEach(function (u) {
var flip = document.getElementById(u.id);
if (flip) flipTo(flip, pad(u.get(d)));
});
if (d.over && clockNote) {
clockNote.textContent = '比赛正在进行中，赛场见！';
}
}
// 初始化静态面
(function initClock() {
var d = getDiff();
units.forEach(function (u) {
var flip = document.getElementById(u.id);
if (flip) setFaces(flip, pad(u.get(d)));
});
})();
setInterval(tick, 1000);
tick();

/* ============================================================
8. 组别卡 → 预选并滚动到报名
============================================================ */
var fDiv = document.getElementById('fDiv');
Array.prototype.forEach.call(document.querySelectorAll('.pick-div'), function (btn) {
btn.addEventListener('click', function () {
if (fDiv) fDiv.value = btn.getAttribute('data-div');
document.getElementById('signup').scrollIntoView({ behavior: reduceMotion? 'auto': 'smooth'});
});
});

/* ============================================================
9. 报名表单（校验 + 成功态；可接真实接口）
============================================================ */
var form = document.getElementById('signupForm');
var fName = document.getElementById('fName');
var fPhone = document.getElementById('fPhone');
var formErr = document.getElementById('formErr');
var okBox = document.getElementById('signupOk');

function markInvalid(input, msg) {
var field = input.closest('.field');
field.classList.remove('invalid');
void field.offsetWidth;
field.classList.add('invalid');
formErr.textContent = msg;
input.focus();
}
function clearInvalid() {
formErr.textContent = '';
Array.prototype.forEach.call(form.querySelectorAll('.field.invalid'), function (f) {
f.classList.remove('invalid');
});
}

form.addEventListener('submit', function (e) {
e.preventDefault();
clearInvalid();
var name = fName.value.trim();
var phone = fPhone.value.trim();
if (!name) { markInvalid(fName, '请填写姓名，赛道上我们要喊你名字。'); return;}
if (!/^1[3-9]\d{9}$/.test(phone)) { markInvalid(fPhone, '手机号格式不对，参赛短信会发到这个号码。'); return;}

function succeed() {
var no = 'NR2026-' + String(Math.floor(10000 + Math.random() * 90000));
document.getElementById('okNo').textContent = no;
var divName = fDiv.options[fDiv.selectedIndex].text.split(' · ')[0];
document.getElementById('okText').textContent =
name + '，' + divName + '报名成功！11 月 8 日 19:00，滨江公园见。';
form.style.display = 'none';
okBox.hidden = false;
okBox.scrollIntoView({ behavior: reduceMotion? 'auto': 'smooth', block: 'center'});
}

if (CONFIG.SIGNUP_ENDPOINT) {
fetch(CONFIG.SIGNUP_ENDPOINT, {
method: 'POST',
headers: { 'Content-Type': 'application/json'},
body: JSON.stringify({ name: name, phone: phone, division: fDiv.value})
}).then(function (r) {
if (!r.ok) throw new Error('bad status');
succeed();
}).catch(function () {
formErr.textContent = '网络开小差了，请稍后再试。';
});
} else {
// 演示模式：短暂延迟模拟提交
var btn = form.querySelector('[type="submit"]');
btn.disabled = true;
btn.textContent = '提交中…';
setTimeout(succeed, 700);
}
});
[fName, fPhone].forEach(function (input) {
input.addEventListener('input', clearInvalid);
});

/* ============================================================
10. 法务三件套：标签切换 + 页脚锚点联动
============================================================ */
(function legalTabs() {
var tabBtns = Array.prototype.slice.call(document.querySelectorAll('.legal-tab'));
var panels = Array.prototype.slice.call(document.querySelectorAll('.legal-panel'));
if (!tabBtns.length) return;
function selectTab(name) {
tabBtns.forEach(function (b) {
var on = b.getAttribute('data-tab') === name;
b.classList.toggle('active', on);
b.setAttribute('aria-selected', on? 'true': 'false');
});
panels.forEach(function (p) {
p.classList.toggle('active', p.id === 'panel-' + name);
});
}
tabBtns.forEach(function (b) {
b.addEventListener('click', function () {
selectTab(b.getAttribute('data-tab'));
});
});
// 页脚锚点：切到对应标签 + 平滑滚动（无 JS 时原生锚点照样滚到位）
Array.prototype.forEach.call(document.querySelectorAll('[data-legal-tab]'), function (a) {
a.addEventListener('click', function (e) {
e.preventDefault();
selectTab(a.getAttribute('data-legal-tab'));
var sec = document.getElementById('legal');
if (sec) sec.scrollIntoView({ behavior: reduceMotion? 'auto': 'smooth'});
});
});
})();
})();

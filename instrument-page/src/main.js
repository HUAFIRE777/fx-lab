/* 聆木 LINGMU · instrument-page 交互源码（打包时内联为单文件） */
(function(){
"use strict";
document.documentElement.classList.add('js');

/* ================= 配置 ================= */
var CFG = {
  navOffset: 40,        // 导航毛玻璃触发距离(px)
  revealThreshold: 0.12,// 滚动 reveal 触发阈值
  loaderMin: 900        // 加载态最短展示(ms)
};

/* SITE：站点信息集中配置，改这里一改全改 */
var SITE = {
  name: "聆木 LINGMU",
  phone: "400-880-2026",
  phoneHref: "tel:4008802026",
  email: "hello@lingmu-music.com",
  emailHref: "mailto:hello@lingmu-music.com",
  address: "上海市静安区弦音路 66 号 · 聆木体验店",
  icp: "沪ICP备2026000000号-1",
  year: "2026"
};

/* LEGAL：法务三件套文案，改文案只改这里 */
var LEGAL = {
  privacy: { title: "隐私政策", points: [
    {t:"我们收集什么", d:"预约体验课时你留下的姓名和手机号，仅用于门店联系你确认到店时间。"},
    {t:"用来做什么", d:"确认课程时间、发送新手练习单。我们不做营销群发，不半夜打电话。"},
    {t:"保存多久", d:"到店体验结束后 30 天内删除；法律法规要求保留的除外。"},
    {t:"不会卖给谁", d:"你的联系方式不会出售、出租或共享给任何第三方。"},
    {t:"你的权利", d:"随时联系客服要求查看、更正或删除你的个人信息，我们 3 个工作日内处理。"}
  ]},
  terms: { title: "服务条款", points: [
    {t:"标价口径", d:"全站标价为人民币含税价；琴包、背带、调音器等配件另计，下单页会列明。"},
    {t:"定制与退换", d:"非定制琴支持 7 天无理由退换（护板膜未撕、琴体无磕碰）；定制琴下单后不退不换。"},
    {t:"保修", d:"琴体结构终身保修；电路、品丝等耗材保修一年；人为摔碰、改装不在保修范围内。"},
    {t:"体验课", d:"免费体验课每人限约一次；爽约两次将暂停预约资格 90 天，敬请理解。"},
    {t:"争议解决", d:"适用中华人民共和国法律；协商不成的，由品牌所在地人民法院管辖。"}
  ]},
  cookies: { title: "Cookie 政策", points: [
    {t:"我们用什么", d:"仅使用记住偏好（如上次浏览的系列）的必要型 Cookie，让页面更好用。"},
    {t:"不做什么", d:"不投放第三方广告追踪器，不做跨站用户画像。"},
    {t:"有效期", d:"偏好 Cookie 最长保存 12 个月，到期自动清除。"},
    {t:"怎么关", d:"可在浏览器设置中随时禁用；禁用后仅偏好记忆功能受影响，页面照常浏览。"},
    {t:"联系", d:"关于 Cookie 的任何疑问，发邮件到客服邮箱，我们 3 个工作日内回复。"}
  ]}
};

/* 产品数据 */
var SERIES = {
  electric: [
    {name:"晨曦", en:"DAWN", price:"¥4,980", tag:"新手首选", spec:"椴木琴体 · 枫木琴颈 · 双单双拾音器，低弦距出厂即弹。"},
    {name:"夜枭", en:"NIGHT OWL", price:"¥6,880", tag:"", spec:"桃花心木琴体 · 双线圈拾音器 · 推弦不打品，失真下颗粒分明。"},
    {name:"拾光", en:"VINTAGE 62", price:"¥5,680", tag:"复刻", spec:"桤木琴体 · 三单线圈 · 复古漆面，clean 音色通透温暖。"}
  ],
  acoustic: [
    {name:"林间", en:"FOREST", price:"¥3,280", tag:"热卖", spec:"云杉面单 · 桃花心木背侧 · D 桶型，共鸣开阔。"},
    {name:"溪谷", en:"VALLEY", price:"¥4,580", tag:"", spec:"全桃花心木 · GA 指弹桶型 · 中频厚实，泛音漂亮。"},
    {name:"远山", en:"TRAVELER", price:"¥2,980", tag:"", spec:"36 寸旅行尺寸 · 云杉面板 · 轻便好带，出差也能练。"}
  ],
  bass: [
    {name:"潮汐", en:"TIDE", price:"¥3,980", tag:"", spec:"四弦被动式 · 桤木琴体 · 琴颈薄手感轻，slap 利落。"},
    {name:"深流", en:"DEEP CURRENT", price:"¥5,280", tag:"", spec:"五弦主动式 · 白蜡木琴体 · 低频下潜深，乐队利器。"},
    {name:"礁石", en:"FRETLESS", price:"¥6,180", tag:"进阶", spec:"无品爵士贝斯 · 乌木指板 · 滑音顺滑，爵士味十足。"}
  ]
};

var ARTISTS = [
  {n:"陈默", r:"独立音乐人 · 电吉他", q:"巡演带了三把琴，只有晨曦从没让我在台上停下来调音。"},
  {n:"苏晚晴", r:"指弹吉他手", q:"林间的泛音比我上一把贵两倍的琴还干净，我服气。"},
  {n:"老周", r:"蓝调吉他手 · 20 年琴龄", q:"弦距调得比我自己调的还舒服，第一次见到出厂就这样的琴。"},
  {n:"林小北", r:"贝斯手", q:"潮汐的琴颈薄，slap 一晚上手不酸，排练室那把已经成公琴了。"},
  {n:"阿棠", r:"民谣歌手", q:"写歌都用远山，轻，抱着不累，录小样直接进声卡。"},
  {n:"沈听", r:"音乐制作人", q:"给新人推荐琴只推聆木，退货率为零，我的口碑保住了。"}
];

var PRM = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ================= SITE 渲染 ================= */
document.querySelectorAll('[data-site]').forEach(function(el){
  var v = SITE[el.getAttribute('data-site')];
  if(v != null) el.textContent = v;
});
document.querySelectorAll('[data-site-href]').forEach(function(el){
  var v = SITE[el.getAttribute('data-site-href')];
  if(v != null) el.setAttribute('href', v);
});

/* ================= 加载态 + hero 入场 ================= */
var loaderDone = false;
function hideLoader(){
  if(loaderDone) return; loaderDone = true;
  document.getElementById('loader').classList.add('done');
  var items = document.querySelectorAll('.hero-in');
  items.forEach(function(el, i){
    setTimeout(function(){ el.classList.add('in'); }, 90 * i);
  });
}
window.addEventListener('load', function(){ setTimeout(hideLoader, CFG.loaderMin); });
setTimeout(hideLoader, 5000); // 兜底：完成态必达

/* ================= 导航 ================= */
var nav = document.getElementById('nav');
function onScroll(){ nav.classList.toggle('scrolled', window.scrollY > CFG.navOffset); }
window.addEventListener('scroll', onScroll, {passive:true}); onScroll();

/* ================= 移动端抽屉 ================= */
var drawer = document.getElementById('drawer'),
    dMask = document.getElementById('drawerMask'),
    burger = document.getElementById('burger'),
    dClose = document.getElementById('drawerClose');
function openDrawer(){
  drawer.classList.add('open'); dMask.classList.add('show');
  document.body.classList.add('locked'); burger.setAttribute('aria-expanded','true');
}
function closeDrawer(){
  drawer.classList.remove('open'); dMask.classList.remove('show');
  document.body.classList.remove('locked'); burger.setAttribute('aria-expanded','false');
}
burger.addEventListener('click', openDrawer);
dClose.addEventListener('click', closeDrawer);
dMask.addEventListener('click', closeDrawer);
drawer.querySelectorAll('a').forEach(function(a){ a.addEventListener('click', closeDrawer); });

/* ================= 滚动 stagger 入场 ================= */
var io = ('IntersectionObserver' in window) ? new IntersectionObserver(function(es){
  es.forEach(function(e){
    if(e.isIntersecting){
      var el = e.target;
      el.classList.add('in'); io.unobserve(el);
      setTimeout(function(){ el.style.transitionDelay = ''; }, 1300); // 还原 hover 手感
    }
  });
}, {threshold: CFG.revealThreshold}) : null;

function watchReveal(scope){
  (scope || document).querySelectorAll('.reveal:not(.in)').forEach(function(el, i){
    var d = el.getAttribute('data-i');
    el.style.transitionDelay = ((d != null ? +d : (i % 3)) * 0.12) + 's';
    if(io) io.observe(el); else el.classList.add('in');
  });
}
watchReveal(document);
setTimeout(function(){ // 兜底：隐藏元素完成态必达
  document.querySelectorAll('.reveal:not(.in)').forEach(function(el){ el.classList.add('in'); });
}, 9000);

/* ================= 核心动效：吉他弦波形 ================= */
var svg = document.getElementById('heroGuitar');
var paths = Array.prototype.slice.call(svg.querySelectorAll('#strings path'));
var baseX = paths.map(function(p){ return parseFloat(p.getAttribute('d').match(/M([\d.]+),/)[1]); });
var st = paths.map(function(_, i){ return {t0: -1e9, amp: 0, freq: 2.4 + i * 0.35, phase: i * 1.1}; });

function pluck(i, amp){
  st[i].t0 = performance.now();
  st[i].amp = amp;
}
function pluckAll(amp, stagger){
  paths.forEach(function(_, i){ setTimeout(function(){ pluck(i, amp * (0.85 + Math.random() * 0.3)); }, i * (stagger || 70)); });
}

if(!PRM){
  // 入场 600ms 后轻轻拨一下
  setTimeout(function(){ pluckAll(5, 90); }, 1400);
  var rafT = 0;
  function tick(now){
    var t = now / 1000;
    for(var i = 0; i < paths.length; i++){
      var x = baseX[i], s = st[i];
      var d = 0.7 * Math.sin(t * 1.3 + s.phase); // 环境微振
      var dt = (now - s.t0) / 1000;
      if(dt < 6 && s.amp > 0){
        d += s.amp * Math.sin(2 * Math.PI * s.freq * dt + s.phase) * Math.exp(-dt / 2.2);
      }
      paths[i].setAttribute('d', 'M' + x + ',650 Q' + (x + d).toFixed(2) + ',357 ' + x + ',64');
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  // 交互：悬停拨最近的弦，点击拨全部
  var lastMove = 0;
  svg.addEventListener('pointermove', function(e){
    var now = performance.now();
    if(now - lastMove < 180) return; lastMove = now;
    var r = svg.getBoundingClientRect();
    var vx = (e.clientX - r.left) / r.width * 400; // viewBox x
    var best = 0, bd = 1e9;
    baseX.forEach(function(x, i){ var dd = Math.abs(x - vx); if(dd < bd){ bd = dd; best = i; } });
    if(bd < 26) pluck(best, 4);
  });
  svg.addEventListener('pointerdown', function(){ pluckAll(9, 60); });
}

/* ================= 系列 TAB ================= */
function guitarMini(kind){
  var s = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"';
  if(kind === 'acoustic'){
    return '<svg viewBox="0 0 200 270" ' + s + '>' +
      '<path d="M90,30 L110,30 L108,12 L92,12 Z"/>' +
      '<path d="M89,30 L111,30" stroke-width="3.5"/>' +
      '<path d="M92,30 L92,110 M108,30 L108,110"/>' +
      '<path d="M100,110 C70,110 52,138 52,172 C52,210 72,238 100,238 C128,238 148,210 148,172 C148,138 130,110 100,110 Z"/>' +
      '<circle cx="100" cy="180" r="16"/><circle cx="100" cy="180" r="21" stroke-width="1"/>' +
      '<rect x="88" y="214" width="24" height="6" rx="3"/>' +
      '<path d="M94,214 L94,30 M100,214 L100,30 M106,214 L106,30" stroke-width="1.2"/></svg>';
  }
  if(kind === 'bass'){
    return '<svg viewBox="0 0 200 300" ' + s + '>' +
      '<path d="M88,22 L112,22 L108,6 L92,6 Z"/>' +
      '<path d="M87,22 L113,22" stroke-width="3.5"/>' +
      '<path d="M90,22 L90,150 M110,22 L110,150"/>' +
      '<path d="M90,150 C76,150 68,162 68,178 C68,192 76,198 73,212 C71,224 60,227 57,240 C53,256 66,268 86,271 C96,273 104,273 114,271 C134,268 147,256 143,240 C140,227 129,224 127,212 C124,198 132,192 132,178 C132,162 124,150 110,150 Z"/>' +
      '<rect x="90" y="216" width="20" height="7" rx="3"/>' +
      '<path d="M93,240 L93,22 M98.5,240 L98.5,22 M104,240 L104,22 M109.5,240 L109.5,22" stroke-width="1.2"/></svg>';
  }
  return '<svg viewBox="0 0 200 270" ' + s + '>' +
    '<path d="M86,26 L114,26 L110,8 L90,8 Z"/>' +
    '<path d="M85,26 L115,26" stroke-width="3.5"/>' +
    '<path d="M88,26 L88,120 M112,26 L112,120"/>' +
    '<path d="M88,120 C74,120 66,132 66,148 C66,162 74,168 71,182 C69,194 58,197 55,210 C51,226 64,240 84,243 C94,245 106,245 116,243 C136,240 149,226 145,210 C142,197 131,194 129,182 C126,168 134,162 134,148 C134,132 126,120 112,120 Z"/>' +
    '<rect x="90" y="168" width="20" height="8" rx="4"/><rect x="90" y="182" width="20" height="8" rx="4"/>' +
    '<rect x="90" y="198" width="20" height="6" rx="3"/>' +
    '<path d="M94,210 L94,26 M100,210 L100,26 M106,210 L106,26" stroke-width="1.2"/></svg>';
}

var cardsWrap = document.getElementById('seriesCards');
function renderCards(key){
  cardsWrap.innerHTML = SERIES[key].map(function(p, i){
    return '<article class="card reveal" data-i="' + i + '">' +
      (p.tag ? '<span class="tag">' + p.tag + '</span>' : '') +
      '<div class="art">' + guitarMini(key) + '</div>' +
      '<h3>' + p.name + '</h3><p class="en">' + p.en + '</p>' +
      '<p class="spec">' + p.spec + '</p>' +
      '<p class="price"><b>' + p.price + '</b> 起</p></article>';
  }).join('');
  watchReveal(cardsWrap);
}
document.querySelectorAll('.tab').forEach(function(btn){
  btn.addEventListener('click', function(){
    if(btn.classList.contains('on')) return;
    document.querySelectorAll('.tab').forEach(function(b){
      b.classList.remove('on'); b.setAttribute('aria-selected','false');
    });
    btn.classList.add('on'); btn.setAttribute('aria-selected','true');
    cardsWrap.classList.add('switching');
    setTimeout(function(){
      renderCards(btn.getAttribute('data-tab'));
      cardsWrap.classList.remove('switching');
    }, 240);
  });
});
renderCards('electric');

/* ================= 艺术家墙 ================= */
document.getElementById('artistWall').innerHTML = ARTISTS.map(function(a, i){
  return '<article class="artist reveal" data-i="' + (i % 3) + '">' +
    '<div class="artist-top"><span class="avatar">' + a.n.charAt(0) + '</span>' +
    '<div><b>' + a.n + '</b><span>' + a.r + '</span></div></div>' +
    '<p>' + a.q + '</p></article>';
}).join('');
watchReveal(document.getElementById('artists'));

/* ================= 法务三件套弹窗 ================= */
var lModal = document.getElementById('legalModal'),
    lMask = document.getElementById('legalMask'),
    lTitle = document.getElementById('legalTitle'),
    lBody = document.getElementById('legalBody'),
    lClose = document.getElementById('legalClose'),
    lastFocus = null;

function openLegal(key){
  var L = LEGAL[key]; if(!L) return;
  lTitle.textContent = L.title;
  lBody.innerHTML = '<ol>' + L.points.map(function(p){
    return '<li><b>' + p.t + '</b>　' + p.d + '</li>';
  }).join('') + '</ol>';
  lastFocus = document.activeElement;
  lModal.hidden = false;
  requestAnimationFrame(function(){
    lModal.classList.add('show'); lMask.classList.add('show');
  });
  document.body.classList.add('locked');
  lClose.focus();
}
function closeLegal(){
  lModal.classList.remove('show'); lMask.classList.remove('show');
  document.body.classList.remove('locked');
  setTimeout(function(){ lModal.hidden = true; }, 460);
  if(lastFocus && lastFocus.focus) lastFocus.focus();
}
document.querySelectorAll('[data-legal]').forEach(function(el){
  el.addEventListener('click', function(e){ e.preventDefault(); openLegal(el.getAttribute('data-legal')); });
});
lClose.addEventListener('click', closeLegal);
lMask.addEventListener('click', closeLegal);
document.addEventListener('keydown', function(e){
  if(e.key === 'Escape'){
    if(!lModal.hidden) closeLegal();
    closeDrawer();
  }
});

/* ================= 体验课表单 ================= */
var form = document.getElementById('trialForm'),
    formErr = document.getElementById('formErr'),
    formOk = document.getElementById('formOk');
form.addEventListener('submit', function(e){
  e.preventDefault();
  formErr.textContent = '';
  var name = form.name.value.trim(), phone = form.phone.value.trim();
  if(name.length < 1){ formErr.textContent = '请留下你的称呼，方便门店联系你。'; form.name.focus(); return; }
  if(!/^1\d{10}$/.test(phone)){ formErr.textContent = '手机号好像少了几位，请检查 11 位数字。'; form.phone.focus(); return; }
  formOk.hidden = false;
  form.querySelector('button[type="submit"]').disabled = true;
  form.querySelector('button[type="submit"]').textContent = '已预约';
});

})();

/* 镜界 VIEWFINDER · camera-page 模板逻辑（classic 脚本，无模块依赖） */
(function(){
"use strict";
var $ = function(s,c){ return (c||document).querySelector(s); };
var $$ = function(s,c){ return Array.prototype.slice.call((c||document).querySelectorAll(s)); };
var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ============ CONFIG：换品牌/商品只改这里 ============ */
var CONFIG = {
  accent: '#FF5C00',
  heroIntroMs: 2000,
  cardFakeLoadMs: 900,
  toastMs: 2200,
  SITE: {
    brand: '镜界', en: 'VIEWFINDER',
    organizer: '镜界影像器材有限公司',
    phone: '400-821-7788',
    address: '上海市静安区胶州路 941 号 1 楼',
    email: 'hello@viewfinder-cam.cn',
    icp: '沪ICP备2026000000号-1（示例）'
  }
};

var CATS = [
  { key:'body', name:'机身', desc:'全画幅微单 / 备机，一机走天下', count:'32 款在售',
    icon:'<rect x="14" y="26" width="72" height="46" rx="8"/><circle cx="50" cy="49" r="15"/><circle cx="50" cy="49" r="6"/><path d="M38 26l6-10h12l6 10"/>' },
  { key:'lens', name:'镜头', desc:'定焦的毒，变焦的稳，全都要', count:'58 款在售',
    icon:'<rect x="38" y="12" width="24" height="76" rx="6"/><circle cx="50" cy="88" r="10"/><circle cx="50" cy="88" r="4"/><path d="M38 30h24M38 44h24M38 58h24"/>' },
  { key:'light', name:'灯光', desc:'闪光灯 / 常亮灯，夜也能拍', count:'21 款在售',
    icon:'<rect x="30" y="14" width="40" height="30" rx="4"/><rect x="42" y="44" width="16" height="26" rx="3"/><path d="M34 60h32M50 70v14M38 84h24"/>' },
  { key:'acc', name:'配件', desc:'脚架 / 包 / 存储卡，配齐再出发', count:'76 款在售',
    icon:'<rect x="26" y="30" width="48" height="44" rx="8"/><path d="M26 46h48M38 30v-6a12 12 0 0 1 24 0v6"/><circle cx="50" cy="60" r="5"/>' }
];

var PRODUCTS = [
  { id:'vf1', cat:'body', name:'VF-1 全画幅微单机身', desc:'3300 万像素 · 机身五轴防抖 · 双卡槽', price:18999, old:null, rating:'4.9', sold:'2.3k', tag:'热卖', art:'body' },
  { id:'lens2470', cat:'lens', name:'24-70mm f/2.8 标准变焦', desc:'挂机头首选，画质从头锐到尾', price:9499, old:null, rating:'4.8', sold:'1.8k', tag:null, art:'lens' },
  { id:'lens50', cat:'lens', name:'50mm f/1.4 定焦', desc:'奶油焦外，人像糖水片制造机', price:3299, old:null, rating:'4.9', sold:'3.1k', tag:'新品', art:'prime' },
  { id:'lens70200', cat:'lens', name:'70-200mm f/2.8 长焦变焦', desc:'演唱会 / 球赛 / 打鸟，一镜通吃', price:12999, old:14999, rating:'4.7', sold:'960', tag:'直降', art:'tele' },
  { id:'flash600', cat:'light', name:'VF Speedlite 600 闪光灯', desc:'GN60 · 高速同步 · 回电 0.9 秒', price:1899, old:null, rating:'4.6', sold:'1.2k', tag:null, art:'flash' },
  { id:'tripod', cat:'acc', name:'碳纤维三脚架 T-264', desc:'1.2kg 收纳 42cm，扛得住长焦', price:1299, old:null, rating:'4.8', sold:'2.0k', tag:null, art:'tripod' },
  { id:'bag', cat:'acc', name:'双肩摄影包 25L', desc:'一机三镜 + 15 寸电脑，防泼水', price:899, old:null, rating:'4.7', sold:'1.5k', tag:null, art:'bag' },
  { id:'card', cat:'acc', name:'128GB CFexpress 存储卡', desc:'1700MB/s 持续写入，连拍不卡', price:1099, old:null, rating:'4.9', sold:'4.4k', tag:'热卖', art:'card' }
];

var REVIEWS = [
  { name:'陈默', role:'纪实摄影师 · 上海', gear:'VF-1 机身', stars:5,
    text:'凌晨三点的弄堂，ISO 12800 手持 1/60，画面干净得不像话。镜界的二手置换也实在，我那台老单反抵了四千多，客服当面验机，十分钟搞定。' },
  { name:'林晓', role:'人像摄影师 · 杭州', gear:'50mm f/1.4', stars:5,
    text:'这支 50 的焦外像奶油化开，客户原片直出就愿意加钱。下单前问客服逆光紫边严不严重，对方直接甩了三张实拍原图——懂行，买得放心。' },
  { name:'老周', role:'风光摄影师 · 成都', gear:'70-200mm f/2.8', stars:4,
    text:'零下十五度在赛里木湖拍日出，对焦一次没掉过链子。发票保修一次齐全，行货就图个踏实。唯一缺点：太沉，爬山前先练胳膊。' }
];

var LEGAL = {
  privacy: { title:'隐私政策', items:[
    '我们收集的信息：下单需要的姓名、电话、收货地址，以及你主动提供的咨询记录。仅用于履约和售后。',
    '支付走持牌第三方通道，我们不存储、不经手你的银行卡号和支付密码。',
    '你的浏览偏好只留在你自己的浏览器里（localStorage），不上传、不跨站追踪。',
    '以旧换新寄来的设备，检测前会提醒你备份并清除个人数据；我们不会读取存储卡里的照片。',
    '想删数据？打客服电话或发邮件，一个工作日内处理完，并给你回执。' ]},
  terms: { title:'服务条款', items:[
    '所售均为中国大陆行货，享受全国联保；二手区商品会明确标注成色与快门数。',
    '7 天无理由退货（定制刻字、存储卡拆封除外）；质量问题 15 天内换新，运费我们出。',
    '以旧换新估价为参考区间，最终价格以工程师实机检测为准；检测过程全程录像。',
    '价格以你下单那一刻为准；大促期间的价格保护期为 7 天，买贵退差。',
    '因不可抗力（天气、停电、快递停运）导致的延迟，我们会第一时间告知并给补偿方案。' ]},
  cookies: { title:'Cookie 政策', items:[
    '本站只用两种 Cookie：记住购物袋的“必需型”，和统计访问量的“分析型”。',
    '没有广告追踪器，不把你的浏览行为卖给任何第三方。',
    '你可以在浏览器设置里一键禁用，购物袋功能会改用临时会话，不影响下单。',
    '继续浏览即表示你接受以上说明；反悔随时清 Cookie，我们不记仇。' ]}
};

/* ============ 工具 ============ */
var toastTimer = null;
function toast(msg){
  var t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function(){ t.classList.remove('show'); }, CONFIG.toastMs);
}
function fmt(n){ return '¥' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
function stars(n){
  var s = ''; for (var i=0;i<5;i++) s += i < n ? '★' : '☆';
  return s;
}

/* ============ 光圈主视觉（程序化 SVG，整页唯一核心动效） ============ */
var iris = { r: 20, rot: 0 };
var OPEN_R = 104, blades = [], edgeLines = [], glowEl = null, stageEl = null, shotCount = 0, shutterBusy = false;
var SVGNS = 'http://www.w3.org/2000/svg';

function el(name, attrs, parent){
  var e = document.createElementNS(SVGNS, name);
  for (var k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}

function buildAperture(){
  var mount = $('#apertureMount');
  var svg = el('svg', { viewBox:'0 0 400 400' }, mount);
  var defs = el('defs', {}, svg);
  var clip = el('clipPath', { id:'irisClip' }, defs);
  el('circle', { cx:200, cy:200, r:170 }, clip);
  var bg = el('radialGradient', { id:'lensGlass', cx:'38%', cy:'32%', r:'80%' }, defs);
  el('stop', { offset:'0%', 'stop-color':'#2E3A4A' }, bg);
  el('stop', { offset:'55%', 'stop-color':'#12161D' }, bg);
  el('stop', { offset:'100%', 'stop-color':'#05070A' }, bg);
  var gl = el('radialGradient', { id:'irisGlow', cx:'50%', cy:'50%', r:'50%' }, defs);
  el('stop', { offset:'0%', 'stop-color':'#FF5C00', 'stop-opacity':'.85' }, gl);
  el('stop', { offset:'100%', 'stop-color':'#FF5C00', 'stop-opacity':'0' }, gl);
  var bm = el('linearGradient', { id:'bladeGrad', x1:'0', y1:'0', x2:'1', y2:'1' }, defs);
  el('stop', { offset:'0%', 'stop-color':'#3A3A3E' }, bm);
  el('stop', { offset:'100%', 'stop-color':'#17171A' }, bm);

  // 镜筒外圈 + 刻度
  el('circle', { cx:200, cy:200, r:196, fill:'#151517', stroke:'#2B2B2E', 'stroke-width':2 }, svg);
  var ticks = el('g', { stroke:'#4A4A4E', 'stroke-width':2 }, svg);
  for (var i=0;i<60;i++){
    var a = i*6*Math.PI/180, long = i%5===0;
    var r1 = long?178:184, r2 = 190;
    el('line', { x1:200+r1*Math.cos(a), y1:200+r1*Math.sin(a), x2:200+r2*Math.cos(a), y2:200+r2*Math.sin(a),
      stroke: long ? '#FF5C00' : '#4A4A4E', 'stroke-width': long?2.6:1.6 }, ticks);
  }
  var tp = el('path', { id:'barrelText', d:'M 200,200 m -188,0 a 188,188 0 1,1 376,0 a 188,188 0 1,1 -376,0', fill:'none' }, defs);
  var txt = el('text', { 'font-size':11.5, fill:'#8A8A84', 'letter-spacing':3.5, 'font-family':'inherit' }, svg);
  var tpath = el('textPath', { href:'#barrelText', startOffset:'2%' }, txt);
  tpath.textContent = 'VIEWFINDER · 24-70MM F/2.8 · Ø82 · MADE FOR LIGHT ·';
  el('circle', { cx:200, cy:200, r:170, fill:'none', stroke:'#333336', 'stroke-width':3 }, svg);

  // 镜片底 + 光晕
  el('circle', { cx:200, cy:200, r:168, fill:'url(#lensGlass)' }, svg);
  glowEl = el('circle', { cx:200, cy:200, r:150, fill:'url(#irisGlow)', opacity:0 }, svg);

  // 8 片光圈叶片：切线多边形 + clip，内缘高光线
  var g = el('g', { 'clip-path':'url(#irisClip)' }, svg);
  for (var k=0;k<8;k++){
    var p = el('polygon', { fill:'url(#bladeGrad)', stroke:'#0A0A0B', 'stroke-width':1.5 }, g);
    var ln = el('line', { stroke:'rgba(255,255,255,.22)', 'stroke-width':2 }, g);
    blades.push(p); edgeLines.push(ln);
  }
  // 镜片反光：斜向高光 + 橙色镀膜弧
  el('ellipse', { cx:148, cy:132, rx:64, ry:30, fill:'#fff', opacity:.14, transform:'rotate(-28 148 132)' }, svg);
  el('ellipse', { cx:148, cy:132, rx:30, ry:13, fill:'#fff', opacity:.18, transform:'rotate(-28 148 132)' }, svg);
  el('path', { d:'M 268,300 A 118,118 0 0,0 330,232', fill:'none', stroke:'#FF5C00', 'stroke-width':5, opacity:.45, 'stroke-linecap':'round' }, svg);

  drawIris();
  stageEl = $('#apertureStage');
  $('#heroLoad').style.display = 'none';

  // 入场：光圈从闭合缓缓张开（物理感 easing）
  if (reduceMotion){ iris.r = OPEN_R; iris.rot = 14; drawIris(); }
  else {
    gsap.to(iris, { r: OPEN_R, rot: 14, duration: CONFIG.heroIntroMs/1000,
      ease:'power3.out', delay:.35, onUpdate: drawIris });
  }
}

function drawIris(){
  var L = 300, M = 300, cx = 200, cy = 200;
  for (var k=0;k<8;k++){
    var b = (k*45 + iris.rot) * Math.PI/180;
    var nx = Math.cos(b), ny = Math.sin(b);
    var dx = -Math.sin(b), dy = Math.cos(b);
    var tx = cx + iris.r*nx, ty = cy + iris.r*ny;
    var pts = [
      tx-L*dx, ty-L*dy,  tx+L*dx, ty+L*dy,
      tx+L*dx+M*nx, ty+L*dy+M*ny,  tx-L*dx+M*nx, ty-L*dy+M*ny
    ];
    blades[k].setAttribute('points', pts.join(','));
    edgeLines[k].setAttribute('x1', tx-L*dx); edgeLines[k].setAttribute('y1', ty-L*dy);
    edgeLines[k].setAttribute('x2', tx+L*dx); edgeLines[k].setAttribute('y2', ty+L*dy);
  }
  if (glowEl) glowEl.setAttribute('opacity', ((iris.r-20)/(OPEN_R-20)*0.55).toFixed(3));
}

function shutter(){
  if (shutterBusy || !window.gsap) return;
  shutterBusy = true;
  shotCount++;
  var tl = gsap.timeline({ onComplete:function(){ shutterBusy = false; } });
  tl.to(iris, { r: 9, duration:.13, ease:'power2.in', onUpdate:drawIris })
    .to('#flash', { opacity:.9, duration:.05 }, '-=.02')
    .to('#flash', { opacity:0, duration:.5, ease:'power2.out' })
    .to(iris, { r: OPEN_R, duration:.85, ease:'power3.out', onUpdate:drawIris }, '-=.45')
    .fromTo(stageEl, { scale:1 }, { scale:.982, duration:.11, yoyo:true, repeat:1, ease:'power2.inOut' }, 0);
  var hint = $('.aperture-hint');
  if (hint) hint.textContent = '快门 · 已拍 ' + shotCount + ' 张，再来一张？';
}

/* ============ 导航 / 抽屉 ============ */
function initNav(){
  var nav = $('#nav');
  var onScroll = function(){ nav.classList.toggle('scrolled', window.scrollY > 24); };
  window.addEventListener('scroll', onScroll, { passive:true }); onScroll();

  var open = function(o){
    document.body.classList.toggle('drawer-open', o);
    $('#burger').setAttribute('aria-expanded', o ? 'true' : 'false');
  };
  $('#burger').addEventListener('click', function(){ open(true); });
  $('#drawerClose').addEventListener('click', function(){ open(false); });
  $('#drawerMask').addEventListener('click', function(){ open(false); });
  $$('#drawer a').forEach(function(a){
    a.addEventListener('click', function(){
      open(false);
      var f = a.getAttribute('data-filter-link');
      if (f){ setFilter(f); }
    });
  });

  // 顶部菜单的品类链接：顺手把下方筛选切过去
  $$('.nav .menu a[data-filter-link]').forEach(function(a){
    a.addEventListener('click', function(){ setFilter(a.getAttribute('data-filter-link')); });
  });
}

/* ============ 产品图：程序化 SVG ============ */
function artSVG(kind){
  var s = 'fill="none" stroke="#EDEDE6" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"';
  var o = 'stroke="#FF5C00"';
  var inner = '';
  if (kind==='body'){
    inner = '<rect x="18" y="34" width="64" height="38" rx="7" '+s+'/><path d="M36 34l5-9h18l5 9" '+s+'/><circle cx="50" cy="53" r="13" '+s+'/><circle cx="50" cy="53" r="5" '+o+' fill="none" stroke-width="3"/><rect x="70" y="40" width="8" height="6" rx="1.5" '+o+' fill="none" stroke-width="2.5"/>';
  } else if (kind==='lens'){
    inner = '<rect x="36" y="16" width="28" height="60" rx="5" '+s+'/><path d="M36 30h28M36 44h28M36 58h28" '+s+' stroke-width="2.5"/><circle cx="50" cy="82" r="9" '+s+'/><circle cx="50" cy="82" r="3.5" '+o+' fill="none" stroke-width="2.5"/>';
  } else if (kind==='prime'){
    inner = '<rect x="30" y="30" width="40" height="44" rx="5" '+s+'/><path d="M30 44h40M30 58h40" '+s+' stroke-width="2.5"/><circle cx="50" cy="82" r="8" '+s+'/><circle cx="50" cy="82" r="3" '+o+' fill="none" stroke-width="2.5"/>';
  } else if (kind==='tele'){
    inner = '<rect x="40" y="10" width="22" height="72" rx="5" '+s+'/><path d="M40 26h22M40 42h22M40 58h22" '+s+' stroke-width="2.5"/><circle cx="51" cy="86" r="7" '+s+'/><circle cx="51" cy="86" r="2.5" '+o+' fill="none" stroke-width="2.5"/><rect x="34" y="20" width="6" height="18" rx="3" '+o+' fill="none" stroke-width="2.5"/>';
  } else if (kind==='flash'){
    inner = '<rect x="28" y="18" width="44" height="26" rx="4" '+s+' transform="rotate(-8 50 31)"/><rect x="42" y="48" width="16" height="28" rx="3" '+s+'/><circle cx="50" cy="31" r="6" '+o+' fill="none" stroke-width="2.5" transform="rotate(-8 50 31)"/>';
  } else if (kind==='tripod'){
    inner = '<path d="M50 18v22M50 40L30 84M50 40l20 44M50 40v44" '+s+'/><rect x="38" y="12" width="24" height="10" rx="3" '+s+'/><circle cx="50" cy="40" r="4" '+o+' fill="none" stroke-width="2.5"/>';
  } else if (kind==='bag'){
    inner = '<rect x="24" y="32" width="52" height="44" rx="9" '+s+'/><path d="M24 48h52" '+s+'/><path d="M38 32v-5a12 12 0 0 1 24 0v5" '+s+'/><rect x="44" y="42" width="12" height="10" rx="2" '+o+' fill="none" stroke-width="2.5"/>';
  } else if (kind==='card'){
    inner = '<rect x="26" y="34" width="48" height="34" rx="5" '+s+'/><path d="M26 44l8-10h40" '+s+' stroke-width="2.5"/><path d="M36 56h28M36 62h18" '+o+' stroke-width="2.5"/>';
  }
  return '<svg viewBox="0 0 100 100" aria-hidden="true">'+inner+'</svg>';
}

/* ============ 产品网格 ============ */
var cart = {};
function renderProducts(){
  var grid = $('#grid');
  grid.innerHTML = PRODUCTS.map(function(p){
    return '<article class="card loading" data-cat="'+p.cat+'" data-id="'+p.id+'">' +
      '<div class="pimg">'+ artSVG(p.art) +
      (p.tag ? '<span class="ptag'+(p.tag==='二手'?' used':'')+'">'+p.tag+'</span>' : '') +
      '<button class="quickadd" data-add="'+p.id+'">加入购物袋</button></div>' +
      '<div class="pbody"><h3 class="pname">'+p.name+'</h3>' +
      '<p class="pdesc">'+p.desc+'</p>' +
      '<div class="prow"><span class="stars">'+stars(Math.round(parseFloat(p.rating)))+'<span>'+p.rating+' · '+p.sold+'人已购</span></span></div>' +
      '<div class="prow"><span class="price">'+fmt(p.price)+(p.old?'<s>'+fmt(p.old)+'</s>':'')+'</span></div>' +
      '</div></article>';
  }).join('');
  // 骨架加载态：逐个"装好货"
  $$('#grid .card').forEach(function(c, i){
    setTimeout(function(){ c.classList.remove('loading'); }, 350 + i*130);
  });
  $$('#grid [data-add]').forEach(function(b){
    b.addEventListener('click', function(ev){
      ev.stopPropagation();
      addToCart(b.getAttribute('data-add'));
    });
  });
}
var curFilter = 'all';
function setFilter(f){
  curFilter = f;
  $$('#tabs .tab').forEach(function(t){ t.classList.toggle('on', t.getAttribute('data-f')===f); });
  $$('#grid .card').forEach(function(c){
    var show = f==='all' || c.getAttribute('data-cat')===f;
    c.classList.toggle('hide', !show);
  });
  var target = $('#products');
  if (target && !reduceMotion) target.scrollIntoView({ behavior:'smooth', block:'start' });
  else if (target) target.scrollIntoView();
}
function initTabs(){
  $$('#tabs .tab').forEach(function(t){
    t.addEventListener('click', function(){ setFilter(t.getAttribute('data-f')); });
  });
}

/* ============ 购物袋 ============ */
function cartQty(){ var n=0; for (var k in cart) n+=cart[k]; return n; }
function addToCart(id){
  cart[id] = (cart[id]||0)+1;
  var p = null;
  PRODUCTS.forEach(function(x){ if (x.id===id) p=x; });
  $('#cartCount').textContent = cartQty();
  if (window.gsap && !reduceMotion)
    gsap.fromTo('#cartBtn', { scale:1 }, { scale:1.12, duration:.16, yoyo:true, repeat:1, ease:'back.out(3)' });
  toast('已加入购物袋：'+(p?p.name:id));
  renderCart();
}
function renderCart(){
  var box = $('#cartItems'), total = 0, n = 0;
  var html = '';
  for (var id in cart){
    var p = null; PRODUCTS.forEach(function(x){ if (x.id===id) p=x; });
    if (!p) continue;
    var q = cart[id]; n += q; total += p.price*q;
    html += '<div class="citem"><div><b>'+p.name+'</b><small>'+fmt(p.price)+' × '+q+'</small></div>' +
      '<div class="cqty"><button data-dec="'+id+'" aria-label="减少">−</button><button data-inc="'+id+'" aria-label="增加">＋</button></div></div>';
  }
  box.innerHTML = html || '<p class="cempty">购物袋是空的。<br>好照片从第一件器材开始。</p>';
  $('#cartHeadCount').textContent = '('+n+')';
  $('#cartTotal').textContent = fmt(total);
  $$('#cartItems [data-inc]').forEach(function(b){ b.addEventListener('click', function(){ cart[b.getAttribute('data-inc')]++; syncCart(); }); });
  $$('#cartItems [data-dec]').forEach(function(b){
    b.addEventListener('click', function(){
      var id = b.getAttribute('data-dec');
      cart[id]--; if (cart[id]<=0) delete cart[id]; syncCart();
    });
  });
}
function syncCart(){ $('#cartCount').textContent = cartQty(); renderCart(); }
function initCart(){
  var show = function(o){
    $('#cartMask').hidden = !o; $('#cartDrawer').hidden = !o;
    requestAnimationFrame(function(){
      $('#cartMask').classList.toggle('show', o);
      $('#cartDrawer').classList.toggle('open', o);
    });
    document.body.style.overflow = o ? 'hidden' : '';
  };
  $('#cartBtn').addEventListener('click', function(){ renderCart(); show(true); });
  $('#cartX').addEventListener('click', function(){ show(false); });
  $('#cartMask').addEventListener('click', function(){ show(false); });
  $('#checkoutBtn').addEventListener('click', function(){
    if (!cartQty()){ toast('购物袋是空的，先挑一件吧'); return; }
    toast('演示模板：结算请接入支付网关后使用');
  });
  window.__closeCart = function(){ show(false); };
}

/* ============ 品类磁贴 / 评测 ============ */
function renderCats(){
  $('#catGrid').innerHTML = CATS.map(function(c){
    var f = c.key==='light' ? 'light' : (c.key==='acc' ? 'acc' : c.key);
    return '<a class="cat rv" href="#products" data-catgo="'+f+'">' +
      '<span class="cat-ic"><svg width="34" height="34" viewBox="0 0 100 100" fill="none" stroke="#FF5C00" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">'+c.icon+'</svg></span>' +
      '<h3>'+c.name+'</h3><p>'+c.desc+' · '+c.count+'</p>' +
      '<span class="go">去看看 <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span></a>';
  }).join('');
  $$('#catGrid [data-catgo]').forEach(function(a){
    a.addEventListener('click', function(){ setFilter(a.getAttribute('data-catgo')); });
  });
}
function renderReviews(){
  $('#revGrid').innerHTML = REVIEWS.map(function(r){
    return '<article class="rev rv"><div class="stars">'+stars(r.stars)+'</div>' +
      '<p class="q">'+r.text+'</p>' +
      '<div class="rev-who"><span class="avatar">'+r.name.charAt(0)+'</span>' +
      '<div><b>'+r.name+'</b><small>'+r.role+'</small></div>' +
      '<span class="rev-gear">'+r.gear+'</span></div></article>';
  }).join('');
}

/* ============ 以旧换新估价器 ============ */
var trade = { type:'微单机身', brand:'索尼', cond:'95' };
var BASE = { '微单机身':9000, '单反机身':4500, '镜头':5200, '闪光灯':900 };
var BRAND_M = { '索尼':1.15, '佳能':1.10, '尼康':1.05, '富士':1.00, '其他':0.85 };
function segInit(id, key){
  $$('#'+id+' button').forEach(function(b){
    b.addEventListener('click', function(){
      $$('#'+id+' button').forEach(function(x){ x.classList.remove('on'); });
      b.classList.add('on');
      trade[key] = b.getAttribute('data-v');
      if (key==='type') $('#shutterRow').style.display = (trade.type==='镜头'||trade.type==='闪光灯') ? 'none' : '';
      updateEst();
    });
  });
}
function updateEst(){
  var v = BASE[trade.type] * BRAND_M[trade.brand] * (parseInt(trade.cond,10)/100);
  if (trade.type==='微单机身' || trade.type==='单反机身'){
    var s = parseInt($('#shutterRange').value,10);
    var f = Math.max(0.65, 1 - (s/200000)*0.35);
    v *= f;
    $('#shutterVal').textContent = s>=10000 ? (s/10000)+' 万' : s;
  }
  var lo = Math.round(v*0.92/10)*10, hi = Math.round(v*1.08/10)*10;
  var out = $('#estNum');
  if (window.gsap && !reduceMotion){
    var obj = { n: parseInt(out.getAttribute('data-v')||'0',10) };
    gsap.to(obj, { n: lo, duration:.5, ease:'power2.out', onUpdate:function(){
      out.textContent = fmt(obj.n)+' – '+fmt(hi);
    }, onComplete:function(){ out.setAttribute('data-v', lo); } });
  } else {
    out.textContent = fmt(lo)+' – '+fmt(hi);
    out.setAttribute('data-v', lo);
  }
}
function initTrade(){
  segInit('segType','type'); segInit('segBrand','brand'); segInit('segCond','cond');
  $('#shutterRange').addEventListener('input', updateEst);
  $('#estGo').addEventListener('click', function(){
    toast('已收到评估意向：'+trade.brand+trade.type+'，客服 10 分钟内联系你');
  });
  updateEst();
}

/* ============ 页脚 / 社交 / 法务 ============ */
function renderFooter(){
  var S = CONFIG.SITE;
  $('#fcontact').innerHTML =
    '<div class="frow2"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FF5C00" stroke-width="2.2"><path d="M5 4h4l2 5-2.5 1.5a12 12 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg><a href="tel:'+S.phone.replace(/-/g,'')+'">'+S.phone+'</a></div>' +
    '<div class="frow2"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FF5C00" stroke-width="2.2"><path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z"/><circle cx="12" cy="10" r="2.6"/></svg><span>'+S.address+'</span></div>' +
    '<div class="frow2"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FF5C00" stroke-width="2.2"><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3 7l9 6 9-6"/></svg><a href="mailto:'+S.email+'">'+S.email+'</a></div>';
  $('#copyLine').textContent = '© 2026 '+S.organizer+' · '+S.icp;
  var socials = [
    { n:'微信', svg:'<path d="M9 12a4.5 4.5 0 0 1 4.5-4.5h3A4.5 4.5 0 0 1 21 12a4.5 4.5 0 0 1-4.5 4.5h-1l-2.5 2.5v-2.5H9A4.5 4.5 0 0 1 9 12z" transform="translate(-2 -1)"/>' },
    { n:'微博', svg:'<circle cx="12" cy="12" r="3.2"/><path d="M12 2.8c2.6 2.6 6.8 2 9.2 4.4s1.8 6.6-.8 9.2-6.6 1.8-9.2-.8"/>' },
    { n:'小红书', svg:'<rect x="5" y="4" width="14" height="16" rx="3"/><path d="M9 12.5l2.2 2.2L15.5 10"/>' },
    { n:'抖音', svg:'<path d="M14 4v9.5a3.5 3.5 0 1 1-3.5-3.5"/><path d="M14 4c.5 2.5 2 4 4.5 4.2"/>' }
  ];
  $('#socialRow').innerHTML = socials.map(function(s){
    return '<a href="#top" aria-label="'+s.n+'" title="'+s.n+'"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">'+s.svg+'</svg></a>';
  }).join('');
  $$('#socialRow a').forEach(function(a){
    a.addEventListener('click', function(e){ e.preventDefault(); toast('演示模板：'+a.getAttribute('aria-label')+'主页占位'); });
  });
}
var lastFocus = null;
function openModal(key){
  var d = LEGAL[key]; if (!d) return;
  lastFocus = document.activeElement;
  $('#modalTitle').textContent = d.title;
  $('#modalBody').innerHTML = '<ol>'+d.items.map(function(t){ return '<li>'+t+'</li>'; }).join('')+'</ol>';
  $('#modalMask').hidden = false; $('#modal').hidden = false;
  requestAnimationFrame(function(){
    $('#modalMask').classList.add('show'); $('#modal').classList.add('show');
  });
  document.body.style.overflow = 'hidden';
  $('#modalX').focus();
}
function closeModal(){
  $('#modalMask').classList.remove('show'); $('#modal').classList.remove('show');
  document.body.style.overflow = '';
  setTimeout(function(){ $('#modalMask').hidden = true; $('#modal').hidden = true; }, 280);
  if (lastFocus && lastFocus.focus) lastFocus.focus();
}
function initModals(){
  $$('[data-modal]').forEach(function(b){
    b.addEventListener('click', function(){ openModal(b.getAttribute('data-modal')); });
  });
  $('#modalX').addEventListener('click', closeModal);
  $('#modalMask').addEventListener('click', closeModal);
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape'){
      if (!$('#modal').hidden) closeModal();
      else if (window.__closeCart) window.__closeCart();
      else document.body.classList.remove('drawer-open');
    }
  });
}

/* ============ reveal / 计数器 ============ */
function initReveal(){
  var els = $$('.rv');
  if (reduceMotion || !('IntersectionObserver' in window)){ els.forEach(function(e){ e.classList.add('on'); }); return; }
  var io = new IntersectionObserver(function(es){
    es.forEach(function(en){ if (en.isIntersecting){ en.target.classList.add('on'); io.unobserve(en.target); } });
  }, { threshold:.12 });
  els.forEach(function(e){ io.observe(e); });
  // 安全网：4 秒后还没点亮的，一律点亮（防 IO 漏报）
  setTimeout(function(){ $$('.rv:not(.on)').forEach(function(e){ e.classList.add('on'); }); }, 4000);
}
function initCounters(){
  $$('[data-count]').forEach(function(b){
    var end = parseInt(b.getAttribute('data-count'),10), suf = b.getAttribute('data-suffix')||'';
    function finish(){ b.textContent = (end>=1000 ? (end/1000)+'k' : end) + suf; b.setAttribute('data-counted','1'); }
    if (reduceMotion){ finish(); return; }
    var obj = { n:0 };
    var io = new IntersectionObserver(function(es){
      es.forEach(function(en){
        if (en.isIntersecting){
          io.disconnect();
          gsap.to(obj, { n:end, duration:1.6, ease:'power2.out', onUpdate:function(){
            b.textContent = (obj.n>=1000 ? (obj.n/1000).toFixed(1)+'k' : Math.round(obj.n)) + suf;
          }, onComplete: function(){ b.setAttribute('data-counted','1'); }});
        }
      });
    }, { threshold:.4 });
    io.observe(b);
  });
  // 安全网：4 秒后还没跑完的，直接落到终值（防 IO 漏报）
  setTimeout(function(){
    $$('[data-count]:not([data-counted])').forEach(function(b){
      var end = parseInt(b.getAttribute('data-count'),10), suf = b.getAttribute('data-suffix')||'';
      b.textContent = (end>=1000 ? (end/1000)+'k' : end) + suf;
      b.setAttribute('data-counted','1');
    });
  }, 4000);
}

/* ============ 启动 ============ */
document.addEventListener('DOMContentLoaded', function(){
  buildAperture();
  initNav(); initTabs(); initCart();
  renderProducts(); renderCats(); renderReviews();
  initTrade(); renderFooter(); initModals();
  initReveal(); initCounters();
  var st = $('#apertureStage');
  st.addEventListener('click', shutter);
  st.addEventListener('keydown', function(e){ if (e.key==='Enter'||e.key===' '){ e.preventDefault(); shutter(); } });
  $('#shutterCta').addEventListener('click', shutter);
});
})();

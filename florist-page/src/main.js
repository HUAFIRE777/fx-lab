/* ============================================================
   花叙 BLOOMTALE · florist-page 主脚本（classic，无依赖）
   ============================================================ */
(function(){
"use strict";
document.documentElement.classList.add("js");

/* ---------------- 配置：买家改这里，一改全改 ---------------- */
var SITE = {
  name: "花叙 BLOOMTALE",
  address: "上海市静安区南京西路1266号恒隆广场3F",
  phone: "021-6288-8899",
  phoneHref: "tel:+862162888899",
  email: "hello@bloomtale.cn",
  mailtoHref: "mailto:hello@bloomtale.cn",
  hours: "周一至周日 9:00–21:00",
  icp: "沪ICP备xxxxxxxxxx号-1",
  year: "2026"
};

var LEGAL = {
  privacy: { title: "隐私政策", points: [
    ["我们收集什么", "下单时留下的姓名、电话、收货地址，以及你主动告诉我们的收花偏好（比如对百合过敏）。仅用于履约，不多拿一分。"],
    ["信息怎么用", "配送、售后和订阅提醒。每月最多给你发两条上新短信，不想收回个 T 就停。"],
    ["谁会看到", "只有配送小哥和客服能看到你的地址。我们不卖、不租、不共享你的个人信息。"],
    ["保存多久", "订单信息按财务规定保存，注销账号后 30 天内彻底删除，备份里也不留。"],
    ["你的权利", "随时找客服查、改、删你的信息，删了就是删了，不玩文字游戏。"],
    ["找我们", "对隐私有任何疑问，打 " + SITE.phone + "，客服小满会在 24 小时内回复你。"]
  ]},
  terms: { title: "服务条款", points: [
    ["鲜花是活物", "花材受季节和产地影响，个别品种可能临时替换为同等价值花材，替换前会先征得你同意。"],
    ["配送承诺", "每周五 18 点前送达。迟到超 2 小时，当束直接免单，不用你开口。"],
    ["新鲜保障", "签收 48 小时内花材严重枯萎，拍照发客服，免费补送一束，不问原因。"],
    ["订阅取消", "随时可取消，未配送的周期全额退，已配送的不追讨。取消后花照开，人不纠缠。"],
    ["首单半价", "每个收货地址限享一次，与其他优惠不同享。半价的是第一束，真心也是。"],
    ["争议解决", "先好好商量，商量不好按收货地法院管辖。我们相信大部分问题一束花就能解决。"]
  ]},
  cookies: { title: "Cookie 政策", points: [
    ["我们用什么", "只用记住你偏好的必要 Cookie（比如你选的配送周期），不做跨站追踪。"],
    ["不做什么", "不卖浏览数据，不给广告商画像。你看花就是看花。"],
    ["怎么管", "浏览器设置里随时清掉，清掉后只是偏好重置，功能不受影响。"],
    ["第三方", "支付跳转到微信/支付宝时，对方会有自己的 Cookie 政策，以对方页面为准。"],
    ["更新", "政策变了会在这里公示，继续用就是同意了——但我们会尽量不变。"]
  ]}
};

/* ---------------- SITE 变量渲染 ---------------- */
function renderSite(){
  document.querySelectorAll("[data-site]").forEach(function(el){
    var k = el.getAttribute("data-site");
    if (SITE[k] !== undefined) el.textContent = SITE[k];
  });
  document.querySelectorAll("[data-site-href]").forEach(function(el){
    var k = el.getAttribute("data-site-href");
    if (SITE[k] !== undefined) el.setAttribute("href", SITE[k]);
  });
}

/* ---------------- 花瓣飘落（canvas，物理感） ---------------- */
function petals(canvas){
  var ctx = canvas.getContext("2d"), W, H, ps = [], raf = 0, running = true;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function size(){
    var r = canvas.parentElement.getBoundingClientRect();
    W = canvas.width = Math.floor(r.width); H = canvas.height = Math.floor(r.height);
  }
  function rnd(a,b){ return a + Math.random()*(b-a); }
  function spawn(top){
    return { x: rnd(-40, W+40), y: top ? rnd(-80,-10) : rnd(0,H),
      s: rnd(7,17), vy: rnd(.35,1.05), ph: rnd(0,Math.PI*2),
      sway: rnd(.4,1.4), rot: rnd(0,Math.PI*2), vr: rnd(-.012,.012),
      hue: rnd(0,1), alpha: rnd(.45,.85) };
  }
  function init(){ size(); ps = []; var n = Math.min(46, Math.floor(W/26)); for(var i=0;i<n;i++) ps.push(spawn(false)); }
  function color(p){
    /* 樱粉系两档 + 少量米白，绝不出现第三色系 */
    if (p.hue < .72) return "240,166,188";
    if (p.hue < .92) return "249,217,226";
    return "251,246,236";
  }
  function frame(){
    if(!running) return;
    ctx.clearRect(0,0,W,H);
    var t = performance.now()/1000;
    for(var i=0;i<ps.length;i++){
      var p = ps[i];
      p.y += p.vy; p.x += Math.sin(t*p.sway + p.ph)*.55; p.rot += p.vr;
      if(p.y > H+30) ps[i] = spawn(true);
      ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot); ctx.globalAlpha = p.alpha;
      ctx.fillStyle = "rgba(" + color(p) + ",1)";
      ctx.beginPath();                                     /* 花瓣形：泪滴 */
      ctx.moveTo(0,-p.s/2);
      ctx.bezierCurveTo(p.s/2,-p.s/2, p.s/2,p.s/3, 0,p.s/2);
      ctx.bezierCurveTo(-p.s/2,p.s/3, -p.s/2,-p.s/2, 0,-p.s/2);
      ctx.fill(); ctx.restore();
    }
    raf = requestAnimationFrame(frame);
  }
  init(); window.addEventListener("resize", init);
  if (reduced || document.hidden) { running = false; return; }
  document.addEventListener("visibilitychange", function(){
    if (document.hidden){ running = false; cancelAnimationFrame(raf); }
    else if (!running){ running = true; frame(); }
  });
  frame();
}

/* ---------------- 程序化花束 SVG ----------------
   确定性伪随机：同一 seed 每次渲染一致 */
function rng(seed){ var a = seed>>>0; return function(){ a|=0; a=a+0x6D2B79F5|0; var t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }

function bouquetSVG(seed, opts){
  opts = opts || {};
  var R = rng(seed);
  var pinks = ["#F0A6BC","#E78AA5","#F9CBD8","#D9748F"];
  var greens = ["#2E5240","#3E6B52","#1F3A2C"];
  var cx = 100, heads = [], stems = "", leaves = "";
  var n = opts.stems || (5 + Math.floor(R()*3));
  for (var i=0;i<n;i++){
    var ang = (i/(n-1) - .5) * (opts.spread || 1.15);   /* 扇形散开 */
    var len = 120 + R()*36, topX = cx + Math.sin(ang)*72, topY = 118 - Math.cos(ang)*46 - R()*22;
    var botX = cx + (R()-.5)*26, botY = 232;
    stems += '<path d="M'+botX+' '+botY+' Q '+(botX+topX)/2+' '+((botY+topY)/2+14)+' '+topX+' '+topY+'" stroke="'+greens[1]+'" stroke-width="3.4" fill="none" stroke-linecap="round"/>';
    /* 叶子：椭圆两片 */
    var lx = (botX+topX)/2 + (R()-.5)*30, ly = (botY+topY)/2 + 18;
    var lr = 15+R()*9, la = R()*Math.PI;
    leaves += '<ellipse cx="'+lx+'" cy="'+ly+'" rx="'+lr+'" ry="'+(lr*.42)+'" fill="'+greens[Math.floor(R()*2)]+'" opacity=".88" transform="rotate('+(la*180/Math.PI)+' '+lx+' '+ly+')"/>';
    heads.push({x:topX, y:topY, c:pinks[Math.floor(R()*pinks.length)], r: 15+R()*9, k:R(), delay:(R()*.7).toFixed(2)});
  }
  var s = "";
  s += '<g class="b-stems">'+stems+'</g><g class="b-leaves">'+leaves+'</g>';
  heads.forEach(function(h, idx){
    var pr = h.r, petalsN = 6 + Math.floor(h.k*4), ph = "";
    for (var j=0;j<petalsN;j++){
      var a = (j/petalsN)*Math.PI*2 + h.k;
      var px = Math.cos(a)*pr*.52, py = Math.sin(a)*pr*.52;
      ph += '<ellipse cx="'+px+'" cy="'+py+'" rx="'+(pr*.5)+'" ry="'+(pr*.3)+'" fill="'+h.c+'" opacity=".92" transform="rotate('+(a*180/Math.PI)+' '+px+' '+py+')"/>';
    }
    var inner = '<circle r="'+(pr*.34)+'" fill="'+h.c+'" opacity="1"/><circle r="'+(pr*.16)+'" fill="#C05E7E"/>';
    var cls = opts.bloom ? ' class="bloom" style="animation-delay:'+h.delay+'s"' : "";
    s += '<g'+cls+' transform="translate('+h.x.toFixed(1)+' '+h.y.toFixed(1)+')"><g class="b-head">'+ph+inner+'</g></g>';
  });
  /* 包装纸：牛皮纸色系（米白加深，仍在三色内） */
  s += '<path d="M52 236 L148 236 L128 168 L72 168 Z" fill="#EFE3CB" opacity=".95"/>';
  s += '<path d="M52 236 L148 236 L142 214 L58 214 Z" fill="#E4D3B4" opacity=".9"/>';
  s += '<rect x="88" y="196" width="26" height="12" rx="6" fill="#C05E7E" transform="rotate(-8 101 202)"/>';
  return '<svg viewBox="0 0 200 250" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="手绘风格花束插画">'+s+'</svg>';
}

/* ---------------- 渲染各处花束 ---------------- */
function renderBouquets(){
  var hero = document.getElementById("hero-bouquet");
  if (hero) hero.innerHTML = bouquetSVG(20261005, {bloom:true, stems:9, spread:1.3});
  document.querySelectorAll("[data-bouquet]").forEach(function(el){
    var seed = parseInt(el.getAttribute("data-bouquet"), 10) || 1;
    el.innerHTML = bouquetSVG(seed*7919+13, {stems: 5 + (seed%3)});
  });
}

/* ---------------- 加载态 ---------------- */
function loader(done){
  var l = document.getElementById("loader"), bar = l.querySelector(".l-bar i");
  var start = performance.now(), MIN = 700, p = 0;
  var tick = setInterval(function(){
    p = Math.min(92, p + 8 + Math.random()*14); bar.style.width = p + "%";
  }, 120);
  function finish(){
    clearInterval(tick); bar.style.width = "100%";
    setTimeout(function(){
      l.classList.add("done");
      document.body.classList.add("ready");   /* 触发 hero 入场动画 */
      done && done();
    }, 260);
  }
  window.addEventListener("load", function(){
    var wait = Math.max(0, MIN - (performance.now()-start));
    setTimeout(finish, wait);
  });
  setTimeout(finish, 4000);                    /* 兜底：load 迟迟不来也放行 */
}

/* ---------------- 导航 / 汉堡 / 锚点 ---------------- */
function nav(){
  var n = document.querySelector(".nav");
  function onScroll(){ n.classList.toggle("scrolled", window.scrollY > 40); }
  window.addEventListener("scroll", onScroll, {passive:true}); onScroll();
  var burger = document.querySelector(".burger");
  burger.addEventListener("click", function(){
    document.body.classList.toggle("menu-open");
    burger.setAttribute("aria-expanded", document.body.classList.contains("menu-open"));
  });
  document.querySelectorAll(".drawer a").forEach(function(a){
    a.addEventListener("click", function(){ document.body.classList.remove("menu-open"); });
  });
  document.addEventListener("keydown", function(e){
    if (e.key === "Escape") document.body.classList.remove("menu-open");
  });
}

/* ---------------- 滚动 reveal ---------------- */
function reveal(){
  var els = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)){ els.forEach(function(e){e.classList.add("in")}); return; }
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if (en.isIntersecting){
        /* 同行卡片 stagger：data-d 决定延迟 */
        var d = parseFloat(en.target.getAttribute("data-d") || "0");
        en.target.style.transitionDelay = (d * 0.12) + "s";
        en.target.classList.add("in"); io.unobserve(en.target);
        /* reveal 结束后清掉延迟，免得 hover 也被拖慢 */
        setTimeout(function(){ en.target.style.transitionDelay = ""; }, d*120 + 1000);
      }
    });
  }, {threshold:.12, rootMargin:"0px 0px -6% 0px"});
  els.forEach(function(e){ io.observe(e); });
}

/* ---------------- 加购小交互 ---------------- */
function cart(){
  document.querySelectorAll(".b-add").forEach(function(btn){
    btn.addEventListener("click", function(){
      if (btn.classList.contains("added")) return;
      btn.classList.add("added"); btn.textContent = "已加入花篮";
    });
  });
}

/* ---------------- 法务三件套弹窗 ---------------- */
function legal(){
  var veil = document.getElementById("modal-veil"),
      box = veil.querySelector(".modal"),
      title = veil.querySelector(".modal-head h3"),
      body = veil.querySelector(".modal-body"),
      lastFocus = null;
  function open(key){
    var doc = LEGAL[key]; if (!doc) return;
    lastFocus = document.activeElement;
    title.textContent = doc.title;
    body.innerHTML = "<ol>" + doc.points.map(function(p){
      return "<li><b>"+p[0]+"</b>"+p[1]+"</li>";
    }).join("") + "</ol>";
    veil.classList.add("open");
    veil.removeAttribute("hidden");
    document.body.style.overflow = "hidden";
    veil.querySelector(".modal-x").focus();
  }
  function close(){
    veil.classList.remove("open");
    veil.setAttribute("hidden","");
    document.body.style.overflow = "";
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  document.querySelectorAll("[data-legal]").forEach(function(b){
    b.addEventListener("click", function(){ open(b.getAttribute("data-legal")); });
  });
  veil.querySelector(".modal-x").addEventListener("click", close);
  veil.addEventListener("click", function(e){ if (e.target === veil) close(); });
  document.addEventListener("keydown", function(e){
    if (e.key === "Escape" && veil.classList.contains("open")) close();
  });
}

/* ---------------- 启动 ---------------- */
renderSite();
renderBouquets();
nav();
reveal();
cart();
legal();
loader(function(){
  var c = document.getElementById("petals");
  if (c) petals(c);
});
})();

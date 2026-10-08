/* 田集 TIÁNJÍ · farmfresh-page · 纯手写零依赖
   买家配置：只改顶部 SITE / LEGAL / VEGS / CITIES */
(function(){
"use strict";

/* ============ 站点信息变量（买家改这里，一改全改） ============ */
var SITE = {
  name: "田集",
  en: "TIÁNJÍ",
  slogan: "从田间到你家，只隔一夜",
  phone: "400-880-2636",
  phoneHref: "tel:4008802636",
  email: "hello@tianji.farm",
  mailtoHref: "mailto:hello@tianji.farm",
  address: "浙江省杭州市余杭区仓前街道良睦路 999 号",
  hours: "周一至周六 9:00–21:00",
  icp: "浙ICP备xxxxxxxxxx号-1",
  year: "2026"
};

/* ============ 法务三件套文案（真实感通用条款，改文案只改这里） ============ */
var LEGAL = {
  privacy: {
    title: "隐私政策",
    points: [
      ["我们收集什么", "下单订阅时需要您的姓名、手机号、收货地址与城市；支付环节由支付机构处理，我们不存储您的银行卡信息。浏览页面时会产生匿名访问日志，仅用于统计页面热度。"],
      ["用来做什么", "收集的信息只用于三件事：配送您的菜箱、订阅续费提醒、售后沟通。不会把您的手机号卖给任何第三方做营销。"],
      ["配送需要共享的信息", "为了把菜箱送到您手上，配送员会看到您的姓名、电话与地址。配送完成后我们要求合作方删除本次配送之外的留存。"],
      ["Cookie 与统计", "我们使用本地 Cookie 记住您的城市与订阅偏好，方便下次打开直接看到本地菜箱。您可以在浏览器设置里清除，不影响正常浏览。"],
      ["您的权利", "您可以随时要求查看、更正或删除我们持有的您的个人信息，发邮件到客服邮箱即可，我们在 7 个工作日内处理。"],
      ["联系我们", "关于隐私的任何问题：客服电话 400-880-2636（周一至周六 9:00–21:00），或发邮件至客服邮箱。"]
    ]
  },
  terms: {
    title: "服务条款",
    points: [
      ["服务内容", "田集提供当季农产品订阅配送服务：每周固定一天配送当周菜箱，箱内品类随当季收成调整，我们会提前三天在页面公布本周清单。"],
      ["订阅与计费", "月度/季度订阅按周期自动续费，续费前三天短信提醒；您可随时在到期前取消，未配送的周期按剩余天数退款。试吃箱为一次性购买，不自动续费。"],
      ["配送说明", "配送范围以页面公布城市为准；配送日为每周二（节假日顺延一天并短信通知）。因天气、交通等不可抗力迟到，我们会第一时间通知并补偿一张 20 元券。"],
      ["生鲜售后", "生鲜不适用七天无理由。签收后 24 小时内发现腐烂、缺斤少两，拍照联系客服，核实后按缺失部分退款或下周补发。"],
      ["首单优惠规则", "首单 8 折每个手机号限享一次，与其他满减券不可叠加；试吃箱不参与首单优惠。恶意刷单我们有权取消订单并退款。"],
      ["责任限制", "因农户端绝收等极端情况导致某品类缺货，我们会用同等价值当季品类替换并提前告知。因您预留地址错误导致的配送失败，重新配送需补 12 元运费。"]
    ]
  },
  cookies: {
    title: "Cookie 政策",
    points: [
      ["我们用什么 Cookie", "只用两类：必要型（记住您选的城市、订阅档位，保证表单不丢数据）；统计型（匿名统计各区块停留时长，帮我们决定下周种什么菜多推）。"],
      ["不用什么", "不做跨站追踪，不接广告联盟，不会因为您看了菜箱就在别处看到我们的广告。"],
      ["保存多久", "偏好类 Cookie 保存 12 个月；统计类日志保存 6 个月后匿名化。账号注销或要求删除时一并清除。"],
      ["您可以怎么管", "浏览器设置里随时清除或禁用 Cookie。禁用后城市需要每次手动选择，其他功能不受影响。"],
      ["政策更新", "Cookie 政策更新时会在页脚标注更新日期，重大变化会通过短信告知订阅用户。"]
    ]
  }
};

/* ============ 当季菜品（编号/名/描述/价/产地/插画类型） ============ */
var VEGS = [
  {no:"01", name:"奶油生菜", desc:"清晨带露采的，叶子脆得能听见响。", price:"9.9", unit:"/ 500g", from:"安吉基地", art:"leaf"},
  {no:"02", name:"胡萝卜", desc:"沙土地里长大的，甜得像水果。", price:"7.9", unit:"/ 500g", from:"寿光基地", art:"carrot"},
  {no:"03", name:"圣女果", desc:"自然熟的，一口爆汁不用蘸酱。", price:"15.9", unit:"/ 500g", from:"澄迈基地", art:"tomato"},
  {no:"04", name:"甜玉米", desc:"掰下来 6 小时内锁鲜，真空装。", price:"12.9", unit:"/ 4穗", from:"公主岭基地", art:"corn"},
  {no:"05", name:"贝贝南瓜", desc:"蒸 15 分钟，粉糯得像栗子。", price:"11.9", unit:"/ 600g", from:"寿光基地", art:"pumpkin"},
  {no:"06", name:"娃娃菜", desc:"心是甜的，涮火锅三秒就熟。", price:"8.9", unit:"/ 500g", from:"昆明基地", art:"cabbage"},
  {no:"07", name:"紫甘蓝", desc:"切丝拌沙拉，颜色撑起整盘。", price:"10.9", unit:"/ 500g", from:"张家口基地", art:"redcabbage"},
  {no:"08", name:"羽衣甘蓝", desc:"健身党回购王，打汁不涩口。", price:"13.9", unit:"/ 300g", from:"安吉基地", art:"kale"}
];

var CITIES = ["杭州","上海","南京","苏州","宁波","合肥","武汉","长沙","北京","天津","成都","重庆"];

/* ============ 程序化蔬菜插画（扁平手绘风，原创路径） ============ */
function shadow(){ return '<ellipse cx="60" cy="106" rx="30" ry="7" fill="rgba(31,61,38,.10)"/>'; }
var ART = {
  leaf: function(s){ return shadow()+
    '<g><ellipse cx="60" cy="52" rx="20" ry="34" fill="#3E7046" transform="rotate(-18 60 52)"/>'+
    '<ellipse cx="72" cy="60" rx="15" ry="28" fill="#2E5B34" transform="rotate(24 72 60)"/>'+
    '<ellipse cx="48" cy="66" rx="13" ry="24" fill="#4E8A57" transform="rotate(-34 48 66)"/>'+
    '<path d="M60 26 C58 52 58 74 60 98" stroke="#2E5B34" stroke-width="3" fill="none" stroke-linecap="round"/></g>'; },
  carrot: function(s){ return shadow()+
    '<g><path d="M40 46 L80 46 L62 100 Q60 104 58 100 Z" fill="#D9712B"/>'+
    '<path d="M46 58 L70 58 M50 70 L66 70 M54 82 L62 82" stroke="#B85A1F" stroke-width="3" stroke-linecap="round"/>'+
    '<path d="M60 46 C56 32 48 28 42 22 M60 46 C60 30 66 26 72 20 M60 46 C64 34 70 32 76 30" stroke="#3E7046" stroke-width="5" fill="none" stroke-linecap="round"/></g>'; },
  tomato: function(s){ return shadow()+
    '<g><circle cx="60" cy="64" r="30" fill="#C4432F"/>'+
    '<ellipse cx="50" cy="54" rx="9" ry="6" fill="#D96A54" transform="rotate(-24 50 54)"/>'+
    '<path d="M60 36 l-14 -8 10 2 -4 -10 8 8 8 -8 -4 10 10 -2 -14 8z" fill="#3E7046"/>'+
    '<rect x="57" y="24" width="6" height="12" rx="3" fill="#2E5B34"/></g>'; },
  corn: function(s){ return shadow()+
    '<g><ellipse cx="60" cy="58" rx="22" ry="38" fill="#E3B23C"/>'+
    '<g fill="#C99727"><circle cx="52" cy="40" r="3"/><circle cx="62" cy="40" r="3"/><circle cx="57" cy="50" r="3"/><circle cx="67" cy="50" r="3"/><circle cx="52" cy="60" r="3"/><circle cx="62" cy="60" r="3"/><circle cx="57" cy="70" r="3"/><circle cx="67" cy="70" r="3"/></g>'+
    '<path d="M38 92 C30 70 34 50 44 34 C38 56 40 76 50 92 Z" fill="#4E8A57"/>'+
    '<path d="M82 92 C90 70 86 50 76 34 C82 56 80 76 70 92 Z" fill="#3E7046"/></g>'; },
  pumpkin: function(s){ return shadow()+
    '<g><ellipse cx="38" cy="66" rx="16" ry="26" fill="#C96A26"/><ellipse cx="82" cy="66" rx="16" ry="26" fill="#C96A26"/>'+
    '<ellipse cx="60" cy="66" rx="24" ry="28" fill="#DE7A2E"/>'+
    '<path d="M60 40 C58 58 58 76 60 94 M48 42 C46 60 46 78 48 92 M72 42 C74 60 74 78 72 92" stroke="#B85A1F" stroke-width="2.5" fill="none"/>'+
    '<rect x="55" y="24" width="10" height="18" rx="4" fill="#6B4426" transform="rotate(8 60 33)"/></g>'; },
  cabbage: function(s){ return shadow()+
    '<g><ellipse cx="60" cy="64" rx="34" ry="30" fill="#A9C08A"/>'+
    '<ellipse cx="60" cy="64" rx="24" ry="22" fill="#C2D6A4"/>'+
    '<ellipse cx="60" cy="64" rx="14" ry="14" fill="#DCE8C4"/>'+
    '<path d="M60 44 C58 56 58 72 60 84 M44 52 C48 62 52 72 56 80 M76 52 C72 62 68 72 64 80" stroke="#8AA86E" stroke-width="2.5" fill="none"/></g>'; },
  redcabbage: function(s){ return shadow()+
    '<g><ellipse cx="60" cy="64" rx="34" ry="30" fill="#7A4A63"/>'+
    '<ellipse cx="60" cy="64" rx="24" ry="22" fill="#96617F"/>'+
    '<ellipse cx="60" cy="64" rx="14" ry="14" fill="#B58CA0"/>'+
    '<path d="M60 44 C58 56 58 72 60 84 M44 52 C48 62 52 72 56 80 M76 52 C72 62 68 72 64 80" stroke="#5E364C" stroke-width="2.5" fill="none"/></g>'; },
  kale: function(s){ return shadow()+
    '<g><path d="M60 30 C44 44 40 66 52 92 C56 78 58 60 60 30Z" fill="#2E5B34"/>'+
    '<path d="M60 30 C76 44 80 66 68 92 C64 78 62 60 60 30Z" fill="#3E7046"/>'+
    '<path d="M60 30 C60 52 60 74 60 96" stroke="#1F3D26" stroke-width="3" fill="none"/>'+
    '<circle cx="50" cy="60" r="6" fill="#4E8A57"/><circle cx="70" cy="66" r="7" fill="#4E8A57"/><circle cx="60" cy="80" r="5" fill="#3E7046"/></g>'; }
};
function vegSVG(type, seed){
  var j = ((seed||0)%5-2)*3;
  return '<svg class="veg-pic" viewBox="0 0 120 120" aria-hidden="true"><g transform="translate('+j+',0)">'+ART[type](seed)+'</g></svg>';
}

/* ============ 初始化 ============ */
document.documentElement.classList.add("js");

/* SITE 渲染：data-site 填文本，data-site-href 填链接 */
function renderSite(){
  document.querySelectorAll("[data-site]").forEach(function(el){
    var k = el.getAttribute("data-site");
    if (SITE[k] !== undefined) el.textContent = SITE[k];
  });
  document.querySelectorAll("[data-site-href]").forEach(function(el){
    var k = el.getAttribute("data-site-href");
    if (SITE[k] !== undefined) el.setAttribute("href", SITE[k]);
  });
  document.title = SITE.name + " " + SITE.en + "｜当季菜箱订阅，农场直供到家";
}

/* 菜品网格渲染 */
function renderVegs(){
  var grid = document.getElementById("vegGrid");
  if(!grid) return;
  grid.innerHTML = VEGS.map(function(v,i){
    return '<article class="veg-card reveal" data-d="'+(i%4*0.12)+'">'+
      '<span class="veg-no">No.'+v.no+'</span>'+
      vegSVG(v.art, i)+
      '<h3>'+v.name+'</h3><p class="vp">'+v.desc+'</p>'+
      '<div class="veg-meta"><span class="price">¥'+v.price+'<small>'+v.unit+'</small></span><span class="from">'+v.from+'</span></div>'+
      '<button class="pick" type="button">加入本周箱</button>'+
    '</article>';
  }).join("");
  grid.querySelectorAll(".pick").forEach(function(btn){
    btn.addEventListener("click", function(){
      var added = btn.classList.toggle("added");
      btn.textContent = added ? "已加入本周箱" : "加入本周箱";
    });
  });
}

/* 城市渲染：配送 chips + 表单 select */
function renderCities(){
  var box = document.getElementById("cityChips");
  if(box){
    box.innerHTML = CITIES.map(function(c){ return '<span class="city">'+c+'</span>'; }).join("") +
      '<span class="city more">更多城市筹备中…</span>';
  }
  var sel = document.getElementById("fCity");
  if(sel){
    CITIES.forEach(function(c){
      var o = document.createElement("option"); o.value = c; o.textContent = c; sel.appendChild(o);
    });
    var o2 = document.createElement("option"); o2.value = "其他"; o2.textContent = "其他城市（到货通知我）"; sel.appendChild(o2);
  }
}

/* ============ 加载态：window.load + 最短 700ms，4s 兜底 ============ */
var loaderDone = false;
function finishLoad(){
  if(loaderDone) return; loaderDone = true;
  var l = document.getElementById("loader");
  if(l) l.classList.add("done");
  document.documentElement.classList.add("ready");
}
window.addEventListener("load", function(){ setTimeout(finishLoad, 700); });
setTimeout(finishLoad, 4000);

/* ============ 导航：滚动毛玻璃 + 抽屉 ============ */
function initNav(){
  var nav = document.querySelector(".nav");
  var onScroll = function(){ nav.classList.toggle("scrolled", window.scrollY > 40); };
  window.addEventListener("scroll", onScroll, {passive:true}); onScroll();
  var drawer = document.getElementById("drawer");
  var burger = document.querySelector(".burger");
  function openDrawer(o){
    drawer.classList.toggle("open", o);
    document.body.style.overflow = o ? "hidden" : "";
    burger.setAttribute("aria-expanded", o ? "true" : "false");
  }
  burger.addEventListener("click", function(){ openDrawer(true); });
  drawer.querySelector(".drawer-close").addEventListener("click", function(){ openDrawer(false); });
  drawer.querySelectorAll("a").forEach(function(a){ a.addEventListener("click", function(){ openDrawer(false); }); });
  document.addEventListener("keydown", function(e){ if(e.key === "Escape") openDrawer(false); });
}

/* ============ 菜叶飘落（hero 主视觉动效，canvas） ============ */
function initLeaves(){
  var cv = document.getElementById("leaves");
  if(!cv) return;
  var ctx = cv.getContext("2d");
  var W, H, parts = [];
  var COLORS = ["#3E7046","#4E8A57","#8A5A33","#2E5B34","#A9713F"];
  function resize(){
    var r = cv.parentElement.getBoundingClientRect();
    W = cv.width = Math.floor(r.width); H = cv.height = Math.floor(r.height);
    spawn();
  }
  function spawn(){
    var n = Math.max(18, Math.min(46, Math.floor(W/30)));
    parts = [];
    for(var i=0;i<n;i++){
      parts.push({
        x: Math.random()*W, y: Math.random()*H - H,
        s: 7 + Math.random()*13,
        vy: .5 + Math.random()*1.1,
        ph: Math.random()*Math.PI*2,
        sw: .6 + Math.random()*1.6,
        rot: Math.random()*Math.PI*2,
        vr: (Math.random()-.5)*.03,
        c: COLORS[(Math.random()*COLORS.length)|0],
        a: .35 + Math.random()*.45
      });
    }
  }
  function leaf(p){
    ctx.save();
    ctx.translate(p.x, p.y); ctx.rotate(p.rot);
    ctx.globalAlpha = p.a; ctx.fillStyle = p.c;
    ctx.beginPath();
    ctx.moveTo(0, -p.s);
    ctx.quadraticCurveTo(p.s*.7, -p.s*.3, 0, p.s);
    ctx.quadraticCurveTo(-p.s*.7, -p.s*.3, 0, -p.s);
    ctx.fill();
    ctx.strokeStyle = "rgba(31,61,38,.35)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0,-p.s*.7); ctx.lineTo(0,p.s*.7); ctx.stroke();
    ctx.restore();
  }
  var t = 0;
  function tick(){
    if(!document.hidden){
      t += .016;
      ctx.clearRect(0,0,W,H);
      for(var i=0;i<parts.length;i++){
        var p = parts[i];
        p.y += p.vy; p.x += Math.sin(t*p.sw + p.ph)*.7; p.rot += p.vr;
        if(p.y > H + 30){ p.y = -30; p.x = Math.random()*W; }
        leaf(p);
      }
    }
    requestAnimationFrame(tick);
  }
  window.addEventListener("resize", resize);
  resize(); tick();
}

/* ============ 滚动 reveal ============ */
function initReveal(){
  var els = document.querySelectorAll(".reveal");
  if(!("IntersectionObserver" in window)){
    els.forEach(function(el){ el.classList.add("in"); });
    return;
  }
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if(en.isIntersecting){
        var el = en.target;
        var d = parseFloat(el.getAttribute("data-d")||"0");
        el.style.transitionDelay = d + "s";
        el.classList.add("in");
        io.unobserve(el);
        /* reveal 完成后清掉 delay，免得 hover 被拖慢 */
        setTimeout(function(){ el.style.transitionDelay = ""; }, 900 + d*1000);
      }
    });
  }, {threshold:.12});
  els.forEach(function(el){ io.observe(el); });
}

/* ============ 订阅档位按钮 → 跳转并预选 ============ */
function initPlanLinks(){
  document.querySelectorAll("[data-plan]").forEach(function(a){
    a.addEventListener("click", function(){
      var v = a.getAttribute("data-plan");
      setTimeout(function(){
        document.querySelectorAll('.plan-pick label').forEach(function(l){
          l.classList.toggle("sel", l.getAttribute("data-v") === v);
        });
        var r = document.querySelector('.plan-pick input[value="'+v+'"]');
        if(r) r.checked = true;
      }, 650);
    });
  });
  document.querySelectorAll(".plan-pick label").forEach(function(l){
    l.addEventListener("click", function(){
      document.querySelectorAll(".plan-pick label").forEach(function(x){ x.classList.remove("sel"); });
      l.classList.add("sel");
    });
  });
}

/* ============ 订阅表单：校验 + 成功态 ============ */
function initForm(){
  var form = document.getElementById("subForm");
  if(!form) return;
  function setErr(id, msg){
    var input = document.getElementById(id);
    var err = document.getElementById(id+"Err");
    if(msg){ input.classList.add("err"); err.textContent = msg; err.classList.add("show"); }
    else { input.classList.remove("err"); err.classList.remove("show"); }
  }
  ["fName","fPhone","fCity"].forEach(function(id){
    document.getElementById(id).addEventListener("input", function(){ setErr(id, ""); });
    document.getElementById(id).addEventListener("change", function(){ setErr(id, ""); });
  });
  form.addEventListener("submit", function(e){
    e.preventDefault();
    var ok = true;
    var name = document.getElementById("fName").value.trim();
    var phone = document.getElementById("fPhone").value.trim();
    var city = document.getElementById("fCity").value;
    if(name.length < 2){ setErr("fName","请填写真实姓名（至少 2 个字）"); ok = false; }
    if(!/^1[3-9]\d{9}$/.test(phone)){ setErr("fPhone","手机号格式不对，请检查 11 位数字"); ok = false; }
    if(!city){ setErr("fCity","请选择您的城市"); ok = false; }
    if(!ok) return;
    var plan = (form.querySelector('.plan-pick input:checked')||{}).value || "month";
    var planName = {try:"试吃箱", month:"月度订阅", season:"季度家庭箱"}[plan] || "月度订阅";
    var d = new Date();
    var code = "TJ-" + d.getFullYear() + ("0"+(d.getMonth()+1)).slice(-2) + ("0"+d.getDate()).slice(-2) +
      "-" + Math.floor(1000 + Math.random()*9000);
    document.getElementById("formFields").hidden = true;
    var okBox = document.getElementById("formOk");
    okBox.querySelector(".order").textContent = code;
    okBox.querySelector(".ok-plan").textContent = planName + " · " + city;
    okBox.hidden = false;
  });
}

/* ============ 法务弹窗：单壳 + 三通道关闭 ============ */
function initModal(){
  var mask = document.getElementById("modalMask");
  var title = mask.querySelector(".modal-head h3");
  var body = mask.querySelector(".modal-body");
  var closeBtn = mask.querySelector(".modal-x");
  var okBtn = mask.querySelector(".modal-foot .btn");
  var lastFocus = null;
  function open(key){
    var doc = LEGAL[key];
    if(!doc) return;
    lastFocus = document.activeElement;
    title.textContent = doc.title;
    body.innerHTML = doc.points.map(function(p){
      return '<div class="term"><h4>'+p[0]+'</h4><p>'+p[1]+'</p></div>';
    }).join("");
    mask.classList.add("open");
    document.body.style.overflow = "hidden";
    closeBtn.focus();
  }
  function close(){
    mask.classList.remove("open");
    document.body.style.overflow = "";
    if(lastFocus && lastFocus.focus) lastFocus.focus();
  }
  document.querySelectorAll("[data-legal]").forEach(function(b){
    b.addEventListener("click", function(){ open(b.getAttribute("data-legal")); });
  });
  closeBtn.addEventListener("click", close);
  okBtn.addEventListener("click", close);
  mask.addEventListener("click", function(e){ if(e.target === mask) close(); });
  document.addEventListener("keydown", function(e){ if(e.key === "Escape" && mask.classList.contains("open")) close(); });
}

/* ============ 启动 ============ */
renderSite();
renderVegs();
renderCities();
initNav();
initLeaves();
initReveal();
initPlanLinks();
initForm();
initModal();

})();

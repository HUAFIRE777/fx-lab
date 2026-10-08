/* 御湖湾 realestate-page 交互：classic script，无模块依赖（GSAP 可选增强） */
(function(){
"use strict";
document.documentElement.classList.add("js");

/* ---------- SITE 配置：买家只改这里 ---------- */
var SITE = {
  name:    "御湖湾",
  address: "湖东新城 · 御湖路 1 号",
  email:   "service@yuhuwan-house.com",
  phone:   "400-888-2026",
  icp:     "京ICP备xxxxxx号"
};

/* ---------- 法务三件套文案 ---------- */
var MODAL_DOCS = {
  privacy: {
    title: "隐私政策", updated: "最近更新：2026 年 8 月",
    items: [
      ["我们收集什么", "您在预约看房表单中填写的姓名、手机号码与意向户型，以及您浏览本页面时产生的访问日志（页面停留、点击行为）。我们不会收集与您身份直接关联的生物信息。"],
      ["用来做什么", "收集的信息仅用于：① 置业顾问与您联系、安排看房；② 统计页面访问情况以改进展示内容。未经您同意，不会用于其他用途。"],
      ["保存多久", "预约信息自提交之日起保存 2 年，到期后匿名化处理；您可随时要求提前删除。"],
      ["会不会分享", "我们不会向任何第三方出售您的个人信息。仅在法律要求或您明确授权时，才会向相关方提供必要信息。"],
      ["您的权利", "您有权查询、更正、删除我们持有的您的个人信息，拨打售楼热线即可办理，我们在 15 个工作日内响应。"],
      ["未成年人", "本页面面向成年人购房咨询；如您是未成年人，请在监护人陪同下填写预约信息。"],
      ["联系我们", "对隐私政策有任何疑问，请通过页脚邮箱联系我们，我们会认真对待每一条反馈。"]
    ]
  },
  terms: {
    title: "服务条款", updated: "最近更新：2026 年 8 月",
    items: [
      ["服务内容", "本页面提供御湖湾楼盘的户型、配套、动态信息展示与看房预约服务。所有信息仅供参考，不构成购房要约或承诺。"],
      ["预约说明", "提交预约后，置业顾问将在 24 小时内与您联系确认看房时间；如遇节假日或接待量饱和，顺延至下一个工作日。"],
      ["信息准确性", "页面中的面积、距离、交付时间为规划或测算数据，实际以政府批准文件及商品房买卖合同约定为准。"],
      ["合理使用", "您承诺不利用本页面从事任何违法活动，不批量抓取页面数据，不干扰页面正常运行。"],
      ["知识产权", "本页面的设计、文案与示意图均为原创内容，未经书面许可不得复制、转载或用于商业用途。"],
      ["责任限制", "因不可抗力、网络故障等导致的服务中断，我们会尽快恢复，但不承担间接损失赔偿责任。"],
      ["条款变更", "我们可能适时更新本条款，更新后将在本页面显著位置提示；继续使用即视为接受新条款。"]
    ]
  },
  cookie: {
    title: "Cookie 政策", updated: "最近更新：2026 年 8 月",
    items: [
      ["什么是 Cookie", "Cookie 是网站保存在您浏览器中的小文本文件，用于记住您的偏好、统计访问情况，让页面更好用。"],
      ["我们用哪些", "本页面仅使用两类 Cookie：① 必要型（记住您关闭过弹窗、表单草稿），没有它页面部分功能无法工作；② 统计型（匿名访问量统计），帮助我们知道哪些内容受欢迎。"],
      ["我们不用哪些", "我们不使用广告追踪 Cookie，不做跨站用户画像，不会把您的浏览行为卖给广告商。"],
      ["您可以控制", "您随时可以在浏览器设置中清除或禁用 Cookie；禁用后页面仍可浏览，但预约表单的草稿记忆功能会失效。"],
      ["第三方", "本页面未接入任何第三方统计或广告 SDK，不存在第三方 Cookie。"],
      ["有效期", "必要型 Cookie 保存 30 天，统计型 Cookie 保存 90 天，到期自动失效。"]
    ]
  }
};

/* ---------- 页脚 SITE 注入 ---------- */
function renderSite(){
  var els = document.querySelectorAll("[data-site]");
  for (var i=0;i<els.length;i++){
    var k = els[i].getAttribute("data-site"), v = SITE[k];
    if (v == null) continue;
    if (els[i].tagName === "A"){
      if (k === "phone"){ els[i].textContent = v; els[i].href = "tel:" + v.replace(/-/g,""); }
      else if (k === "email"){ els[i].textContent = v; els[i].href = "mailto:" + v; }
      else els[i].textContent = v;
    } else els[i].textContent = v;
  }
}

/* ---------- 户型数据 + SVG 平面绘制 ---------- */
function room(x,y,w,h,name,sub,balcony){
  var s = '<g>';
  s += '<rect class="' + (balcony ? 'plan-balcony' : 'plan-fill') + '" x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'"/>';
  s += '<rect class="plan-wall" x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'"/>';
  s += '<text class="plan-label" x="'+(x+w/2)+'" y="'+(y+h/2-4)+'" text-anchor="middle">'+name+'</text>';
  if (sub) s += '<text class="plan-sub" x="'+(x+w/2)+'" y="'+(y+h/2+14)+'" text-anchor="middle">'+sub+'</text>';
  return s + '</g>';
}
var UNITS = {
  u2: {
    name: "建面约 89㎡ · 两房两厅一卫",
    tagline: "小两口的第一套房，住得下野心",
    specs: [["建筑面积","约 89㎡"],["朝向","南向 · 两开间朝南"],["层高","约 3.0 米"],["交付","准现房 · 2026 年底"]],
    desc: "餐客一体、双联阳台，动静分区做进 89㎡。主卧朝南带飘窗，次卧也能放下 1.5 米床——第一套房，不将就。",
    svg: '<svg viewBox="0 0 400 320">'
      + room(20,20,150,130,"主卧","朝南 · 飘窗")
      + room(20,150,150,150,"次卧","约 3.2×3.5m")
      + room(170,20,210,170,"客厅","约 4.2m 面宽")
      + room(170,190,120,110,"餐厅","餐客一体")
      + room(290,190,90,55,"厨房","L 型")
      + room(290,245,90,55,"卫生间","干湿分区")
      + room(190,250,170,44,"观景阳台","南向",true)
      + '</svg>'
  },
  u3: {
    name: "建面约 128㎡ · 三房两厅两卫",
    tagline: "三代同堂，也各自有空间",
    specs: [["建筑面积","约 128㎡"],["朝向","南北通透"],["层高","约 3.05 米"],["交付","2027 年中"]],
    desc: "南北通透，主卧套房带独立卫浴，老人房放在安静的北区。128㎡ 的从容，是拌了嘴也有地方各自冷静。",
    svg: '<svg viewBox="0 0 400 320">'
      + room(20,20,160,150,"主卧套房","独立卫浴")
      + room(20,170,160,130,"老人房","北静区")
      + room(180,20,200,160,"客厅","约 5.1m 面宽")
      + room(180,180,120,120,"餐厅","")
      + room(300,180,80,70,"厨房","")
      + room(300,250,80,50,"客卫","",false)
      + room(180,250,120,50,"观景阳台","南向",true)
      + '</svg>'
  },
  u4: {
    name: "建面约 168㎡ · 四房两厅三卫",
    tagline: "把湖，装进客厅",
    specs: [["建筑面积","约 168㎡"],["朝向","南向 · 270°观湖"],["层高","约 3.2 米"],["交付","2027 年底"]],
    desc: "约 7.2 米南向面宽，双套房加独立书房，客厅整面落地窗对湖。168㎡ 只做一件事：让湖成为家里最大的一件家具。",
    svg: '<svg viewBox="0 0 400 320">'
      + room(20,20,170,145,"主卧套房","衣帽间 · 主卫")
      + room(20,165,170,135,"次卧","")
      + room(190,20,110,155,"客厅","约 7.2m 面宽")
      + room(300,20,80,90,"书房","观湖")
      + room(300,110,80,65,"客卫","")
      + room(190,175,100,125,"餐厅","")
      + room(290,175,90,70,"厨房","中西分厨")
      + room(190,255,190,45,"270°观湖阳台","",true)
      + '</svg>'
  }
};
var unitOrder = ["u2","u3","u4"];

function renderUnit(key){
  var u = UNITS[key];
  document.getElementById("planSvg").outerHTML = u.svg.replace("<svg", '<svg id="planSvg"');
  document.getElementById("unitName").textContent = u.name;
  document.getElementById("unitTagline").textContent = u.tagline;
  var specs = document.getElementById("unitSpecs");
  specs.innerHTML = "";
  u.specs.forEach(function(sp){
    var li = document.createElement("li");
    li.innerHTML = "<b></b><span></span>";
    li.querySelector("b").textContent = sp[0];
    li.querySelector("span").textContent = sp[1];
    specs.appendChild(li);
  });
  document.getElementById("unitDesc").textContent = u.desc;
}

/* ---------- 导航滚动态 ---------- */
var nav = document.getElementById("nav");
function onScrollNav(){ nav.classList.toggle("scrolled", window.scrollY > 24); }
window.addEventListener("scroll", onScrollNav, {passive:true});
onScrollNav();

/* ---------- 移动端抽屉 ---------- */
var burger = document.getElementById("burger"),
    drawer = document.getElementById("drawer"),
    drawerVeil = document.getElementById("drawerVeil");
function openDrawer(){
  drawer.classList.add("open"); drawer.setAttribute("aria-hidden","false");
  drawerVeil.classList.add("show"); burger.setAttribute("aria-expanded","true");
  document.body.style.overflow = "hidden";
}
function closeDrawer(){
  drawer.classList.remove("open"); drawer.setAttribute("aria-hidden","true");
  drawerVeil.classList.remove("show"); burger.setAttribute("aria-expanded","false");
  document.body.style.overflow = "";
}
burger.addEventListener("click", function(){
  drawer.classList.contains("open") ? closeDrawer() : openDrawer();
});
drawerVeil.addEventListener("click", closeDrawer);
drawer.querySelectorAll("a").forEach(function(a){ a.addEventListener("click", closeDrawer); });

/* ---------- 滚动 reveal + 安全网 ---------- */
var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
function lightUp(el){
  var d = parseInt(el.getAttribute("data-d") || "0", 10);
  el.style.transitionDelay = (d * 0.12) + "s";
  el.classList.add("is-in");
}
function initReveals(){
  var heroReveals = document.querySelectorAll(".hero .reveal");
  var rest = document.querySelectorAll(".section .reveal, .footer .reveal");
  if ("IntersectionObserver" in window && !reduceMotion){
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){ if (e.isIntersecting){ lightUp(e.target); io.unobserve(e.target); } });
    }, {threshold: 0.16});
    rest.forEach(function(el){ io.observe(el); });
  } else {
    rest.forEach(lightUp);
  }
  /* hero 入场编排 */
  if (reduceMotion){ heroReveals.forEach(lightUp); return; }
  if (window.gsap){
    var tl = gsap.timeline({defaults:{ease:"power3.out", duration:1.05}});
    tl.fromTo(".hero-kicker",{y:26,autoAlpha:0},{y:0,autoAlpha:1},0.15)
      .fromTo(".hero-title",{y:44,autoAlpha:0},{y:0,autoAlpha:1,duration:1.25},0.3)
      .fromTo(".hero-sub",{y:30,autoAlpha:0},{y:0,autoAlpha:1},0.55)
      .fromTo(".hero-ctas",{y:26,autoAlpha:0},{y:0,autoAlpha:1},0.7)
      .fromTo(".hero-note",{autoAlpha:0},{autoAlpha:1,duration:0.8},0.9);
  } else {
    heroReveals.forEach(lightUp);
  }
  /* 4 秒安全网：IO 漏报也必点亮 */
  setTimeout(function(){
    document.querySelectorAll(".reveal:not(.is-in)").forEach(lightUp);
  }, 4000);
}

/* ---------- Hero 视差（主视觉动效） ---------- */
function initParallax(){
  var layers = document.querySelectorAll(".hero-scene .lyr");
  if (!layers.length || reduceMotion) return;
  var mx = 0, my = 0, cx = 0, cy = 0, ticking = false;
  function apply(){
    ticking = false;
    var sy = Math.min(window.scrollY, window.innerHeight);
    layers.forEach(function(l){
      var d = parseFloat(l.getAttribute("data-depth"));
      var ty = sy * d * 0.55 + cy * d * 46;
      var tx = cx * d * 60;
      /* 只用 px 位移，不用百分比（GSAP 百分比位移坑） */
      l.style.transform = "translate3d(" + tx.toFixed(1) + "px," + ty.toFixed(1) + "px,0)";
    });
  }
  function request(){ if (!ticking){ ticking = true; requestAnimationFrame(apply); } }
  window.addEventListener("scroll", request, {passive:true});
  if (window.matchMedia("(pointer:fine)").matches){
    document.querySelector(".hero").addEventListener("mousemove", function(e){
      var r = this.getBoundingClientRect();
      mx = (e.clientX - r.left) / r.width - 0.5;
      my = (e.clientY - r.top) / r.height - 0.5;
      /* 目标值更新，惯性插值在下方 setInterval 里平滑跟随 */
      request();
    });
  }
  /* 鼠标惯性回正 */
  setInterval(function(){
    if (Math.abs(mx - cx) > 0.001 || Math.abs(my - cy) > 0.001){
      cx += (mx - cx) * 0.08; cy += (my - cy) * 0.08; request();
    }
  }, 33);
  request();
}

/* ---------- 户型 Tab ---------- */
var tabs = document.querySelectorAll(".tab"),
    unitCard = document.getElementById("unitCard");
tabs.forEach(function(t){
  t.addEventListener("click", function(){
    if (t.classList.contains("is-on")) return;
    tabs.forEach(function(x){ x.classList.remove("is-on"); x.setAttribute("aria-selected","false"); });
    t.classList.add("is-on"); t.setAttribute("aria-selected","true");
    unitCard.classList.remove("flipping");
    void unitCard.offsetWidth; /* 重启动画 */
    unitCard.classList.add("flipping");
    setTimeout(function(){ renderUnit(t.getAttribute("data-unit")); }, 200);
  });
});
renderUnit("u2");

/* ---------- 预约表单 ---------- */
var form = document.getElementById("bookForm"),
    formErr = document.getElementById("formErr"),
    submitBtn = document.getElementById("submitBtn"),
    formCard = document.querySelector(".cta-form-card");
form.addEventListener("submit", function(e){
  e.preventDefault();
  var name = form.name.value.trim(),
      phone = form.phone.value.trim(),
      unit = form.unit.value;
  formErr.textContent = "";
  if (!name){ formErr.textContent = "请填写您的称呼，方便我们联系您。"; form.name.focus(); return; }
  if (!/^1[3-9]\d{9}$/.test(phone)){ formErr.textContent = "手机号码好像不对，请检查一下 11 位数字。"; form.phone.focus(); return; }
  submitBtn.disabled = true;
  submitBtn.textContent = "提交中…";
  setTimeout(function(){
    document.getElementById("successMsg").textContent =
      name + "，已收到您的" + unit + "预约，置业顾问将在 24 小时内联系您安排看房。";
    formCard.classList.add("booked");
    document.getElementById("formSuccess").setAttribute("aria-hidden","false");
  }, 900);
});
document.getElementById("bookAgain").addEventListener("click", function(){
  formCard.classList.remove("booked");
  document.getElementById("formSuccess").setAttribute("aria-hidden","true");
  form.reset(); submitBtn.disabled = false; submitBtn.textContent = "提交预约";
});

/* ---------- 法务弹窗 ---------- */
var modal = document.getElementById("modal"),
    modalVeil = document.getElementById("modalVeil"),
    modalTitle = document.getElementById("modalTitle"),
    modalBody = document.getElementById("modalBody"),
    modalX = document.getElementById("modalX"),
    lastFocus = null;
function openModal(key){
  var doc = MODAL_DOCS[key]; if (!doc) return;
  lastFocus = document.activeElement;
  modalTitle.textContent = doc.title;
  var html = '<p class="modal-sub">' + doc.updated + ' · ' + SITE.name + '</p><ol>';
  doc.items.forEach(function(it){
    html += "<li><b>" + it[0] + "：</b>" + it[1] + "</li>";
  });
  modalBody.innerHTML = html + "</ol>";
  modalBody.scrollTop = 0;
  modalVeil.hidden = false;
  modal.setAttribute("aria-hidden","false");
  document.body.classList.add("modal-open");
  modalX.focus();
}
function closeModal(){
  modalVeil.hidden = true;
  modal.setAttribute("aria-hidden","true");
  document.body.classList.remove("modal-open");
  if (lastFocus && lastFocus.focus) lastFocus.focus();
}
document.querySelectorAll("[data-modal]").forEach(function(b){
  b.addEventListener("click", function(e){ e.preventDefault(); openModal(b.getAttribute("data-modal")); });
});
modalX.addEventListener("click", closeModal);
modalVeil.addEventListener("click", closeModal);
document.addEventListener("keydown", function(e){
  if (e.key !== "Escape") return;
  if (modal.getAttribute("aria-hidden") === "false") closeModal();
  else if (drawer.classList.contains("open")) closeDrawer();
});

/* ---------- 启动 ---------- */
renderSite();
window.addEventListener("load", function(){
  setTimeout(function(){
    document.getElementById("loader").classList.add("done");
    initReveals();
    initParallax();
  }, reduceMotion ? 60 : 650);
});
/* load 迟迟不来时的兜底 */
setTimeout(function(){
  var loader = document.getElementById("loader");
  if (!loader.classList.contains("done")){
    loader.classList.add("done"); initReveals(); initParallax();
  }
}, 3500);
})();

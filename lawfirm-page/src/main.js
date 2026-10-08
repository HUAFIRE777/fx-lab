/* 衡信律师事务所 · 交互（classic script，无模块） */
(function(){
"use strict";

/* ============ SITE 配置变量（一改全改） ============ */
var SITE = {
  name:    "衡信律师事务所",
  phone:   "400-820-XXXX",
  address: "上海市浦东新区陆家嘴环路 1088 号 32 层",
  license: "XXXXXXXXXXXXXXXXXX"
};

/* 法务三件套文案：真实感通用条款 */
var MODAL_DOCS = {
  privacy: {
    title: "隐私政策",
    items: [
      "我们收集的信息仅限于您主动提供的咨询内容：姓名、电话及事项分类，不收集与您咨询无关的个人信息。",
      "您的咨询内容受《律师法》规定的保密义务保护。未经您书面同意，我们不会向任何第三方披露，包括您的身份信息与案情细节。",
      "咨询信息仅用于安排律师回电与跟进服务，不用于广告推送或营销。我们不会将您的电话号码出售、出租给任何机构。",
      "咨询记录在业务系统内加密保存，保存期限为最后一次联系后三年。您可随时要求我们删除您的全部咨询记录。",
      "如您最终委托我们办案，咨询阶段的信息将自动纳入委托保密范围，适用委托代理合同中的保密条款。",
      "本政策更新时，我们会在本页面显著位置公示；继续使用咨询服务即视为您接受更新后的政策。"
    ]
  },
  terms: {
    title: "服务条款",
    items: [
      "免费咨询为初步法律意见，不构成正式的委托代理关系。正式委托需双方签署书面《委托代理合同》后成立。",
      "咨询意见基于您当时提供的信息作出；如实际情况与描述有出入，意见仅供参考，不作为诉讼结果的承诺。",
      "委托费用在签约前以书面形式明确，实行一次性报价或阶段收费，无隐性收费；办案过程中的第三方费用（如诉讼费、鉴定费）实报实销。",
      "您有权随时解除委托。解除后，已完成工作按约定比例结算，未完成部分不再收费，案卷材料完整移交。",
      "因律师故意或重大过失给您造成损失的，我们依法承担赔偿责任；一般执业风险我们会提前书面告知。",
      "双方发生争议，优先协商解决；协商不成的，提交律所所在地有管辖权的人民法院诉讼解决。"
    ]
  },
  cookie: {
    title: "Cookie 政策",
    items: [
      "本网站仅使用维持基本功能所必需的 Cookie，例如记住您的表单填写进度，不使用任何广告追踪类 Cookie。",
      "我们不接入第三方广告联盟，不会通过 Cookie 向广告商共享您的浏览行为。",
      "访问统计采用匿名化方式进行，仅统计页面访问量等汇总数据，无法关联到具体个人。",
      "您可以在浏览器设置中随时清除或禁用 Cookie；禁用后网站核心内容仍可正常浏览，仅表单记忆功能受影响。",
      "如未来引入新的 Cookie 用途，我们会提前更新本政策并重新征求您的同意。",
      "关于 Cookie 的任何疑问，欢迎通过页脚联系方式直接询问我们。"
    ]
  }
};

var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
var finePointer  = window.matchMedia("(pointer: fine)").matches;
var hasGsap = typeof window.gsap !== "undefined";

/* ============ SITE 渲染 ============ */
function renderSite(){
  document.querySelectorAll("[data-site]").forEach(function(el){
    var key = el.getAttribute("data-site");
    if (SITE[key] == null) return;
    if (el.hasAttribute("data-site-tel")) {
      el.textContent = SITE.phone;
      el.setAttribute("href", "tel:" + SITE.phone.replace(/[^0-9+]/g, ""));
    } else {
      el.textContent = SITE[key];
    }
  });
  var line = document.querySelector("[data-site-line] span[data-site]");
  if (line) line.textContent = SITE.phone;
}
renderSite();

/* ============ 加载态 ============ */
var loader = document.getElementById("loader");
function hideLoader(){ if (loader) loader.classList.add("done"); }
window.addEventListener("load", function(){ setTimeout(hideLoader, 350); });
setTimeout(hideLoader, 4000); /* 兜底：load 迟迟不来也不卡死 */

/* ============ 导航滚动态 ============ */
var nav = document.getElementById("nav");
function onScroll(){ nav.classList.toggle("scrolled", window.scrollY > 24); }
window.addEventListener("scroll", onScroll, {passive:true});
onScroll();

/* ============ 移动端抽屉 ============ */
var burger = document.getElementById("burger"),
    drawer = document.getElementById("drawer"),
    veil   = document.getElementById("drawerVeil");
function setDrawer(open){
  burger.classList.toggle("open", open);
  drawer.classList.toggle("open", open);
  veil.classList.toggle("show", open);
  burger.setAttribute("aria-expanded", open ? "true" : "false");
  drawer.setAttribute("aria-hidden", open ? "false" : "true");
  document.body.style.overflow = open ? "hidden" : "";
}
burger.addEventListener("click", function(){
  setDrawer(!drawer.classList.contains("open"));
});
veil.addEventListener("click", function(){ setDrawer(false); });
drawer.querySelectorAll("a").forEach(function(a){
  a.addEventListener("click", function(){ setDrawer(false); });
});

/* ============ Hero 入场编排 ============ */
function heroFallback(){
  /* GSAP 缺失或降级：直接显示，绝不让标题卡在隐藏态 */
  document.querySelectorAll("[data-hero]").forEach(function(el){
    el.style.opacity = "1"; el.style.transform = "none";
  });
  document.querySelectorAll(".hero-title .line-in").forEach(function(el){
    el.style.transform = "none";
  });
}
function playHero(){
  var items = Array.prototype.slice.call(document.querySelectorAll("[data-hero]"));
  var lines = document.querySelectorAll(".hero-title .line-in");
  /* 天平描画：先按实际长度设 dash */
  var paths = document.querySelectorAll("#scaleSvg .draw");
  paths.forEach(function(p){
    try{
      var L = p.getTotalLength();
      p.style.strokeDasharray = L;
      p.style.strokeDashoffset = L;
    }catch(e){}
  });
  if (!hasGsap || reduceMotion) {
    heroFallback();
    paths.forEach(function(p){ p.style.strokeDashoffset = "0"; });
    return;
  }
  /* 注意 GSAP 百分比位移坑：CSS 初值是 translateY(112%)，
     GSAP 会解析为 yPercent=112，直接播 yPercent→0，不碰 y（px），
     播完无残留。data-hero 的 translateY(26px) 是 px，播 y→0 即可。 */
  /* GSAP 百分比位移坑：CSS 的 translateY(112%) 会被 GSAP 解析成 px 残留，
     再叠 yPercent 会双重位移。修法：先 el.style.transform='none' 清掉
     CSS 初值（同一 tick，无闪烁），再 gsap.set yPercent:112，播完无残留。 */
  lines.forEach(function(l){ l.style.transform = "none"; });
  gsap.set(lines, {yPercent:112});
  var tl = gsap.timeline({defaults:{ease:"expo.out"}});
  tl.to(items[0], {opacity:1, y:0, duration:.7}, .15)
    .to(lines, {yPercent:0, duration:1.1, stagger:.12}, .25)
    .to(items.slice(1), {opacity:1, y:0, duration:.8, stagger:.12}, .7)
    .to(paths, {strokeDashoffset:0, duration:1.6, stagger:.09, ease:"power2.inOut"}, .5);
  tl.play();
}
window.addEventListener("load", function(){
  setTimeout(playHero, 420);
  /* 完成态兜底：load 后 3.5s hero 必须可见 */
  setTimeout(function(){
    var badge = document.querySelector(".hero-badge");
    if (badge && getComputedStyle(badge).opacity === "0") heroFallback();
  }, 3500);
});

/* ============ 滚动 reveal ============ */
var revealEls = document.querySelectorAll(".reveal");
function revealAll(){
  revealEls.forEach(function(el){ el.classList.add("is-in"); });
}
if ("IntersectionObserver" in window && !reduceMotion){
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if (en.isIntersecting){ en.target.classList.add("is-in"); io.unobserve(en.target); }
    });
  }, {threshold:.14, rootMargin:"0px 0px -6% 0px"});
  revealEls.forEach(function(el,i){
    el.style.transitionDelay = (i % 4) * 70 + "ms";
    io.observe(el);
  });
  setTimeout(revealAll, 4000); /* 安全网：IO 漏报也不永久隐藏 */
} else {
  revealAll();
}

/* ============ 数据带滚动数字（主视觉动效） ============ */
function fmt(n){ return n >= 1000 ? Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : Math.round(n).toString(); }
function animateCount(el){
  var target = parseFloat(el.getAttribute("data-count"));
  var suffix = el.getAttribute("data-suffix") || "";
  if (reduceMotion){ el.textContent = fmt(target) + suffix; return; }
  var dur = 1800, t0 = null;
  function tick(t){
    if (!t0) t0 = t;
    var p = Math.min((t - t0) / dur, 1);
    var e = 1 - Math.pow(1 - p, 4); /* easeOutQuart：物理感收尾 */
    el.textContent = fmt(target * e) + suffix;
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
var counted = false;
function maybeCount(){
  if (counted) return;
  var stats = document.querySelector(".stats-row");
  if (!stats) return;
  var r = stats.getBoundingClientRect();
  if (r.top < window.innerHeight * .8){
    counted = true;
    document.querySelectorAll("[data-count]").forEach(animateCount);
  }
}
window.addEventListener("scroll", maybeCount, {passive:true});
maybeCount();

/* ============ 领域卡片悬浮微倾（桌面细指针） ============ */
if (hasGsap && finePointer && !reduceMotion){
  document.querySelectorAll("[data-tilt]").forEach(function(card){
    var rx = gsap.quickTo(card, "rotationX", {duration:.5, ease:"power3.out"});
    var ry = gsap.quickTo(card, "rotationY", {duration:.5, ease:"power3.out"});
    card.addEventListener("mousemove", function(e){
      var r = card.getBoundingClientRect();
      var dx = (e.clientX - r.left) / r.width - .5;
      var dy = (e.clientY - r.top) / r.height - .5;
      rx(-dy * 7); ry(dx * 9);
    });
    card.addEventListener("mouseleave", function(){ rx(0); ry(0); });
  });
}

/* ============ 咨询表单 ============ */
var form = document.getElementById("consultForm"),
    formCard = document.getElementById("formCard"),
    formError = document.getElementById("formError"),
    successText = document.getElementById("successText");
form.addEventListener("submit", function(e){
  e.preventDefault();
  var name = document.getElementById("fName").value.trim();
  var phone = document.getElementById("fPhone").value.replace(/[\s-]/g, "");
  var topic = document.getElementById("fTopic").value;
  var err = "";
  if (!name) err = "请填写您的姓名，方便律师称呼您。";
  else if (!/^1\d{10}$/.test(phone)) err = "请填写正确的 11 位手机号码。";
  else if (!topic) err = "请选择咨询事项分类，我们好安排对口律师。";
  formError.textContent = err;
  if (err) return;
  var topicLabel = document.getElementById("fTopic").selectedOptions[0].textContent;
  successText.textContent = name + "，已收到您关于「" + topicLabel + "」的咨询请求，值班律师将在 2 小时内与您联系，请保持电话畅通。";
  formCard.classList.add("success");
});

/* ============ 法务弹窗 ============ */
var modal = document.getElementById("modal"),
    modalVeil = document.getElementById("modalVeil"),
    modalTitle = document.getElementById("modalTitle"),
    modalBody = document.getElementById("modalBody"),
    modalX = document.getElementById("modalX"),
    lastFocus = null;
function openModal(key){
  var doc = MODAL_DOCS[key];
  if (!doc) return;
  lastFocus = document.activeElement;
  modalTitle.textContent = doc.title;
  modalBody.innerHTML = "<ol>" + doc.items.map(function(t){ return "<li>" + t + "</li>"; }).join("") + "</ol>";
  modal.classList.add("show");
  modalVeil.classList.add("show");
  modal.setAttribute("aria-hidden", "false");
  modalVeil.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  modalBody.scrollTop = 0;
  modalX.focus();
}
function closeModal(){
  modal.classList.remove("show");
  modalVeil.classList.remove("show");
  modal.setAttribute("aria-hidden", "true");
  modalVeil.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  if (lastFocus && lastFocus.focus) lastFocus.focus();
}
document.querySelectorAll("[data-modal]").forEach(function(btn){
  btn.addEventListener("click", function(){ openModal(btn.getAttribute("data-modal")); });
});
modalX.addEventListener("click", closeModal);
modalVeil.addEventListener("click", closeModal);
document.addEventListener("keydown", function(e){
  if (e.key === "Escape"){
    if (modal.classList.contains("show")) closeModal();
    else if (drawer.classList.contains("open")) setDrawer(false);
  }
});

})();

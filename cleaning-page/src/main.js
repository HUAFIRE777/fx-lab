/* 净屋 JINGWU · cleaning-page — classic 脚本（无依赖，GSAP 可选增强） */
(function(){
"use strict";
document.documentElement.classList.add("js");

/* ================= 配置 ================= */
var CFG = {
  navOffset: 40,
  revealThreshold: 0.12,
  loaderMin: 650
};

/* 买家改这里，一改全改 */
var SITE = {
  name: "净屋 JINGWU",
  phone: "400-810-7666",
  phoneHref: "tel:4008107666",
  email: "hi@jingwu-home.cn",
  emailHref: "mailto:hi@jingwu-home.cn",
  address: "北京市朝阳区建国路 88 号 SOHO 现代城 A 座 1206",
  hours: "每天 8:00–20:00（节假日不休）",
  icp: "京ICP备2026001234号-1",
  year: "2026"
};

var LEGAL = {
  privacy: {
    title: "隐私政策",
    sub: "最后更新：2026 年 10 月",
    secs: [
      ["我们收集什么", "您预约服务时，我们会收集您的称呼、手机号、服务地址与预约时间。这些信息只用于安排服务者上门与订单回访。"],
      ["我们不收集什么", "我们不读取您的通讯录、相册与位置轨迹。客服电话仅在订单履约期间拨打，完单 30 天后删除通话记录。"],
      ["信息如何保存", "订单信息保存在境内服务器，访问需双人授权。服务者只能看到本次订单必需的地址与联系方式，看不到您的历史订单。"],
      ["您的权利", "您可随时致电 400-810-7666 要求查询、更正或删除您的个人信息，我们在 3 个工作日内处理完毕。"],
      ["未成年人", "本服务面向成年人预约。如您为未成年人，请由监护人代为下单。"],
      ["政策变更", "政策更新后我们会在本页公示 7 天；继续使用预约服务即视为接受新版政策。"]
    ]
  },
  terms: {
    title: "服务条款",
    sub: "最后更新：2026 年 10 月",
    secs: [
      ["下单与确认", "在线提交预约后，我们在 2 小时内电话确认；超时未确认，本次预约自动取消，您无需承担任何费用。"],
      ["价格确认", "服务者上门后先确认服务总价，您点头后再开工。服务中途如需增项，师傅先报价、您确认后再做，不加价、不推销。"],
      ["取消与改期", "上门前 4 小时可免费取消或改期；4 小时内取消收取 30 元空跑费（师傅已出发的成本）。"],
      ["验收与付款", "完工后您逐项验收，满意再付款。验收不合格当场返工，返工仍不达标，本单免单。"],
      ["损坏赔付", "服务中如损坏您的物品，先行赔付：500 元以内 48 小时到账，超 500 元走保险理赔，全程客服跟进。"],
      ["争议解决", "协商不成的，提交净屋所在地人民法院诉讼解决。"]
    ]
  },
  cookies: {
    title: "Cookie 政策",
    sub: "最后更新：2026 年 10 月",
    secs: [
      ["我们用什么 Cookie", "仅使用维持页面正常运行的必要 Cookie（如记住您选择的城市、表单草稿），不做跨站追踪。"],
      ["统计类", "我们用自建的匿名统计看哪些页面受欢迎，不关联您的手机号与地址，数据保留 90 天。"],
      ["第三方", "本页面不接入第三方广告 SDK，您的浏览行为不会被分享给广告公司。"],
      ["如何管理", "您可在浏览器设置中清除或禁用 Cookie；禁用后预约表单仍可正常使用。"],
      ["联系我们", "关于 Cookie 的任何疑问，致电 400-810-7666，我们 3 个工作日内答复。"]
    ]
  }
};

/* ================= SITE 变量渲染 ================= */
document.querySelectorAll("[data-site]").forEach(function(el){
  var k = el.getAttribute("data-site");
  if (SITE[k] !== undefined) el.textContent = SITE[k];
});
document.querySelectorAll("[data-site-href]").forEach(function(el){
  var k = el.getAttribute("data-site-href");
  if (SITE[k + "Href"]) el.setAttribute("href", SITE[k + "Href"]);
});

/* ================= 加载态 ================= */
var loader = document.getElementById("loader");
var heroSection = document.querySelector(".hero");
var t0 = Date.now();
function finishLoad(){
  var wait = Math.max(0, CFG.loaderMin - (Date.now() - t0));
  setTimeout(function(){
    loader.classList.add("done");
    heroSection.classList.add("hero-play");
  }, wait);
}
if (document.readyState === "complete") finishLoad();
else window.addEventListener("load", finishLoad);
/* 兜底：load 迟迟不来也不卡死 */
setTimeout(function(){ if(!loader.classList.contains("done")) finishLoad(); }, 4000);

/* ================= 导航 ================= */
var nav = document.getElementById("nav");
function onScroll(){ nav.classList.toggle("scrolled", window.scrollY > CFG.navOffset); }
window.addEventListener("scroll", onScroll, {passive:true});
onScroll();

var burger = document.getElementById("burger");
var mMenu = document.getElementById("mMenu");
function setMenu(open){
  mMenu.classList.toggle("open", open);
  mMenu.setAttribute("aria-hidden", open ? "false" : "true");
  burger.setAttribute("aria-expanded", open ? "true" : "false");
  document.body.classList.toggle("locked", open);
}
burger.addEventListener("click", function(){
  setMenu(!mMenu.classList.contains("open"));
});
mMenu.querySelectorAll("a").forEach(function(a){
  a.addEventListener("click", function(){ setMenu(false); });
});

/* ================= 滚动 reveal ================= */
var revealEls = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window){
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if (e.isIntersecting){
        var sibs = Array.prototype.slice.call(e.target.parentNode.children)
          .filter(function(c){ return c.classList && c.classList.contains("reveal"); });
        e.target.style.transitionDelay = (sibs.indexOf(e.target) % 4 * 0.08) + "s";
        e.target.classList.add("in");
        io.unobserve(e.target);
      }
    });
  }, {threshold: CFG.revealThreshold, rootMargin: "0px 0px -8% 0px"});
  revealEls.forEach(function(el){ io.observe(el); });
  // 安全网：4 秒后还没点亮的，一律点亮（防 IO 漏报）
  setTimeout(function(){
    document.querySelectorAll(".reveal:not(.in)").forEach(function(el){ el.classList.add("in"); });
  }, 4000);
} else {
  revealEls.forEach(function(el){ el.classList.add("in"); });
}

/* ================= Hero：擦拭扫光主视觉 ================= */
var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
var roomLabel = document.getElementById("roomLabel");
function setLabel(t){ if (roomLabel) roomLabel.textContent = t; }

if (window.gsap && !reduced){
  var grimeBase = [0.28, 0.24, 0.22, 0.20];
  var tl = gsap.timeline({repeat: -1, repeatDelay: 0.5, defaults:{ease:"power2.inOut"}});
  tl.call(function(){ setLabel("擦拭中…"); }, null, 0.55)
    .fromTo("#grime .gr",
      {opacity: function(i){ return grimeBase[i] || 0.2; }},
      {opacity: 0.03, duration: 1.7, stagger: 0.09}, 0.7)
    .fromTo("#wipe", {x: -40, opacity: 0}, {opacity: 1, duration: 0.3}, 0.6)
    .to("#wipe", {x: 620, duration: 2.1}, 0.75)
    .to("#wipe", {opacity: 0, duration: 0.4}, 2.75)
    .fromTo("#sparkles", {opacity: 0}, {opacity: 1, duration: 0.4}, 2.5)
    .fromTo("#sparkles .spk",
      {scale: 0, transformOrigin: "50% 50%"},
      {scale: 1, duration: 0.55, ease: "back.out(2.2)", stagger: 0.1}, 2.55)
    .call(function(){ setLabel("焕然一新"); }, null, 3.1)
    .to("#sparkles", {opacity: 0, duration: 0.5}, 4.1)
    .to("#dust .mo", {y: -14, opacity: 0.25, duration: 2.2, stagger: 0.25, ease: "sine.inOut"}, 0.5)
    .fromTo("#rays", {opacity: 0.35}, {opacity: 0.6, duration: 2.4, yoyo: true, repeat: 1, ease: "sine.inOut"}, 0);
} else {
  /* 无 GSAP 或减少动态：直接呈现完成态 */
  setLabel("焕然一新");
  var g = document.getElementById("grime");
  if (g) g.setAttribute("opacity", "0.15");
  var sp = document.getElementById("sparkles");
  if (sp) sp.setAttribute("opacity", "1");
}

/* 房间卡片桌面端轻微视差 */
var roomCard = document.getElementById("roomCard");
if (roomCard && window.matchMedia("(pointer:fine)").matches && !reduced && window.gsap){
  var rx = gsap.quickTo(roomCard, "rotationX", {duration: 0.6, ease: "power2.out"});
  var ry = gsap.quickTo(roomCard, "rotationY", {duration: 0.6, ease: "power2.out"});
  roomCard.addEventListener("mousemove", function(e){
    var r = roomCard.getBoundingClientRect();
    ry(((e.clientX - r.left) / r.width - 0.5) * 7);
    rx(-((e.clientY - r.top) / r.height - 0.5) * 7);
  });
  roomCard.addEventListener("mouseleave", function(){ rx(0); ry(0); });
}

/* ================= 预约表单 ================= */
var form = document.getElementById("bookForm");
var done = document.getElementById("bookDone");
var bookBtn = document.getElementById("bookBtn");
var fDate = document.getElementById("fDate");
(function(){
  var d = new Date();
  var iso = d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0");
  fDate.setAttribute("min", iso);
})();

/* 服务卡片直达：预选服务类型 */
document.querySelectorAll("[data-svc]").forEach(function(a){
  a.addEventListener("click", function(){
    var sel = document.getElementById("fSvc");
    var v = a.getAttribute("data-svc");
    var exists = Array.prototype.some.call(sel.options, function(o){ return o.text === v; });
    if (exists) sel.value = v;
  });
});

function setFieldState(input, ok, msg){
  var field = input.closest(".field");
  var err = field.querySelector(".err");
  field.classList.toggle("invalid", !ok);
  if (err){
    if (msg) err.textContent = msg;
    if (ok) err.setAttribute("hidden", ""); else err.removeAttribute("hidden");
  }
  return ok;
}
["fSvc","fDate","fTime","fAddr","fName","fPhone"].forEach(function(id){
  var el = document.getElementById(id);
  el.addEventListener("input", function(){ setFieldState(el, true); });
  el.addEventListener("change", function(){ setFieldState(el, true); });
});

form.addEventListener("submit", function(e){
  e.preventDefault();
  var ok = true;
  var svc = document.getElementById("fSvc");
  var time = document.getElementById("fTime");
  var addr = document.getElementById("fAddr");
  var name = document.getElementById("fName");
  var phone = document.getElementById("fPhone");

  ok = setFieldState(svc, !!svc.value) && ok;
  ok = setFieldState(fDate, !!fDate.value) && ok;
  ok = setFieldState(time, !!time.value) && ok;
  ok = setFieldState(addr, addr.value.trim().length >= 4) && ok;
  ok = setFieldState(name, name.value.trim().length >= 1) && ok;
  ok = setFieldState(phone, /^1\d{10}$/.test(phone.value.trim()), "请填写正确的 11 位手机号") && ok;
  if (!ok){
    var firstBad = form.querySelector(".field.invalid input, .field.invalid select");
    if (firstBad) firstBad.focus();
    return;
  }

  bookBtn.disabled = true;
  bookBtn.querySelector(".btn-label").textContent = "提交中…";
  bookBtn.querySelector(".btn-spin").removeAttribute("hidden");

  setTimeout(function(){
    var no = "JW-" + Math.floor(1000 + Math.random()*9000);
    document.getElementById("doneNo").textContent = no;
    document.getElementById("doneDesc").textContent =
      "已为您预约" + svc.value + "（" + fDate.value + " " + time.value + "）。我们将在 2 小时内致电 " +
      phone.value.trim() + " 确认，请保持手机畅通。";
    form.setAttribute("hidden", "");
    done.removeAttribute("hidden");
    done.scrollIntoView({behavior: reduced ? "auto" : "smooth", block: "center"});
  }, 900);
});
document.getElementById("bookAgain").addEventListener("click", function(){
  done.setAttribute("hidden", "");
  form.removeAttribute("hidden");
  form.reset();
  bookBtn.disabled = false;
  bookBtn.querySelector(".btn-label").textContent = "提交预约";
  bookBtn.querySelector(".btn-spin").setAttribute("hidden", "");
});

/* ================= 法务弹窗 ================= */
var modal = document.getElementById("legalModal");
var legalTitle = document.getElementById("legalTitle");
var legalBody = document.getElementById("legalBody");
var legalX = document.getElementById("legalX");
var lastFocus = null;

function openLegal(key){
  var doc = LEGAL[key];
  if (!doc) return;
  lastFocus = document.activeElement;
  legalTitle.textContent = doc.title;
  legalBody.innerHTML = "";
  var sub = document.createElement("p");
  sub.className = "modal-sub";
  sub.textContent = doc.sub;
  legalBody.appendChild(sub);
  doc.secs.forEach(function(s){
    var h = document.createElement("h4");
    h.textContent = s[0];
    var p = document.createElement("p");
    p.textContent = s[1];
    legalBody.appendChild(h);
    legalBody.appendChild(p);
  });
  modal.removeAttribute("hidden");
  document.body.classList.add("locked");
  legalX.focus();
}
function closeLegal(){
  modal.setAttribute("hidden", "");
  document.body.classList.remove("locked");
  if (lastFocus && lastFocus.focus) lastFocus.focus();
}
document.querySelectorAll("[data-legal]").forEach(function(el){
  el.addEventListener("click", function(e){
    e.preventDefault();
    openLegal(el.getAttribute("data-legal"));
  });
});
legalX.addEventListener("click", closeLegal);
modal.querySelector("[data-close]").addEventListener("click", closeLegal);
document.addEventListener("keydown", function(e){
  if (e.key === "Escape" && !modal.hasAttribute("hidden")) closeLegal();
});

})();

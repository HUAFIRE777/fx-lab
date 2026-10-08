/* 玖光 JOAILLERIE · jewelry-page —— 原创脚本（无外部库）
   配置区在顶部：SITE / LEGAL / CFG，买家只改这里。 */
(function () {
  "use strict";
  document.documentElement.classList.add("js");

  /* ============ 配置 ============ */
  var SITE = {
    name: "玖光珠宝有限公司",
    phone: "400-820-9616",
    phoneHref: "tel:4008209616",
    wechat: "jiuguang-joaillerie",
    address: "上海市静安区南京西路 1266 号恒隆广场 2 座 8 层",
    city: "上海",
    icp: "沪ICP备2026166600号-1",
    year: "2026"
  };

  var LEGAL = {
    privacy: {
      title: "隐私政策",
      points: [
        "我们收集的信息仅限于你主动留下的预约鉴赏信息：姓名、电话、意向系列，以及你与顾问沟通时提供的内容。",
        "这些信息只用于预约确认与到店接待安排，不会出售、出租或提供给任何第三方营销机构。",
        "你在店内试戴、定制过程中产生的影像资料，未经你书面同意，不会用于任何公开宣传。",
        "你可以随时通过官方电话或微信要求查看、更正、删除你的个人信息，我们会在 7 个工作日内处理完毕。",
        "网站仅使用必要的 Cookie 维持页面正常显示，不做跨站追踪，不接入第三方广告统计。"
      ]
    },
    terms: {
      title: "服务条款",
      points: [
        "预约鉴赏成功后，顾问将在 24 小时内与你确认到店时间；每位客人享有一对一专属接待时段 60 分钟。",
        "高级定制需支付定金（定制总价的 30%）后启动设计；设计稿经你签字确认后进入制作，制作中途不可更改款式。",
        "定制周期为 8–12 周；因你方原因取消定制，定金不予退还，已采购的裸石按实际结算归你所有。",
        "所有售出珠宝享终身免费保养（含清洗、抛光、爪镶紧固检查）；人为损坏的维修按工费表收取成本费。",
        "官网标价为含税人民币参考价，门店实际售价以当日金价与钻石报价为准，顾问会在下单前与你逐项确认。"
      ]
    },
    cookies: {
      title: "Cookie 政策",
      points: [
        "我们使用 Cookie 记住你的偏好，例如上次浏览的系列，方便你下次直接继续挑选。",
        "我们也会用匿名的访问统计了解哪些页面更受欢迎，以此改进网站内容，不关联你的个人身份。",
        "你可以在浏览器设置中随时清除或禁用 Cookie；禁用后网站仍可正常浏览，只是偏好不会被记住。",
        "我们不使用第三方广告 Cookie，不做跨网站的用户画像与精准投放。",
        "继续使用本网站，即表示你理解并接受以上 Cookie 使用方式。"
      ]
    }
  };

  var CFG = {
    navOffset: 40,        // 导航毛玻璃触发距离 px
    revealThreshold: 0.12,
    loaderMin: 900,       // 加载态最短展示 ms
    countDur: 1400        // 数字滚动时长 ms
  };

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ============ SITE 变量渲染 ============ */
  function renderSite() {
    var els = document.querySelectorAll("[data-site]");
    for (var i = 0; i < els.length; i++) {
      var k = els[i].getAttribute("data-site");
      if (SITE[k] !== undefined) els[i].textContent = SITE[k];
    }
    var hrefs = document.querySelectorAll("[data-site-href]");
    for (var j = 0; j < hrefs.length; j++) {
      var hk = hrefs[j].getAttribute("data-site-href");
      if (SITE[hk] !== undefined) hrefs[j].setAttribute("href", SITE[hk]);
    }
  }

  /* ============ 加载态（完成态必达） ============ */
  var loaderDone = false;
  function finishLoad() {
    if (loaderDone) return;
    loaderDone = true;
    var l = document.getElementById("loader");
    if (l) l.classList.add("done");
    document.body.classList.add("loaded"); // 触发 hero 标题升起
  }
  var t0 = Date.now();
  window.addEventListener("load", function () {
    var wait = Math.max(0, CFG.loaderMin - (Date.now() - t0));
    setTimeout(finishLoad, wait);
  });
  setTimeout(finishLoad, 4000); // 兜底

  /* ============ 导航滚动毛玻璃 ============ */
  var nav = document.getElementById("nav");
  function onScroll() {
    if (window.scrollY > CFG.navOffset) nav.classList.add("scrolled");
    else nav.classList.remove("scrolled");
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ============ 移动端抽屉 ============ */
  var burger = document.getElementById("burger");
  var drawer = document.getElementById("drawer");
  var drawerMask = document.getElementById("drawerMask");
  function setDrawer(open) {
    drawer.classList.toggle("open", open);
    drawerMask.classList.toggle("open", open);
    drawer.setAttribute("aria-hidden", open ? "false" : "true");
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.classList.toggle("locked", open);
  }
  burger.addEventListener("click", function () { setDrawer(!drawer.classList.contains("open")); });
  document.getElementById("drawerX").addEventListener("click", function () { setDrawer(false); });
  drawerMask.addEventListener("click", function () { setDrawer(false); });
  var dLinks = drawer.querySelectorAll("a");
  for (var d = 0; d < dLinks.length; d++) {
    dLinks[d].addEventListener("click", function () { setDrawer(false); });
  }

  /* ============ 滚动 reveal + stagger ============ */
  var io = null;
  if ("IntersectionObserver" in window && !reduceMotion) {
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
          if (e.target.classList.contains("num")) runCount(e.target);
        }
      });
    }, { threshold: CFG.revealThreshold });
    var revs = document.querySelectorAll(".reveal");
    for (var r = 0; r < revs.length; r++) io.observe(revs[r]);
  } else {
    // 无 IO 或减弱动效：直达终态（完成态必达）
    var all = document.querySelectorAll(".reveal");
    for (var q = 0; q < all.length; q++) {
      all[q].classList.add("in");
      if (all[q].classList.contains("num")) setCountFinal(all[q]);
    }
  }

  /* ============ 数字滚动 ============ */
  function setCountFinal(numEl) {
    var el = numEl.querySelector(".count");
    if (el) el.textContent = el.getAttribute("data-to");
  }
  function runCount(numEl) {
    var el = numEl.querySelector(".count");
    if (!el || el.dataset.done) return;
    el.dataset.done = "1";
    var to = parseInt(el.getAttribute("data-to"), 10) || 0;
    var start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min(1, (ts - start) / CFG.countDur);
      var eased = 1 - Math.pow(1 - p, 4); // easeOutQuart，慢而稳
      el.textContent = Math.round(to * eased);
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = to;
    }
    requestAnimationFrame(step);
  }

  /* ============ 法务弹窗（X / 遮罩 / ESC 关） ============ */
  var modal = document.getElementById("legalModal");
  var mTitle = document.getElementById("legalTitle");
  var mList = document.getElementById("legalList");
  var lastFocus = null;
  function openLegal(key) {
    var doc = LEGAL[key];
    if (!doc) return;
    lastFocus = document.activeElement;
    mTitle.textContent = doc.title;
    mList.innerHTML = "";
    doc.points.forEach(function (p) {
      var li = document.createElement("li");
      li.textContent = p;
      mList.appendChild(li);
    });
    modal.hidden = false;
    requestAnimationFrame(function () { modal.classList.add("open"); });
    document.body.classList.add("locked");
    var x = modal.querySelector(".modal-x");
    if (x) x.focus();
  }
  function closeLegal() {
    modal.classList.remove("open");
    document.body.classList.remove("locked");
    setTimeout(function () { modal.hidden = true; }, 450);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  var legalBtns = document.querySelectorAll("[data-legal]");
  for (var b = 0; b < legalBtns.length; b++) {
    (function (btn) {
      btn.addEventListener("click", function (ev) {
        ev.preventDefault();
        openLegal(btn.getAttribute("data-legal"));
      });
    })(legalBtns[b]);
  }
  var closers = modal.querySelectorAll("[data-close]");
  for (var c = 0; c < closers.length; c++) closers[c].addEventListener("click", closeLegal);
  document.addEventListener("keydown", function (ev) {
    if (ev.key === "Escape" && modal.classList.contains("open")) closeLegal();
    if (ev.key === "Escape" && drawer.classList.contains("open")) setDrawer(false);
  });

  /* ============ 预约表单 ============ */
  var form = document.getElementById("visitForm");
  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var name = form.name.value.trim();
    var tel = form.tel.value.trim();
    if (!name) { form.name.focus(); return; }
    if (!/^1\d{10}$/.test(tel)) { form.tel.focus(); form.tel.style.borderColor = "#c0392b"; return; }
    form.tel.style.borderColor = "";
    var ok = form.querySelector(".form-ok");
    ok.hidden = false;
    ok.scrollIntoView({ block: "nearest", behavior: reduceMotion ? "auto" : "smooth" });
    form.querySelector("button[type=submit]").disabled = true;
  });

  renderSite();
})();

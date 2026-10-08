/* ============ 远行 travel-page · 交互 ============
   零外部依赖。买家配置只改 SITE / LEGAL 两处。
================================================ */
(function () {
  "use strict";

  /* ---------- 配置：买家改这里，一改全改 ---------- */
  var SITE = {
    name: "远行旅行社",
    phone: "400-880-7666",
    phoneHref: "tel:4008807666",
    email: "hello@yuanxing-trip.com",
    mailtoHref: "mailto:hello@yuanxing-trip.com",
    address: "上海市静安区南京西路 1266 号恒隆广场 2 期 1808 室",
    icp: "沪ICP备2026000000号-1",
    year: "2026"
  };

  var LEGAL = {
    privacy: {
      title: "隐私政策",
      points: [
        "我们收集的信息：为完成预订与出行服务，我们会收集您的姓名、联系电话、身份证件信息（仅用于购买保险与门票实名制）以及出行偏好。所有信息均在您主动填写或授权后获取。",
        "信息的使用：收集的信息仅用于行程安排、保险购买、紧急联络与售后服务。我们不会将您的个人信息出售、出租给任何第三方。",
        "信息的保存：您的订单信息保存于境内服务器，保存期限为订单完成后 3 年，到期自动匿名化处理。您可随时联系客服要求提前删除。",
        "Cookie 的使用：本站使用必要的 Cookie 维持页面功能（如记住您的搜索条件），详见《Cookie 政策》。拒绝非必要 Cookie 不影响浏览。",
        "未成年人保护：未满 14 周岁的出行人信息，须由监护人代为提供并确认，我们不会主动向未成年人营销。",
        "您的权利：您有权查询、更正、删除自己的个人信息，致电 400-880-7666（每天 9:00–21:00），我们将在 15 个工作日内响应。"
      ]
    },
    terms: {
      title: "服务条款",
      points: [
        "预订与付款：线路产品以官网实时库存为准，名额按付款成功顺序锁定。定金为总价的 30%，余款须在出发前 7 天付清，逾期未付视为自动放弃，定金不退。",
        "取消与退款：出发前 15 天以上取消，退还全部已付款项；7–15 天取消，扣除总价 30% 作为已发生的预订损失；7 天以内取消，扣除总价 60%。不可抗力（自然灾害、政策管制等）导致无法出行，全额退款或免费改期二选一。",
        "行程变更：因天气、交通等不可抗力需调整行程时，领队有权在保障安全的前提下变更景点顺序或替换同级景点，差价多退少补，并第一时间告知全团。",
        "出行人义务：请携带有效身份证件，按集合时间准时到达；高原、海岛等特殊线路请如实申报健康状况，隐瞒病情导致意外的，责任自负。",
        "责任边界：我们为每位出行人购买旅游意外险（保额 50 万元）。因出行人个人行为、自由活动时间发生的意外，超出保险赔付的部分由出行人自行承担。",
        "争议解决：因本条款产生的争议，双方先友好协商；协商不成的，提交我们住所地（上海市静安区）人民法院诉讼解决。"
      ]
    },
    cookies: {
      title: "Cookie 政策",
      points: [
        "什么是 Cookie：Cookie 是网站存在您浏览器中的小文本文件，用来记住您的偏好，让下次访问更顺手。它们不含病毒，也不会读取您设备上的其他文件。",
        "我们用的两类 Cookie：必要型（维持搜索条、弹窗状态等基础功能，关掉网站就用不了）；统计型（匿名统计哪些线路被看得最多，帮我们优化页面）。",
        "我们不用广告追踪 Cookie：本站不接入任何第三方广告联盟，不存在跨站追踪您的浏览行为用于广告投放的 Cookie。",
        "如何管理：您可以在浏览器设置中随时清除或禁用 Cookie。禁用必要型 Cookie 后，搜索条的记忆功能将失效，但浏览不受影响。",
        "有效期：统计型 Cookie 有效期 13 个月，到期自动失效；您也可以随时手动清除，清除后我们重新开始匿名计数。"
      ]
    }
  };

  var CFG = {
    navOffset: 24,       // 导航毛玻璃触发距离 px
    revealThreshold: 0.12,
    loaderMin: 650,      // 加载态最短展示 ms
    toastMs: 4200,
    maxGuests: 20
  };

  var doc = document;
  var htmlEl = doc.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- SITE 变量渲染 ---------- */
  function renderSite() {
    var els = doc.querySelectorAll("[data-site]");
    for (var i = 0; i < els.length; i++) {
      var key = els[i].getAttribute("data-site");
      if (SITE[key] !== undefined) els[i].textContent = SITE[key];
    }
    var links = doc.querySelectorAll("[data-site-href]");
    for (var j = 0; j < links.length; j++) {
      var k = links[j].getAttribute("data-site-href");
      if (SITE[k] !== undefined) links[j].setAttribute("href", SITE[k]);
    }
  }

  /* ---------- Toast ---------- */
  var toast = doc.getElementById("toast");
  var toastText = doc.getElementById("toastText");
  var toastTimer = null;
  function showToast(msg) {
    if (!toast || !toastText) return;
    toastText.textContent = msg;
    toast.classList.add("show");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove("show"); }, CFG.toastMs);
  }

  /* ---------- 加载态 → hero 入场 ---------- */
  var loader = doc.getElementById("loader");
  var loaderFill = doc.getElementById("loaderFill");
  var hero = doc.getElementById("hero");
  var loadStart = Date.now();
  function finishLoad() {
    var wait = Math.max(0, CFG.loaderMin - (Date.now() - loadStart));
    setTimeout(function () {
      if (loader) loader.classList.add("done");
      if (hero) hero.classList.add("in");
    }, reduceMotion ? 0 : wait);
  }
  if (loaderFill) {
    var p = 0;
    var tick = setInterval(function () {
      p = Math.min(92, p + 18);
      loaderFill.style.width = p + "%";
      if (p >= 92) clearInterval(tick);
    }, 120);
  }
  if (doc.readyState === "complete") finishLoad();
  else window.addEventListener("load", finishLoad);
  // 兜底：3 秒内必达完成态（加载事件异常也不卡死）
  setTimeout(function () {
    if (loader) loader.classList.add("done");
    if (hero) hero.classList.add("in");
  }, 3000);

  /* ---------- 导航滚动毛玻璃 ---------- */
  var nav = doc.getElementById("nav");
  function onScroll() {
    if (!nav) return;
    if (window.scrollY > CFG.navOffset) nav.classList.add("scrolled");
    else nav.classList.remove("scrolled");
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- 移动端抽屉 ---------- */
  var burger = doc.getElementById("burger");
  var drawer = doc.getElementById("drawer");
  var drawerMask = doc.getElementById("drawerMask");
  var drawerClose = doc.getElementById("drawerClose");
  function openDrawer() {
    if (!drawer) return;
    drawer.classList.add("open");
    if (drawerMask) drawerMask.classList.add("open");
    drawer.setAttribute("aria-hidden", "false");
    if (burger) burger.setAttribute("aria-expanded", "true");
    doc.body.style.overflow = "hidden";
  }
  function closeDrawer() {
    if (!drawer) return;
    drawer.classList.remove("open");
    if (drawerMask) drawerMask.classList.remove("open");
    drawer.setAttribute("aria-hidden", "true");
    if (burger) burger.setAttribute("aria-expanded", "false");
    doc.body.style.overflow = "";
  }
  if (burger) burger.addEventListener("click", openDrawer);
  if (drawerClose) drawerClose.addEventListener("click", closeDrawer);
  if (drawerMask) drawerMask.addEventListener("click", closeDrawer);
  if (drawer) {
    var dLinks = drawer.querySelectorAll("a");
    for (var di = 0; di < dLinks.length; di++) dLinks[di].addEventListener("click", closeDrawer);
  }

  /* ---------- 搜索条 ---------- */
  var stepVal = doc.getElementById("stepVal");
  var guests = 2;
  function paintGuests() { if (stepVal) stepVal.textContent = guests + " 位"; }
  var minus = doc.getElementById("stepMinus");
  var plus = doc.getElementById("stepPlus");
  if (minus) minus.addEventListener("click", function () { if (guests > 1) { guests--; paintGuests(); } });
  if (plus) plus.addEventListener("click", function () { if (guests < CFG.maxGuests) { guests++; paintGuests(); } });
  paintGuests();

  var sbDate = doc.getElementById("sbDate");
  var sbDest = doc.getElementById("sbDest");
  if (sbDate) {
    var t = new Date();
    var mm = String(t.getMonth() + 1).padStart(2, "0");
    var dd = String(t.getDate()).padStart(2, "0");
    sbDate.min = t.getFullYear() + "-" + mm + "-" + dd;
  }
  var searchbar = doc.getElementById("searchbar");
  if (searchbar) {
    searchbar.addEventListener("submit", function (e) {
      e.preventDefault();
      var dest = sbDest && sbDest.value.trim() ? sbDest.value.trim() : "任意目的地";
      var dateStr = "时间灵活";
      if (sbDate && sbDate.value) {
        var parts = sbDate.value.split("-");
        dateStr = parts[1] + "月" + parts[2] + "日";
      }
      showToast("收到！「" + dest + "」· " + dateStr + " 出发 · " + guests + " 位——旅行顾问将在 24 小时内联系你。");
    });
  }
  var ctaChat = doc.getElementById("ctaChat");
  if (ctaChat) ctaChat.addEventListener("click", function () {
    showToast("旅行顾问在线（9:00–21:00），平均 40 秒内响应。演示站暂未接入真实客服系统。");
  });

  /* ---------- 滚动 stagger 入场 ---------- */
  function assignDelays() {
    var groups = doc.querySelectorAll("[data-rv-group]");
    for (var g = 0; g < groups.length; g++) {
      var kids = groups[g].querySelectorAll("[data-rv]");
      for (var k = 0; k < kids.length; k++) {
        if (!kids[k].style.getPropertyValue("--d")) {
          kids[k].style.setProperty("--d", (k * 0.09).toFixed(2) + "s");
        }
      }
    }
  }
  assignDelays();
  var revealEls = doc.querySelectorAll("[data-rv]");
  /* ---------- 滚动 stagger 入场 ----------
     主力：scroll/resize + getBoundingClientRect 判定（全环境确定可用，
     无头 Chromium 的 IntersectionObserver 不触发，故不用 IO）。
     兜底：4 秒内全部到达完成态。 */
  function revealCheck() {
    var vh = window.innerHeight || 800;
    for (var i = 0; i < revealEls.length; i++) {
      var el = revealEls[i];
      if (el.classList.contains("in")) continue;
      var rect = el.getBoundingClientRect();
      if (rect.top < vh * 0.88 && rect.bottom > 0) el.classList.add("in");
    }
  }
  var revealTick = false;
  function onRevealScroll() {
    if (revealTick) return;
    revealTick = true;
    requestAnimationFrame(function () { revealTick = false; revealCheck(); });
  }
  window.addEventListener("scroll", onRevealScroll, { passive: true });
  window.addEventListener("resize", onRevealScroll);
  revealCheck();
  // 兜底：IO 异常时 4 秒内全部到达完成态
  setTimeout(function () {
    for (var i = 0; i < revealEls.length; i++) revealEls[i].classList.add("in");
  }, 4000);

  /* ---------- 目的地卡片 hover 视差（仅可 hover 设备） ---------- */
  var canHover = window.matchMedia("(hover:hover)").matches;
  if (canHover && !reduceMotion) {
    var cards = doc.querySelectorAll(".dest-card");
    for (var c = 0; c < cards.length; c++) {
      (function (card) {
        var raf = null;
        card.addEventListener("pointermove", function (e) {
          if (raf) return;
          raf = requestAnimationFrame(function () {
            raf = null;
            var rect = card.getBoundingClientRect();
            var x = (e.clientX - rect.left) / rect.width - 0.5;
            var y = (e.clientY - rect.top) / rect.height - 0.5;
            card.style.setProperty("--ry", (x * 7).toFixed(2) + "deg");
            card.style.setProperty("--rx", (-y * 7).toFixed(2) + "deg");
            card.style.setProperty("--px", (x * -14).toFixed(1) + "px");
            card.style.setProperty("--py", (y * -14).toFixed(1) + "px");
          });
        });
        card.addEventListener("pointerleave", function () {
          card.style.setProperty("--rx", "0deg");
          card.style.setProperty("--ry", "0deg");
          card.style.setProperty("--px", "0px");
          card.style.setProperty("--py", "0px");
        });
      })(cards[c]);
    }
  }

  /* ---------- 线路横滑按钮 ---------- */
  var rail = doc.getElementById("rail");
  var prev = doc.getElementById("railPrev");
  var next = doc.getElementById("railNext");
  function railBy(dir) {
    if (!rail) return;
    rail.scrollBy({ left: dir * 360, behavior: reduceMotion ? "auto" : "smooth" });
  }
  if (prev) prev.addEventListener("click", function () { railBy(-1); });
  if (next) next.addEventListener("click", function () { railBy(1); });

  /* ---------- 法务弹窗 ---------- */
  var modal = doc.getElementById("legalModal");
  var legalTitle = doc.getElementById("legalTitle");
  var legalBody = doc.getElementById("legalBody");
  var legalClose = doc.getElementById("legalClose");
  var legalMask = doc.getElementById("legalMask");
  var legalOk = doc.getElementById("legalOk");
  var lastFocus = null;
  function openLegal(key) {
    var data = LEGAL[key];
    if (!data || !modal) return;
    lastFocus = doc.activeElement;
    legalTitle.textContent = data.title;
    legalBody.innerHTML = "";
    var ol = doc.createElement("ol");
    for (var i = 0; i < data.points.length; i++) {
      var li = doc.createElement("li");
      li.textContent = data.points[i];
      ol.appendChild(li);
    }
    legalBody.appendChild(ol);
    legalBody.scrollTop = 0;
    modal.classList.add("open");
    doc.body.style.overflow = "hidden";
    if (legalClose) legalClose.focus();
  }
  function closeLegal() {
    if (!modal) return;
    modal.classList.remove("open");
    doc.body.style.overflow = "";
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  var legalLinks = doc.querySelectorAll("[data-legal]");
  for (var l = 0; l < legalLinks.length; l++) {
    (function (btn) {
      btn.addEventListener("click", function () { openLegal(btn.getAttribute("data-legal")); });
    })(legalLinks[l]);
  }
  if (legalClose) legalClose.addEventListener("click", closeLegal);
  if (legalMask) legalMask.addEventListener("click", closeLegal);
  if (legalOk) legalOk.addEventListener("click", closeLegal);
  doc.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      if (modal && modal.classList.contains("open")) closeLegal();
      closeDrawer();
    }
  });

  /* ---------- 启动 ---------- */
  renderSite();
})();

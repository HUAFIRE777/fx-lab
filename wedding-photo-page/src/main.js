/* 拾光婚礼影像 · wedding-photo-page —— 原创脚本（无外部库）
   配置区在顶部：SITE / LEGAL / CFG，买家只改这里。 */
(function () {
  "use strict";
  document.documentElement.classList.add("js");

  /* ============ 配置 ============ */
  var SITE = {
    name: "拾光婚礼影像",
    phone: "138-5812-6688",
    phoneHref: "tel:13858126688",
    wechat: "shiguang-wedding",
    address: "杭州市西湖区留和路 318 号拾光小院",
    icp: "浙ICP备2026888818号-1",
    year: "2026"
  };

  var LEGAL = {
    privacy: {
      title: "隐私政策",
      points: [
        "我们收集的信息仅限于你主动留下的预约信息：姓名、电话、婚期、城市，以及你与我们沟通时提供的内容。",
        "这些信息只用于档期确认与拍摄沟通，不会出售、出租或分享给任何第三方营销机构。",
        "你的婚礼照片与视频，未经你书面同意，我们不会用于任何公开宣传（包括官网案例与社交媒体）。",
        "你可以随时通过工作室电话或微信要求查看、更正、删除你的个人信息，我们会在 7 个工作日内处理完毕。",
        "网站仅使用必要的 Cookie 维持页面正常显示（如记住你上次查看的档期月份），不做跨站追踪。"
      ]
    },
    terms: {
      title: "服务条款",
      points: [
        "预约成功后，顾问会在 24 小时内与你确认档期；口头预留保留 48 小时，逾期未付定金视为自动放弃。",
        "定金为套餐总价的 30%，支付后档期正式锁定；因新人方原因取消，定金不予退还，可改期一次（提前 30 天告知）。",
        "因天气等不可抗力导致旅拍无法进行，我们免费改期一次；已产生的差旅费用按实际结算。",
        "所有套餐均含精修底片全送；精修不满意可免费重修一次，重修后仍不满意可按比例退款（最高退 20%）。",
        "成片交付周期：跟拍 30 天、旅拍 45 天、全案定制 60 天；加急交付需另行约定费用。"
      ]
    },
    cookies: {
      title: "Cookie 政策",
      points: [
        "我们使用 Cookie 记住你的偏好设置，例如上次查看的档期月份，方便你下次直接继续浏览。",
        "我们也会用匿名的访问统计了解哪些页面更受欢迎，以此改进网站内容，不关联你的个人身份。",
        "你可以在浏览器设置中随时清除或禁用 Cookie；禁用后网站仍可正常浏览，只是偏好设置不会被记住。",
        "我们不使用第三方广告 Cookie，不做跨网站的用户画像与精准投放。",
        "继续使用本网站，即表示你理解并接受以上 Cookie 使用方式。"
      ]
    }
  };

  var CFG = {
    navOffset: 40,        // 导航毛玻璃触发距离 px
    revealThreshold: 0.12,
    loaderMin: 700,       // 加载态最短展示 ms
    staggerMax: 0.5       // 瀑布流 stagger 上限 s
  };

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ============ SITE 变量渲染 ============ */
  function renderSite() {
    var els = document.querySelectorAll("[data-site]");
    for (var i = 0; i < els.length; i++) {
      var k = els[i].getAttribute("data-site");
      if (SITE[k] !== undefined) els[i].textContent = SITE[k];
    }
    var hs = document.querySelectorAll("[data-site-href]");
    for (var j = 0; j < hs.length; j++) {
      var hk = hs[j].getAttribute("data-site-href");
      if (SITE[hk] !== undefined) hs[j].setAttribute("href", SITE[hk]);
    }
  }
  renderSite();

  /* ============ 加载态 → hero 入场 ============ */
  var t0 = Date.now();
  function ready() {
    var wait = Math.max(0, CFG.loaderMin - (Date.now() - t0));
    setTimeout(function () {
      document.body.classList.add("ready");
      observeReveals();
    }, reduceMotion ? 0 : wait);
  }
  if (document.readyState === "complete") ready();
  else window.addEventListener("load", ready);
  // 兜底：load 事件 4 秒没来也放行（完成态必须可达）
  setTimeout(function () {
    if (!document.body.classList.contains("ready")) {
      document.body.classList.add("ready");
      observeReveals();
    }
  }, 4000);

  /* ============ 导航毛玻璃 ============ */
  var nav = document.getElementById("nav");
  function onScroll() {
    if (window.scrollY > CFG.navOffset) nav.classList.add("scrolled");
    else nav.classList.remove("scrolled");
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ============ 移动端抽屉 ============ */
  var burger = document.getElementById("burger");
  var mMenu = document.getElementById("mMenu");
  function setMenu(open) {
    burger.classList.toggle("open", open);
    mMenu.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    mMenu.setAttribute("aria-hidden", open ? "false" : "true");
    document.body.style.overflow = open ? "hidden" : "";
  }
  burger.addEventListener("click", function () {
    setMenu(!mMenu.classList.contains("open"));
  });
  mMenu.addEventListener("click", function (e) {
    if (e.target.closest("a")) setMenu(false);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && mMenu.classList.contains("open")) setMenu(false);
  });

  /* ============ 滚动 reveal（瀑布流 stagger 主视觉） ============ */
  var observed = false;
  function observeReveals() {
    if (observed) return;
    observed = true;
    var shots = document.querySelectorAll(".masonry .shot");
    for (var i = 0; i < shots.length; i++) {
      var d = Math.min((i % 3) * 0.12 + Math.floor(i / 3) * 0.08, CFG.staggerMax);
      shots[i].style.setProperty("--sd", d.toFixed(2) + "s");
    }
    var items = document.querySelectorAll(".reveal");
    if (reduceMotion || !("IntersectionObserver" in window)) {
      for (var k = 0; k < items.length; k++) items[k].classList.add("in");
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("in");
          io.unobserve(en.target);
        }
      });
    }, { threshold: CFG.revealThreshold, rootMargin: "0px 0px -6% 0px" });
    for (var m = 0; m < items.length; m++) io.observe(items[m]);
  }

  /* ============ 套餐按钮 → 表单联动 ============ */
  var planSelect = document.getElementById("planSelect");
  var planBtns = document.querySelectorAll("[data-plan]");
  for (var p = 0; p < planBtns.length; p++) {
    planBtns[p].addEventListener("click", function () {
      planSelect.value = this.getAttribute("data-plan");
    });
  }

  /* ============ 档期日历 ============ */
  var calGrid = document.getElementById("calGrid");
  var calTitle = document.getElementById("calTitle");
  var cur = new Date();
  var viewY = cur.getFullYear(), viewM = cur.getMonth();

  // 确定性伪随机：同一月份每次渲染状态一致
  function seeded(n) {
    var x = (n * 9301 + 49297) % 233280;
    return x / 233280;
  }
  function statusOf(y, m, d) {
    var r = seeded(y * 372 + m * 31 + d);
    if (r < 0.34) return "busy";
    if (r < 0.48) return "hold";
    return "ok";
  }
  function renderCal() {
    calTitle.textContent = viewY + " 年 " + (viewM + 1) + " 月";
    var first = new Date(viewY, viewM, 1);
    var startDay = (first.getDay() + 6) % 7; // 周一起
    var days = new Date(viewY, viewM + 1, 0).getDate();
    var html = "";
    for (var i = 0; i < startDay; i++) html += '<span class="cal-day dim"></span>';
    for (var d = 1; d <= days; d++) {
      var st = statusOf(viewY, viewM + 1, d);
      var today = (viewY === cur.getFullYear() && viewM === cur.getMonth() && d === cur.getDate()) ? " today" : "";
      html += '<span class="cal-day ' + st + today + '" role="gridcell">' + d + "</span>";
    }
    calGrid.innerHTML = html;
  }
  document.getElementById("calPrev").addEventListener("click", function () {
    viewM--; if (viewM < 0) { viewM = 11; viewY--; }
    renderCal();
  });
  document.getElementById("calNext").addEventListener("click", function () {
    viewM++; if (viewM > 11) { viewM = 0; viewY++; }
    renderCal();
  });
  renderCal();
  // 可预约日期点击 → 带到表单
  calGrid.addEventListener("click", function (e) {
    var t = e.target.closest(".cal-day.ok");
    if (!t) return;
    var dateInput = document.querySelector('input[name="date"]');
    var mm = String(viewM + 1).padStart(2, "0");
    var dd = String(t.textContent).padStart(2, "0");
    dateInput.value = viewY + "-" + mm + "-" + dd;
    dateInput.focus();
  });

  /* ============ 预约表单 ============ */
  var form = document.getElementById("bookForm");
  var formErr = document.getElementById("formErr");
  var bookCard = form.closest(".book-card");
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = form.name.value.trim();
    var phone = form.phone.value.trim();
    var date = form.date.value;
    var city = form.city.value.trim();
    var err = "";
    if (!name) err = "请留下新人姓名，方便我们称呼你。";
    else if (!/^1\d{10}$/.test(phone)) err = "手机号好像不对，请检查一下（11 位数字）。";
    else if (!date) err = "请选择婚期，方便我们为你查档期。";
    else if (!city) err = "请填写举办城市，旅拍需要提前规划行程。";
    if (err) {
      formErr.textContent = err;
      return;
    }
    formErr.textContent = "";
    var no = "SG" + String(Date.now()).slice(-6);
    document.getElementById("bookNo").textContent = no;
    bookCard.classList.add("sent");
  });
  document.getElementById("bookAgain").addEventListener("click", function () {
    bookCard.classList.remove("sent");
    form.reset();
  });

  /* ============ 法务弹窗 ============ */
  var modal = document.getElementById("legalModal");
  var legalTitle = document.getElementById("legalTitle");
  var legalBody = document.getElementById("legalBody");
  var lastFocus = null;
  function openLegal(key) {
    var doc = LEGAL[key];
    if (!doc) return;
    legalTitle.textContent = doc.title;
    var ol = document.createElement("ol");
    doc.points.forEach(function (pt) {
      var li = document.createElement("li");
      li.textContent = pt;
      ol.appendChild(li);
    });
    legalBody.innerHTML = "";
    legalBody.appendChild(ol);
    lastFocus = document.activeElement;
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    modal.querySelector(".modal-x").focus();
  }
  function closeLegal() {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  var legalBtns = document.querySelectorAll("[data-legal]");
  for (var l = 0; l < legalBtns.length; l++) {
    legalBtns[l].addEventListener("click", function () {
      openLegal(this.getAttribute("data-legal"));
    });
  }
  modal.addEventListener("click", function (e) {
    if (e.target.closest("[data-close]")) closeLegal();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && modal.classList.contains("open")) closeLegal();
  });
})();

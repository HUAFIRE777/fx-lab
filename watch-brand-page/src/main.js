/* 玖时 JIU TIME · watch-brand-page —— 原创脚本（无外部库）
   配置区在顶部：SITE / LEGAL / MODELS / CFG，买家只改这里。 */
(function () {
  "use strict";
  document.documentElement.classList.add("js");

  /* ============ 配置 ============ */
  var SITE = {
    name: "玖时表业有限公司",
    phone: "400-820-2016",
    phoneHref: "tel:4008202016",
    address: "上海市静安区南京西路 1266 号恒隆广场 2 座 8 层",
    email: "service@jiutime.cn",
    icp: "沪ICP备2026166600号-2",
    year: "2026"
  };

  var LEGAL = {
    privacy: {
      title: "隐私政策",
      points: [
        "我们只收集你主动留下的预约信息：姓名、电话、意向门店，不多要一项。",
        "这些信息仅用于预约确认与到店接待，不出售、不出租、不提供给任何第三方做营销。",
        "你在店内试戴时拍摄的照片或视频，未经你书面同意，不会出现在任何公开渠道。",
        "你随时可以打官方电话要求查看、更正或删除你的个人信息，我们在 7 个工作日内处理完。",
        "网站不做跨站追踪，不接第三方广告统计，Cookie 只用来记住你的浏览偏好。"
      ]
    },
    terms: {
      title: "服务条款",
      points: [
        "预约品鉴成功后，顾问会在 24 小时内与你确认到店时间，每位客人享有 60 分钟一对一接待。",
        "机芯保修五年，表壳表带保修两年；人为损坏的维修只收工费，不收品牌溢价。",
        "官网标价为含税人民币参考价，门店实际售价以当日金价为准，顾问下单前会逐项跟你确认。",
        "终身免费保养每年可预约一次，含清洗、走时检测与抛光翻新，需提前 3 天预约。",
        "以旧换新按专业机构当年估价抵扣，估价单会当面给你看，不玩暗箱。"
      ]
    },
    cookies: {
      title: "Cookie 政策",
      points: [
        "我们用 Cookie 记住你的偏好，比如上次看到哪个系列，方便下次接着看。",
        "匿名的访问统计帮我们知道哪些页面更受欢迎，以此改进内容，不关联你的身份。",
        "你可以在浏览器设置里随时清除或禁用 Cookie，禁用后网站照常浏览，只是偏好记不住。",
        "我们不使用第三方广告 Cookie，不做跨站画像与精准投放。",
        "继续使用本网站，即表示你理解并接受以上 Cookie 使用方式。"
      ]
    }
  };

  var MODELS = {
    obsidian: {
      en: "OBSIDIAN", name: "曜 · 曜黑", dial: "#141416", marker: "#c8a45e",
      desc: "黑得发亮的盘面，是给夜里赶路的人准备的。夜光刻度吸饱白天的光，凌晨三点依然清晰。",
      price: "¥58,800",
      specs: [["表径", "41 mm"], ["机芯", "Cal.JT-9001 自动上链"], ["动力储备", "72 小时"],
              ["振频", "21,600 次 / 小时"], ["防水", "10 ATM"], ["表带", "黑色橡胶 / 精钢链"]]
    },
    dawn: {
      en: "DAWN", name: "辰 · 晨曦", dial: "#f2ecdd", marker: "#8a6d3f",
      desc: "象牙白盘面，温润不抢戏。配棕色小牛皮表带，见客户时衬衫袖口露出来刚刚好。",
      price: "¥52,800",
      specs: [["表径", "39 mm"], ["机芯", "Cal.JT-9001 自动上链"], ["动力储备", "72 小时"],
              ["振频", "21,600 次 / 小时"], ["防水", "5 ATM"], ["表带", "棕色小牛皮"]]
    },
    gilt: {
      en: "GILT", name: "溯 · 鎏金", dial: "#b08d4a", marker: "#2e2313",
      desc: "整块盘面做了鎏金处理，光一转，纹路就跟着走。适合那些已经不需要向任何人证明什么的人。",
      price: "¥76,800",
      specs: [["表径", "41 mm"], ["机芯", "Cal.JT-9002 月相"], ["动力储备", "120 小时"],
              ["振频", "28,800 次 / 小时"], ["防水", "5 ATM"], ["表带", "金色米兰尼斯"]]
    }
  };

  var CFG = {
    navOffset: 40,        // 导航毛玻璃触发距离 px
    loaderMin: 900,       // 加载态最短展示 ms
    loaderMax: 4000,      // 加载态兜底放行 ms（完成态必达）
    lensScale: 2.5,       // 机芯放大镜倍数
    countDur: 1500        // 数字滚动时长 ms
  };

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function $(id) { return document.getElementById(id); }

  /* ============ 页脚 SITE 注入（一改全改） ============ */
  (function injectSite() {
    var p = $("footPhone"); if (p) { p.textContent = SITE.phone; p.href = SITE.phoneHref; }
    var a = $("footAddr"); if (a) a.textContent = SITE.address;
    var m = $("footMail"); if (m) { m.textContent = SITE.email; m.href = "mailto:" + SITE.email; }
    var n = $("footName"); if (n) n.textContent = SITE.name;
    var y = $("footYear"); if (y) y.textContent = SITE.year;
    var icp = $("footIcp"); if (icp) icp.textContent = SITE.icp;
  })();

  /* ============ 加载态 + hero 入场 ============ */
  var loaderDone = false;
  function finishLoad() {
    if (loaderDone) return;
    loaderDone = true;
    $("loader").classList.add("done");
    var hero = document.querySelector("[data-hero]");
    if (hero) hero.classList.add("is-in");
  }
  var t0 = Date.now();
  window.addEventListener("load", function () {
    var wait = Math.max(0, CFG.loaderMin - (Date.now() - t0));
    setTimeout(finishLoad, wait);
  });
  setTimeout(finishLoad, CFG.loaderMax); // 兜底：完成态必达

  /* ============ 表盘刻度生成 ============ */
  function buildMarkers(gid, color) {
    var g = $(gid);
    if (!g) return;
    var ns = "http://www.w3.org/2000/svg";
    g.innerHTML = "";
    for (var i = 0; i < 12; i++) {
      var r = document.createElementNS(ns, "rect");
      r.setAttribute("x", "194"); r.setAttribute("y", "62");
      r.setAttribute("width", "12"); r.setAttribute("height", "30");
      r.setAttribute("rx", "2"); r.setAttribute("fill", color);
      r.setAttribute("transform", "rotate(" + (i * 30) + " 200 200)");
      g.appendChild(r);
    }
  }
  buildMarkers("heroMarkers", "#c8a45e");
  buildMarkers("modelMarkers", "#c8a45e");

  /* ============ 实时走时 ============ */
  function setHands(prefix, d) {
    var h = d.getHours() % 12 + d.getMinutes() / 60;
    var m = d.getMinutes() + d.getSeconds() / 60;
    var s = d.getSeconds() + d.getMilliseconds() / 1000;
    var hh = $(prefix + "Hour"), mm = $(prefix + "Min"), ss = $(prefix + "Sec");
    if (hh) hh.setAttribute("transform", "rotate(" + (h * 30) + " 200 200)");
    if (mm) mm.setAttribute("transform", "rotate(" + (m * 6) + " 200 200)");
    if (ss) ss.setAttribute("transform", "rotate(" + (s * 6) + " 200 200)");
  }
  if (reduceMotion) {
    setHands("hand", new Date());
  } else {
    (function tick() {
      setHands("hand", new Date());
      requestAnimationFrame(tick);
    })();
  }
  // 系列预览表固定在 10:08:42（广告表经典时刻）
  (function () {
    var d = new Date(); d.setHours(10, 8, 42, 0);
    setHands("mHand", d);
  })();

  /* ============ 导航 ============ */
  var nav = $("nav");
  function onScroll() {
    nav.classList.toggle("scrolled", window.scrollY > CFG.navOffset);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ============ 移动端抽屉 ============ */
  var burger = $("burger"), drawer = $("drawer"), scrim = $("scrim");
  function openDrawer() {
    drawer.classList.add("open");
    drawer.setAttribute("aria-hidden", "false");
    scrim.hidden = false;
    burger.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
  }
  function closeDrawer() {
    drawer.classList.remove("open");
    drawer.setAttribute("aria-hidden", "true");
    scrim.hidden = true;
    burger.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }
  burger.addEventListener("click", function () {
    drawer.classList.contains("open") ? closeDrawer() : openDrawer();
  });
  $("drawerX").addEventListener("click", closeDrawer);
  scrim.addEventListener("click", closeDrawer);
  drawer.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", closeDrawer);
  });

  /* ============ 系列切换 ============ */
  var tabs = Array.prototype.slice.call(document.querySelectorAll(".tab"));
  function selectModel(key) {
    var M = MODELS[key];
    if (!M) return;
    tabs.forEach(function (t) {
      var on = t.getAttribute("data-model") === key;
      t.classList.toggle("on", on);
      t.setAttribute("aria-selected", on ? "true" : "false");
    });
    $("modelDial").setAttribute("fill", M.dial);
    buildMarkers("modelMarkers", M.marker);
    $("modelEn").textContent = M.en;
    $("modelName").textContent = M.name;
    $("modelDesc").textContent = M.desc;
    $("modelPrice").textContent = M.price;
    var ul = $("specList");
    ul.innerHTML = "";
    M.specs.forEach(function (s) {
      var li = document.createElement("li");
      var b = document.createElement("b"); b.textContent = s[0];
      var sp = document.createElement("span"); sp.textContent = s[1];
      li.appendChild(b); li.appendChild(sp);
      ul.appendChild(li);
    });
  }
  tabs.forEach(function (t) {
    t.addEventListener("click", function () { selectModel(t.getAttribute("data-model")); });
  });
  selectModel("obsidian");

  /* ============ 滚动入场 ============ */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
    // 安全网：4 秒后还没点亮的，一律点亮（防 IO 漏报）
    setTimeout(function () {
      document.querySelectorAll(".reveal:not(.in)").forEach(function (el) { el.classList.add("in"); });
    }, 4000);
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ============ 数字滚动 ============ */
  function countUp(el) {
    var to = parseInt(el.getAttribute("data-to"), 10) || 0;
    if (reduceMotion) { el.textContent = to.toLocaleString("en-US"); return; }
    var start = null;
    function frame(ts) {
      if (!start) start = ts;
      var p = Math.min(1, (ts - start) / CFG.countDur);
      var e = 1 - Math.pow(1 - p, 4); // easeOutQuart
      el.textContent = Math.round(to * e).toLocaleString("en-US");
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  var counters = document.querySelectorAll(".count");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { countUp(e.target); cio.unobserve(e.target); }
      });
    }, { threshold: 0.4 });
    counters.forEach(function (el) { cio.observe(el); });
  } else {
    counters.forEach(countUp);
  }

  /* ============ 机芯图：日内瓦纹 + 齿轮 + 螺丝 ============ */
  (function buildMovement() {
    var ns = "http://www.w3.org/2000/svg";
    var gg = $("gears"), sc = $("screws"), gv = $("geneva");
    if (!gg || !sc || !gv) return;

    // 日内瓦波浪纹（装饰底纹）
    for (var i = 0; i < 9; i++) {
      var w = document.createElementNS(ns, "path");
      w.setAttribute("d", "M40 " + (60 + i * 38) + " Q 180 " + (30 + i * 38) + " 320 " + (60 + i * 38) +
        " T 560 " + (60 + i * 38));
      w.setAttribute("fill", "none");
      w.setAttribute("stroke", "#c8a45e");
      w.setAttribute("stroke-width", "7");
      w.setAttribute("opacity", ".1");
      gv.appendChild(w);
    }

    function gear(cx, cy, r, teeth, rev) {
      var g = document.createElementNS(ns, "g");
      g.setAttribute("class", "gear" + (rev ? " rev" : ""));
      var pts = [];
      for (var i = 0; i < teeth * 2; i++) {
        var a = (i / (teeth * 2)) * Math.PI * 2;
        var rr = (i % 2 === 0) ? r : r * 0.88;
        pts.push((cx + rr * Math.cos(a)).toFixed(1) + "," + (cy + rr * Math.sin(a)).toFixed(1));
      }
      var poly = document.createElementNS(ns, "polygon");
      poly.setAttribute("points", pts.join(" "));
      poly.setAttribute("fill", "#1e1e23");
      poly.setAttribute("stroke", "#c8a45e");
      poly.setAttribute("stroke-width", "2.5");
      g.appendChild(poly);
      for (var s = 0; s < 4; s++) {
        var sp = document.createElementNS(ns, "rect");
        sp.setAttribute("x", (cx - 5).toFixed(1)); sp.setAttribute("y", (cy - r * 0.8).toFixed(1));
        sp.setAttribute("width", "10"); sp.setAttribute("height", (r * 1.6).toFixed(1));
        sp.setAttribute("rx", "5"); sp.setAttribute("fill", "#c8a45e"); sp.setAttribute("opacity", ".75");
        sp.setAttribute("transform", "rotate(" + (s * 45) + " " + cx + " " + cy + ")");
        g.appendChild(sp);
      }
      var hub = document.createElementNS(ns, "circle");
      hub.setAttribute("cx", cx); hub.setAttribute("cy", cy);
      hub.setAttribute("r", (r * 0.22).toFixed(1));
      hub.setAttribute("fill", "#0d0d0f");
      hub.setAttribute("stroke", "#c8a45e"); hub.setAttribute("stroke-width", "2.5");
      g.appendChild(hub);
      gg.appendChild(g);
    }
    gear(170, 170, 62, 18, false);
    gear(300, 130, 40, 14, true);
    gear(400, 230, 52, 16, false);
    gear(240, 290, 34, 12, true);
    gear(470, 320, 26, 10, false);

    function screw(cx, cy) {
      var c = document.createElementNS(ns, "circle");
      c.setAttribute("cx", cx); c.setAttribute("cy", cy); c.setAttribute("r", "11");
      c.setAttribute("fill", "#232328");
      c.setAttribute("stroke", "#c8a45e"); c.setAttribute("stroke-width", "2");
      sc.appendChild(c);
      var slot = document.createElementNS(ns, "line");
      slot.setAttribute("x1", cx - 7); slot.setAttribute("y1", cy);
      slot.setAttribute("x2", cx + 7); slot.setAttribute("y2", cy);
      slot.setAttribute("stroke", "#c8a45e"); slot.setAttribute("stroke-width", "2.4");
      slot.setAttribute("transform", "rotate(" + ((cx * 7 + cy * 13) % 90) + " " + cx + " " + cy + ")");
      sc.appendChild(slot);
    }
    screw(96, 130); screw(268, 76); screw(508, 176); screw(150, 330); screw(360, 348);
  })();

  /* ============ 放大镜 ============ */
  (function lens() {
    var wrap = $("plateWrap"), lensEl = $("lens"), inner = $("lensInner");
    var plate = $("plateSvg");
    if (!wrap || !lensEl || !inner || !plate) return;
    if (window.matchMedia("(hover: none)").matches) return; // 触屏不启用
    var R = 95, S = CFG.lensScale, clone = null;
    function ensureClone() {
      if (clone) return;
      clone = plate.cloneNode(true);
      clone.querySelectorAll("[id]").forEach(function (n) { n.removeAttribute("id"); });
      inner.appendChild(clone);
    }
    wrap.addEventListener("mouseenter", function () {
      ensureClone();
      var w = plate.getBoundingClientRect().width;
      clone.setAttribute("width", w * S);
      clone.setAttribute("height", (w * S * 420 / 600).toFixed(1));
      lensEl.hidden = false;
    });
    wrap.addEventListener("mousemove", function (ev) {
      var r = plate.getBoundingClientRect();
      var x = ev.clientX - r.left, y = ev.clientY - r.top;
      var wr = wrap.getBoundingClientRect();
      lensEl.style.left = (ev.clientX - wr.left) + "px";
      lensEl.style.top = (ev.clientY - wr.top) + "px";
      inner.style.transform = "translate(" + (-(x * S - R)) + "px," + (-(y * S - R)) + "px)";
    });
    wrap.addEventListener("mouseleave", function () { lensEl.hidden = true; });
  })();

  /* ============ 预约表单 ============ */
  (function form() {
    var f = $("visitForm");
    if (!f) return;
    var err = $("formErr"), ok = $("formOk");
    f.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var name = f.name.value.trim();
      var phone = f.phone.value.trim();
      var store = f.store.value;
      err.hidden = true; ok.hidden = true;
      if (!name) {
        err.textContent = "请留下你的称呼，顾问好知道怎么叫你。";
        err.hidden = false; f.name.focus(); return;
      }
      if (!/^1\d{10}$/.test(phone)) {
        err.textContent = "手机号好像不对，请检查一下 11 位数字。";
        err.hidden = false; f.phone.focus(); return;
      }
      $("formOkText").textContent = "谢谢" + name + "，" + store +
        "的顾问将在 24 小时内与你联系，确认到店时间。";
      ok.hidden = false;
      f.querySelectorAll("input,select,button[type=submit]").forEach(function (el) {
        el.disabled = true;
      });
    });
  })();

  /* ============ 法务弹窗 ============ */
  var modal = $("modal"), mScrim = $("modalScrim");
  function openLegal(key) {
    var L = LEGAL[key];
    if (!L) return;
    $("modalTitle").textContent = L.title;
    var ol = $("modalList");
    ol.innerHTML = "";
    L.points.forEach(function (p) {
      var li = document.createElement("li");
      li.textContent = p;
      ol.appendChild(li);
    });
    modal.hidden = false;
    mScrim.hidden = false;
    document.body.style.overflow = "hidden";
    $("modalX").focus();
  }
  function closeLegal() {
    modal.hidden = true;
    mScrim.hidden = true;
    document.body.style.overflow = "";
  }
  document.querySelectorAll("[data-legal]").forEach(function (b) {
    b.addEventListener("click", function () { openLegal(b.getAttribute("data-legal")); });
  });
  $("modalX").addEventListener("click", closeLegal);
  mScrim.addEventListener("click", closeLegal);
  document.addEventListener("keydown", function (ev) {
    if (ev.key === "Escape" && !modal.hidden) closeLegal();
    if (ev.key === "Escape" && drawer.classList.contains("open")) closeDrawer();
  });
})();

/* 造宅 · 全案整装 — interior-page 交互
   classic script。GSAP 仅用于报价数字滚动（文本补间，无 transform 位移）。
   渐进增强：无 JS 时所有文字内容直接可见（隐藏态只在 .js 下生效）。 */
(function () {
  "use strict";

  /* ============ 配置参数 ============ */
  var CFG = {
    navOffset: 40,            // 导航毛玻璃触发距离(px)
    revealThreshold: 0.12,    // 滚动 reveal 触发阈值
    loaderMin: 650,           // 加载态最短展示(ms)
    numDuration: 0.8          // 报价数字滚动时长(s)
  };
  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ============ 站点信息（买家改这里，一改全改） ============ */
  var SITE = {
    name: "造宅整装",
    address: "上海市闵行区申长路 988 号 3 楼",
    phone: "400-820-7758",
    phoneHref: "tel:4008207758",
    email: "hello@zaozhai.com",
    mailtoHref: "mailto:hello@zaozhai.com",
    hours: "周一至周日 9:00–21:00",
    icp: "沪ICP备xxxxxxxxxx号-1",
    year: "2026"
  };

  /* ============ 法务三件套文案（真实感通用条款） ============ */
  var LEGAL = {
    privacy: { title: "隐私政策", points: [
      ["我们收集哪些信息", "预约量房时您留下的称呼、手机号码、房屋面积与小区；浏览网站时产生的设备型号与访问记录。不收集与装修咨询无关的信息。"],
      ["信息用来做什么", "安排设计师与您确认上门时间、生成报价测算方案、发送工地进度通知。不会用于推销其他产品，也不会群发短信。"],
      ["我们不出售您的信息", "不会出售、出租您的个人信息。仅在您要求开具发票等场景下，经您明确同意后提供给必要的第三方。"],
      ["信息保存多久", "咨询记录保存 24 个月，到期做匿名化处理；签约客户的合同资料按法律要求保存。您可随时来信要求提前删除。"],
      ["您的权利", "您有权查阅、更正、删除自己的个人信息。来信至页脚邮箱，我们在 3 个工作日内回复处理。"],
      ["未成年人保护", "本网站不面向 14 周岁以下儿童收集信息；如发现误收集，我们会第一时间删除。"]
    ]},
    terms: { title: "服务条款", points: [
      ["免费量房范围", "免费上门量房、平面布局建议与报价测算，不收取任何费用。设计师上门不推销，方案您先看，满意再谈签约。"],
      ["报价说明", "本站计算器基于本市 2026 年市场均价估算，仅供参考。签约以免费量房后的设计方案与书面合同为准；签约价即结算价，合同外增项全额赔付。"],
      ["施工与工期", "工地 24 小时视频直播，项目经理每日播报进度；每个节点由您验收签字后再收下一笔款。延期按合同约定赔付。"],
      ["质保承诺", "隐蔽工程保修 5 年，整体保修 2 年，终身维护。报修后 48 小时内上门。"],
      ["预约取消与改期", "量房预约可提前 24 小时免费改期或取消，来电或回复短信即可，无需理由。"],
      ["争议解决", "服务争议优先协商解决；协商不成，可向消费者协会投诉，或向合同约定地人民法院提起诉讼。"]
    ]},
    cookies: { title: "Cookie 政策", points: [
      ["Cookie 是什么", "Cookie 是网站存在您浏览器里的小文本文件，用来记住您的偏好，让下次访问更顺手。"],
      ["我们用 Cookie 做什么", "记住报价计算器里您选的面积、户型与档次，下次打开不用重新选；统计页面访问情况，帮我们把网站做得更好用。"],
      ["我们不用什么", "本站不接入第三方广告 Cookie，不做跨站追踪，不会因为您看过报价就去别处给您推广告。"],
      ["如何管理", "您可以在浏览器设置里查看、清除或禁用 Cookie。禁用后测算参数将无法记忆，但不影响正常浏览。"],
      ["联系我们", "关于 Cookie 的任何问题，欢迎来信至页脚邮箱，我们在 3 个工作日内回复。"]
    ]}
  };

  /* ============ SITE 渲染 ============ */
  function renderSite() {
    var els = document.querySelectorAll("[data-site]");
    for (var i = 0; i < els.length; i++) {
      var k = els[i].getAttribute("data-site");
      if (SITE[k] !== undefined) els[i].textContent = SITE[k];
    }
    var links = document.querySelectorAll("[data-site-href]");
    for (var j = 0; j < links.length; j++) {
      var hk = links[j].getAttribute("data-site-href");
      if (SITE[hk]) links[j].setAttribute("href", SITE[hk]);
    }
  }

  /* ============ 程序化场景（零外部图片） ============
     三色几何室内示意：暖灰 #2E2A26 / 亚麻 #EFE9DD / 赭石 #C17A3D */
  var INK = "#2E2A26", PAPER = "#EFE9DD", CLAY = "#C17A3D";
  function R(x, y, w, h, f, rx) {
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h +
      '" fill="' + f + '"' + (rx ? ' rx="' + rx + '"' : '') + '/>';
  }
  function C(cx, cy, r, f) {
    return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + f + '"/>';
  }
  function E(cx, cy, rx, ry, f) {
    return '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="' + f + '"/>';
  }
  function roomBase() {
    // 亚麻墙面 + 暖灰地面 + 地平线
    return R(0, 0, 800, 600, PAPER) + R(0, 440, 800, 160, INK, 0)
      + R(0, 440, 800, 6, CLAY, 0);
  }
  function window_(x, y, w, h) {
    return R(x, y, w, h, "#F7F2E8", 6)
      + C(x + w * 0.68, y + h * 0.3, 34, CLAY)
      + R(x + w / 2 - 4, y, 8, h, INK, 0) + R(x, y + h / 2 - 4, w, 8, INK, 0)
      + R(x - 8, y - 8, w + 16, h + 16, "none", 10).replace('fill="none"', 'fill="none" stroke="' + INK + '" stroke-width="10"');
  }
  function sofa(x, y, s) {
    return '<g transform="translate(' + x + ',' + y + ') scale(' + s + ')">'
      + R(-130, -60, 260, 70, INK, 18) + R(-150, -20, 300, 60, INK, 16)
      + R(-150, -34, 46, 74, INK, 14) + R(104, -34, 46, 74, INK, 14)
      + R(-108, -52, 100, 44, CLAY, 12) + R(8, -52, 100, 44, CLAY, 12)
      + R(-14, 40, 14, 26, INK, 0) + R(120, 40, 14, 26, INK, 0) + "</g>";
  }
  function lamp(x, y, s) {
    return '<g transform="translate(' + x + ',' + y + ') scale(' + s + ')">'
      + R(-5, -190, 10, 190, INK, 5) + E(0, 0, 44, 10, INK)
      + '<path d="M-52,-190 L52,-190 L34,-132 L-34,-132 Z" fill="' + CLAY + '"/></g>';
  }
  function plant(x, y, s) {
    return '<g transform="translate(' + x + ',' + y + ') scale(' + s + ')">'
      + '<path d="M-34,0 L34,0 L24,52 L-24,52 Z" fill="' + CLAY + '"/>'
      + E(-30, -56, 20, 44, INK) + E(28, -62, 22, 48, INK) + E(0, -84, 20, 40, INK) + "</g>";
  }
  function pendant(x, y, len) {
    return R(x - 2, y, 4, len, INK, 0) + C(x, y + len + 18, 20, CLAY);
  }
  var SCENES = {
    living: function () {
      return roomBase() + window_(70, 90, 220, 260) + E(400, 500, 190, 26, CLAY)
        + sofa(400, 400, 1) + lamp(660, 440, 1) + plant(120, 440, 1.1)
        + R(560, 120, 90, 120, INK, 4) + R(572, 132, 66, 40, CLAY, 2);
    },
    bedroom: function () {
      return roomBase() + window_(520, 90, 200, 240)
        + R(120, 330, 340, 110, INK, 14) + R(120, 300, 340, 60, PAPER, 14)
        + R(120, 300, 340, 60, "none", 14).replace('fill="none"', 'fill="none" stroke="' + INK + '" stroke-width="8"')
        + R(150, 250, 80, 60, CLAY, 14) + R(250, 250, 80, 60, CLAY, 14)
        + R(100, 210, 380, 26, INK, 10)
        + pendant(300, 0, 120) + E(300, 500, 150, 22, CLAY) + plant(660, 440, 0.9);
    },
    kitchen: function () {
      return roomBase()
        + R(60, 120, 680, 200, INK, 8) + R(60, 320, 680, 26, PAPER, 0)
        + R(120, 160, 120, 120, CLAY, 4) + R(280, 160, 200, 120, PAPER, 4) + R(520, 160, 160, 120, CLAY, 4)
        + R(280, 380, 240, 90, INK, 8) + R(270, 360, 260, 24, CLAY, 6)
        + pendant(340, 0, 150) + pendant(470, 0, 150)
        + R(60, 470, 60, 90, INK, 6) + R(680, 470, 60, 90, INK, 6) + plant(80, 440, 0.8);
    },
    dining: function () {
      return roomBase() + window_(90, 100, 190, 240)
        + C(400, 90, 26, CLAY) + R(398, 0, 4, 64, INK, 0)
        + E(400, 380, 190, 44, INK) + R(392, 380, 16, 90, INK, 0) + E(400, 480, 90, 12, INK)
        + R(180, 400, 70, 90, CLAY, 10) + R(550, 400, 70, 90, CLAY, 10)
        + R(196, 490, 38, 10, INK, 0) + R(566, 490, 38, 10, INK, 0)
        + E(400, 340, 60, 14, CLAY) + plant(680, 440, 1);
    },
    study: function () {
      return roomBase() + window_(560, 90, 170, 240)
        + R(90, 90, 300, 40, INK, 6) + R(90, 150, 300, 40, INK, 6) + R(90, 210, 300, 40, INK, 6)
        + R(110, 96, 26, 28, CLAY, 2) + R(142, 96, 26, 28, INK, 2) + R(174, 96, 26, 28, CLAY, 2)
        + R(110, 156, 60, 28, CLAY, 2) + R(110, 216, 40, 28, INK, 2)
        + R(440, 360, 260, 30, INK, 8) + R(450, 390, 20, 90, INK, 0) + R(670, 390, 20, 90, INK, 0)
        + R(520, 300, 110, 70, PAPER, 4) + R(520, 300, 110, 70, "none", 4).replace('fill="none"', 'fill="none" stroke="' + INK + '" stroke-width="8"')
        + R(560, 390, 60, 80, CLAY, 12) + lamp(200, 440, 0.85);
    },
    bath: function () {
      var tiles = "";
      for (var i = 0; i < 8; i++) tiles += R(40 + i * 95, 90, 4, 350, INK, 0);
      return roomBase() + tiles
        + C(620, 200, 70, PAPER) + C(620, 200, 70, "none").replace('fill="none"', 'fill="none" stroke="' + CLAY + '" stroke-width="12"')
        + R(150, 330, 330, 130, PAPER, 40) + R(150, 330, 330, 130, "none", 40).replace('fill="none"', 'fill="none" stroke="' + INK + '" stroke-width="10"')
        + E(315, 330, 120, 22, CLAY) + R(480, 240, 26, 100, INK, 8)
        + plant(660, 440, 0.9) + R(60, 480, 120, 16, CLAY, 8);
    }
  };
  function avatarSVG(n) {
    var bg = (n % 2 === 0) ? "#E7DFD0" : CLAY;
    var head = C(200, 168, 74, INK);
    var shoulders = '<path d="M200,400 C200,290 120,270 96,400 Z" fill="' + INK + '"/>'
      + '<path d="M200,400 C200,290 280,270 304,400 Z" fill="' + INK + '"/>';
    var acc = "";
    if (n === 1) acc = R(128, 148, 56, 44, "none", 8).replace('fill="none"', 'fill="none" stroke="' + CLAY + '" stroke-width="7"')
      + R(216, 148, 56, 44, "none", 8).replace('fill="none"', 'fill="none" stroke="' + CLAY + '" stroke-width="7"')
      + R(184, 166, 32, 7, CLAY, 0);
    else if (n === 2) acc = '<path d="M126,168 A74,74 0 0 1 274,168 L274,140 A90,60 0 0 0 126,140 Z" fill="' + CLAY + '"/>';
    else if (n === 3) acc = '<path d="M188,300 L212,300 L204,380 L196,380 Z" fill="' + CLAY + '"/>';
    else acc = C(128, 220, 10, CLAY) + C(272, 220, 10, CLAY)
      + '<path d="M126,168 A74,74 0 0 1 150,100 L190,120 A60,60 0 0 0 150,168 Z" fill="' + CLAY + '"/>'
      + '<path d="M274,168 A74,74 0 0 0 250,100 L210,120 A60,60 0 0 1 250,168 Z" fill="' + CLAY + '"/>';
    return '<svg viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice" style="aspect-ratio:1/1">'
      + R(0, 0, 400, 400, PAPER) + C(200, 210, 150, bg) + shoulders + head + acc + "</svg>";
  }
  function injectScenes() {
    var els = document.querySelectorAll("[data-scene]");
    for (var i = 0; i < els.length; i++) {
      var kind = els[i].getAttribute("data-scene");
      var ratio = (els[i].getAttribute("data-ratio") || "4:3").replace(":", "/");
      var fn = SCENES[kind] || SCENES.living;
      els[i].innerHTML = '<svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" style="aspect-ratio:' + ratio + '" aria-hidden="true">' + fn() + "</svg>";
    }
    var avs = document.querySelectorAll("[data-avatar]");
    for (var j = 0; j < avs.length; j++) {
      avs[j].innerHTML = avatarSVG(parseInt(avs[j].getAttribute("data-avatar"), 10) || 1);
    }
  }

  /* ============ 加载态 → hero 入场（完成态必达） ============ */
  function boot() {
    var loader = document.getElementById("loader");
    var t0 = Date.now();
    function done() {
      loader.classList.add("done");
      // 下一帧再加 ready，保证 transition 能起跳；无动画偏好则直接就绪
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { document.body.classList.add("ready"); });
      });
      setTimeout(function () { loader.style.display = "none"; }, 800);
    }
    if (document.readyState === "complete") {
      setTimeout(done, Math.max(0, CFG.loaderMin - (Date.now() - t0)));
    } else {
      window.addEventListener("load", function () {
        setTimeout(done, Math.max(0, CFG.loaderMin - (Date.now() - t0)));
      });
      setTimeout(done, 4000); // 兜底：load 迟迟不来也必须显示内容
    }
  }

  /* ============ 导航 + 汉堡 ============ */
  function nav() {
    var bar = document.getElementById("nav");
    function onScroll() { bar.classList.toggle("scrolled", window.scrollY > CFG.navOffset); }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    var burger = document.getElementById("burger");
    var menu = document.getElementById("mMenu");
    function setMenu(open) {
      document.body.classList.toggle("menu-open", open);
      menu.classList.toggle("open", open);
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      burger.setAttribute("aria-label", open ? "关闭菜单" : "打开菜单");
      menu.setAttribute("aria-hidden", open ? "false" : "true");
    }
    burger.addEventListener("click", function () {
      setMenu(!menu.classList.contains("open"));
    });
    var links = menu.querySelectorAll("a");
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener("click", function () { setMenu(false); });
    }
  }

  /* ============ 滚动 stagger 入场 ============ */
  function reveals() {
    var els = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window) || REDUCED) {
      for (var i = 0; i < els.length; i++) els[i].classList.add("in");
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      for (var k = 0; k < entries.length; k++) {
        if (entries[k].isIntersecting) {
          entries[k].target.classList.add("in");
          io.unobserve(entries[k].target);
        }
      }
    }, { threshold: CFG.revealThreshold, rootMargin: "0px 0px -6% 0px" });
    for (var j = 0; j < els.length; j++) io.observe(els[j]);
  }

  /* ============ 报价计算器（GSAP 数字滚动） ============ */
  var RATES = null;
  function calc() {
    var range = document.getElementById("areaRange");
    var areaOut = document.getElementById("areaOut");
    var roomRow = document.getElementById("roomRow");
    var tierRow = document.getElementById("tierRow");
    var totalNum = document.getElementById("totalNum");
    var valHard = document.getElementById("valHard");
    var valMain = document.getElementById("valMain");
    var valSoft = document.getElementById("valSoft");
    var barHard = document.getElementById("barHard");
    var barMain = document.getElementById("barMain");
    var barSoft = document.getElementById("barSoft");
    var state = { area: 100, mult: 1, rate: 1899 };
    var shown = { v: 0 }; // 当前屏幕上显示的总价（元）
    function fmtWan(yuan) { return (yuan / 10000).toFixed(1); }
    function paint(v) {
      totalNum.textContent = fmtWan(v);
      valHard.textContent = fmtWan(v * 0.55) + "万";
      valMain.textContent = fmtWan(v * 0.30) + "万";
      valSoft.textContent = fmtWan(v * 0.15) + "万";
      barHard.style.width = "55%"; barMain.style.width = "30%"; barSoft.style.width = "15%";
    }
    function target() { return state.area * state.rate * state.mult; }
    function update(animate) {
      var t = target();
      areaOut.textContent = state.area + "㎡";
      range.style.setProperty("--fill", ((state.area - 40) / 160 * 100) + "%");
      if (!animate || REDUCED || typeof gsap === "undefined") {
        if (typeof gsap !== "undefined") gsap.killTweensOf(shown);
        shown.v = t; paint(t); return;
      }
      // 数字滚动：只补间数值写 textContent，不碰 transform（避 GSAP 百分比坑）
      gsap.to(shown, {
        v: t, duration: CFG.numDuration, ease: "power3.out", overwrite: true,
        onUpdate: function () { paint(shown.v); }
      });
    }
    range.addEventListener("input", function () {
      state.area = parseInt(range.value, 10);
      update(true);
    });
    function chipRow(row, key) {
      var btns = row.querySelectorAll("button");
      for (var i = 0; i < btns.length; i++) {
        btns[i].addEventListener("click", function () {
          for (var j = 0; j < btns.length; j++) btns[j].classList.remove("active");
          this.classList.add("active");
          state[key] = parseFloat(this.getAttribute(key === "mult" ? "data-mult" : "data-rate"));
          update(true);
        });
      }
    }
    chipRow(roomRow, "mult");
    chipRow(tierRow, "rate");
    update(false); // 首屏直接落位，不做动画
  }

  /* ============ 预约表单（前端演示，不发送网络请求） ============ */
  function form() {
    var f = document.getElementById("bookForm");
    if (!f) return;
    var tip = document.querySelector(".cta-tip");
    var tipHTML = tip.innerHTML;
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = document.getElementById("fName").value.trim();
      var phone = document.getElementById("fPhone").value.trim();
      var area = document.getElementById("fArea").value.trim();
      var bad = null;
      if (!name) bad = "fName";
      else if (!/^1[3-9]\d{9}$/.test(phone)) bad = "fPhone";
      else if (area && (+area < 20 || +area > 500)) bad = "fArea";
      if (bad) {
        document.getElementById(bad).focus();
        tip.innerHTML = "请检查 <b style='color:var(--clay)'>" +
          (bad === "fName" ? "称呼" : bad === "fPhone" ? "手机号码" : "面积") +
          "</b> 是否填写正确。";
        return;
      }
      tip.innerHTML = tipHTML;
      document.getElementById("ctaForm").style.display = "none";
      var done = document.getElementById("ctaDone");
      document.getElementById("ctaDoneMsg").textContent =
        name + "，设计师将在 24 小时内致电 " + phone + "，与您确认上门时间。";
      done.classList.add("show");
    });
  }

  /* ============ 法务弹窗 ============ */
  function legal() {
    var overlay = document.getElementById("modalOverlay");
    var title = document.getElementById("modalTitle");
    var list = document.getElementById("modalList");
    var closeBtn = document.getElementById("modalClose");
    var lastFocus = null;
    function open(key) {
      var doc = LEGAL[key];
      if (!doc) return;
      lastFocus = document.activeElement;
      title.textContent = doc.title;
      var html = "";
      for (var i = 0; i < doc.points.length; i++) {
        html += "<li><b>" + doc.points[i][0] + "</b>" + doc.points[i][1] + "</li>";
      }
      list.innerHTML = html;
      overlay.classList.add("open");
      document.body.style.overflow = "hidden";
      closeBtn.focus();
    }
    function close() {
      overlay.classList.remove("open");
      document.body.style.overflow = "";
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    var btns = document.querySelectorAll("[data-legal]");
    for (var i = 0; i < btns.length; i++) {
      btns[i].addEventListener("click", function () { open(this.getAttribute("data-legal")); });
    }
    closeBtn.addEventListener("click", close);
    overlay.addEventListener("click", function (e) { if (e.target === overlay) close(); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && overlay.classList.contains("open")) close();
    });
  }

  /* ============ 启动 ============ */
  window.__interiorBooted = true;
  renderSite();
  injectScenes();
  boot();
  nav();
  reveals();
  calc();
  form();
  legal();
})();

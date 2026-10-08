/* 山外山 · 山野料理 — restaurant-page 交互
   classic script，无依赖。渐进增强：无 JS 时内容全部可见。 */
(function () {
  "use strict";

  /* ============ 配置参数 ============ */
  var CFG = {
    navOffset: 40,          // 导航滚动毛玻璃触发距离(px)
    revealThreshold: 0.12,  // 滚动 reveal 触发阈值
    revealMargin: "0px 0px -8% 0px",
    loaderMin: 650,         // 加载态最短展示(ms)
    reduceMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches
  };

  /* ============ 站点信息（买家改这里，一改全改） ============ */
  var SITE = {
    name: "山外山 · 山野料理",
    address: "杭州市西湖区龙井路 88 号",
    email: "yuding@shanwaishan.com",
    mailtoHref: "mailto:yuding@shanwaishan.com",
    phone: "0571-8888-6666",
    phoneHref: "tel:057188886666",
    hours: "周二至周日 · 请提前一日预订",
    icp: "京ICP备xxxxxxxxxx号-1",
    year: "2026"
  };

  /* ============ 法务三件套文案（真实感通用条款） ============ */
  var NUM = ["一", "二", "三", "四", "五", "六"];
  var LEGAL = {
    privacy: {
      title: "隐私政策",
      points: [
        ["我们收集哪些信息", "预订时您留下的姓名与电话；浏览网站时产生的设备型号、访问记录（详见 Cookie 政策）。不收集与预订无关的信息。"],
        ["信息用来做什么", "确认预订、到店前短信提醒，以及新菜、时令活动通知（每条通知都可退订）。"],
        ["我们不出售您的信息", "不会出售、出租您的个人信息。仅在您要求开具发票等场景下，经您明确同意后提供给必要的第三方。"],
        ["信息保存多久", "预订记录保存 12 个月，到期做匿名化处理；您可随时来信要求提前删除。"],
        ["您的权利", "您有权查阅、更正、删除自己的个人信息。来信至上方邮箱，我们在 3 个工作日内回复处理。"],
        ["未成年人保护", "本网站不面向 14 周岁以下儿童收集信息；如发现误收集，我们会第一时间删除。"]
      ]
    },
    terms: {
      title: "服务条款",
      points: [
        ["预订与到店", "电话或在线预订请提前一日；座位为您保留 15 分钟，超时未到且未联系，座位自动释放。"],
        ["取消与改期", "提前 4 小时以上免费取消或改期；8 人以上包间需提前 24 小时，临时取消可能收取 30% 餐位费。"],
        ["价格说明", "菜单价格为人民币含税价；时价海鲜与山货以当日店内黑板为准，点单前服务员会再次确认。"],
        ["用餐须知", "店内禁烟；谢绝自带酒水，特殊情况请提前电话沟通，我们尽量安排。"],
        ["不可抗力", "因极端天气、政策要求等不可抗力闭店，我们会第一时间通知已预订客人，并免费改期。"],
        ["争议解决", "本条款适用中华人民共和国法律；协商不成的，提交餐厅所在地人民法院处理。"]
      ]
    },
    cookies: {
      title: "Cookie 政策",
      points: [
        ["什么是 Cookie", "网站存放在您设备上的小文本文件，用来记住您的偏好，让预订流程更顺畅。"],
        ["我们用哪些", "必要 Cookie：保障预订、表单提交正常运转；偏好 Cookie：记住您的城市与浏览偏好；统计 Cookie：匿名分析访问情况，帮我们改进网站。"],
        ["我们不用 Cookie 做什么", "不用于跨站广告追踪，不把 Cookie 数据出售给任何第三方。"],
        ["如何管理", "您可以在浏览器设置中随时清除或禁用 Cookie；禁用后，在线预订功能可能无法正常使用。"],
        ["有效期", "偏好与统计 Cookie 最长保存 13 个月，到期自动失效；必要 Cookie 随会话结束清除。"]
      ]
    }
  };

  var doc = document.documentElement;
  doc.classList.add("js");

  /* ============ 页脚 SITE 变量渲染 ============ */
  function renderSite() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-site]"), function (el) {
      var v = SITE[el.getAttribute("data-site")];
      if (v != null) el.textContent = v;
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-site-href]"), function (el) {
      var v = SITE[el.getAttribute("data-site-href")];
      if (v != null) el.setAttribute("href", v);
    });
    var cp = document.getElementById("copyrightLine");
    if (cp) cp.textContent = "© " + SITE.year + " " + SITE.name + " ｜ " + SITE.icp;
  }
  renderSite();

  /* ============ 加载态 ============ */
  var loader = document.getElementById("loader");
  var t0 = Date.now();
  function hideLoader() {
    var wait = Math.max(0, CFG.loaderMin - (Date.now() - t0));
    setTimeout(function () {
      if (!loader) return;
      loader.classList.add("done");
      setTimeout(function () { loader.style.display = "none"; }, 700);
      startHero();
    }, CFG.reduceMotion ? 0 : wait);
  }
  if (document.readyState === "complete") hideLoader();
  else window.addEventListener("load", hideLoader);
  // 兜底：load 事件 4s 未到也放行
  setTimeout(function () {
    if (loader && !loader.classList.contains("done")) hideLoader();
  }, 4000);

  /* ============ hero 大字升起 ============ */
  var heroStarted = false;
  function startHero() {
    if (heroStarted) return;
    heroStarted = true;
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        doc.classList.add("loaded");
      });
    });
  }

  /* ============ 导航滚动毛玻璃 ============ */
  var nav = document.getElementById("nav");
  var ticking = false;
  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(function () {
        nav.classList.toggle("scrolled", window.scrollY > CFG.navOffset);
        ticking = false;
      });
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ============ 移动端汉堡菜单 ============ */
  var burger = document.getElementById("burger");
  var mMenu = document.getElementById("mMenu");
  function setMenu(open) {
    burger.classList.toggle("open", open);
    mMenu.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    burger.setAttribute("aria-label", open ? "关闭菜单" : "打开菜单");
    mMenu.setAttribute("aria-hidden", open ? "false" : "true");
    document.body.style.overflow = open ? "hidden" : "";
  }
  burger.addEventListener("click", function () {
    setMenu(!mMenu.classList.contains("open"));
  });
  mMenu.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", function () { setMenu(false); });
  });
  window.addEventListener("resize", function () {
    if (window.innerWidth > 900 && mMenu.classList.contains("open")) setMenu(false);
  });

  /* ============ 区块滚动 reveal ============ */
  var reveals = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
  if (CFG.reduceMotion || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) { el.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    }, { threshold: CFG.revealThreshold, rootMargin: CFG.revealMargin });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* ============ 法务弹窗 ============ */
  var overlay = document.getElementById("legalModal");
  var legalTitle = document.getElementById("legalTitle");
  var legalBody = document.getElementById("legalBody");
  var legalClose = document.getElementById("legalClose");
  var lastFocus = null;

  function openLegal(key) {
    var item = LEGAL[key];
    if (!item) return;
    legalTitle.textContent = item.title;
    legalBody.innerHTML = item.points.map(function (p, i) {
      return "<h4><b>" + NUM[i] + "、</b>" + p[0] + "</h4><p>" + p[1] + "</p>";
    }).join("");
    lastFocus = document.activeElement;
    overlay.classList.add("open");
    overlay.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden"; // 锁定背景滚动
    legalClose.focus();
  }
  function closeLegal() {
    if (!overlay.classList.contains("open")) return;
    overlay.classList.remove("open");
    overlay.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  Array.prototype.forEach.call(document.querySelectorAll("[data-legal]"), function (btn) {
    btn.addEventListener("click", function () { openLegal(btn.getAttribute("data-legal")); });
  });
  legalClose.addEventListener("click", closeLegal);
  overlay.addEventListener("click", function (e) {
    if (e.target === overlay) closeLegal(); // 点击遮罩关闭
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeLegal(); // ESC 关闭
  });
})();

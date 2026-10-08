/* 启航教育 · edu-academy-page 交互逻辑（原生 JS，无依赖） */
(function () {
  "use strict";
  document.documentElement.classList.add("js");

  /* ---------- SITE：机构信息唯一真实来源，改一处全站生效 ---------- */
  var SITE = {
    name: "启航教育",
    phone: "400-888-6666",
    address: "北京市海淀区中关村大街 88 号启航大厦 3 层",
    email: "hello@qihang-edu.example",
    license: "京教民字第 110108XXXXXX 号"
  };
  document.querySelectorAll("[data-site]").forEach(function (el) {
    var k = el.getAttribute("data-site");
    if (SITE[k] != null) el.textContent = SITE[k];
  });
  document.querySelectorAll("[data-site-tel]").forEach(function (el) {
    el.textContent = SITE.phone;
    el.setAttribute("href", "tel:" + SITE.phone.replace(/-/g, ""));
  });
  document.querySelectorAll("[data-site-mail]").forEach(function (el) {
    el.textContent = SITE.email;
    el.setAttribute("href", "mailto:" + SITE.email);
  });

  /* ---------- 加载态：load 后双 rAF 关闭，2.5s 强制兜底 ---------- */
  var loader = document.getElementById("loader");
  var loaderDone = false;
  function hideLoader() {
    if (loaderDone) return;
    loaderDone = true;
    loader.classList.add("done");
  }
  window.addEventListener("load", function () {
    requestAnimationFrame(function () { requestAnimationFrame(hideLoader); });
  });
  setTimeout(hideLoader, 2500);

  /* ---------- 导航：滚动毛玻璃 ---------- */
  var nav = document.getElementById("nav");
  function onScroll() { nav.classList.toggle("scrolled", window.scrollY > 40); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- 移动端抽屉 ---------- */
  var burger = document.getElementById("burger"),
      drawer = document.getElementById("drawer"),
      mask = document.getElementById("drawerMask"),
      drawerX = document.getElementById("drawerX");
  function openDrawer() {
    drawer.classList.add("open"); mask.hidden = false;
    requestAnimationFrame(function () { mask.classList.add("show"); });
    drawer.removeAttribute("inert");
    burger.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
  }
  function closeDrawer() {
    drawer.classList.remove("open"); mask.classList.remove("show");
    drawer.setAttribute("inert", "");
    burger.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    setTimeout(function () { mask.hidden = true; }, 320);
  }
  burger.addEventListener("click", openDrawer);
  drawerX.addEventListener("click", closeDrawer);
  mask.addEventListener("click", closeDrawer);
  drawer.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", closeDrawer); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") { closeDrawer(); closeLegal(); } });

  /* ---------- 课程 tab ---------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll(".tab"));
  var panels = Array.prototype.slice.call(document.querySelectorAll(".panel"));
  var panelsBox = document.querySelector(".panels");
  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      if (tab.classList.contains("on")) return;
      tabs.forEach(function (t) { t.classList.remove("on"); t.setAttribute("aria-selected", "false"); });
      tab.classList.add("on"); tab.setAttribute("aria-selected", "true");
      panels.forEach(function (p) {
        var show = p.getAttribute("data-panel") === tab.getAttribute("data-tab");
        p.classList.toggle("on", show);
        p.hidden = !show;
        if (show) {
          p.classList.remove("switching"); void p.offsetWidth;
          p.classList.add("switching");
          p.querySelectorAll(".flip").forEach(function (f, i) {
            f.classList.remove("in");
            setTimeout(function () { f.classList.add("in"); }, 120 + i * 90);
          });
        }
      });
    });
  });

  /* ---------- 滚动数字（主视觉动效） ---------- */
  function easeOutExpo(t) { return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t); }
  function fmt(n, dec) {
    return dec > 0 ? n.toFixed(dec) : Math.round(n).toLocaleString("en-US").replace(/,/g, ",");
  }
  function runCount(el) {
    if (el.dataset.done) return;
    el.dataset.done = "1";
    var target = parseFloat(el.getAttribute("data-count")),
        dec = parseInt(el.getAttribute("data-dec") || "0", 10),
        suffix = el.getAttribute("data-suffix") || "",
        dur = 1800, t0 = null;
    function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1);
      el.textContent = fmt(target * easeOutExpo(p), dec) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.textContent = fmt(target, dec) + suffix;
    } else {
      requestAnimationFrame(step);
    }
  }

  /* ---------- 滚动 reveal ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        el.classList.add("in");
        el.querySelectorAll(".count").forEach(runCount);
        if (el.classList.contains("count")) runCount(el);
        io.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    revealEls.forEach(function (el, i) {
      el.style.transitionDelay = (i % 4) * 70 + "ms";
      io.observe(el);
    });
    // 兜底：3s 后仍未进入视口的，强制显示（保证完成态可达）
    setTimeout(function () {
      revealEls.forEach(function (el) {
        if (!el.classList.contains("in")) {
          el.classList.add("in");
          el.querySelectorAll(".count").forEach(runCount);
        }
      });
    }, 3000);
  } else {
    revealEls.forEach(function (el) {
      el.classList.add("in");
      el.querySelectorAll(".count").forEach(runCount);
    });
  }
  // hero 数字在首屏：直接跑一次（IO 也会跑，但 dataset.done 防重）
  document.querySelectorAll(".hero .count").forEach(runCount);

  /* ---------- 学员故事轮播 ---------- */
  var track = document.getElementById("storyTrack"),
      dots = Array.prototype.slice.call(document.querySelectorAll(".story-dots button")),
      idx = 0, timer = null;
  function go(i) {
    idx = (i + dots.length) % dots.length;
    track.style.transform = "translateX(-" + idx * 100 + "%)";
    dots.forEach(function (d, j) { d.classList.toggle("on", j === idx); });
  }
  function auto() {
    clearInterval(timer);
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      timer = setInterval(function () { go(idx + 1); }, 5200);
    }
  }
  dots.forEach(function (d, j) {
    d.addEventListener("click", function () { go(j); auto(); });
  });
  document.getElementById("stories").addEventListener("mouseenter", function () { clearInterval(timer); });
  document.getElementById("stories").addEventListener("mouseleave", auto);
  auto();

  /* ---------- 试听表单 ---------- */
  var form = document.getElementById("trialForm"),
      formOk = document.getElementById("formOk"),
      phoneInput = form.querySelector('input[name="phone"]'),
      phoneErr = form.querySelector('[data-err="phone"]');
  phoneInput.addEventListener("input", function () {
    phoneInput.classList.remove("bad"); phoneErr.textContent = "";
  });
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var ok = true;
    if (!form.querySelector('input[name="name"]').value.trim()) ok = false;
    var phone = phoneInput.value.trim();
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      phoneInput.classList.add("bad");
      phoneErr.textContent = "请填写正确的 11 位手机号码";
      ok = false;
    }
    if (!form.querySelector('select[name="grade"]').value) ok = false;
    if (!form.querySelector('select[name="subject"]').value) ok = false;
    if (!ok) {
      var firstBad = form.querySelector(".bad") || form.querySelector("input:invalid, select:invalid");
      return;
    }
    // 演示模板：本地成功态（真实上线时在此处接后端接口）
    formOk.hidden = false;
    formOk.scrollIntoView({ block: "nearest", behavior: "smooth" });
  });

  /* ---------- 法务弹窗 ---------- */
  var LEGAL = {
    privacy: {
      title: "隐私政策",
      body: '<p class="modal-date">最后更新：2026 年 10 月</p><ol>' +
        "<li><b>我们收集什么。</b>你主动填写的姓名、电话、年级与意向科目，以及预约咨询过程中产生的沟通记录。仅用于安排试听与课程咨询。</li>" +
        "<li><b>我们不做什么。</b>不出售、不出租你的个人信息；不向任何第三方营销机构提供你的联系方式。</li>" +
        "<li><b>保存多久。</b>咨询信息自最后一次联系起保存 2 年，到期自动删除；你可随时要求提前删除。</li>" +
        "<li><b>你的权利。</b>你有权查询、更正、删除自己的信息，拨打页面上的咨询电话即可办理，我们在 15 个工作日内响应。</li>" +
        "<li><b>未成年人。</b>14 岁以下学员的信息须由监护人代为填写与确认。</li></ol>"
    },
    terms: {
      title: "服务条款",
      body: '<p class="modal-date">最后更新：2026 年 10 月</p><ol>' +
        "<li><b>课程与收费。</b>课程内容、课时与价格以报名时签署的书面合同为准；页面价格为学期基准价，优惠活动以校区公示为准。</li>" +
        "<li><b>退费。</b>开课 3 次内可无理由申请退还剩余课时费；3 次后按合同约定的剩余课时比例结算，7 个工作日内到账。</li>" +
        "<li><b>调课与请假。</b>开课前 24 小时可免费调课一次；临时缺课提供当周录播补课，不单独补课时。</li>" +
        "<li><b>学员义务。</b>按时到课、完成课后练习；课堂内禁止录音录像外传，讲义仅限学员本人学习使用。</li>" +
        "<li><b>争议解决。</b>协商不成时，提交机构所在地人民法院诉讼解决。</li></ol>"
    },
    cookies: {
      title: "Cookie 政策",
      body: '<p class="modal-date">最后更新：2026 年 10 月</p><ol>' +
        "<li><b>什么是 Cookie。</b>Cookie 是浏览器保存的小文本文件，用来记住你的偏好，让页面用起来更顺手。</li>" +
        "<li><b>必要型 Cookie。</b>用于记住表单填写进度、维持页面状态；禁用后预约表单可能无法正常提交。</li>" +
        "<li><b>分析型 Cookie。</b>匿名统计页面访问情况，帮我们知道哪些课程最受欢迎；可在浏览器设置中随时关闭，不影响浏览。</li>" +
        "<li><b>我们不做什么。</b>不接入广告追踪，不与广告商共享任何数据。</li></ol>"
    }
  };
  var legalMask = document.getElementById("legalMask"),
      legalModal = document.getElementById("legalModal"),
      legalTitle = document.getElementById("legalTitle"),
      legalBody = document.getElementById("legalBody"),
      legalX = document.getElementById("legalX");
  function openLegal(key) {
    var d = LEGAL[key]; if (!d) return;
    legalTitle.textContent = d.title;
    legalBody.innerHTML = d.body;
    legalMask.hidden = false; legalModal.hidden = false;
    requestAnimationFrame(function () {
      legalMask.classList.add("show"); legalModal.classList.add("show");
    });
    document.body.style.overflow = "hidden";
    legalX.focus();
  }
  function closeLegal() {
    if (legalModal.hidden) return;
    legalMask.classList.remove("show"); legalModal.classList.remove("show");
    document.body.style.overflow = "";
    setTimeout(function () { legalMask.hidden = true; legalModal.hidden = true; }, 320);
  }
  document.querySelectorAll("[data-legal]").forEach(function (a) {
    a.addEventListener("click", function (e) { e.preventDefault(); openLegal(a.getAttribute("data-legal")); });
  });
  legalX.addEventListener("click", closeLegal);
  legalMask.addEventListener("click", closeLegal);
})();

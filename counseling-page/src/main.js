/* ============ 听澜 counseling-page 交互 ============
   纯原生 JS，零外部依赖（classic script，无模块） */

/* 页面配置：电话 / 地址 / 邮箱 / 版权 / 备案占位 */
const SITE = {
  name: "听澜心理咨询",
  phone: "400-820-8820",
  address: "上海市静安区南京西路 1266 号 18 层",
  email: "hello@tinglan.example.com",
  copyright: "© 2026 听澜心理咨询（上海）有限公司 · 版权所有",
  icp: "沪ICP备2026000000号-1（占位）"
};

(function () {
  "use strict";
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- 页脚信息渲染 ---------- */
  $("#fPhone").textContent = "电话：" + SITE.phone;
  $("#fAddr").textContent = "地址：" + SITE.address;
  $("#fMail").textContent = "邮箱：" + SITE.email;
  $("#fCopy").textContent = SITE.copyright;
  $("#fIcp").textContent = SITE.icp;

  /* ---------- 加载态：脚本在 body 末尾执行即 DOM 就绪，350ms 后确定性隐藏 ----------
     不依赖 load 事件（headless 下 load 可能偏晚）；CSS 另有 5s 兜底动画 */
  function hideLoader() {
    var l = $("#loader");
    if (l) l.classList.add("done");
  }
  setTimeout(hideLoader, 350);

  /* ---------- 导航滚动毛玻璃 ---------- */
  var nav = $("#nav");
  function onScroll() {
    if (window.scrollY > 24) nav.classList.add("scrolled");
    else nav.classList.remove("scrolled");
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- 移动端抽屉 ---------- */
  var burger = $("#burger"), drawer = $("#drawer"), dMask = $("#drawerMask");
  function openDrawer() {
    drawer.removeAttribute("hidden");
    dMask.removeAttribute("hidden");
    requestAnimationFrame(function () {
      drawer.classList.add("open"); dMask.classList.add("show");
    });
    drawer.setAttribute("aria-hidden", "false");
    burger.classList.add("open"); burger.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
  }
  function closeDrawer() {
    drawer.classList.remove("open"); dMask.classList.remove("show");
    drawer.setAttribute("aria-hidden", "true");
    burger.classList.remove("open"); burger.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    setTimeout(function () { drawer.setAttribute("hidden", ""); dMask.setAttribute("hidden", ""); }, 450);
  }
  burger.addEventListener("click", function () {
    drawer.classList.contains("open") ? closeDrawer() : openDrawer();
  });
  $("#drawerClose").addEventListener("click", closeDrawer);
  dMask.addEventListener("click", closeDrawer);
  $$(".drawer-links a, .drawer .btn-block").forEach(function (a) {
    a.addEventListener("click", closeDrawer);
  });

  /* ---------- 匹配问卷 ---------- */
  var panes = $$(".quiz-pane"), bar = $("#quizBar"), stepEl = $("#quizStep");
  var answers = {};
  var RESULT = {
    solo:   { t: "个体咨询",  d: "根据你的回答，个体咨询可能是最合适的起点。选一位风格契合的咨询师，先从一次免费的 15 分钟通话开始。" },
    couple: { t: "伴侣咨询",  d: "关系里的摩擦值得被认真对待。伴侣咨询由中立的咨询师陪你们一起，把卡住的话说开。" },
    teen:   { t: "青少年咨询", d: "孩子的信号需要被听懂。青少年咨询会分别与孩子和父母工作，重建家里的对话。" }
  };
  function showPane(i) {
    panes.forEach(function (p, idx) {
      if (idx === i) p.removeAttribute("hidden"); else p.setAttribute("hidden", "");
    });
    var res = $(".quiz-result");
    if (i === 3) {
      res.removeAttribute("hidden");
      panes.forEach(function (p) { p.setAttribute("hidden", ""); });
    } else { res.setAttribute("hidden", ""); }
    bar.style.width = ((i + 1) / 4 * 100) + "%";
    stepEl.textContent = i < 3 ? ("第 " + (i + 1) + " 题 / 共 3 题") : "匹配完成";
  }
  $$(".quiz-opts button").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var pane = btn.closest(".quiz-pane");
      var idx = panes.indexOf(pane);
      answers["q" + idx] = btn.getAttribute("data-v");
      if (idx < 2) { showPane(idx + 1); }
      else {
        var key = answers.q0 === "couple" ? "couple" : answers.q0 === "teen" ? "teen" : "solo";
        var r = RESULT[key];
        $("#quizTitle").textContent = r.t;
        $("#quizDesc").textContent = r.d + "你偏好" +
          (answers.q1 === "video" ? "视频" : answers.q1 === "text" ? "文字" : "语音") +
          "方式，希望咨询师风格" +
          (answers.q2 === "warm" ? "温和倾听" : answers.q2 === "direct" ? "直接高效" : "随缘先聊聊") + "——我们会按这个方向为你匹配。";
        showPane(3);
      }
    });
  });
  $("#quizRestart").addEventListener("click", function () { answers = {}; showPane(0); });
  showPane(0);

  /* ---------- 服务 Tab ---------- */
  var tabs = $$(".tab"), panels = $$(".tab-panel"), ink = $("#tabInk");
  function moveInk(tab) {
    ink.style.left = tab.offsetLeft + "px";
    ink.style.width = tab.offsetWidth + "px";
  }
  function selectTab(tab) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", on ? "true" : "false");
    });
    panels.forEach(function (p) {
      if (p.getAttribute("data-panel") === tab.getAttribute("data-tab")) p.removeAttribute("hidden");
      else p.setAttribute("hidden", "");
    });
    moveInk(tab);
  }
  tabs.forEach(function (t) {
    t.addEventListener("click", function () { selectTab(t); });
  });
  window.addEventListener("load", function () { moveInk($(".tab.is-active")); });
  window.addEventListener("resize", function () { moveInk($(".tab.is-active")); });
  /* 首屏即定位，避免 ink 停在 0 宽 */
  setTimeout(function () { moveInk($(".tab.is-active")); }, 600);

  /* ---------- 表单校验 + 成功态 ---------- */
  var form = $("#matchForm"), success = $("#formSuccess");
  function setErr(name, msg) {
    var label = form.querySelector('[name="' + name + '"]').closest(".field");
    label.classList.toggle("invalid", !!msg);
    label.querySelector(".err").textContent = msg || "";
    return !msg;
  }
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = form.name.value.trim();
    var contact = form.contact.value.trim();
    var topic = form.topic.value;
    var ok = true;
    if (!name) ok = setErr("name", "请告诉我们怎么称呼你（昵称也可以）") && ok;
    else if (name.length > 20) ok = setErr("name", "称呼太长了，20 字以内就好") && ok;
    else ok = setErr("name", "") && ok;
    var phoneRe = /^1[3-9]\d{9}$/;
    if (!contact) ok = setErr("contact", "请留下手机号或微信号，方便我们联系你") && ok;
    else if (!(phoneRe.test(contact) || /^[a-zA-Z][a-zA-Z0-9_-]{5,19}$/.test(contact)))
      ok = setErr("contact", "格式不太对：手机号 11 位，或微信号（字母开头，6–20 位）") && ok;
    else ok = setErr("contact", "") && ok;
    if (!topic) ok = setErr("topic", "请选择一个咨询方向") && ok;
    else ok = setErr("topic", "") && ok;
    if (!ok) {
      var firstBad = form.querySelector(".field.invalid input, .field.invalid select");
      if (firstBad) firstBad.focus();
      return;
    }
    $("#successText").textContent = "谢谢" + name + "，我们已收到你的预约，匹配专员将在 24 小时内通过你留下的联系方式与你确认。首次 15 分钟通话完全免费。";
    form.setAttribute("hidden", "");
    success.removeAttribute("hidden");
  });
  ["name", "contact", "topic"].forEach(function (n) {
    form[n].addEventListener("input", function () { setErr(n, ""); });
    form[n].addEventListener("change", function () { setErr(n, ""); });
  });
  $("#formAgain").addEventListener("click", function () {
    form.reset();
    success.setAttribute("hidden", "");
    form.removeAttribute("hidden");
  });

  /* ---------- 法律弹窗：按钮 / 遮罩 / ESC 三通道关闭 ---------- */
  var mask = $("#modalMask"), current = null, lastFocus = null;
  function openModal(id) {
    closeModal(true);
    lastFocus = document.activeElement;
    current = $("#modal-" + id);
    if (!current) return;
    mask.removeAttribute("hidden"); current.removeAttribute("hidden");
    requestAnimationFrame(function () { mask.classList.add("show"); current.classList.add("open"); });
    document.body.style.overflow = "hidden";
    var x = current.querySelector(".modal-x");
    if (x) x.focus();
  }
  function closeModal(silent) {
    if (!current) return;
    mask.classList.remove("show"); current.classList.remove("open");
    var m = current; current = null;
    document.body.style.overflow = "";
    setTimeout(function () { mask.setAttribute("hidden", ""); m.setAttribute("hidden", ""); }, silent ? 0 : 400);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  $$("[data-modal]").forEach(function (el) {
    el.addEventListener("click", function (e) { e.preventDefault(); openModal(el.getAttribute("data-modal")); });
  });
  $$("[data-close]").forEach(function (el) { el.addEventListener("click", function () { closeModal(); }); });
  mask.addEventListener("click", function () { closeModal(); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      if (current) closeModal();
      else if (drawer.classList.contains("open")) closeDrawer();
    }
  });

  /* ---------- reveal：滚动进入视口即显示 ---------- */
  var reveals = $$(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    reveals.forEach(function (r) { io.observe(r); });
    /* 兜底：8 秒后仍未进入视口的一律放行（保证完成态可达） */
    setTimeout(function () { reveals.forEach(function (r) { r.classList.add("is-in"); }); }, 8000);
  } else {
    reveals.forEach(function (r) { r.classList.add("is-in"); });
  }
})();

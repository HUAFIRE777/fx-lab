/* 陈维 Wei Chen — 作品集落地页交互
   纯 vanilla JS，无依赖。所有"隐藏等 JS"的元素都只在 html.js-motion 下隐藏，
   无 JS 时全部可见；loader 有 3.5s 硬兜底，显示态永远可达。 */
(function () {
  "use strict";

  /* ============ SITE 配置：改这里，全站联系信息跟着变 ============ */
  var SITE = {
    email: "hello@weichen.work",
    phone: "+86 138-0000-0000",
    city: "上海，中国",
    icp: "沪ICP备00000000号-1（占位，上线前替换）"
  };

  /* ============ 法务三件套文案（个人站口径，通用模板） ============ */
  var LEGAL = {
    privacy: {
      title: "隐私政策",
      items: [
        "本站是个人作品集网站，不设账号系统，不收集身份证、住址等敏感个人信息。",
        "如果你通过页面邮箱主动联系我，你的邮件地址和信件内容只用来回复沟通，不会转交给任何第三方。",
        "本站只做最基础的访问计数统计，不画像、不跨站追踪、不卖数据。",
        "你可以随时来信要求删除你提供过的联系信息，我会在 7 天内处理完毕。",
        "本政策更新时会在文末注明日期；继续使用本站即表示你已知悉。"
      ]
    },
    terms: {
      title: "服务条款",
      items: [
        "本站展示的作品均为本人原创或经授权展示，版权归本人或原委托方所有，未经许可不得转载商用。",
        "作品封面为示意性几何图形，非客户真实交付稿；合作案例细节以双方签约文件为准。",
        "通过邮箱发起的合作邀约不构成合同，项目合作以双方签署的书面协议为准。",
        "本站内容按“现状”提供，我会尽量保证准确，但不做绝对化承诺。",
        "如有疑问，直接写邮件给我，看到就会回。"
      ]
    },
    cookies: {
      title: "Cookie 政策",
      items: [
        "本站页面本身不写入任何 Cookie，裸奔式干净。",
        "如果未来接入访问统计，只会用第一方、匿名的计数型 Cookie，不做广告画像。",
        "你的浏览器可以随时清除或禁用 Cookie，不影响正常浏览本站。",
        "点击社交媒体图标跳出去之后，适用对方平台自己的 Cookie 政策。",
        "政策有变会在本页更新，日期见文末。"
      ]
    }
  };
  var DOC_DATE = "最后更新：2026-10-05";

  /* ---------- 站点信息渲染（联系 CTA + 页脚引用 SITE） ---------- */
  function setText(id, v) { var el = document.getElementById(id); if (el) el.textContent = v; }
  setText("emailBtn", SITE.email);
  setText("fEmail", SITE.email);
  setText("fPhone", SITE.phone);
  setText("fCity", SITE.city);
  setText("icp", SITE.icp);

  /* ---------- 加载态：先注册兜底，再做别的事 ---------- */
  var loader = document.getElementById("loader");
  var t0 = Date.now(), MIN = 800, hidden = false;
  function finishLoad() {
    if (hidden) return; hidden = true;
    var wait = Math.max(0, MIN - (Date.now() - t0));
    setTimeout(function () {
      loader.classList.add("done");
      document.body.classList.add("ready");   /* hero 大字开始升起 */
      setTimeout(function () { if (loader.parentNode) loader.parentNode.removeChild(loader); }, 900);
    }, wait);
  }
  if (document.readyState === "complete") finishLoad();
  else {
    window.addEventListener("load", finishLoad);
    setTimeout(finishLoad, 3500);             /* 硬兜底：再慢也放行 */
  }

  /* ---------- 导航滚动毛玻璃 ---------- */
  var nav = document.getElementById("nav");
  function onScroll() { nav.classList.toggle("scrolled", window.scrollY > 24); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- 移动端汉堡菜单 ---------- */
  var burger = document.getElementById("burger");
  var mnav = document.getElementById("mnav");
  function setMenu(open) {
    burger.classList.toggle("open", open);
    mnav.classList.toggle("open", open);
    mnav.setAttribute("aria-hidden", open ? "false" : "true");
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    burger.setAttribute("aria-label", open ? "关闭菜单" : "打开菜单");
    document.body.style.overflow = open ? "hidden" : "";
  }
  burger.addEventListener("click", function () { setMenu(!mnav.classList.contains("open")); });
  mnav.addEventListener("click", function (e) {
    if (e.target.closest("a")) setMenu(false);
  });

  /* ---------- 滚动 stagger 入场 ---------- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
  document.querySelectorAll(".rv").forEach(function (el) { io.observe(el); });

  /* 同一组容器内按顺序加延迟，形成 stagger */
  document.querySelectorAll("[data-stagger]").forEach(function (group) {
    var i = 0;
    group.querySelectorAll(".rv").forEach(function (el) {
      el.style.setProperty("--d", (i * 0.09).toFixed(2) + "s"); i++;
    });
  });

  var fine = window.matchMedia("(pointer:fine)").matches;

  /* ---------- 作品封面 hover 视差 ---------- */
  if (fine) {
    document.querySelectorAll(".card").forEach(function (card) {
      var px = card.querySelector(".px");
      card.addEventListener("mousemove", function (ev) {
        var r = card.getBoundingClientRect();
        var x = (ev.clientX - r.left) / r.width - 0.5;
        var y = (ev.clientY - r.top) / r.height - 0.5;
        px.style.transform = "translate(" + (x * 16).toFixed(1) + "px," + (y * 12).toFixed(1) + "px)";
      });
      card.addEventListener("mouseleave", function () { px.style.transform = ""; });
    });

    /* ---------- Hire me 轻磁吸 ---------- */
    var hire = document.querySelector(".hire");
    if (hire) {
      hire.addEventListener("mousemove", function (ev) {
        var r = hire.getBoundingClientRect();
        var x = ev.clientX - r.left - r.width / 2;
        var y = ev.clientY - r.top - r.height / 2;
        hire.style.transform = "translate(" + (x * 0.18).toFixed(1) + "px," + (y * 0.3).toFixed(1) + "px)";
      });
      hire.addEventListener("mouseleave", function () { hire.style.transform = ""; });
    }
  }

  /* ---------- 巨型邮箱：点击复制（地址来自 SITE.email） ---------- */
  var btn = document.getElementById("emailBtn");
  var toast = document.getElementById("toast");
  var tt = null;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(tt);
    tt = setTimeout(function () { toast.classList.remove("show"); }, 1800);
  }
  function copied() { showToast("已复制，去邮箱粘贴吧"); }
  function fallbackCopy() {
    var ta = document.createElement("textarea");
    ta.value = SITE.email;
    ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); } catch (e) { /* 忽略，走 toast 提示 */ }
    document.body.removeChild(ta);
    copied();
  }
  btn.addEventListener("click", function () {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(SITE.email).then(copied, fallbackCopy);
    } else fallbackCopy();
  });

  /* ---------- 法务三件套弹窗 ---------- */
  var modal = document.getElementById("modal");
  var modalTitle = document.getElementById("modalTitle");
  var modalBody = document.getElementById("modalBody");
  var lastFocus = null;

  function openModal(key) {
    var doc = LEGAL[key];
    if (!doc) return;
    lastFocus = document.activeElement;
    modalTitle.textContent = doc.title;
    modalBody.innerHTML = "<ol>" + doc.items.map(function (t) {
      return "<li>" + t + "</li>";
    }).join("") + '</ol><p class="doc-date">' + DOC_DATE + "</p>";
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";   /* 锁定背景滚动 */
    var x = modal.querySelector(".modal-x");
    if (x) x.focus();
  }
  function closeModal() {
    if (!modal.classList.contains("open")) return;
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";          /* 恢复滚动 */
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  document.querySelectorAll("[data-legal]").forEach(function (b) {
    b.addEventListener("click", function () { openModal(b.getAttribute("data-legal")); });
  });
  modal.addEventListener("click", function (e) {
    if (e.target.closest("[data-close]")) closeModal();   /* 右上 X + 遮罩 */
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeModal();                  /* ESC */
  });

  /* ---------- 页脚 ---------- */
  document.getElementById("yr").textContent = String(new Date().getFullYear());
  document.getElementById("toTop").addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
})();

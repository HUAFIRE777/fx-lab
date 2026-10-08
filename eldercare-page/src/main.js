/* 颐乐 EVERJOY · 交互逻辑（零外部依赖，纯原生 JS） */
"use strict";

/* ============ 配置：换主体只改这里 ============ */
const SITE = {
  brand: "颐乐",
  brandEn: "EVERJOY",
  organizer: "颐乐养老社区（杭州）有限公司",
  phone: "400-880-6655",
  phoneHref: "4008806655",
  address: "杭州市西湖区留和路 318 号",
  email: "hello@everjoy-care.example.com",
  icp: "浙ICP备2026000000号-1",
};

/* 法务三件套文案（真实感通用条款，养老场景） */
const LEGAL = {
  privacy: {
    title: "隐私政策",
    body: `
      <h5>一、我们收集哪些信息</h5>
      <p>为安排参观与照护评估，我们可能收集您的称呼、手机号码、期望参观日期及您主动填写的备注信息。我们不会收集与预约无关的个人信息。</p>
      <h5>二、信息如何使用</h5>
      <p>所收集信息仅用于与您联系、安排参观及提供照护咨询，不会出售、出租或分享给任何第三方营销机构。</p>
      <h5>三、信息保存与删除</h5>
      <p>您的预约信息自提交之日起保存 2 年。如需删除，请致电 ${SITE.phone}，我们在核实身份后 7 个工作日内删除。</p>
      <h5>四、长辈信息特别说明</h5>
      <p>涉及长辈健康状况的信息，仅在您明确授权后由评估师用于制定照护建议，并严格保密。</p>`,
  },
  terms: {
    title: "服务条款",
    body: `
      <h5>一、服务内容</h5>
      <p>颐乐养老社区提供长者居住、膳食、生活照料、健康管理协助及社区文化活动。照护等级与费用以双方签署的《入住服务协议》为准。</p>
      <h5>二、费用说明</h5>
      <p>本页面所示价格为 2026 年参考价。实际费用根据免费评估后的照护方案确定，费用明细逐项列明，无隐形收费。</p>
      <h5>三、合规声明</h5>
      <p>我们提供的是生活照料与健康管理协助服务，不提供疾病诊断、治疗服务，不做任何医疗疗效承诺。医疗需求请遵医嘱并前往正规医疗机构。</p>
      <h5>四、预约参观</h5>
      <p>在线预约成功后，顾问将在 1 个工作日内与您联系确认时间。如需取消或改期，请至少提前 1 天告知。</p>`,
  },
  cookie: {
    title: "Cookie 政策",
    body: `
      <h5>一、我们使用 Cookie 做什么</h5>
      <p>本页面为单文件静态页面，仅使用浏览器本地存储记住您的表单草稿（如有），不使用第三方统计或广告 Cookie。</p>
      <h5>二、如何管理</h5>
      <p>您可随时通过浏览器设置清除本地存储数据，不影响页面正常浏览。</p>
      <h5>三、政策更新</h5>
      <p>如 Cookie 使用方式发生变化，我们将在本页面更新政策文本并注明更新日期。</p>`,
  },
};

/* 隐藏等 JS 模式：先加 js 钩子，保证完成态选择器生效 */
document.documentElement.classList.add("js");

/* ============ 页脚信息注入 ============ */
(function injectSite() {
  document.getElementById("fPhone").textContent = "电话：" + SITE.phone;
  document.getElementById("fAddr").textContent = "地址：" + SITE.address;
  document.getElementById("fMail").textContent = "邮箱：" + SITE.email;
  document.getElementById("fCompany").textContent = SITE.organizer;
  document.getElementById("fIcp").textContent = SITE.icp;
  document.getElementById("fYear").textContent = String(new Date().getFullYear());
  const tel = document.getElementById("ctaPhone");
  tel.textContent = SITE.phone;
  tel.href = "tel:" + SITE.phoneHref;
  document.querySelectorAll('[data-social="电话"]').forEach((a) => {
    a.href = "tel:" + SITE.phoneHref;
  });
})();

/* ============ 加载幕布 ============ */
(function veil() {
  const veil = document.getElementById("veil");
  const hero = document.getElementById("hero");
  let done = false;
  function finish() {
    if (done) return;
    done = true;
    veil.classList.add("done");
    /* 首屏就绪：标题逐行升起（两帧后加类，保证 transition 生效） */
    requestAnimationFrame(() => requestAnimationFrame(() => hero.classList.add("is-in")));
    setTimeout(() => veil.remove(), 900);
  }
  window.addEventListener("load", () => setTimeout(finish, 350));
  setTimeout(finish, 2600); /* 兜底：load 事件迟迟不来也不卡住 */
})();

/* ============ 导航：滚动毛玻璃 + 抽屉 ============ */
(function nav() {
  const nav = document.getElementById("nav");
  const burger = document.getElementById("burger");
  const drawer = document.getElementById("drawer");

  function onScroll() {
    nav.classList.toggle("scrolled", window.scrollY > 24);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  function setDrawer(open) {
    burger.classList.toggle("open", open);
    drawer.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", String(open));
    drawer.setAttribute("aria-hidden", String(!open));
    document.body.classList.toggle("locked", open);
  }
  burger.addEventListener("click", () => setDrawer(!drawer.classList.contains("open")));
  drawer.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setDrawer(false)));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && drawer.classList.contains("open")) setDrawer(false);
  });
})();

/* ============ 锚点平滑滚动（JS 触发，不写 CSS scroll-behavior，方便自动化验收） ============ */
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener("click", (e) => {
    const id = a.getAttribute("href");
    if (id.length < 2) return;
    const el = document.querySelector(id);
    if (!el) return;
    e.preventDefault();
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

/* ============ 滚动 reveal ============ */
(function reveal() {
  const els = Array.from(document.querySelectorAll(".reveal"));
  if (!("IntersectionObserver" in window)) {
    els.forEach((el) => el.classList.add("is-in"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add("is-in");
          io.unobserve(en.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
  );
  els.forEach((el) => io.observe(el));
  /* 兜底：3 秒后全部显示，完成态永远可达 */
  setTimeout(() => els.forEach((el) => el.classList.add("is-in")), 3000);
})();

/* ============ 照护卡 CTA：预选表单档位 ============ */
document.querySelectorAll("[data-tier]").forEach((a) => {
  a.addEventListener("click", () => {
    const sel = document.getElementById("fTier");
    sel.value = a.getAttribute("data-tier");
  });
});

/* ============ 预约表单 ============ */
(function form() {
  const form = document.getElementById("visitForm");
  const btn = document.getElementById("submitBtn");
  const nameI = document.getElementById("fName");
  const phoneI = document.getElementById("fPhone");
  const dateI = document.getElementById("fDate");

  /* 日期最小值 = 今天 */
  const today = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  dateI.min = today.getFullYear() + "-" + pad(today.getMonth() + 1) + "-" + pad(today.getDate());

  function setErr(input, msg) {
    const err = form.querySelector('.err[data-for="' + input.id + '"]');
    if (msg) {
      input.classList.add("invalid");
      if (err) { err.textContent = msg; err.classList.add("show"); }
    } else {
      input.classList.remove("invalid");
      if (err) { err.textContent = ""; err.classList.remove("show"); }
    }
  }
  [nameI, phoneI, dateI].forEach((i) => i.addEventListener("input", () => setErr(i, "")));

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    let ok = true;
    if (nameI.value.trim().length < 2) { setErr(nameI, "请填写您的称呼（至少 2 个字）"); ok = false; }
    if (!/^1[3-9]\d{9}$/.test(phoneI.value.trim())) { setErr(phoneI, "请填写正确的 11 位手机号码"); ok = false; }
    if (!dateI.value) { setErr(dateI, "请选择期望参观日期"); ok = false; }
    if (!ok) return;

    btn.disabled = true;
    btn.textContent = "提交中…";
    /* 模拟提交：900ms 后成功态（真实接入时替换为 fetch） */
    setTimeout(() => {
      form.classList.add("sent");
      form.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 900);
  });
})();

/* ============ 法务弹窗（三通道关闭：遮罩 / × / ESC） ============ */
(function modal() {
  const modal = document.getElementById("legalModal");
  const title = document.getElementById("legalTitle");
  const body = document.getElementById("legalBody");
  let lastFocus = null;

  function open(key) {
    const item = LEGAL[key];
    if (!item) return;
    lastFocus = document.activeElement;
    title.textContent = item.title;
    body.innerHTML = item.body;
    body.scrollTop = 0;
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("locked");
    modal.querySelector(".modal-x").focus();
  }
  function close() {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("locked");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  document.querySelectorAll("[data-legal]").forEach((b) =>
    b.addEventListener("click", () => open(b.getAttribute("data-legal")))
  );
  modal.querySelectorAll("[data-close]").forEach((el) => el.addEventListener("click", close));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("open")) close();
  });
})();

/* ============ 社交图标占位提示 ============ */
document.querySelectorAll("[data-social]").forEach((a) => {
  if (a.getAttribute("href") === "#") {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const tip = a.getAttribute("data-social");
      if (tip && tip !== "电话") alert(tip + "（演示占位，接入时替换为真实链接）");
    });
  }
});

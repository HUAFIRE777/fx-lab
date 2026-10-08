/* esports-page — 燃点 IGNITE
   配置区在顶部：SITE / CFG / LEGAL，买家只改这里 */
"use strict";

/* ================= 配置 ================= */
const SITE = {
  name: "燃点 IGNITE 电竞馆",
  phone: "400-820-1988",
  phoneHref: "tel:4008201988",
  email: "hi@ignite-esports.example.com",
  emailHref: "mailto:hi@ignite-esports.example.com",
  address: "示例市潮流区电竞大道 88 号 B1",
  hours: "24 小时营业，全年无休",
  icp: "京ICP备2026000000号-1",
  year: "2026"
};

const CFG = {
  loaderMin: 650,          // loader 最短展示毫秒
  navOffset: 70,           // 锚点滚动偏移
  revealThreshold: 0.12,   // reveal 触发阈值
  safetyMs: 4000,          // reveal 安全网兜底毫秒
  rigCols: 10,             // 机房阵列列数
  rigRows: 6               // 机房阵列行数
};

const LEGAL = {
  privacy: {
    title: "隐私政策",
    body: [
      "我们收集的信息：您在预订时填写的手机号码、选择的包间类型与时段，仅用于锁位、发送预订码与到店核销。",
      "信息的使用：您的手机号不会用于营销短信轰炸，仅在预订相关（锁位成功、即将超时提醒）时联系您。",
      "信息的保存：预订记录保留 12 个月后自动删除。如需提前删除，请致电客服，我们在 3 个工作日内处理。",
      "信息共享：我们不会向任何第三方出售或共享您的个人信息，法律法规要求配合的除外。",
      "未成年人保护：我们严格遵守《未成年人保护法》及《互联网上网服务营业场所管理条例》，不向未成年人提供上网服务，预订与入场均需有效身份证件核验。"
    ]
  },
  terms: {
    title: "服务条款",
    body: [
      "营业与入场：本馆 24 小时营业。所有顾客入场需出示有效身份证件登记，未成年人谢绝入内，敬请理解。",
      "预订规则：在线预订仅为锁位，不预付费用。包间为您保留 30 分钟，超时未到店自动释放，不收取任何费用。",
      "取消与改期：开场前 1 小时可免费取消或改期；开场后取消按已使用时长计费，不足 1 小时按 1 小时计。",
      "设备使用：请爱护设备，人为损坏（泼洒液体、摔打外设等）需按维修成本赔偿。验机承诺：配置与公示不符，当小时免费。",
      "场内行为：禁止吸烟（设有室外吸烟区）、禁止大声喧哗影响他人、禁止携带外卖酒水之外的危险品。违规者我们有权请离且不退款。",
      "通宵场：23:00–07:00 一口价，含基础饮品。通宵期间 02:00–06:00 音量自动调低，请配合。"
    ]
  },
  cookie: {
    title: "Cookie 政策",
    body: [
      "本页面为静态展示页，仅使用浏览器本地存储记住您的菜单偏好等基础设置，不部署任何第三方追踪 Cookie。",
      "我们不会通过 Cookie 收集您的浏览行为用于广告画像，也没有接入任何广告联盟代码。",
      "您可以在浏览器设置中随时清除本地存储数据，不影响页面正常浏览与预订功能。",
      "如未来上线会员系统需要使用 Cookie，我们会提前更新本政策并显著提示。"
    ]
  }
};

/* ================= 工具 ================= */
const $ = (s, c) => (c || document).querySelector(s);
const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));

/* ================= SITE 绑定 ================= */
$$("[data-site]").forEach(el => {
  const k = el.getAttribute("data-site");
  if (!(k in SITE)) return;
  if (el.tagName === "A" && /Href$/.test(k)) el.setAttribute("href", SITE[k]);
  else el.textContent = SITE[k];
});

/* ================= loader ================= */
(function loader(){
  const tips = ["正在点亮机位…", "正在校准 240Hz…", "正在预热显卡…", "欢迎来到燃点"];
  const tipEl = $("#loaderTip"), fill = $("#loaderFill"), box = $("#loader");
  let i = 0, p = 0;
  const tipTimer = setInterval(() => { i = (i + 1) % tips.length; tipEl.textContent = tips[i]; }, 320);
  const barTimer = setInterval(() => {
    p = Math.min(100, p + 8 + Math.random() * 14);
    fill.style.width = p + "%";
    if (p >= 100) {
      clearInterval(barTimer);
      setTimeout(() => {
        clearInterval(tipTimer);
        box.classList.add("done");
        setTimeout(() => box.remove(), 600);
        heroIntro();
      }, Math.max(0, CFG.loaderMin - 900));
    }
  }, 120);
})();

/* ================= 导航 ================= */
const nav = $("#nav");
const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 24);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

/* 锚点平滑滚动（带偏移） */
$$("[data-nav]").forEach(a => {
  a.addEventListener("click", e => {
    const id = a.getAttribute("href");
    if (!id || !id.startsWith("#")) return;
    const t = $(id);
    if (!t) return;
    e.preventDefault();
    closeDrawer();
    const y = t.getBoundingClientRect().top + window.scrollY - CFG.navOffset;
    window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
  });
});

/* 移动端抽屉 */
const drawer = $("#drawer"), scrim = $("#drawerScrim"), burger = $("#burger");
function openDrawer(){
  drawer.classList.add("open"); scrim.classList.add("show");
  document.body.classList.add("locked");
  drawer.setAttribute("aria-hidden", "false");
  burger.setAttribute("aria-expanded", "true");
}
function closeDrawer(){
  drawer.classList.remove("open"); scrim.classList.remove("show");
  document.body.classList.remove("locked");
  drawer.setAttribute("aria-hidden", "true");
  burger.setAttribute("aria-expanded", "false");
}
burger.addEventListener("click", () => drawer.classList.contains("open") ? closeDrawer() : openDrawer());
$("#drawerClose").addEventListener("click", closeDrawer);
scrim.addEventListener("click", closeDrawer);

/* ================= hero：机房阵列 + 霓虹扫描线 ================= */
(function buildRigs(){
  const grid = $("#rigGrid");
  const total = CFG.rigCols * CFG.rigRows;
  const frag = document.createDocumentFragment();
  for (let i = 0; i < total; i++) {
    const d = document.createElement("div");
    d.className = "rig";
    d.dataset.col = String(i % CFG.rigCols);
    frag.appendChild(d);
  }
  grid.appendChild(frag);
})();

/* 标题行内层包裹（用于上滑入场） */
$$(".hero-title .line").forEach(line => {
  const inner = document.createElement("span");
  while (line.firstChild) inner.appendChild(line.firstChild);
  line.appendChild(inner);
});

let heroStarted = false;
function heroIntro(){
  if (heroStarted) return;
  heroStarted = true;
  // 标题逐行上滑（完成态：transform 归零，由 CSS transition 保证可达）
  gsap.fromTo(".hero-title .line > span",
    { yPercent: 112 },
    { yPercent: 0, duration: 1.1, stagger: 0.14, ease: "power3.out" });
  gsap.fromTo(".hero .rv",
    { opacity: 0, y: 24 },
    { opacity: 1, y: 0, duration: 0.9, stagger: 0.12, ease: "power2.out",
      onComplete(){ $$(".hero .rv").forEach(el => el.classList.add("in")); } });
  startScan();
}

/* 霓虹扫描线：本页唯一主视觉动效，无限循环 */
function startScan(){
  const scan = $("#scanline");
  const rigs = $$(".rig");
  const cols = CFG.rigCols;
  const travel = () => window.innerWidth + 280;

  function sweep(){
    const tl = gsap.timeline({ onComplete: sweep });
    // 扫描线从左扫到右
    tl.fromTo(scan, { x: -140 }, { x: travel(), duration: 3.4, ease: "power2.inOut" }, 0);
    // 扫描线经过的列，机位逐个点亮
    for (let c = 0; c < cols; c++) {
      const at = (c / cols) * 3.4;
      tl.call(() => {
        rigs.forEach(r => {
          if (+r.dataset.col === c) r.classList.add("lit");
          else if (+r.dataset.col < c - 1) r.classList.remove("lit");
        });
      }, null, at);
    }
    // 扫完熄灯，留 0.8 秒呼吸
    tl.call(() => rigs.forEach(r => r.classList.remove("lit")), null, 3.4);
    tl.to({}, { duration: 0.9 });
  }
  sweep();

  // 能量脉冲：扫描线每扫完一轮，整排随机机位闪一下（点缀，不抢戏）
  setInterval(() => {
    const pick = rigs.filter(() => Math.random() < 0.06);
    pick.forEach(r => r.classList.add("lit"));
    setTimeout(() => pick.forEach(r => r.classList.remove("lit")), 700);
  }, 2400);
}

/* ================= 滚动 reveal ================= */
(function reveal(){
  const els = $$(".section .rv, .footer .rv");
  if (!("IntersectionObserver" in window)) {
    els.forEach(el => el.classList.add("in"));
    return;
  }
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        // 同级阶梯延迟
        const sibs = Array.from(en.target.parentElement.querySelectorAll(":scope > .rv"));
        const idx = Math.max(0, sibs.indexOf(en.target));
        en.target.style.transitionDelay = Math.min(idx * 0.08, 0.4) + "s";
        en.target.classList.add("in");
        io.unobserve(en.target);
      }
    });
  }, { threshold: CFG.revealThreshold, rootMargin: "0px 0px -8% 0px" });
  els.forEach(el => io.observe(el));
  // 安全网：4 秒后未点亮的一律点亮（防 IO 漏报，完成态必达）
  setTimeout(() => els.forEach(el => el.classList.add("in")), CFG.safetyMs);
})();

/* 价格卡“选这个” → 预填包间类型 */
$$("[data-room]").forEach(a => {
  a.addEventListener("click", () => {
    const sel = $("#fRoom");
    if (sel) sel.value = a.getAttribute("data-room");
  });
});

/* ================= 预订表单 ================= */
(function booking(){
  const form = $("#bookForm");
  const success = $("#bookSuccess");
  const submitBtn = $("#bookSubmit");
  const dateInput = $("#fDate");

  // 日期不允许选过去
  const today = new Date();
  const iso = d => d.toISOString().slice(0, 10);
  dateInput.min = iso(today);
  dateInput.value = iso(today);

  const roomNames = { hall: "大厅卡座", duo: "双人包间", team5: "五黑对战房", vip: "豪华主题包间" };

  function setErr(name, msg){
    const field = form.querySelector(`[data-err="${name}"]`).closest(".field");
    field.classList.toggle("invalid", !!msg);
    field.querySelector(".err").textContent = msg || "";
  }

  function validate(){
    let firstBad = null;
    const room = $("#fRoom").value;
    const date = dateInput.value;
    const slot = $("#fSlot").value;
    const phone = $("#fPhone").value.trim();

    setErr("room", room ? "" : "请选择包间类型");
    setErr("date", date ? "" : "请选择日期");
    setErr("slot", slot ? "" : "请选择时段");
    let phoneMsg = "";
    if (!phone) phoneMsg = "请填写手机号";
    else if (!/^1\d{10}$/.test(phone)) phoneMsg = "手机号格式不对，应为 11 位数字";
    setErr("phone", phoneMsg);

    ["room", "date", "slot", "phone"].forEach(n => {
      const f = form.querySelector(`[data-err="${n}"]`).closest(".field");
      if (f.classList.contains("invalid") && !firstBad) firstBad = f.querySelector("input,select");
    });
    if (firstBad) firstBad.focus();
    return !form.querySelector(".field.invalid");
  }

  form.addEventListener("submit", e => {
    e.preventDefault();
    if (!validate()) return;
    submitBtn.classList.add("loading");
    submitBtn.disabled = true;
    // 模拟锁位请求
    setTimeout(() => {
      const code = "IGN-" + Math.floor(1000 + Math.random() * 9000);
      $("#bookCode").textContent = code;
      $("#bookDetail").textContent =
        `${roomNames[$("#fRoom").value]} · ${dateInput.value} ${$("#fSlot").value} · 尾号 ${$("#fPhone").value.trim().slice(-4)}`;
      form.hidden = true;
      success.hidden = false;
      // 成功态入场（完成态可达：直接加 .show）
      requestAnimationFrame(() => success.classList.add("show"));
      submitBtn.classList.remove("loading");
      submitBtn.disabled = false;
    }, 900);
  });

  $("#bookAgain").addEventListener("click", () => {
    success.classList.remove("show");
    success.hidden = true;
    form.hidden = false;
    form.reset();
    dateInput.value = iso(today);
  });

  // 输入时清除错误态
  form.addEventListener("input", e => {
    const f = e.target.closest(".field");
    if (f && f.classList.contains("invalid")) {
      f.classList.remove("invalid");
      f.querySelector(".err").textContent = "";
    }
  });
})();

/* ================= 法务弹窗 ================= */
(function legal(){
  const modal = $("#legalModal"), body = $("#legalBody"), title = $("#legalTitle");
  const closeBtn = $("#legalClose"), okBtn = $("#legalOk"), scrimEl = $("#legalScrim");
  let lastFocus = null;

  function open(key){
    const doc = LEGAL[key];
    if (!doc) return;
    lastFocus = document.activeElement;
    title.textContent = doc.title;
    body.innerHTML = "";
    const ol = document.createElement("ol");
    doc.body.forEach(t => {
      const li = document.createElement("li");
      li.textContent = t;
      ol.appendChild(li);
    });
    body.appendChild(ol);
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("locked");
    closeBtn.focus();
  }
  function close(){
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("locked");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  $$("[data-legal]").forEach(b => b.addEventListener("click", () => open(b.getAttribute("data-legal"))));
  // 三通道关闭：按钮 / 遮罩 / ESC
  closeBtn.addEventListener("click", close);
  okBtn.addEventListener("click", close);
  scrimEl.addEventListener("click", close);
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && modal.classList.contains("open")) close();
  });
})();

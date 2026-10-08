/* ============ MONO 整站首页 · main.js (classic script) ============ */
(function () {
"use strict";

/* ---------- 配置参数（换商品 / 换配色只改这里） ---------- */
var CONFIG = {
  accent: "#FF4D00",
  revealMs: 700,          // 区块 reveal 时长
  heroStagger: 0.12,      // hero 逐行升起间隔(秒)
  toastMs: 2200,          // toast 停留时长
  cardFakeLoadMs: 650,    // 商品图模拟加载时长
  currency: "￥"
};

/* ---------- 站点配置（公司信息集中在这里，页脚引用渲染） ---------- */
var SITE = {
  brand: "MONO",
  organizer: "MONO",
  address: "上海市徐汇区复兴中路 1 号（示例）",
  email: "service@mono-store.example（示例）",
  phone: "400-000-0000（示例）",
  icp: "沪ICP备00000000号-1（示例）"
};

/* 商品数据：id / 名称 / 一句话描述 / 价格 / 旧价(可选) / 标签(可选) / 衣型键 / 配色 */
var PRODUCTS = [
  { id: "p1", name: "廓形连帽卫衣", desc: "480g 重磅抓绒，落肩廓形", price: 599, old: 799, tag: "热卖", g: "hoodie", c1: "#3a3a3e", c2: "#262628", bg: "#f2f1ed" },
  { id: "p2", name: "重磅纯棉 T 恤", desc: "260g 精梳棉，不透不垮", price: 299, g: "tee", c1: "#cfccc4", c2: "#aaa69d", bg: "#f2f1ed" },
  { id: "p3", name: "束脚运动长裤", desc: "四面弹针织，跑步通勤两穿", price: 499, g: "jogger", c1: "#2f2f33", c2: "#1f1f22", bg: "#f4f2ee" },
  { id: "p4", name: "轻量防风夹克", desc: "DWR 防泼水，整衣可收纳", price: 899, old: 1099, tag: "新品", g: "jacket", c1: "#4a4a4e", c2: "#333336", bg: "#eeede9" },
  { id: "p5", name: "针织冷帽", desc: "美利奴羊毛混纺，亲肤不扎", price: 149, g: "beanie", c1: "#b9502a", c2: "#96401f", bg: "#f2f1ed" },
  { id: "p6", name: "帆布托特包", desc: "16oz 帆布，能装下 14 寸电脑", price: 349, g: "tote", c1: "#d8d2c6", c2: "#b9b2a4", bg: "#eceae5" },
  { id: "p7", name: "训练短袜 · 3 双装", desc: "足弓加压，久站不累", price: 129, g: "socks", c1: "#3a3a3e", c2: "#262628", bg: "#f4f2ee" },
  { id: "p8", name: "立领针织开衫", desc: "高领可立，通勤气场全开", price: 699, tag: "限量", g: "cardigan", c1: "#57534c", c2: "#3e3b35", bg: "#eeede9" }
];

/* 品类磁贴数据 */
var CATS = [
  { key: "run", name: "跑步", en: "RUNNING", cls: "t-run" },
  { key: "day", name: "日常", en: "EVERYDAY", cls: "t-day" },
  { key: "out", name: "户外", en: "OUTDOOR", cls: "t-out" }
];

/* ---------- 程序化服装示意 SVG（几何+色块，无外部图片） ---------- */
function garmentSVG(p) {
  var vb = "0 0 400 440", inner = "";
  var c1 = p.c1, c2 = p.c2;
  switch (p.g) {
    case "hoodie":
      inner = '<path d="M200 92 C148 92 126 134 126 176 L82 197 C52 210 46 256 62 288 L96 281 C88 248 92 226 101 215 L101 396 L299 396 L299 215 C308 226 312 248 304 281 L338 288 C354 256 348 210 318 197 L274 176 C274 134 252 92 200 92 Z" fill="' + c1 + '"/>' +
        '<path d="M166 152 C166 114 234 114 234 152 C234 184 166 184 166 152 Z" fill="' + c2 + '"/>' +
        '<rect x="152" y="300" width="96" height="62" rx="10" fill="' + c2 + '" opacity=".55"/>';
      break;
    case "tee":
      inner = '<path d="M152 84 L108 106 L64 168 L100 194 L116 172 L116 392 L284 392 L284 172 L300 194 L336 168 L292 106 L248 84 C238 110 162 110 152 84 Z" fill="' + c1 + '"/>' +
        '<path d="M152 84 C162 110 238 110 248 84 L240 76 C230 98 170 98 160 76 Z" fill="' + c2 + '"/>';
      break;
    case "jogger":
      inner = '<rect x="132" y="76" width="136" height="34" rx="8" fill="' + c2 + '"/>' +
        '<path d="M136 110 L196 110 L192 392 L138 392 Z" fill="' + c1 + '"/>' +
        '<path d="M204 110 L264 110 L262 392 L208 392 Z" fill="' + c1 + '"/>' +
        '<rect x="134" y="368" width="62" height="24" rx="8" fill="' + c2 + '"/>' +
        '<rect x="204" y="368" width="62" height="24" rx="8" fill="' + c2 + '"/>' +
        '<path d="M196 110 L204 110 L202 300 L198 300 Z" fill="' + c2 + '" opacity=".6"/>';
      break;
    case "jacket":
      inner = '<path d="M148 96 L200 76 L252 96 L268 392 L132 392 Z" fill="' + c1 + '"/>' +
        '<path d="M148 96 L200 130 L252 96 L244 84 L200 104 L156 84 Z" fill="' + c2 + '"/>' +
        '<rect x="197" y="104" width="6" height="288" fill="' + c2 + '"/>' +
        '<path d="M148 110 L112 130 L96 260 L128 268 L144 180 Z" fill="' + c1 + '"/>' +
        '<path d="M252 110 L288 130 L304 260 L272 268 L256 180 Z" fill="' + c1 + '"/>' +
        '<rect x="132" y="356" width="136" height="18" rx="6" fill="' + c2 + '" opacity=".6"/>';
      break;
    case "beanie":
      inner = '<path d="M120 250 C120 170 280 170 280 250 L280 300 L120 300 Z" fill="' + c1 + '"/>' +
        '<rect x="112" y="292" width="176" height="52" rx="14" fill="' + c2 + '"/>' +
        '<circle cx="200" cy="152" r="30" fill="' + c2 + '"/>' +
        '<path d="M150 230 C170 200 230 200 250 230" stroke="' + c2 + '" stroke-width="8" fill="none" opacity=".5"/>';
      break;
    case "tote":
      inner = '<path d="M118 190 L282 190 L302 400 L98 400 Z" fill="' + c1 + '"/>' +
        '<path d="M150 190 C150 120 180 100 200 100 C220 100 250 120 250 190" stroke="' + c2 + '" stroke-width="14" fill="none"/>' +
        '<rect x="118" y="190" width="164" height="16" fill="' + c2 + '" opacity=".55"/>' +
        '<rect x="180" y="270" width="44" height="44" rx="6" fill="' + CONFIG.accent + '" opacity=".92"/>';
      break;
    case "socks":
      inner = '<g><rect x="110" y="120" width="64" height="200" rx="30" fill="' + c1 + '"/>' +
        '<rect x="110" y="120" width="64" height="46" rx="20" fill="' + c2 + '"/>' +
        '<path d="M110 290 L110 320 L190 320 L190 290 Z" fill="' + c1 + '"/>' +
        '<rect x="226" y="150" width="64" height="200" rx="30" fill="' + c2 + '"/>' +
        '<rect x="226" y="150" width="64" height="46" rx="20" fill="' + c1 + '"/>' +
        '<path d="M226 320 L226 350 L306 350 L306 320 Z" fill="' + c2 + '"/></g>';
      break;
    case "cardigan":
      inner = '<path d="M148 92 L200 76 L252 92 L264 396 L136 396 Z" fill="' + c1 + '"/>' +
        '<path d="M148 92 L200 170 L252 92 L240 82 L200 140 L160 82 Z" fill="' + c2 + '"/>' +
        '<rect x="197" y="140" width="6" height="256" fill="' + c2 + '" opacity=".7"/>' +
        [200, 250, 300, 350].map(function (y) { return '<circle cx="200" cy="' + y + '" r="7" fill="' + c2 + '"/>'; }).join("") +
        '<path d="M148 106 L116 124 L104 250 L134 258 L146 176 Z" fill="' + c1 + '"/>' +
        '<path d="M252 106 L284 124 L296 250 L266 258 L254 176 Z" fill="' + c1 + '"/>';
      break;
  }
  return '<svg class="prod" viewBox="' + vb + '" style="background:' + p.bg + '" aria-hidden="true">' + inner + "</svg>";
}

function tileSVG(c) {
  var inner = "";
  if (c.key === "run") {
    inner = '<rect width="600" height="450" class="tl-bg"/>' +
      '<path d="M0 330 L600 330" class="tl-line" stroke-dasharray="26 20"/>' +
      '<path d="M0 380 L600 380" class="tl-line" opacity=".35"/>' +
      '<circle cx="330" cy="150" r="26" class="tl-fig"/>' +
      '<path d="M330 180 L300 260 L240 320 M330 180 L370 250 L430 300 M330 180 L340 250 L300 300 M330 180 L320 250 L360 310" stroke="#FF4D00" stroke-width="16" fill="none" stroke-linecap="round"/>';
  } else if (c.key === "day") {
    inner = '<rect width="600" height="450" class="tl-bg"/>' +
      '<rect x="70" y="130" width="110" height="320" class="tl-b1"/>' +
      '<rect x="200" y="80" width="130" height="370" class="tl-b2"/>' +
      '<rect x="350" y="160" width="100" height="290" class="tl-b3"/>' +
      '<rect x="470" y="110" width="90" height="340" class="tl-b1"/>' +
      '<g class="tl-win"><rect x="220" y="110" width="22" height="22"/><rect x="252" y="110" width="22" height="22"/><rect x="220" y="144" width="22" height="22"/><rect x="90" y="160" width="20" height="20"/><rect x="486" y="140" width="18" height="18"/></g>';
  } else {
    inner = '<rect width="600" height="450" class="tl-bg"/>' +
      '<circle cx="450" cy="110" r="44" class="tl-sun"/>' +
      '<path d="M60 400 L220 170 L380 400 Z" class="tl-m1"/>' +
      '<path d="M280 400 L430 220 L580 400 Z" class="tl-m2"/>' +
      '<path d="M190 210 L220 170 L250 210 L235 230 L205 230 Z" fill="#fff" opacity=".85"/>';
  }
  return '<svg viewBox="0 0 600 450" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' + inner + "</svg>";
}

/* ---------- 渲染：品类磁贴 ---------- */
var tilesEl = document.getElementById("tiles");
CATS.forEach(function (c) {
  var a = document.createElement("a");
  a.className = "tile " + c.cls + " reveal";
  a.href = "#products";
  a.innerHTML = tileSVG(c) +
    '<div class="tile-label"><b>' + c.name + '</b><span>' + c.en + " · 去看看 →</span></div>";
  tilesEl.appendChild(a);
});

/* ---------- 渲染：商品卡 ---------- */
var gridEl = document.getElementById("grid");
var gridEmpty = document.getElementById("gridEmpty");
PRODUCTS.forEach(function (p) {
  var card = document.createElement("article");
  card.className = "card reveal";
  card.dataset.name = p.name;
  card.dataset.id = p.id;
  var tag = p.tag ? '<span class="card-tag">' + p.tag + "</span>" : "";
  var old = p.old ? '<span class="old">' + CONFIG.currency + p.old + "</span>" : "";
  card.innerHTML =
    '<div class="card-media"><div class="ph"></div>' + tag + garmentSVG(p) +
    '<button class="quick-add" data-add="' + p.id + '">快速加购 · ' + CONFIG.currency + p.price + "</button></div>" +
    '<div class="card-info"><h3 class="card-name">' + p.name + "</h3>" +
    '<p class="card-desc">' + p.desc + "</p>" +
    '<p class="card-price' + (p.old ? " hot" : "") + '">' + CONFIG.currency + p.price + old + "</p></div>";
  gridEl.appendChild(card);
});

/* 模拟图片加载：骨架 → 淡入（加载态） */
setTimeout(function () {
  var cards = gridEl.querySelectorAll(".card");
  for (var i = 0; i < cards.length; i++) cards[i].classList.add("ready");
}, CONFIG.cardFakeLoadMs);

/* ---------- 法务三件套：公司信息渲染 + 模态弹窗 ---------- */
document.querySelectorAll("[data-site]").forEach(function (el) {
  var k = el.getAttribute("data-site");
  if (SITE[k] !== undefined) el.textContent = SITE[k];
});

/* 弹窗：X / 遮罩点击 / ESC 关闭，打开时锁 body 滚动 */
var legalModals = {};
document.querySelectorAll(".legal-modal").forEach(function (m) {
  legalModals[m.id.replace("modal-", "")] = m;
});
var modalLastFocus = null;
function openModal(key) {
  var m = legalModals[key];
  if (!m) return;
  modalLastFocus = document.activeElement;
  m.classList.add("open");
  m.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  var close = m.querySelector(".lm-close");
  if (close) close.focus();
}
function closeModal() {
  var m = document.querySelector(".legal-modal.open");
  if (!m) return false;
  m.classList.remove("open");
  m.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  if (modalLastFocus && modalLastFocus.focus) modalLastFocus.focus();
  return true;
}
/* 页脚链接：点击弹对应弹窗（href 仅作语义，JS 拦截） */
document.querySelectorAll("[data-modal]").forEach(function (a) {
  a.addEventListener("click", function (e) { e.preventDefault(); openModal(a.dataset.modal); });
});
/* 遮罩点击与 X 按钮关闭 */
document.querySelectorAll(".legal-modal").forEach(function (m) {
  m.addEventListener("click", function (e) {
    if (e.target === m || e.target.closest(".lm-close")) closeModal();
  });
});

/* ---------- 导航滚动：底边线 + 毛玻璃 ---------- */
var nav = document.getElementById("nav");
function onScroll() { nav.classList.toggle("scrolled", window.scrollY > 12); }
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

/* ---------- 移动端抽屉 ---------- */
var burger = document.getElementById("burger"),
    drawer = document.getElementById("drawer"),
    mask = document.getElementById("drawerMask"),
    drawerClose = document.getElementById("drawerClose");
function setDrawer(open) {
  drawer.classList.toggle("open", open);
  mask.classList.toggle("open", open);
  burger.setAttribute("aria-expanded", open ? "true" : "false");
  document.body.style.overflow = open ? "hidden" : "";
}
burger.addEventListener("click", function () { setDrawer(true); });
drawerClose.addEventListener("click", function () { setDrawer(false); });
mask.addEventListener("click", function () { setDrawer(false); });
drawer.querySelectorAll("a").forEach(function (a) {
  a.addEventListener("click", function () { setDrawer(false); });
});

/* ---------- 搜索浮层：输入即筛选 ---------- */
var searchOverlay = document.getElementById("searchOverlay"),
    searchInput = document.getElementById("searchInput");
function setSearch(open) {
  searchOverlay.classList.toggle("open", open);
  searchOverlay.setAttribute("aria-hidden", open ? "false" : "true");
  if (open) { searchInput.value = ""; filterGrid(""); setTimeout(function(){ searchInput.focus(); }, 60); }
}
document.getElementById("searchBtn").addEventListener("click", function () { setSearch(true); });
document.getElementById("searchClose").addEventListener("click", function () { setSearch(false); });
document.addEventListener("keydown", function (e) { if (e.key === "Escape") { closeModal(); setSearch(false); setDrawer(false); } });
searchInput.addEventListener("input", function () { filterGrid(searchInput.value.trim()); });
function filterGrid(q) {
  var n = 0;
  gridEl.querySelectorAll(".card").forEach(function (card) {
    var hit = !q || card.dataset.name.indexOf(q) !== -1;
    card.style.display = hit ? "" : "none";
    if (hit) n++;
  });
  gridEmpty.hidden = n !== 0;
}

/* ---------- 加购：数字徽标 + toast ---------- */
var bagCount = document.getElementById("bagCount"),
    toast = document.getElementById("toast"),
    toastTimer = null, cartN = 0;
var NAME = {};
PRODUCTS.forEach(function (p) { NAME[p.id] = p.name; });

function showToast(text) {
  toast.innerHTML = '<span class="dot"></span>' + text;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { toast.classList.remove("show"); }, CONFIG.toastMs);
}
function bumpBadge() {
  bagCount.textContent = cartN;
  bagCount.classList.add("show");
  if (window.gsap) {
    gsap.fromTo(bagCount, { scale: 1.6 }, { scale: 1, duration: 0.45, ease: "back.out(3)" });
  }
}
gridEl.addEventListener("click", function (e) {
  var btn = e.target.closest("[data-add]");
  if (!btn) return;
  cartN++;
  bumpBadge();
  showToast("已加入购物袋 · " + NAME[btn.dataset.add] + "（共 " + cartN + " 件）");
  if (window.gsap) {
    gsap.fromTo(btn, { scale: 0.94 }, { scale: 1, duration: 0.3, ease: "back.out(2)" });
  }
});
document.getElementById("bagBtn").addEventListener("click", function () {
  showToast(cartN === 0 ? "购物袋还是空的，去挑一件吧" : "购物袋共 " + cartN + " 件 · 演示站暂不结算");
});

/* ---------- 订阅 ---------- */
document.getElementById("subForm").addEventListener("submit", function (e) {
  e.preventDefault();
  var input = document.getElementById("subEmail");
  if (!input.value || input.value.indexOf("@") === -1) {
    showToast("邮箱格式不对，再检查一下");
    return;
  }
  document.getElementById("subOk").hidden = false;
  input.value = "";
  showToast("订阅成功，欢迎加入 MONO");
});

/* ---------- 动效：hero 逐行升起 + 滚动 reveal ---------- */
function forceVisible() {
  /* 兜底：GSAP 加载失败时，保证隐藏元素全部可达 */
  document.documentElement.classList.add("hero-in");
  document.querySelectorAll(".rl-line").forEach(function (el) { el.style.transform = "none"; });
  document.querySelectorAll(".reveal").forEach(function (el) {
    el.style.opacity = "1"; el.style.transform = "none";
  });
  var art = document.querySelector(".hero-art");
  if (art) art.style.opacity = "1";
}

if (window.gsap) {
  /* hero 大字逐行升起
     防坑（GSAP 百分比位移）：先清掉 CSS 的 translateY(112%) 初值，
     再用 yPercent 起播；播完给 html 加 hero-in 类兜住完成态，
     最后才清 props——否则 CSS 兜底规则会把行压回去。 */
  var lines = document.querySelectorAll(".rl-line");
  lines.forEach(function (el) { el.style.transform = "none"; });
  gsap.set(lines, { yPercent: 112 });
  gsap.to(lines, {
    yPercent: 0, duration: 1.05, ease: "power3.out",
    stagger: CONFIG.heroStagger, delay: 0.15,
    onComplete: function () {
      document.documentElement.classList.add("hero-in");
      gsap.set(lines, { clearProps: "all" });
    }
  });
  /* hero 视觉淡入上浮 */
  gsap.fromTo(".hero-art", { opacity: 0, y: 44 }, { opacity: 1, y: 0, duration: 1.2, ease: "power3.out", delay: 0.35 });

  /* 区块滚动 reveal */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      io.unobserve(en.target);
      gsap.to(en.target, { opacity: 1, y: 0, duration: CONFIG.revealMs / 1000, ease: "power3.out" });
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });

  /* 安全网：3 秒后视口内仍有隐藏元素 → 强制显示（只管视口内，不破坏下方滚动 reveal） */
  setTimeout(function () {
    var needFix = false;
    document.querySelectorAll(".reveal").forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0 && getComputedStyle(el).opacity === "0") needFix = true;
    });
    var art = document.querySelector(".hero-art");
    if (art && getComputedStyle(art).opacity === "0") needFix = true;
    var hiddenLine = false;
    lines.forEach(function (el) {
      if (!document.documentElement.classList.contains("hero-in") && getComputedStyle(el).transform !== "none") hiddenLine = true;
    });
    if (needFix || hiddenLine) forceVisible();
  }, 3000);
} else {
  forceVisible();
}

})();

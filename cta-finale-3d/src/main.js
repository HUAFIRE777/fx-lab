/* huafire3d fx-lab — original implementation */
(function () {
"use strict";

/* ============ CONFIG：换文案/链接/配色只改这里 ============ */
var CONFIG = {
  kicker: "READY WHEN YOU ARE",
  titleLines: ["Let's make", "something rare."],
  accentLine: 1,                 // 第几行用强调色（-1 = 不用）
  sub: "One page, one idea, executed properly. Tell us where to send the first draft.",
  ctaLabel: "Start your project",
  ctaHref: "#contact",           // 改成真实链接；http(s) 开头点击成功后会自动跳转
  successLabel: "Brief received — we'll reply within 24 hours.",
  brand: "Huafire Studio",
  links: [
    { label: "Twitter", href: "#" },
    { label: "GitHub", href: "#" },
    { label: "Email", href: "#" }
  ],
  accent: "#ff5c1f",
  starCount: 150,
  burstCount: 90
};
/* =========================================================== */

var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
var isTouch = window.matchMedia("(hover: none)").matches;
var DPR = Math.min(window.devicePixelRatio || 1, isTouch ? 1.5 : 2);

/* ---------- 画布：星空视差 + 点击粒子爆发 ---------- */
var canvas = document.getElementById("stars");
var ctx = canvas.getContext("2d");
var W = 0, H = 0;
var stars = [], parts = [], rings = [];
var mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };

function resize() {
  W = window.innerWidth; H = window.innerHeight;
  canvas.width = W * DPR; canvas.height = H * DPR;
  canvas.style.width = W + "px"; canvas.style.height = H + "px";
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}
window.addEventListener("resize", resize);
resize();

function initStars() {
  stars = [];
  for (var i = 0; i < CONFIG.starCount; i++) {
    stars.push({
      x: Math.random(), y: Math.random(),
      r: 0.4 + Math.random() * 1.4,
      depth: 0.25 + Math.random() * 0.75,
      phase: Math.random() * Math.PI * 2,
      speed: 0.4 + Math.random() * 1.2
    });
  }
}
initStars();

function spawnBurst(x, y) {
  if (reduceMotion) return;
  var palette = [CONFIG.accent, "#ffd9a8", "#ffffff", "#ff8a3d"];
  for (var i = 0; i < CONFIG.burstCount; i++) {
    var a = Math.random() * Math.PI * 2;
    var sp = 2 + Math.random() * 7;
    parts.push({
      x: x, y: y,
      vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 2.5,
      life: 1, decay: 0.008 + Math.random() * 0.014,
      size: 1.5 + Math.random() * 3.2,
      color: palette[(Math.random() * palette.length) | 0]
    });
  }
  rings.push({ r: 6, maxR: 130, alpha: 0.55 });
}

var T = 0;
function frame() {
  T += 0.016;
  // 鼠标视差做平滑跟随
  mouse.x += (mouse.tx - mouse.x) * 0.06;
  mouse.y += (mouse.ty - mouse.y) * 0.06;

  ctx.clearRect(0, 0, W, H);

  // 星空
  var i, s, sx, sy, tw;
  for (i = 0; i < stars.length; i++) {
    s = stars[i];
    sx = (s.x + (mouse.x - 0.5) * 0.05 * s.depth + T * 0.00012 * s.depth) % 1;
    if (sx < 0) sx += 1;
    sy = (s.y + (mouse.y - 0.5) * 0.05 * s.depth) % 1;
    if (sy < 0) sy += 1;
    tw = reduceMotion ? 0.7 : 0.3 + 0.7 * Math.abs(Math.sin(T * s.speed + s.phase));
    ctx.globalAlpha = tw * (0.25 + 0.55 * s.depth);
    ctx.fillStyle = "#cfd4e6";
    ctx.beginPath();
    ctx.arc(sx * W, sy * H, s.r, 0, 6.2832);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // 冲击波圆环
  ctx.globalCompositeOperation = "lighter";
  for (i = rings.length - 1; i >= 0; i--) {
    var rg = rings[i];
    rg.r += (rg.maxR - rg.r) * 0.16;
    rg.alpha *= 0.9;
    if (rg.alpha < 0.02) { rings.splice(i, 1); continue; }
    ctx.globalAlpha = rg.alpha;
    ctx.strokeStyle = CONFIG.accent;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(rg.x0 || W / 2, rg.y0 || H / 2, rg.r, 0, 6.2832); ctx.stroke();
  }

  // 爆发粒子
  for (i = parts.length - 1; i >= 0; i--) {
    var p = parts[i];
    p.vy += 0.14; p.vx *= 0.986; p.vy *= 0.99;
    p.x += p.vx; p.y += p.vy; p.life -= p.decay;
    if (p.life <= 0) { parts.splice(i, 1); continue; }
    ctx.globalAlpha = Math.max(p.life, 0);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * p.life, 0, 6.2832);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";

  // 磁吸弹簧
  stepMagnet();

  requestAnimationFrame(frame);
}

window.addEventListener("mousemove", function (e) {
  mouse.tx = e.clientX / W; mouse.ty = e.clientY / H;
}, { passive: true });

/* ---------- 巨型标题：逐字升起 ---------- */
var titleEl = document.getElementById("title");
CONFIG.titleLines.forEach(function (line, li) {
  var wrap = document.createElement("span");
  wrap.className = "tline" + (li === CONFIG.accentLine ? " accent-line" : "");
  var words = line.split(" ");
  words.forEach(function (word, wi) {
    var wspan = document.createElement("span");
    wspan.className = "tword";
    for (var c = 0; c < word.length; c++) {
      var ch = document.createElement("span");
      ch.className = "tch";
      ch.textContent = word[c];
      wspan.appendChild(ch);
    }
    wrap.appendChild(wspan);
    if (wi < words.length - 1) wrap.appendChild(document.createTextNode("\u00A0"));
  });
  titleEl.appendChild(wrap);
});

function reveal() {
  document.getElementById("kicker").classList.add("on");
  // 逐字延迟：按全局序号 stagger
  var chars = titleEl.querySelectorAll(".tch");
  for (var i = 0; i < chars.length; i++) {
    chars[i].style.transitionDelay = (0.35 + i * 0.028) + "s";
  }
  titleEl.classList.add("on");
  document.getElementById("sub").classList.add("on");
  document.getElementById("magnet-zone").classList.add("on");
  document.querySelector(".btn-caption").textContent = "";
}
if (reduceMotion) {
  reveal(); // 直接显示，无动画
} else {
  window.addEventListener("load", function () { setTimeout(reveal, 250); });
  setTimeout(reveal, 3000); // 兜底：load 不触发也能显示（防标题隐身）
}

/* ---------- 磁吸按钮：弹簧物理 ---------- */
var zone = document.getElementById("magnet-zone");
var btn = document.getElementById("cta");
var label = btn.querySelector(".btn-label");
var mag = { x: 0, y: 0, vx: 0, vy: 0, active: false };
var MAGNETIC = !reduceMotion && !isTouch;

zone.addEventListener("mousemove", function (e) {
  if (!MAGNETIC) return;
  var r = btn.getBoundingClientRect();
  var dx = e.clientX - (r.left + r.width / 2);
  var dy = e.clientY - (r.top + r.height / 2);
  var dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < 160) {
    mag.active = true;
    // 目标位移：朝鼠标拉，最多 30px
    var s = Math.min(30 / (dist || 1), 0.38);
    mag.tx = dx * s; mag.ty = dy * s;
  } else {
    mag.active = false;
  }
});
zone.addEventListener("mouseleave", function () { mag.active = false; });

function stepMagnet() {
  if (!MAGNETIC) return;
  if (mag.active) {
    // 跟随：lerp，带一点粘滞感
    mag.x += ((mag.tx || 0) - mag.x) * 0.22;
    mag.y += ((mag.ty || 0) - mag.y) * 0.22;
    mag.vx = 0; mag.vy = 0;
  } else if (Math.abs(mag.x) > 0.05 || Math.abs(mag.y) > 0.05 ||
             Math.abs(mag.vx) > 0.05 || Math.abs(mag.vy) > 0.05) {
    // 松开：弹簧回弹（欠阻尼，有物理感）
    mag.vx = (mag.vx - mag.x * 0.16) * 0.68;
    mag.vy = (mag.vy - mag.y * 0.16) * 0.68;
    mag.x += mag.vx; mag.y += mag.vy;
  } else {
    if (mag.x !== 0 || mag.y !== 0) {
      mag.x = 0; mag.y = 0;
      btn.style.transform = ""; label.style.transform = "";
    }
    return;
  }
  btn.style.transform = "translate(" + mag.x.toFixed(2) + "px," + mag.y.toFixed(2) + "px)";
  // 内层文案多动 35%，制造纵深
  label.style.transform = "translate(" + (mag.x * 0.35).toFixed(2) + "px," + (mag.y * 0.35).toFixed(2) + "px)";
}

/* ---------- 点击：爆发 + 成功态 ---------- */
btn.addEventListener("click", function (e) {
  if (btn.classList.contains("done")) return;
  e.preventDefault();
  var r = btn.getBoundingClientRect();
  spawnBurst(r.left + r.width / 2, r.top + r.height / 2);
  // 冲击波圆心记在按钮中心
  if (rings.length) { rings[rings.length - 1].x0 = r.left + r.width / 2; rings[rings.length - 1].y0 = r.top + r.height / 2; }
  btn.classList.add("done");
  btn.setAttribute("aria-live", "polite");
  document.querySelector(".btn-caption").textContent = CONFIG.successLabel;
  setTimeout(function () {
    if (/^https?:\/\//.test(CONFIG.ctaHref)) window.location.href = CONFIG.ctaHref;
  }, 2400);
});

/* ---------- 页脚 ---------- */
document.getElementById("year").textContent = new Date().getFullYear();
document.getElementById("brand").textContent = CONFIG.brand;
var fl = document.getElementById("flinks");
CONFIG.links.forEach(function (l) {
  var a = document.createElement("a");
  a.href = l.href; a.textContent = l.label;
  fl.appendChild(a);
});
document.getElementById("kicker").textContent = CONFIG.kicker;
document.getElementById("sub").textContent = CONFIG.sub;
label.textContent = CONFIG.ctaLabel;
btn.setAttribute("href", CONFIG.ctaHref);
document.title = CONFIG.brand + " — " + CONFIG.ctaLabel;

/* ---------- 文案注入要在 reveal 之前完成：顺序已保证 ---------- */

if (!document.hidden) requestAnimationFrame(frame);
document.addEventListener("visibilitychange", function () {
  if (!document.hidden) requestAnimationFrame(frame);
});

})();

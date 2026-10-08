/* huafire3d fx-lab — original implementation */
/* launch-countdown-3d 主入口：加载 -> 倒计时 -> 揭幕。 */

import { CONFIG } from "./config.js";
import { buildClock, renderCountdown } from "./countdown.js";
import { createScene } from "./scene.js";

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = (s) => document.querySelector(s);

/* ---------- 目标时间：?demo=秒 方便预览揭幕 ---------- */
function resolveTarget() {
  const q = new URLSearchParams(location.search);
  const demo = parseFloat(q.get("demo"));
  if (Number.isFinite(demo) && demo >= 0) return Date.now() + demo * 1000;
  return new Date(CONFIG.launchAt).getTime();
}
const target = resolveTarget();

/* ---------- 文案注入 ---------- */
document.title = `${CONFIG.productFull} — Global Launch`;
$("#brandName").innerHTML = CONFIG.brand + "<sup>®</sup>";
$("#topRight").textContent = `${CONFIG.product} FLAGSHIP · GLOBAL LAUNCH`;
$("#eyebrow").textContent = CONFIG.copy.eyebrow;
$("#productName").innerHTML =
  `${CONFIG.productFull} <span>${CONFIG.tagline}</span>`;
$("#notifyInput").placeholder = CONFIG.copy.notifyPlaceholder;
$("#finePrint").textContent = CONFIG.copy.fine;
$("#revealEyebrow").textContent = CONFIG.copy.revealEyebrow;
$("#revealTitle").textContent = CONFIG.copy.revealTitle;
$("#revealPrice").textContent = `${CONFIG.productFull} — ${CONFIG.price}`;
$("#ctaBtn").textContent = CONFIG.copy.cta;

/* ---------- 胶片颗粒（运行时生成，无外部资源） ---------- */
(function grain() {
  const c = document.createElement("canvas");
  c.width = c.height = 140;
  const g = c.getContext("2d");
  const img = g.createImageData(140, 140);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = (Math.random() * 255) | 0;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  document.querySelector(".grain").style.backgroundImage =
    `url(${c.toDataURL()})`;
})();

/* ---------- 翻牌时钟 ---------- */
const cards = buildClock($("#clock"), [
  { key: "d", label: "DAYS" },
  { key: "h", label: "HOURS" },
  { key: "m", label: "MIN" },
  { key: "s", label: "SEC" },
]);

/* ---------- 3D 舞台 ---------- */
const canvas = $("#gl");
let stage;
try {
  stage = createScene(canvas, CONFIG, reduceMotion);
} catch (e) {
  showModelError();
}

let revealed = false;
function doReveal() {
  if (revealed) return;
  revealed = true;
  clearInterval(timer);
  /* 闪光 */
  const flash = $("#flash");
  flash.style.transition = "none";
  flash.style.opacity = "0.85";
  void flash.offsetWidth;
  flash.style.transition = "opacity .7s ease-out";
  flash.style.opacity = "0";
  /* 3D 揭幕 */
  if (stage) stage.reveal();
  /* 前景切换：倒计时淡出，揭幕文案升起 */
  setTimeout(() => {
    $("#countdownWrap").classList.add("gone");
    $("#notifyWrap").classList.add("gone");
    const r = $("#reveal");
    r.hidden = false;
    void r.offsetWidth;
    r.classList.add("show");
  }, reduceMotion ? 60 : 850);
}

/* ---------- 倒计时循环 ---------- */
renderCountdown(cards, target - Date.now(), true); /* 首帧直接落值 */
const timer = setInterval(() => {
  const left = target - Date.now();
  const hasMore = renderCountdown(cards, left, reduceMotion);
  if (!hasMore) doReveal();
}, 250);

/* ---------- 模型加载 ---------- */
const loaderEl = $("#loader");
const loadBar = $("#loadBar");
const loadPct = $("#loadPct");
function setProgress(p) {
  const v = Math.round(p * 100);
  loadBar.style.transform = `scaleX(${p})`;
  loadPct.textContent = (v < 10 ? "0" : "") + v;
}

if (stage) {
  stage
    .loadModel(CONFIG.model.url, setProgress)
    .then(() => {
      loaderEl.classList.add("done");
      setTimeout(() => loaderEl.remove(), 900);
      startLoop();
    })
    .catch((e) => {
      console.error("MODEL-LOAD-FAIL", String((e && e.message) || e).slice(0, 220));
      loaderEl.remove();
      showModelError();
      startLoop(); /* 没模型也继续倒计时 */
    });
} else {
  loaderEl.remove();
}

let raf = 0;
let last = performance.now();
function startLoop() {
  /* 若目标已过，直接揭幕 */
  if (target - Date.now() <= 0) {
    renderCountdown(cards, 0, true);
    doReveal();
    return;
  }
  last = performance.now();
  const loop = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    stage.tick(dt);
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
}

window.addEventListener("resize", () => stage && stage.frameCamera());

/* ---------- 模型失败占位 ---------- */
function showModelError() {
  const el = $("#modelError");
  el.hidden = false;
}

/* ---------- 订阅表单（前端演示态） ---------- */
$("#notifyForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const input = $("#notifyInput");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(input.value.trim())) {
    input.classList.add("shake");
    setTimeout(() => input.classList.remove("shake"), 500);
    input.focus();
    return;
  }
  const wrap = $("#notifyWrap");
  wrap.innerHTML = `<p class="notify-ok">${CONFIG.copy.notifyOk}</p>`;
});

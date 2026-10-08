/* huafire3d fx-lab — original implementation */
import * as THREE from "three";
import { CONFIG } from "./config.js";
import { createWidget } from "./widgets.js";

const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const grid = document.getElementById("grid");
const widgets = []; // {widget, active, wrap, card}

/* ---------- build cards from CONFIG ---------- */
CONFIG.features.forEach((f, idx) => {
  const card = document.createElement("article");
  card.className = `card span-${f.span}${f.wide ? " wide" : ""}`;
  card.tabIndex = 0;

  const inner = document.createElement("div");
  if (f.wide) inner.className = "card-inner";

  const wrap = document.createElement("div");
  wrap.className = "canvas-wrap";
  const canvas = document.createElement("canvas");
  const tag = document.createElement("div");
  tag.className = "card-tag";
  tag.innerHTML = `<i>◆</i>${f.tag}`;
  const fallback = document.createElement("div");
  fallback.className = "canvas-fallback";
  fallback.textContent = "3D UNAVAILABLE — STATIC PREVIEW";
  fallback.hidden = true;
  wrap.append(canvas, tag, fallback);

  const body = document.createElement("div");
  body.className = "card-body";
  const h3 = document.createElement("h3");
  h3.textContent = f.title;
  const p = document.createElement("p");
  p.innerHTML = f.desc; // CONFIG is ours; HTML here is intentional
  body.append(h3, p);
  if (f.checks) {
    const ul = document.createElement("ul");
    ul.className = "checks";
    f.checks.forEach((c) => {
      const li = document.createElement("li");
      li.textContent = c;
      ul.appendChild(li);
    });
    body.append(ul);
  }

  if (f.wide) {
    inner.append(wrap, body);
    card.append(inner);
  } else {
    card.append(wrap, body);
  }
  grid.append(card);

  const entry = { widget: null, active: false, wrap, card, type: f.widget, order: idx };
  widgets.push(entry);

  card.addEventListener("mouseenter", () => entry.widget && entry.widget.setBoost(1.7));
  card.addEventListener("mouseleave", () => entry.widget && entry.widget.setBoost(1));
  card.addEventListener("focus", () => entry.widget && entry.widget.setBoost(1.7));
  card.addEventListener("blur", () => entry.widget && entry.widget.setBoost(1));
});

/* ---------- sizing ---------- */
const ro = new ResizeObserver((es) => {
  for (const e of es) {
    const entry = widgets.find((w) => w.wrap === e.target);
    if (entry && entry.widget) {
      const r = e.contentRect;
      entry.widget.resize(Math.max(1, r.width), Math.max(1, r.height));
    }
  }
});

/* ---------- lazy init + entrance + visibility ---------- */
function initWidget(entry) {
  const canvas = entry.wrap.querySelector("canvas");
  const r = entry.wrap.getBoundingClientRect();
  try {
    const w = createWidget(entry.type, canvas, THREE);
    w.resize(Math.max(1, r.width), Math.max(1, r.height));
    entry.widget = w;
    if (REDUCED) {
      w.update(0.7, 0); // one composed static frame
      w.setBoost(0);
    }
  } catch (err) {
    entry.wrap.querySelector(".canvas-fallback").hidden = false;
    canvas.remove();
  }
  ro.observe(entry.wrap);
}

const io = new IntersectionObserver((es) => {
  for (const e of es) {
    const entry = widgets.find((w) => w.card === e.target);
    if (!entry) continue;
    if (e.isIntersecting) {
      if (!entry.widget && !entry.failed) {
        entry.card.style.setProperty("--d", `${Math.min(entry.order, 5) * 85}ms`);
        entry.card.classList.add("in");
        initWidget(entry);
      }
      entry.active = !!entry.widget && !REDUCED;
    } else {
      entry.active = false;
    }
  }
}, { threshold: 0.08, rootMargin: "80px" });

widgets.forEach((w) => io.observe(w.card));

/* ---------- single rAF loop for all visible widgets ---------- */
let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  const t = now / 1000;
  let any = false;
  for (const w of widgets) {
    if (w.active && w.widget) {
      w.widget.update(t, dt);
      any = true;
    }
  }
  requestAnimationFrame(loop);
}
if (!REDUCED) requestAnimationFrame(loop);

// ops-monitor-3d · src/main.js — 3D 拓扑监控（程序化球体+连线，零外部模型）
import * as THREE from "three";
import { CONFIG } from "./config.js";

const $ = (s) => document.querySelector(s);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- 程序化纹理 ---------- */
function radialTex(inner, outer) {
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, inner); grad.addColorStop(1, outer);
  g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.needsUpdate = true; return t;
}
function ringTex() {
  const c = document.createElement("canvas"); c.width = c.height = 256;
  const g = c.getContext("2d");
  g.strokeStyle = "rgba(255,255,255,.95)"; g.lineWidth = 9;
  g.beginPath(); g.arc(128, 128, 108, 0, Math.PI * 2); g.stroke();
  g.strokeStyle = "rgba(255,255,255,.28)"; g.lineWidth = 26;
  g.beginPath(); g.arc(128, 128, 96, 0, Math.PI * 2); g.stroke();
  const t = new THREE.CanvasTexture(c); t.needsUpdate = true; return t;
}
function labelTex(text, color) {
  const c = document.createElement("canvas"); c.width = 384; c.height = 96;
  const g = c.getContext("2d");
  g.font = "600 34px -apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif";
  g.textAlign = "center"; g.textBaseline = "middle";
  g.shadowColor = "rgba(0,0,0,.85)"; g.shadowBlur = 10;
  g.fillStyle = color; g.fillText(text, 192, 50);
  const t = new THREE.CanvasTexture(c); t.needsUpdate = true; return t;
}
const glowTex = radialTex("rgba(255,255,255,1)", "rgba(255,255,255,0)");
const ringTexture = ringTex();

/* ---------- 场景 ---------- */
const GREEN = new THREE.Color(CONFIG.theme.green);
const AMBER = new THREE.Color(CONFIG.theme.amber);

const container = $("#gl");
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
camera.position.set(0, 0.6, 9.2);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setClearColor(0x000000, 0);
container.appendChild(renderer.domElement);

const world = new THREE.Group();
scene.add(world);

// 星尘背景
{
  const n = 420, pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const r = 14 + Math.random() * 22, th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
    pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
    pos[i * 3 + 1] = r * Math.cos(ph) * 0.6;
    pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const dust = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0x3dffa0, size: 0.035, transparent: true, opacity: 0.35 }));
  dust.name = "dust"; world.add(dust);
}

/* ---------- 节点 ---------- */
const R = 3.1;
const nodes = CONFIG.nodes.map((cfg, i) => {
  const n = CONFIG.nodes.length;
  const y = 1 - (i / (n - 1)) * 2;
  const rad = Math.sqrt(Math.max(0, 1 - y * y));
  const th = i * 2.399963; // 黄金角
  const rr = R * (0.9 + Math.random() * 0.2);
  const pos = new THREE.Vector3(rr * rad * Math.cos(th), rr * y * 0.92, rr * rad * Math.sin(th));

  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.085, 20, 20),
    new THREE.MeshBasicMaterial({ color: GREEN.clone() })
  );
  core.position.copy(pos); core.userData.nodeId = cfg.id;

  const glow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTex, color: GREEN.clone(), transparent: true, opacity: 0.8,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  glow.position.copy(pos); glow.scale.setScalar(0.62);

  const label = new THREE.Sprite(new THREE.SpriteMaterial({
    map: labelTex(cfg.name, "rgba(233,242,236,.92)"), transparent: true,
    depthTest: false, depthWrite: false, opacity: 0.92,
  }));
  label.position.copy(pos).add(new THREE.Vector3(0, 0.34, 0));
  label.scale.set(1.7, 0.425, 1); label.renderOrder = 5;

  world.add(core, glow, label);

  const latency = cfg.baseLatency;
  return {
    cfg, pos, core, glow, label,
    status: "ok",
    phase: Math.random() * Math.PI * 2,
    speed: 1.3 + Math.random() * 0.9,
    latency,
    history: Array.from({ length: 24 }, () => latency + (Math.random() - 0.5) * latency * 0.25),
    events: [],
  };
});

// 连线：每节点连 2 个最近邻（去重）
{
  const pairs = new Set(), verts = [];
  nodes.forEach((a, i) => {
    const dists = nodes.map((b, j) => ({ j, d: j === i ? Infinity : a.pos.distanceTo(b.pos) }))
      .sort((p, q) => p.d - q.d).slice(0, 2);
    dists.forEach(({ j }) => {
      const key = i < j ? i + "-" + j : j + "-" + i;
      if (!pairs.has(key)) {
        pairs.add(key);
        verts.push(a.pos.x, a.pos.y, a.pos.z, nodes[j].pos.x, nodes[j].pos.y, nodes[j].pos.z);
      }
    });
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(verts), 3));
  world.add(new THREE.LineSegments(geo, new THREE.LineBasicMaterial({
    color: 0x3dffa0, transparent: true, opacity: 0.14,
  })));
}

/* ---------- 告警涟漪 ---------- */
const ripples = [];
function spawnRipple(node, colorHex) {
  if (REDUCED) return;
  for (let k = 0; k < 2; k++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({
      map: ringTexture, color: colorHex, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false,
    }));
    s.position.copy(node.pos); s.renderOrder = 4; s.userData.delay = k * 260;
    world.add(s);
    ripples.push({ s, t0: performance.now() + k * 260 });
  }
}

/* ---------- UI：左侧列表 / 事件流 ---------- */
const listEl = $("#nodeList"), feedEl = $("#feed");
const rowById = {};
function fmtTime(d = new Date()) { return d.toTimeString().slice(0, 8); }

nodes.forEach((node) => {
  const row = document.createElement("button");
  row.className = "node-row"; row.type = "button";
  row.innerHTML =
    '<span class="dot"></span>' +
    '<span class="n-name">' + node.cfg.name + '</span>' +
    '<span class="n-tier">' + node.cfg.tier + "</span>" +
    '<span class="n-lat"><b>' + Math.round(node.latency) + '</b><i>ms</i></span>';
  row.addEventListener("click", () => selectNode(node.cfg.id, true));
  row.addEventListener("mouseenter", () => { hoverId = node.cfg.id; });
  row.addEventListener("mouseleave", () => { hoverId = null; });
  listEl.appendChild(row);
  rowById[node.cfg.id] = row;
});

function feed(text, kind) {
  const item = document.createElement("div");
  item.className = "feed-item " + (kind || "ok");
  item.innerHTML = '<span class="f-time">' + fmtTime() + '</span><span class="f-text">' + text + "</span>";
  feedEl.prepend(item);
  while (feedEl.children.length > 6) feedEl.lastChild.remove();
  item.classList.add("in");
}

/* ---------- 右侧详情 ---------- */
const detailEl = $("#detail");
let selectedId = null, hoverId = null;

function sparkDraw(node) {
  const spark = document.getElementById("spark");
  if (!spark) return;
  const g = spark.getContext("2d"), W = spark.width, H = spark.height;
  g.clearRect(0, 0, W, H);
  const h = node.history, min = Math.min(...h) * 0.9, max = Math.max(...h) * 1.1;
  const X = (i) => (i / (h.length - 1)) * W;
  const Y = (v) => H - 6 - ((v - min) / Math.max(1e-6, max - min)) * (H - 14);
  const col = node.status === "alert" ? CONFIG.theme.amber : CONFIG.theme.green;
  g.beginPath();
  h.forEach((v, i) => (i ? g.lineTo(X(i), Y(v)) : g.moveTo(X(i), Y(v))));
  g.strokeStyle = col; g.lineWidth = 2; g.lineJoin = "round"; g.stroke();
  g.lineTo(W, H); g.lineTo(0, H); g.closePath();
  const grad = g.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, col + "55"); grad.addColorStop(1, col + "00");
  g.fillStyle = grad; g.fill();
}

const CLOSE_BTN = '<button id="detailClose" type="button" aria-label="关闭">✕</button>';
function renderDetail() {
  const node = nodes.find((n) => n.cfg.id === selectedId);
  if (!node) {
    const ok = nodes.filter((n) => n.status === "ok").length;
    detailEl.innerHTML = CLOSE_BTN +
      '<div class="d-head"><h2>全网总览</h2><span class="pill ok">运行正常</span></div>' +
      '<div class="d-grid">' +
      '<div class="d-stat"><i>在线节点</i><b>' + ok + " / " + nodes.length + "</b></div>" +
      '<div class="d-stat"><i>核心节点</i><b>' + nodes.filter((n) => n.cfg.tier === "核心").length + "</b></div>" +
      '<div class="d-stat"><i>边缘节点</i><b>' + nodes.filter((n) => n.cfg.tier === "边缘").length + "</b></div>" +
      '<div class="d-stat"><i>备用节点</i><b>' + nodes.filter((n) => n.cfg.tier === "备用").length + "</b></div>" +
      "</div>" +
      '<p class="d-tip">点击中央拓扑中的任意节点，或左侧列表，查看该节点实时详情。</p>';
    return;
  }
  const st = node.status === "alert" ? '<span class="pill warn">告警中</span>' : '<span class="pill ok">正常</span>';
  const loss = node.status === "alert" ? (Math.random() * 2 + 0.4).toFixed(1) : "0.0";
  detailEl.innerHTML = CLOSE_BTN +
    '<div class="d-head"><h2>' + node.cfg.name + "</h2>" + st + "</div>" +
    '<div class="d-grid">' +
    '<div class="d-stat"><i>实时延迟</i><b>' + Math.round(node.latency) + '<small>ms</small></b></div>' +
    '<div class="d-stat"><i>在线率</i><b>' + node.cfg.uptime.toFixed(2) + '<small>%</small></b></div>' +
    '<div class="d-stat"><i>负载</i><b>' + Math.round(node.cfg.load + (node.status === "alert" ? 28 : 0)) + '<small>%</small></b></div>' +
    '<div class="d-stat"><i>丢包</i><b>' + loss + '<small>%</small></b></div>' +
    "</div>" +
    '<div class="d-sec">延迟走势（近 1 小时）</div><canvas id="spark" width="520" height="112"></canvas>' +
    '<div class="d-sec">节点事件</div><div class="d-events">' +
    (node.events.length ? node.events.slice(0, 4).map((e) =>
      '<div class="d-ev"><span>' + e.t + "</span>" + e.text + "</div>").join("")
      : '<div class="d-ev empty">暂无异常事件</div>') +
    "</div>" +
    '<button class="d-back" id="backBtn" type="button">← 返回全网总览</button>';
  sparkDraw(node);
}

// 事件委托：renderDetail() 会重写 innerHTML，直接绑定的监听会被销毁
detailEl.addEventListener("click", (e) => {
  if (e.target.closest("#detailClose")) { selectNode(null); detailEl.classList.remove("show"); return; }
  if (e.target.closest("#backBtn")) selectNode(null);
});

function selectNode(id, fromList) {
  selectedId = id;
  Object.entries(rowById).forEach(([k, row]) => row.classList.toggle("sel", k === id));
  renderDetail();
  detailEl.classList.add("show");
  if (id && !fromList) {
    const row = rowById[id];
    if (row) row.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
}

/* ---------- KPI ---------- */
const kpiEls = {};
Object.keys(CONFIG.kpis).forEach((k) => { kpiEls[k] = $("#kpi-" + k); });
function fmtKpi(k, v) {
  const c = CONFIG.kpis[k];
  let s = v.toFixed(c.decimals);
  if (c.comma) s = Math.round(v).toLocaleString("en-US");
  return s;
}
function tickKpi(alertBoost) {
  Object.entries(CONFIG.kpis).forEach(([k, c]) => {
    let v = c.base + (Math.random() - 0.5) * 2 * c.jitter;
    if (k === "latency" && alertBoost) v += 160 + Math.random() * 120;
    if (k === "uptime") v = clamp(v, 99.9, 100);
    const el = kpiEls[k];
    el.querySelector("b").textContent = fmtKpi(k, v);
    el.classList.remove("tick"); void el.offsetWidth; el.classList.add("tick");
  });
}

/* ---------- 告警调度 ---------- */
const pill = $("#netPill");
let alertCount = 0;
function setPill() {
  if (alertCount > 0) {
    pill.className = "net-pill warn";
    pill.innerHTML = '<span class="p-dot"></span>告警 ' + alertCount + " 起";
  } else {
    pill.className = "net-pill ok";
    pill.innerHTML = '<span class="p-dot"></span>全网正常';
  }
}
function fireAlert() {
  const healthy = nodes.filter((n) => n.status === "ok");
  if (!healthy.length) return scheduleAlert();
  const node = healthy[Math.floor(Math.random() * healthy.length)];
  const kind = CONFIG.alertKinds[Math.floor(Math.random() * CONFIG.alertKinds.length)];
  const v = Math.round(120 + Math.random() * 480);
  const text = node.cfg.name + " · " + kind.label + " — " + kind.detail.replace("{v}", v);

  node.status = "alert";
  node.core.material.color.copy(AMBER);
  node.glow.material.color.copy(AMBER);
  node.label.material.map = labelTex(node.cfg.name, "rgba(255,176,32,.95)");
  node.label.material.needsUpdate = true;
  spawnRipple(node, 0xffb020);
  rowById[node.cfg.id].classList.add("alert");

  const ev = { t: fmtTime(), text };
  node.events.unshift(ev);
  feed(text, "warn");
  alertCount++; setPill();
  tickKpi(true);
  if (selectedId === node.cfg.id) renderDetail();

  setTimeout(() => {
    node.status = "ok";
    node.core.material.color.copy(GREEN);
    node.glow.material.color.copy(GREEN);
    node.label.material.map = labelTex(node.cfg.name, "rgba(233,242,236,.92)");
    node.label.material.needsUpdate = true;
    rowById[node.cfg.id].classList.remove("alert");
    node.events.unshift({ t: fmtTime(), text: node.cfg.name + " · " + CONFIG.recoverNote });
    feed(node.cfg.name + " · " + CONFIG.recoverNote, "ok");
    alertCount = Math.max(0, alertCount - 1); setPill();
    if (selectedId === node.cfg.id) renderDetail();
  }, CONFIG.motion.alertHoldMs);

  scheduleAlert();
}
function scheduleAlert() {
  const { alertMinMs, alertMaxMs } = CONFIG.motion;
  setTimeout(fireAlert, alertMinMs + Math.random() * (alertMaxMs - alertMinMs));
}

/* ---------- 交互：拖拽旋转 / 点击 ---------- */
let tRotY = 0.5, tRotX = 0.12, dragging = false, px = 0, py = 0, downX = 0, downY = 0;
const dom = renderer.domElement;
dom.addEventListener("pointerdown", (e) => { dragging = true; px = downX = e.clientX; py = downY = e.clientY; });
window.addEventListener("pointermove", (e) => {
  if (!dragging) return;
  tRotY += (e.clientX - px) * 0.005;
  tRotX = clamp(tRotX + (e.clientY - py) * 0.003, -0.7, 0.7);
  px = e.clientX; py = e.clientY;
});
window.addEventListener("pointerup", (e) => {
  if (dragging && Math.hypot(e.clientX - downX, e.clientY - downY) < 6) pick(e);
  dragging = false;
});
dom.addEventListener("wheel", (e) => {
  e.preventDefault();
  camera.position.z = clamp(camera.position.z + e.deltaY * 0.004, 5.6, 13.5);
}, { passive: false });

const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
const cores = nodes.map((n) => n.core);
function pick(e) {
  const r = dom.getBoundingClientRect();
  ptr.x = ((e.clientX - r.left) / r.width) * 2 - 1;
  ptr.y = -((e.clientY - r.top) / r.height) * 2 + 1;
  ray.setFromCamera(ptr, camera);
  const hit = ray.intersectObjects(cores, false)[0];
  selectNode(hit ? hit.object.userData.nodeId : null);
}

/* ---------- 主循环 ---------- */
const clock = new THREE.Clock();
function resize() {
  const w = container.clientWidth || window.innerWidth, h = container.clientHeight || window.innerHeight;
  renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize); resize();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
  const now = performance.now();

  if (!REDUCED) world.rotation.y += CONFIG.motion.rotateSpeed * dt;
  world.rotation.y += (tRotY - world.rotation.y) * 0.08;
  world.rotation.x += (tRotX - world.rotation.x) * 0.08;

  nodes.forEach((node) => {
    const s = REDUCED ? 1 : 1 + CONFIG.motion.pulseAmp * 0.5 * Math.sin(t * node.speed + node.phase);
    node.core.scale.setScalar(s);
    const boost = hoverId === node.cfg.id ? 1.5 : 1;
    node.glow.scale.setScalar((0.62 + (REDUCED ? 0 : 0.1 * Math.sin(t * node.speed + node.phase))) * boost);
    node.glow.material.opacity = (node.status === "alert" || boost > 1) ? 0.95 : 0.7;
  });

  for (let i = ripples.length - 1; i >= 0; i--) {
    const r = ripples[i], el = now - r.t0;
    if (el < 0) continue;
    const p = el / CONFIG.motion.rippleMs;
    if (p >= 1) { world.remove(r.s); r.s.material.dispose(); ripples.splice(i, 1); continue; }
    const e = 1 - Math.pow(1 - p, 3); // easeOutCubic
    r.s.scale.setScalar(0.4 + e * 2.8);
    r.s.material.opacity = 0.9 * (1 - p);
  }

  renderer.render(scene, camera);
}

/* ---------- 时钟 / 数据节拍 ---------- */
setInterval(() => { $("#clock").textContent = fmtTime(); }, 1000);
$("#clock").textContent = fmtTime();

setInterval(() => {
  const anyAlert = nodes.some((n) => n.status === "alert");
  nodes.forEach((node) => {
    const target = node.cfg.baseLatency + (node.status === "alert" ? 220 + Math.random() * 160 : (Math.random() - 0.5) * node.cfg.baseLatency * 0.3);
    node.latency += (target - node.latency) * 0.35;
    node.history.push(node.latency); node.history.shift();
    const b = rowById[node.cfg.id].querySelector(".n-lat b");
    if (b) b.textContent = Math.round(node.latency);
  });
  tickKpi(anyAlert);
  if (selectedId) { const n = nodes.find((x) => x.cfg.id === selectedId); if (n) sparkDraw(n); }
}, CONFIG.motion.kpiTickMs);

/* ---------- 启动 ---------- */
$("#brandName").textContent = CONFIG.brand;
tickKpi(false);
renderDetail();
feed("监控网络已接入 · 14 个节点全部在线", "ok");
animate();
scheduleAlert();

// 加载态：首帧渲染后分阶段收尾，保证完成态可达
const loading = $("#loading"), bar = $("#loadBar"), pct = $("#loadPct");
let prog = 0;
const progTimer = setInterval(() => {
  prog = Math.min(100, prog + 18 + Math.random() * 22);
  bar.style.width = prog + "%"; pct.textContent = Math.round(prog) + "%";
  if (prog >= 100) {
    clearInterval(progTimer);
    setTimeout(() => {
      loading.classList.add("done");
      document.body.classList.add("ready");
      setTimeout(() => loading.remove(), 700);
    }, 250);
  }
}, 160);

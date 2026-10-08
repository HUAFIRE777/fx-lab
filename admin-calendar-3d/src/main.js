// admin-calendar-3d · src/main.js — 纯 CSS 3D 月历（翻转/浮起/日程抽屉），无第三方库
const $ = (s) => document.querySelector(s);
const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const WEEKS = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
const TYPE_LABEL = { meeting: "会议", personal: "个人", remind: "提醒" };

/* ---------- 日程数据（演示用：围绕今天生成，真实感中文短句） ---------- */
const POOL = [
  ["meeting", "晨间站会", "09:15"], ["meeting", "产品周例会", "10:00"],
  ["meeting", "需求评审", "13:30"], ["meeting", "和设计师对稿", "14:30"],
  ["meeting", "和后端联调", "15:00"], ["meeting", "用户访谈", "16:00"],
  ["meeting", "设计走查", "17:00"], ["meeting", "季度 OKR 对齐", "10:30"],
  ["meeting", "和投资人喝咖啡", "14:00"], ["meeting", "代码评审", "11:00"],
  ["personal", "牙医预约", "18:00"], ["personal", "团建烧烤", "18:30"],
  ["personal", "健身环打卡", "07:30"], ["personal", "读书会", "21:00"],
  ["personal", "给妈妈打电话", "20:30"],
  ["remind", "发布 v2.3 灰度", "20:00"], ["remind", "机票值机提醒", "08:00"],
];
function hashStr(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
const iso = (d) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const EVENTS = {};
function addEv(date, type, title, time) {
  const k = iso(date);
  (EVENTS[k] = EVENTS[k] || []).push({ type, title, time });
}
(function seed() {
  const now = new Date();
  const at = (off) => { const d = new Date(now); d.setDate(d.getDate() + off); return d; };
  // 固定锚点：保证今天/明天一定有内容
  addEv(at(0), "meeting", "产品周例会", "10:00");
  addEv(at(0), "meeting", "和设计师对稿", "14:30");
  addEv(at(0), "personal", "牙医预约", "18:00");
  addEv(at(1), "meeting", "Q4 评审会", "09:30");
  addEv(at(3), "remind", "发布 v2.3 灰度", "20:00");
  addEv(at(5), "personal", "团建烧烤", "18:30");
  const fixed = new Set([0, 1, 3, 5]);
  for (let off = -8; off <= 55; off++) {
    if (fixed.has(off)) continue;
    const d = at(off), h = hashStr(iso(d));
    const n = h % 10 < 3 ? 2 : h % 10 < 6 ? 1 : 0;
    const used = new Set();
    for (let i = 0; i < n; i++) {
      let idx = (h >> (i * 5)) % POOL.length;
      if (used.has(idx)) idx = (idx + 7) % POOL.length;
      used.add(idx);
      const [type, title, time] = POOL[idx];
      addEv(d, type, title, time);
    }
  }
  Object.values(EVENTS).forEach((list) => list.sort((a, b) => a.time.localeCompare(b.time)));
})();
const evOf = (key) => EVENTS[key] || [];

/* ---------- 月历渲染 ---------- */
const flipCard = $("#flipCard"), faceFront = $("#faceFront"), faceBack = $("#faceBack");
const today = new Date();
let viewY = today.getFullYear(), viewM = today.getMonth();
let selectedKey = iso(today);
let flipping = false;

function monthStats(y, m) {
  let count = 0, hours = 0;
  Object.entries(EVENTS).forEach(([k, list]) => {
    const [ky, km] = k.split("-").map(Number);
    if (ky === y && km === m + 1) {
      count += list.length;
      hours += list.filter((e) => e.type === "meeting").length;
    }
  });
  return { count, hours };
}

function renderFace(el, y, m) {
  const st = monthStats(y, m);
  const first = new Date(y, m, 1);
  const lead = (first.getDay() + 6) % 7; // 周一起始
  const days = new Date(y, m + 1, 0).getDate();
  let html = '<div class="cal-head">' +
    '<h1>' + (m + 1) + ' <small>月</small></h1>' +
    '<div class="cal-nav">' +
    '<button class="nav-btn" type="button" data-nav="prev" aria-label="上个月">‹</button>' +
    '<button class="nav-btn" type="button" data-nav="today">今天</button>' +
    '<button class="nav-btn" type="button" data-nav="next" aria-label="下个月">›</button>' +
    '</div>' +
    '<span class="sub">' + y + ' 年 · 本月 ' + st.count + ' 场日程</span></div>' +
    '<div class="week-row">' + ["一", "二", "三", "四", "五", "六", "日"].map((w) => "<span>" + w + "</span>").join("") + '</div>' +
    '<div class="grid">';
  const total = 42;
  for (let i = 0; i < total; i++) {
    const d = new Date(y, m, 1 - lead + i);
    const key = iso(d);
    const inMonth = d.getMonth() === m;
    const evs = evOf(key).slice(0, 3);
    const dots = evs.map((e) => '<i class="t-' + e.type + '"></i>').join("");
    const cls = ["cell"];
    if (!inMonth) cls.push("other");
    if (key === iso(today)) cls.push("today");
    if (key === selectedKey) cls.push("sel");
    html += '<button type="button" class="' + cls.join(" ") + '" style="--i:' + i + '" ' +
      'data-key="' + key + '" data-y="' + d.getFullYear() + '" data-m="' + d.getMonth() + '">' +
      '<span class="d-num">' + d.getDate() + '</span>' +
      '<span class="dots">' + dots + '</span></button>';
  }
  el.innerHTML = html + "</div>";
}

function syncSel() {
  document.querySelectorAll(".cell").forEach((c) =>
    c.classList.toggle("sel", c.dataset.key === selectedKey));
}

/* ---------- 3D 翻页 ---------- */
function flipTo(y, m, dir) {
  if (flipping || (y === viewY && m === viewM)) return;
  if (REDUCED) { viewY = y; viewM = m; renderFace(faceFront, y, m); return; }
  flipping = true;
  flipCard.querySelectorAll(".nav-btn").forEach((b) => (b.disabled = true));
  renderFace(faceBack, y, m);
  const target = "rotateY(" + dir * 180 + "deg)";
  flipCard.style.transition = "transform .72s cubic-bezier(.16,1,.3,1)";
  requestAnimationFrame(() => { flipCard.style.transform = target; });
  const done = () => {
    flipCard.removeEventListener("transitionend", done);
    faceFront.innerHTML = faceBack.innerHTML;
    flipCard.style.transition = "none";
    flipCard.style.transform = "rotateY(0deg)";
    void flipCard.offsetWidth;
    flipCard.style.transition = "";
    viewY = y; viewM = m; flipping = false;
    syncSel();
  };
  flipCard.addEventListener("transitionend", done);
  setTimeout(() => { if (flipping) done(); }, 900); // 兜底：transitionend 丢了也能收尾
}
const shiftMonth = (dy, dm, dir) => {
  const d = new Date(viewY, viewM + dm + dy * 12, 1);
  flipTo(d.getFullYear(), d.getMonth(), dir);
};

/* ---------- 日程抽屉 ---------- */
const drawer = $("#drawer");
function openDrawer(key) {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  $("#drawerDate").textContent = m + "月" + d + "日";
  $("#drawerWeek").textContent = WEEKS[dt.getDay()] + (key === iso(today) ? " · 今天" : "");
  const list = evOf(key);
  $("#drawerList").innerHTML = list.length
    ? list.map((e, i) =>
        '<div class="ev" style="--i:' + i + '">' +
        '<span class="e-time">' + e.time + '</span>' +
        '<div class="e-main"><div class="e-title">' + e.title + '</div>' +
        '<span class="e-tag">' + TYPE_LABEL[e.type] + '</span></div></div>').join("")
    : '<div class="ev-empty">这一天还没有安排，<br>享受难得的空闲吧。</div>';
  drawer.classList.add("show");
}
function closeDrawer() { drawer.classList.remove("show"); }

function selectDate(key, y, m) {
  selectedKey = key;
  const vy = Number(y), vm = Number(m);
  if (vy !== viewY || vm !== viewM) {
    openDrawer(key);
    flipTo(vy, vm, vm > viewM || vy > viewY ? 1 : -1);
    return;
  }
  syncSel();
  openDrawer(key);
}

/* ---------- 左侧：即将到来 + 统计 ---------- */
function renderSide() {
  const now = iso(today);
  const items = [];
  Object.entries(EVENTS).forEach(([k, list]) => {
    if (k < now) return;
    list.forEach((e) => items.push({ k, ...e }));
  });
  items.sort((a, b) => (a.k + a.time).localeCompare(b.k + b.time));
  const fmtD = (k) => { const [, m, d] = k.split("-").map(Number); return m + "月" + d + "日"; };
  $("#upcoming").innerHTML = items.slice(0, 6).map((it) =>
    '<button type="button" class="up-item" data-key="' + it.k + '">' +
    '<span class="dot t-' + it.type + '"></span>' +
    '<span class="u-main"><span class="u-date">' + fmtD(it.k) + ' · ' + it.time + '</span>' +
    '<span class="u-title">' + it.title + '</span></span></button>').join("");
  const st = monthStats(viewY, viewM);
  $("#monthStats").innerHTML = "本月 <b>" + st.count + "</b> 场日程 · 会议 <b>" + st.hours + "</b> 小时";
}

/* ---------- 事件 ---------- */
document.addEventListener("click", (e) => {
  const nav = e.target.closest("[data-nav]");
  if (nav && !nav.disabled) {
    const n = nav.dataset.nav;
    if (n === "prev") shiftMonth(0, -1, -1);
    else if (n === "next") shiftMonth(0, 1, 1);
    else { const t = new Date(); flipTo(t.getFullYear(), t.getMonth(), 1); }
    return;
  }
  const cell = e.target.closest(".cell");
  if (cell) { selectDate(cell.dataset.key, cell.dataset.y, cell.dataset.m); return; }
  const up = e.target.closest(".up-item");
  if (up) {
    const [y, m] = up.dataset.key.split("-").map(Number);
    selectDate(up.dataset.key, y, m - 1);
    return;
  }
  if (e.target.closest("#drawerClose")) closeDrawer();
});
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeDrawer(); });

/* ---------- 顶栏日期 ---------- */
function tickClock() {
  const n = new Date();
  $("#todayLine").textContent = (n.getMonth() + 1) + "月" + n.getDate() + "日 " + WEEKS[n.getDay()] +
    " · " + String(n.getHours()).padStart(2, "0") + ":" + String(n.getMinutes()).padStart(2, "0");
}
tickClock(); setInterval(tickClock, 30000);

/* ---------- 启动 ---------- */
renderFace(faceFront, viewY, viewM);
syncSel();
renderSide();

let loaded = false;
function done() {
  if (loaded) return; loaded = true;
  $("#loading").classList.add("done");
  document.body.classList.add("ready");
  setTimeout(() => { const l = $("#loading"); if (l) l.remove(); }, 700);
}
requestAnimationFrame(() => requestAnimationFrame(done));
setTimeout(done, 2500); // 兜底：任何异常也不让加载态卡死

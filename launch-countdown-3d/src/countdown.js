/* huafire3d fx-lab — original implementation */
/* 翻牌时钟：CSS 3D 翻页 + JS 驱动时序。两段式翻页（上半页先落，下半页跟上）。 */

const FLIP_MS = 240;
const EASE_IN = "cubic-bezier(.55,.06,.68,.19)";
const EASE_OUT = "cubic-bezier(.22,1,.36,1)";

export function buildClock(root, units) {
  /* units: [{key:'d',label:'DAYS'},...] */
  const cards = {};
  for (const u of units) {
    const group = document.createElement("div");
    group.className = "unit";
    group.innerHTML =
      '<div class="pair">' +
      cardHTML() + cardHTML() +
      "</div>" +
      '<div class="ulabel">' + u.label + "</div>";
    root.appendChild(group);
    cards[u.key] = Array.from(group.querySelectorAll(".flip"));
  }
  return cards;
}

function cardHTML() {
  return (
    '<div class="flip" data-v="">' +
    '<div class="half top"><span>0</span></div>' +
    '<div class="half bottom"><span>0</span></div>' +
    '<div class="flap top"><span>0</span></div>' +
    '<div class="flap bottom"><span>0</span></div>' +
    "</div>"
  );
}

function setStatic(card, v) {
  card.querySelector(".half.top span").textContent = v;
  card.querySelector(".half.bottom span").textContent = v;
  card.dataset.v = v;
}

/* 把 card 翻到新值 v（单字符）。reduceMotion=true 时直接切换。 */
export function flipTo(card, v, reduceMotion) {
  const old = card.dataset.v;
  if (old === v) return;
  if (old === "" || reduceMotion) {
    setStatic(card, v);
    hideFlaps(card);
    return;
  }
  const topHalf = card.querySelector(".half.top span");
  const botHalf = card.querySelector(".half.bottom span");
  const flapTop = card.querySelector(".flap.top");
  const flapBot = card.querySelector(".flap.bottom");

  /* 上半静态直接显示新值（翻页落下后露出）；下半静态先保持旧值 */
  topHalf.textContent = v;
  botHalf.textContent = old;
  flapTop.querySelector("span").textContent = old;
  flapBot.querySelector("span").textContent = v;

  flapTop.style.transition = "none";
  flapBot.style.transition = "none";
  flapTop.style.transform = "rotateX(0deg)";
  flapBot.style.transform = "rotateX(90deg)";
  flapTop.style.visibility = "visible";
  flapBot.style.visibility = "visible";
  /* 强制回流，让 transition 生效 */
  void flapTop.offsetWidth;

  flapTop.style.transition = `transform ${FLIP_MS}ms ${EASE_IN}`;
  flapTop.style.transform = "rotateX(-90deg)";
  setTimeout(() => {
    flapTop.style.visibility = "hidden";
    flapBot.style.transition = `transform ${FLIP_MS}ms ${EASE_OUT}`;
    flapBot.style.transform = "rotateX(0deg)";
    setTimeout(() => {
      flapBot.style.visibility = "hidden";
      botHalf.textContent = v;
      card.dataset.v = v;
    }, FLIP_MS + 30);
  }, FLIP_MS + 20);
}

function hideFlaps(card) {
  card.querySelector(".flap.top").style.visibility = "hidden";
  card.querySelector(".flap.bottom").style.visibility = "hidden";
}

export function pad2(n) {
  return (n < 10 ? "0" : "") + n;
}

/* 把剩余毫秒拆成 {d,h,m,s} 并推到卡片上；返回是否还有剩余 */
export function renderCountdown(cards, ms, reduceMotion) {
  const total = Math.max(0, ms);
  const d = Math.floor(total / 864e5);
  const h = Math.floor(total / 36e5) % 24;
  const m = Math.floor(total / 6e4) % 60;
  const s = Math.floor(total / 1e3) % 60;
  const vals = { d: pad2(d), h: pad2(h), m: pad2(m), s: pad2(s) };
  for (const k of Object.keys(vals)) {
    const [c0, c1] = cards[k];
    flipTo(c0, vals[k][0], reduceMotion);
    flipTo(c1, vals[k][1], reduceMotion);
  }
  return total > 0;
}

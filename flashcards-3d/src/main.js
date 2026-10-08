// huafire3d fx-lab — original implementation · flashcards-3d
// 流程：点卡翻转 → 记得（飞入掌握堆）/ 忘记（抖动退回待复习堆）→ 刷完结算
import { CARDS, DONE_LINES } from './config.js';
import { initStacks, resetStacks, transferToMastered, receiveReview, stackTopScreen, setLabelTracker } from './stacks3d.js';

const $ = (id) => document.getElementById(id);
const gsap = window.gsap;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const RING_C = 2 * Math.PI * 26;

let deck, ptr, mastered, firstTry, flipped, busy, seen;
const cardWrap = $('cardWrap'), flipInner = $('flipInner'),
  forgetBtn = $('forgetBtn'), rememberBtn = $('rememberBtn'),
  ringFg = $('ringFg'), ringNum = $('ringNum');

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

function setRing() {
  const f = mastered / CARDS.length;
  ringFg.style.strokeDashoffset = String(RING_C * (1 - f));
  ringNum.textContent = `${mastered}/${CARDS.length}`;
  $('countReview').textContent = String(deck.length - ptr - mastered);
  $('countMastered').textContent = String(mastered);
}

function renderCard() {
  const c = CARDS[deck[ptr]];
  const tag = `${ptr + 1} / ${deck.length}`;
  flipped = false; busy = false;
  forgetBtn.disabled = true; rememberBtn.disabled = true;
  forgetBtn.classList.add('off'); rememberBtn.classList.add('off');
  flipInner.classList.remove('flipped');
  flipInner.innerHTML = `
    <div class="face front">
      <div class="card-top"><span>FLASHCARD · 单词</span><span>${tag}</span></div>
      <div class="word">${esc(c.word)}</div>
      <div class="phon">${esc(c.phon)} <em>${esc(c.pos)}</em></div>
      <div class="flip-hint">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 3v6h-6"/></svg>
        轻触翻转看释义
      </div>
    </div>
    <div class="face back">
      <div class="card-top"><span>释义 ANSWER</span><span>${tag}</span></div>
      <div class="meaning">${esc(c.meaning)}</div>
      <div class="eg">${esc(c.eg)}</div>
      <div class="eg-cn">${esc(c.egCn)}</div>
      <div class="grade-hint">记住了？点下方按钮打分</div>
    </div>`;
  $('remain').textContent = `还剩 ${deck.length - ptr} 张`;
  if (gsap && !reduced) {
    gsap.set(cardWrap, { clearProps: 'all' });
    gsap.fromTo(cardWrap, { y: 44, opacity: 0, rotation: -2 },
      { y: 0, opacity: 1, rotation: 0, duration: 0.55, ease: 'back.out(1.5)' });
  }
}

function flip() {
  if (flipped || busy) return;
  flipped = true;
  flipInner.classList.add('flipped');
  forgetBtn.disabled = false; rememberBtn.disabled = false;
  forgetBtn.classList.remove('off'); rememberBtn.classList.remove('off');
  if (gsap && !reduced) gsap.fromTo('.grade', { y: 10, opacity: 0.4 }, { y: 0, opacity: 1, duration: 0.3, stagger: 0.06, ease: 'power2.out', clearProps: 'transform' });
}

$('flipScene').addEventListener('click', flip);

function flyTo(which, scale, rot, dur) {
  return new Promise((resolve) => {
    const r = cardWrap.getBoundingClientRect();
    const t = stackTopScreen(which);
    const dx = t.x - (r.left + r.width / 2);
    const dy = t.y - (r.top + r.height / 2);
    if (gsap && !reduced) {
      gsap.to(cardWrap, { x: dx, y: dy, scale, rotation: rot, opacity: 0, duration: dur, ease: 'power2.in', onComplete: resolve });
    } else { resolve(); }
  });
}

async function remember() {
  if (!flipped || busy) return;
  busy = true;
  const id = deck[ptr];
  if (!seen.has(id)) firstTry++;
  await flyTo('mastered', 0.28, 14, 0.62);
  await transferToMastered();
  mastered++;
  setRing();
  next();
}

async function forget() {
  if (!flipped || busy) return;
  busy = true;
  seen.add(deck[ptr]);
  if (gsap && !reduced) {
    await new Promise((res) => {
      gsap.timeline({ onComplete: res })
        .to(cardWrap, { x: -14, duration: 0.07 })
        .to(cardWrap, { x: 12, duration: 0.07 })
        .to(cardWrap, { x: -8, duration: 0.07 })
        .to(cardWrap, { x: 5, duration: 0.07 })
        .to(cardWrap, { x: 0, duration: 0.06 });
    });
  }
  await flyTo('review', 0.4, -8, 0.5);
  await receiveReview();
  deck.push(deck[ptr]); // 退回待复习队列尾
  next();
}

rememberBtn.addEventListener('click', remember);
forgetBtn.addEventListener('click', forget);

function next() {
  ptr++;
  if (ptr >= deck.length) { showDone(); return; }
  renderCard();
}

function showDone() {
  $('stage').hidden = true;
  $('doneView').hidden = false;
  const line = DONE_LINES.find(l => firstTry >= l.min);
  $('doneTitle').textContent = line.title;
  $('doneSub').textContent = line.sub;
  $('doneChips').innerHTML =
    `<span class="chip">一遍记住 <b>${firstTry}</b> / ${CARDS.length}</span>` +
    `<span class="chip">多刷了 <b>${deck.length - CARDS.length}</b> 张次</span>`;
  const C = 2 * Math.PI * 64;
  const f = firstTry / CARDS.length;
  const ring = $('doneRing');
  ring.style.strokeDasharray = String(C);
  requestAnimationFrame(() => {
    ring.style.strokeDashoffset = String(C * (1 - f));
    const t0 = performance.now();
    (function count(now) {
      const k = Math.min((now - t0) / 900, 1);
      $('donePct').textContent = Math.round(f * 100 * (1 - Math.pow(1 - k, 3))) + '%';
      if (k < 1) requestAnimationFrame(count);
    })(t0);
  });
  if (gsap && !reduced) gsap.fromTo('#doneView', { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55, ease: 'back.out(1.4)' });
}

$('retryBtn').addEventListener('click', () => {
  deck = shuffle(CARDS.map((_, i) => i));
  ptr = 0; mastered = 0; firstTry = 0; seen = new Set();
  resetStacks(CARDS.length);
  setRing();
  $('doneView').hidden = true;
  $('stage').hidden = false;
  renderCard();
});

// ---------- 纸堆标签跟随 ----------
setLabelTracker((rp, mp) => {
  const lr = $('labelReview'), lm = $('labelMastered');
  lr.style.transform = `translate(${rp.x}px, ${rp.y}px) translate(-50%, -50%)`;
  lm.style.transform = `translate(${mp.x}px, ${mp.y}px) translate(-50%, -50%)`;
});

// ---------- 启动 ----------
deck = shuffle(CARDS.map((_, i) => i));
ptr = 0; mastered = 0; firstTry = 0; seen = new Set();
initStacks(CARDS.length);
renderCard();
setRing();
let loaderHidden = false;
function hideLoader() {
  if (loaderHidden) return;
  loaderHidden = true;
  // 加载态收尾：init 末尾无条件注册，完成态可达（rAF 主路径 + 定时兜底）
  $('loader').classList.add('hide');
}
requestAnimationFrame(() => requestAnimationFrame(hideLoader));
setTimeout(hideLoader, 1500);

// huafire3d fx-lab — original implementation · quiz-check-3d
// 流程：选题 → 锁定 → 3D 反馈（对勾爆发/错叉震动）→ 解析展开 → 继续 → 结算
import { QUESTIONS, SCORE_LINES } from './config.js';
import { playCorrect, playWrong, fxPointFromEl } from './fx3d.js';

const $ = (id) => document.getElementById(id);
const gsap = window.gsap;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

const LETTERS = ['A', 'B', 'C', 'D'];
const RING_C = 2 * Math.PI * 26;

let idx = 0;
let score = 0;
let answered = false;

const qcard = $('qcard'), optsEl = $('opts'), explain = $('explain'),
  exBody = $('exBody'), contBtn = $('contBtn'), ringFg = $('ringFg'),
  qNum = $('qNum'), quizView = $('quizView'), doneView = $('doneView'),
  doneRing = $('doneRing'), donePct = $('donePct'), doneTitle = $('doneTitle'),
  doneSub = $('doneSub'), doneStat = $('doneStat');

// ---------- 轻量音效（WebAudio 合成，无外部文件） ----------
let actx = null;
function beep(freqs, type = 'sine', dur = 0.12, vol = 0.16) {
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
    freqs.forEach((f, i) => {
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = type; o.frequency.value = f;
      const t0 = actx.currentTime + i * 0.11;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g); g.connect(actx.destination);
      o.start(t0); o.stop(t0 + dur + 0.05);
    });
  } catch (e) { /* 音频只是点缀，失败静默 */ }
}

// ---------- 渲染 ----------
function setRing(frac) {
  ringFg.style.strokeDashoffset = String(RING_C * (1 - frac));
}

function render() {
  const q = QUESTIONS[idx];
  answered = false;
  $('qtag').textContent = `第 ${idx + 1} 题 · ${q.tag}`;
  $('qtext').textContent = q.text;
  qNum.textContent = `${idx + 1} / ${QUESTIONS.length}`;
  setRing(idx / QUESTIONS.length);
  optsEl.innerHTML = '';
  q.options.forEach((t, i) => {
    const b = document.createElement('button');
    b.className = 'opt';
    b.innerHTML = `<span class="letter">${LETTERS[i]}</span><span class="txt">${t}</span>`;
    b.addEventListener('click', () => onPick(i, b));
    optsEl.appendChild(b);
  });
  explain.classList.remove('open');
  contBtn.textContent = idx === QUESTIONS.length - 1 ? '查看得分' : '继续';
  if (gsap && !reducedMotion) {
    gsap.fromTo(qcard, { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out', overwrite: true });
    gsap.fromTo('.opt', { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, stagger: 0.07, ease: 'power2.out', overwrite: true, clearProps: 'all' });
  }
}

// ---------- 答题 ----------
function onPick(i, btn) {
  if (answered) return;
  answered = true;
  const q = QUESTIONS[idx];
  const ok = i === q.answer;
  const btns = [...optsEl.children];
  btns.forEach(b => b.classList.add('locked'));

  const { nx, ny } = fxPointFromEl(qcard);
  if (ok) {
    score++;
    btn.classList.add('right');
    playCorrect(nx, ny);
    beep([660, 880]);
    setRing((idx + 1) / QUESTIONS.length);
    if (gsap && !reducedMotion) {
      gsap.fromTo(qcard, { scale: 1 }, { scale: 1.03, duration: 0.16, yoyo: true, repeat: 1, ease: 'power2.out' });
    }
  } else {
    btn.classList.add('wrong');
    btns[q.answer].classList.add('right', 'answer');
    playWrong(nx, ny);
    beep([200], 'sawtooth', 0.2, 0.1);
  }

  // 解析展开：对错两条路都会走到，完成态可达
  setTimeout(() => {
    exBody.textContent = q.explain;
    explain.classList.add('open');
    explain.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'nearest' });
  }, ok ? 500 : 900);
}

contBtn.addEventListener('click', () => {
  if (!answered) return;
  if (idx < QUESTIONS.length - 1) { idx++; render(); }
  else showDone();
});

// ---------- 结算 ----------
function showDone() {
  quizView.hidden = true;
  doneView.hidden = false;
  const line = SCORE_LINES.find(l => score >= l.min);
  doneTitle.textContent = line.title;
  doneSub.textContent = line.sub;
  doneStat.textContent = `答对 ${score} / ${QUESTIONS.length} 题`;
  const frac = score / QUESTIONS.length;
  const C = 2 * Math.PI * 64;
  doneRing.style.strokeDasharray = String(C);
  requestAnimationFrame(() => {
    doneRing.style.strokeDashoffset = String(C * (1 - frac));
    // 数字滚动
    const t0 = performance.now(), dur = 900;
    (function count(now) {
      const k = Math.min((now - t0) / dur, 1);
      donePct.textContent = Math.round(frac * 100 * (1 - Math.pow(1 - k, 3))) + '%';
      if (k < 1) requestAnimationFrame(count);
    })(t0);
  });
  if (gsap && !reducedMotion) {
    gsap.fromTo(doneView, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55, ease: 'back.out(1.4)' });
  }
  if (score === QUESTIONS.length) {
    const { nx, ny } = fxPointFromEl(doneView);
    setTimeout(() => playCorrect(nx, ny), 350);
    beep([523, 659, 784]);
  }
}

$('retryBtn').addEventListener('click', () => {
  idx = 0; score = 0;
  doneView.hidden = true;
  quizView.hidden = false;
  render();
});

// ---------- 启动 ----------
render();
let loaderHidden = false;
function hideLoader() {
  if (loaderHidden) return;
  loaderHidden = true;
  // 加载态收尾：init 末尾无条件注册，完成态可达（rAF 主路径 + 定时兜底）
  $('loader').classList.add('hide');
}
requestAnimationFrame(() => requestAnimationFrame(hideLoader));
setTimeout(hideLoader, 1500);

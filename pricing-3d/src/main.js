// huafire3d fx-lab — original implementation
// pricing-3d: config-driven 3D tilt pricing cards, billing toggle with odometer
// prices + particle burst, magnetic CTAs. Zero dependencies.

'use strict';

/* ---------------- CONFIG:换产品只改这里 ---------------- */
const CONFIG = {
  currency: '$',
  billing: { monthly: 'm', annual: 'a', annualSave: 20 },
  plans: [
    {
      name: 'Starter', tagline: 'For side projects finding shape.',
      monthly: '0', annual: '0', per: '', note: 'free forever',
      cta: 'Start for free', featured: false,
      features: ['Up to 3 projects', '10k events / month', '7-day data retention', 'Community support'],
    },
    {
      name: 'Growth', tagline: 'For teams with graphs going up.',
      monthly: '29', annual: '23', per: '/mo', noteM: 'per editor, billed monthly', noteA: 'per editor, billed annually',
      cta: 'Start 14-day trial', featured: true,
      features: ['Unlimited projects', '1M events / month', '13-month data retention', 'Custom dashboards', 'Slack + email support'],
      hi: [1, 3], // highlighted feature indexes
    },
    {
      name: 'Enterprise', tagline: 'For companies with procurement.',
      monthly: null, annual: null, per: '', note: 'annual agreement',
      cta: 'Talk to sales', featured: false,
      features: ['Everything in Growth', 'Dedicated infrastructure', 'SSO / SAML', '99.99% uptime SLA', 'Solutions engineer'],
    },
  ],
};
/* -------------------------------------------------------- */

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(pointer: fine)').matches;

const CHECK_SVG = '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
  '<circle cx="8" cy="8" r="7" stroke="currentColor" stroke-opacity=".35" stroke-width="1.4"/>' +
  '<path d="M5.2 8.2l1.9 1.9 3.7-4" stroke="currentColor" stroke-width="1.6" ' +
  'stroke-linecap="round" stroke-linejoin="round"/></svg>';

/* ---------- card rendering ---------- */
const cardsEl = document.getElementById('cards');

function priceHTML(plan) {
  if (plan.monthly === null) return '<span class="price-custom">Custom</span>';
  return '<span class="price" aria-live="polite"></span>';
}

function render() {
  cardsEl.innerHTML = '';
  CONFIG.plans.forEach((p, i) => {
    const el = document.createElement('article');
    el.className = 'card' + (p.featured ? ' pop' : '');
    el.style.setProperty('--d', (0.34 + i * 0.1) + 's');
    el.dataset.pop = p.featured ? '1' : '0';
    const feats = p.features.map((f, j) => {
      const hi = p.hi && p.hi.includes(j);
      return '<li class="' + (hi ? 'hi' : '') + '">' + CHECK_SVG + '<span>' + f + '</span></li>';
    }).join('');
    el.innerHTML =
      '<div class="glare"></div>' +
      '<div class="card-in">' +
        (p.featured ? '<span class="badge">Most popular</span>' : '') +
        '<h3>' + p.name + '</h3><p class="tag">' + p.tagline + '</p>' +
        '<div class="price-row">' + priceHTML(p) +
          (p.per ? '<span class="per">' + p.per + '</span>' : '') + '</div>' +
        '<p class="bill-note">' + (p.note || p.noteM || '') + '</p>' +
        '<a class="btn' + (p.featured ? ' primary' : '') + '" href="#">' + p.cta + '</a>' +
        '<ul class="features">' + feats + '</ul>' +
      '</div>';
    cardsEl.appendChild(el);
    p._el = el;
    p._reels = null;
    const priceBox = el.querySelector('.price');
    if (priceBox) {
      p._reels = buildReels(priceBox, p.monthly);
      p._noteEl = el.querySelector('.bill-note');
    }
  });
}

/* ---------- odometer reels ---------- */
function buildReels(box, str) {
  const cur = document.createElement('span');
  cur.className = 'cur'; cur.textContent = CONFIG.currency;
  box.appendChild(cur);
  const reels = [];
  [...str].forEach((ch) => {
    const reel = document.createElement('span'); reel.className = 'reel';
    const inner = document.createElement('span'); inner.className = 'reel-inner';
    for (let d = 0; d < 10; d++) {
      const s = document.createElement('span'); s.className = 'reel-d'; s.textContent = d;
      inner.appendChild(s);
    }
    const v = parseInt(ch, 10);
    inner.style.transition = 'none';
    inner.style.transform = 'translateY(' + (-v) + 'em)';
    reel.appendChild(inner); box.appendChild(reel); reels.push(inner);
  });
  // force reflow so later transitions animate
  void box.offsetWidth;
  reels.forEach((r) => { r.style.transition = ''; });
  return reels;
}

function rollTo(plan, str) {
  if (!plan._reels) return;
  const need = str.length;
  // rebuild if digit count changed
  if (plan._reels.length !== need) {
    const box = plan._el.querySelector('.price');
    box.innerHTML = '';
    plan._reels = buildReels(box, str);
    return;
  }
  [...str].forEach((ch, i) => {
    const inner = plan._reels[i];
    inner.style.transitionDelay = (i * 55) + 'ms';
    inner.style.transform = 'translateY(' + (-parseInt(ch, 10)) + 'em)';
  });
  setTimeout(() => plan._reels.forEach((r) => { r.style.transitionDelay = ''; }), 900);
}

/* ---------- billing toggle + particle burst ---------- */
const billingEl = document.querySelector('.billing');
let billing = 'm';

const cv = document.getElementById('fx');
const cx2d = cv.getContext('2d');
let parts = [], pRaf = 0;

function sizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
  cx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
}
sizeCanvas();
window.addEventListener('resize', sizeCanvas);

function burst(x, y) {
  if (reducedMotion) return;
  const colors = ['#ffb224', '#ffd97a', '#f4f0e8', '#ff9d1f'];
  for (let i = 0; i < 42; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 1.5 + Math.random() * 4.5;
    parts.push({
      x, y,
      vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 1.2,
      life: 1, decay: 0.014 + Math.random() * 0.02,
      size: 1 + Math.random() * 2.4,
      color: colors[(Math.random() * colors.length) | 0],
    });
  }
  if (!pRaf) pTick();
}

function pTick() {
  cx2d.clearRect(0, 0, innerWidth, innerHeight);
  parts = parts.filter((p) => p.life > 0);
  for (const p of parts) {
    p.x += p.vx; p.y += p.vy; p.vy += 0.11; p.vx *= 0.985; p.life -= p.decay;
    cx2d.globalAlpha = Math.max(p.life, 0);
    cx2d.fillStyle = p.color;
    cx2d.beginPath();
    cx2d.arc(p.x, p.y, p.size * p.life + 0.4, 0, Math.PI * 2);
    cx2d.fill();
  }
  cx2d.globalAlpha = 1;
  pRaf = parts.length ? requestAnimationFrame(pTick) : 0;
  if (!pRaf) cx2d.clearRect(0, 0, innerWidth, innerHeight);
}

billingEl.addEventListener('click', (e) => {
  const btn = e.target.closest('.b-opt');
  if (!btn || btn.dataset.b === billing) return;
  billing = btn.dataset.b;
  billingEl.dataset.b = billing;
  billingEl.querySelectorAll('.b-opt').forEach((b) => {
    const on = b.dataset.b === billing;
    b.classList.toggle('is-on', on);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
  const r = billingEl.getBoundingClientRect();
  burst(r.left + r.width / 2, r.top + r.height / 2);
  CONFIG.plans.forEach((p) => {
    if (p._reels) {
      rollTo(p, billing === 'm' ? p.monthly : p.annual);
      if (p._noteEl) {
        const annual = billing === 'a';
        p._noteEl.innerHTML = annual
          ? 'per editor, billed annually — <b>save ' + CONFIG.billing.annualSave + '%</b>'
          : (p.noteM || p.note || '');
      }
    }
  });
});

/* ---------- 3D tilt + glare ---------- */
function addTilt(card) {
  if (!finePointer || reducedMotion) return;
  const glare = card.querySelector('.glare');
  const pop = card.dataset.pop === '1';
  let tx = 0, ty = 0, rx = 0, ry = 0, gx = 50, gy = 50, tgx = 50, tgy = 50, raf = 0;

  card.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    ty = (px - 0.5) * 13; tx = (0.5 - py) * 11;
    tgx = px * 100; tgy = py * 100;
    if (!raf) raf = requestAnimationFrame(loop);
  });
  card.addEventListener('pointerleave', () => {
    tx = 0; ty = 0;
    if (!raf) raf = requestAnimationFrame(loop);
  });

  function loop() {
    rx += (tx - rx) * 0.14; ry += (ty - ry) * 0.14;
    gx += (tgx - gx) * 0.2; gy += (tgy - gy) * 0.2;
    const lift = pop ? ' translateY(-10px)' : '';
    card.style.transform =
      'perspective(1100px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg)' + lift;
    glare.style.background =
      'radial-gradient(440px circle at ' + gx.toFixed(1) + '% ' + gy.toFixed(1) + '%, rgba(255,178,36,.15), transparent 65%)';
    const moving = Math.abs(tx - rx) > 0.02 || Math.abs(ty - ry) > 0.02;
    if (moving) { raf = requestAnimationFrame(loop); }
    else { raf = 0; card.style.transform = ''; glare.style.background = ''; }
  }
}

/* ---------- magnetic CTAs ---------- */
function addMagnetic(btn) {
  if (!finePointer || reducedMotion) return;
  btn.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const r = btn.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    if (Math.hypot(dx, dy) < 120) {
      btn.style.transition = 'transform .1s ease-out';
      btn.style.transform = 'translate(' + (dx * 0.2).toFixed(1) + 'px,' + (dy * 0.26).toFixed(1) + 'px)';
    }
  });
  btn.addEventListener('pointerleave', () => {
    btn.style.transition = 'transform .5s cubic-bezier(.22,1,.36,1)';
    btn.style.transform = '';
  });
}

/* ---------- boot ---------- */
render();
document.querySelectorAll('.card').forEach(addTilt);
document.querySelectorAll('.btn').forEach(addMagnetic);

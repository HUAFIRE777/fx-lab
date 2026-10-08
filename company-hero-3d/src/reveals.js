/* huafire3d fx-lab — original implementation */
/* company-hero-3d · 揭示动效：大标题逐行遮罩揭示 + 元素淡入
   防呆（studiofreight 两坑）：
   ① 纯 class 驱动，绝不读写 el.style.transform——不存在"播完忘加类/行内被清空"的分支；
   ② 显示态选择器 html.js .rv.is-in .rv-txt 特异度高于隐藏态，播完不可能被压回；
   ③ 6 秒兜底：任何异常都强制显示，标题永不隐身；
   ④ 与 WebGL 解耦：canvas 挂了标题照样揭示。 */

const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'; /* expo-out 手感，有物理感 */

export function applyCopy(cfg) {
  const set = (sel, val, html = false) => {
    document.querySelectorAll(sel).forEach(el => {
      if (val != null) { html ? (el.innerHTML = val) : (el.textContent = val); }
    });
  };
  set('[data-copy="brand"]', cfg.brand.name);
  set('[data-copy="eyebrow"]', cfg.eyebrow);
  set('[data-copy="sub"]', cfg.sub);
  set('[data-copy="scrollHint"]', cfg.scrollHint);
  set('[data-copy="footerNote"]', cfg.footer.note);
  set('[data-copy="backTop"]', cfg.footer.backTop);

  /* nav */
  const nav = document.querySelector('[data-copy="nav"]');
  if (nav) {
    nav.innerHTML = cfg.nav.map(a =>
      `<a class="nav-link" href="${a.href}">${a.label}</a>`).join('');
  }
  const navCta = document.querySelector('[data-copy="navCta"]');
  if (navCta) { navCta.textContent = cfg.navCta.label; navCta.href = cfg.navCta.href; }

  /* CTA */
  const ctas = document.querySelector('[data-copy="ctas"]');
  if (ctas) {
    ctas.innerHTML = cfg.ctas.map(c =>
      `<a class="btn ${c.primary ? 'btn-primary' : 'btn-ghost'}" href="${c.href}">
         <span>${c.label}</span><i class="btn-arrow" aria-hidden="true">→</i>
       </a>`).join('');
  }

  /* 标题行：每行包遮罩，<em> 保留给 accent 色 */
  const title = document.querySelector('[data-copy="title"]');
  if (title) {
    title.innerHTML = cfg.titleLines.map(line =>
      `<span class="rv" data-line><span class="rv-mask"><span class="rv-txt">${line}</span></span></span>`
    ).join('');
  }

  /* 能力区 */
  const caps = document.querySelector('[data-copy="caps"]');
  if (caps) {
    caps.innerHTML = cfg.capabilities.map(c =>
      `<div class="cap" data-fade>
         <div class="cap-no">${c.no}</div>
         <h3>${c.title}</h3>
         <p>${c.desc}</p>
       </div>`).join('');
  }

  /* 配色：CSS 变量，全页统一 */
  const root = document.documentElement.style;
  root.setProperty('--bg', cfg.palette.bg);
  root.setProperty('--bg-soft', cfg.palette.bgSoft);
  root.setProperty('--ink', cfg.palette.ink);
  root.setProperty('--ink-dim', cfg.palette.inkDim);
  root.setProperty('--accent', cfg.palette.accent);
}

export function playIntro({ reduced = false } = {}) {
  const lines = [...document.querySelectorAll('[data-line]')];
  const fades = [...document.querySelectorAll('#hero [data-fade]')];

  const show = (el, delay) => {
    if (reduced || delay < 0) { el.classList.add('is-in'); return; }
    el.style.transitionDelay = `${delay}ms`; /* 仅 delay，无 transform 操作 */
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('is-in')));
  };

  /* 编排：标题逐行 → 副标题/CTA → 滚动提示。背景 canvas 先出（main 里已先启动）。 */
  lines.forEach((el, i) => show(el, 120 + i * 140));
  fades.forEach((el, i) => show(el, 620 + i * 110));

  /* 兜底：6 秒内没播完的一律强制显示 */
  setTimeout(() => {
    document.querySelectorAll('#hero [data-line], #hero [data-fade]')
      .forEach(el => el.classList.add('is-in'));
  }, 6000);
}

export function initScrollReveals() {
  const els = [...document.querySelectorAll('#capabilities [data-fade]')];
  if (!('IntersectionObserver' in window) || !els.length) {
    els.forEach(el => el.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en, k) => {
      if (en.isIntersecting) {
        en.target.style.transitionDelay = `${k * 90}ms`;
        en.target.classList.add('is-in');
        io.unobserve(en.target);
      }
    });
  }, { threshold: 0.25 });
  els.forEach(el => io.observe(el));
}

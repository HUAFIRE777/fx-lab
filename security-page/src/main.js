/* 守望 · 智能安防落地页交互 — 原生 JS，零第三方依赖，原创实现 */
'use strict';

/* ============ 页面顶部配置：一改全改 ============ */
const SITE = {
  name:    '守望智能',
  phone:   '400-888-2666',
  email:   'hello@shouwang.cn',
  address: '上海市浦东新区张江高科技园区亮景路 88 号',
  icp:     '沪ICP备00000000号-1',
};

/* ============ 法务三件套文案（真实感通用条款，含数据安全） ============ */
const MODAL_DOCS = {
  privacy: {
    title: '隐私政策',
    body: [
      '我们收集什么：为完成安装与告警服务，仅收集姓名、电话、地址及设备运行状态；不收集与安防无关的信息。',
      '影像数据归你：门铃与摄像头的录像默认保存在你家本地（机身 / SD 卡），云端仅在你开通云存储后上传加密副本。',
      '端到端加密：影像上传与远程查看全程加密传输，我们的服务器也无法直接查看你的画面内容。',
      '人脸识别只在端侧：人形 / 人脸检测在设备本地完成，特征值不出家门，更不会用于广告画像。',
      '你的删除权：App 内可随时删除云端录像与账号数据，删除后 15 天内从备份中彻底清除；注销账号即删即走。',
      '联系我们：对个人信息有任何疑问，发邮件至 ' + SITE.email + '，我们将在 15 个工作日内答复。',
    ],
  },
  terms: {
    title: '服务条款',
    body: [
      '服务内容：守望提供智能安防硬件、守望 App 及可选的上门安装、云存储订阅服务。',
      '安装与保修：官方安装享 2 小时完工承诺；硬件自签收起 1 年质保（旗舰套装 3 年），人为损坏除外。',
      '订阅与退订：云存储按月 / 按年订阅，App 内随时退订，退订后本地录像与告警功能不受影响。',
      '合理使用：请勿将设备对准他人私密空间；因违反法律法规使用设备产生的责任由使用者承担。',
      '责任限制：因不可抗力（断电断网、自然灾害）导致的服务中断我们免责但会尽力恢复；硬件故障按保修政策处理。',
      '争议解决：本条款适用中华人民共和国法律，争议提交公司所在地人民法院诉讼解决。',
    ],
  },
  cookie: {
    title: 'Cookie 政策',
    body: [
      '必需 Cookie：登录态、表单防重复提交等网站基本功能所需，不可关闭。',
      '偏好 Cookie：记住你选择的套装与城市，方便下次访问（本演示站实际不写入）。',
      '统计 Cookie：匿名的访问量统计，用于改进页面，不含个人身份信息。',
      '第三方 Cookie：本演示站不接入任何第三方广告或统计 SDK。',
      '如何管理：可在浏览器设置中清除或禁用 Cookie，禁用后预约表单仍可正常使用。',
      '政策更新：Cookie 政策更新时，我们会在页脚显著位置提示。',
    ],
  },
};

const $  = (s, c) => (c || document).querySelector(s);
const $$ = (s, c) => Array.prototype.slice.call((c || document).querySelectorAll(s));

/* ---------- SITE 绑定 ---------- */
function bindSite() {
  $$('[data-site]').forEach(el => {
    const v = SITE[el.getAttribute('data-site')];
    if (v != null) el.textContent = v;
  });
  $$('[data-site-link="phone"]').forEach(a => { a.href = 'tel:' + SITE.phone.replace(/-/g, ''); });
  $$('[data-site-link="email"]').forEach(a => { a.href = 'mailto:' + SITE.email; });
}

/* ---------- 加载态 → hero 入场 ---------- */
function ready() {
  const loader = $('#loader');
  if (loader) {
    loader.classList.add('done');
    setTimeout(() => loader.remove(), 600);
  }
  document.body.classList.add('ready');
}
let readyFired = false;
function fireReady() {
  if (readyFired) return;
  readyFired = true;
  // 首帧后再点亮，保证过渡动画可被观察到
  requestAnimationFrame(() => requestAnimationFrame(ready));
}
window.addEventListener('load', () => setTimeout(fireReady, 450));
setTimeout(fireReady, 2600); // 安全网：load 迟到也不卡死

/* ---------- 导航毛玻璃 ---------- */
function onScrollNav() {
  $('#nav').classList.toggle('scrolled', window.scrollY > 24);
}
window.addEventListener('scroll', onScrollNav, { passive: true });
onScrollNav();

/* ---------- 移动端抽屉 ---------- */
const burger = $('#burger'), drawer = $('#drawer'), veil = $('#veil');
function openDrawer() {
  burger.setAttribute('aria-expanded', 'true');
  drawer.classList.add('open');
  drawer.setAttribute('aria-hidden', 'false');
  veil.hidden = false;
  requestAnimationFrame(() => veil.classList.add('show'));
  document.body.style.overflow = 'hidden';
}
function closeDrawer() {
  if (!drawer.classList.contains('open')) return;
  burger.setAttribute('aria-expanded', 'false');
  drawer.classList.remove('open');
  drawer.setAttribute('aria-hidden', 'true');
  veil.classList.remove('show');
  document.body.style.overflow = '';
  setTimeout(() => { if (!drawer.classList.contains('open')) veil.hidden = true; }, 320);
}
burger.addEventListener('click', () => (drawer.classList.contains('open') ? closeDrawer() : openDrawer()));
veil.addEventListener('click', closeDrawer);
$$('#drawer a').forEach(a => a.addEventListener('click', closeDrawer));

/* ---------- 滚动 reveal ---------- */
function initReveal() {
  const els = $$('.reveal');
  if (!('IntersectionObserver' in window)) { els.forEach(el => el.classList.add('in')); return; }
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const d = parseInt(e.target.getAttribute('data-d') || '0', 10);
        e.target.style.transitionDelay = (d * 90) + 'ms';
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.16 });
  els.forEach(el => io.observe(el));
  // 安全网：4 秒后强制点亮，防止 IO 漏报导致元素永久隐藏
  setTimeout(() => els.forEach(el => el.classList.add('in')), 4000);
}

/* ---------- 数字滚动计数器 ---------- */
function animateCounter(el) {
  const target = parseFloat(el.getAttribute('data-count'));
  const dec = parseInt(el.getAttribute('data-decimals') || '0', 10);
  if (isNaN(target)) return;
  const dur = 1400, t0 = performance.now();
  function frame(t) {
    const p = Math.min((t - t0) / dur, 1);
    const e = 1 - Math.pow(1 - p, 4); // easeOutQuart，快起慢收
    el.textContent = (target * e).toFixed(dec);
    if (p < 1) requestAnimationFrame(frame);
    else el.textContent = target.toFixed(dec); // 收尾强制对齐终值
  }
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    el.textContent = target.toFixed(dec);
  } else {
    requestAnimationFrame(frame);
  }
}
function initCounters() {
  const els = $$('.counter');
  const done = new WeakSet();
  const run = el => { if (!done.has(el)) { done.add(el); animateCounter(el); } };
  if (!('IntersectionObserver' in window)) { els.forEach(run); return; }
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } });
  }, { threshold: 0.4 });
  els.forEach(el => io.observe(el));
  // 安全网：6 秒后未触发的一律直接定值
  setTimeout(() => els.forEach(el => {
    if (!done.has(el)) {
      done.add(el);
      const t = parseFloat(el.getAttribute('data-count'));
      const d = parseInt(el.getAttribute('data-decimals') || '0', 10);
      if (!isNaN(t)) el.textContent = t.toFixed(d);
    }
  }), 6000);
}

/* ---------- 场景 tabs ---------- */
function initTabs() {
  const tabs = $$('.tab'), panels = $$('.panel');
  tabs.forEach(tab => tab.addEventListener('click', () => {
    tabs.forEach(t => { t.classList.remove('on'); t.setAttribute('aria-selected', 'false'); });
    tab.classList.add('on');
    tab.setAttribute('aria-selected', 'true');
    const key = tab.getAttribute('data-tab');
    panels.forEach(p => {
      const on = p.getAttribute('data-panel') === key;
      p.hidden = !on;
      p.classList.toggle('on', on);
    });
  }));
}

/* ---------- 套装选择 → 表单联动 ---------- */
function initPlanPick() {
  const sel = $('#fPlan');
  $$('.plan-pick').forEach(btn => btn.addEventListener('click', () => {
    const v = btn.getAttribute('data-plan');
    Array.prototype.forEach.call(sel.options, o => { if (o.value === v) sel.value = v; });
    $('#booking').scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => $('#fName').focus({ preventScroll: true }), 700);
  }));
}

/* ---------- 预约表单：校验 + 成功态 ---------- */
function setErr(input, errEl, bad) {
  input.classList.toggle('invalid', bad);
  errEl.hidden = !bad;
  input.setAttribute('aria-invalid', bad ? 'true' : 'false');
  return !bad;
}
function initForm() {
  const form = $('#bookForm');
  const name = $('#fName'), phone = $('#fPhone'), city = $('#fCity'), agree = $('#fAgree');
  const btn = $('#bookBtn'), label = $('.btn-label', btn), spinner = $('.spinner', btn);
  const ok = $('#bookOk');

  // 输入即清除错误态
  [[name, $('#eName')], [phone, $('#ePhone')], [city, $('#eCity')]].forEach(([inp, err]) => {
    inp.addEventListener('input', () => setErr(inp, err, false));
  });
  agree.addEventListener('change', () => { $('#eAgree').hidden = true; });

  form.addEventListener('submit', e => {
    e.preventDefault();
    const okName  = setErr(name,  $('#eName'),  name.value.trim().length < 2);
    const okPhone = setErr(phone, $('#ePhone'), !/^1[3-9]\d{9}$/.test(phone.value.trim()));
    const okCity  = setErr(city,  $('#eCity'),  city.value.trim().length < 2);
    const okAgree = (function () { const bad = !agree.checked; $('#eAgree').hidden = !bad; return !bad; })();
    const firstBad = !okName ? name : !okPhone ? phone : !okCity ? city : null;
    if (firstBad) { firstBad.focus(); return; }
    if (!okAgree) { agree.focus(); return; }

    // 加载态（模拟提交）
    btn.disabled = true;
    label.textContent = '正在提交…';
    spinner.hidden = false;
    setTimeout(() => {
      form.hidden = true;
      ok.hidden = false;
      ok.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 1100);
  });
}

/* ---------- 法务弹窗：按钮 + 遮罩 + ESC 三通道 ---------- */
const modal = $('#modal'), modalVeil = $('#modalVeil');
let lastTrigger = null;
function openModal(key, trigger) {
  const doc = MODAL_DOCS[key];
  if (!doc) return;
  lastTrigger = trigger || null;
  $('#modalTitle').textContent = doc.title;
  const ol = document.createElement('ol');
  doc.body.forEach(t => {
    const li = document.createElement('li');
    li.textContent = t;
    ol.appendChild(li);
  });
  const body = $('#modalBody');
  body.innerHTML = '';
  body.appendChild(ol);
  body.scrollTop = 0;
  modal.hidden = false;
  modalVeil.hidden = false;
  requestAnimationFrame(() => { modal.classList.add('open'); modalVeil.classList.add('show'); });
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  $('#modalX').focus();
}
function closeModal() {
  if (modal.hidden) return;
  modal.classList.remove('open');
  modalVeil.classList.remove('show');
  setTimeout(() => {
    modal.hidden = true;
    modalVeil.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
  }, 300);
  if (lastTrigger && lastTrigger.focus) lastTrigger.focus();
}
$$('[data-modal]').forEach(b => b.addEventListener('click', () => { closeDrawer(); openModal(b.getAttribute('data-modal'), b); }));
$('#modalX').addEventListener('click', closeModal);
modalVeil.addEventListener('click', closeModal);
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (!modal.hidden) closeModal();      // 弹窗优先于抽屉
  else closeDrawer();
});

/* ---------- 启动 ---------- */
bindSite();
initReveal();
initCounters();
initTabs();
initPlanPick();
initForm();

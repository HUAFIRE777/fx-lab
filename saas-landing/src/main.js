/* Northloop · SaaS 落地页交互
   classic script，无模块依赖。GSAP 可选：缺失时全部降级为 CSS/原生实现。 */
(function () {
  'use strict';

  /* ============ SITE 配置：买家改这里，一改全改 ============ */
  var SITE = {
    name: 'Northloop',
    address: '北京市朝阳区建国路 88 号 SOHO 现代城 A 座 1206',
    email: 'support@northloop.io',
    phone: '+86 10-8888-6666',
    icp: '京ICP备xxxxxx号'   /* 上线后替换为真实备案号 */
  };

  /* ============ 法务三件套文案 ============ */
  var MODAL_DOCS = {
    privacy: {
      title: '隐私政策',
      updated: '最后更新：2026 年 10 月',
      points: [
        '<b>我们收集哪些数据。</b>账号信息（姓名、邮箱）、使用数据（功能点击、设备型号、崩溃日志）、账单信息由支付服务商处理，我们不存储完整卡号。',
        '<b>数据用来做什么。</b>提供服务、故障排查、产品改进与安全风控。我们不会把你的个人数据出售或出租给任何第三方。',
        '<b>Cookie 的使用。</b>登录态、偏好设置与匿名统计，详见《Cookie 政策》；你可以在浏览器设置中随时管理。',
        '<b>数据保存多久。</b>账号注销后 30 天内删除生产数据与备份；法律法规要求保留的除外（如交易记录）。',
        '<b>你的权利。</b>查阅、更正、删除、导出你的个人数据，发邮件到 ' + SITE.email + '，我们会在 15 个工作日内回复处理。',
        '<b>未成年人保护。</b>本服务不面向 14 岁以下儿童；如发现误收集，我们会第一时间删除。'
      ]
    },
    terms: {
      title: '服务条款',
      updated: '最后更新：2026 年 10 月',
      points: [
        '<b>服务内容。</b>Northloop 按订阅制提供项目协作 SaaS，具体功能以官网当前版本为准；我们会持续迭代，重大变更提前公告。',
        '<b>账号安全。</b>你对自己账号下的一切操作负责；发现异常登录请立即修改密码并通过 ' + SITE.email + ' 通知我们。',
        '<b>合理使用。</b>不得上传违法内容、攻击服务、批量爬取数据或转售账号；违规者我们有权暂停或终止服务并保留追责权利。',
        '<b>付费与退款。</b>按月 / 按年预付；7 天内无理由全额退款；年付用户中途解约，按剩余整月比例退还费用。',
        '<b>服务可用性。</b>目标月度可用性 99.9%；计划内维护提前 48 小时公告，紧急维护事后 24 小时内补公告。',
        '<b>责任上限。</b>因服务问题造成的直接损失，以你过去 12 个月实际支付的费用为上限；不可抗力造成的损失双方互不担责。'
      ]
    },
    cookie: {
      title: 'Cookie 政策',
      updated: '最后更新：2026 年 10 月',
      points: [
        '<b>什么是 Cookie。</b>存在你设备上的小文本文件，帮我们记住登录态和偏好设置；按用途分为必要、偏好、统计三类。',
        '<b>必要 Cookie。</b>登录会话、安全校验、负载均衡；禁用它们将导致网站无法正常使用。',
        '<b>偏好 Cookie。</b>记住你的语言、主题、看板视图等个性化设置，关掉只会影响体验，不影响核心功能。',
        '<b>统计 Cookie。</b>匿名统计页面访问与功能使用情况，用于改进产品；可在账号设置中一键关闭。',
        '<b>第三方 Cookie。</b>支付环节会用到支付服务商的 Cookie，受其自身隐私政策约束，我们不读取其内容。',
        '<b>如何管理。</b>浏览器设置中随时清除或禁用；首次访问时的横幅可一键接受或拒绝非必要 Cookie。'
      ]
    }
  };

  var hasGsap = typeof window.gsap !== 'undefined';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(pointer: fine)').matches;

  /* ---------- 加载态 ---------- */
  var loader = document.getElementById('loader');
  var loaderDone = false;
  function hideLoader() {
    if (loaderDone || !loader) return;
    loaderDone = true;
    loader.classList.add('done');
    setTimeout(function () { if (loader.parentNode) loader.parentNode.removeChild(loader); }, 600);
    /* loader 走后再进场，节奏干净；加载慢时也不抢跑 */
    setTimeout(playHero, reduced ? 0 : 150);
  }
  window.addEventListener('load', function () { setTimeout(hideLoader, 350); });
  setTimeout(hideLoader, 2600); /* 兜底：load 事件迟迟不来也不卡页面 */

  /* ---------- 导航：滚动后毛玻璃 ---------- */
  var nav = document.getElementById('nav');
  function onScroll() {
    nav.classList.toggle('scrolled', window.scrollY > 24);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- 移动端抽屉 ---------- */
  var burger = document.getElementById('burger');
  var drawer = document.getElementById('drawer');
  var veil = document.getElementById('drawerVeil');
  function setDrawer(open) {
    document.body.classList.toggle('drawer-open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  burger.addEventListener('click', function () {
    setDrawer(!document.body.classList.contains('drawer-open'));
  });
  veil.addEventListener('click', function () { setDrawer(false); });
  drawer.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () { setDrawer(false); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (document.body.classList.contains('modal-open')) closeModal();
      else setDrawer(false);
    }
  });

  /* ---------- 页脚 SITE 变量渲染 ---------- */
  document.querySelectorAll('[data-site]').forEach(function (el) {
    var k = el.getAttribute('data-site');
    if (!SITE[k]) return;
    if (k === 'email') {
      el.textContent = SITE.email;
      el.setAttribute('href', 'mailto:' + SITE.email);
    } else if (k === 'phone') {
      el.textContent = SITE.phone;
      el.setAttribute('href', 'tel:' + SITE.phone.replace(/[^+\d]/g, ''));
    } else {
      el.textContent = SITE[k];
    }
  });

  /* ---------- 法务弹窗 ---------- */
  var modal = document.getElementById('modal');
  var modalVeil = document.getElementById('modalVeil');
  var modalTitle = document.getElementById('modalTitle');
  var modalBody = document.getElementById('modalBody');
  var modalX = document.getElementById('modalX');
  var lastFocus = null;

  function openModal(key) {
    var doc = MODAL_DOCS[key];
    if (!doc || !modal) return;
    lastFocus = document.activeElement;
    modalTitle.textContent = doc.title;
    modalBody.innerHTML = '<ol>' + doc.points.map(function (p) {
      return '<li>' + p + '</li>';
    }).join('') + '</ol><p class="modal-foot">' + doc.updated + '</p>';
    modalBody.scrollTop = 0;
    modal.setAttribute('aria-hidden', 'false');
    modalVeil.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    modalX.focus();
  }
  function closeModal() {
    if (!document.body.classList.contains('modal-open')) return;
    document.body.classList.remove('modal-open');
    modal.setAttribute('aria-hidden', 'true');
    modalVeil.setAttribute('aria-hidden', 'true');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  document.querySelectorAll('[data-modal]').forEach(function (btn) {
    btn.addEventListener('click', function () { openModal(btn.getAttribute('data-modal')); });
  });
  modalX.addEventListener('click', closeModal);
  modalVeil.addEventListener('click', closeModal);

  /* ---------- Hero 入场编排：loader 走后按 data-d 依次点亮 ---------- */
  var heroReveals = document.querySelectorAll('.hero .reveal');
  var heroPlayed = false;
  function playHero() {
    if (heroPlayed) return;
    heroPlayed = true;
    heroReveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- 其余区块：滚动进入视口 reveal ---------- */
  var ioTargets = document.querySelectorAll('.reveal:not(.hero .reveal)');
  function revealAll() {
    ioTargets.forEach(function (el) { el.classList.add('is-in'); });
  }
  if ('IntersectionObserver' in window && !reduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('is-in');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.16, rootMargin: '0px 0px -6% 0px' });
    ioTargets.forEach(function (el) { io.observe(el); });
    /* 安全网：4 秒后视口内的还没点亮就强制点亮（IO 漏报兜底） */
    setTimeout(function () {
      ioTargets.forEach(function (el) {
        if (!el.classList.contains('is-in')) {
          var r = el.getBoundingClientRect();
          if (r.top < window.innerHeight * 0.92) el.classList.add('is-in');
        }
      });
    }, 4000);
  } else {
    revealAll();
  }

  /* ---------- Hero mock：鼠标视差 ---------- */
  var mock = document.getElementById('mock');
  var stage = mock && mock.closest('.mock-stage');
  if (mock && stage && finePointer && !reduced) {
    mock.classList.add('js-parallax');
    var BASE_RX = 14;
    if (hasGsap) {
      gsap.set(mock, { rotateX: BASE_RX, transformPerspective: 1600, transformOrigin: '50% 0%' });
      var rxTo = gsap.quickTo(mock, 'rotateX', { duration: 0.6, ease: 'power3.out' });
      var ryTo = gsap.quickTo(mock, 'rotateY', { duration: 0.6, ease: 'power3.out' });
      var xTo = gsap.quickTo(mock, 'x', { duration: 0.7, ease: 'power3.out' });
      var yTo = gsap.quickTo(mock, 'y', { duration: 0.7, ease: 'power3.out' });
      var hero = document.querySelector('.hero');
      hero.addEventListener('mousemove', function (e) {
        var r = stage.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) / r.width;   /* -0.5 ~ 0.5 */
        var dy = (e.clientY - (r.top + r.height / 2)) / r.height;
        rxTo(BASE_RX - dy * 9);
        ryTo(dx * 13);
        xTo(dx * 22);
        yTo(dy * 14);
      });
      hero.addEventListener('mouseleave', function () {
        rxTo(BASE_RX); ryTo(0); xTo(0); yTo(0);
      });
    }
    /* 无 GSAP 时：保持 CSS 静态倾斜，不做视差（依然完整可看） */
  }

  /* ---------- 看板小交互：点任务切换完成态，列计数实时跟随 ---------- */
  document.querySelectorAll('.mock-col').forEach(function (col) {
    var count = col.querySelector('h4 em');
    col.querySelectorAll('.task').forEach(function (task) {
      task.style.cursor = 'pointer';
      task.addEventListener('click', function () {
        var done = task.classList.toggle('done');
        var check = task.querySelector('.check');
        if (!check) {
          check = document.createElement('span');
          check.className = 'check';
          task.insertBefore(check, task.firstChild);
        }
        check.classList.toggle('on', done);
        if (count) count.textContent = col.querySelectorAll('.task').length;
      });
    });
  });

  /* ---------- 按钮磁吸：细微跟手 ---------- */
  if (hasGsap && finePointer && !reduced) {
    document.querySelectorAll('.magnetic').forEach(function (btn) {
      var xTo = gsap.quickTo(btn, 'x', { duration: 0.35, ease: 'power3.out' });
      var yTo = gsap.quickTo(btn, 'y', { duration: 0.35, ease: 'power3.out' });
      btn.addEventListener('mousemove', function (e) {
        var r = btn.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * 0.14);
        yTo((e.clientY - (r.top + r.height / 2)) * 0.22);
      });
      btn.addEventListener('mouseleave', function () { xTo(0); yTo(0); });
    });
  }
})();

/* 视差接管后关掉 CSS 的 transform 过渡，避免打架 */
(function () {
  var st = document.createElement('style');
  st.textContent = '.mock.js-parallax{transition:none}';
  document.head.appendChild(st);
})();

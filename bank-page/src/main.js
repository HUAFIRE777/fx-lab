/* 恒信银行 · 银行金融落地页交互
   classic script，无第三方依赖，纯原生实现。
   核心动效体系：数字滚动计数器 + 卡片 hover 上浮（CSS） + 滚动 reveal。 */
(function () {
  'use strict';

  /* ============ SITE 配置：买家改这里，一改全改 ============ */
  var SITE = {
    name: '恒信银行',
    address: '上海市浦东新区陆家嘴环路 1000 号',
    email: 'service@evertrust-bank.cn',
    phone: '955XX',                 /* 上线后替换为真实客服热线 */
    icp: '沪ICP备xxxxxx号'          /* 上线后替换为真实备案号 */
  };

  /* ============ 法务三件套：金融口径真实感通用条款 ============ */
  var MODAL_DOCS = {
    privacy: {
      title: '隐私政策',
      updated: '最后更新：2026 年 10 月',
      points: [
        '<b>我们收集哪些信息。</b>开户与业务办理时依法收集的身份信息（姓名、身份证件、联系方式）、账户信息与交易记录，以及为防范风险记录的设备与登录信息。',
        '<b>信息用来做什么。</b>用于实名开户、客户尽职调查、反洗钱与反欺诈、交易处理与客户服务。我们不会将你的个人信息出售给任何第三方。',
        '<b>依法报送。</b>根据监管要求，你的信贷信息会依法报送至金融信用信息基础数据库；涉诉涉案信息按司法机关合法要求提供。',
        '<b>信息保存多久。</b>交易记录按法律法规要求至少保存 5 年；账户注销后，非法规要求保留的信息将在合理期限内删除或匿名化。',
        '<b>你的权利。</b>你有权查阅、更正、补充你的个人信息，或在符合法规前提下要求删除；请致电客服热线或前往任一网点办理，我们会在 15 个工作日内答复。',
        '<b>未成年人保护。</b>不满 18 周岁客户开户须由法定监护人陪同办理；我们不会主动向未成年人营销信贷产品。'
      ]
    },
    terms: {
      title: '服务条款',
      updated: '最后更新：2026 年 10 月',
      points: [
        '<b>账户实名制。</b>开户须本人持有效身份证件办理，不得出借、出租、出售账户；发现冒用开户的，本行有权立即冻结并报告公安机关。',
        '<b>挂失与补办。</b>存折、银行卡遗失可先口头挂失，口头挂失 5 日内须补办书面手续，逾期自动失效；挂失生效前已发生的交易由客户承担。',
        '<b>收费标准。</b>账户管理费、转账手续费、年费等收费项目与标准以网点公示及官网《服务价格目录》为准；调价提前 30 日公告。',
        '<b>交易限额。</b>为保障资金安全，手机银行默认单日转账限额 50 万元；大额交易须通过短信验证码加刷脸双重验证，可前往网点调整。',
        '<b>服务中断。</b>系统升级维护提前 48 小时公告；因不可抗力、通信故障导致的服务中断，本行不承担赔偿责任，但会尽力恢复并公告说明。',
        '<b>争议解决。</b>因本条款产生的争议，双方先协商；协商不成，提交本行总行所在地有管辖权的人民法院诉讼解决。'
      ]
    },
    cookie: {
      title: 'Cookie 政策',
      updated: '最后更新：2026 年 10 月',
      points: [
        '<b>什么是 Cookie。</b>存储在你设备上的小文本文件，用于记住登录态与偏好设置；按用途分为必要、偏好、统计三类。',
        '<b>必要 Cookie。</b>维持登录会话、交易安全校验与负载均衡；禁用它们将导致网上银行与手机银行无法正常使用。',
        '<b>偏好 Cookie。</b>记住你的语言、常用功能入口与字体大小；关闭只会影响个性化体验，不影响核心业务办理。',
        '<b>统计 Cookie。</b>匿名统计页面访问与功能使用热度，用于优化页面布局；不关联你的身份信息，可在浏览器设置中关闭。',
        '<b>我们不用第三方广告 Cookie。</b>本行官网不接入任何广告联盟的追踪 Cookie；支付环节的 Cookie 仅用于交易安全。',
        '<b>如何管理。</b>你可以在浏览器设置中随时查看、清除或禁用 Cookie；首次访问时的提示条可一键仅保留必要 Cookie。'
      ]
    }
  };

  /* ---------- 加载态 ---------- */
  var loader = document.getElementById('loader');
  function hideLoader() { if (loader) loader.classList.add('done'); }
  if (document.readyState === 'complete') hideLoader();
  else window.addEventListener('load', hideLoader);
  setTimeout(hideLoader, 4000); /* 兜底：load 迟迟不来也不卡死 */

  /* ---------- 导航滚动毛玻璃 ---------- */
  var nav = document.getElementById('nav');
  function onScroll() {
    if (window.scrollY > 24) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- 移动端抽屉 ---------- */
  var burger = document.getElementById('burger');
  var drawer = document.getElementById('drawer');
  var drawerVeil = document.getElementById('drawerVeil');
  function setDrawer(open) {
    drawer.classList.toggle('open', open);
    drawerVeil.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.style.overflow = open ? 'hidden' : '';
  }
  burger.addEventListener('click', function () {
    setDrawer(!drawer.classList.contains('open'));
  });
  drawerVeil.addEventListener('click', function () { setDrawer(false); });
  drawer.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () { setDrawer(false); });
  });

  /* ---------- 滚动 reveal：IO + data-d 阶梯 + 4s 安全网 ---------- */
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var revealEls = document.querySelectorAll('.reveal');
  function lightUp(el) {
    var d = parseInt(el.getAttribute('data-d') || '0', 10);
    el.style.transitionDelay = (d * 90) + 'ms';
    el.classList.add('is-in');
  }
  if (reduceMotion) {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  } else if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { lightUp(en.target); io.unobserve(en.target); }
      });
    }, { threshold: 0.16 });
    revealEls.forEach(function (el) { io.observe(el); });
    /* 4 秒安全网：IO 漏报的元素强制点亮 */
    setTimeout(function () {
      revealEls.forEach(function (el) {
        if (!el.classList.contains('is-in')) lightUp(el);
      });
    }, 4000);
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- 数字滚动计数器：核心动效 ---------- */
  function animateCounter(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
    var dur = 1600, t0 = null;
    function easeOutQuart(t) { return 1 - Math.pow(1 - t, 4); } /* 物理感：快起慢收 */
    function frame(now) {
      if (!t0) t0 = now;
      var p = Math.min((now - t0) / dur, 1);
      var v = target * easeOutQuart(p);
      el.textContent = v.toFixed(decimals);
      if (p < 1) requestAnimationFrame(frame);
      else el.textContent = target.toFixed(decimals); /* 收尾对齐，避免浮点残差 */
    }
    if (reduceMotion) { el.textContent = target.toFixed(decimals); return; }
    requestAnimationFrame(frame);
  }
  var counters = document.querySelectorAll('.counter');
  if ('IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { animateCounter(en.target); cio.unobserve(en.target); }
      });
    }, { threshold: 0.4 });
    counters.forEach(function (el) { cio.observe(el); });
    setTimeout(function () { /* 安全网：未触发的直接定值 */
      counters.forEach(function (el) {
        if (el.textContent === '0' || el.textContent === '0.0' || el.textContent === '0.00') {
          el.textContent = parseFloat(el.getAttribute('data-count')).toFixed(parseInt(el.getAttribute('data-decimals') || '0', 10));
        }
      });
    }, 6000);
  } else {
    counters.forEach(animateCounter);
  }

  /* ---------- SITE 变量渲染 ---------- */
  document.querySelectorAll('[data-site]').forEach(function (el) {
    var key = el.getAttribute('data-site');
    if (SITE[key] == null) return;
    if (el.tagName === 'A' && key === 'email') el.href = 'mailto:' + SITE.email;
    if (el.tagName === 'A' && key === 'phone') el.href = 'tel:' + SITE.phone.replace(/\s/g, '');
    el.textContent = SITE[key];
  });

  /* ---------- 法务三件套弹窗 ---------- */
  var modal = document.getElementById('modal');
  var modalVeil = document.getElementById('modalVeil');
  var modalTitle = document.getElementById('modalTitle');
  var modalUpdated = document.getElementById('modalUpdated');
  var modalPoints = document.getElementById('modalPoints');
  var modalX = document.getElementById('modalX');
  var lastTrigger = null;

  function openModal(key, trigger) {
    var doc = MODAL_DOCS[key];
    if (!doc) return;
    lastTrigger = trigger || null;
    modalTitle.textContent = doc.title;
    modalUpdated.textContent = doc.updated;
    modalPoints.innerHTML = doc.points.map(function (p) { return '<li>' + p + '</li>'; }).join('');
    modal.classList.add('open');
    modalVeil.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    modalVeil.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    modalX.focus();
  }
  function closeModal() {
    if (!modal.classList.contains('open')) return;
    modal.classList.remove('open');
    modalVeil.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    modalVeil.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    if (lastTrigger) lastTrigger.focus();
  }
  document.querySelectorAll('[data-modal]').forEach(function (btn) {
    btn.addEventListener('click', function () { openModal(btn.getAttribute('data-modal'), btn); });
  });
  modalX.addEventListener('click', closeModal);
  modalVeil.addEventListener('click', closeModal);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (modal.classList.contains('open')) closeModal();      /* 弹窗优先 */
      else if (drawer.classList.contains('open')) setDrawer(false);
    }
  });
})();

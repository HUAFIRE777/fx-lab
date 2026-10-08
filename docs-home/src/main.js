/* Flowbase 帮助中心交互：入场揭示 / 导航底边线 / 搜索真实过滤 / 分类锚点+过滤 / 移动菜单 */
(function () {
  'use strict';

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* ---------- 0. 站点配置：买家改这里，一改全改 ---------- */
  var SITE = {
    name: 'Flowbase',
    address: '北京市朝阳区建国路 88 号 SOHO 现代城 A 座 1201',
    email: 'support@flowbase.example',
    phone: '+86 10-8888-6666',
    icp: '京ICP备xxxxxx号',
    statusText: 'All Systems Operational'
  };

  /* 法务三件套文案：每篇 4-6 条要点 */
  var LEGAL = {
    privacy: {
      title: '隐私政策',
      updated: '最后更新：2026 年 9 月 1 日',
      lead: '我们只收集提供服务所必需的数据，并始终把你的数据控制权交还给你。',
      sections: [
        { h: '我们收集哪些数据', items: [
          '账号信息：邮箱、昵称、登录记录，用于身份识别与安全审计。',
          '流程数据：你创建的自动化流程配置与执行日志，这是服务的核心。',
          '设备与使用统计：匿名化的功能使用情况，用于改进产品体验。',
          '我们不收集与服务无关的个人敏感信息，也不会读取你接入的第三方应用内的无关内容。' ] },
        { h: '数据用途', items: [
          '仅用于提供、维护与改进服务，以及必要的风险控制。',
          '不会将你的个人数据出售、出租给任何第三方。' ] },
        { h: '数据跨境与安全合规', items: [
          '服务器部署在多个区域；发生跨境传输时，遵循标准合同条款并全程加密。',
          '传输全程 TLS 加密、存储加密，关键操作留有审计日志。',
          '发生安全事件时，我们将在 72 小时内通知受影响的用户并说明处置进展。' ] },
        { h: '你的权利', items: [
          '随时导出、更正或删除你的个人数据；注销账号后，数据按保留策略彻底清除。',
          '联系 ' + SITE.email + ' 行使上述权利，我们将在 15 个工作日内响应。' ] }
      ]
    },
    terms: {
      title: '服务条款',
      updated: '最后更新：2026 年 8 月 15 日',
      lead: '使用 Flowbase 前请阅读以下条款；继续使用即视为你已接受。',
      sections: [
        { h: '服务内容', items: [
          'Flowbase 提供工作流自动化 SaaS 服务，具体功能以官网公布为准。',
          '重大功能变更或停服将提前 30 天公告，并提供数据导出期。' ] },
        { h: '账号与安全', items: [
          '你有责任妥善保管账号凭证；因凭证泄露产生的操作视为你本人行为。',
          '发现异常登录请立即修改密码并联系支持团队冻结账号。' ] },
        { h: '合理使用', items: [
          '禁止滥用 API 额度、攻击服务、或将服务用于违法用途。',
          '违反者我们有权暂停或终止服务，情节严重的将保留追究法律责任的权利。' ] },
        { h: 'SLA 与费用', items: [
          '付费版本承诺月度可用性 99.9%；未达标按未达标时长比例赔付服务时长。',
          '按套餐周期计费；自购买 7 天内未实质使用可申请全额退款。' ] },
        { h: '责任限制', items: [
          '我们的赔偿上限为你过去 12 个月实际支付的服务费用总额。',
          '因不可抗力（自然灾害、政策变化、大规模网络故障）导致的服务中断免责。' ] }
      ]
    },
    cookies: {
      title: 'Cookie 政策',
      updated: '最后更新：2026 年 8 月 15 日',
      lead: '我们用四类 Cookie 让网站正常运转；你随时可以管理它们。',
      sections: [
        { h: '必要 Cookie（不可关闭）', items: [
          '登录态维持、安全校验、负载均衡；禁用将无法正常使用服务。' ] },
        { h: '偏好 Cookie', items: [
          '记住你的语言、主题、时区等设置，下次访问自动生效。' ] },
        { h: '统计 Cookie', items: [
          '匿名化的页面访问与功能使用统计，帮助我们发现体验问题。',
          '可在浏览器设置或站内偏好开关中关闭，不影响核心功能。' ] },
        { h: '第三方 Cookie', items: [
          '支付与统计服务商可能写入其自有 Cookie，受其各自隐私政策约束。',
          '我们仅接入通过安全评审的服务商，并定期复核其合规状态。' ] },
        { h: '如何管理', items: [
          '浏览器设置中可随时查看、清除或禁用 Cookie。',
          '站内「账号设置 → 隐私偏好」提供一键开关（必要 Cookie 除外）。' ] }
      ]
    }
  };

  /* 页脚公司信息 / 备案 / 状态行：全部走 SITE 渲染 */
  (function renderFooter() {
    var info = $('#siteInfo');
    if (info) {
      info.innerHTML = SITE.address +
        ' · <a href="mailto:' + SITE.email + '">' + SITE.email + '</a>' +
        ' · <a href="tel:' + SITE.phone.replace(/\s/g, '') + '">' + SITE.phone + '</a>';
    }
    var cp = $('#copyrightLine');
    if (cp) cp.textContent = '© 2026 ' + SITE.name + ' · ' + SITE.icp + ' · 保留所有权利。';
    var st = $('#statusText');
    if (st) st.textContent = SITE.statusText;
  })();

  /* ---------- 0b. 法务弹窗：X / 遮罩 / ESC 关闭，打开锁滚动 ---------- */
  var overlay = $('#legalOverlay');
  var legalTitle = $('#legalTitle');
  var legalBody = $('#legalBody');
  var lastFocused = null;

  function escHtml(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function renderLegal(key) {
    var doc = LEGAL[key];
    legalTitle.textContent = doc.title;
    var html = '<p class="legal-updated">' + escHtml(doc.updated) + '</p>' +
      '<p class="lead">' + escHtml(doc.lead) + '</p>';
    doc.sections.forEach(function (sec) {
      html += '<h4>' + escHtml(sec.h) + '</h4><ul>';
      sec.items.forEach(function (it) { html += '<li>' + escHtml(it) + '</li>'; });
      html += '</ul>';
    });
    legalBody.innerHTML = html;
    legalBody.scrollTop = 0;
  }
  function openLegal(key) {
    if (!LEGAL[key]) return;
    lastFocused = document.activeElement;
    renderLegal(key);
    overlay.hidden = false;
    /* 强制 reflow 让 transition 生效 */
    void overlay.offsetWidth;
    overlay.classList.add('open');
    document.body.classList.add('modal-open');
    $('#legalClose').focus();
  }
  function closeLegal() {
    if (overlay.hidden) return;
    overlay.classList.remove('open');
    document.body.classList.remove('modal-open');
    setTimeout(function () { overlay.hidden = true; }, 300);
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }
  $$('[data-legal]').forEach(function (btn) {
    btn.addEventListener('click', function () { openLegal(btn.getAttribute('data-legal')); });
  });
  $('#legalClose').addEventListener('click', closeLegal);
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closeLegal(); /* 只点遮罩本身才关 */
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !overlay.hidden) closeLegal();
  });

  // 只有 JS 跑起来才标记 html.js，隐藏样式全部限定在该类下（无 JS 也全可见）
  document.documentElement.classList.add('js');

  /* ---------- 1. 入场揭示：完成态一定可达 ---------- */
  function revealAll() {
    $$('[data-intro]').forEach(function (el) { el.classList.add('is-in'); });
  }
  try {
    if (window.gsap) {
      gsap.to('[data-intro]', {
        opacity: 1, y: 0, duration: 0.85, ease: 'expo.out',
        stagger: { each: 0.06, from: 'start' },
        clearProps: 'transform', /* 播完清行内 transform，hover 上浮不被覆盖 */
        onStart: function () { /* 先给第一批加类，保证渐进增强兜底 */ },
        onComplete: revealAll
      });
    } else {
      revealAll();
    }
  } catch (e) { revealAll(); }
  /* 兜底：2.5s 后强制全部可见，防止任何异常导致永久隐藏 */
  setTimeout(revealAll, 2500);

  /* ---------- 2. 导航滚动加底边线 ---------- */
  var nav = $('#topnav');
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      nav.classList.toggle('scrolled', window.scrollY > 8);
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- 3. 搜索框：聚焦展开 + 输入真实过滤 ---------- */
  var searchBox = $('#searchBox');
  var searchInput = $('#searchInput');
  var articleList = $('#articleList');
  var articles = $$('.article', articleList);
  var noResult = $('#noResult');
  var filterBar = $('#filterBar');
  var filterText = $('#filterText');
  var activeCat = ''; // 分类卡带来的过滤

  searchInput.addEventListener('focus', function () { searchBox.classList.add('focused'); });
  searchInput.addEventListener('blur', function () { searchBox.classList.remove('focused'); });
  // "/" 快捷键聚焦
  document.addEventListener('keydown', function (e) {
    if (e.key === '/' && document.activeElement !== searchInput &&
        !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) {
      e.preventDefault();
      searchInput.focus();
    }
  });

  function haystack(el) {
    return ($('.article-title', el).textContent + ' ' +
            el.getAttribute('data-cat') + ' ' +
            (el.getAttribute('data-keywords') || '')).toLowerCase();
  }

  function applyFilter() {
    var q = searchInput.value.trim().toLowerCase();
    var shown = 0;
    articles.forEach(function (el) {
      var okQ = !q || haystack(el).indexOf(q) !== -1;
      var okC = !activeCat || el.getAttribute('data-cat') === activeCat;
      var show = okQ && okC;
      el.classList.toggle('hidden', !show);
      if (show) shown++;
    });
    noResult.hidden = shown !== 0;
    articleList.hidden = shown === 0;
    if (activeCat || q) {
      filterBar.hidden = false;
      var parts = [];
      if (activeCat) parts.push('分类「' + activeCat + '」');
      if (q) parts.push('关键词「' + searchInput.value.trim() + '」');
      filterText.innerHTML = '找到 <strong>' + shown + '</strong> 篇 · ' + parts.join(' + ');
    } else {
      filterBar.hidden = true;
    }
    // 过滤后轻微回弹，物理感
    try {
      if (window.gsap && shown > 0) {
        gsap.fromTo('.article:not(.hidden)', { y: 8, opacity: 0.4 },
          { y: 0, opacity: 1, duration: 0.4, ease: 'back.out(1.6)', stagger: 0.04, overwrite: 'auto' });
      }
    } catch (e) {}
  }

  var debounce = null;
  searchInput.addEventListener('input', function () {
    clearTimeout(debounce);
    debounce = setTimeout(applyFilter, 120);
  });

  function clearAll() {
    searchInput.value = '';
    activeCat = '';
    $$('.cat-card').forEach(function (c) { c.classList.remove('active'); });
    applyFilter();
  }
  $('#filterClear').addEventListener('click', clearAll);
  $('#noResultClear').addEventListener('click', function () {
    clearAll();
    searchInput.focus();
  });

  /* ---------- 4. 热门搜索 chips ---------- */
  $$('.chip').forEach(function (chip) {
    chip.addEventListener('click', function () {
      activeCat = '';
      searchInput.value = chip.getAttribute('data-q');
      applyFilter();
      document.getElementById('articles').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  /* ---------- 5. 分类卡：跳锚点 + 按分类过滤 ---------- */
  $$('.cat-card').forEach(function (card) {
    card.addEventListener('click', function () {
      var cat = card.getAttribute('data-cat');
      $$('.cat-card').forEach(function (c) { c.classList.remove('active'); });
      card.classList.add('active');
      activeCat = cat;
      searchInput.value = '';
      applyFilter();
      document.getElementById('articles').scrollIntoView({ behavior: 'smooth', block: 'start' });
      // 卡片点击回弹
      try {
        if (window.gsap) gsap.fromTo(card, { scale: 0.96 }, { scale: 1, duration: 0.45, ease: 'back.out(2.2)' });
      } catch (e) {}
    });
  });

  /* ---------- 6. 导航"更新日志"直达对应分类 ---------- */
  var changelog = $('[data-nav-changelog]');
  if (changelog) {
    changelog.addEventListener('click', function () {
      var target = $$('.cat-card').filter(function (c) {
        return c.getAttribute('data-cat') === '更新日志';
      })[0];
      if (target) { target.click(); }
    });
  }

  /* ---------- 7. 导航搜索按钮：滚到 hero 并聚焦 ---------- */
  $('#navSearchBtn').addEventListener('click', function () {
    document.getElementById('top').scrollIntoView({ behavior: 'smooth' });
    setTimeout(function () { searchInput.focus(); }, 450);
  });

  /* ---------- 8. 移动端汉堡菜单 ---------- */
  var burger = $('#burger');
  var mobileMenu = $('#mobileMenu');
  burger.addEventListener('click', function () {
    var open = mobileMenu.classList.toggle('open');
    burger.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  $$('#mobileMenu a').forEach(function (a) {
    a.addEventListener('click', function () {
      mobileMenu.classList.remove('open');
      burger.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
    });
  });

})();

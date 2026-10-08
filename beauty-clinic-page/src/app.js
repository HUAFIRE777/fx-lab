/* 昕妍医疗美容 · beauty-clinic-page 交互脚本（vanilla，无外部依赖） */
(function () {
  'use strict';

  /* ============ SITE 配置：买家改这里，一改全改 ============
     brand   机构名称（页脚版权行）
     phone   咨询电话（导航 / 抽屉 / 页脚三处自动同步，tel: 链接自动生成）
     address 机构地址（页脚）
     hours   营业时间（页脚）
     icp     ICP 备案号（页脚版权行，无备案请留空则隐藏该段） */
  var SITE = {
    brand: '昕妍医疗美容',
    phone: '400-888-1314',
    address: '上海市静安区南京西路 1266 号 3 层',
    hours: '9:30–20:00（周末不休）',
    icp: '沪ICP备00000000号-1'
  };

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 页脚 / 导航 SITE 变量渲染 ---------- */
  function renderSite() {
    var tel = 'tel:' + SITE.phone.replace(/[^+\d]/g, '');
    document.querySelectorAll('[data-site="phone"]').forEach(function (el) {
      el.textContent = SITE.phone;
      if (el.tagName === 'A') el.setAttribute('href', tel);
    });
    document.querySelectorAll('[data-site="address"]').forEach(function (el) { el.textContent = SITE.address; });
    document.querySelectorAll('[data-site="hours"]').forEach(function (el) { el.textContent = SITE.hours; });
    document.querySelectorAll('[data-site="brand"]').forEach(function (el) { el.textContent = SITE.brand; });
    document.querySelectorAll('[data-site="icp"]').forEach(function (el) {
      if (SITE.icp) { el.textContent = SITE.icp; }
      else { el.textContent = ''; }
    });
  }

  /* ---------- 加载态 ---------- */
  function hideLoader() {
    var loader = document.getElementById('loader');
    if (loader) loader.classList.add('done');
  }
  window.addEventListener('load', function () { setTimeout(hideLoader, 350); });
  setTimeout(hideLoader, 4000); /* 兜底：load 迟迟不触发也不许一直盖着 */

  /* ---------- 导航滚动态 + 悬浮 CTA ---------- */
  var nav = document.getElementById('nav');
  var floatCta = document.getElementById('floatCta');
  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    nav.classList.toggle('scrolled', y > 40);
    floatCta.classList.toggle('show', y > window.innerHeight * 0.9);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- 移动端抽屉 ---------- */
  var burger = document.getElementById('burger');
  var drawer = document.getElementById('drawer');
  var veil = document.getElementById('drawerVeil');
  function setDrawer(open) {
    burger.classList.toggle('open', open);
    drawer.classList.toggle('open', open);
    veil.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.style.overflow = open ? 'hidden' : '';
  }
  burger.addEventListener('click', function () { setDrawer(!drawer.classList.contains('open')); });
  veil.addEventListener('click', function () { setDrawer(false); });
  drawer.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { setDrawer(false); }); });

  /* ---------- 滚动显现：完成态必须可达 ----------
     ① IntersectionObserver 主触发；② 无 IO 或偏好减弱动效时直接全显；
     ③ 看门狗每 1.5s 补救"已进入视口却漏判"的元素（不提前暴露首屏下内容，
        滚动触发的 stagger 动画不受影响） */
  var revealEls = document.querySelectorAll('.reveal');
  function revealInView() {
    var vh = window.innerHeight || 800;
    revealEls.forEach(function (el) {
      if (el.classList.contains('is-in')) return;
      var r = el.getBoundingClientRect();
      if (r.top < vh * 0.94 && r.bottom > 0) el.classList.add('is-in');
    });
  }
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
    setInterval(revealInView, 1500);
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- 项目分类 Tab ---------- */
  var tabs = document.querySelectorAll('.tab');
  var panels = document.querySelectorAll('.tab-panels .panel');
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (t) { t.classList.remove('is-on'); t.setAttribute('aria-selected', 'false'); });
      tab.classList.add('is-on');
      tab.setAttribute('aria-selected', 'true');
      var key = tab.getAttribute('data-tab');
      panels.forEach(function (p) {
        var on = p.getAttribute('data-panel') === key;
        p.classList.toggle('is-on', on);
        if (on) { p.removeAttribute('hidden'); }
        else { p.setAttribute('hidden', ''); }
        /* 切换后面板内卡片重新触发显现 */
        p.querySelectorAll('.reveal').forEach(function (el) {
          el.classList.remove('is-in');
          void el.offsetWidth;
          requestAnimationFrame(function () { el.classList.add('is-in'); });
        });
      });
    });
  });

  /* ---------- 项目卡 3D 倾斜（鼠标视差微交互） ---------- */
  if (!reduceMotion && window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.pcard').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = 'perspective(900px) rotateX(' + (-y * 7).toFixed(2) + 'deg) rotateY(' + (x * 9).toFixed(2) + 'deg) translateY(-8px)';
      });
      card.addEventListener('mouseleave', function () { card.style.transform = ''; });
    });
  }

  /* ---------- 案例对比滑块：range 驱动 CSS 变量 --pos ---------- */
  var ba = document.getElementById('baSlider');
  var range = document.getElementById('baRange');
  if (ba && range) {
    range.addEventListener('input', function () {
      ba.style.setProperty('--pos', range.value + '%');
    });
    /* 键盘可达：range 原生支持方向键，无需额外处理 */
  }

  /* ---------- 咨询表单：校验 + 成功态 ---------- */
  var form = document.getElementById('consultForm');
  var err = document.getElementById('formErr');
  var success = document.getElementById('consultSuccess');
  var successMsg = document.getElementById('successMsg');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.name.value.trim();
      var phone = form.phone.value.trim();
      var intent = form.intent.value;
      if (!name) { err.textContent = '请留下你的称呼，方便我们联系你。'; form.name.focus(); return; }
      if (!/^1[3-9]\d{9}$/.test(phone)) { err.textContent = '手机号码好像不对，请检查 11 位数字。'; form.phone.focus(); return; }
      if (!intent) { err.textContent = '选一个最想了解的项目，我们好安排对口的顾问。'; form.intent.focus(); return; }
      err.textContent = '';
      /* 演示模板：提交仅本地模拟成功态，不发送任何网络请求 */
      successMsg.textContent = name + '，已收到你的' + '「' + intent + '」' + '咨询意向，顾问将在 24 小时内致电 ' + phone + '，请留意。';
      form.style.display = 'none';
      success.removeAttribute('hidden');
      success.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
    });
    document.getElementById('againBtn').addEventListener('click', function () {
      form.reset();
      form.style.display = '';
      success.setAttribute('hidden', '');
    });
  }

  /* ---------- 法务弹窗：隐私 / 条款 / Cookie ---------- */
  var LEGAL = {
    privacy: {
      title: '隐私政策',
      body: '<h5>我们收集什么</h5><p>仅在你主动填写咨询表单时，收集姓名、电话与意向项目，用于本次咨询联系。除此之外，本页面不收集、不存储你的任何个人信息。</p><h5>信息怎么用</h5><p>你的联系方式仅用于咨询顾问与你取得联系、安排面诊，不会用于其他营销推送，也不会出售、出租给任何第三方。</p><h5>你的权利</h5><p>你可以随时要求我们删除你的联系信息，联系电话见页脚，我们会在 3 个工作日内处理完毕。</p><h5>未成年人</h5><p>未满 18 周岁请在监护人陪同下咨询；医疗美容项目原则上不面向未成年人开展。</p>'
    },
    terms: {
      title: '服务条款',
      body: '<h5>咨询性质</h5><p>本页面的在线咨询为免费售前沟通，不构成诊疗建议。是否适合开展某个项目，以到院面诊后医师的判断为准。</p><h5>价格说明</h5><p>页面标注的"¥起"为单项参考价；标注"面诊定价"的项目需面诊后按方案报价。最终以下单时确认的价格为准，不存在隐形消费。</p><h5>预约与改期</h5><p>面诊预约如需改期，请至少提前 4 小时告知，顾问会为你重新安排，无需任何费用。</p><h5>效果说明</h5><p>医疗美容效果因个人体质、术后护理差异而不同，页面案例与数据仅供参考，不作为效果承诺。</p>'
    },
    cookie: {
      title: 'Cookie 说明',
      body: '<h5>我们用什么 Cookie</h5><p>本页面仅使用维持页面正常运行所必需的技术型 Cookie（如记住你的表单填写进度），不做用户画像，不做跨站追踪。</p><h5>第三方</h5><p>本页面不接入任何第三方统计或广告 SDK，你的浏览行为不会被同步给外部公司。</p><h5>怎么管理</h5><p>你可以在浏览器设置中随时清除或禁用 Cookie，禁用后页面核心功能不受影响。</p>'
    }
  };
  var legalVeil = document.getElementById('legalVeil');
  var legalModal = document.getElementById('legalModal');
  var legalTitle = document.getElementById('legalTitle');
  var legalBody = document.getElementById('legalBody');
  var legalClose = document.getElementById('legalClose');
  var lastFocus = null;
  function openLegal(key) {
    var doc = LEGAL[key];
    if (!doc) return;
    lastFocus = document.activeElement;
    legalTitle.textContent = doc.title;
    legalBody.innerHTML = doc.body;
    legalVeil.removeAttribute('hidden');
    legalModal.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
    legalClose.focus();
  }
  function closeLegal() {
    legalVeil.setAttribute('hidden', '');
    legalModal.setAttribute('hidden', '');
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  document.querySelectorAll('[data-legal]').forEach(function (el) {
    el.addEventListener('click', function (e) { e.preventDefault(); openLegal(el.getAttribute('data-legal')); });
  });
  legalClose.addEventListener('click', closeLegal);
  legalVeil.addEventListener('click', closeLegal);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !legalModal.hasAttribute('hidden')) closeLegal();
  });

  renderSite();
})();

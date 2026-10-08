/* 驰运 SWIFTLINE · 物流落地页模板交互（classic script，零第三方依赖）
   包含：SITE 配置 / 加载态 / 导航 / 抽屉 / reveal / 计数器 / 路线动画 / 运单查询演示 / 网点查询演示 / 法务弹窗 */

(function () {
  'use strict';

  /* ============ SITE 配置变量：一改全改 ============ */
  var SITE = {
    name: '驰运速运有限公司',
    phone: '95011',
    email: 'service@swiftline.cn',
    address: '上海市青浦区华新镇华志路 1688 号',
    icp: '沪ICP备xxxxxx号'
  };

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  /* ============ SITE 渲染 ============ */
  $$('[data-site]').forEach(function (el) {
    var key = el.getAttribute('data-site');
    if (!(key in SITE)) return;
    var val = SITE[key];
    el.textContent = val;
    var tag = el.tagName.toLowerCase();
    if (tag === 'a') {
      if (key === 'phone') el.setAttribute('href', 'tel:' + val);
      else if (key === 'email') el.setAttribute('href', 'mailto:' + val);
    }
  });

  /* ============ 加载态 ============ */
  var loader = $('#loader');
  function hideLoader() { if (loader) loader.classList.add('done'); }
  window.addEventListener('load', function () { setTimeout(hideLoader, 500); });
  setTimeout(hideLoader, 3500); /* 3.5s 兜底：load 卡住也不挡页面 */

  /* ============ 导航毛玻璃 ============ */
  var nav = $('#nav');
  function onScroll() { nav.classList.toggle('scrolled', window.scrollY > 24); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ============ 抽屉 ============ */
  var burger = $('#burger'), drawer = $('#drawer'), veil = $('#drawerVeil');
  function openDrawer() {
    drawer.classList.add('open'); veil.classList.add('open');
    burger.setAttribute('aria-expanded', 'true'); veil.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function closeDrawer() {
    drawer.classList.remove('open'); veil.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false'); veil.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
  burger.addEventListener('click', function () {
    drawer.classList.contains('open') ? closeDrawer() : openDrawer();
  });
  veil.addEventListener('click', closeDrawer);
  $$('#drawer a').forEach(function (a) { a.addEventListener('click', closeDrawer); });

  /* ============ reveal 入场（stagger） ============ */
  var revealEls = $$('.reveal');
  revealEls.forEach(function (el) {
    var d = parseInt(el.getAttribute('data-d') || '0', 10);
    el.dataset.delay = Math.min(d, 8) * 90;
  });
  function showReveal(el) {
    el.style.transitionDelay = (el.dataset.delay || 0) + 'ms';
    el.classList.add('in');
  }
  if (reducedMotion) {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  } else if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { showReveal(e.target); io.unobserve(e.target); }
      });
    }, { threshold: 0.16 });
    revealEls.forEach(function (el) { io.observe(el); });
    setTimeout(function () { revealEls.forEach(function (el) { if (!el.classList.contains('in')) showReveal(el); }); }, 4000);
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ============ 数字滚动计数器 ============ */
  function fmt(val, decimals) {
    var s = val.toFixed(decimals);
    if (decimals === 0 && val >= 10000) {
      s = Math.round(val).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
    return s;
  }
  function runCounter(el) {
    if (el.dataset.done) return;
    el.dataset.done = '1';
    var target = parseFloat(el.getAttribute('data-count'));
    var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
    if (reducedMotion) { el.textContent = fmt(target, decimals); return; }
    var dur = 1600, t0 = null;
    function easeOutQuart(t) { return 1 - Math.pow(1 - t, 4); }
    function frame(t) {
      if (t0 === null) t0 = t;
      var p = Math.min((t - t0) / dur, 1);
      el.textContent = fmt(target * easeOutQuart(p), decimals);
      if (p < 1) requestAnimationFrame(frame);
      else el.textContent = fmt(target, decimals); /* 强制对齐终值 */
    }
    requestAnimationFrame(frame);
  }
  var counters = $$('.counter');
  if ('IntersectionObserver' in window && !reducedMotion) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { runCounter(e.target); cio.unobserve(e.target); } });
    }, { threshold: 0.4 });
    counters.forEach(function (el) { cio.observe(el); });
  } else {
    counters.forEach(runCounter);
  }
  setTimeout(function () { /* 6s 安全网兜底 */
    counters.forEach(function (el) {
      if (!el.dataset.done) runCounter(el);
    });
  }, 6000);

  /* ============ SVG 路线动画：包裹沿路径匀速→物理感往返 ============ */
  var dash = $('#routeDash'), parcel = $('#parcelDot');
  if (dash && parcel && !reducedMotion) {
    var pathLen = dash.getTotalLength();
    parcel.style.transformBox = 'fill-box';
    var DUR = 7000, start = null, hidden = false;
    function easeInOutSine(t) { return -(Math.cos(Math.PI * t) - 1) / 2; }
    function tick(t) {
      if (hidden) { requestAnimationFrame(tick); return; }
      if (start === null) start = t;
      var p = ((t - start) % DUR) / DUR;
      var pt = dash.getPointAtLength(pathLen * easeInOutSine(p));
      parcel.setAttribute('transform', 'translate(' + pt.x + ',' + pt.y + ')');
      requestAnimationFrame(tick);
    }
    document.addEventListener('visibilitychange', function () { hidden = document.hidden; start = null; });
    requestAnimationFrame(tick);
  } else if (dash && parcel) {
    var mid = dash.getPointAtLength(dash.getTotalLength() / 2); /* 降级：静置中点 */
    parcel.setAttribute('transform', 'translate(' + mid.x + ',' + mid.y + ')');
  }

  /* ============ 运单查询演示（核心动效） ============ */
  var trackInput = $('#trackInput'), trackBtn = $('#trackBtn'),
      trackResult = $('#trackResult'), trNo = $('#trNo'),
      trBar = $('#trBar'), trTimeline = $('#trTimeline'),
      tracking = false;

  function cleanNo(s) { return s.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 18); }

  function doTrack() {
    if (tracking) return;
    var no = cleanNo(trackInput.value);
    if (!no) {
      trackInput.focus();
      trackInput.style.borderColor = '#F56600';
      setTimeout(function () { trackInput.style.borderColor = ''; }, 1200);
      return;
    }
    tracking = true;
    trackBtn.disabled = true;
    trNo.textContent = no;
    var items = $$('li', trTimeline);
    items.forEach(function (li) { li.classList.remove('lit'); });
    trBar.style.width = '0';
    trackResult.classList.add('show');
    trackResult.setAttribute('aria-hidden', 'false');
    trackResult.classList.add('loading');
    setTimeout(function () {
      trackResult.classList.remove('loading');
      trBar.style.width = '80%'; /* 4/5 节点完成 */
      items.forEach(function (li, i) {
        setTimeout(function () { li.classList.add('lit'); }, i * 220);
      });
      setTimeout(function () {
        tracking = false;
        trackBtn.disabled = false;
      }, items.length * 220 + 300);
    }, 900);
  }
  trackBtn.addEventListener('click', doTrack);
  trackInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') doTrack(); });

  /* ============ 网点查询演示 ============ */
  var outletInput = $('#outletInput'), outletBtn = $('#outletBtn'), outletList = $('#outletList');
  var OUTLET_SUFFIX = ['福田营业部', '南山科技园自寄点', '宝安机场营业部'];

  function renderOutlets(city) {
    outletList.innerHTML = '';
    city = (city || '').trim().slice(0, 12);
    if (!city) {
      outletList.innerHTML = '<p class="outlet-empty lit">先输入城市名，再点「查找网点」。</p>';
      return;
    }
    var frag = document.createDocumentFragment();
    OUTLET_SUFFIX.forEach(function (suffix, i) {
      var card = document.createElement('article');
      card.className = 'outlet-card';
      var h3 = document.createElement('h3');
      h3.textContent = '驰运 ' + city + suffix;
      var p = document.createElement('p');
      var addr = document.createElement('span');
      addr.textContent = '地址：' + city + '市' + ['中心区大道 88 号', '创业路 12 号 A 栋 1 楼', '空港一路 3 号货运区'][i] + ' · 营业时间 8:30–20:00';
      var br = document.createElement('br');
      var tel = document.createElement('span');
      tel.className = 'ot-tel';
      tel.textContent = '电话：95011 转 ' + (1200 + i * 37);
      p.appendChild(addr); p.appendChild(br); p.appendChild(tel);
      var pin = document.createElement('div');
      pin.className = 'outlet-pin';
      pin.setAttribute('aria-hidden', 'true');
      pin.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M12 21s-7-5.5-7-11a7 7 0 0114 0c0 5.5-7 11-7 11z" fill="none" stroke="#F56600" stroke-width="2"/><circle cx="12" cy="10" r="2.6" fill="#F56600"/></svg>';
      card.appendChild(pin);
      var body = document.createElement('div');
      body.appendChild(h3); body.appendChild(p);
      card.appendChild(body);
      frag.appendChild(card);
      setTimeout(function () { card.classList.add('lit'); }, i * 140);
    });
    outletList.appendChild(frag);
  }
  outletBtn.addEventListener('click', function () { renderOutlets(outletInput.value); });
  outletInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') renderOutlets(outletInput.value); });
  renderOutlets(outletInput.value); /* 首屏即有一组演示网点 */

  /* ============ 法务三件套弹窗 ============ */
  var MODAL_DOCS = {
    privacy: {
      title: '隐私政策',
      updated: '最近更新：2026 年 9 月 1 日',
      points: [
        '我们收集的信息：寄件人、收件人姓名、电话、地址等实名寄递信息，以及运单轨迹、支付记录与客服沟通记录，仅用于完成寄递服务。',
        '信息用途：订单履约、时效监控、异常件处理、风险防控与客户服务。我们不会将您的个人信息出售给任何第三方。',
        '共享范围：仅在履约必要时共享给末端派送合作方（如偏远地区加盟网点），且要求对方遵守同等保密义务；法律法规要求报送的除外。',
        '保存期限：运单信息按《快递暂行条例》要求保存不少于 3 年；到期后匿名化处理，不再关联到您个人。',
        '您的权利：您有权查阅、更正、删除您的个人信息，拨打 95011 或发送邮件至 service@swiftline.cn 即可申请，我们在 15 个工作日内响应。',
        '未成年人：我们不主动收集 14 周岁以下未成年人信息；如您为监护人并发现相关信息，请联系我们删除。'
      ]
    },
    terms: {
      title: '服务条款',
      updated: '最近更新：2026 年 8 月 15 日',
      points: [
        '禁限寄物品：易燃易爆、管制刀具、活体动物、贵重文物等法律法规禁止寄递的物品一律不收；液体、粉末类需经网点验视后方可收寄。',
        '保价与赔偿：贵重物品请保价，保价费率为声明价值的 0.5%；保价快件丢失或全损按声明价值赔偿，未保价按实际损失赔偿、最高不超过 7 倍运费。',
        '签收规则：默认本人签收；经寄件人同意可由代收点或他人代收，代收视为妥投。签收后 24 小时内发现内件短少请立即联系 95011。',
        '时效承诺与免责：承诺时效以运单标注为准；因台风、暴雨、交通管制等不可抗力导致的延误不计入承诺时效，但我们会主动推送异常通知。',
        '费用与支付：运费以官网公示价格为准，到付件收件人拒付时由寄件人承担；价格调整提前 7 天在官网公示。',
        '争议解决：因服务产生争议先协商，协商不成可向被告住所地人民法院提起诉讼；投诉请拨 95011，我们承诺 24 小时内给出处理结论。'
      ]
    },
    cookie: {
      title: 'Cookie 政策',
      updated: '最近更新：2026 年 7 月 20 日',
      points: [
        '必要型 Cookie：维持登录状态、记住运单查询记录、保障页面安全，关闭后部分功能无法正常使用。',
        '偏好型 Cookie：记住您选择的城市、语言与页面偏好，下次访问自动生效，可随时在浏览器中清除。',
        '统计型 Cookie：匿名统计页面访问量与功能使用情况，帮助我们优化查件体验，不关联您的个人身份。',
        '我们不使用广告追踪 Cookie：本模板演示站不投放第三方广告，不存在跨站广告追踪器。',
        '如何管理：您可在浏览器设置中拒绝或删除 Cookie；拒绝必要型 Cookie 可能导致运单查询记录无法保存。',
        '政策更新：Cookie 使用范围如有变化，我们会在本页面更新并标注日期，重大变化会以弹窗形式提示。'
      ]
    }
  };

  var modal = $('#modal'), modalVeil = $('#modalVeil'),
      modalTitle = $('#modalTitle'), modalUpdated = $('#modalUpdated'),
      modalPoints = $('#modalPoints'), modalX = $('#modalX'),
      lastFocus = null;

  function openModal(key) {
    var doc = MODAL_DOCS[key];
    if (!doc) return;
    lastFocus = document.activeElement;
    modalTitle.textContent = doc.title;
    modalUpdated.textContent = doc.updated;
    modalPoints.innerHTML = '';
    doc.points.forEach(function (t) {
      var li = document.createElement('li');
      li.textContent = t;
      modalPoints.appendChild(li);
    });
    modal.classList.add('open'); modalVeil.classList.add('open');
    modal.setAttribute('aria-hidden', 'false'); modalVeil.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    modalX.focus();
  }
  function closeModal() {
    modal.classList.remove('open'); modalVeil.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true'); modalVeil.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  $$('[data-modal]').forEach(function (btn) {
    btn.addEventListener('click', function () { openModal(btn.getAttribute('data-modal')); });
  });
  modalX.addEventListener('click', closeModal);
  modalVeil.addEventListener('click', closeModal);
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (modal.classList.contains('open')) closeModal();       /* 弹窗优先于抽屉 */
    else if (drawer.classList.contains('open')) closeDrawer();
  });

})();

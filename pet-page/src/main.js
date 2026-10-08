/* ============================================================
   爪印 PAW · 交互与渲染（classic script，无依赖，打包直接内联）
   ============================================================ */
(function () {
  'use strict';

  /* ---------- 配置 ---------- */
  var SITE = {
    brand: '爪印 PAW',
    organizer: '爪印宠物用品有限公司',
    address: '上海市杨浦区国定路 333 号 1 幢 2 层',
    email: 'hello@pawpet.example',
    phone: '400-820-3322',
    icp: '沪ICP备2026000000号-1（示例）'
  };
  var CONFIG = {
    heroStagger: 0.14,     // hero 逐行间隔（秒）
    revealThreshold: 0.12, // reveal 触发阈值
    toastMs: 2600,         // toast 停留时长
    cardFakeLoadMs: 700    // 商品图模拟加载时长
  };

  /* ---------- 商品数据（换商品只改这里） ---------- */
  var PRODUCTS = [
    { id: 'p1', cat: 'dog',  kind: 'bag',    name: '本味成犬粮 鸡肉燕麦 10kg', desc: '鲜鸡肉打底，粗蛋白 ≥28%，便便不臭', price: '¥329', old: '¥389', tag: '热卖' },
    { id: 'p2', cat: 'cat',  kind: 'bag',    name: '深海三文鱼幼猫粮 1.5kg', desc: 'DHA 助力脑部发育，颗粒小好嚼', price: '¥128', old: '¥158', tag: '新品' },
    { id: 'p3', cat: 'snack',kind: 'pouch',  name: '冻干鸡肉粒 230g', desc: '纯鸡胸肉冻干，训练奖励一口一块', price: '¥59.9', old: '¥79', tag: '热卖' },
    { id: 'p4', cat: 'snack',kind: 'bone',   name: '耐咬橡胶骨头', desc: '食品级橡胶，拆家精力的出口', price: '¥39.9', old: '', tag: '' },
    { id: 'p5', cat: 'snack',kind: 'wand',   name: '猫薄荷逗猫棒三件套', desc: '可替换头设计，一根顶三根', price: '¥29.9', old: '¥45', tag: '特价' },
    { id: 'p6', cat: 'care', kind: 'pump',   name: '燕麦舒缓沐浴露 500ml', desc: '弱酸性配方，敏感肌也能洗', price: '¥69', old: '¥89', tag: '' },
    { id: 'p7', cat: 'care', kind: 'box',    name: '益生菌调理粉 30 条', desc: '换季软便、吃撑积食，冲水即服', price: '¥89', old: '', tag: '兽医推荐', dark: true },
    { id: 'p8', cat: 'snack',kind: 'sticks', name: '磨牙洁齿棒 28 支装', desc: '每天一根，口臭拜拜', price: '¥45', old: '¥58', tag: '' }
  ];

  /* ---------- 程序化商品图（SVG，零外部图床） ---------- */
  function productSVG(p) {
    var label = p.name.slice(0, 6);
    var band = '<rect x="60" y="120" width="180" height="52" fill="#F4842B"/>' +
      '<text x="150" y="153" text-anchor="middle" font-size="20" font-weight="800" fill="#fff" font-family="PingFang SC,Microsoft YaHei,sans-serif">' + label + '</text>';
    var inner = '';
    if (p.kind === 'bag') {
      inner = '<path d="M85 60 h130 l14 190 a12 12 0 0 1 -12 12 h-134 a12 12 0 0 1 -12 -12 z" fill="#FFF8F0" stroke="#3E2F25" stroke-width="6"/>' +
        '<path d="M85 60 h130 l4 34 h-138 z" fill="#3E2F25"/>' + band +
        '<circle cx="150" cy="215" r="26" fill="#3E2F25" opacity=".08"/>' +
        '<ellipse cx="150" cy="215" rx="14" ry="11" fill="#F4842B"/>' +
        '<circle cx="138" cy="202" r="6.5" fill="#F4842B"/><circle cx="150" cy="197" r="6.5" fill="#F4842B"/><circle cx="162" cy="202" r="6.5" fill="#F4842B"/>';
    } else if (p.kind === 'pouch') {
      inner = '<path d="M95 80 h110 l10 160 a10 10 0 0 1 -10 10 h-110 a10 10 0 0 1 -10 -10 z" fill="#FFF8F0" stroke="#3E2F25" stroke-width="6"/>' +
        '<rect x="95" y="80" width="110" height="26" fill="#3E2F25"/>' +
        '<rect x="60" y="140" width="180" height="48" fill="#F4842B"/>' +
        '<text x="150" y="171" text-anchor="middle" font-size="19" font-weight="800" fill="#fff" font-family="PingFang SC,Microsoft YaHei,sans-serif">' + label + '</text>' +
        '<circle cx="150" cy="225" r="16" fill="#C98B5E"/><circle cx="140" cy="222" r="5" fill="#A96F45"/><circle cx="160" cy="228" r="5" fill="#A96F45"/>';
    } else if (p.kind === 'bone') {
      inner = '<g transform="rotate(-18 150 150)" fill="#F4842B">' +
        '<rect x="70" y="132" width="160" height="36" rx="18"/>' +
        '<circle cx="70" cy="132" r="24"/><circle cx="70" cy="168" r="24"/>' +
        '<circle cx="230" cy="132" r="24"/><circle cx="230" cy="168" r="24"/></g>' +
        '<circle cx="150" cy="150" r="46" fill="#3E2F25" opacity=".06"/>';
    } else if (p.kind === 'wand') {
      inner = '<rect x="142" y="40" width="16" height="150" rx="8" fill="#3E2F25"/>' +
        '<path d="M150 190 q60 10 70 70" stroke="#3E2F25" stroke-width="6" fill="none" stroke-linecap="round"/>' +
        '<g fill="#F4842B"><circle cx="222" cy="262" r="16"/><path d="M222 278 l-10 22 10 -8 10 8 z"/>' +
        '<circle cx="120" cy="60" r="7"/><circle cx="182" cy="52" r="7"/><circle cx="205" cy="120" r="7"/></g>';
    } else if (p.kind === 'pump') {
      inner = '<rect x="105" y="120" width="90" height="140" rx="14" fill="#FFF8F0" stroke="#3E2F25" stroke-width="6"/>' +
        '<rect x="135" y="78" width="30" height="44" fill="#3E2F25"/>' +
        '<rect x="135" y="66" width="58" height="16" rx="8" fill="#3E2F25"/>' +
        '<rect x="105" y="160" width="90" height="52" fill="#F4842B"/>' +
        '<text x="150" y="193" text-anchor="middle" font-size="18" font-weight="800" fill="#fff" font-family="PingFang SC,Microsoft YaHei,sans-serif">' + label + '</text>';
    } else if (p.kind === 'box') {
      inner = '<rect x="80" y="110" width="140" height="130" rx="12" fill="#FFF8F0" stroke="#3E2F25" stroke-width="6"/>' +
        '<rect x="80" y="110" width="140" height="44" rx="12" fill="#3E2F25"/>' +
        '<rect x="80" y="140" width="140" height="14" fill="#3E2F25"/>' +
        '<text x="150" y="140" text-anchor="middle" font-size="17" font-weight="800" fill="#F4842B" font-family="PingFang SC,Microsoft YaHei,sans-serif">益生菌</text>' +
        '<rect x="100" y="176" width="100" height="12" rx="6" fill="#F4842B" opacity=".55"/>' +
        '<rect x="100" y="196" width="72" height="12" rx="6" fill="#F4842B" opacity=".35"/>';
    } else { /* sticks */
      inner = '<rect x="90" y="100" width="120" height="150" rx="12" fill="#FFF8F0" stroke="#3E2F25" stroke-width="6"/>' +
        '<rect x="90" y="100" width="120" height="40" rx="12" fill="#F4842B"/>' +
        '<rect x="90" y="128" width="120" height="12" fill="#F4842B"/>' +
        '<g fill="#C98B5E"><rect x="112" y="160" width="16" height="70" rx="8"/><rect x="136" y="160" width="16" height="70" rx="8"/><rect x="160" y="160" width="16" height="70" rx="8"/></g>';
    }
    return '<svg viewBox="0 0 300 300" role="img" aria-label="' + p.name + '">' +
      '<rect width="300" height="300" fill="#FBF0E2"/>' +
      '<circle cx="150" cy="150" r="104" fill="#FFF8F0"/>' + inner + '</svg>';
  }

  /* ---------- 工具 ---------- */
  function $(s, c) { return (c || document).querySelector(s); }
  function $all(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }

  var toastTimer = null;
  function toast(msg) {
    var t = $('#toast'), txt = $('#toastText');
    txt.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, CONFIG.toastMs);
  }

  /* ---------- SITE 渲染 ---------- */
  function renderSite() {
    $all('[data-site]').forEach(function (el) {
      var k = el.getAttribute('data-site');
      if (k === 'copyright') el.textContent = '© 2026 ' + SITE.organizer + ' 版权所有';
      else if (SITE[k]) el.textContent = SITE[k];
    });
    document.title = SITE.brand + ' — 宠物用品 · 宠物医院';
  }

  /* ---------- 商品渲染 + 筛选 ---------- */
  var grid = $('#pgrid');
  var revealIO = null;

  function cardHTML(p, i) {
    var tag = p.tag ? '<span class="ptag' + (p.dark ? ' dark' : '') + '">' + p.tag + '</span>' : '';
    var old = p.old ? '<span class="old">' + p.old + '</span>' : '';
    return '<article class="pcard reveal" data-cat="' + p.cat + '" data-pid="' + p.id + '" style="--d:' + (i % 4 * 0.08).toFixed(2) + 's">' +
      '<div class="pmedia"><div class="skel"></div>' + tag +
      '<button class="quickadd" data-name="' + p.name + '">加入购物袋</button></div>' +
      '<div class="pbody"><h3 class="pname">' + p.name + '</h3>' +
      '<p class="pdesc">' + p.desc + '</p>' +
      '<div class="prow"><span class="price">' + p.price + '</span>' + old +
      '<span class="punit">已售 2k+</span></div></div></article>';
  }

  function paintMedia() {
    // 模拟图片加载：骨架 shimmer 后注入 SVG
    $all('.pcard').forEach(function (card, i) {
      var media = $('.pmedia', card);
      var p = PRODUCTS.filter(function (x) { return x.id === card.getAttribute('data-pid'); })[0];
      if (!p || $('.pmedia svg', card)) return;
      setTimeout(function () {
        var skel = $('.skel', media);
        if (skel) skel.parentNode.removeChild(skel);
        media.insertAdjacentHTML('afterbegin', productSVG(p));
      }, CONFIG.cardFakeLoadMs + i * 120);
    });
  }

  function renderProducts(filter) {
    var list = PRODUCTS.filter(function (p) { return !filter || filter === 'all' || p.cat === filter; });
    grid.innerHTML = list.map(cardHTML).join('');
    paintMedia();
    observeReveals(grid);
  }

  /* ---------- 滚动 stagger 入场（整页核心动效体系） ---------- */
  function observeReveals(scope) {
    if (!revealIO) {
      revealIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('in'); revealIO.unobserve(e.target); }
        });
      }, { threshold: CONFIG.revealThreshold, rootMargin: '0px 0px -40px 0px' });
    }
    $all('.reveal:not(.in)', scope || document).forEach(function (el) { revealIO.observe(el); });
  }

  /* ---------- Hero 入场（GSAP 百分比位移坑：先清 CSS 初值） ---------- */
  function heroIntro() {
    var lines = $all('.hline');
    function done() {
      document.documentElement.classList.add('hero-in');
      if (window.gsap) gsap.set(lines, { clearProps: 'all' });
    }
    if (!window.gsap || !lines.length) { done(); return; }
    try {
      // 坑：CSS 写了 translateY(112%) 初值，gsap.set 前必须先清掉，
      // 否则 GSAP 把百分比解析成 px 烘进 y，播完残留导致元素下沉
      lines.forEach(function (el) { el.style.transform = 'none'; });
      gsap.set(lines, { yPercent: 112 });
      gsap.to(lines, {
        yPercent: 0, duration: 1.05, ease: 'power3.out',
        stagger: CONFIG.heroStagger, delay: 0.25,
        onComplete: done
      });
    } catch (e) { done(); }
    // 兜底：3 秒内 GSAP 没播完也强制显示完成态
    setTimeout(function () {
      if (!document.documentElement.classList.contains('hero-in')) done();
    }, 3000);
  }

  /* ---------- 导航 / 抽屉 ---------- */
  function initNav() {
    var nav = $('#nav');
    function onScroll() { nav.classList.toggle('scrolled', window.scrollY > 24); }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    var burger = $('#burger'), drawer = $('#drawer'), scrim = $('#scrim');
    function openDrawer(o) {
      drawer.classList.toggle('open', o);
      scrim.classList.toggle('show', o);
      burger.setAttribute('aria-expanded', o ? 'true' : 'false');
      document.documentElement.classList.toggle('locked', o);
    }
    burger.addEventListener('click', function () { openDrawer(!drawer.classList.contains('open')); });
    $('#drawerClose').addEventListener('click', function () { openDrawer(false); });
    scrim.addEventListener('click', function () { openDrawer(false); });
    $all('.d-link', drawer).forEach(function (a) { a.addEventListener('click', function () { openDrawer(false); }); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drawer.classList.contains('open')) openDrawer(false);
    });
  }

  /* ---------- 筛选 / 订阅 / 加购 ---------- */
  function initShop() {
    $('#chips').addEventListener('click', function (e) {
      var b = e.target.closest('.chip');
      if (!b) return;
      $all('.chip').forEach(function (c) { c.classList.remove('on'); });
      b.classList.add('on');
      renderProducts(b.getAttribute('data-f'));
    });
    grid.addEventListener('click', function (e) {
      var b = e.target.closest('.quickadd');
      if (b) { toast('已加入购物袋：' + b.getAttribute('data-name')); return; }
    });
    $('#cycle').addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      $all('#cycle button').forEach(function (x) { x.classList.remove('on'); });
      b.classList.add('on');
    });
    $('#subBtn').addEventListener('click', function () {
      var c = $('#cycle button.on').textContent.trim();
      toast('订阅成功！' + c + '，首单立减 ¥30');
    });
    $('#ctaBtn').addEventListener('click', function () {
      toast('¥30 无门槛券已放入你的账户');
    });
  }

  /* ---------- 预约表单 ---------- */
  function initAppt() {
    var form = $('#apptForm');
    var date = $('#date');
    var today = new Date();
    date.min = today.toISOString().slice(0, 10);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = $('#petName').value.trim();
      var phone = $('#phone').value.trim();
      if (!name) { toast('请填写宠物名字，方便医生称呼它'); $('#petName').focus(); return; }
      if (!/^1\d{10}$/.test(phone)) { toast('请填写正确的 11 位手机号码'); $('#phone').focus(); return; }
      var svc = $('#svc').value;
      var d = date.value || '尽快';
      toast('预约已提交：' + name + ' · ' + svc + ' · ' + d + '，医院 30 分钟内电话确认');
      form.reset();
    });
  }

  /* ---------- 法务三件套弹窗 ---------- */
  var LEGAL = {
    privacy: {
      title: '隐私政策',
      body: '<h5>一、我们收集什么</h5><p>为完成下单、配送与预约挂号，我们会收集你的收货地址、联系电话，以及宠物的名字、种类与病历摘要。浏览行为仅用于统计热销品类，不做个人画像。</p><h5>二、信息怎么用</h5><p>只用于订单履约、医院接诊与客服回访。宠物的病历信息仅主治医生可见，不会出现在任何营销场景。</p><h5>三、不会做什么</h5><p>不出售、不出租你的个人信息；不与第三方共享，除非法律法规要求或你明确授权。</p><h5>四、你的权利</h5><p>可随时联系客服（' + '400-820-3322' + '）查询、更正或删除你的个人信息，病历删除需经主治医生确认不影响诊疗安全。</p><h5>五、未成年人</h5><p>未满 14 周岁请在监护人陪同下使用预约挂号功能。</p>'
    },
    terms: {
      title: '服务条款',
      body: '<h5>一、商品与服务</h5><p>站内宠物食品均为正规渠道行货，支持 7 天无理由退换（拆封后质量问题 15 天内换货）；医院服务按《动物诊疗机构管理办法》执业，诊疗方案与费用事先书面确认。</p><h5>二、价格与支付</h5><p>标价均为含税价，促销价以支付时为准；支持微信、支付宝与银行卡支付，全程加密，不存储卡号密码。</p><h5>三、配送</h5><p>48 小时内发出，满 99 元包邮；冻干、生鲜类全程冷链，签收发现变质请拒收并拍照联系客服。</p><h5>四、预约挂号</h5><p>提交预约后医院 30 分钟内电话确认；爽约两次将暂停线上预约 30 天；急诊请直接到院，无需预约。</p><h5>五、责任边界</h5><p>养宠知识栏目内容仅供参考，不能替代面诊；用药请遵医嘱。</p>'
    },
    cookies: {
      title: 'Cookie 政策',
      body: '<h5>一、我们用什么 Cookie</h5><p>必需型：记住购物袋、登录态与预约表单草稿，关掉就没法下单；统计型：匿名统计哪些商品被看得多，用于进货参考。</p><h5>二、我们不用什么</h5><p>不做跨站追踪，不接第三方广告 Cookie，你的浏览记录不会被拿去投广告。</p><h5>三、怎么管理</h5><p>浏览器设置里可随时禁用 Cookie；禁用后购物袋与一键加购功能将不可用，但浏览商品不受影响。</p><h5>四、有效期</h5><p>购物袋 Cookie 保留 30 天，统计 Cookie 保留 13 个月，到期自动清除。</p>'
    }
  };
  function initModals() {
    var scrim = $('#modalScrim'), body = $('#modalBody'), title = $('#modalTitle');
    var lastFocus = null;
    function open(key) {
      var d = LEGAL[key];
      if (!d) return;
      lastFocus = document.activeElement;
      title.textContent = d.title;
      body.innerHTML = d.body;
      body.scrollTop = 0;
      scrim.classList.add('show');
      document.documentElement.classList.add('locked');
      $('#modalClose').focus();
    }
    function close() {
      scrim.classList.remove('show');
      document.documentElement.classList.remove('locked');
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    $all('[data-modal]').forEach(function (b) {
      b.addEventListener('click', function () { open(b.getAttribute('data-modal')); });
    });
    $('#modalClose').addEventListener('click', close);
    $('#modalOk').addEventListener('click', close);
    scrim.addEventListener('click', function (e) { if (e.target === scrim) close(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && scrim.classList.contains('show')) close();
    });
  }

  /* ---------- 加载态 ---------- */
  function initVeil() {
    function hide() { $('#veil').classList.add('gone'); }
    if (document.readyState === 'complete') hide();
    else window.addEventListener('load', hide);
    setTimeout(hide, 2500); // 兜底：load 不触发也消失
  }

  /* ---------- 启动 ---------- */
  renderSite();
  renderProducts('all');
  initNav();
  initShop();
  initAppt();
  initModals();
  initVeil();
  observeReveals(document);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', heroIntro);
  } else { heroIntro(); }
})();

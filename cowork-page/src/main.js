/* 合座 COBASE · 交互：classic script，无模块 */
(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var fine = window.matchMedia('(pointer:fine)').matches;
  var reduced = window.matchMedia('(prefers-reduced-motion:reduce)').matches;

  /* ============ SITE 配置：一改全改 ============ */
  var SITE = {
    name: '合座空间管理（上海）有限公司',
    address: '上海市静安区南京西路 1266 号 恒隆广场 48 层',
    phone: '400-820-6688',
    email: 'hello@cobase.example.com',
    icp: '沪ICP备2026000000号-1'
  };

  /* ============ 法务三件套文案 ============ */
  var MODAL_DOCS = {
    privacy: {
      title: '隐私政策',
      body: '<h4>我们收集什么</h4><p>预约参观时，你留下的姓名、手机号与意向城市，仅用于空间经理与你联系、安排参观时间。我们不会把你的号码卖给任何第三方，也不会用于营销外呼。</p>' +
        '<h4>门禁与影像</h4><p>空间公共区域装有监控摄像头，用于安防与纠纷取证，影像保留 30 天后自动删除。独立办公室内不设监控。</p>' +
        '<h4>你的权利</h4><p>你可以随时要求我们删除你的预约信息：发邮件到下方邮箱，标题注明「删除我的信息」，我们会在 3 个工作日内处理完毕并回复确认。</p>' +
        '<h4>政策更新</h4><p>本政策更新时，会在官网首页显著位置公示 7 天。继续使用预约服务即视为接受更新后的版本。</p>'
    },
    terms: {
      title: '服务条款',
      body: '<h4>会员与租期</h4><p>灵活工位按月付费，专属工位与独立办公室可按月或按季签约。所有方案均支持提前 15 天书面通知退租，未使用的整月费用全额退还。</p>' +
        '<h4>使用规范</h4><p>开放式工位区请保持合理音量，长时间通话请移步电话亭。会议室需提前 2 小时预约，单次使用不超过 4 小时，以便更多会员轮候。</p>' +
        '<h4>押金</h4><p>专属工位与独立办公室收取相当于 1 个月租金的押金。退租时经查验无损坏，押金在 7 个工作日内原路退回。</p>' +
        '<h4>责任边界</h4><p>我们对会员存放在公共区域的个人物品不承担保管责任，贵重物品请使用储物柜或随身携带。因不可抗力导致的服务中断，我们将按天顺延租期。</p>'
    },
    cookie: {
      title: 'Cookie 政策',
      body: '<h4>我们用什么 Cookie</h4><p>本页面仅使用两类 Cookie：记住你上次浏览的城市偏好（功能型），以及匿名的页面访问统计（分析型，用于改进页面体验）。</p>' +
        '<h4>我们不用什么</h4><p>不做跨站广告追踪，不接入第三方营销像素，不读取你的浏览历史。分析数据为聚合统计，无法定位到个人。</p>' +
        '<h4>如何管理</h4><p>你可以在浏览器设置中随时清除或禁用 Cookie。禁用后城市偏好记忆功能会失效，但页面其他功能不受影响。</p>'
    }
  };

  /* ============ SITE 渲染 ============ */
  function renderSite() {
    $$('[data-site]').forEach(function (el) {
      var k = el.getAttribute('data-site');
      var v = SITE[k];
      if (v == null) return;
      if (el.tagName === 'A' && k === 'phone') el.href = 'tel:' + v.replace(/-/g, '');
      else if (el.tagName === 'A' && k === 'email') el.href = 'mailto:' + v;
      el.textContent = v;
    });
  }

  /* ============ 加载态 ============ */
  var loaderDone = false;
  function finishLoad() {
    if (loaderDone) return; loaderDone = true;
    $('#loader').classList.add('done');
    // hero 入场：按 data-d 阶梯点亮
    $$('.hero .reveal').forEach(function (el) {
      var d = parseInt(el.getAttribute('data-d') || '0', 10);
      setTimeout(function () { el.classList.add('is-in'); }, reduced ? 0 : 90 * d);
    });
  }
  window.addEventListener('load', function () { setTimeout(finishLoad, 350); });
  setTimeout(finishLoad, 3200); // load 迟迟不到时的兜底

  /* ============ 滚动 reveal：IO + 4s 安全网 ============ */
  var heroSeen = {};
  $$('.hero .reveal').forEach(function (el) { heroSeen[el] = true; });
  var rest = $$('.reveal').filter(function (el) { return !heroSeen[el]; });
  if ('IntersectionObserver' in window && !reduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          var el = e.target;
          var d = parseInt(el.getAttribute('data-d') || '0', 10);
          setTimeout(function () { el.classList.add('is-in'); }, 110 * d);
          io.unobserve(el);
        }
      });
    }, { threshold: 0.14 });
    rest.forEach(function (el) { io.observe(el); });
    setTimeout(function () { rest.forEach(function (el) { el.classList.add('is-in'); }); }, 4000);
  } else {
    rest.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ============ 导航滚动态 ============ */
  var nav = $('#nav');
  function onScroll() { nav.classList.toggle('scrolled', window.scrollY > 24); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ============ 抽屉 ============ */
  var burger = $('#burger'), drawer = $('#drawer'), veil = $('#drawerVeil');
  function setDrawer(open) {
    document.body.classList.toggle('drawer-open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? '关闭菜单' : '打开菜单');
    veil.setAttribute('aria-hidden', open ? 'false' : 'true');
  }
  burger.addEventListener('click', function () {
    setDrawer(!document.body.classList.contains('drawer-open'));
  });
  veil.addEventListener('click', function () { setDrawer(false); });
  $$('#drawer a').forEach(function (a) { a.addEventListener('click', function () { setDrawer(false); }); });

  /* ============ 空间画廊：hover 切换（核心动效①） ============ */
  var ROOMS = {
    open: {
      cap: '开放式工位区 · 早上九点', title: '开放式工位区',
      desc: '长桌、好光和刚好的背景音。大多数人效率最高的地方，也是合座卖得最好的一个房间。',
      meta: ['长桌 40 席', '层高 4.2 米', '自然采光'],
      svg: '<svg viewBox="0 0 640 300" preserveAspectRatio="xMidYMid slice">' +
        '<rect width="640" height="300" fill="#F4E4C1"/>' +
        '<rect x="40" y="30" width="560" height="120" fill="#EFD9AC"/>' +
        '<g stroke="#22211F" stroke-width="8"><line x1="180" y1="30" x2="180" y2="150"/><line x1="320" y1="30" x2="320" y2="150"/><line x1="460" y1="30" x2="460" y2="150"/></g>' +
        '<circle cx="540" cy="70" r="26" fill="#F5B841" opacity=".8"/>' +
        '<rect x="0" y="150" width="640" height="150" fill="#EAD9B8"/>' +
        '<rect x="80" y="185" width="180" height="12" rx="6" fill="#8A6F4D"/><rect x="100" y="197" width="8" height="44" fill="#6E5739"/><rect x="232" y="197" width="8" height="44" fill="#6E5739"/>' +
        '<rect x="115" y="162" width="40" height="24" rx="3" fill="#22211F" opacity=".85"/><rect x="168" y="166" width="34" height="20" rx="3" fill="#22211F" opacity=".65"/>' +
        '<rect x="380" y="185" width="180" height="12" rx="6" fill="#8A6F4D"/><rect x="400" y="197" width="8" height="44" fill="#6E5739"/><rect x="532" y="197" width="8" height="44" fill="#6E5739"/>' +
        '<rect x="415" y="162" width="40" height="24" rx="3" fill="#22211F" opacity=".8"/><rect x="468" y="166" width="34" height="20" rx="3" fill="#22211F" opacity=".6"/>' +
        '<rect x="180" y="185" width="26" height="12" rx="2" fill="#E3A82B"/><rect x="474" y="185" width="26" height="12" rx="2" fill="#E3A82B"/>' +
        '<rect x="596" y="200" width="20" height="36" rx="3" fill="#C96F3B"/><circle cx="606" cy="188" r="16" fill="#3E6B35"/></svg>'
    },
    booth: {
      cap: '静音电话亭 · 随时可用', title: '静音电话亭',
      desc: '35 分贝的安静，坐进去只听得见自己。长电话、面试、吵架（指和客户讲道理），都来这里。',
      meta: ['隔音 35dB', '通风换气', '免预约'],
      svg: '<svg viewBox="0 0 640 300" preserveAspectRatio="xMidYMid slice">' +
        '<rect width="640" height="300" fill="#EADFCB"/>' +
        '<rect x="0" y="230" width="640" height="70" fill="#DCC9A4"/>' +
        '<g><rect x="110" y="50" width="120" height="180" rx="14" fill="#22211F"/>' +
        '<rect x="126" y="70" width="88" height="90" rx="8" fill="#E3A82B" opacity=".9"/>' +
        '<rect x="140" y="176" width="60" height="10" rx="5" fill="#FAF7F2" opacity=".7"/></g>' +
        '<g><rect x="260" y="50" width="120" height="180" rx="14" fill="#2E2C29"/>' +
        '<rect x="276" y="70" width="88" height="90" rx="8" fill="#F5B841" opacity=".85"/>' +
        '<rect x="290" y="176" width="60" height="10" rx="5" fill="#FAF7F2" opacity=".7"/></g>' +
        '<g><rect x="410" y="50" width="120" height="180" rx="14" fill="#22211F"/>' +
        '<rect x="426" y="70" width="88" height="90" rx="8" fill="#E3A82B" opacity=".9"/>' +
        '<rect x="440" y="176" width="60" height="10" rx="5" fill="#FAF7F2" opacity=".7"/></g>' +
        '<rect x="60" y="20" width="520" height="14" rx="7" fill="#E3A82B" opacity=".35"/></svg>'
    },
    meet: {
      cap: '会议室 · 2–12 人', title: '会议室',
      desc: '从 2 人碰头到 12 人提案，都有对应的房间。86 寸屏、好收音，远程的人听得清清楚楚。',
      meta: ['2–12 人房型', '86 寸大屏', '会议平板'],
      svg: '<svg viewBox="0 0 640 300" preserveAspectRatio="xMidYMid slice">' +
        '<rect width="640" height="300" fill="#F6EDDC"/>' +
        '<rect x="0" y="210" width="640" height="90" fill="#E8D7B4"/>' +
        '<rect x="170" y="40" width="300" height="120" rx="10" fill="#22211F"/>' +
        '<rect x="186" y="56" width="268" height="88" rx="6" fill="#3A3835"/>' +
        '<circle cx="320" cy="100" r="26" fill="none" stroke="#E3A82B" stroke-width="8"/>' +
        '<ellipse cx="320" cy="200" rx="190" ry="26" fill="#8A6F4D"/>' +
        '<rect x="320" cy="200" width="0" height="0" fill="none"/>' +
        '<g fill="#6E5739"><rect x="170" y="220" width="12" height="52"/><rect x="458" y="220" width="12" height="52"/><rect x="314" y="226" width="12" height="46"/></g>' +
        '<g fill="#22211F" opacity=".85"><rect x="230" y="150" width="30" height="9" rx="4"/><rect x="380" y="150" width="30" height="9" rx="4"/></g>' +
        '<circle cx="90" cy="60" r="10" fill="#E3A82B"/><circle cx="550" cy="60" r="10" fill="#E3A82B"/></svg>'
    },
    cafe: {
      cap: '咖啡水吧 · 全天免费', title: '咖啡水吧',
      desc: '意式咖啡机、气泡水和每周三下午的蛋糕。很多合作，就是从「帮我也带一杯」开始的。',
      meta: ['意式咖啡免费', '周三蛋糕日', '深夜食堂'],
      svg: '<svg viewBox="0 0 640 300" preserveAspectRatio="xMidYMid slice">' +
        '<rect width="640" height="300" fill="#F4E9D2"/>' +
        '<rect x="0" y="220" width="640" height="80" fill="#E3D3AE"/>' +
        '<rect x="90" y="200" width="460" height="20" rx="10" fill="#8A6F4D"/>' +
        '<g stroke="#22211F" stroke-width="6" fill="none" stroke-linecap="round">' +
        '<path d="M170 200 v-60 h34 v60"/><path d="M240 200 v-78 h34 v78"/><path d="M310 200 v-52 h34 v52"/></g>' +
        '<circle cx="187" cy="128" r="12" fill="#fff"/><circle cx="257" cy="110" r="12" fill="#fff"/><circle cx="327" cy="136" r="12" fill="#fff"/>' +
        '<rect x="430" y="120" width="60" height="80" rx="8" fill="#22211F"/>' +
        '<rect x="442" y="140" width="36" height="8" rx="4" fill="#E3A82B"/>' +
        '<rect x="442" y="156" width="36" height="8" rx="4" fill="#FAF7F2" opacity=".5"/>' +
        '<circle cx="540" cy="80" r="26" fill="#C96F3B"/><rect x="528" y="106" width="24" height="14" rx="4" fill="#22211F" opacity=".7"/>' +
        '<rect x="90" y="96" width="120" height="10" rx="5" fill="#22211F" opacity=".25"/><rect x="90" y="114" width="90" height="10" rx="5" fill="#22211F" opacity=".18"/></svg>'
    }
  };
  var stageInner = $('#stageInner'), stageCap = $('#stageCap');
  var currentRoom = null;
  function renderRooms() {
    var html = '';
    Object.keys(ROOMS).forEach(function (k) {
      var r = ROOMS[k];
      html += '<div class="stage-panel' + (k === 'open' ? ' is-active' : '') + '" data-panel="' + k + '">' +
        r.svg +
        '<div class="stage-info"><h3>' + r.title + '</h3><p>' + r.desc + '</p>' +
        '<div class="meta">' + r.meta.map(function (m) { return '<span>' + m + '</span>'; }).join('') + '</div></div></div>';
    });
    stageInner.innerHTML = html;
    stageCap.textContent = ROOMS.open.cap;
    currentRoom = 'open';
  }
  function switchRoom(key) {
    if (key === currentRoom || !ROOMS[key]) return;
    currentRoom = key;
    $$('.stage-panel', stageInner).forEach(function (p) {
      p.classList.toggle('is-active', p.getAttribute('data-panel') === key);
    });
    stageCap.textContent = ROOMS[key].cap;
    $$('.thumb').forEach(function (t) {
      var on = t.getAttribute('data-room') === key;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
    });
  }
  function bindThumbs() {
    $$('.thumb').forEach(function (t) {
      var key = t.getAttribute('data-room');
      t.addEventListener('mouseenter', function () { switchRoom(key); });
      t.addEventListener('focus', function () { switchRoom(key); });
      t.addEventListener('click', function () { switchRoom(key); });
    });
  }
  renderRooms(); bindThumbs();

  /* ============ 城市选择 ============ */
  var CITIES = {
    sh: [
      { name: '浦江中心店', addr: '静安区南京西路 1266 号 · 地铁 2 号线静安寺站', price: '¥680', note: '本周新开幕 · 首月 8 折' },
      { name: '外滩源店', addr: '黄浦区圆明园路 115 号 · 外滩步行 5 分钟', price: '¥780', note: '江景会议室 · 摄影友好' }
    ],
    bj: [
      { name: '三里屯店', addr: '朝阳区三里屯路 19 号 · 太古里对面', price: '¥880', note: '24 小时营业 · 夜猫子据点' },
      { name: '中关村店', addr: '海淀区中关村大街 27 号 · 创业大街旁', price: '¥720', note: '路演厅免费预约' }
    ],
    sz: [
      { name: '南山智园店', addr: '南山区留仙大道 3333 号 · 科技园核心', price: '¥700', note: '硬件团队友好 · 有仓储' },
      { name: '福田 CBD 店', addr: '福田区深南大道 6008 号 · 地铁 1/2 号线交汇', price: '¥820', note: '金融客户多 · 茶室安静' }
    ],
    hz: [
      { name: '西湖文三店', addr: '西湖区文三路 90 号 · 西湖 10 分钟车程', price: '¥580', note: '性价比之王 · 绿植最多' },
      { name: '滨江星光店', addr: '滨江区江南大道 1088 号 · 星光大道商圈', price: '¥620', note: '直播间可租 · 隔音好' }
    ]
  };
  var CITY_NAMES = { sh: '上海', bj: '北京', sz: '深圳', hz: '杭州' };
  var cityCards = $('#cityCards'), currentCity = 'sh';
  function renderCity(key) {
    var cards = CITIES[key] || [];
    cityCards.innerHTML = cards.map(function (c, i) {
      return '<article class="city-card swap-in" style="animation-delay:' + (reduced ? 0 : i * 0.09) + 's">' +
        '<h3>' + c.name + '</h3><p class="addr">' + c.addr + '</p>' +
        '<p class="price">灵活工位 <b>' + c.price + '</b>/月起</p>' +
        '<p class="note">' + c.note + '</p>' +
        '<a href="#visit">约这家参观 <svg viewBox="0 0 16 16" width="16" height="16"><path d="M2 8h11M9 3.5L13.5 8 9 12.5" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></a>' +
        '</article>';
    }).join('');
  }
  $$('.city-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      var key = tab.getAttribute('data-city');
      if (key === currentCity) return;
      currentCity = key;
      $$('.city-tab').forEach(function (t) {
        var on = t === tab;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      renderCity(key);
    });
  });
  renderCity('sh');

  /* ============ 方案卡 3D 倾斜（核心动效②） ============ */
  if (fine && !reduced && window.gsap) {
    $$('.tilt').forEach(function (card) {
      var inner = card.querySelector('.tilt-inner');
      var rx = gsap.quickTo(inner, 'rotationX', { duration: 0.6, ease: 'power3.out' });
      var ry = gsap.quickTo(inner, 'rotationY', { duration: 0.6, ease: 'power3.out' });
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        var dx = (e.clientX - r.left) / r.width - 0.5;
        var dy = (e.clientY - r.top) / r.height - 0.5;
        ry(dx * 14); rx(-dy * 10);
      });
      card.addEventListener('mouseleave', function () { rx(0); ry(0); });
    });
  }
  // 无 GSAP / 触屏：CSS hover 阴影兜底，卡片照常完整

  /* ============ 预约表单 ============ */
  var form = $('#visitForm');
  function setErr(name, msg) {
    var input = form.elements[name];
    var em = $('.err[data-err="' + name + '"]', form);
    if (em) { em.textContent = msg || ''; em.classList.toggle('show', !!msg); }
    if (input) input.classList.toggle('bad', !!msg);
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = form.elements.name.value.trim();
    var phone = form.elements.phone.value.replace(/\s/g, '');
    var date = form.elements.date.value;
    var ok = true;
    if (!name) { setErr('name', '请告诉我们怎么称呼你'); ok = false; } else setErr('name');
    if (!/^1[3-9]\d{9}$/.test(phone)) { setErr('phone', '手机号好像不对，再检查一下'); ok = false; } else setErr('phone');
    if (date) {
      var today = new Date(); today.setHours(0, 0, 0, 0);
      if (new Date(date) < today) { setErr('date', '日期不能是过去'); ok = false; } else setErr('date');
    } else setErr('date');
    if (!ok) return;
    var cityName = CITY_NAMES[form.elements.city.value] || '上海';
    toast('收到，<b>' + escapeHtml(name) + '</b>！' + cityName + '空间经理会在 2 个工作小时内联系你。');
    form.reset();
  });
  ['name', 'phone', 'date'].forEach(function (n) {
    form.elements[n].addEventListener('input', function () { setErr(n); });
  });
  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  var toastTimer = null;
  function toast(html) {
    var t = $('#toast');
    t.innerHTML = html;
    t.setAttribute('aria-hidden', 'false');
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      t.classList.remove('show');
      t.setAttribute('aria-hidden', 'true');
    }, 4200);
  }

  /* ============ 法务弹窗 ============ */
  var modalVeil = $('#modalVeil'), modal = $('#modal'),
    modalTitle = $('#modalTitle'), modalBody = $('#modalBody'), modalX = $('#modalX');
  var lastTrigger = null;
  function openModal(key) {
    var doc = MODAL_DOCS[key];
    if (!doc) return;
    lastTrigger = document.activeElement;
    modalTitle.textContent = doc.title;
    modalBody.innerHTML = doc.body;
    modalBody.scrollTop = 0;
    document.body.classList.add('modal-open');
    modal.setAttribute('aria-hidden', 'false');
    modalVeil.setAttribute('aria-hidden', 'false');
    modalX.focus();
  }
  function closeModal() {
    document.body.classList.remove('modal-open');
    modal.setAttribute('aria-hidden', 'true');
    modalVeil.setAttribute('aria-hidden', 'true');
    if (lastTrigger && lastTrigger.focus) lastTrigger.focus();
  }
  $$('[data-modal]').forEach(function (b) {
    b.addEventListener('click', function () { openModal(b.getAttribute('data-modal')); });
  });
  modalX.addEventListener('click', closeModal);
  modalVeil.addEventListener('click', closeModal);
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (document.body.classList.contains('modal-open')) closeModal();
    else if (document.body.classList.contains('drawer-open')) setDrawer(false);
  });

  /* ============ 启动 ============ */
  renderSite();
})();

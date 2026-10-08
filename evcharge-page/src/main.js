/* 驰电 CHIDIAN · 全部交互（classic script，无 ES module） */
'use strict';

/* ============ 配置：公司信息一改全改 ============ */
const SITE = {
  brand:   '驰电新能源',
  phone:   '400-820-8858',
  email:   'partner@chidian.energy',
  address: '北京市朝阳区建国路 88 号 SOHO 现代城 A 座 1206',
  icp:     '京ICP备2026001234号-1',
  year:    '2026'
};

/* ============ 法务三件套文案（真实感通用条款） ============ */
const LEGAL = {
  privacy: {
    title: '隐私政策',
    body: `<h5>一、我们收集哪些信息</h5>
    <p>为提供找桩、充电、结算服务，我们会收集您的手机号（登录与联系）、充电订单信息（站点、枪号、电量、金额）以及大致位置（用于推荐附近充电站）。位置信息仅在使用找桩功能时获取，您可随时在系统设置中关闭。</p>
    <h5>二、信息如何使用</h5>
    <p>收集的信息仅用于订单履约、客服支持与服务优化。我们不会将您的个人信息出售给任何第三方；合作服务商（如支付机构）仅在必要范围内接触脱敏后的订单数据。</p>
    <h5>三、您的权利</h5>
    <p>您可随时在 App「我的—设置」中查阅、更正个人信息，或申请注销账号。注销后，除法律法规要求留存的订单记录外，我们将删除您的个人数据。</p>
    <h5>四、联系我们</h5>
    <p>如对本政策有疑问，请致电客服热线，我们将在 3 个工作日内回复。</p>`
  },
  terms: {
    title: '服务条款',
    body: `<h5>一、服务内容</h5>
    <p>驰电为用户提供电动汽车充电设施的查找、预约、充电与结算服务。充电价格以 App 下单页面实时展示为准，峰谷时段按当地电网政策执行。</p>
    <h5>二、用户义务</h5>
    <p>请使用与车辆匹配的充电接口，按规范插拔充电枪；充电期间请勿擅自移动、损坏设备。因违规操作导致的设备损坏，用户应承担相应赔偿责任。</p>
    <h5>三、费用与结算</h5>
    <p>充电费用按实际充电量结算，充满或手动停止后自动扣费。账单明细可在 App 中查询；如对账单有异议，请在 7 天内联系客服核查。</p>
    <h5>四、责任限制</h5>
    <p>因电网检修、不可抗力导致充电中断的，我们将协助处理但不承担间接损失。设备故障请第一时间通过 App 报修，我们承诺 2 小时内响应。</p>`
  },
  cookie: {
    title: 'Cookie 说明',
    body: `<h5>一、我们使用 Cookie 做什么</h5>
    <p>本网站使用 Cookie 记住您的城市偏好、表单填写进度等，以提升浏览体验；同时使用匿名统计 Cookie 了解页面访问情况，帮助我们改进内容。</p>
    <h5>二、Cookie 的种类</h5>
    <p>必要型 Cookie（维持页面基本功能，无法关闭）、偏好型 Cookie（记住您的选择）、统计型 Cookie（匿名访问数据）。我们不使用广告追踪 Cookie。</p>
    <h5>三、如何管理</h5>
    <p>您可通过浏览器设置清除或禁用 Cookie。禁用后，部分偏好记忆功能可能无法正常使用，但核心浏览不受影响。</p>`
  }
};

/* ============ 页脚 SITE 渲染 ============ */
(function renderSite(){
  document.querySelectorAll('[data-site]').forEach(function(el){
    var k = el.getAttribute('data-site');
    if (SITE[k] !== undefined) el.textContent = SITE[k];
  });
})();

/* ============ 加载态（保底 3.5s 强制消失） ============ */
(function loader(){
  var l = document.getElementById('loader');
  var done = false;
  function hide(){ if(!done){ done = true; l.classList.add('done'); setTimeout(function(){ l.style.display='none'; }, 600); } }
  window.addEventListener('load', function(){ setTimeout(hide, 900); });
  setTimeout(hide, 3500); /* 保底：永不卡死 */
})();

/* ============ 导航：滚动毛玻璃 + 锚点高亮 ============ */
(function nav(){
  var nav = document.getElementById('nav');
  var links = Array.prototype.slice.call(document.querySelectorAll('[data-nav]'));
  function onScroll(){
    nav.classList.toggle('scrolled', window.scrollY > 40);
    var cur = null;
    links.forEach(function(a){
      var sec = document.querySelector(a.getAttribute('href'));
      if (sec && sec.getBoundingClientRect().top <= 160) cur = a;
    });
    links.forEach(function(a){ a.classList.toggle('active', a === cur); });
  }
  window.addEventListener('scroll', onScroll, {passive:true});
  onScroll();
})();

/* ============ 移动端抽屉（三通道：汉堡/遮罩/ESC/点选） ============ */
(function drawer(){
  var burger = document.getElementById('burger');
  var drawer = document.getElementById('drawer');
  var mask = document.getElementById('drawerMask');
  function open(){ document.body.classList.add('drawer-open'); burger.setAttribute('aria-expanded','true'); drawer.setAttribute('aria-hidden','false'); }
  function close(){ document.body.classList.remove('drawer-open'); burger.setAttribute('aria-expanded','false'); drawer.setAttribute('aria-hidden','true'); }
  burger.addEventListener('click', function(){ document.body.classList.contains('drawer-open') ? close() : open(); });
  mask.addEventListener('click', close);
  drawer.querySelectorAll('a').forEach(function(a){ a.addEventListener('click', close); });
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape') close(); });
})();

/* ============ Hero 主视觉：充电电流粒子画布 ============ */
(function current(){
  var cv = document.getElementById('current');
  if(!cv || !cv.getContext) return;
  var ctx = cv.getContext('2d');
  var W, H, parts = [];
  var DPR = Math.min(window.devicePixelRatio || 1, 2);
  function size(){
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = W * DPR; cv.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  size(); window.addEventListener('resize', size);
  var N = window.innerWidth < 640 ? 46 : 90;
  function spawn(init){
    return {
      x: Math.random()*W,
      y: init ? Math.random()*H : H + 10,
      vy: -(0.6 + Math.random()*1.6),
      vx: (Math.random()-.5)*0.5,
      r: 1 + Math.random()*2.2,
      a: 0.25 + Math.random()*0.6,
      hue: Math.random() < 0.82
    };
  }
  for(var i=0;i<N;i++) parts.push(spawn(true));
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var t = 0;
  function frame(){
    t += 0.016;
    ctx.clearRect(0,0,W,H);
    /* 粒子向上汇聚：越靠上越向中心收拢（模拟电流注入电量环） */
    var cx = W * 0.72;
    parts.forEach(function(p){
      p.y += p.vy; p.x += p.vx + Math.sin(t*2 + p.y*0.01)*0.3;
      var pull = Math.max(0, 1 - p.y/H);
      p.x += (cx - p.x) * 0.0016 * pull;
      if(p.y < -12){ Object.assign(p, spawn(false)); }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, 6.2832);
      ctx.fillStyle = p.hue ? 'rgba(140,255,87,'+p.a+')' : 'rgba(255,255,255,'+(p.a*0.5)+')';
      ctx.fill();
      /* 拖尾 */
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.vx*8, p.y - p.vy*8);
      ctx.strokeStyle = p.hue ? 'rgba(140,255,87,'+(p.a*0.35)+')' : 'rgba(255,255,255,0)';
      ctx.lineWidth = p.r*0.7;
      ctx.stroke();
    });
    if(!reduced) requestAnimationFrame(frame);
  }
  frame();
})();

/* ============ 电量环：SOC 数字滚动 + 环绘制 ============ */
(function ring(){
  var fg = document.getElementById('ringFg');
  var num = document.getElementById('socNum');
  var state = document.getElementById('socState');
  if(!fg) return;
  var C = 653.45, target = 96, dur = 2600, t0 = null;
  function easeOutQuart(x){ return 1 - Math.pow(1-x, 4); }
  function step(ts){
    if(!t0) t0 = ts;
    var p = Math.min(1, (ts - t0)/dur);
    var v = Math.round(easeOutQuart(p) * target);
    num.textContent = v;
    fg.style.strokeDashoffset = C * (1 - v/100);
    if(p < 1) requestAnimationFrame(step);
    else { state.textContent = '已充满，随时出发'; }
  }
  setTimeout(function(){ requestAnimationFrame(step); }, 1200);
})();

/* ============ 数字滚动（data-count） ============ */
(function counters(){
  var els = document.querySelectorAll('[data-count]');
  var io = new IntersectionObserver(function(es){
    es.forEach(function(e){
      if(!e.isIntersecting) return;
      io.unobserve(e.target);
      var el = e.target, target = +el.getAttribute('data-count'), t0 = null;
      function tick(ts){
        if(!t0) t0 = ts;
        var p = Math.min(1, (ts-t0)/1500);
        el.textContent = Math.round((1-Math.pow(1-p,4)) * target);
        if(p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  }, {threshold: .5});
  els.forEach(function(el){ io.observe(el); });
})();

/* ============ 滚动揭示（stagger via transition-delay；hero 区由入场动画接管，IO 跳过） ============ */
(function reveal(){
  var els = document.querySelectorAll('.rv');
  var io = new IntersectionObserver(function(es){
    es.forEach(function(e){
      if(!e.isIntersecting) return;
      var el = e.target;
      if(el.closest('.hero')) return; /* hero 入场由 intro() 负责，不抢 */
      var sibs = Array.prototype.slice.call(el.parentNode.querySelectorAll('.rv'));
      var idx = sibs.indexOf(el);
      el.style.transitionDelay = Math.min(idx * 90, 450) + 'ms';
      el.classList.add('in');
      io.unobserve(el);
    });
  }, {threshold: .12, rootMargin: '0px 0px -6% 0px'});
  els.forEach(function(el){ io.observe(el); });
})();

/* ============ 找桩：城市筛选 + 搜索 ============ */
(function finder(){
  var cards = Array.prototype.slice.call(document.querySelectorAll('#stationCards .card'));
  var chips = Array.prototype.slice.call(document.querySelectorAll('.chip'));
  var search = document.getElementById('stationSearch');
  var city = 'all';
  function apply(){
    var q = search.value.trim();
    cards.forEach(function(c){
      var okCity = city === 'all' || c.getAttribute('data-city') === city;
      var okQ = !q || c.getAttribute('data-name').indexOf(q) !== -1;
      c.classList.toggle('gone', !(okCity && okQ));
    });
  }
  chips.forEach(function(ch){
    ch.addEventListener('click', function(){
      chips.forEach(function(c){ c.classList.remove('on'); });
      ch.classList.add('on');
      city = ch.getAttribute('data-city');
      apply();
    });
  });
  search.addEventListener('input', apply);
})();

/* ============ 方案 tab ============ */
(function tabs(){
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.tab'));
  function show(name){
    tabs.forEach(function(t){
      var on = t.getAttribute('data-tab') === name;
      t.classList.toggle('on', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      document.getElementById('panel-' + t.getAttribute('data-tab')).classList.toggle('on', on);
    });
  }
  tabs.forEach(function(t){
    t.addEventListener('click', function(){ show(t.getAttribute('data-tab')); });
  });
})();

/* ============ 加盟表单：校验 + 成功态 ============ */
(function form(){
  var form = document.getElementById('partnerForm');
  var box = form.closest('.join-form');
  var success = document.getElementById('formSuccess');
  function setErr(input, msgEl, msg){
    msgEl.textContent = msg;
    input.classList.toggle('bad', !!msg);
    return !msg;
  }
  form.addEventListener('submit', function(e){
    e.preventDefault();
    var name = document.getElementById('fName');
    var phone = document.getElementById('fPhone');
    var city = document.getElementById('fCity');
    var type = document.getElementById('fType');
    var ok = true;
    ok = setErr(name, document.getElementById('eName'),
      name.value.trim().length >= 2 ? '' : '请填写您的称呼（至少 2 个字）') && ok;
    ok = setErr(phone, document.getElementById('ePhone'),
      /^1[3-9]\d{9}$/.test(phone.value.trim()) ? '' : '请填写正确的 11 位手机号') && ok;
    ok = setErr(city, document.getElementById('eCity'),
      city.value.trim() ? '' : '请填写您所在的城市') && ok;
    ok = setErr(type, document.getElementById('eType'),
      type.value ? '' : '请选择一种合作意向') && ok;
    if(!ok){
      box.classList.remove('shake');
      void box.offsetWidth; /* 重启动画 */
      box.classList.add('shake');
      return;
    }
    document.getElementById('okPhone').textContent = phone.value.trim().replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
    box.classList.add('sent');
    success.classList.add('show');
  });
  /* 输入即清错 */
  form.querySelectorAll('input,select').forEach(function(el){
    el.addEventListener('input', function(){
      el.classList.remove('bad');
      var err = el.parentNode.querySelector('.err');
      if(err) err.textContent = '';
    });
  });
})();

/* ============ 法务弹窗：按钮 + 遮罩 + ESC 三通道 ============ */
(function modal(){
  var mask = document.getElementById('modalMask');
  var modal = document.getElementById('legalModal');
  var title = document.getElementById('modalTitle');
  var body = document.getElementById('modalBody');
  var x = document.getElementById('modalX');
  function open(key){
    var d = LEGAL[key]; if(!d) return;
    title.textContent = d.title;
    body.innerHTML = d.body;
    body.scrollTop = 0;
    document.body.classList.add('modal-open');
  }
  function close(){ document.body.classList.remove('modal-open'); }
  document.querySelectorAll('[data-legal]').forEach(function(b){
    b.addEventListener('click', function(){ open(b.getAttribute('data-legal')); });
  });
  x.addEventListener('click', close);   /* 通道1：关闭按钮 */
  mask.addEventListener('click', close); /* 通道2：遮罩 */
  document.addEventListener('keydown', function(e){ /* 通道3：ESC */
    if(e.key === 'Escape') close();
  });
})();

/* ============ Hero 入场（CSS 过渡驱动，墙钟确定性；GSAP 只做鼠标视差增强） ============ */
(function intro(){
  var heroRvs = document.querySelectorAll('.hero .rv');
  var ring = document.querySelector('.hero-ring');
  function showAll(){
    var i = 0;
    heroRvs.forEach(function(el){
      if(el === ring) return;
      el.style.transitionDelay = (i * 110) + 'ms';
      el.classList.add('in');
      i++;
    });
    if(ring){
      ring.style.transitionDelay = '420ms';
      ring.classList.add('in');
    }
  }
  /* 脚本在 body 末尾，DOM 就绪；950ms 后（loader 渐隐时）开始入场 */
  setTimeout(showAll, 950);
})();

/* ============ Hero 电量环鼠标视差（GSAP 增强，无则跳过） ============ */
(function ringParallax(){
  if(!window.gsap) return;
  if(!window.matchMedia('(hover: hover)').matches) return;
  var ring = document.querySelector('.hero-ring');
  if(!ring) return;
  var qx = gsap.quickTo(ring, 'x', {duration: 0.9, ease: 'power3.out'});
  var qy = gsap.quickTo(ring, 'y', {duration: 0.9, ease: 'power3.out'});
  document.querySelector('.hero').addEventListener('mousemove', function(e){
    var r = this.getBoundingClientRect();
    qx(((e.clientX - r.left) / r.width - 0.5) * 28);
    qy(((e.clientY - r.top) / r.height - 0.5) * 20);
  });
})();

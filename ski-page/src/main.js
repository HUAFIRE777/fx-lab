/* 雪线 SNOWLINE —— 滑雪装备落地页交互与渲染（classic 脚本，无 ESM） */
(function(){
'use strict';

/* ================= CONFIG：换主体 / 换商品 / 换雪场只改这里 ================= */
var CONFIG = {
  SITE: {
    brand: '雪线 SNOWLINE',
    organizer: '上海雪线户外运动有限公司',
    address: '上海市徐汇区漕溪北路 88 号圣爱大厦 1508 室',
    email: 'hello@snowline.example.com',
    phone: '400-820-2026',
    icp: '沪ICP备2026001234号-1（示例）'
  },
  heroStagger: 0.12,   // hero 逐行升起间隔（秒）
  revealMs: 800        // 区块 reveal 时长（毫秒）
};

var PRODUCTS = {
  boards: [
    {name:'山脊线 · 全地形板', desc:'中硬度板腰，刻滑粉雪一把抓，新手进阶不纠结。', price:'¥3,299', old:'¥3,899', tag:'热卖', art:'board'},
    {name:'深粉 · 粉雪板', desc:'加宽板头配燕尾，上浮像船一样稳。', price:'¥3,899', old:'', tag:'新品', art:'board'},
    {name:'街区 · 公园板', desc:'双头对称，跳台道具随便造，落地容错高。', price:'¥2,999', old:'', tag:'', art:'board'}
  ],
  apparel: [
    {name:'暴风雪 3L 冲锋衣', desc:'20000 防水压胶，-20℃ 山顶站十分钟不透风。', price:'¥1,899', old:'¥2,299', tag:'热卖', art:'apparel'},
    {name:'-20℃ 800 蓬羽绒服', desc:'缆车上穿它，排队不哆嗦，收纳后只有水杯大。', price:'¥2,299', old:'', tag:'新品', art:'apparel'}
  ],
  accessories: [
    {name:'硬壳固定器', desc:'铝合金底盘，响应直接，高速刻滑不泄力。', price:'¥1,099', old:'', tag:'', art:'binding'},
    {name:'磁吸雪镜', desc:'三秒换镜片，阴天晴天各一片，包里都配好。', price:'¥799', old:'¥999', tag:'热卖', art:'goggles'},
    {name:'雪盔 Air', desc:'320g 超轻，摔了不心疼——因为它替你疼了。', price:'¥699', old:'', tag:'', art:'helmet'}
  ]
};

var RESORTS = [
  {name:'崇礼云顶', loc:'河北 · 张家口', level:'初级友好', dots:2, depth:45, temp:'-8℃', cond:'机压雪道'},
  {name:'北大湖', loc:'吉林 · 吉林市', level:'中级进阶', dots:3, depth:68, temp:'-12℃', cond:'细粉雪'},
  {name:'将军山', loc:'新疆 · 阿勒泰', level:'野雪天堂', dots:5, depth:110, temp:'-15℃', cond:'天然粉雪'},
  {name:'峨眉山', loc:'四川 · 乐山', level:'南方雪场', dots:1, depth:30, temp:'-3℃', cond:'人造雪'}
];

var STORIES = [
  {who:'陈默', where:'崇礼云顶', text:'第一年摔了四十多次，第二年就能跟朋友下高级道了。板子是借的，勇气是自己的。'},
  {who:'林小雪', where:'阿勒泰将军山', text:'追到了人生第一场粉雪。板头扬起的雪雾，比照片里好看一百倍。'},
  {who:'老周', where:'吉林北大湖', text:'四十岁才开始学。膝盖不太听话，但雪镜后面的风景很听话。'}
];

var LEGAL = {
  privacy: {title:'隐私政策', body:
    '<h5>一、我们收集什么</h5>下单与领券时需要手机号（发券码、物流通知）；浏览行为仅做匿名统计，不关联个人身份。<h5>二、用来做什么</h5>只用于订单履约、券码发放与售后联系。不做用户画像，不卖数据。<h5>三、怎么保护</h5>传输全程加密，手机号脱敏存储，员工按最小权限访问。<h5>四、你的权利</h5>可随时要求查看、更正或删除你的个人信息，联系客服 3 个工作日内处理。<h5>五、未成年人</h5>未满 14 周岁请在监护人陪同下使用本页面。'},
  terms: {title:'服务条款', body:
    '<h5>一、商品与价格</h5>页面标价为人民币含税价，促销价以结算页为准，价格错误时我们有权取消订单并全额退款。<h5>二、早鸟券</h5>满 ¥2000 可用，不兑现、不找零，每手机号限领一张，11 月 30 日后失效。<h5>三、退换货</h5>30 天雪场实测退换：穿上雪道滑过仍不满意，吊牌齐全即可退（定制刻字除外）。<h5>四、配送</h5>48 小时内发出，雪季高峰可能延迟，延迟超 7 天可申请退款。<h5>五、责任边界</h5>滑雪是高风险运动，请佩戴护具并量力而行；因个人原因造成的运动伤害不在售后范围内。'},
  cookies: {title:'Cookie 政策', body:
    '<h5>一、我们用什么</h5>仅使用必要的本地存储：记住你的领券状态、偏好设置。<h5>二、不做什么</h5>不做跨站追踪，不接第三方广告 Cookie。<h5>三、怎么关</h5>可在浏览器设置中禁用本地存储，禁用后领券状态可能无法记住。<h5>四、有效期</h5>本地数据最长保留 12 个月，到期自动清除。'}
};

/* ================= 工具 ================= */
function $(s, c){ return (c||document).querySelector(s); }
function $all(s, c){ return Array.prototype.slice.call((c||document).querySelectorAll(s)); }
function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function mulberry32(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; var t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
var hasGsap = typeof window.gsap !== 'undefined';

/* ================= 页脚 SITE 渲染 ================= */
(function renderSite(){
  var S = CONFIG.SITE;
  var phone = $('[data-site="phone"]'), addr = $('[data-site="address"]'),
      mail = $('[data-site="email"]'), copy = $('[data-site="copyright"]');
  if (phone) phone.textContent = '电话 ' + S.phone;
  if (addr) addr.textContent = '地址 ' + S.address;
  if (mail) mail.textContent = '邮箱 ' + S.email;
  if (copy) copy.textContent = '© 2026 ' + S.organizer + ' · ' + S.icp;
})();

/* ================= 产品 SVG（程序化绘制，零外部图床） ================= */
function artSVG(kind, seed){
  var R = mulberry32(seed), ice='#7FCBE8', navy='#0C2237', white='#FFFFFF';
  var s = '<svg viewBox="0 0 200 150" aria-hidden="true">';
  if (kind === 'board'){
    var x = 78 + R()*30, rot = -8 + R()*8;
    s += '<g transform="rotate('+rot.toFixed(1)+' 100 75)">';
    s += '<rect x="'+x.toFixed(0)+'" y="8" width="30" height="134" rx="15" fill="'+navy+'" stroke="'+ice+'" stroke-width="2.5"/>';
    s += '<rect x="'+(x+8).toFixed(0)+'" y="26" width="14" height="70" rx="7" fill="'+ice+'" opacity=".85"/>';
    s += '<circle cx="'+(x+15).toFixed(0)+'" cy="112" r="6" fill="'+white+'" opacity=".9"/>';
    s += '</g>';
  } else if (kind === 'apparel'){
    s += '<path d="M78 22 L60 38 L52 96 L66 98 L70 60 L70 128 L86 132 L92 100 L108 100 L114 132 L130 128 L130 60 L134 98 L148 96 L140 38 L122 22 Q112 34 100 34 Q88 34 78 22 Z" fill="'+navy+'" stroke="'+ice+'" stroke-width="2.5" stroke-linejoin="round"/>';
    s += '<rect x="92" y="52" width="16" height="44" rx="8" fill="'+ice+'" opacity=".8"/>';
    s += '<circle cx="100" cy="18" r="9" fill="none" stroke="'+ice+'" stroke-width="2.5"/>';
  } else if (kind === 'binding'){
    s += '<rect x="52" y="92" width="96" height="26" rx="10" fill="'+navy+'" stroke="'+ice+'" stroke-width="2.5"/>';
    s += '<rect x="66" y="44" width="30" height="58" rx="12" fill="'+navy+'" stroke="'+ice+'" stroke-width="2.5"/>';
    s += '<rect x="104" y="60" width="30" height="42" rx="12" fill="none" stroke="'+white+'" stroke-width="2.5" opacity=".8"/>';
    s += '<circle cx="100" cy="105" r="8" fill="'+ice+'"/>';
  } else if (kind === 'goggles'){
    s += '<rect x="30" y="48" width="140" height="14" rx="7" fill="'+navy+'" stroke="'+ice+'" stroke-width="2"/>';
    s += '<rect x="52" y="58" width="88" height="52" rx="24" fill="'+ice+'" opacity=".9"/>';
    s += '<rect x="60" y="66" width="72" height="20" rx="10" fill="'+white+'" opacity=".35"/>';
    s += '<rect x="52" y="58" width="88" height="52" rx="24" fill="none" stroke="'+navy+'" stroke-width="2.5"/>';
  } else { /* helmet */
    s += '<path d="M56 108 Q56 52 100 52 Q144 52 144 108 L144 116 L56 116 Z" fill="'+navy+'" stroke="'+ice+'" stroke-width="2.5"/>';
    s += '<path d="M70 84 Q100 68 130 84" stroke="'+ice+'" stroke-width="4" fill="none" stroke-linecap="round"/>';
    s += '<rect x="56" y="108" width="88" height="8" rx="4" fill="'+ice+'"/>';
  }
  return s + '</svg>';
}

/* ================= 渲染：装备 / 雪场 / 故事 ================= */
(function renderCards(){
  $all('.grid.cards').forEach(function(grid, gi){
    var cat = grid.getAttribute('data-cat');
    var html = '';
    (PRODUCTS[cat]||[]).forEach(function(p, i){
      html += '<article class="card reveal">' +
        (p.tag ? '<span class="card-tag">'+esc(p.tag)+'</span>' : '') +
        '<div class="card-art">'+artSVG(p.art, gi*10+i+7)+'</div>' +
        '<div class="card-body"><h4 class="card-name">'+esc(p.name)+'</h4>' +
        '<p class="card-desc">'+esc(p.desc)+'</p>' +
        '<div class="card-foot"><span class="card-price">'+esc(p.price)+'</span>' +
        (p.old ? '<span class="card-old">'+esc(p.old)+'</span>' : '') + '</div></div></article>';
    });
    grid.innerHTML = html;
  });

  var rg = $('#resortGrid'), rh = '';
  RESORTS.forEach(function(r){
    var dots = '';
    for (var i=0;i<5;i++) dots += '<i class="'+(i<r.dots?'on':'')+'"></i>';
    rh += '<article class="resort-card reveal"><h4 class="resort-name">'+esc(r.name)+'</h4>' +
      '<p class="resort-loc">'+esc(r.loc)+'</p>' +
      '<div class="resort-diff"><span class="dots">'+dots+'</span><span>'+esc(r.level)+'</span></div>' +
      '<div class="snow-bar"><i data-w="'+Math.round(r.depth/120*100)+'"></i></div>' +
      '<div class="resort-meta"><span>雪深 <b>'+r.depth+'cm</b></span><span>气温 <b>'+esc(r.temp)+'</b></span></div>' +
      '<p class="resort-cond">雪况 · '+esc(r.cond)+'</p></article>';
  });
  rg.innerHTML = rh;

  var sg = $('#storyGrid'), sh = '';
  STORIES.forEach(function(t){
    sh += '<article class="story reveal"><p>'+esc(t.text)+'</p>' +
      '<div class="story-who"><span class="story-ava">'+esc(t.who.charAt(0))+'</span>' +
      '<div><b>'+esc(t.who)+'</b><small>'+esc(t.where)+'</small></div></div></article>';
  });
  sg.innerHTML = sh;
})();

/* ================= HERO：雪山多层视差 + 飘雪粒子（整页唯一主视觉动效） ================= */
(function hero(){
  var canvas = $('#heroCanvas'), heroEl = $('#hero');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  var W=0, H=0, dpr=1, layers=[], stars=[], flakes=[], clouds=[], skyGrad=null;
  var mx=0, mxT=0, my=0, myT=0, scrollY=0, running=true, frames=0, started=false;
  var ICE='#7FCBE8', WHITE='#FFFFFF';

  function build(){
    dpr = Math.min(window.devicePixelRatio||1, 2);
    W = heroEl.clientWidth; H = heroEl.clientHeight;
    canvas.width = Math.round(W*dpr); canvas.height = Math.round(H*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);

    skyGrad = ctx.createLinearGradient(0,0,0,H);
    skyGrad.addColorStop(0,'#081627'); skyGrad.addColorStop(.62,'#0E2740'); skyGrad.addColorStop(1,'#123049');

    var R = mulberry32(20261005);
    stars = [];
    for (var i=0;i<130;i++) stars.push({x:R(), y:R()*.55, r:.4+R()*1.4, p:R()*6.28, s:.6+R()*1.6});

    var defs = [
      {base:.66, amp:.10, n:5, col:'#2A4A66', snowA:.28, pf:.012, sf:.03},
      {base:.74, amp:.12, n:6, col:'#1C3651', snowA:.45, pf:.026, sf:.06},
      {base:.83, amp:.14, n:7, col:'#142A44', snowA:.65, pf:.045, sf:.11},
      {base:.93, amp:.13, n:8, col:'#0C2237', snowA:.85, pf:.07,  sf:.17}
    ];
    layers = defs.map(function(d, li){
      var rr = mulberry32(9000+li), pts=[], n=d.n;
      for (var k=0;k<=n;k++){
        var y = d.base - rr()*d.amp;
        if (k>0 && k<n) y = (y + pts[k-1].y)/2 + (rr()-.5)*d.amp*.35; // 邻域平滑，山脊更自然
        pts.push({x:k/n, y:y});
      }
      var peaks=[];
      for (var m=1;m<n;m++) if (pts[m].y<pts[m-1].y && pts[m].y<pts[m+1].y) peaks.push(pts[m]);
      peaks.sort(function(a,b){return a.y-b.y;});
      return {pts:pts, peaks:peaks.slice(0,3), base:d.base, col:d.col, snowA:d.snowA, pf:d.pf, sf:d.sf, R:rr};
    });

    clouds = [];
    for (var c=0;c<3;c++) clouds.push({x:R(), y:.14+R()*.2, s:.7+R()*.9, v:.00012+R()*.0002});

    flakes = [];
    for (var f=0;f<170;f++) flakes.push({x:R(), y:R(), r:.8+R()*2.6, sp:.0009+R()*.0022, ph:R()*6.28, dr:.3+R()*.9});
  }

  function drawRidge(L, t){
    var ox = mx*L.pf*W, oy = scrollY*L.sf;
    var pts = L.pts.map(function(p){ return {x:(p.x*W+ox+W)%(W*1.2)-W*.1, y:p.y*H+oy}; });
    ctx.beginPath();
    ctx.moveTo(-W*.1, H+40);
    pts.forEach(function(p){ ctx.lineTo(p.x, p.y); });
    ctx.lineTo(W*1.1, H+40); ctx.closePath();
    ctx.fillStyle = L.col; ctx.fill();

    /* 雪顶：给最高的几个峰戴雪帽 */
    ctx.fillStyle = WHITE;
    ctx.globalAlpha = L.snowA;
    L.peaks.forEach(function(pk){
      var px=(pk.x*W+ox+W)%(W*1.2)-W*.1, py=pk.y*H+oy;
      var w=26+L.R()*44, h=16+L.R()*26;
      ctx.beginPath();
      ctx.moveTo(px-w, py+h); ctx.lineTo(px-w*.35, py+h*.55);
      ctx.lineTo(px, py); ctx.lineTo(px+w*.35, py+h*.6); ctx.lineTo(px+w, py+h);
      ctx.closePath(); ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  function draw(t){
    ctx.fillStyle = skyGrad; ctx.fillRect(0,0,W,H);

    /* 星空 */
    var i, s;
    for (i=0;i<stars.length;i++){
      s = stars[i];
      ctx.globalAlpha = .25 + .55*Math.abs(Math.sin(t*.0004*s.s + s.p));
      ctx.fillStyle = WHITE;
      ctx.beginPath(); ctx.arc(s.x*W, s.y*H, s.r, 0, 6.283); ctx.fill();
    }
    ctx.globalAlpha = 1;

    /* 月亮 + 光晕 */
    var mX=W*.8, mY=H*.2;
    var glow = ctx.createRadialGradient(mX,mY,8,mX,mY,90);
    glow.addColorStop(0,'rgba(127,203,232,.5)'); glow.addColorStop(1,'rgba(127,203,232,0)');
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(mX,mY,90,0,6.283); ctx.fill();
    ctx.fillStyle = '#EAF6FB'; ctx.beginPath(); ctx.arc(mX,mY,30,0,6.283); ctx.fill();
    ctx.fillStyle = 'rgba(12,34,55,.12)'; ctx.beginPath(); ctx.arc(mX-9,mY-6,7,0,6.283); ctx.fill();
    ctx.beginPath(); ctx.arc(mX+8,mY+9,5,0,6.283); ctx.fill();

    /* 云 */
    ctx.fillStyle = 'rgba(255,255,255,.055)';
    clouds.forEach(function(c){
      c.x += c.v; if (c.x>1.25) c.x=-.25;
      var cx=c.x*W, cy=c.y*H, sc=c.s;
      ctx.beginPath();
      ctx.ellipse(cx,cy,120*sc,20*sc,0,0,6.283);
      ctx.ellipse(cx-70*sc,cy+8*sc,70*sc,14*sc,0,0,6.283);
      ctx.ellipse(cx+70*sc,cy+8*sc,70*sc,14*sc,0,0,6.283);
      ctx.fill();
    });

    /* 山体远→近 */
    layers.forEach(function(L){ drawRidge(L, t); });

    /* 缆车：最近山层的索道剪影 */
    (function(){
      var oy = scrollY*layers[3].sf, y0=H*.60+oy, y1=H*.86+oy;
      ctx.strokeStyle='rgba(234,246,251,.28)'; ctx.lineWidth=1.6;
      ctx.beginPath(); ctx.moveTo(W*.06,y0); ctx.lineTo(W*.94,y1); ctx.stroke();
      [.22,.55,.84].forEach(function(fx){
        var cx=W*(.06+.88*fx), cy=y0+(y1-y0)*fx;
        ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx,cy+13); ctx.stroke();
        ctx.fillStyle='rgba(234,246,251,.34)';
        ctx.fillRect(cx-8,cy+13,16,10);
      });
    })();

    /* 飘雪 */
    for (i=0;i<flakes.length;i++){
      var f = flakes[i];
      f.y += f.sp; if (f.y>1.02){ f.y=-.02; f.x=Math.random(); }
      var fx = (f.x + Math.sin(t*.001*f.dr + f.ph)*.012 + .5)%1;
      ctx.globalAlpha = .35 + .5*(f.r/3.4);
      ctx.fillStyle = WHITE;
      ctx.beginPath(); ctx.arc(fx*W, f.y*H, f.r, 0, 6.283); ctx.fill();
    }
    ctx.globalAlpha = 1;

    /* hero 文案随滚动轻微上浮淡出 */
    var hc = $('.hero-copy');
    if (hc){
      var p = Math.min(scrollY/Math.max(H*.8,1), 1);
      hc.style.transform = 'translateY('+(p*90)+'px)';
      hc.style.opacity = String(1-p*.85);
    }
  }

  function loop(t){
    if (running && !document.hidden){
      mx += (mxT-mx)*.06; my += (myT-my)*.06;
      draw(t||0);
      if (!started && ++frames>2){ started=true; heroReady(); }
    }
    requestAnimationFrame(loop);
  }

  function heroReady(){
    var loader = $('#heroLoader');
    if (loader){
      loader.style.opacity='0';
      setTimeout(function(){ loader.style.display='none'; }, 650);
    }
    /* 标题逐行升起：先清 CSS 初值再交 GSAP（防百分比被烘成 px 残留） */
    var lines = $all('.hero .rl-line');
    if (hasGsap && lines.length){
      lines.forEach(function(el){ el.style.transform='none'; });
      gsap.set(lines, {yPercent:112});
      gsap.to(lines, {yPercent:0, duration:1.05, ease:'power3.out',
        stagger:CONFIG.heroStagger,
        onComplete:function(){
          document.documentElement.classList.add('hero-in'); /* 完成态覆盖兜住 */
          gsap.set(lines, {clearProps:'all'});
        }});
    } else {
      document.documentElement.classList.add('hero-in');
    }
  }

  heroEl.addEventListener('mousemove', function(e){
    var r = heroEl.getBoundingClientRect();
    mxT = (e.clientX-r.left)/r.width - .5;
    myT = (e.clientY-r.top)/r.height - .5;
  });
  window.addEventListener('scroll', function(){ scrollY = window.scrollY||0; }, {passive:true});
  window.addEventListener('resize', build);
  if ('IntersectionObserver' in window){
    new IntersectionObserver(function(es){ es.forEach(function(e){ running = e.isIntersecting; }); }, {threshold:0}).observe(heroEl);
  }
  build(); requestAnimationFrame(loop);
  setTimeout(function(){ if(!started){ started=true; heroReady(); } }, 4000); /* 兜底：4s 必达完成态 */
})();

/* ================= 导航：滚动毛玻璃 / 汉堡抽屉 ================= */
(function nav(){
  var navEl=$('#nav'), burger=$('#burger'), drawer=$('#drawer'), mask=$('#drawerMask');
  function onScroll(){ navEl.classList.toggle('scrolled', (window.scrollY||0)>40); }
  window.addEventListener('scroll', onScroll, {passive:true}); onScroll();
  function openDrawer(o){
    drawer.classList.toggle('open', o); mask.classList.toggle('open', o);
    document.body.classList.toggle('lock', o);
    burger.setAttribute('aria-expanded', o?'true':'false');
  }
  burger.addEventListener('click', function(){ openDrawer(!drawer.classList.contains('open')); });
  $('#drawerClose').addEventListener('click', function(){ openDrawer(false); });
  mask.addEventListener('click', function(){ openDrawer(false); });
  $all('.drawer-links a, .drawer-cta').forEach(function(a){
    a.addEventListener('click', function(){ openDrawer(false); });
  });
})();

/* ================= 区块 reveal + 雪深条 ================= */
(function reveal(){
  var els = $all('.reveal');
  if (!('IntersectionObserver' in window) || !hasGsap){
    els.forEach(function(el){ el.style.opacity='1'; el.style.transform='none'; });
    $all('.snow-bar i').forEach(function(b){ b.style.width=b.getAttribute('data-w')+'%'; });
    return;
  }
  var io = new IntersectionObserver(function(es){
    es.forEach(function(e){
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      var el = e.target;
      var idx = Array.prototype.indexOf.call(el.parentNode.children, el);
      gsap.to(el, {opacity:1, y:0, duration:CONFIG.revealMs/1000, ease:'power3.out', delay:(idx%3)*.08,
        onComplete:function(){
          $all('.snow-bar i', el).forEach(function(b){
            gsap.to(b, {width:b.getAttribute('data-w')+'%', duration:1.1, ease:'power2.out'});
          });
        }});
    });
  }, {threshold:.12});
  els.forEach(function(el){ io.observe(el); });
})();

/* ================= 早鸟券 ================= */
(function coupon(){
  var form=$('#couponForm'), input=$('#couponPhone'), tip=$('#couponTip'),
      btn=$('#couponBtn'), code=$('#ticketCode');
  if (!form) return;
  form.addEventListener('submit', function(e){
    e.preventDefault();
    var v = input.value.trim();
    tip.classList.remove('err'); input.classList.remove('err');
    if (!/^1[3-9]\d{9}$/.test(v)){
      input.classList.add('err'); tip.classList.add('err');
      tip.textContent = '手机号好像少了位，再检查一下。';
      setTimeout(function(){ input.classList.remove('err'); }, 600);
      return;
    }
    var chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789', c='';
    for (var i=0;i<6;i++) c += chars.charAt(Math.floor(Math.random()*chars.length));
    code.textContent = 'SNOW-'+c;
    tip.textContent = '券码已生成，短信稍后送达。雪季见！';
    btn.textContent = '已领取'; btn.disabled = true; input.disabled = true;
    if (hasGsap) gsap.fromTo('.ticket', {scale:.94, rotate:3}, {scale:1, rotate:0, duration:.7, ease:'back.out(2)'});
  });
})();

/* ================= 法务三件套：弹窗 ================= */
(function legal(){
  var mask=$('#modalMask'), modal=$('#modal'), title=$('#modalTitle'), body=$('#modalBody'), lastFocus=null;
  function open(key){
    var d = LEGAL[key]; if (!d) return;
    lastFocus = document.activeElement;
    title.textContent = d.title; body.innerHTML = d.body;
    mask.classList.add('open'); modal.classList.add('open');
    document.body.classList.add('lock');
    $('#modalClose').focus();
  }
  function close(){
    mask.classList.remove('open'); modal.classList.remove('open');
    document.body.classList.remove('lock');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  $all('[data-modal]').forEach(function(b){ b.addEventListener('click', function(){ open(b.getAttribute('data-modal')); }); });
  $('#modalClose').addEventListener('click', close);
  mask.addEventListener('click', close);
  document.addEventListener('keydown', function(e){ if (e.key==='Escape' && modal.classList.contains('open')) close(); });
})();

})();

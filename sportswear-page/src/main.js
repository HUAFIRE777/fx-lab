/* sportswear-page · 锐行 RUSHLINE · src/main.js (classic, 打包内联)
 * 纯程序化视觉：跑鞋/服饰 SVG 全部手写路径，零外部请求。
 */
(function(){
"use strict";
var $=function(s,c){return (c||document).querySelector(s)};
var $$=function(s,c){return Array.prototype.slice.call((c||document).querySelectorAll(s))};

/* ================= 配置（买家改这里） ================= */
var SITE={
  name:"锐行 RUSHLINE",
  phone:"400-820-6688",
  email:"hello@rushline.example",
  address:"上海市杨浦区锐行大厦 8 层",
  hours:"周一至周日 9:00–21:00",
  icp:"沪ICP备00000000号-0",
  year:"2026"
};
var CFG={
  loaderMin:900,        // loader 最短展示 ms
  revealThreshold:0.12, // reveal 触发阈值
  safetyMs:4000,        // reveal 安全网：超时未点亮一律点亮
  lines:64              // hero 速度线粒子数
};
var LEGAL={
  privacy:{title:"隐私政策",body:[
    ["我们收集什么","注册会员时，你填写的姓名与手机号仅用于发放会员码与订单通知。我们不会收集与跑步无关的信息。"],
    ["数据存在哪","数据存储在境内服务器，访问需双因素鉴权。离职员工账号当日即注销。"],
    ["你的权利","你可随时联系客服要求查看、更正或删除你的个人信息，我们在 15 个工作日内处理完毕。"]
  ]},
  terms:{title:"服务条款",body:[
    ["退换","所有鞋服支持 30 天无理由退换（不影响二次销售）。跑鞋路测磨损不影响退换——我们相信自己的鞋。"],
    ["会员","会员码仅限本人使用，首单 8 折不可与生日月 7 折叠加。旧鞋回收抵扣金额以门店评估为准。"],
    ["课程","线下训练课免费，会员优先锁位；开课前 2 小时未到视为放弃，当日名额释放给候补。"]
  ]},
  cookie:{title:"Cookie 政策",body:[
    ["我们用什么","本站仅使用维持登录态与记住尺码偏好的必要 Cookie，不做跨站追踪，不接第三方广告 SDK。"],
    ["怎么关","你可以在浏览器设置中禁用 Cookie，但会员登录与购物车功能将无法使用。"]
  ]}
};

/* 站点变量绑定 */
$$("[data-site]").forEach(function(el){
  var k=el.getAttribute("data-site");
  if(SITE[k]!=null) el.textContent=SITE[k];
});

/* ================= 程序化 SVG：跑鞋 =================
 * 手写侧视跑鞋路径，variant 控制配色/细节。
 */
function shoeSVG(v){
  v=v||{};
  var accent=v.accent||"#ff4d00";      // 点缀色
  var upper=v.upper||"#232323";        // 鞋面
  var sole=v.sole||"#f2f2f2";          // 中底
  var dark=v.dark||"#101010";
  var laces="";
  for(var i=0;i<4;i++){
    var x=196+i*20;
    laces+='<line x1="'+x+'" y1="'+(86+i*2)+'" x2="'+(x+26)+'" y2="'+(112+i*2)+'" stroke="#e8e8e8" stroke-width="5" stroke-linecap="round"/>';
  }
  var dots="";
  if(v.pattern==="dots"){
    for(var d=0;d<8;d++){
      dots+='<circle cx="'+(90+d*14)+'" cy="'+(120+((d%2)*8))+'" r="3.5" fill="'+accent+'" opacity=".8"/>';
    }
  }
  var stripes="";
  if(v.pattern==="stripes"){
    stripes='<path d="M120 92 L150 88 L118 162 L92 164 Z" fill="'+accent+'" opacity=".85"/>'
          +'<path d="M160 86 L182 84 L152 166 L132 167 Z" fill="'+accent+'" opacity=".55"/>';
  }
  return '<svg viewBox="0 0 360 240" class="shoe" aria-hidden="true">'
    +'<ellipse cx="182" cy="212" rx="142" ry="11" fill="#000" opacity=".4"/>'
    // 中底
    +'<path d="M40 160 C120 176 250 176 340 162 L332 192 C322 204 298 210 268 212 L112 212 C78 212 52 196 40 160 Z" fill="'+sole+'"/>'
    // 中底橙色速度条
    +'<path d="M48 166 C130 180 246 180 332 168 L330 178 C244 190 132 190 52 176 Z" fill="'+accent+'"/>'
    // 气垫窗
    +'<rect x="66" y="182" width="52" height="16" rx="8" fill="'+accent+'" opacity=".9"/>'
    // 鞋面
    +'<path d="M50 160 C56 116 88 90 136 82 L170 76 C216 68 260 80 298 106 C318 120 332 142 338 162 C250 172 140 172 50 160 Z" fill="'+upper+'"/>'
    // 后跟
    +'<path d="M50 160 C56 116 74 98 100 90 L96 162 C80 162 62 161 50 160 Z" fill="'+dark+'"/>'
    // 鞋头盖
    +'<path d="M296 108 C318 122 332 142 338 162 L300 166 C296 146 292 126 296 108 Z" fill="'+dark+'" opacity=".8"/>'
    // 速度斜纹
    +'<path d="M196 76 L232 74 L196 168 L164 168 Z" fill="'+accent+'"/>'
    +stripes+dots
    // 鞋带区 + 鞋带
    +'<path d="M186 80 L282 116 L262 142 L172 104 Z" fill="#0d0d0d" opacity=".55"/>'+laces
    // 鞋领
    +'<path d="M96 92 C110 80 136 74 158 74 C140 84 122 96 112 110 Z" fill="#0d0d0d"/>'
    // 侧面品牌字
    +'<text x="118" y="148" font-size="17" font-weight="900" letter-spacing="4" fill="#fff" opacity=".92" font-family="Arial,sans-serif">RUSH</text>'
    +'</svg>';
}
function apparelSVG(kind,accent){
  accent=accent||"#ff4d00";
  var inner="";
  if(kind==="tee"){
    inner='<path d="M118 46 L158 28 C168 38 192 38 202 28 L242 46 L276 82 L246 100 L240 206 L120 206 L114 100 L84 82 Z" fill="#232323"/>'
      +'<path d="M158 28 C168 38 192 38 202 28 L198 44 C188 50 172 50 162 44 Z" fill="#0d0d0d"/>'
      +'<path d="M196 70 L224 68 L206 150 L182 150 Z" fill="'+accent+'"/>'
      +'<text x="150" y="190" font-size="14" font-weight="900" letter-spacing="3" fill="#fff" font-family="Arial,sans-serif">RUSHLINE</text>';
  }else if(kind==="jacket"){
    inner='<path d="M124 40 L160 26 L200 26 L236 40 L272 78 L244 96 L240 210 L120 210 L116 96 L88 78 Z" fill="#232323"/>'
      +'<path d="M160 26 L200 26 L196 52 L164 52 Z" fill="#0d0d0d"/>'
      +'<rect x="177" y="52" width="6" height="158" fill="'+accent+'"/>'
      +'<path d="M120 210 L240 210 L236 224 L124 224 Z" fill="'+accent+'" opacity=".85"/>'
      +'<text x="196" y="120" font-size="13" font-weight="900" letter-spacing="2" fill="#fff" font-family="Arial,sans-serif">RUSH</text>';
  }else{ // shorts
    inner='<path d="M118 44 L242 44 L258 190 L198 190 L182 108 L178 108 L162 190 L102 190 Z" fill="#232323"/>'
      +'<rect x="118" y="44" width="124" height="18" fill="#0d0d0d"/>'
      +'<path d="M150 62 L168 62 L160 150 L144 150 Z" fill="'+accent+'"/>'
      +'<text x="196" y="100" font-size="12" font-weight="900" letter-spacing="2" fill="#fff" font-family="Arial,sans-serif">RUSH</text>';
  }
  return '<svg viewBox="0 0 360 240" aria-hidden="true"><ellipse cx="180" cy="216" rx="100" ry="9" fill="#000" opacity=".4"/>'+inner+'</svg>';
}
/* 社交图标（inline SVG 手写） */
var SOCIAL={
  weibo:'<svg viewBox="0 0 24 24"><path d="M10.1 20.9c-3.9 0-6.6-2-6.6-4.9 0-1.4.7-2.7 1.9-3.5-.3 2.6 1.3 4.9 4.3 4.9 2.5 0 4.4-1.5 4.4-3.5 0-2-1.9-3.5-4.5-3.5-.6 0-1.2.1-1.7.2.5-2.9 2.9-5.1 6-5.1 3.4 0 5.9 2.3 5.9 5.4 0 3.5-3.3 10-9.7 10zM20 4.5a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8zM17.5 2a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/></svg>',
  wechat:'<svg viewBox="0 0 24 24"><path d="M9.5 4C5.4 4 2 6.9 2 10.5c0 2 1.1 3.8 2.9 5l-.7 2.3 2.6-1.3c.9.2 1.7.4 2.7.4h.3C9.4 15.4 9 14 9 12.6 9 9.2 12 6.5 15.9 6.2 14.2 4.7 12 4 9.5 4zm7.4 6.2c-3.2 0-5.9 2.2-5.9 5 0 2.8 2.7 5 5.9 5 .7 0 1.4-.1 2-.3l2 1-.5-1.8c1.4-1 2.3-2.4 2.3-3.9 0-2.8-2.6-5-5.8-5zM8 8.6c.6 0 1 .4 1 1s-.4 1-1 1-1-.4-1-1 .4-1 1-1zm4.5 0c.6 0 1 .4 1 1s-.4 1-1 1-1-.4-1-1 .4-1 1-1zm3.5 4.9c.5 0 .8.3.8.8s-.3.8-.8.8-.8-.3-.8-.8.3-.8.8-.8zm3.5 0c.5 0 .8.3.8.8s-.3.8-.8.8-.8-.3-.8-.8.3-.8.8-.8z"/></svg>',
  douyin:'<svg viewBox="0 0 24 24"><path d="M16.6 3c.4 2.1 1.8 3.6 4 3.9v3c-1.6 0-3-.5-4-1.3v6.6c0 3.7-2.6 6.3-6.1 6.3-3.4 0-6-2.6-6-6 0-3.3 2.7-5.9 6.2-5.9.3 0 .7 0 1 .1v3.1c-.3-.1-.6-.2-1-.2-1.7 0-3 1.3-3 3 0 1.7 1.3 3 3 3 1.8 0 3.1-1.4 3.1-3.3V3h2.8z"/></svg>',
  xiaohongshu:'<svg viewBox="0 0 24 24"><path d="M12 2l2.6 6.9H21l-5.4 4.3 2 7.3-5.6-4-5.6 4 2-7.3L3 8.9h6.4L12 2z"/></svg>'
};
$$("[data-soc]").forEach(function(a){
  var k=a.getAttribute("data-soc");
  if(SOCIAL[k]) a.innerHTML=SOCIAL[k];
});

/* ================= 数据 ================= */
var PRODUCTS=[
  {name:"疾影 3 代",en:"RUSH 3 · 全掌碳板",cat:"竞速跑鞋",price:899,old:1099,badge:"新品首发",v:{accent:"#ff4d00",pattern:"stripes"}},
  {name:"城市微风",en:"BREEZE · 日常慢跑",cat:"慢跑鞋",price:549,old:649,badge:"热卖",v:{accent:"#ffffff",pattern:"dots",upper:"#2a2a2a"}},
  {name:"拓荒者 TRAIL X",en:"越野防滑大底",cat:"越野跑鞋",price:729,old:829,badge:"",v:{accent:"#ff4d00",upper:"#1a1a1a",sole:"#3a3a3a"}},
  {name:"速干训练 Tee",en:"DRY-FAST 速干",cat:"运动服饰",price:169,old:199,badge:"",kind:"tee"},
  {name:"防风跑步夹克",en:"WIND-SHELL 防风",cat:"运动服饰",price:429,old:529,badge:"秋冬推荐",kind:"jacket"},
  {name:"压缩五分裤",en:"COMPRESSION 压缩",cat:"运动服饰",price:249,old:299,badge:"",kind:"shorts"}
];
var MATRIX=[
  {name:"疾影 3 代",cat:"竞速跑鞋",price:899,specs:["全掌碳板 · 推进感拉满","氮气中底 · 回弹率 87%","单只 198g · 轻若无物"],v:{accent:"#ff4d00",pattern:"stripes"}},
  {name:"城市微风",cat:"日常慢跑",price:549,specs:["加厚缓震 · 膝盖友好","透气网面 · 夏天不闷脚","后跟稳定器 · 防崴脚"],v:{accent:"#ffffff",pattern:"dots",upper:"#2a2a2a"}},
  {name:"速干训练 Tee",cat:"运动服饰",price:169,specs:["30 分钟速干 · 不贴身","腋下透气网 · 散热快","反光条 · 夜跑看得见"],kind:"tee"},
  {name:"防风跑步夹克",cat:"运动服饰",price:429,specs:["防风拒水 · 小雨照跑","可收纳风帽 · 一秒变形","胸前暗袋 · 装得下手机"],kind:"jacket"}
];
var TRAIN=[
  {tab:"跑步",courses:[
    ["城市晨跑团","05:30 集合 · 奥体公园南门","60 分钟","2","剩 12 位","王教练 · 全马 2:47"],
    ["间歇跑提速课","19:00 · 锐行训练基地","75 分钟","3","剩 6 位","李教练 · 前省队中长跑"],
    ["周日 LSD 长距离","07:00 · 江畔绿道","120 分钟","2","剩 20 位","王教练 · 全马 2:47"]
  ]},
  {tab:"力量",courses:[
    ["跑者核心强化","18:30 · 锐行训练基地","45 分钟","2","剩 8 位","陈教练 · NSCA 认证"],
    ["下肢爆发力","19:30 · 锐行训练基地","50 分钟","3","剩 5 位","陈教练 · NSCA 认证"],
    ["上肢塑形","12:15 · 午间快闪课","30 分钟","1","剩 15 位","赵教练 · 团课 6 年"]
  ]},
  {tab:"瑜伽",courses:[
    ["晨间流瑜伽","07:00 · 屋顶花园","60 分钟","1","剩 10 位","林老师 · RYT500"],
    ["跑者专项拉伸","20:00 · 锐行训练基地","40 分钟","1","剩 14 位","林老师 · RYT500"],
    ["深度放松修复","21:00 · 烛光教室","50 分钟","1","剩 9 位","苏老师 · 理疗瑜伽"]
  ]},
  {tab:"篮球",courses:[
    ["3v3 对抗赛","19:00 · 街头球场 A 区","90 分钟","3","剩 4 位","大刘 · 业余联赛 MVP"],
    ["投篮特训","17:30 · 室内馆","60 分钟","2","剩 7 位","大刘 · 业余联赛 MVP"],
    ["体能专项","08:00 · 周末特训","75 分钟","3","剩 6 位","陈教练 · NSCA 认证"]
  ]}
];
var STORIES=[
  {n:"陈默",tag:"32 岁 · 程序员 · 首马 4:12",init:"陈",q:"去年这个时候我还跑不完 5 公里。今年首马 4 小时 12 分，冲线那一刻，我原谅了所有加班。",s1:["220","km/月跑量"],s2:["42","首马公里数"]},
  {n:"林晓雨",tag:"26 岁 · 夜跑团团长",init:"林",q:"跑步是我每天和自己开的会，不请假、不迟到。团里 80 个人，一半是被我硬拉下楼的。",s1:["80","人跑团规模"],s2:["3","年团长资历"]},
  {n:"大刘",tag:"41 岁 · 越野跑玩家",init:"刘",q:"山里没有 KPI，只有下一座山。穿拓荒者翻过 14 座山，鞋底磨平了，人还没磨平。",s1:["14","座翻越山峰"],s2:["96","km 最长单次"]}
];
var MQ=["疾影 3 全掌碳板","30 天无理由退","120+ 城市跑团","氮气中底 87% 回弹","旧鞋回收抵 100 元","每周 300+ 免费训练课"];

/* ================= 渲染 ================= */
function esc(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;");}
/* hero 主视觉鞋 */
var heroSlot=$('[data-shoe="hero"]');
if(heroSlot) heroSlot.innerHTML=shoeSVG({accent:"#ff4d00",pattern:"stripes"});
/* 跑马灯 */
var mq=$("#mqTrack");
if(mq){var items=MQ.map(function(t){return "<span>"+esc(t)+"</span>"}).join("");mq.innerHTML=items+items;}
/* 新品轮播 */
var rail=$("#rail");
if(rail){
  rail.innerHTML=PRODUCTS.map(function(p){
    var art=p.kind?apparelSVG(p.kind):shoeSVG(p.v);
    return '<article class="pcard">'
      +'<div class="pv">'+(p.badge?'<span class="pbadge">'+esc(p.badge)+"</span>":"")+art+"</div>"
      +'<div class="pi"><h3>'+esc(p.name)+'</h3><div class="cat">'+esc(p.en)+"</div>"
      +'<div class="row"><span class="price">¥'+p.price+"<small>¥"+p.old+"</small></span>"
      +'<button class="mini-btn" type="button">选购</button></div></div></article>';
  }).join("");
}
/* 翻转矩阵 */
var matrix=$("#matrix");
if(matrix){
  matrix.innerHTML=MATRIX.map(function(m){
    var art=m.kind?apparelSVG(m.kind):shoeSVG(m.v);
    return '<div class="flip"><div class="flip-inner">'
      +'<div class="flip-face"><div class="fv">'+art+'</div><h3>'+esc(m.name)+'</h3><div class="cat">'+esc(m.cat)+"</div></div>"
      +'<div class="flip-face flip-back"><h3>'+esc(m.name)+"</h3><ul>"
      +m.specs.map(function(s){return "<li>"+esc(s)+"</li>"}).join("")
      +'</ul><div class="price">¥'+m.price+'</div></div>'
      +"</div></div>";
  }).join("");
}
/* 训练 tab */
var tabsEl=$("#tabs"),panelsEl=$("#panels");
if(tabsEl&&panelsEl){
  tabsEl.innerHTML=TRAIN.map(function(t,i){
    return '<button class="tab'+(i===0?" active":"")+'" role="tab" aria-selected="'+(i===0)+'" data-i="'+i+'" type="button">'+esc(t.tab)+"</button>";
  }).join("");
  panelsEl.innerHTML=TRAIN.map(function(t,i){
    return '<div class="panel'+(i===0?" active":"")+'" role="tabpanel">'
      +t.courses.map(function(c){
        var bars="";for(var b=1;b<=3;b++) bars+='<i class="'+(b<=+c[3]?"on":"")+'"></i>';
        return '<div class="course"><div><h4>'+esc(c[0])+'</h4><div class="coach">'+esc(c[5])+'</div></div>'
          +'<div class="meta"><small>时间地点</small>'+esc(c[1])+"</div>"
          +'<div class="meta"><small>时长</small>'+esc(c[2])+"</div>"
          +'<div class="meta"><small>强度</small><span class="intensity">'+bars+"</span></div>"
          +'<div class="spots">剩余 <b>'+esc(c[4].replace("剩 ","").replace(" 位",""))+'</b> 位</div>'
          +"</div>";
      }).join("")+"</div>";
  }).join("");
  $$(".tab",tabsEl).forEach(function(btn){
    btn.addEventListener("click",function(){
      $$(".tab",tabsEl).forEach(function(b){b.classList.remove("active");b.setAttribute("aria-selected","false")});
      $$(".panel",panelsEl).forEach(function(p){p.classList.remove("active")});
      btn.classList.add("active");btn.setAttribute("aria-selected","true");
      panelsEl.children[+btn.getAttribute("data-i")].classList.add("active");
    });
  });
}
/* 故事墙 */
var sg=$("#storiesGrid");
if(sg){
  sg.innerHTML=STORIES.map(function(s){
    return '<article class="story"><div class="who"><div class="ava">'+esc(s.init)+"</div>"
      +"<div><b>"+esc(s.n)+"</b><span>"+esc(s.tag)+"</span></div></div>"
      +"<blockquote>"+esc(s.q)+"</blockquote>"
      +'<div class="stat"><div><b>'+esc(s.s1[0])+"</b><span>"+esc(s.s1[1])+'</span></div>'
      +"<div><b>"+esc(s.s2[0])+"</b><span>"+esc(s.s2[1])+"</span></div></div></article>";
  }).join("");
}

/* ================= 导航 / 抽屉 ================= */
var nav=$("#nav"),burger=$("#burger"),drawer=$("#drawer"),scrim=$("#scrim");
function onScroll(){nav.classList.toggle("scrolled",window.scrollY>24)}
window.addEventListener("scroll",onScroll,{passive:true});onScroll();
function setDrawer(open){
  drawer.classList.toggle("open",open);scrim.classList.toggle("show",open);
  document.body.classList.toggle("locked",open);
  burger.setAttribute("aria-expanded",open);
}
burger.addEventListener("click",function(){setDrawer(!drawer.classList.contains("open"))});
scrim.addEventListener("click",function(){setDrawer(false)});
$$("#drawer a").forEach(function(a){a.addEventListener("click",function(){setDrawer(false)})});

/* ================= 法务弹窗（三通道关闭） ================= */
var modal=$("#legalModal"),legalTitle=$("#legalTitle"),legalBody=$("#legalBody"),lastFocus=null;
function openLegal(key){
  var d=LEGAL[key];if(!d)return;
  legalTitle.textContent=d.title;
  legalBody.innerHTML=d.body.map(function(sec){
    return "<h4>"+esc(sec[0])+"</h4><p>"+esc(sec[1])+"</p>";
  }).join("");
  lastFocus=document.activeElement;
  modal.hidden=false;
  requestAnimationFrame(function(){requestAnimationFrame(function(){modal.classList.add("open")})});
  var x=$(".x",modal);if(x)x.focus();
}
function closeLegal(){
  modal.classList.remove("open");setTimeout(function(){modal.hidden=true},320);
  if(lastFocus&&lastFocus.focus)lastFocus.focus();
}
$$("[data-legal]").forEach(function(b){b.addEventListener("click",function(){openLegal(b.getAttribute("data-legal"))})});
$$("[data-close]",modal).forEach(function(b){b.addEventListener("click",closeLegal)});
document.addEventListener("keydown",function(e){
  if(e.key==="Escape"&&!modal.hidden)closeLegal();
  if(e.key==="Escape"&&drawer.classList.contains("open"))setDrawer(false);
});

/* ================= 滚动 reveal + 安全网 ================= */
function revealAll(){$$("[data-reveal]").forEach(function(el){el.classList.add("in")})}
if("IntersectionObserver" in window){
  var io=new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if(en.isIntersecting){en.target.classList.add("in");io.unobserve(en.target)}
    });
  },{threshold:CFG.revealThreshold,rootMargin:"0px 0px -8% 0px"});
  $$("[data-reveal]").forEach(function(el){io.observe(el)});
}else{revealAll()}
setTimeout(revealAll,CFG.safetyMs); /* 4s 安全网：完成态必达 */

/* ================= Hero：速度线粒子 + 入场 ================= */
var cv=$("#speedlines");
if(cv){
  var ctx=cv.getContext("2d"),W,H,parts=[];
  function size(){W=cv.width=cv.offsetWidth;H=cv.height=cv.offsetHeight}
  size();window.addEventListener("resize",size);
  for(var i=0;i<CFG.lines;i++){
    parts.push({x:Math.random(),y:Math.random(),len:.03+Math.random()*.12,
      sp:.0015+Math.random()*.006,w:Math.random()<.25?2.5:1.2,
      o:.12+Math.random()*.4,orange:Math.random()<.22});
  }
  var paused=false;
  document.addEventListener("visibilitychange",function(){paused=document.hidden});
  (function tick(){
    requestAnimationFrame(tick);
    if(paused)return;
    ctx.clearRect(0,0,W,H);
    ctx.lineCap="round";
    for(var j=0;j<parts.length;j++){
      var p=parts[j];
      p.x+=p.sp;if(p.x-p.len>1){p.x=-p.len;p.y=Math.random()}
      ctx.strokeStyle=p.orange?("rgba(255,77,0,"+p.o+")"):("rgba(255,255,255,"+p.o*.7+")");
      ctx.lineWidth=p.w;
      ctx.beginPath();
      ctx.moveTo(p.x*W,p.y*H);
      ctx.lineTo((p.x+p.len)*W,p.y*H);
      ctx.stroke();
    }
  })();
}
/* 入场：GSAP 百分比位移前先清 transform（防 CSS 初值烘进 px） */
var hasGsap=!!(window.gsap);
var lines=$$(".rl-line");
if(hasGsap&&lines.length){
  document.documentElement.classList.remove("intro-done"); /* 交给 GSAP 控制 */
  lines.forEach(function(el){el.style.transform="none"});
  gsap.set(lines,{yPercent:112});
  gsap.set(".hero-shoe",{opacity:0,x:70});
  var tl=gsap.timeline({onComplete:function(){document.documentElement.classList.add("intro-done")}});
  tl.to(lines,{yPercent:0,duration:1.1,ease:"power3.out",stagger:.14},.15)
    .to(".hero-shoe",{opacity:1,x:0,duration:1.2,ease:"power3.out"},.45)
    .add(function(){ /* 完成态保底 */
      document.documentElement.classList.add("intro-done");
    });
  /* 鞋体呼吸浮动（物理感 sine） */
  gsap.to(".hero-shoe",{y:-14,duration:2.6,yoyo:true,repeat:-1,ease:"sine.inOut",delay:1.8});
  /* 鼠标视差（克制） */
  var hero=$(".hero");
  if(hero&&window.matchMedia("(pointer:fine)").matches){
    hero.addEventListener("mousemove",function(e){
      var r=hero.getBoundingClientRect();
      var dx=(e.clientX-r.left)/r.width-.5,dy=(e.clientY-r.top)/r.height-.5;
      gsap.to(".hero-shoe",{x:dx*24,duration:.8,ease:"power2.out",overwrite:"auto"});
    });
  }
}

/* ================= 会员表单 ================= */
var form=$("#clubForm");
if(form){
  form.addEventListener("submit",function(e){
    e.preventDefault();
    var name=$("#fName"),phone=$("#fPhone"),ok=true;
    function setErr(input,msgEl,msg){
      msgEl.textContent=msg;input.classList.toggle("err",!!msg);if(msg)ok=false;
    }
    setErr(name,$("#mName"),name.value.trim().length>=2?"":"请留下你的名字（至少 2 个字）");
    setErr(phone,$("#mPhone"),/^1\d{10}$/.test(phone.value.trim())?"":"手机号格式不对，再检查一下");
    if(!ok){($(".err",form)||{}).focus&&$(".err",form).focus();return}
    var btn=$("#clubBtn");btn.disabled=true;btn.textContent="正在生成会员码…";
    setTimeout(function(){
      var code="RCL-"+Math.floor(1000+Math.random()*9000);
      $("#memberCode").textContent=code;
      form.style.display="none";
      $("#clubDone").classList.add("show");
    },700);
  });
}

/* ================= 加载态收尾 ================= */
var t0=Date.now();
window.addEventListener("load",function(){
  var wait=Math.max(0,CFG.loaderMin-(Date.now()-t0));
  setTimeout(function(){
    document.documentElement.classList.add("loaded");
    if(!hasGsap)document.documentElement.classList.add("intro-done"); /* 无 GSAP 时 CSS 完成态 */
  },wait);
});
})();

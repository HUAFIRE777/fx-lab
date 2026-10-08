/* 栖智落地页交互（classic script，无模块依赖）
   核心动效：场景模式切换 → 全页设备卡片联动点亮/熄灭 + 呼吸光效 */
(function(){
"use strict";
var $=function(s,c){return (c||document).querySelector(s)};
var $$=function(s,c){return Array.prototype.slice.call((c||document).querySelectorAll(s))};

/* ---------- SITE：公司信息唯一真实来源 ---------- */
var SITE={
  name:"栖智",
  address:"杭州市余杭区仓前街道栖智科技园 A 座",
  email:"hello@qizhi-home.example",
  phone:"400-880-2668",
  icp:"浙ICP备2026880011号-1"
};
$$("[data-site]").forEach(function(el){var k=el.getAttribute("data-site");if(SITE[k])el.textContent=SITE[k];});
$$("[data-site-href]").forEach(function(el){
  var k=el.getAttribute("data-site-href");
  if(k==="email"){el.textContent=SITE.email;el.href="mailto:"+SITE.email;}
  if(k==="phone"){el.textContent=SITE.phone;el.href="tel:"+SITE.phone.replace(/-/g,"");}
});

/* ---------- 加载态 ---------- */
function hideLoader(){var l=$("#loader");if(l&&!l.classList.contains("hide"))l.classList.add("hide");}
window.addEventListener("load",function(){requestAnimationFrame(function(){requestAnimationFrame(hideLoader);});});
setTimeout(hideLoader,2500);

/* ---------- 导航：滚动毛玻璃 + 抽屉 ---------- */
var nav=$("#nav");
function onScroll(){nav.classList.toggle("scrolled",window.scrollY>30);}
window.addEventListener("scroll",onScroll,{passive:true});onScroll();
var drawer=$("#drawer"),scrim=$("#scrim"),burger=$("#burger");
function setDrawer(open){drawer.classList.toggle("open",open);scrim.classList.toggle("on",open);document.body.style.overflow=open?"hidden":"";}
burger.addEventListener("click",function(){setDrawer(!drawer.classList.contains("open"));});
scrim.addEventListener("click",function(){setDrawer(false);});
$$("#drawer a").forEach(function(a){a.addEventListener("click",function(){setDrawer(false);});});

/* ---------- 区块滚动 stagger 入场 ---------- */
var reveals=$$(".reveal");
reveals.forEach(function(el,i){el.style.transitionDelay=((i%4)*70)+"ms";});
if("IntersectionObserver" in window){
  var io=new IntersectionObserver(function(es){
    es.forEach(function(e){if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target);}});
  },{threshold:.12});
  reveals.forEach(function(el){io.observe(el);});
}else{reveals.forEach(function(el){el.classList.add("in");});}

/* ---------- 场景模式：全页联动（核心动效） ---------- */
var MODES={
  home:{label:"回家模式",desc:"<b>回家模式</b>：推门即亮灯，音箱接上你常听的歌单，空调提前调到 26°。",
    dev:{light:["on","已点亮 · 80% 亮度"],speaker:["on","播放中 · 爵士歌单"],light2:["dim","微亮 · 15% 亮度"],
         thermo:["on","恒温 26° · 舒适"],lock:["on","已解锁 · 指纹开门"],doorbell:["on","布防中 · 有人即提醒"]}},
  away:{label:"离家模式",desc:"<b>离家模式</b>：一键全屋待机，门锁自动反锁，门铃进入强布防，有人徘徊立刻推送到你手机。",
    dev:{light:["off","已熄灭"],speaker:["off","休眠中"],light2:["off","已熄灭"],
         thermo:["dim","节能 28° · 离家"],lock:["on","已上锁 · 自动反锁"],doorbell:["on","强布防 · 移动侦测"]}},
  sleep:{label:"睡眠模式",desc:"<b>睡眠模式</b>：只留一盏夜灯和白噪音，温控走睡眠曲线，整晚安安静静。",
    dev:{light:["off","已熄灭"],speaker:["dim","白噪音 · 30 分钟后停"],light2:["dim","微亮 · 15% 夜灯"],
         thermo:["on","恒温 25° · 睡眠曲线"],lock:["on","已上锁"],doorbell:["dim","布防中 · 静音推送"]}}
};
var STXT={on:"运行中",dim:"待机中",off:"休眠中"};
var curMode="home";

function setMode(mode){
  if(!MODES[mode])return;curMode=mode;
  var M=MODES[mode];
  // 模式按钮同步
  $$("#modebar .mode").forEach(function(b){b.classList.toggle("cur",b.getAttribute("data-mode")===mode);});
  $$("#phoneModes button").forEach(function(b){b.classList.toggle("cur",b.getAttribute("data-mode")===mode);});
  // 全页设备节点：hero svg / 场景 chips / 手机行 / 产品卡
  Object.keys(M.dev).forEach(function(key){
    var st=M.dev[key][0],txt=M.dev[key][1];
    $$('[data-device="'+key+'"]').forEach(function(el){
      el.classList.remove("on","dim");
      if(st!=="off")el.classList.add(st);
      var t=el.querySelector("[data-st]");
      if(t)t.textContent=el.classList.contains("drow")?shortTxt(txt):(el.classList.contains("st")?STXT[st]:txt);
    });
  });
  // 场景描述 + hero 状态
  $("#sceneDesc").innerHTML=M.desc;
  $("#heroMode").textContent="● "+M.label;
  // 小脉冲：面板整体呼吸一次，强化"联动"感知
  var panel=$(".scene-panel");
  if(window.gsap&&!reduced){gsap.fromTo(panel,{boxShadow:"0 0 0 rgba(62,123,250,0)"},{boxShadow:"0 0 46px rgba(62,123,250,.35)",duration:.5,yoyo:true,repeat:1,ease:"sine.inOut",clearProps:"boxShadow"});}
}
function shortTxt(t){var i=t.indexOf("·");return i>0?t.slice(0,i).trim():t;}
$$("#modebar .mode, #phoneModes button").forEach(function(b){
  b.addEventListener("click",function(){setMode(b.getAttribute("data-mode"));});
});

/* ---------- 法务弹窗：开/关、ESC、遮罩 ---------- */
var lastFocus=null;
function openModal(id){
  var m=$("#m-"+id);if(!m)return;
  lastFocus=document.activeElement;
  m.classList.add("active");document.body.style.overflow="hidden";
  var x=m.querySelector(".x");if(x)x.focus();
}
function closeModals(){
  $$(".modal.active").forEach(function(m){m.classList.remove("active");});
  if(!drawer.classList.contains("open"))document.body.style.overflow="";
  if(lastFocus&&lastFocus.focus)lastFocus.focus();
}
$$("[data-modal]").forEach(function(b){b.addEventListener("click",function(){openModal(b.getAttribute("data-modal"));});});
$$(".modal [data-close]").forEach(function(b){b.addEventListener("click",closeModals);});
document.addEventListener("keydown",function(e){
  if(e.key==="Escape"){closeModals();setDrawer(false);}
});

/* ---------- GSAP 点缀（像素位移，避开百分比位移坑） ---------- */
var reduced=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
if(window.gsap&&!reduced){
  gsap.to(".g1",{x:60,y:40,duration:11,yoyo:true,repeat:-1,ease:"sine.inOut"});
  gsap.to(".g2",{x:-50,y:-30,duration:14,yoyo:true,repeat:-1,ease:"sine.inOut"});
  gsap.to(".room",{y:-8,duration:4.5,yoyo:true,repeat:-1,ease:"sine.inOut"});
  gsap.to(".cta .ring",{scale:1.06,duration:5,yoyo:true,repeat:-1,ease:"sine.inOut",transformOrigin:"center"});
}
})();

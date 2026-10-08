/* 职得 · jobs-page 交互（classic script，无模块） */
(function(){
"use strict";
var hasGsap = typeof window.gsap !== "undefined";

/* ---------- SITE：一改全改 ---------- */
var SITE = {
  name: "职得招聘科技（杭州）有限公司",
  address: "浙江省杭州市西湖区文三路 90 号东部软件园",
  email: "contact@zhide.example.cn",
  phone: "400-820-8820",
  icp: "浙ICP备2026000000号"
};
document.querySelectorAll("[data-site]").forEach(function(el){
  var k = el.getAttribute("data-site"), v = SITE[k];
  if(!v) return;
  if(k === "email"){ el.textContent = v; el.setAttribute("href", "mailto:" + v); }
  else if(k === "phone"){ el.textContent = v; el.setAttribute("href", "tel:" + v.replace(/-/g,"")); }
  else el.textContent = v;
});

/* ---------- 法务三件套文案（真实感通用条款） ---------- */
var MODAL_DOCS = {
  privacy: { title: "隐私政策", body:
    "<h4>一、我们收集哪些信息</h4><p>为向您提供职位搜索、简历投递与面试邀约服务，我们会在您注册、完善简历、投递职位时收集：姓名、联系方式、教育与工作经历。浏览行为（搜索关键词、职位浏览记录）用于优化推荐，仅保存在您的账号下。</p>" +
    "<h4>二、信息如何使用</h4><p>您的简历仅在您主动投递或开启「对企业可见」后，才会展示给对应企业 HR。我们不会将您的个人信息出售给任何第三方；面试邀约、投递状态通知通过站内信与短信发送。</p>" +
    "<h4>三、信息存储与安全</h4><p>数据存储于境内服务器，采用传输加密与访问权限分级。账号注销后，个人信息将在 15 个工作日内删除或匿名化处理，法律法规另有要求的除外。</p>" +
    "<h4>四、您的权利</h4><p>您可随时在「账号设置」中查阅、更正、导出或删除个人信息，关闭简历可见性，或申请注销账号。行使权利遇到困难，请通过页脚联系方式联系我们。</p>" +
    "<h4>五、未成年人保护</h4><p>本平台面向 16 周岁以上求职者。若您是未成年人的监护人并发现相关信息被收集，请联系我们删除。</p>" +
    "<h4>六、政策更新</h4><p>政策修订后将在站内公告 7 日后生效；重大变更会以站内信单独通知。继续使用即视为接受更新后的政策。</p>" },
  terms: { title: "服务条款", body:
    "<h4>一、服务内容</h4><p>职得为求职者提供职位搜索、简历管理与投递服务，为企业提供职位发布与人才搜索服务。求职者基础功能永久免费；企业服务按套餐收费，价格以发布页公示为准。</p>" +
    "<h4>二、账号与简历真实性</h4><p>您承诺注册信息与简历内容真实、准确。伪造学历、工作经历或冒用他人身份，一经核实将冻结账号；情节严重的，配合企业追究法律责任。</p>" +
    "<h4>三、合理使用</h4><p>禁止利用爬虫、脚本批量抓取职位与简历数据；禁止发布传销、诈骗、色情及法律法规禁止的职位信息。违规内容一经发现立即下架，账号按情节封禁 7 天至永久。</p>" +
    "<h4>四、职位信息的责任边界</h4><p>职位描述、薪资范围由发布企业提供并对其真实性负责。平台会对企业资质做基础审核，但不构成对录用结果的承诺；入职前的背调、体检等以企业要求为准。</p>" +
    "<h4>五、费用与退款</h4><p>企业套餐自购买日起生效，支持 7 天无理由退款（已消耗的职位发布数按单价扣除）。求职者增值服务（如简历置顶）购买后 24 小时内未使用的可申请退款。</p>" +
    "<h4>六、争议解决</h4><p>因本服务产生的争议，双方先友好协商；协商不成的，提交平台运营方所在地有管辖权的人民法院诉讼解决。</p>" },
  cookie: { title: "Cookie 政策", body:
    "<h4>一、我们使用哪些 Cookie</h4><p>必要型：维持登录态、记住搜索城市与筛选条件，关闭后部分功能无法使用。偏好型：记住语言与无障碍设置。统计型：匿名统计页面访问与按钮点击，用于改进搜索排序。</p>" +
    "<h4>二、Cookie 的有效期</h4><p>会话 Cookie 在浏览器关闭后失效；偏好与统计 Cookie 最长保留 13 个月，到期自动清除。您也可以随时在浏览器设置中手动清除。</p>" +
    "<h4>三、如何管理</h4><p>首次访问时弹出的横幅可一键接受或拒绝非必要 Cookie；之后可在页脚「Cookie 政策」中重新选择。拒绝统计型 Cookie 不影响核心求职功能。</p>" +
    "<h4>四、第三方服务</h4><p>页面嵌入的地图定位、在线客服组件可能设置其自有 Cookie，其规则以第三方公示为准，我们仅在您主动使用这些功能时加载。</p>" +
    "<h4>五、Do Not Track</h4><p>我们尊重浏览器的「请勿追踪」信号；检测到该信号时，统计型 Cookie 默认不启用。</p>" +
    "<h4>六、联系我们</h4><p>关于 Cookie 的任何疑问，请通过页脚联系方式与我们取得联系，我们将在 3 个工作日内回复。</p>" }
};

/* ---------- 职位数据 ---------- */
var JOBS = [
  {t:"高级前端工程师", c:"云汐科技", cat:"tech", city:"北京", salary:"25-40K", tags:["React","TypeScript","3-5年"], hot:true},
  {t:"算法工程师（推荐方向）", c:"拾光出行", cat:"tech", city:"北京", salary:"30-55K", tags:["Python","推荐系统","硕士优先"], hot:true},
  {t:"Java 后端开发工程师", c:"灯塔金融", cat:"tech", city:"上海", salary:"20-35K", tags:["Spring","MySQL","2年以上"]},
  {t:"测试开发工程师", c:"云汐科技", cat:"tech", city:"武汉", salary:"16-28K", tags:["自动化测试","CI/CD"]},
  {t:"产品经理（增长方向）", c:"拾光出行", cat:"product", city:"深圳", salary:"22-38K", tags:["用户增长","数据驱动","3年以上"], hot:true},
  {t:"高级产品经理（B端）", c:"铁盒物流", cat:"product", city:"深圳", salary:"25-42K", tags:["SaaS","供应链"]},
  {t:"UI 设计师", c:"果粒传媒", cat:"design", city:"杭州", salary:"15-25K", tags:["Figma","品牌视觉","作品集"]},
  {t:"交互设计师", c:"云汐科技", cat:"design", city:"北京", salary:"18-30K", tags:["交互原型","用户研究"]},
  {t:"数据分析师", c:"灯塔金融", cat:"tech", city:"北京", salary:"18-30K", tags:["SQL","Python","风控"]},
  {t:"运营经理（用户侧）", c:"青禾教育", cat:"ops", city:"成都", salary:"12-18K", tags:["社群运营","活动策划"]},
  {t:"新媒体主编", c:"果粒传媒", cat:"ops", city:"广州", salary:"10-16K", tags:["内容策划","500万+粉丝号经验"]},
  {t:"品牌策划专员", c:"栖山文旅", cat:"ops", city:"杭州", salary:"11-17K", tags:["文案","跨界合作"]}
];

var grid = document.getElementById("jobGrid");
var note = document.getElementById("filterNote");
var empty = document.getElementById("emptyState");
var state = { kw:"", city:"", cat:"all" };

function cardHTML(j){
  return '<div class="job-top"><span class="job-logo">' + j.c.charAt(0) + '</span>' +
    '<div><b>' + j.t + '</b><i>' + j.c + ' · ' + j.city + '</i></div></div>' +
    '<div class="job-meta">' + (j.hot ? '<span class="hot">急招</span>' : '') +
    j.tags.map(function(t){ return "<span>" + t + "</span>"; }).join("") + '</div>' +
    '<div class="job-foot"><span class="job-salary">' + j.salary + '·月</span>' +
    '<span class="job-apply">查看详情 →</span></div>';
}

function render(list){
  grid.innerHTML = "";
  list.forEach(function(j){
    var d = document.createElement("article");
    d.className = "job-card";
    d.setAttribute("tabindex","0");
    d.innerHTML = cardHTML(j);
    d.addEventListener("click", function(){
      note.textContent = "已为你打开「" + j.t + " · " + j.c + "」的职位详情（演示模板，详情页由买家接入）。";
    });
    grid.appendChild(d);
  });
  empty.classList.toggle("show", list.length === 0);
}

function filtered(){
  var kw = state.kw.trim().toLowerCase();
  return JOBS.filter(function(j){
    if(state.cat !== "all" && j.cat !== state.cat) return false;
    if(state.city && j.city !== state.city) return false;
    if(kw){
      var hay = (j.t + j.c + j.tags.join("") + j.city).toLowerCase();
      if(hay.indexOf(kw) < 0) return false;
    }
    return true;
  });
}

/* 搜索过滤 → stagger 重排（整页核心动效体系） */
function applyFilter(feedback){
  var list = filtered();
  var cards = Array.prototype.slice.call(grid.children);
  function swap(){
    render(list);
    var fresh = Array.prototype.slice.call(grid.children);
    if(hasGsap && fresh.length){
      gsap.fromTo(fresh, {y:18, opacity:0}, {y:0, opacity:1, duration:.55, stagger:.06, ease:"power3.out", overwrite:true, clearProps:"transform,opacity"});
    }
  }
  if(hasGsap && cards.length){
    gsap.to(cards, {y:-10, opacity:0, duration:.22, stagger:.025, ease:"power2.in", overwrite:true,
      onComplete: swap});
  } else {
    swap();
  }
  if(feedback){
    var bits = [];
    if(state.kw.trim()) bits.push("「" + state.kw.trim() + "」");
    if(state.city) bits.push(state.city);
    var catName = {all:"全部", tech:"技术", product:"产品", design:"设计", ops:"运营市场"}[state.cat];
    if(state.cat !== "all") bits.push(catName);
    note.textContent = list.length
      ? "共找到 " + list.length + " 个" + (bits.length ? bits.join(" · ") : "") + "相关职位"
      : "";
  }
}

/* 初始渲染（无动画，首屏由 reveal 负责） */
render(JOBS);

/* 搜索表单 */
document.getElementById("searchForm").addEventListener("submit", function(e){
  e.preventDefault();
  state.kw = document.getElementById("kwInput").value;
  state.city = document.getElementById("citySel").value;
  document.getElementById("jobs").scrollIntoView({behavior:"smooth", block:"start"});
  applyFilter(true);
});
/* 热门关键词 */
document.querySelectorAll(".hero-tags button").forEach(function(b){
  b.addEventListener("click", function(){
    document.getElementById("kwInput").value = b.getAttribute("data-kw");
    state.kw = b.getAttribute("data-kw");
    document.getElementById("jobs").scrollIntoView({behavior:"smooth", block:"start"});
    applyFilter(true);
  });
});
/* 类别 chips */
document.querySelectorAll(".chip").forEach(function(ch){
  ch.addEventListener("click", function(){
    document.querySelectorAll(".chip").forEach(function(c){ c.classList.remove("is-on"); });
    ch.classList.add("is-on");
    state.cat = ch.getAttribute("data-cat");
    applyFilter(true);
  });
});

/* ---------- 导航滚动毛玻璃 ---------- */
var nav = document.getElementById("nav");
function onScroll(){ nav.classList.toggle("scrolled", window.scrollY > 24); }
window.addEventListener("scroll", onScroll, {passive:true});
onScroll();

/* ---------- 移动端抽屉 ---------- */
var burger = document.getElementById("burger"), drawer = document.getElementById("drawer"),
    veil = document.getElementById("veil"), drawerClose = document.getElementById("drawerClose");
function openDrawer(){
  drawer.classList.add("open"); veil.classList.add("show");
  drawer.setAttribute("aria-hidden","false"); veil.setAttribute("aria-hidden","false");
  burger.setAttribute("aria-expanded","true");
  document.body.style.overflow = "hidden";
}
function closeDrawer(){
  drawer.classList.remove("open"); veil.classList.remove("show");
  drawer.setAttribute("aria-hidden","true"); veil.setAttribute("aria-hidden","true");
  burger.setAttribute("aria-expanded","false");
  document.body.style.overflow = "";
}
burger.addEventListener("click", openDrawer);
drawerClose.addEventListener("click", closeDrawer);
veil.addEventListener("click", closeDrawer);
drawer.querySelectorAll("a").forEach(function(a){ a.addEventListener("click", closeDrawer); });
document.addEventListener("keydown", function(e){
  if(e.key === "Escape"){
    if(modal.classList.contains("show")) closeModal();
    else if(drawer.classList.contains("open")) closeDrawer();
  }
});

/* ---------- 法务弹窗：可开可关 / ESC / 遮罩关闭 ---------- */
var modal = document.getElementById("modal"), modalVeil = document.getElementById("modalVeil"),
    modalTitle = document.getElementById("modalTitle"), modalBody = document.getElementById("modalBody"),
    modalX = document.getElementById("modalX"), lastFocus = null;
function openModal(key){
  var doc = MODAL_DOCS[key]; if(!doc) return;
  lastFocus = document.activeElement;
  modalTitle.textContent = doc.title;
  modalBody.innerHTML = doc.body;
  modalBody.scrollTop = 0;
  modal.classList.add("show"); modalVeil.classList.add("show");
  modal.setAttribute("aria-hidden","false"); modalVeil.setAttribute("aria-hidden","false");
  document.body.classList.add("modal-open");
  modalX.focus();
}
function closeModal(){
  modal.classList.remove("show"); modalVeil.classList.remove("show");
  modal.setAttribute("aria-hidden","true"); modalVeil.setAttribute("aria-hidden","true");
  document.body.classList.remove("modal-open");
  if(lastFocus && lastFocus.focus) lastFocus.focus();
}
document.querySelectorAll("[data-modal]").forEach(function(b){
  b.addEventListener("click", function(){ openModal(b.getAttribute("data-modal")); });
});
modalX.addEventListener("click", closeModal);
modalVeil.addEventListener("click", closeModal);

/* ---------- 滚动 reveal（4 秒安全网兜底 + 无障碍） ---------- */
var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
var reveals = document.querySelectorAll(".reveal");
function lightUp(el){
  if(!el || el.classList.contains("is-in")) return;
  var d = parseInt(el.getAttribute("data-d") || "0", 10);
  el.style.transitionDelay = reduceMotion ? "0ms" : (d * 90) + "ms";
  el.classList.add("is-in");
}
if(reduceMotion){
  reveals.forEach(function(el){ el.classList.add("is-in"); });
} else if("IntersectionObserver" in window){
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(en){ if(en.isIntersecting){ lightUp(en.target); io.unobserve(en.target); } });
  }, {threshold:.14});
  reveals.forEach(function(el){ io.observe(el); });
  setTimeout(function(){ reveals.forEach(lightUp); }, 4000); /* 安全网：IO 漏报也必亮 */
} else {
  reveals.forEach(lightUp);
}

/* ---------- 加载态：load 后淡出 ---------- */
function hideLoader(){
  var l = document.getElementById("loader");
  if(l) l.classList.add("done");
}
if(document.readyState === "complete") setTimeout(hideLoader, 350);
else window.addEventListener("load", function(){ setTimeout(hideLoader, 350); });
setTimeout(hideLoader, 3500); /* 兜底：load 迟迟不来也必消失 */

})();

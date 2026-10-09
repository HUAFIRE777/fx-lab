/* balloon-sky-3d · 热气球天空 —— 纯程序化 3D 场景，无外部资源 */
import * as THREE from 'three';

/* ---------- 确定性随机（布局每次一致） ---------- */
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const rand = mulberry32(20261009);
const lerp=(a,b,t)=>a+(b-a)*t;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const easeInOutCubic=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
const easeOutExpo=t=>t>=1?1:1-Math.pow(2,-10*t);
const easeOutBack=t=>{const c=1.70158;return 1+(c+1)*Math.pow(t-1,3)+c*Math.pow(t-1,2)};
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- 渲染器 / 场景 / 相机 ---------- */
const stage = document.getElementById('stage');
stage.style.touchAction = 'none';
const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
stage.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xD5E4EC, 60, 230);
const camera = new THREE.PerspectiveCamera(55, innerWidth/innerHeight, 0.1, 600);
camera.position.set(0, 5.5, 24); // 入场由 24 推近到 15

/* ---------- 天空穹顶（渐变 + 太阳辉光，shader 手写） ---------- */
const skyU = {
  uTop:{value:new THREE.Color(0x5B98C2)},
  uBottom:{value:new THREE.Color(0xF0EADA)},
  uHaze:{value:new THREE.Color(0xDCE9F0)},
  uSunDir:{value:new THREE.Vector3(0.55,0.16,-0.82).normalize()},
  uSunColor:{value:new THREE.Color(0xFFF3D9)},
};
const sky = new THREE.Mesh(
  new THREE.SphereGeometry(420, 32, 20),
  new THREE.ShaderMaterial({
    side:THREE.BackSide, depthWrite:false, fog:false,
    uniforms:skyU,
    vertexShader:`varying vec3 vDir;void main(){vDir=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader:`
      uniform vec3 uTop,uBottom,uHaze,uSunColor;uniform vec3 uSunDir;varying vec3 vDir;
      void main(){
        vec3 d=normalize(vDir);
        vec3 col=mix(uBottom,uTop,smoothstep(0.02,0.55,d.y));
        col=mix(uHaze,col,smoothstep(-0.12,0.02,d.y));
        float sd=dot(d,normalize(uSunDir));
        float disk=smoothstep(0.99955,0.99985,sd);
        float glow=pow(max(sd,0.0),220.0);
        float halo=pow(max(sd,0.0),7.0)*0.30;
        col+=uSunColor*(disk*1.5+glow*0.85+halo);
        gl_FragColor=vec4(col,1.0);
      }`
  })
);
scene.add(sky);

/* ---------- 灯光 ---------- */
const sunLight = new THREE.DirectionalLight(0xFFE9C4, 1.15);
sunLight.position.set(28, 9, -40);
scene.add(sunLight);
const hemi = new THREE.HemisphereLight(0x9CC4DE, 0xF5F1E6, 0.75);
scene.add(hemi);

/* ---------- 程序化纹理 ---------- */
function stripeTexture(){
  const c=document.createElement('canvas');c.width=1024;c.height=512;
  const g=c.getContext('2d');const n=16,w=c.width/n;
  for(let i=0;i<n;i++){g.fillStyle=i%2?'#F5F1E6':'#E4572E';g.fillRect(i*w,0,w+1,c.height);}
  const gr=g.createLinearGradient(0,0,0,c.height); // 底部轻微压暗，有体积感
  gr.addColorStop(0,'rgba(18,48,63,0)');gr.addColorStop(1,'rgba(18,48,63,0.22)');
  g.fillStyle=gr;g.fillRect(0,0,c.width,c.height);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;
  t.wrapS=THREE.RepeatWrapping;return t;
}
function cloudTexture(){
  const c=document.createElement('canvas');c.width=c.height=256;
  const g=c.getContext('2d');
  for(let i=0;i<18;i++){
    const x=128+(rand()-0.5)*150,y=140+(rand()-0.5)*90,r=28+rand()*46;
    const gr=g.createRadialGradient(x,y,0,x,y,r);
    gr.addColorStop(0,'rgba(255,255,255,0.55)');gr.addColorStop(1,'rgba(255,255,255,0)');
    g.fillStyle=gr;g.beginPath();g.arc(x,y,r,0,7);g.fill();
  }
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
function glowTexture(){
  const c=document.createElement('canvas');c.width=c.height=128;
  const g=c.getContext('2d');
  const gr=g.createRadialGradient(64,64,0,64,64,64);
  gr.addColorStop(0,'rgba(255,240,210,1)');gr.addColorStop(0.4,'rgba(255,200,140,0.5)');gr.addColorStop(1,'rgba(255,180,120,0)');
  g.fillStyle=gr;g.fillRect(0,0,128,128);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}

/* ---------- 云海（五层视差精灵） ---------- */
const cloudTex = cloudTexture();
const cloudMats=[];
const cloudGroups=[];
function cloudLayer(count,yMin,yMax,zMin,zMax,sMin,sMax,opacity,drift){
  const mat=new THREE.SpriteMaterial({map:cloudTex,color:0xF5F1E6,transparent:true,opacity,depthWrite:false,fog:true});
  cloudMats.push(mat);
  const grp=new THREE.Group();
  for(let i=0;i<count;i++){
    const s=new THREE.Sprite(mat);
    const sc=sMin+rand()*(sMax-sMin);
    s.scale.set(sc,sc*0.55,1);
    s.position.set((rand()-0.5)*190, yMin+rand()*(yMax-yMin), zMin+rand()*(zMax-zMin));
    s.userData.v=drift*(0.5+rand()); // 漂移速度
    grp.add(s);
  }
  scene.add(grp);cloudGroups.push(grp);
}
cloudLayer(30,-10,-3,-130,-70, 44,86, 0.95, 0.35); // 远：云海主体
cloudLayer(28,-8,-1, -70,-32, 28,56, 0.9, 0.6);   // 中
cloudLayer(18,-5, 2, -34,-12, 18,38, 0.85, 1.0);  // 近：掠过镜头的碎云
cloudLayer(14,-17,-9, -65,-25, 52,95, 0.92, 0.45); // 低涌：填满画面下半的云浪
cloudLayer(8, 12, 22, -90,-40, 14,26, 0.5, 0.25); // 高空游丝

/* ---------- 热气球工厂（Lathe 球囊 + 条纹 + 吊篮 + 缆绳） ---------- */
const stripeTex = stripeTexture();
const glowTex = glowTexture();
const envelopeGeo=(()=>{
  const prof=[[0.30,0.00],[0.60,0.12],[0.82,0.38],[0.97,0.72],[1.00,1.02],[0.90,1.34],[0.70,1.60],[0.42,1.80],[0.16,1.94],[0.001,2.0]];
  return new THREE.LatheGeometry(prof.map(p=>new THREE.Vector2(p[0],p[1])),48);
})();
const envelopeMat=new THREE.MeshStandardMaterial({map:stripeTex,roughness:0.85,metalness:0.0});
const basketMat=new THREE.MeshStandardMaterial({color:0x9E3B1D,roughness:0.9}); // 气球红的深色调
const ropeMat=new THREE.LineBasicMaterial({color:0x1E3D4F}); // 晨空蓝的深色调
const basketGeo=new THREE.CylinderGeometry(0.34,0.42,0.5,10);

function makeBalloon(){
  const g=new THREE.Group();
  const env=new THREE.Mesh(envelopeGeo,envelopeMat);
  g.add(env);
  const basket=new THREE.Mesh(basketGeo,basketMat);
  basket.position.y=-1.55;g.add(basket);
  // 缆绳：吊篮四角 → 球囊囊口
  const rp=[];
  [[0.3,0.3],[-0.3,0.3],[0.3,-0.3],[-0.3,-0.3]].forEach(([x,z])=>{
    rp.push(new THREE.Vector3(x,-1.3,z),new THREE.Vector3(x*0.95,0.02,z*0.95));
  });
  g.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(rp),ropeMat));
  // 喷灯辉光（暮时最亮）
  const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:0xFFC98A,transparent:true,opacity:0.25,depthWrite:false}));
  glow.position.y=-0.1;glow.scale.set(1.4,1.4,1);g.add(glow);
  g.userData.glow=glow;
  return g;
}

/* 12 只气球：近 / 中 / 远三层，按出现优先级排序 */
const LAYERS=[
  {z:[-11,-16],s:1.0},{z:[-22,-34],s:1.6},{z:[-44,-66],s:2.6},
];
const balloons=[];
const order=[1,1,0,1,2,0,1,2,0,2,1,2]; // 每只气球的层
for(let i=0;i<12;i++){
  const b=makeBalloon();
  const L=LAYERS[order[i]],s=L.s;
  const baseX=(rand()-0.5)*(order[i]===0?36:order[i]===1?70:120);
  b.userData={
    base:new THREE.Vector3(baseX, 1.5+rand()*11, L.z[0]+rand()*(L.z[1]-L.z[0])),
    s, phase:rand()*Math.PI*2,
    show:i<7?1:0, showT:i<7?1:0, // 初始 7 只
  };
  b.position.copy(b.userData.base);
  b.scale.setScalar(s*(i<7?1:0.0001));
  b.visible=i<7;
  scene.add(b);balloons.push(b);
}

/* ---------- 飞鸟（双翼扑动，手工小细节） ---------- */
const birdMat=new THREE.MeshBasicMaterial({color:0x1E3D4F,side:THREE.DoubleSide});
const birds=[];
for(let i=0;i<6;i++){
  const bird=new THREE.Group();
  const wgeo=new THREE.PlaneGeometry(1.1,0.28);
  const wl=new THREE.Mesh(wgeo,birdMat),wr=new THREE.Mesh(wgeo,birdMat);
  wl.position.x=-0.55;wr.position.x=0.55;
  const pl=new THREE.Group(),pr=new THREE.Group();
  pl.add(wl);pr.add(wr);bird.add(pl,pr);
  bird.userData={pl,pr,phase:rand()*7,x:-70+rand()*30,y:9+rand()*8,z:-24-rand()*26,v:1.6+rand()*1.2};
  scene.add(bird);birds.push(bird);
}

/* ---------- 时间三档（晨 / 午 / 暮，光照联动） ---------- */
const TIMES={
  morning:{top:0x5B98C2,bottom:0xF0EADA,haze:0xDCE9F0,sunDir:[0.55,0.16,-0.82],sun:0xFFF3D9,
    light:0xFFE9C4,li:1.15,lpos:[28,9,-40],hemiSky:0x9CC4DE,hemi:0.75,fog:0xD5E4EC,exp:1.0,cloud:0xF5F1E6,burner:0.25},
  noon:{top:0x7FB6D9,bottom:0xEDF3EF,haze:0xE4EEEF,sunDir:[0.12,0.85,-0.5],sun:0xFFFBEF,
    light:0xFFF6E8,li:1.4,lpos:[6,42,-22],hemiSky:0xBFE0F2,hemi:0.9,fog:0xDCEBF2,exp:1.08,cloud:0xFFFFFF,burner:0},
  dusk:{top:0x33617F,bottom:0xE8B083,haze:0xD9AE8C,sunDir:[-0.62,0.10,-0.78],sun:0xE4572E,
    light:0xFFB37E,li:0.95,lpos:[-30,6,-38],hemiSky:0x6E93AC,hemi:0.55,fog:0xCBB59B,exp:0.98,cloud:0xF7E3CB,burner:0.9},
};
let timeName='morning', timeTween=null;
function snapshot(){
  return {top:skyU.uTop.value.clone(),bottom:skyU.uBottom.value.clone(),haze:skyU.uHaze.value.clone(),
    sunDir:skyU.uSunDir.value.clone(),sun:skyU.uSunColor.value.clone(),
    light:sunLight.color.clone(),li:sunLight.intensity,lpos:sunLight.position.clone(),
    hemiSky:hemi.color.clone(),hemi:hemi.intensity,fog:scene.fog.color.clone(),
    exp:renderer.toneMappingExposure,cloud:cloudMats[0].color.clone(),burner:TIMES[timeName].burner};
}
function setTime(name){
  if(name===timeName&&!timeTween)return;
  const from=snapshot(),to=TIMES[name];
  timeTween={t:0,from,to,name};
  document.querySelectorAll('.seg button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.time===name)));
}
document.querySelectorAll('.seg button').forEach(b=>b.addEventListener('click',()=>setTime(b.dataset.time)));
const _c=new THREE.Color(),_v=new THREE.Vector3();
function applyTime(f,t,k){
  const P=TIMES[t.name]||t.to;
  skyU.uTop.value.copy(f.top).lerp(_c.set(P.top),k);
  skyU.uBottom.value.copy(f.bottom).lerp(_c.set(P.bottom),k);
  skyU.uHaze.value.copy(f.haze).lerp(_c.set(P.haze),k);
  skyU.uSunDir.value.copy(f.sunDir).lerp(_v.set(...P.sunDir).normalize(),k);
  skyU.uSunColor.value.copy(f.sun).lerp(_c.set(P.sun),k);
  sunLight.color.copy(f.light).lerp(_c.set(P.light),k);
  sunLight.intensity=lerp(f.li,P.li,k);
  sunLight.position.copy(f.lpos).lerp(_v.set(...P.lpos),k);
  hemi.color.copy(f.hemiSky).lerp(_c.set(P.hemiSky),k);
  hemi.intensity=lerp(f.hemi,P.hemi,k);
  scene.fog.color.copy(f.fog).lerp(_c.set(P.fog),k);
  renderer.toneMappingExposure=lerp(f.exp,P.exp,k);
  cloudMats.forEach(m=>m.color.copy(f.cloud).lerp(_c.set(P.cloud),k));
  balloons.forEach(b=>{b.userData.glow.material.opacity=lerp(f.burner,P.burner,k)*(0.8+0.2*Math.sin(perfT*9+b.userData.phase));});
  if(k>=1){timeName=t.name;timeTween=null;}
}

/* ---------- 气球数量 ---------- */
const slider=document.getElementById('bcount'),out=document.getElementById('bcountOut');
function paintSlider(){slider.style.setProperty('--fill',(slider.value-1)/11*100+'%');}
slider.addEventListener('input',()=>{
  const n=+slider.value;out.textContent=n;paintSlider();
  balloons.forEach((b,i)=>{b.userData.show=i<n?1:0;if(i<n)b.visible=true;});
});
paintSlider();

/* ---------- 拖拽视差（鼠标 + 触屏） ---------- */
let dragTX=0,dragTY=0,dragX=0,dragY=0,dragging=false,lx=0,ly=0,lastDrag=-9;
stage.addEventListener('pointerdown',e=>{dragging=true;lx=e.clientX;ly=e.clientY;stage.classList.add('dragging');stage.setPointerCapture(e.pointerId);});
stage.addEventListener('pointermove',e=>{
  if(!dragging)return;
  dragTX=clamp(dragTX+(e.clientX-lx)/innerWidth*0.9,-0.16,0.16);
  dragTY=clamp(dragTY-(e.clientY-ly)/innerHeight*0.6,-0.09,0.09);
  lx=e.clientX;ly=e.clientY;lastDrag=perfT;
});
const endDrag=()=>{dragging=false;stage.classList.remove('dragging');};
stage.addEventListener('pointerup',endDrag);stage.addEventListener('pointercancel',endDrag);

/* ---------- 主循环 ---------- */
const clock=new THREE.Clock();
let perfT=0,introT=0,loaded=false;
const lookTarget=new THREE.Vector3(0,3.5,-30);
function tick(){
  requestAnimationFrame(tick);
  const dt=Math.min(clock.getDelta(),0.05);perfT+=dt;
  const amp=REDUCED?0.25:1;

  // 时间过渡（1.8s，easeInOutCubic）
  if(timeTween){timeTween.t+=dt/1.8;applyTime(timeTween.from,timeTween,timeTween.t>=1?1:easeInOutCubic(Math.min(timeTween.t,1)));}

  // 入场推近
  if(introT<1&&!REDUCED){introT=Math.min(1,introT+dt/2.4);camera.position.z=lerp(24,15,easeOutExpo(introT));}
  else if(REDUCED){camera.position.z=15;}

  // 拖拽视角（指数跟随，有物理感）
  const fk=1-Math.exp(-dt*7);
  dragX+=(dragTX-dragX)*fk;dragY+=(dragTY-dragY)*fk;
  const sway=(REDUCED||perfT-lastDrag<3)?0:Math.sin(perfT*0.22)*1.4*amp;
  lookTarget.set(dragX*60+sway, 3.5+dragY*40, -30);
  camera.lookAt(lookTarget);

  // 气球：升降 + 摇摆 + 慢漂移 + 数量弹出
  for(const b of balloons){
    const u=b.userData;
    u.showT+=clamp(u.show-u.showT,-dt*2.4,dt*2.4);
    const pop=u.showT<=0?0.0001:Math.max(0.0001,easeOutBack(clamp(u.showT,0,1)));
    b.scale.setScalar(u.s*pop);
    if(u.showT<=0&&u.show===0)b.visible=false;
    b.position.set(
      u.base.x+Math.sin(perfT*0.07+u.phase)*3*amp,
      u.base.y+Math.sin(perfT*0.5+u.phase)*0.7*amp,
      u.base.z
    );
    b.rotation.z=Math.sin(perfT*0.4+u.phase)*0.06*amp;
    b.rotation.y=Math.sin(perfT*0.12+u.phase)*0.25*amp;
  }

  // 云海漂移（各层速度不同 = 视差）
  for(const grp of cloudGroups)for(const s of grp.children){
    s.position.x+=s.userData.v*dt*amp;
    if(s.position.x>110)s.position.x=-110;
  }

  // 飞鸟
  for(const bd of birds){
    const u=bd.userData;
    u.x+=u.v*dt*amp;if(u.x>75){u.x=-75;u.y=9+rand()*8;}
    bd.position.set(u.x,u.y+Math.sin(perfT*1.3+u.phase)*0.6*amp,u.z);
    const flap=Math.sin(perfT*7+u.phase)*0.55*amp;
    u.pl.rotation.z=flap;u.pr.rotation.z=-flap;
    bd.rotation.y=-0.15;
  }

  renderer.render(scene,camera);
  if(!loaded){loaded=true;markLoaded();}
}

/* ---------- 加载完成（三重兜底，必进完成态） ---------- */
let loadDone=false;
function markLoaded(){
  if(loadDone)return;loadDone=true;
  document.documentElement.classList.add('loaded');
  document.getElementById('loader').setAttribute('aria-hidden','true');
}
setTimeout(markLoaded,2600); // 兜底 1：渲染循环已起 + 2.6s
setTimeout(markLoaded,6000); // 兜底 2：绝对防线

addEventListener('resize',()=>{
  camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);
});

tick();

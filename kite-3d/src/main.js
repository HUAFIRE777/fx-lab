import * as THREE from 'three';

/* ================= 配置 ================= */
const clamp = THREE.MathUtils.clamp;
const lerp = THREE.MathUtils.lerp;

const STYLES = [
  { name:'钻石筝', accent:'#E4573D', H:2.30, hw:y => 0.85*(1-Math.abs(y)/1.15) },
  { name:'三角翼', accent:'#E89B2E', H:1.90, hw:y => 0.95*(1-(y+0.95)/1.90) },
  { name:'六角筝', accent:'#2E6FD8', H:2.10, hw:y => { const a=Math.abs(y); return a<0.55 ? 0.8 : Math.max(0.02, 0.8*(1-(a-0.55)/0.50)); } },
];

let wind = 0.5;        // 0..1 滑杆
let lineLen = 22;      // 8..40 m
let curStyle = 0;

/* ================= 渲染器 / 场景 ================= */
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias:true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xDCEFFB, 55, 220);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth/window.innerHeight, 0.1, 1200);
camera.position.set(0, 3.2, 16);

scene.add(new THREE.HemisphereLight(0xEAF6FF, 0x9CC4DE, 0.95));
const sunLight = new THREE.DirectionalLight(0xFFF6E6, 1.15);
sunLight.position.set(30, 42, 24);
scene.add(sunLight);

/* ---------- 天空穹顶：程序化垂直渐变 ---------- */
{
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite:false, fog:false,
    uniforms:{
      top:{ value:new THREE.Color(0x3D8FCB) },
      mid:{ value:new THREE.Color(0x8ACFEE) },
      bot:{ value:new THREE.Color(0xE9F6FE) },
    },
    vertexShader:'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader:[
      'varying vec3 vP; uniform vec3 top; uniform vec3 mid; uniform vec3 bot;',
      'void main(){',
      '  float h = normalize(vP).y;',
      '  vec3 c = h > 0.0 ? mix(mid, top, pow(h, 0.7)) : mix(mid, bot, pow(-h, 0.6));',
      '  gl_FragColor = vec4(c, 1.0);',
      '}',
    ].join('\n'),
  });
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(420, 28, 18), skyMat));
}

/* ---------- 太阳光晕（canvas 程序化） ---------- */
function radialGlow(){
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(128,128,8, 128,128,128);
  g.addColorStop(0, 'rgba(255,252,240,0.95)');
  g.addColorStop(0.35, 'rgba(255,250,230,0.45)');
  g.addColorStop(1, 'rgba(255,250,230,0)');
  x.fillStyle = g; x.fillRect(0,0,256,256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const sun = new THREE.Sprite(new THREE.SpriteMaterial({ map:radialGlow(), transparent:true, opacity:0.9, depthWrite:false, fog:false }));
sun.position.set(52, 38, -130); sun.scale.set(52, 52, 1);
scene.add(sun);

/* ---------- 云：云海底层 + 空中游云 ---------- */
const cloudGeo = new THREE.SphereGeometry(1, 14, 10);
const cloudMat = new THREE.MeshLambertMaterial({ color:0xFFFFFF, transparent:true, opacity:0.94 });
const clouds = [];
function puff(px, py, pz, sx, sy, sz, n){
  const g = new THREE.Group();
  for(let i=0;i<n;i++){
    const m = new THREE.Mesh(cloudGeo, cloudMat);
    m.position.set((Math.random()-0.5)*sx*0.9, (Math.random()-0.5)*sy*0.55, (Math.random()-0.5)*sz*0.6);
    const s = 0.55 + Math.random()*0.8;
    m.scale.set(sx*0.34*s, sy*0.6*s, sz*0.34*s);
    g.add(m);
  }
  g.position.set(px, py, pz);
  g.userData.phase = Math.random()*Math.PI*2;
  g.userData.baseY = py;
  scene.add(g); clouds.push(g);
}
for(let i=0;i<46;i++)
  puff((Math.random()-0.5)*190, -8.5+(Math.random()-0.5)*4.5, -78+Math.random()*108,
       7+Math.random()*8, 2.4+Math.random()*1.6, 5+Math.random()*5, 3+((Math.random()*3)|0));
for(let i=0;i<12;i++)
  puff((Math.random()-0.5)*150, Math.random()*16-1, -62+Math.random()*62,
       4+Math.random()*5, 1.8+Math.random()*1.4, 3+Math.random()*3, 3+((Math.random()*3)|0));

/* ================= 线轴（第一人称持线） ================= */
const S = new THREE.Vector3(0, -2.85, 8.5);   // 牵引线起点
{
  const spool = new THREE.Group();
  const white = new THREE.MeshLambertMaterial({ color:0xF7FBFE });
  const accentM = new THREE.MeshLambertMaterial({ color:new THREE.Color(STYLES[0].accent) });
  const discG = new THREE.CylinderGeometry(0.42, 0.42, 0.07, 24);
  const d1 = new THREE.Mesh(discG, white); d1.position.y = 0.30;
  const d2 = new THREE.Mesh(discG, white); d2.position.y = -0.30;
  const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.10, 0.62, 12), white);
  const wound = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.13, 10, 24), accentM);
  wound.rotation.x = Math.PI/2;
  const crank = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.05, 0.05), white);
  crank.position.set(0.30, 0.34, 0);
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.16, 8), accentM);
  grip.position.set(0.45, 0.42, 0);
  spool.add(d1, d2, axle, wound, crank, grip);
  spool.position.set(S.x, S.y - 0.55, S.z);
  spool.rotation.z = 0.12;
  scene.add(spool);
}

/* ================= 风筝 ================= */
function kiteTexture(accent){
  const c = document.createElement('canvas'); c.width = 128; c.height = 256;
  const x = c.getContext('2d');
  x.fillStyle = '#FDFEFE'; x.fillRect(0, 0, 128, 256);
  x.save(); x.translate(64, 128); x.rotate(-0.5);
  x.fillStyle = accent; x.fillRect(-120, -26, 240, 52);
  x.globalAlpha = 0.32; x.fillRect(-120, 30, 240, 10);
  x.restore(); x.globalAlpha = 1;
  x.strokeStyle = accent; x.lineWidth = 10; x.strokeRect(6, 6, 116, 244);
  x.beginPath(); x.arc(64, 128, 19, 0, Math.PI*2);
  x.fillStyle = '#FDFEFE'; x.fill(); x.lineWidth = 7; x.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

function buildSailGeometry(style){
  const g = new THREE.PlaneGeometry(1.7, style.H, 12, 18);
  const pos = g.attributes.position;
  const edge = new Float32Array(pos.count);
  for(let i=0;i<pos.count;i++){
    const y = pos.getY(i);
    const hw = Math.max(style.hw(y), 0.012);
    const t = clamp(pos.getX(i)/0.85, -1, 1);
    pos.setX(i, t*hw);
    pos.setZ(i, 0.10*(1-t*t));            // 兜风弧度
    edge[i] = Math.abs(t);                // 边缘摆动权重
  }
  g.computeVertexNormals();
  g.userData.base = pos.array.slice();
  g.userData.edge = edge;
  return g;
}

function buildKite(style){
  const grp = new THREE.Group();
  const sailGeo = buildSailGeometry(style);
  const sail = new THREE.Mesh(sailGeo, new THREE.MeshLambertMaterial({
    map: kiteTexture(style.accent), side: THREE.DoubleSide,
  }));
  grp.add(sail);

  // 骨架（藏于帆后）
  const stickMat = new THREE.MeshLambertMaterial({ color:0xDCE8F0 });
  const spine = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, style.H, 6), stickMat);
  spine.position.z = -0.06; grp.add(spine);
  let maxW = 0, maxY = 0;
  for(let y=-style.H/2; y<=style.H/2; y+=0.05){ const w = style.hw(y); if(w > maxW){ maxW = w; maxY = y; } }
  const cross = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, maxW*2, 6), stickMat);
  cross.rotation.z = Math.PI/2; cross.position.set(0, maxY, -0.06); grp.add(cross);

  // 缰绳 → 系留点
  const towLocal = new THREE.Vector3(0, -0.15, 0.95);
  const bPts = [
    -0.25, 0.25, 0.06,  towLocal.x, towLocal.y, towLocal.z,
     0.25, 0.25, 0.06,  towLocal.x, towLocal.y, towLocal.z,
     0.00,-0.70, 0.06,  towLocal.x, towLocal.y, towLocal.z,
  ];
  const bGeo = new THREE.BufferGeometry();
  bGeo.setAttribute('position', new THREE.Float32BufferAttribute(bPts, 3));
  grp.add(new THREE.LineSegments(bGeo, new THREE.LineBasicMaterial({ color:0xF4FAFD, transparent:true, opacity:0.9 })));

  // 尾巴：7 节飘带
  const tail = new THREE.Group();
  tail.position.set(0, -style.H/2 - 0.04, 0);
  const segs = [];
  const aMat = new THREE.MeshLambertMaterial({ color:new THREE.Color(style.accent), side:THREE.DoubleSide });
  const wMat = new THREE.MeshLambertMaterial({ color:0xFDFEFE, side:THREE.DoubleSide });
  const segGeo = new THREE.PlaneGeometry(0.17, 0.30);
  for(let i=0;i<7;i++){
    const m = new THREE.Mesh(segGeo, i%2 ? wMat : aMat);
    m.position.y = -i*0.30;
    tail.add(m); segs.push(m);
  }
  grp.add(tail);

  grp.rotation.order = 'YXZ';
  return { group:grp, sail, tailSegs:segs, towLocal };
}

let kite = buildKite(STYLES[curStyle]);
scene.add(kite.group);

function disposeKite(k){
  k.group.traverse(o => {
    if(o.geometry) o.geometry.dispose();
    if(o.material){ (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { if(m.map) m.map.dispose(); m.dispose(); }); }
  });
}

/* ---------- 牵引线 ---------- */
const LP = 48;
const lineGeo = new THREE.BufferGeometry();
const linePos = new THREE.Float32BufferAttribute(new Float32Array(LP*3), 3);
lineGeo.setAttribute('position', linePos);
scene.add(new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color:0xF4FAFD, transparent:true, opacity:0.95 })));

function updateLine(t, tow, eff){
  const sag = 1.9*(1-Math.min(eff,1)) + 0.22;      // 风越小线越垂
  const sway = Math.sin(t*1.25)*0.55*Math.min(eff,1);
  for(let i=0;i<LP;i++){
    const s = i/(LP-1);
    const env = Math.sin(s*Math.PI);
    const rip = Math.sin(s*9 - t*6)*0.09*eff*env;
    linePos.setXYZ(i,
      lerp(S.x, tow.x, s) + sway*env + rip,
      lerp(S.y, tow.y, s) - Math.sin(s*Math.PI)*sag,
      lerp(S.z, tow.z, s) + rip*0.5);
  }
  linePos.needsUpdate = true;
}

/* ---------- 布料摆动（CPU 顶点） ---------- */
function flutter(t, eff){
  const geo = kite.sail.geometry;
  const pos = geo.attributes.position;
  const base = geo.userData.base, edge = geo.userData.edge;
  const amp = 0.05 + 0.15*eff;
  const ph = t*(5 + 8*eff);
  for(let i=0;i<pos.count;i++){
    const bx = base[i*3], by = base[i*3+1];
    const w = edge[i];
    pos.setZ(i, base[i*3+2] +
      (Math.sin(bx*4.2 + ph)*0.62 + Math.sin(by*5.1 - ph*1.31 + bx*2.0)*0.38) * amp * (0.25 + 0.75*w));
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
}

/* ================= 补间（款式切换过渡） ================= */
const tweens = [];
const easeIn = k => k*k*k;
const easeOutBack = k => { const c = 1.70158; return 1 + (c+1)*Math.pow(k-1, 3) + c*Math.pow(k-1, 2); };
function runTweens(dt){
  for(let i=tweens.length-1;i>=0;i--){
    const tw = tweens[i];
    tw.t += dt;
    const k = Math.min(tw.t/tw.dur, 1);
    tw.fn(tw.ease(k));
    if(k >= 1){ tweens.splice(i, 1); tw.done && tw.done(); }
  }
}

let switching = false;
function setStyle(idx){
  if(idx === curStyle || switching) return;
  switching = true;
  const old = kite.group;
  tweens.push({ t:0, dur:0.22, ease:easeIn,
    fn:k => old.scale.setScalar(Math.max(0.001, 1-k)),
    done:() => {
      scene.remove(old); disposeKite(kite);
      kite = buildKite(STYLES[idx]);
      kite.group.scale.setScalar(0.001);
      scene.add(kite.group);
      curStyle = idx;
      document.documentElement.style.setProperty('--accent', STYLES[idx].accent);
      document.querySelectorAll('.styles button').forEach(b =>
        b.classList.toggle('on', +b.dataset.style === idx));
      tweens.push({ t:0, dur:0.55, ease:easeOutBack,
        fn:k => kite.group.scale.setScalar(Math.max(0.001, k)),
        done:() => { switching = false; } });
    }});
}

/* ================= UI 接线 ================= */
const rgLine = document.getElementById('rg-line');
const rgWind = document.getElementById('rg-wind');
const vLine = document.getElementById('v-line');
const vWind = document.getElementById('v-wind');
const roWind = document.getElementById('ro-wind');
const roLine = document.getElementById('ro-line');

function paintRange(el){
  const k = (el.value - el.min)/(el.max - el.min)*100;
  el.style.setProperty('--fill', k + '%');
}
function syncLabels(){
  const ms = (wind*11).toFixed(1);
  vLine.textContent = lineLen.toFixed(0) + ' m';
  vWind.textContent = ms + ' m/s';
  roWind.textContent = ms;
  roLine.textContent = lineLen.toFixed(0);
}
rgLine.addEventListener('input', () => { lineLen = +rgLine.value; paintRange(rgLine); syncLabels(); });
rgWind.addEventListener('input', () => { wind = +rgWind.value/100; paintRange(rgWind); syncLabels(); });
document.querySelectorAll('.styles button').forEach(b =>
  b.addEventListener('click', () => setStyle(+b.dataset.style)));
[rgLine, rgWind].forEach(paintRange);
syncLabels();

/* ---------- 画布上下拖拽 = 放飞 / 收线 ---------- */
let dragging = false, lastY = 0;
canvas.addEventListener('pointerdown', e => {
  dragging = true; lastY = e.clientY;
  canvas.style.cursor = 'grabbing';
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', e => {
  if(dragging){
    const dy = e.clientY - lastY; lastY = e.clientY;
    lineLen = clamp(lineLen - dy*0.035, 8, 40);   // 上拖放飞，下拖收线
    rgLine.value = lineLen; paintRange(rgLine); syncLabels();
  } else {
    parTX = (e.clientX/window.innerWidth - 0.5)*1.4;
    parTY = (e.clientY/window.innerHeight - 0.5)*0.9;
  }
});
const endDrag = () => { dragging = false; canvas.style.cursor = 'grab'; };
canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);

/* ================= 主循环 ================= */
const clock = new THREE.Clock();
let parTX = 0, parTY = 0, prevPx = 0, hudT = 0, lookY = 5.5;
const towWorld = new THREE.Vector3();

function gustAt(t){
  const g = wind*(0.62 + 0.26*Math.sin(t*0.8) + 0.16*Math.sin(t*2.17 + 1.3));
  return Math.max(0, g + 0.04*Math.sin(t*7.3)*wind);
}

function animate(){
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;
  const g = gustAt(t);

  // 云：随风漂移 + 轻微起伏
  const drift = (0.35 + g*2.4)*dt;
  for(const c of clouds){
    c.position.x += drift;
    c.position.y = c.userData.baseY + Math.sin(t*0.4 + c.userData.phase)*0.35;
    if(c.position.x > 100) c.position.x = -100;
  }

  // 风筝位置：风力物理（风越大飞得越高越稳）
  const px = Math.sin(t*0.45)*1.8*(0.35 + 0.65*wind);
  const py = S.y + lineLen*(0.34 + 0.22*g) + Math.sin(t*1.05 + 2)*0.5*g;
  const pz = S.z - lineLen*0.32 - g*1.6;
  kite.group.position.set(px, py, pz);

  // 姿态：迎风偏航 + 侧滑压坡
  const vx = dt > 0 ? (px - prevPx)/dt : 0; prevPx = px;
  const yaw = Math.atan2(camera.position.x - px, camera.position.z - pz);
  const pitch = -(0.16 + 0.24*g) + Math.sin(t*1.3)*0.06;
  const roll = clamp(-vx*0.40, -0.55, 0.55) + Math.sin(t*0.9 + 1)*0.09*g;
  kite.group.rotation.set(pitch, yaw, roll);

  flutter(t, g);
  kite.tailSegs.forEach((s, i) => {
    s.rotation.x = Math.sin(t*3.2 - i*0.75)*(0.28 + 0.50*g);
    s.rotation.z = Math.sin(t*2.1 - i*0.60)*0.22*g;
  });

  // 系留点世界坐标 → 牵引线
  kite.group.updateWorldMatrix(true, false);
  towWorld.copy(kite.towLocal).applyMatrix4(kite.group.matrixWorld);
  updateLine(t, towWorld, g);

  runTweens(dt);

  // 相机：指针视差（指数 lerp，物理感）+ 随筝高轻微抬头（风筝永不出画）
  camera.position.x += (parTX - camera.position.x)*Math.min(1, dt*2.2);
  camera.position.y += ((3.2 - parTY) - camera.position.y)*Math.min(1, dt*2.2);
  const targetLookY = clamp(3.5 + (py - 6)*0.45, 3.5, 13);
  lookY += (targetLookY - lookY)*Math.min(1, dt*1.5);
  camera.lookAt(0, lookY, 0);

  hudT += dt;
  if(hudT > 0.25){ hudT = 0; syncLabels(); }

  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* ================= 加载态 / 入场 ================= */
let firstFrame = true;
(function waitFirst(){
  renderer.render(scene, camera);
  if(firstFrame){
    firstFrame = false;
    setTimeout(() => {
      document.getElementById('loader').classList.add('done');
      document.querySelectorAll('[data-intro]').forEach((el, i) =>
        setTimeout(() => el.classList.add('is-in'), 150 + i*140));
    }, 700);
  }
})();
animate();

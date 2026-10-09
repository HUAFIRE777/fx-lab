/* lighthouse-3d · 灯塔 — original implementation
 * huafire3d fx-lab
 * 灯塔 + 旋转光束 + 海浪拍岸 + 夜雾
 */
import * as THREE from 'three';

const WARM = new THREE.Color(0xFFE9A8);   // 灯光暖黄
const COOL = new THREE.Color(0xDFF1FF);   // 冷白（光束第二档）
const NIGHT = 0x06121F;                   // 深海夜

const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.setClearColor(NIGHT);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(NIGHT, 0.011);

const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 400);

/* ---------------- 自研简易 orbit ---------------- */
const orbit = { theta: 0.65, phi: 1.12, radius: 34, tx: 0, ty: 7.2, tz: 0 };
function applyOrbit() {
  const sp = Math.sin(orbit.phi), cp = Math.cos(orbit.phi);
  camera.position.set(
    orbit.tx + orbit.radius * sp * Math.sin(orbit.theta),
    orbit.ty + orbit.radius * cp,
    orbit.tz + orbit.radius * sp * Math.cos(orbit.theta)
  );
  camera.lookAt(orbit.tx, orbit.ty, orbit.tz);
}
applyOrbit();

let dragging = false, px = 0, py = 0, pinchD = 0;
canvas.addEventListener('pointerdown', e => {
  dragging = true; px = e.clientX; py = e.clientY;
  canvas.classList.add('dragging'); canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', e => {
  if (!dragging) return;
  orbit.theta -= (e.clientX - px) * 0.0052;
  orbit.phi = THREE.MathUtils.clamp(orbit.phi - (e.clientY - py) * 0.004, 0.55, 1.5);
  px = e.clientX; py = e.clientY; applyOrbit();
});
const endDrag = () => { dragging = false; canvas.classList.remove('dragging'); };
canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);
canvas.addEventListener('wheel', e => {
  e.preventDefault();
  orbit.radius = THREE.MathUtils.clamp(orbit.radius * (1 + e.deltaY * 0.0011), 20, 60);
  applyOrbit();
}, { passive: false });
canvas.addEventListener('touchmove', e => {
  if (e.touches.length === 2) {
    const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX,
                          e.touches[0].clientY - e.touches[1].clientY);
    if (pinchD > 0) orbit.radius = THREE.MathUtils.clamp(orbit.radius * (pinchD / d), 20, 60), applyOrbit();
    pinchD = d;
  }
}, { passive: true });
canvas.addEventListener('touchend', () => { pinchD = 0; });

/* ---------------- 灯光 ---------------- */
scene.add(new THREE.AmbientLight(0x2A3B52, 0.85));
const moonFill = new THREE.DirectionalLight(0x5A7089, 0.5);
moonFill.position.set(-30, 40, -20);
scene.add(moonFill);
const lampLight = new THREE.PointLight(WARM.getHex(), 2.6, 90, 1.6);
lampLight.position.set(0, 10.6, 0);
scene.add(lampLight);

/* ---------------- 星空 ---------------- */
{
  const n = 420, pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const r = 150 + Math.random() * 120, t = Math.random() * Math.PI * 2, p = Math.random() * Math.PI * 0.48;
    pos[i * 3] = r * Math.cos(t) * Math.cos(p);
    pos[i * 3 + 1] = r * Math.sin(p) + 4;
    pos[i * 3 + 2] = r * Math.sin(t) * Math.cos(p);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xBFD0E2, size: 0.9, sizeAttenuation: false, transparent: true, opacity: 0.8, fog: false })));
}

/* ---------------- 礁石岛 ---------------- */
const rockMat = new THREE.MeshStandardMaterial({ color: 0x0B1826, roughness: 0.95, flatShading: true });
const island = new THREE.Group();
for (let i = 0; i < 7; i++) {
  const r = 2.2 + Math.random() * 2.6;
  const rock = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), rockMat);
  const a = (i / 7) * Math.PI * 2 + Math.random() * 0.5;
  rock.position.set(Math.cos(a) * (3 + Math.random() * 2.5), -1.4 - Math.random() * 1.2, Math.sin(a) * (3 + Math.random() * 2.5));
  rock.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
  rock.scale.y = 0.62;
  island.add(rock);
}
scene.add(island);

/* ---------------- 灯塔 ---------------- */
function stripeTexture() {
  const c = document.createElement('canvas'); c.width = 64; c.height = 256;
  const x = c.getContext('2d');
  for (let i = 0; i < 6; i++) {
    x.fillStyle = i % 2 ? '#0B1C30' : '#E7DCC0';
    x.fillRect(0, i * (256 / 6), 64, 256 / 6 + 1);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const tower = new THREE.Group();
const towerMesh = new THREE.Mesh(
  new THREE.CylinderGeometry(1.55, 2.35, 8.4, 24),
  new THREE.MeshStandardMaterial({ map: stripeTexture(), roughness: 0.8 })
);
towerMesh.position.y = 4.2;
tower.add(towerMesh);
// 底座
const base = new THREE.Mesh(new THREE.CylinderGeometry(2.9, 3.3, 1.2, 24),
  new THREE.MeshStandardMaterial({ color: 0x101F31, roughness: 0.95 }));
base.position.y = 0.6; tower.add(base);
// 观景廊
const gallery = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.1, 0.28, 24),
  new THREE.MeshStandardMaterial({ color: 0x0B1826, roughness: 0.9 }));
gallery.position.y = 8.55; tower.add(gallery);
// 栏杆
{
  const railMat = new THREE.MeshStandardMaterial({ color: 0x1B2C42, roughness: 0.7 });
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.7, 0.09), railMat);
    post.position.set(Math.cos(a) * 1.95, 9.05, Math.sin(a) * 1.95);
    tower.add(post);
  }
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.95, 0.06, 8, 32), railMat);
  ring.rotation.x = Math.PI / 2; ring.position.y = 9.4; tower.add(ring);
}
// 灯室
const lampMat = new THREE.MeshStandardMaterial({
  color: 0xFFE9A8, emissive: 0xFFE9A8, emissiveIntensity: 2.2, roughness: 0.3
});
const lampRoom = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 1.5, 16), lampMat);
lampRoom.position.y = 9.6; tower.add(lampRoom);
// 灯室骨架
{
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x0B1826, roughness: 0.8 });
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.6, 0.12), frameMat);
    bar.position.set(Math.cos(a) * 1.15, 9.6, Math.sin(a) * 1.15);
    tower.add(bar);
  }
  const roof = new THREE.Mesh(new THREE.ConeGeometry(1.55, 1.1, 16),
    new THREE.MeshStandardMaterial({ color: 0x101F31, roughness: 0.85 }));
  roof.position.y = 10.95; tower.add(roof);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 10), lampMat);
  tip.position.y = 11.6; tower.add(tip);
}
tower.position.y = 0.4;
scene.add(tower);

/* ---------------- 光束（双层 cone + 噪点体积感） ---------------- */
const beamUniformsList = [];
function beamMaterial(color, opacity, speed) {
  const u = {
    uColor: { value: color.clone() },
    uTime: { value: Math.random() * 10 },
    uOpacity: { value: opacity },
    uFlick: { value: 1 }
  };
  beamUniformsList.push({ u, speed });
  return new THREE.ShaderMaterial({
    uniforms: u,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: `
      varying vec2 vUv;
      void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      varying vec2 vUv;
      uniform vec3 uColor; uniform float uTime, uOpacity, uFlick;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      void main(){
        float len = 1.0 - vUv.y;                       // 0 灯端 → 1 远端
        float body = pow(1.0 - len, 1.9);
        float n = hash(vec2(floor(vUv.x * 24.0), floor(vUv.y * 40.0) - floor(uTime * 6.0)));
        float grain = 0.82 + 0.36 * n;
        float edge = smoothstep(0.0, 0.25, vUv.x) * smoothstep(1.0, 0.75, vUv.x);
        float a = body * grain * edge * uOpacity * uFlick;
        gl_FragColor = vec4(uColor, a);
      }`
  });
}
const beamGroup = new THREE.Group();
beamGroup.position.set(0, 10.0, 0);
const beamState = { color: WARM.clone(), speed: 0.42, targetSpeed: 0.42, flick: 1, targetFlick: 1 };
function makeBeam(radius, length, opacity, dirAngle) {
  const g = new THREE.ConeGeometry(radius, length, 24, 1, true);
  g.translate(0, -length / 2, 0);          // 尖端移到原点
  g.rotateX(-Math.PI / 2);                 // 尖端在灯，沿 +Z 展开
  const grp = new THREE.Group();
  const inner = new THREE.Mesh(g, beamMaterial(beamState.color, opacity, 1));
  const outerG = new THREE.ConeGeometry(radius * 1.9, length, 24, 1, true);
  outerG.translate(0, -length / 2, 0); outerG.rotateX(-Math.PI / 2);
  const outer = new THREE.Mesh(outerG, beamMaterial(beamState.color, opacity * 0.32, 0.6));
  grp.add(inner, outer);
  grp.rotation.y = dirAngle;
  beamGroup.add(grp);
  return grp;
}
makeBeam(2.6, 55, 0.5, 0);
makeBeam(2.6, 55, 0.5, Math.PI);   // 双向扫射
scene.add(beamGroup);

/* ---------------- 光晕 sprite ---------------- */
function glowTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,233,168,0.9)');
  g.addColorStop(0.35, 'rgba(255,233,168,0.28)');
  g.addColorStop(1, 'rgba(255,233,168,0)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const glowMat = new THREE.SpriteMaterial({ map: glowTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
const glow = new THREE.Sprite(glowMat);
glow.scale.set(16, 16, 1); glow.position.set(0, 10.0, 0);
scene.add(glow);
// 远处第二道光晕（海平面低雾光）
const farGlow = new THREE.Sprite(glowMat.clone());
farGlow.scale.set(60, 22, 1); farGlow.position.set(-70, 3, -90); farGlow.material.opacity = 0.35;
scene.add(farGlow);

/* ---------------- 海浪（顶点波浪 shader + 拍岸白沫） ---------------- */
const seaUniforms = {
  uTime: { value: 0 },
  uFoam: { value: 1.0 },
  uDeep: { value: new THREE.Color(0x06121F) },
  uCrest: { value: new THREE.Color(0x1C3247) },
  uFoamC: { value: new THREE.Color(0xDCE6EF) }
};
const sea = new THREE.Mesh(
  new THREE.PlaneGeometry(300, 300, 150, 150),
  new THREE.ShaderMaterial({
    uniforms: seaUniforms,
    vertexShader: `
      uniform float uTime;
      varying float vH; varying vec3 vW;
      void main(){
        vec3 p = position;
        float w = sin(p.x * 0.22 + uTime * 1.15) * 0.42
                + sin(p.y * 0.31 - uTime * 0.85) * 0.33
                + sin((p.x + p.y) * 0.13 + uTime * 0.55) * 0.34;
        p.z += w;
        vH = w;
        vec4 wp = modelMatrix * vec4(p, 1.0);
        vW = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: `
      uniform float uTime, uFoam;
      uniform vec3 uDeep, uCrest, uFoamC;
      varying float vH; varying vec3 vW;
      void main(){
        vec3 col = mix(uDeep, uCrest, smoothstep(-0.6, 1.1, vH));
        // 拍岸节奏：靠近岛礁 (r<11) 的白沫线，随时间涌动
        float r = length(vW.xz);
        float surge = 0.5 + 0.5 * sin(uTime * 0.9 - r * 0.45);
        float band = smoothstep(11.5, 7.5, r) * smoothstep(4.5, 7.0, r);
        vec2 fp = vW.xz * 0.9 + vec2(uTime * 0.25, -uTime * 0.18);
        vec2 fi = floor(fp), ff = fract(fp); ff = ff * ff * (3.0 - 2.0 * ff);
        float h00 = fract(sin(dot(fi, vec2(12.9898, 78.233))) * 43758.5453);
        float h10 = fract(sin(dot(fi + vec2(1.0, 0.0), vec2(12.9898, 78.233))) * 43758.5453);
        float h01 = fract(sin(dot(fi + vec2(0.0, 1.0), vec2(12.9898, 78.233))) * 43758.5453);
        float h11 = fract(sin(dot(fi + vec2(1.0, 1.0), vec2(12.9898, 78.233))) * 43758.5453);
        float foamN = mix(mix(h00, h10, ff.x), mix(h01, h11, ff.x), ff.y);
        float foam = band * (0.35 + 0.65 * surge) * uFoam * smoothstep(0.38, 0.72, foamN);
        // 浪尖碎白
        float crest = smoothstep(0.62, 1.0, vH) * 0.5;
        col = mix(col, uFoamC, clamp(foam + crest, 0.0, 0.85));
        // 灯下水面微光
        float glint = exp(-r * 0.06) * 0.12;
        col += vec3(1.0, 0.91, 0.66) * glint;
        gl_FragColor = vec4(col, 1.0);
      }`
  })
);
sea.rotation.x = -Math.PI / 2;
sea.position.y = -1.1;
scene.add(sea);

/* ---------------- 夜雾（FBM plane，多层漂移） ---------------- */
const fogUniformsList = [];
function fogPlane(w, h, y, z, speed, opacity) {
  const u = { uTime: { value: Math.random() * 20 }, uOpacity: { value: opacity }, uSpeed: { value: speed } };
  fogUniformsList.push(u);
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.ShaderMaterial({
      uniforms: u, transparent: true, depthWrite: false,
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `
        varying vec2 vUv; uniform float uTime, uOpacity, uSpeed;
        float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
        float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
          return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y); }
        float fbm(vec2 p){ float v = 0.0, a = 0.5; for(int i=0;i<4;i++){ v += a*noise(p); p *= 2.03; a *= 0.5; } return v; }
        void main(){
          vec2 p = vUv * vec2(3.0, 1.4) + vec2(uTime * uSpeed, 0.0);
          float f = fbm(p);
          float edge = smoothstep(0.0, 0.35, vUv.x) * smoothstep(1.0, 0.65, vUv.x)
                     * smoothstep(0.0, 0.3, vUv.y) * smoothstep(1.0, 0.7, vUv.y);
          gl_FragColor = vec4(vec3(0.42, 0.52, 0.64), f * edge * uOpacity);
        }`
    })
  );
  m.position.set(0, y, z);
  scene.add(m);
  return m;
}
fogPlane(120, 14, 2.5, -45, 0.05, 0.5);
fogPlane(150, 18, 5.5, -75, -0.03, 0.4);
fogPlane(110, 10, 1.2, 30, 0.07, 0.35);
fogPlane(140, 16, 8.0, 60, -0.04, 0.3);

/* ---------------- 交互：雾滑杆 / 光束颜色 / 守夜人模式 ---------------- */
const fogRange = document.getElementById('fog-range');
function applyFog() {
  const v = fogRange.value / 100;               // 0..1
  scene.fog.density = 0.003 + v * 0.024;
  fogUniformsList.forEach(u => u.uOpacity.value = u.uOpacity.value); // 基础层不动
  seaUniforms.uFoam.value = 1.0 - v * 0.35;
  fogPlanesOpacity(v);
}
const baseFogOp = [0.5, 0.4, 0.35, 0.3];
function fogPlanesOpacity(v) {
  fogUniformsList.forEach((u, i) => { u.uOpacity.value = baseFogOp[i] * (0.35 + v * 1.15); });
}
fogRange.addEventListener('input', applyFog);
applyFog();

const bw = document.getElementById('beam-warm'), bc = document.getElementById('beam-cool');
function setBeamColor(c, btn) {
  beamState.color.copy(c);
  beamUniformsList.forEach(({ u }) => u.uColor.value.copy(c));
  lampLight.color.copy(c); lampMat.emissive.copy(c); lampMat.color.copy(c);
  glowMat.color.copy(c); farGlow.material.color.copy(c);
  bw.classList.toggle('on', btn === bw); bc.classList.toggle('on', btn === bc);
}
bw.addEventListener('click', () => setBeamColor(WARM, bw));
bc.addEventListener('click', () => setBeamColor(COOL, bc));

const keeperTxt = document.getElementById('keeper-txt');
const keeperSub = document.getElementById('keeper-sub');
let keeper = false;
function toggleKeeper() {
  keeper = !keeper;
  beamState.targetSpeed = keeper ? 1.25 : 0.42;
  beamState.targetFlick = keeper ? 1.35 : 1.0;
  lampLight.intensity = keeper ? 4.2 : 2.6;
  keeperTxt.textContent = keeper ? '守夜人模式' : '守夜中';
  keeperSub.textContent = keeper ? 'BEAM ×3.0 · 再点塔身恢复' : 'BEAM ×1.0 · 点击灯塔加速';
}
// 点按（非拖拽）命中塔身 → 切换守夜人模式
const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
let downX = 0, downY = 0;
canvas.addEventListener('pointerdown', e => { downX = e.clientX; downY = e.clientY; });
canvas.addEventListener('pointerup', e => {
  if (Math.hypot(e.clientX - downX, e.clientY - downY) > 6) return;
  ptr.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  ray.setFromCamera(ptr, camera);
  if (ray.intersectObject(tower, true).length) toggleKeeper();
});

/* ---------------- 加载态：首帧渲染后进入完成态 ---------------- */
let entered = false;
function enter() {
  if (entered) return; entered = true;
  if (window.__lhEnter) window.__lhEnter();
}

/* ---------------- 主循环 ---------------- */
const clock = new THREE.Clock();
let firstFrame = true;
function tick() {
  requestAnimationFrame(tick);
  const t = clock.getElapsedTime();
  // 光束旋转 + 平滑加速
  beamState.speed += (beamState.targetSpeed - beamState.speed) * 0.04;
  beamState.flick += (beamState.targetFlick - beamState.flick) * 0.04;
  beamGroup.rotation.y += beamState.speed * 0.016;
  beamUniformsList.forEach(({ u, speed }) => {
    u.uTime.value = t * speed;
    u.uFlick.value = beamState.flick * (0.96 + 0.04 * Math.sin(t * 7.3));
  });
  // 灯室呼吸
  lampMat.emissiveIntensity = 2.2 * (0.94 + 0.06 * Math.sin(t * 2.1));
  glow.scale.setScalar(16 * (1 + 0.05 * Math.sin(t * 2.1)));
  // 海浪 / 雾
  seaUniforms.uTime.value = t;
  fogUniformsList.forEach(u => u.uTime.value += 0.016);
  renderer.render(scene, camera);
  if (firstFrame) { firstFrame = false; enter(); }
}
tick();

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

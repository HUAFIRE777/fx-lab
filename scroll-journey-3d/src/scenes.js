// scenes.js — 5 个连续场景，全部程序化几何，零外部模型。原创代码。
import * as THREE from 'three';
import { mulberry32, makeGlowTexture } from './utils.js';

const CYAN = 0x67E8F9, AMBER = 0xF59E0B, INK = 0x0B1026;

function track(group){
  // 收集组内所有透明材质，供主循环按滚动进度交叉淡化
  group.userData.mats = [];
  group.traverse(o => {
    if (o.material){
      const ms = Array.isArray(o.material) ? o.material : [o.material];
      ms.forEach(m => { m.transparent = true; group.userData.mats.push(m); });
    }
  });
  return group;
}

/* ① 星云粒子场：Points + additive 辉光，两种色相（青/琥珀） */
export function buildNebula(count, glowTex){
  const g = new THREE.Group();
  const rnd = mulberry32(101);
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const cCyan = new THREE.Color(CYAN), cAmber = new THREE.Color(AMBER);
  const cDim = new THREE.Color(0x2a3a66);
  for (let i = 0; i < count; i++){
    // 球壳 + 旋臂丝带混合分布
    const r = 60 + rnd() * 220;
    const th = rnd() * Math.PI * 2;
    const ph = Math.acos(2 * rnd() - 1);
    const arm = Math.sin(th * 3 + r * .02) * 14;
    pos[i*3]   = r * Math.sin(ph) * Math.cos(th) + arm;
    pos[i*3+1] = (rnd() - .5) * 160;
    pos[i*3+2] = r * Math.sin(ph) * Math.sin(th);
    const mix = rnd();
    const c = mix < .82 ? cCyan.clone().lerp(cDim, rnd() * .8)
                        : cAmber.clone().lerp(cDim, rnd() * .5);
    const b = .5 + rnd() * .9;
    col[i*3] = c.r * b; col[i*3+1] = c.g * b; col[i*3+2] = c.b * b;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const mat = new THREE.PointsMaterial({
    size: 2.6, map: glowTex, vertexColors: true,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
  });
  const pts = new THREE.Points(geo, mat);
  g.add(pts);
  g.userData.update = (t) => { pts.rotation.y = t * .008; };
  return track(g);
}

/* ② 发光虫洞隧道：TubeGeometry + 内壁 shader 流动条纹 */
export function buildWormhole(glowTex){
  const g = new THREE.Group();
  const path = new THREE.LineCurve3(new THREE.Vector3(0, 0, 120), new THREE.Vector3(0, 0, -260));
  const tube = new THREE.TubeGeometry(path, 64, 46, 40, false);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, transparent: true, depthWrite: false,
    uniforms: { uTime: { value: 0 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `
      varying vec2 vUv; uniform float uTime;
      void main(){
        float lanes = sin(vUv.x*80.0 - uTime*6.0)*.5+.5;
        float rings = sin(vUv.y*120.0 - uTime*9.0)*.5+.5;
        float glow = lanes*.5 + rings*.35 + .15;
        vec3 cyan = vec3(0.405,0.910,0.976);
        vec3 amber = vec3(0.961,0.620,0.043);
        vec3 col = mix(cyan, amber, smoothstep(.75,1.0,rings)*.35);
        float edge = smoothstep(0.0,0.25,vUv.y)*smoothstep(1.0,0.75,vUv.y);
        gl_FragColor = vec4(col*glow*edge, edge*(.35+.65*glow));
      }`,
  });
  const mesh = new THREE.Mesh(tube, mat);
  g.add(mesh);
  // 隧道中央一串琥珀色引导光点
  const rnd = mulberry32(202);
  const n = 240, pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++){
    const z = 110 - rnd() * 360, a = rnd() * Math.PI * 2, r = rnd() * 40;
    pos[i*3] = Math.cos(a) * r; pos[i*3+1] = Math.sin(a) * r; pos[i*3+2] = z;
  }
  const pg = new THREE.BufferGeometry();
  pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pm = new THREE.PointsMaterial({ size: 3, map: glowTex, color: AMBER,
    blending: THREE.AdditiveBlending, depthWrite: false });
  g.add(new THREE.Points(pg, pm));
  g.userData.update = (t) => { mat.uniforms.uTime.value = t; };
  return track(g);
}

/* ③ 低多边形月球表面：位移平面 + 程序化环形山 + 青色"地球"挂画 */
export function buildMoon(){
  const g = new THREE.Group();
  const rnd = mulberry32(303);
  const seg = 110, size = 700;
  const geo = new THREE.PlaneGeometry(size, size, seg, seg);
  geo.rotateX(-Math.PI / 2);
  const p = geo.attributes.position;
  const craters = [];
  for (let i = 0; i < 26; i++)
    craters.push({ x: (rnd()-.5)*560, z: (rnd()-.5)*560, r: 14 + rnd()*44, d: 4 + rnd()*10 });
  for (let i = 0; i < p.count; i++){
    const x = p.getX(i), z = p.getZ(i);
    let h = Math.sin(x*.02)*6 + Math.cos(z*.017)*7 + (rnd()-.5)*4; // 丘陵
    for (const c of craters){
      const d = Math.hypot(x - c.x, z - c.z);
      if (d < c.r){
        const k = Math.cos(d / c.r * Math.PI) * .5 + .5;
        h -= c.d * k;                    // 坑底
        if (d > c.r * .72) h += c.d * .55 * (1 - (d - c.r*.72) / (c.r*.28)); // 坑沿隆起
      }
    }
    p.setY(i, h);
  }
  geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ color: 0x3b4a75, roughness: .95, metalness: .05, flatShading: true });
  const moon = new THREE.Mesh(geo, mat);
  moon.position.set(0, -60, -40);
  g.add(moon);
  // 地平面低悬的"地球"：青色辉光球（配色三色内）
  const earth = new THREE.Mesh(
    new THREE.SphereGeometry(26, 32, 32),
    new THREE.MeshBasicMaterial({ color: CYAN, transparent: true, opacity: .95 })
  );
  earth.position.set(-120, 90, -420);
  g.add(earth);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeGlowTexture('rgba(103,232,249,1)'), color: CYAN,
    blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: .7 }));
  halo.scale.set(150, 150, 1);
  halo.position.copy(earth.position);
  g.add(halo);
  const dir = new THREE.DirectionalLight(0x9fd8ff, 1.1);
  dir.position.set(-200, 160, 100);
  g.add(dir);
  g.add(new THREE.AmbientLight(0x223055, 1.4));
  g.userData.update = (t) => { halo.material.opacity = .55 + Math.sin(t*1.2)*.12; };
  return track(g);
}

/* ④ 水晶洞穴：Octahedron 簇 + 双色点光源 */
export function buildCrystals(glowTex){
  const g = new THREE.Group();
  const rnd = mulberry32(404);
  const matA = new THREE.MeshStandardMaterial({ color: 0x67E8F9, roughness: .15, metalness: .3,
    emissive: 0x1b4d5a, emissiveIntensity: .7, flatShading: true });
  const matB = new THREE.MeshStandardMaterial({ color: 0xf5b73f, roughness: .2, metalness: .3,
    emissive: 0x5a3a10, emissiveIntensity: .7, flatShading: true });
  const crystals = [];
  for (let i = 0; i < 46; i++){
    const s = 6 + rnd() * 22;
    const m = new THREE.Mesh(new THREE.OctahedronGeometry(s, 0), rnd() < .8 ? matA : matB);
    const a = rnd() * Math.PI * 2, r = 20 + rnd() * 130;
    m.position.set(Math.cos(a)*r, -50 + rnd()*110, (rnd()-.5)*320);
    m.scale.y = 1.6 + rnd() * 1.8; // 晶柱拉长
    m.rotation.set(rnd()*Math.PI, rnd()*Math.PI, rnd()*.6);
    g.add(m); crystals.push({ m, ph: rnd()*Math.PI*2, base: m.position.y });
  }
  // 洞穴底岩
  const rock = new THREE.Mesh(
    new THREE.PlaneGeometry(700, 700, 40, 40),
    new THREE.MeshStandardMaterial({ color: 0x141c38, roughness: 1, flatShading: true }));
  rock.geometry.rotateX(-Math.PI/2);
  { const rp = rock.geometry.attributes.position;
    for (let i = 0; i < rp.count; i++) rp.setY(i, -58 + Math.sin(rp.getX(i)*.03)*8 + rnd()*6);
    rock.geometry.computeVertexNormals(); }
  rock.position.z = -40;
  g.add(rock);
  const l1 = new THREE.PointLight(CYAN, 900, 420, 1.8); l1.position.set(-40, 40, -120); g.add(l1);
  const l2 = new THREE.PointLight(AMBER, 700, 380, 1.8); l2.position.set(70, -10, 60); g.add(l2);
  g.add(new THREE.AmbientLight(0x1a2340, 1.2));
  g.userData.update = (t) => {
    for (const c of crystals) c.m.position.y = c.base + Math.sin(t*.8 + c.ph) * 3;
    l1.intensity = 900 + Math.sin(t*2.1) * 220;
  };
  return track(g);
}

/* ⑤ 日出云海：琥珀渐变穹顶 shader + 柔光云平面 + 太阳辉光精灵 */
export function buildSunrise(glowTex){
  const g = new THREE.Group();
  // 天空穹顶：深靛蓝 → 琥珀地平线渐变
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(600, 32, 24),
    new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false,
      vertexShader: `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: `
        varying vec3 vP;
        void main(){
          float h = normalize(vP).y; // -1..1
          vec3 ink = vec3(0.043,0.063,0.149);
          vec3 amber = vec3(0.961,0.620,0.043);
          vec3 cyan = vec3(0.405,0.910,0.976);
          vec3 col = mix(ink, amber*0.9, smoothstep(-0.05,0.28,h));
          col = mix(col, ink*1.4, smoothstep(0.25,0.9,h));
          col += cyan * smoothstep(0.55,1.0,h) * 0.10;
          gl_FragColor = vec4(col, 1.0);
        }`,
    })
  );
  g.add(sky);
  // 太阳：辉光精灵
  const sun = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeGlowTexture('rgba(255,240,210,1)', 'rgba(245,158,11,.6)'),
    color: 0xfff2cf, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  sun.scale.set(260, 260, 1);
  sun.position.set(0, 40, -560);
  g.add(sun);
  // 云海：多层柔光平面
  const rnd = mulberry32(505);
  const cloudMat = new THREE.MeshBasicMaterial({ color: 0xf7c873, transparent: true, opacity: .5 });
  for (let i = 0; i < 9; i++){
    const w = 500 + rnd()*500;
    const cm = new THREE.Mesh(new THREE.PlaneGeometry(w, 130 + rnd()*90), cloudMat.clone());
    cm.position.set((rnd()-.5)*700, -40 - rnd()*90, -120 - rnd()*380);
    cm.rotation.x = -.08;
    g.add(cm);
  }
  const dl = new THREE.DirectionalLight(0xffd9a0, 2.2);
  dl.position.set(0, 60, -400); g.add(dl);
  g.add(new THREE.AmbientLight(0x8a6a4a, 1.1));
  g.userData.update = (t) => {
    sun.material.opacity = .92 + Math.sin(t*1.4)*.06;
  };
  return track(g);
}

export { CYAN, AMBER, INK };

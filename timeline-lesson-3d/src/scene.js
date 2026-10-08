/* huafire3d fx-lab — original implementation · timeline-lesson-3d
 * Three.js 章节时间线场景：横向金色时间线、可拖拽（惯性）、节点激活时
 * 水波纹扩散 + 解锁粒子爆发、已完成节点弹出"印章"打勾态。全程序化几何，
 * 零外部模型。注意：不用 preserve-3d + blur 组合，层叠全靠 z 顺序与透明度。
 */
import * as THREE from 'three';
import { PALETTE, MOTION, CHAPTERS } from './config.js';

const GOLD = new THREE.Color(PALETTE.gold);
const CREAM = new THREE.Color(PALETTE.cream);

function textSprite(text, { size = 64, color = '#F5F1E6', w = 256, h = 128 } = {}) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.font = `700 ${size}px -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif`;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = color;
  g.fillText(text, w / 2, h / 2 + 2);
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 4;
  return new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false }));
}

function sealTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const gold = PALETTE.gold, cream = PALETTE.cream;
  g.translate(128, 128); g.rotate(-0.1);
  // 印章底
  g.fillStyle = gold;
  g.beginPath(); g.roundRect(-78, -78, 156, 156, 26); g.fill();
  // 内圈线
  g.strokeStyle = 'rgba(14,14,18,.35)'; g.lineWidth = 5;
  g.beginPath(); g.roundRect(-62, -62, 124, 124, 18); g.stroke();
  // 对勾
  g.strokeStyle = cream; g.lineWidth = 20; g.lineCap = 'round'; g.lineJoin = 'round';
  g.beginPath(); g.moveTo(-38, 2); g.lineTo(-10, 32); g.lineTo(42, -28); g.stroke();
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 4;
  return t;
}

export class TimelineScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.dead = false;
    this.n = CHAPTERS.length;
    this.spacing = MOTION.spacing;
    this.minX = -(this.n - 1) * this.spacing;
    this.vel = 0;
    this.dragging = false;
    this.pxToWorld = 0.01;
    try {
      this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    } catch (e) { this.dead = true; return; }
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    this.camera.position.set(0, 0.9, 11.5);
    this.camera.lookAt(0, 0.2, 0);
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.7));

    this.line = new THREE.Group();
    this.scene.add(this.line);
    this._buildLine();
    this._buildNodes();
    this._buildRipples();
    this._buildBurst();
    this._buildDust();

    this.raycaster = new THREE.Raycaster();
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this._t = 0;
    this._last = performance.now();
    this._loop = this._loop.bind(this);
    requestAnimationFrame(this._loop);
  }

  _buildLine() {
    const totalW = (this.n - 1) * this.spacing;
    // 底线（暗金）
    const base = new THREE.Mesh(
      new THREE.PlaneGeometry(totalW + 4, 0.028),
      new THREE.MeshBasicMaterial({ color: 0x5c4f33, transparent: true, opacity: 0.85 })
    );
    base.position.set(totalW / 2, 0, -0.05);
    this.line.add(base);
    // 进度线（亮金，从起点到当前章节），长度动态改
    this.progressGeo = new THREE.PlaneGeometry(1, 0.05);
    this.progress = new THREE.Mesh(
      this.progressGeo,
      new THREE.MeshBasicMaterial({ color: GOLD.clone(), transparent: true, opacity: 0.95 })
    );
    this.progress.position.z = -0.02;
    this.line.add(this.progress);
    // 刻度
    const tickGeo = new THREE.PlaneGeometry(0.03, 0.5);
    const tickMat = new THREE.MeshBasicMaterial({ color: 0x5c4f33, transparent: true, opacity: 0.7 });
    for (let i = 0; i < this.n; i++) {
      const t = new THREE.Mesh(tickGeo, tickMat);
      t.position.set(i * this.spacing, 0, -0.04);
      this.line.add(t);
    }
  }

  setProgress(activeIdx) {
    // 进度线从 x=0 拉到当前节点
    const len = Math.max(0.001, activeIdx * this.spacing);
    this.progressGeo.dispose();
    this.progressGeo = new THREE.PlaneGeometry(len, 0.05);
    this.progress.geometry = this.progressGeo;
    this.progress.position.x = len / 2;
  }

  _buildNodes() {
    this.nodes = [];
    const sealTex = sealTexture();
    for (let i = 0; i < this.n; i++) {
      const grp = new THREE.Group();
      grp.position.set(i * this.spacing, 0, 0);

      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.42, 0.032, 16, 72),
        new THREE.MeshBasicMaterial({ color: GOLD.clone(), transparent: true, opacity: 0.45 })
      );
      grp.add(ring);

      const core = new THREE.Mesh(
        new THREE.CircleGeometry(0.14, 32),
        new THREE.MeshBasicMaterial({ color: GOLD.clone(), transparent: true, opacity: 0.4 })
      );
      grp.add(core);

      // 章节编号
      const label = textSprite(String(i + 1).padStart(2, '0'));
      label.scale.set(1.05, 0.52, 1);
      label.position.set(0, 1.05, 0);
      grp.add(label);

      // 完成印章（打勾态）
      const seal = new THREE.Sprite(new THREE.SpriteMaterial({
        map: sealTex, transparent: true, depthWrite: false, opacity: 0,
      }));
      seal.scale.set(0.001, 0.001, 1);
      seal.position.set(0.62, 0.62, 0.2);
      grp.add(seal);

      // 点击热区（不可见大圆）
      const hit = new THREE.Mesh(
        new THREE.CircleGeometry(0.85, 16),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      hit.userData.idx = i;
      grp.add(hit);

      this.line.add(grp);
      this.nodes.push({ grp, ring, core, label, seal, hit, done: false });
    }
    this.hitList = this.nodes.map(nd => nd.hit);
  }

  _buildRipples() {
    this.ripples = [];
    const geo = new THREE.RingGeometry(0.46, 0.54, 72);
    for (let i = 0; i < 9; i++) {
      const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
        color: GOLD.clone(), transparent: true, opacity: 0,
        side: THREE.DoubleSide, depthWrite: false,
      }));
      m.visible = false;
      this.scene.add(m);
      this.ripples.push({ mesh: m, age: 1e9, delay: 0 });
    }
  }

  rippleAt(worldX) {
    let k = 0;
    for (const r of this.ripples) {
      if (r.age <= 1.4) continue;       // 忙碌中
      r.age = -(k * 0.13);              // 负 age = 延迟，3 道波纹错开 130ms
      r.delay = 0;
      r.mesh.visible = true;
      r.mesh.position.set(worldX, 0, 0.1);
      r.mesh.scale.setScalar(0.4);
      r.mesh.material.opacity = 0.85;
      if (++k >= 3) break;
    }
  }

  _buildBurst() {
    const N = 170;
    this.burstN = N;
    const pos = new Float32Array(N * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.burstMat = new THREE.PointsMaterial({
      color: GOLD.clone(), size: 0.075, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
    });
    this.burst = new THREE.Points(geo, this.burstMat);
    this.burst.visible = false;
    this.burst.frustumCulled = false;
    this.scene.add(this.burst);
    this.burstVel = new Float32Array(N * 3);
    this.burstAge = 1e9;
  }

  burstAt(worldX) {
    const pos = this.burst.geometry.attributes.position.array;
    for (let i = 0; i < this.burstN; i++) {
      pos[i * 3] = worldX; pos[i * 3 + 1] = 0; pos[i * 3 + 2] = 0;
      const a = Math.random() * Math.PI * 2;
      const sp = 0.8 + Math.random() * 2.4;
      this.burstVel[i * 3] = Math.cos(a) * sp;
      this.burstVel[i * 3 + 1] = Math.abs(Math.sin(a)) * sp * 1.2 + 0.6;
      this.burstVel[i * 3 + 2] = (Math.random() - 0.5) * 1.4;
    }
    this.burst.geometry.attributes.position.needsUpdate = true;
    this.burstAge = 0;
    this.burst.visible = true;
  }

  _buildDust() {
    const N = 220;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 12;
      pos[i * 3 + 2] = -2 - Math.random() * 4;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.dust = new THREE.Points(geo, new THREE.PointsMaterial({
      color: 0x8a744d, size: 0.05, transparent: true, opacity: 0.35, depthWrite: false,
    }));
    this.dust.frustumCulled = false;
    this.scene.add(this.dust);
  }

  worldX(i) { return this.line.position.x + i * this.spacing; }

  activate(i) {
    // 特效打在屏幕中央——吸附完成后节点正好落在这里
    this.rippleAt(0);
    this.burstAt(0);
    this.setProgress(i);
    this.nodes.forEach((nd, k) => {
      const isActive = k === i;
      const done = k < i;
      nd.done = done;
      // 环：激活亮起，完成次亮，未到黯淡
      const target = isActive ? 1 : done ? 0.85 : 0.38;
      gsap.to(nd.ring.material, { opacity: target, duration: 0.4, overwrite: true });
      gsap.to(nd.core.material, { opacity: isActive ? 1 : done ? 0.8 : 0.35, duration: 0.4, overwrite: true });
      gsap.to(nd.ring.scale, {
        x: isActive ? 1.18 : 1, y: isActive ? 1.18 : 1,
        duration: 0.5, ease: 'back.out(2)', overwrite: true,
      });
      // 印章：完成后弹出，未完成收回
      if (done && nd.seal.scale.x < 0.5) {
        gsap.to(nd.seal.scale, { x: 0.85, y: 0.85, duration: 0.55, ease: 'back.out(1.8)', delay: 0.25 });
        gsap.to(nd.seal.material, { opacity: 1, duration: 0.3, delay: 0.25 });
      } else if (!done) {
        gsap.to(nd.seal.scale, { x: 0.001, y: 0.001, duration: 0.25, overwrite: true });
        gsap.to(nd.seal.material, { opacity: 0, duration: 0.25, overwrite: true });
      }
      gsap.to(nd.label.material, { opacity: isActive ? 1 : 0.55, duration: 0.4, overwrite: true });
    });
    this.activeIdx = i;
  }

  resize() {
    if (this.dead) return;
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    const dist = this.camera.position.z;
    const visH = 2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)) * dist;
    this.pxToWorld = visH / h;
  }

  pick(clientX, clientY) {
    const r = this.canvas.getBoundingClientRect();
    const nx = ((clientX - r.left) / r.width) * 2 - 1;
    const ny = -((clientY - r.top) / r.height) * 2 + 1;
    this.raycaster.setFromCamera({ x: nx, y: ny }, this.camera);
    const hits = this.raycaster.intersectObjects(this.hitList, false);
    return hits.length ? hits[0].object.userData.idx : -1;
  }

  _loop() {
    if (this.dead) return;
    requestAnimationFrame(this._loop);
    const now = performance.now();
    const dt = Math.min(0.05, (now - this._last) / 1000);
    this._last = now;
    this._t += dt;

    // 惯性
    if (!this.dragging && Math.abs(this.vel) > 0.0004) {
      let x = this.line.position.x + this.vel;
      const m = 0.8;
      if (x > m) { x = m; this.vel = 0; }
      if (x < this.minX - m) { x = this.minX - m; this.vel = 0; }
      this.line.position.x = x;
      this.vel *= MOTION.inertiaDamp;
    }

    // 激活节点呼吸
    if (this.activeIdx != null) {
      const nd = this.nodes[this.activeIdx];
      const s = 1.18 + Math.sin(this._t * 3.2) * 0.05;
      if (!gsap.isTweening(nd.ring.scale)) nd.ring.scale.setScalar(s);
    }

    // 波纹
    for (const r of this.ripples) {
      if (r.age > 1.4) { r.mesh.visible = false; continue; }
      r.age += dt;
      if (r.age < 0) continue; // 延迟中
      const k = r.age / (MOTION.rippleMs / 1000);
      r.mesh.scale.setScalar(0.4 + k * 3.4);
      r.mesh.material.opacity = 0.85 * (1 - k);
    }

    // 粒子
    if (this.burstAge < MOTION.burstLife) {
      this.burstAge += dt;
      const k = Math.min(1, this.burstAge / MOTION.burstLife);
      const pos = this.burst.geometry.attributes.position.array;
      for (let i = 0; i < this.burstN; i++) {
        pos[i * 3] += this.burstVel[i * 3] * dt;
        pos[i * 3 + 1] += this.burstVel[i * 3 + 1] * dt;
        pos[i * 3 + 2] += this.burstVel[i * 3 + 2] * dt;
        this.burstVel[i * 3 + 1] -= 2.1 * dt;
      }
      this.burst.geometry.attributes.position.needsUpdate = true;
      this.burstMat.opacity = 0.95 * (1 - k);
      if (k >= 1) this.burst.visible = false;
    }

    // 尘埃缓漂
    this.dust.rotation.y = Math.sin(this._t * 0.05) * 0.02;

    this.renderer.render(this.scene, this.camera);
  }
}

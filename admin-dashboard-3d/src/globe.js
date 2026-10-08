// huafire3d fx-lab — original implementation
// 3D 地球：Fibonacci 点阵球体 + 稀疏弧线 + 脉冲标记。定位是安静的环境伴奏，不抢主图表风头。
import * as THREE from 'three';
import { CONFIG } from './config.js';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

// 大陆感伪随机：用球谐-ish 噪声决定点的明暗，手工调的"像地球"分布
function landNoise(x, y, z) {
  return Math.sin(x * 3.1 + 1.7) * Math.sin(y * 2.3 - 0.6) * Math.sin(z * 2.9 + 2.2)
       + 0.5 * Math.sin(x * 6.7) * Math.sin(z * 5.9);
}

export class Globe {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setClearColor(0x000000, 0);
    const mobile = matchMedia('(max-width: 900px)').matches;
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, mobile ? 1 : CONFIG.gl.globePixelRatio));
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    this.camera.position.set(0, 0.6, 7.4);
    this.camera.lookAt(0, 0, 0);
    this.root = new THREE.Group(); this.scene.add(this.root);
    this.buildDots(); this.buildArcs(); this.buildPulses();
    this.t = Math.random() * 1000;
    this.resize();
  }

  latLon(lat, lon, r) {
    const phi = (90 - lat) * Math.PI / 180, theta = (lon + 180) * Math.PI / 180;
    return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
  }

  buildDots() {
    const N = 900, R = 2.6, pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
    const c = new THREE.Color(), land = new THREE.Color('#7c7bff'), sea = new THREE.Color('#2b2b45');
    const ga = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2, rad = Math.sqrt(1 - y * y), th = ga * i;
      const v = new THREE.Vector3(Math.cos(th) * rad, y, Math.sin(th) * rad).multiplyScalar(R);
      pos.set([v.x, v.y, v.z], i * 3);
      const n = landNoise(v.x / R, v.y / R, v.z / R);
      c.copy(sea).lerp(land, Math.max(0, Math.min(1, (n + 0.35) / 1.1)));
      // 手工细节：随机透明度/明度，每颗点都不一样
      const j = 0.68 + Math.random() * 0.32;
      col.set([c.r * j, c.g * j, c.b * j], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    this.dots = new THREE.Points(g, new THREE.PointsMaterial({ size: 0.035, vertexColors: true, transparent: true, opacity: 0.9, sizeAttenuation: true }));
    this.root.add(this.dots);
    // 内核微光球
    this.root.add(new THREE.Mesh(new THREE.SphereGeometry(R * 0.985, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0x0b0b16, transparent: true, opacity: 0.72 })));
  }

  buildArcs() {
    this.arcs = [];
    const cities = [[31, 121], [39, 116], [22, 114], [35, 139], [51, 0], [40, -74], [-23, -46], [1, 103]];
    const R = 2.6;
    for (let k = 0; k < 5; k++) {
      const a = cities[(k * 3) % cities.length], b = cities[(k * 3 + 4) % cities.length];
      const p1 = this.latLon(a[0], a[1], R), p2 = this.latLon(b[0], b[1], R);
      const mid = p1.clone().add(p2).multiplyScalar(0.5).normalize().multiplyScalar(R * (1.25 + Math.random() * 0.2));
      const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
      const pts = curve.getPoints(48);
      const g = new THREE.BufferGeometry().setFromPoints(pts);
      const line = new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0x8f8dff, transparent: true, opacity: 0.5 }));
      line.userData = { total: 49, prog: 0, speed: 0.12 + Math.random() * 0.1, wait: k * 1.4 };
      this.root.add(line); this.arcs.push(line);
    }
  }

  buildPulses() {
    this.pulses = [];
    const spots = [[31, 121], [39, 116], [22, 114], [35, 139], [51, 0], [40, -74]];
    const tex = (() => {
      const cv = document.createElement('canvas'); cv.width = cv.height = 64;
      const x = cv.getContext('2d'), gr = x.createRadialGradient(32, 32, 2, 32, 32, 30);
      gr.addColorStop(0, 'rgba(157,156,255,1)'); gr.addColorStop(0.4, 'rgba(110,107,255,.55)'); gr.addColorStop(1, 'rgba(110,107,255,0)');
      x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
      return new THREE.CanvasTexture(cv);
    })();
    spots.forEach(([la, lo], i) => {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.8, depthWrite: false }));
      s.position.copy(this.latLon(la, lo, 2.62)); s.userData = { ph: i * 1.1 };
      this.root.add(s); this.pulses.push(s);
    });
  }

  ping() { // feed 来新事件时，随机一个标记闪一下
    const s = this.pulses[Math.floor(Math.random() * this.pulses.length)];
    if (s) s.userData.ph = 0;
  }

  resize() {
    const w = this.canvas.clientWidth || 300, h = this.canvas.clientHeight || 230;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
  }

  frame(dt) {
    this.t += dt;
    if (!reduced && CONFIG.gl.autoRotate) this.root.rotation.y += dt * 0.12;
    // 弧线：生长 → 停留 → 淡出，循环
    this.arcs.forEach(a => {
      const u = a.userData;
      if (this.t < u.wait) { a.geometry.setDrawRange(0, 0); return; }
      u.prog += dt * u.speed;
      const cyc = u.prog % 3;
      if (cyc < 1) { a.geometry.setDrawRange(0, Math.floor(cyc * u.total)); a.material.opacity = 0.5; }
      else if (cyc < 2) { a.geometry.setDrawRange(0, u.total); a.material.opacity = 0.5; }
      else { a.geometry.setDrawRange(0, u.total); a.material.opacity = 0.5 * (1 - (cyc - 2)); }
    });
    this.pulses.forEach(s => {
      const p = (this.t * 0.7 + s.userData.ph) % 2.4 / 2.4;
      const sc = 0.16 + p * 0.3;
      s.scale.set(sc, sc, 1);
      s.material.opacity = 0.6 * (1 - p);
    });
    this.renderer.render(this.scene, this.camera);
  }
}

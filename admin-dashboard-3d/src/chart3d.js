// huafire3d fx-lab — original implementation
// 3D 柱状图：本期/上期双系列，生长入场，hover 高亮 + 联动回调。可拖拽小幅旋转。
import * as THREE from 'three';
import { CONFIG } from './config.js';

const easeOutExpo = t => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

export class BarChart3D {
  constructor(canvas, tip) {
    this.canvas = canvas; this.tip = tip;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setClearColor(0x000000, 0);
    const mobile = matchMedia('(max-width: 900px)').matches;
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, mobile ? 1.25 : CONFIG.gl.barPixelRatio));
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x07070d, 26, 46);
    this.camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    this.camera.position.set(0, 10, 18.6);
    this.camera.lookAt(0, 2.2, 0);

    this.scene.add(new THREE.HemisphereLight(0xb9b8ff, 0x0a0a14, 0.85));
    const key = new THREE.DirectionalLight(0xffffff, 1.5);
    key.position.set(6, 12, 8); this.scene.add(key);
    const rim = new THREE.DirectionalLight(0x6e6bff, 0.9);
    rim.position.set(-8, 6, -6); this.scene.add(rim);

    this.world = new THREE.Group(); this.scene.add(this.world);
    this.bars = []; this.ray = new THREE.Raycaster();
    this.targetRotY = 0; this.rotY = 0; this.hovered = null;
    this.onHover = null; this.months = []; this.values = [];
    this._drag = null;
    this.bindPointer();
    this.resize();
  }

  build(months, current, previous) {
    while (this.world.children.length) {
      const c = this.world.children.pop();
      c.geometry?.dispose?.(); c.material?.dispose?.();
    }
    this.bars = []; this.months = months; this.values = current;
    const n = months.length;
    if (!n) return;
    const max = Math.max(...current, ...previous, 1);
    const W = Math.min(15, n * 1.35), gap = W / n, bw = gap * 0.42;

    // 地板网格
    const grid = new THREE.GridHelper(W + 3, Math.ceil(W + 3), 0x2c2c44, 0x1a1a2a);
    grid.position.y = -0.02; grid.material.transparent = true; grid.material.opacity = 0.5;
    this.world.add(grid);

    const geoCur = new THREE.BoxGeometry(bw, 1, bw);
    const geoPrev = new THREE.BoxGeometry(bw * 0.9, 1, bw * 0.9);
    const cA = new THREE.Color('#5554d8'), cB = new THREE.Color('#9d9cff'), tmp = new THREE.Color();
    for (let i = 0; i < n; i++) {
      const x = -W / 2 + gap * (i + 0.5);
      const h = Math.max(0.12, current[i] / max * 7);
      tmp.copy(cA).lerp(cB, current[i] / max);
      const m = new THREE.Mesh(geoCur, new THREE.MeshStandardMaterial({ color: tmp.clone(), roughness: 0.32, metalness: 0.25 }));
      m.position.set(x - gap * 0.22, 0, 0); m.scale.y = 0.001;
      m.userData = { i, h, base: tmp.clone(), cur: true };
      this.world.add(m); this.bars.push(m);
      if (previous[i] != null) {
        const hp = Math.max(0.12, previous[i] / max * 7);
        const pm = new THREE.Mesh(geoPrev, new THREE.MeshStandardMaterial({ color: 0x3a3a52, roughness: 0.6, metalness: 0.1, transparent: true, opacity: 0.85 }));
        pm.position.set(x + gap * 0.24, hp / 2, -0.4); pm.scale.y = hp;
        pm.userData = { i, h: hp, prev: true };
        this.world.add(pm); this.bars.push(pm);
      }
    }
    // 生长入场：stagger + easeOutExpo
    const t0 = performance.now(), dur = reduced ? 1 : CONFIG.motion.barGrowMs;
    const grow = t => {
      const p = Math.min(1, (t - t0) / dur);
      this.bars.forEach((b, k) => {
        if (b.userData.prev) return;
        const lp = Math.min(1, Math.max(0, (p * 1.35 - k / this.bars.length * 0.35)));
        b.scale.y = Math.max(0.001, b.userData.h * easeOutExpo(lp));
        b.position.y = b.scale.y / 2;
      });
      if (p < 1) requestAnimationFrame(grow);
    };
    requestAnimationFrame(grow);
  }

  bindPointer() {
    const el = this.canvas;
    el.addEventListener('pointerdown', e => { this._drag = { x: e.clientX, r: this.targetRotY }; el.setPointerCapture(e.pointerId); });
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      const nx = ((e.clientX - r.left) / r.width) * 2 - 1, ny = -((e.clientY - r.top) / r.height) * 2 + 1;
      if (this._drag) {
        this.targetRotY = Math.max(-0.55, Math.min(0.55, this._drag.r + (e.clientX - this._drag.x) / 220));
        return;
      }
      this.ray.setFromCamera(new THREE.Vector2(nx, ny), this.camera);
      const hits = this.ray.intersectObjects(this.bars.filter(b => b.userData.cur));
      const hit = hits[0]?.object || null;
      if (hit !== this.hovered) {
        if (this.hovered) { this.hovered.material.color.copy(this.hovered.userData.base); this.hovered.scale.x = this.hovered.scale.z = 1; }
        this.hovered = hit;
        if (hit) {
          hit.material.color.offsetHSL(0, 0, 0.12);
          hit.scale.x = hit.scale.z = 1.14;
          const i = hit.userData.i;
          this.tip.hidden = false;
          this.tip.innerHTML = `<div class="tt-m">${this.months[i]}</div><b>¥${this.values[i]}万</b>`;
          const wr = this.canvas.parentElement.getBoundingClientRect();
          this.tip.style.left = (e.clientX - wr.left) + 'px';
          this.tip.style.top = (e.clientY - wr.top - 14) + 'px';
          this.onHover?.(i, true);
        } else { this.tip.hidden = true; this.onHover?.(-1, false); }
        el.style.cursor = hit ? 'pointer' : 'grab';
      } else if (hit) {
        const wr = this.canvas.parentElement.getBoundingClientRect();
        this.tip.style.left = (e.clientX - wr.left) + 'px';
        this.tip.style.top = (e.clientY - wr.top - 14) + 'px';
      }
    });
    el.addEventListener('pointerup', () => { this._drag = null; });
    el.addEventListener('pointerleave', () => {
      this._drag = null; this.tip.hidden = true;
      if (this.hovered) { this.hovered.material.color.copy(this.hovered.userData.base); this.hovered.scale.x = this.hovered.scale.z = 1; this.hovered = null; }
      this.onHover?.(-1, false);
    });
  }

  resize() {
    const w = this.canvas.clientWidth || 600, h = this.canvas.clientHeight || 340;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
  }

  frame(t) {
    // 呼吸感：无交互时极缓慢左右摆动，有物理阻尼的跟随
    if (!this._drag && CONFIG.gl.autoRotate && !reduced) this.targetRotY = Math.sin(t * 0.00012) * 0.22;
    this.rotY += (this.targetRotY - this.rotY) * 0.06;
    this.world.rotation.y = this.rotY;
    this.renderer.render(this.scene, this.camera);
  }
}

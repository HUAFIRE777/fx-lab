/* huafire3d fx-lab — original implementation · lesson-steps-3d
 * 3D 发光进度珠：Three.js 小场景。珠子是二十面体 + 自发光靛蓝材质，
 * 带一盏跟随点光源、一圈光晕精灵、一串运动拖尾。滚动时按位移滚转，
 * 物理上"滚"起来而不是"滑"过去。
 */
import * as THREE from 'three';

function glowTexture(inner, outer) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 4, 64, 64, 64);
  grad.addColorStop(0, inner);
  grad.addColorStop(0.35, outer);
  grad.addColorStop(1, 'rgba(59,91,253,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  return t;
}

export class Bead {
  constructor(canvas, fallbackEl) {
    this.canvas = canvas;
    this.y = 0;            // 当前珠心 Y（canvas 像素坐标）
    this._prevY = 0;
    this.R = 15;           // 珠半径（像素），供滚转计算
    this.dead = false;
    this.trail = [];       // {y, t} 历史位置
    try {
      this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    } catch (e) {
      this.dead = true;
      if (fallbackEl) fallbackEl.style.display = 'block';
      return;
    }
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.scene = new THREE.Scene();
    const w = canvas.clientWidth || 120, h = canvas.clientHeight || 600;
    this.w = w; this.h = h;
    // 正交相机：canvas 像素即世界单位，(0,0) 在左上
    this.camera = new THREE.OrthographicCamera(0, w, 0, h, -100, 100);
    this.camera.position.z = 10;

    const glowTex = glowTexture('rgba(120,150,255,0.9)', 'rgba(59,91,253,0.35)');
    // 光晕（珠子背后）
    this.halo = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTex, transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending, opacity: 0.85,
    }));
    this.halo.scale.set(96, 96, 1);
    this.scene.add(this.halo);

    // 珠子本体：二十面体，靛蓝自发光
    this.mesh = new THREE.Mesh(
      new THREE.IcosahedronGeometry(this.R, 2),
      new THREE.MeshStandardMaterial({
        color: 0x3b5bfd, emissive: 0x3b5bfd, emissiveIntensity: 0.55,
        roughness: 0.3, metalness: 0.15, flatShading: true,
      })
    );
    this.scene.add(this.mesh);

    // 跟随点光源：让珠子"照亮"周围
    this.light = new THREE.PointLight(0x8fa4ff, 2.2, 160);
    this.scene.add(this.light);
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.35));

    // 拖尾：12 个光晕精灵，历史位置上依次排开
    this.ghosts = [];
    for (let i = 0; i < 12; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({
        map: glowTex, transparent: true, depthWrite: false,
        blending: THREE.AdditiveBlending, opacity: 0,
      }));
      const k = 1 - i / 12;
      s.scale.set(64 * k, 64 * k, 1);
      s.userData.k = k;
      this.scene.add(s);
      this.ghosts.push(s);
    }

    this.resize();
    window.addEventListener('resize', () => this.resize());
    this._loop = this._loop.bind(this);
    requestAnimationFrame(this._loop);
  }

  resize() {
    if (this.dead) return;
    const w = this.canvas.clientWidth || 120, h = this.canvas.clientHeight || 600;
    this.w = w; this.h = h;
    this.renderer.setSize(w, h, false);
    this.camera.right = w; this.camera.top = 0;
    this.camera.left = 0; this.camera.bottom = h;
    this.camera.updateProjectionMatrix();
  }

  cx() { return this.w / 2; }

  place(y) { this.y = y; this._prevY = y; this.trail.length = 0; }

  rollTo(y, durationMs) {
    if (this.dead) return;
    // 惯性感：距离越远时间越长，expo.out 收尾——像滚过去后轻轻刹住
    gsap.to(this, {
      y, duration: durationMs / 1000, ease: 'expo.out', overwrite: true,
      onUpdate: () => this.trail.push({ y: this.y, t: performance.now() }),
    });
  }

  _loop() {
    if (this.dead) return;
    requestAnimationFrame(this._loop);
    const x = this.cx();
    // 滚转：位移 / 半径 = 转过弧度，方向与运动一致
    const dy = this.y - this._prevY;
    this._prevY = this.y;
    this.mesh.rotation.z -= dy / this.R;
    this.mesh.rotation.x += dy / (this.R * 2.7);
    // 轻微呼吸
    const br = 1 + Math.sin(performance.now() / 900) * 0.03;
    this.mesh.scale.setScalar(br);
    this.mesh.position.set(x, this.y, 0);
    this.halo.position.set(x, this.y, -2);
    this.light.position.set(x, this.y, 30);

    // 拖尾：取历史位置，老的淡出
    const now = performance.now();
    while (this.trail.length && now - this.trail[0].t > 420) this.trail.shift();
    for (let i = 0; i < this.ghosts.length; i++) {
      const g = this.ghosts[i];
      const rec = this.trail[this.trail.length - 1 - i * 2];
      if (rec) {
        g.position.set(x, rec.y, -1);
        const age = (now - rec.t) / 420;
        g.material.opacity = 0.32 * g.userData.k * (1 - age);
      } else {
        g.material.opacity = 0;
      }
    }
    this.renderer.render(this.scene, this.camera);
  }
}

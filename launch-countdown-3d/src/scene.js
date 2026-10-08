/* huafire3d fx-lab — original implementation */
/* launch-countdown-3d 的 3D 舞台：悬浮产品 + 呼吸光 + 尘埃 + 揭幕粒子爆发。 */

import * as THREE from "three";
import { GLTFLoader } from "../vendor/addons/GLTFLoader.js";
import { DRACOLoader } from "../vendor/addons/DRACOLoader.js";
import { RoomEnvironment } from "../vendor/addons/RoomEnvironment.js";
import { DRACO_WRAPPER_SRC, DRACO_WASM_B64 } from "./draco-inline.gen.js";

/* Draco 解码器打进包内，无外部 decoder 路径 */
const wasmBytes = Uint8Array.from(atob(DRACO_WASM_B64), (c) => c.charCodeAt(0));
class InlineDRACOLoader extends DRACOLoader {
  _loadLibrary(url) {
    if (url === "draco_wasm_wrapper.js") return Promise.resolve(DRACO_WRAPPER_SRC);
    if (url === "draco_decoder.wasm") return Promise.resolve(wasmBytes.buffer.slice(0));
    return super._loadLibrary(url);
  }
}

const easeOutExpo = (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));

export function createScene(canvas, cfg, reduceMotion) {
  const S = cfg.scene;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(S.bg, 1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = S.exposure;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(S.bg);

  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 60);
  const baseZ = S.cameraZ;

  /* 环境反射：影棚级 PBR 质感就靠它 */
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();

  const key = new THREE.DirectionalLight(S.keyColor, 2.4);
  key.position.set(3.5, 5, 4);
  scene.add(key);

  const rim = new THREE.PointLight(S.rimColor, 60, 0, 2);
  rim.position.set(-3.2, 1.6, -2.4);
  scene.add(rim);

  const fill = new THREE.DirectionalLight(0x8fb7ff, 0.55);
  fill.position.set(-4, 1.5, 3);
  scene.add(fill);

  /* 产品组 */
  const product = new THREE.Group();
  product.position.y = S.productY;
  product.rotation.y = cfg.model.initialYaw;
  scene.add(product);

  /* 底部氛围光晕（canvas 生成的径向渐变贴图） */
  const glowTex = makeGlowTexture();
  const glow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTex,
      color: S.rimColor,
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
    })
  );
  glow.scale.set(4.6, 2.2, 1);
  glow.position.y = S.productY - 1.45;
  scene.add(glow);

  /* 环境尘埃 */
  const dust = makeDust(scene);

  /* 揭幕爆发粒子 */
  const burst = makeBurst(scene, cfg.burst.count);

  function frameCamera() {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    const aspect = w / h;
    camera.aspect = aspect;
    const fit = aspect < 1 ? Math.min(2.1, 1 / Math.pow(aspect, 0.72)) : 1;
    camera.position.set(0, S.cameraY, baseZ * fit);
    camera.lookAt(0, 0.78, 0);
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }
  frameCamera();

  const manager = new THREE.LoadingManager();
  const gltf = new GLTFLoader(manager);
  const draco = new InlineDRACOLoader(manager);
  gltf.setDRACOLoader(draco);
  draco.preload();

  let revealed = false;

  function loadModel(url, onProgress) {
    return new Promise((resolve, reject) => {
      let starts = 0,
        ends = 0;
      const oS = manager.itemStart.bind(manager);
      const oE = manager.itemEnd.bind(manager);
      manager.itemStart = (u) => {
        starts++;
        oS(u);
      };
      manager.itemEnd = (u) => {
        ends++;
        oE(u);
      };
      manager.onProgress = (u, loaded, total) =>
        onProgress && onProgress(total ? loaded / total : 0.5);
      const onModel = (g) => {
        const obj = g.scene;
        /* 归一化：缩放到目标高度，中心对齐 */
        const box = new THREE.Box3().setFromObject(obj);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const k = cfg.model.targetHeight / Math.max(size.x, size.y, size.z);
        obj.scale.setScalar(k);
        obj.position.sub(center.clone().multiplyScalar(k));
        obj.traverse((o) => {
          if (o.isMesh) {
            o.material.envMapIntensity = 0.85;
          }
        });
        product.add(obj);
        resolve();
      };
      const onFail = (e) => reject(e);
      gltf.load(url, onModel, undefined, onFail);
    });
  }

  /* 揭幕：粒子爆发 + 镜头推进 + 产品放大 */
  function reveal() {
    if (revealed) return Promise.resolve();
    revealed = true;
    const t0 = performance.now();
    if (!reduceMotion) burst.fire(product.position);
    const z0 = camera.position.z;
    const z1 = z0 - 1.7;
    const s1 = 1.3;
    return new Promise((done) => {
      (function step() {
        const p = Math.min(1, (performance.now() - t0) / 1600);
        const e = easeOutExpo(p);
        camera.position.z = z0 + (z1 - z0) * e;
        product.scale.setScalar(1 + (s1 - 1) * e);
        if (p < 1) requestAnimationFrame(step);
        else done();
      })();
    });
  }

  let elapsed = 0;
  function tick(dt) {
    elapsed += dt;
    const t = elapsed;
    if (!reduceMotion) {
      product.rotation.y += dt * S.turnSpeed;
      product.position.y = S.productY + Math.sin(t * 0.9) * S.bobAmp;
      rim.intensity = 60 + Math.sin(t * 1.4) * 18; /* 呼吸光 */
      glow.material.opacity = 0.14 + Math.sin(t * 1.4) * 0.035;
    }
    dust.tick(dt, t);
    burst.tick(dt);
    renderer.render(scene, camera);
  }

  return { loadModel, reveal, tick, frameCamera };
}

/* ---------------- 径向光晕贴图 ---------------- */
function makeGlowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.4, "rgba(255,255,255,.35)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(c);
  return tex;
}

/* ---------------- 环境尘埃 ---------------- */
function makeDust(scene) {
  const N = 240;
  const pos = new Float32Array(N * 3);
  const seed = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 9;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 5;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 5;
    seed[i] = Math.random() * 100;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    color: 0xffd9a0,
    size: 0.035,
    transparent: true,
    opacity: 0.3,
    depthWrite: false,
  });
  const pts = new THREE.Points(geo, mat);
  scene.add(pts);
  return {
    tick(dt, t) {
      const p = geo.attributes.position.array;
      for (let i = 0; i < N; i++) {
        p[i * 3 + 1] += dt * 0.06;
        p[i * 3] += Math.sin(t * 0.4 + seed[i]) * dt * 0.05;
        if (p[i * 3 + 1] > 2.6) p[i * 3 + 1] = -2.6;
      }
      geo.attributes.position.needsUpdate = true;
    },
  };
}

/* ---------------- 揭幕爆发粒子 ---------------- */
function makeBurst(scene, count) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const size = new Float32Array(count);
  const alpha = new Float32Array(count);
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("aColor", new THREE.BufferAttribute(col, 3));
  geo.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
  geo.setAttribute("aAlpha", new THREE.BufferAttribute(alpha, 1));

  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      attribute vec3 aColor;
      attribute float aSize;
      attribute float aAlpha;
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        vColor = aColor; vAlpha = aAlpha;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = aSize * (260.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float m = smoothstep(0.5, 0.06, d);
        gl_FragColor = vec4(vColor, vAlpha * m);
      }`,
  });
  const pts = new THREE.Points(geo, mat);
  pts.visible = false;
  pts.frustumCulled = false;
  scene.add(pts);

  const vel = new Float32Array(count * 3);
  const age = new Float32Array(count);
  const life = new Float32Array(count);
  let active = false;

  const amber = new THREE.Color(0xffb454);
  const white = new THREE.Color(0xfff6e8);
  const tmp = new THREE.Color();

  function fire(center) {
    for (let i = 0; i < count; i++) {
      /* 球面随机方向，偏上 */
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      const sp = 1.6 + Math.random() * 4.6;
      vel[i * 3] = Math.sin(ph) * Math.cos(th) * sp;
      vel[i * 3 + 1] = (Math.cos(ph) * 0.7 + 0.55) * sp;
      vel[i * 3 + 2] = Math.sin(ph) * Math.sin(th) * sp;
      pos[i * 3] = center.x + (Math.random() - 0.5) * 0.6;
      pos[i * 3 + 1] = center.y + (Math.random() - 0.5) * 0.9;
      pos[i * 3 + 2] = center.z + (Math.random() - 0.5) * 0.6;
      tmp.copy(amber).lerp(white, Math.random() * 0.75);
      col[i * 3] = tmp.r;
      col[i * 3 + 1] = tmp.g;
      col[i * 3 + 2] = tmp.b;
      size[i] = 1.6 + Math.random() * 4.2;
      age[i] = -Math.random() * 0.25; /* 出生错峰 */
      life[i] = 1.1 + Math.random() * 0.9;
      alpha[i] = 0;
    }
    geo.attributes.position.needsUpdate = true;
    geo.attributes.aColor.needsUpdate = true;
    geo.attributes.aSize.needsUpdate = true;
    active = true;
    pts.visible = true;
  }

  function tick(dt) {
    if (!active) return;
    let alive = 0;
    for (let i = 0; i < count; i++) {
      age[i] += dt;
      if (age[i] < 0) continue;
      const p = age[i] / life[i];
      if (p >= 1) {
        alpha[i] = 0;
        continue;
      }
      alive++;
      const damp = 1 - 1.9 * dt;
      vel[i * 3] *= damp;
      vel[i * 3 + 1] = vel[i * 3 + 1] * damp + dt * 0.55; /* 轻微上飘 */
      vel[i * 3 + 2] *= damp;
      pos[i * 3] += vel[i * 3] * dt;
      pos[i * 3 + 1] += vel[i * 3 + 1] * dt;
      pos[i * 3 + 2] += vel[i * 3 + 2] * dt;
      alpha[i] = Math.sin(Math.PI * Math.min(1, p)) * 0.95;
    }
    geo.attributes.position.needsUpdate = true;
    geo.attributes.aAlpha.needsUpdate = true;
    if (!alive) {
      active = false;
      pts.visible = false;
    }
  }

  return { fire, tick };
}

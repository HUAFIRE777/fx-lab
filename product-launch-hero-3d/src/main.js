/* huafire3d fx-lab — original implementation
 * Boot, model loading (R2 GLB with procedural fallback), keynote timeline
 * driver, chip projection, skip / reduced-motion / resize handling.
 */
import * as THREE from 'three';
import { GLTFLoader } from '../vendor/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from '../vendor/addons/loaders/DRACOLoader.js';
import { DRACO_WRAPPER_SRC, DRACO_WASM_B64 } from './draco-assets.js';
import { CONFIG } from './config.js';
import { createStage } from './stage.js';
import { createTimeline, lerp } from './timeline.js';
import { createCallouts } from './callouts.js';

// Draco 解码库内联：单文件构建零额外请求也能解 Draco 压缩模型。
// 原理：DRACOLoader 通过 _loadLibrary 取 wrapper.js + .wasm，重写它直接返回内存里的资源。
class InlineDRACOLoader extends DRACOLoader {
  _loadLibrary(url, responseType) {
    if (url === 'draco_wasm_wrapper.js') return Promise.resolve(DRACO_WRAPPER_SRC);
    if (url === 'draco_decoder.wasm') {
      const bin = atob(DRACO_WASM_B64);
      const buf = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
      return Promise.resolve(buf.buffer);
    }
    return super._loadLibrary(url, responseType);
  }
}

const $ = (id) => document.getElementById(id);

function proceduralFallback() {
  // Stylized headphone silhouette, used only if the R2 model can't load.
  const g = new THREE.Group();
  const dark = new THREE.MeshStandardMaterial({ color: 0x17171b, metalness: 0.65, roughness: 0.38 });
  const accent = new THREE.MeshStandardMaterial({
    color: 0xffb35c, metalness: 0.9, roughness: 0.3, emissive: 0x442200, emissiveIntensity: 0.6,
  });
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.085, 20, 48, Math.PI), dark);
  g.add(band);
  [-1, 1].forEach((s) => {
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.26, 32), dark);
    cup.rotation.z = Math.PI / 2;
    cup.position.set(s * 0.88, -0.08, 0);
    g.add(cup);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.022, 12, 40), accent);
    ring.rotation.y = Math.PI / 2;
    ring.position.set(s * (0.88 + 0.14), -0.08, 0);
    g.add(ring);
  });
  return g;
}

async function main() {
  const params = new URLSearchParams(location.search);
  const isMobile = matchMedia('(pointer: coarse)').matches || innerWidth < 700;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const debugFinal = params.get('state') === 'final';
  const modelUrl = params.get('model') || CONFIG.modelUrl;

  // DOM refs
  const canvas = $('gl');
  const blackout = $('blackout');
  const skipHint = $('skip');
  const loader = $('loader');
  const loadBar = $('loadbar');
  const lineEls = [...document.querySelectorAll('#hero-copy .line > span')];
  const subEl = $('hero-sub');
  const ctaEl = $('cta');
  const calloutBox = $('callouts');
  const leaders = $('leaders');

  // --- Stage (throws if WebGL unavailable -> static fallback) ---
  let stage;
  try {
    stage = createStage(canvas, CONFIG, isMobile);
  } catch (err) {
    console.warn('[launch-hero] WebGL unavailable, static fallback:', err);
    document.body.classList.add('no-webgl');
    loader.style.display = 'none';
    blackout.style.display = 'none';
    return; // copy stays visible: hidden states were never applied (CSS defaults visible)
  }

  // Hidden states are applied via JS only (never CSS), so no-JS/no-WebGL
  // still shows readable content. (fx-lab lesson: hidden-until-JS must be reachable.)
  lineEls.forEach((el) => { el.style.transform = 'translateY(112%)'; });
  subEl.style.opacity = '0';
  ctaEl.style.opacity = '0';
  ctaEl.style.transform = 'translateY(24px)';

  const pixelRatio = Math.min(
    devicePixelRatio || 1,
    isMobile ? CONFIG.quality.mobilePixelRatio : CONFIG.quality.desktopPixelRatio
  );
  const resize = () => {
    stage.resize(innerWidth, innerHeight, pixelRatio);
    leaders.setAttribute('width', String(innerWidth));
    leaders.setAttribute('height', String(innerHeight));
  };
  addEventListener('resize', resize);
  resize();

  const timeline = createTimeline(CONFIG.timeline);
  const callouts = createCallouts(calloutBox, leaders, CONFIG.callouts, CONFIG.colors.accent);

  // --- Product load ---
  const loader3d = new GLTFLoader();
  loader3d.setDRACOLoader(new InlineDRACOLoader());
  let product = null;
  const finishLoading = (obj, note) => {
    product = obj;
    const box = new THREE.Box3().setFromObject(obj);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const s = CONFIG.modelTargetSize / Math.max(size.x, size.y, size.z);
    obj.scale.setScalar(s);
    obj.position.copy(center).multiplyScalar(-s);
    obj.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        if (o.material && o.material.isMeshStandardMaterial) o.material.envMapIntensity = 0.45;
      }
    });
    stage.productGroup.add(obj);
    // Anchors in normalized space: left / right / top of the bounding box.
    const nmin = box.min.clone().sub(center).multiplyScalar(s);
    const nmax = box.max.clone().sub(center).multiplyScalar(s);
    const midY = (nmin.y + nmax.y) / 2;
    const mk = (x, y, z) => {
      const o = new THREE.Object3D();
      o.position.set(x, y, z);
      stage.productGroup.add(o);
      return o;
    };
    callouts.setAnchors([
      mk(nmin.x, midY, 0.1),
      mk(nmax.x, midY, 0.1),
      mk(0, nmax.y, 0.1),
    ]);
    if (note) console.warn(note);
    loader.classList.add('done');
    setTimeout(() => loader.remove(), 700);
    // Static (reduced-motion / ?state=final) renders once up front; the model
    // arrives later, so re-apply the final state when it lands.
    if (reducedMotion || debugFinal) {
      applyState(timeline.sample(timeline.total));
      stage.renderer.render(stage.scene, stage.camera);
    }
  };

  let settled = false;
  const loadTimer = setTimeout(() => {
    if (!settled) {
      settled = true;
      finishLoading(proceduralFallback(), '[launch-hero] model load timed out, procedural fallback used');
    }
  }, 20000);

  loader3d.load(
    modelUrl,
    (gltf) => {
      if (settled) return;
      settled = true;
      clearTimeout(loadTimer);
      finishLoading(gltf.scene, null);
    },
    (ev) => {
      if (ev.total > 0) loadBar.style.width = `${Math.round((ev.loaded / ev.total) * 100)}%`;
    },
    () => {
      if (settled) return;
      settled = true;
      clearTimeout(loadTimer);
      finishLoading(proceduralFallback(), '[launch-hero] model failed to load, procedural fallback used');
    }
  );

  // --- Interaction: click to skip / mouse parallax ---
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener('pointermove', (e) => {
    mouse.tx = (e.clientX / innerWidth) * 2 - 1;
    mouse.ty = (e.clientY / innerHeight) * 2 - 1;
  });
  addEventListener('pointerdown', () => {
    if (!timeline.skipped && !timeline.sample(performance.now() / 1000 - t0).done) {
      timeline.skipToEnd();
    }
  });

  if (reducedMotion || debugFinal) timeline.skipToEnd();

  // --- Frame loop ---
  const t0 = performance.now() / 1000;
  const clock = new THREE.Clock();
  let lastChipP = [0, 0, 0];

  function applyState(st) {
    blackout.style.opacity = String(st.blackout);
    skipHint.style.opacity = st.skipVisible && !reducedMotion ? '1' : '0';

    stage.setBeam(st.beam);
    stage.rim.intensity = 2.4 * st.rim;
    stage.fill.intensity = 14 * st.fill;

    const g = stage.productGroup;
    g.scale.setScalar(st.productScale);
    g.position.y = st.productY;

    lineEls.forEach((el, i) => {
      const p = st.headline[i] ?? 1;
      el.style.transform = `translateY(${(1 - p) * 112}%)`;
    });
    subEl.style.opacity = String(st.sub);
    subEl.style.transform = `translateY(${(1 - st.sub) * 18}px)`;
    ctaEl.style.opacity = String(st.cta);
    ctaEl.style.transform = `translateY(${(1 - st.cta) * 24}px)`;

    lastChipP = st.callouts;
    callouts.update(stage.camera, innerWidth, innerHeight, st.callouts);
  }

  // If reduced motion / debug: apply final state once, render statically.
  if (reducedMotion || debugFinal) {
    applyState(timeline.sample(timeline.total));
    stage.renderer.render(stage.scene, stage.camera);
    return;
  }

  function frame() {
    requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = performance.now() / 1000 - t0;
    const st = timeline.sample(t);
    applyState(st);

    if (st.done) {
      // Idle: slow spin + gentle hover + mouse parallax.
      stage.productGroup.rotation.y = st.productRotY + t * CONFIG.idleSpin;
      stage.productGroup.position.y = st.productY + Math.sin(t * 0.9) * CONFIG.floatAmp;
      mouse.x = lerp(mouse.x, mouse.tx, 0.04);
      mouse.y = lerp(mouse.y, mouse.ty, 0.04);
      stage.camera.position.x = mouse.x * 0.55;
      stage.camera.position.y = 0.75 - mouse.y * 0.28;
      stage.camera.lookAt(0, 0.15, 0);
    } else {
      stage.productGroup.rotation.y = st.productRotY;
    }
    stage.tickDust(t, st.beam);
    stage.renderer.render(stage.scene, stage.camera);
  }
  frame();
}

main().catch((err) => {
  console.error('[launch-hero] fatal:', err);
  document.getElementById('loader')?.remove();
});

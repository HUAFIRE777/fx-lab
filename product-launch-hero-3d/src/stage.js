/* huafire3d fx-lab — original implementation
 * Stage: renderer, camera, keynote lighting rig, floor, spotlight cone, dust.
 */
import * as THREE from 'three';
import { RoomEnvironment } from '../vendor/addons/environments/RoomEnvironment.js';

function radialTexture(inner, outer) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(128, 128, 8, 128, 128, 128);
  grad.addColorStop(0, inner);
  grad.addColorStop(1, outer);
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Vertical alpha gradient for the light cone (bright top -> transparent bottom)
function coneTexture() {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 256;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, 'rgba(255,241,221,0.55)');
  grad.addColorStop(0.55, 'rgba(255,241,221,0.16)');
  grad.addColorStop(1, 'rgba(255,241,221,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 256);
  return new THREE.CanvasTexture(c);
}

export function createStage(canvas, CONFIG, isMobile) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setClearColor(CONFIG.colors.bg, 1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(CONFIG.colors.bg, 0.055);

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 60);
  camera.position.set(0, 0.75, 6.4);
  camera.lookAt(0, 0.15, 0);

  // Soft studio reflections so the product reads as premium, kept subtle.
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  // ---- Lighting rig -------------------------------------------------
  const spot = new THREE.SpotLight(0xfff1dd, 0, 30, 0.34, 0.55, 1.1);
  spot.position.set(0.9, 4.4, 1.4);
  spot.castShadow = true;
  spot.shadow.mapSize.set(1024, 1024);
  spot.shadow.bias = -0.0004;
  scene.add(spot);
  spot.target.position.set(0, 0, 0);
  scene.add(spot.target);

  const rim = new THREE.DirectionalLight(0x8fb4ff, 0);   // cool back rim
  rim.position.set(-4.5, 2.2, -3.5);
  scene.add(rim);

  const fill = new THREE.PointLight(0xffb35c, 0, 14, 1.6); // warm amber kiss
  fill.position.set(3.2, 0.6, 2.6);
  scene.add(fill);

  scene.add(new THREE.AmbientLight(0x14141a, 1.2));

  // ---- Floor ---------------------------------------------------------
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(9, 48),
    new THREE.MeshStandardMaterial({ color: 0x0a0a0d, roughness: 0.85, metalness: 0.1 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1.15;
  floor.receiveShadow = true;
  scene.add(floor);

  // Warm pool of light under the product (fake bounce)
  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(4.4, 4.4),
    new THREE.MeshBasicMaterial({
      map: radialTexture('rgba(255,179,92,0.30)', 'rgba(255,179,92,0)'),
      transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false,
    })
  );
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = -1.14;
  scene.add(glow);

  // ---- Spotlight cone (two nested shells for a soft edge) ------------
  const coneMat = new THREE.MeshBasicMaterial({
    map: coneTexture(), transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    fog: false,
  });
  const coneGeo = new THREE.CylinderGeometry(0.32, 1.9, 4.6, isMobile ? 20 : 32, 1, true);
  const cone = new THREE.Mesh(coneGeo, coneMat);
  cone.position.set(0.35, 1.35, 0.55);
  cone.rotation.z = -0.12;
  scene.add(cone);
  const cone2 = new THREE.Mesh(coneGeo, coneMat.clone());
  cone2.material.opacity = 0;
  cone2.scale.setScalar(0.55);
  cone2.position.copy(cone.position);
  cone2.rotation.z = -0.12;
  scene.add(cone2);

  // ---- Dust motes drifting inside the beam ---------------------------
  const dustCount = isMobile ? CONFIG.quality.dustMobile : CONFIG.quality.dustDesktop;
  const dustGeo = new THREE.BufferGeometry();
  const pos = new Float32Array(dustCount * 3);
  const seed = new Float32Array(dustCount);
  for (let i = 0; i < dustCount; i++) {
    const r = Math.pow(Math.random(), 0.6) * 1.5;
    const a = Math.random() * Math.PI * 2;
    pos[i * 3] = 0.35 + Math.cos(a) * r;
    pos[i * 3 + 1] = -1 + Math.random() * 4.4;
    pos[i * 3 + 2] = 0.55 + Math.sin(a) * r * 0.7;
    seed[i] = Math.random() * 100;
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const dustMat = new THREE.PointsMaterial({
    color: 0xffe8c4, size: 0.022, transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
  });
  const dust = new THREE.Points(dustGeo, dustMat);
  dust.userData = { base: pos.slice(), seed };
  scene.add(dust);

  const productGroup = new THREE.Group();
  scene.add(productGroup);

  function resize(w, h, pixelRatio) {
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  // Gentle dust drift; t = seconds
  function tickDust(t, strength) {
    const p = dust.geometry.attributes.position;
    const { base, seed } = dust.userData;
    for (let i = 0; i < dustCount; i++) {
      p.array[i * 3 + 1] = base[i * 3 + 1] + Math.sin(t * 0.35 + seed[i]) * 0.22;
      p.array[i * 3] = base[i * 3] + Math.cos(t * 0.22 + seed[i] * 1.7) * 0.1;
    }
    p.needsUpdate = true;
    dustMat.opacity = 0.75 * strength;
  }

  return {
    renderer, scene, camera, spot, rim, fill, glow,
    coneMats: [cone.material, cone2.material],
    productGroup, resize, tickDust,
    setBeam(v) { // v: 0..1 master beam intensity
      spot.intensity = 520 * v;
      cone.material.opacity = 0.5 * v;
      cone2.material.opacity = 0.65 * v;
      glow.material.opacity = 0.85 * v;
    },
  };
}

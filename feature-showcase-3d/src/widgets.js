/* huafire3d fx-lab — original implementation */
/* Procedural mini-3D widgets for the bento cards. No external models, no textures. */

const ACCENT = "#7c8aff";
const WHITE = "#eef1f6";

function makeRenderer(THREE, canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.setClearColor(0x000000, 0);
  return renderer;
}

function base(THREE, canvas) {
  const renderer = makeRenderer(THREE, canvas);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(0, 0.4, 8);
  camera.lookAt(0, 0, 0);
  let boost = 1, boostTarget = 1;
  return {
    renderer, scene, camera,
    api: {
      setBoost(b) { boostTarget = b; },
      resize(w, h) {
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      },
      dispose() {
        scene.traverse((o) => {
          if (o.geometry) o.geometry.dispose();
          if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
        });
        renderer.dispose();
      },
    },
    tick(dt) {
      boost += (boostTarget - boost) * Math.min(1, dt * 5);
      return boost;
    },
  };
}

function lineBox(THREE, size, color, opacity) {
  const geo = new THREE.EdgesGeometry(new THREE.BoxGeometry(size, size, size));
  const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
  return new THREE.LineSegments(geo, mat);
}

/* 01 — nested rotating wireframe cubes */
function orbiters(THREE, canvas) {
  const b = base(THREE, canvas);
  const group = new THREE.Group();
  const c1 = lineBox(THREE, 2.6, ACCENT, 0.85);
  const c2 = lineBox(THREE, 1.7, ACCENT, 0.45);
  const c3 = lineBox(THREE, 0.9, WHITE, 0.7);
  group.add(c1, c2, c3);
  group.rotation.x = 0.35;
  b.scene.add(group);
  return {
    ...b.api,
    update(t, dt) {
      const k = b.tick(dt);
      c1.rotation.y += dt * 0.35 * k; c1.rotation.x += dt * 0.12 * k;
      c2.rotation.y -= dt * 0.55 * k; c2.rotation.z += dt * 0.2 * k;
      c3.rotation.x += dt * 0.8 * k;  c3.rotation.y += dt * 0.5 * k;
      b.renderer.render(b.scene, b.camera);
    },
  };
}

/* 02 — particle sphere, two-tone */
function particles(THREE, canvas) {
  const b = base(THREE, canvas);
  const group = new THREE.Group();
  const mk = (n, color, size, rMin, rMax, opacity) => {
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const r = rMin + Math.random() * (rMax - rMin);
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
      pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
      pos[i * 3 + 2] = r * Math.cos(ph);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color, size, transparent: true, opacity,
      blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
    });
    return new THREE.Points(geo, mat);
  };
  group.add(mk(650, ACCENT, 0.05, 2.2, 2.75, 0.85));
  group.add(mk(160, WHITE, 0.04, 1.6, 2.3, 0.5));
  b.scene.add(group);
  return {
    ...b.api,
    update(t, dt) {
      const k = b.tick(dt);
      group.rotation.y += dt * 0.25 * k;
      group.rotation.x = Math.sin(t * 0.2) * 0.18;
      b.renderer.render(b.scene, b.camera);
    },
  };
}

/* 03 — animated sine wave ribbon */
function wave(THREE, canvas) {
  const b = base(THREE, canvas);
  const geo = new THREE.PlaneGeometry(7.6, 2.4, 110, 14);
  const basePos = geo.attributes.position.array.slice();
  const mat = new THREE.MeshBasicMaterial({ color: ACCENT, wireframe: true, transparent: true, opacity: 0.5 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -0.5;
  b.scene.add(mesh);
  const pos = geo.attributes.position;
  return {
    ...b.api,
    update(t, dt) {
      const k = b.tick(dt);
      const tt = t * (0.9 + 0.6 * (k - 1));
      for (let i = 0; i < pos.count; i++) {
        const x = basePos[i * 3], y = basePos[i * 3 + 1];
        pos.array[i * 3 + 2] =
          Math.sin(x * 1.25 + tt * 2.1) * 0.34 +
          Math.cos(y * 2.0 + tt * 1.35) * 0.18;
      }
      pos.needsUpdate = true;
      b.renderer.render(b.scene, b.camera);
    },
  };
}

/* 04 — torus knot wireframe */
function knot(THREE, canvas) {
  const b = base(THREE, canvas);
  const geo = new THREE.TorusKnotGeometry(1.45, 0.4, 150, 20);
  const mat = new THREE.MeshBasicMaterial({ color: ACCENT, wireframe: true, transparent: true, opacity: 0.6 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = 0.5;
  b.scene.add(mesh);
  return {
    ...b.api,
    update(t, dt) {
      const k = b.tick(dt);
      mesh.rotation.y += dt * 0.3 * k;
      mesh.rotation.z += dt * 0.1 * k;
      b.renderer.render(b.scene, b.camera);
    },
  };
}

/* 05 — radar sweep */
function radar(THREE, canvas) {
  const b = base(THREE, canvas);
  const group = new THREE.Group();
  const rings = [];
  for (let i = 0; i < 3; i++) {
    const geo = new THREE.RingGeometry(0.96, 1.0, 72);
    const mat = new THREE.MeshBasicMaterial({
      color: ACCENT, transparent: true, opacity: 0.6,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(geo, mat);
    group.add(ring);
    rings.push(ring);
  }
  const dot = new THREE.Mesh(
    new THREE.CircleGeometry(0.09, 24),
    new THREE.MeshBasicMaterial({ color: WHITE })
  );
  group.add(dot);
  const sweepGeo = new THREE.PlaneGeometry(2.35, 0.025);
  const sweep = new THREE.Mesh(sweepGeo, new THREE.MeshBasicMaterial({
    color: ACCENT, transparent: true, opacity: 0.85,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  sweep.geometry.translate(1.175, 0, 0); // pivot at center
  group.add(sweep);
  b.scene.add(group);
  return {
    ...b.api,
    update(t, dt) {
      const k = b.tick(dt);
      const tt = t * k;
      rings.forEach((ring, i) => {
        const p = (tt * 0.32 + i / 3) % 1;
        ring.scale.setScalar(0.25 + p * 2.05);
        ring.material.opacity = (1 - p) * 0.7;
      });
      sweep.rotation.z = -tt * 1.4;
      dot.scale.setScalar(1 + Math.sin(tt * 4) * 0.18);
      b.renderer.render(b.scene, b.camera);
    },
  };
}

/* 06 — morphing icosahedron */
function morph(THREE, canvas) {
  const b = base(THREE, canvas);
  const geo = new THREE.IcosahedronGeometry(1.9, 3);
  const basePos = geo.attributes.position.array.slice();
  const mat = new THREE.MeshBasicMaterial({ color: ACCENT, wireframe: true, transparent: true, opacity: 0.55 });
  const mesh = new THREE.Mesh(geo, mat);
  b.scene.add(mesh);
  const pos = geo.attributes.position;
  return {
    ...b.api,
    update(t, dt) {
      const k = b.tick(dt);
      const tt = t * (0.8 + 0.7 * (k - 1));
      for (let i = 0; i < pos.count; i++) {
        const bx = basePos[i * 3], by = basePos[i * 3 + 1], bz = basePos[i * 3 + 2];
        const n = 1 + 0.13 *
          Math.sin(bx * 1.9 + tt * 1.7) *
          Math.sin(by * 2.3 - tt * 1.25) *
          Math.sin(bz * 1.6 + tt * 0.9);
        pos.array[i * 3] = bx * n;
        pos.array[i * 3 + 1] = by * n;
        pos.array[i * 3 + 2] = bz * n;
      }
      pos.needsUpdate = true;
      mesh.rotation.y += dt * 0.22 * k;
      b.renderer.render(b.scene, b.camera);
    },
  };
}

const FACTORY = { orbiters, particles, wave, knot, radar, morph };

/* THREE is passed in by main.js (which imports it), so this module stays import-free. */
export function createWidget(type, canvas, THREE) {
  const fn = FACTORY[type] || orbiters;
  return fn(THREE, canvas);
}

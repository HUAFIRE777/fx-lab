/* huafire3d fx-lab — original implementation */
/* company-hero-3d · GPU 粒子星云：全页唯一核心动效
   参考 lusion.co 式"粒子星云 + 电影感慢镜头"的感觉，shader 与参数均为独立编写 */
import * as THREE from 'three';

const VERT = /* glsl */`
attribute vec4 aSeed;          /* x: 尺寸随机  y: 取色  z: 闪烁相位  w: 闪烁速度 */
uniform float uTime;
uniform float uPixelRatio;
uniform float uSize;
uniform float uDrift;
varying float vAlpha;
varying float vPick;
varying float vTwk;
void main() {
  vec3 p = position;
  float t = uTime;
  /* 慢速正弦漂移：两层不同 uDrift，形成深浅错动 */
  p.x += sin(t * 0.10 + position.y * 0.32 + aSeed.z * 6.2831) * 0.38 * uDrift;
  p.y += cos(t * 0.075 + position.x * 0.27 + aSeed.z * 6.2831) * 0.32 * uDrift;
  p.z += sin(t * 0.055 + position.x * 0.19 + position.y * 0.21) * 0.45 * uDrift;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  float dist = -mv.z;
  vTwk = 0.70 + 0.30 * sin(t * aSeed.w + aSeed.z * 6.2831);
  vPick = aSeed.y;
  /* 远处淡出，避免穿帮 */
  vAlpha = smoothstep(16.0, 5.0, dist);
  gl_PointSize = uSize * (0.45 + aSeed.x * 0.9) * uPixelRatio * (150.0 / dist);
  gl_Position = projectionMatrix * mv;
}
`;

const FRAG = /* glsl */`
precision mediump float;
uniform vec3 uColA;
uniform vec3 uColB;
uniform vec3 uColC;
uniform float uOpacity;
varying float vAlpha;
varying float vPick;
varying float vTwk;
void main() {
  vec2 uv = gl_PointCoord - vec2(0.5);
  float d = length(uv);
  float disc = smoothstep(0.5, 0.06, d);   /* 柔边圆点 */
  vec3 col = uColA;
  if (vPick > 0.94) col = uColC;           /* 6% 暖尘，极淡 */
  else if (vPick > 0.70) col = uColB;      /* 24% 信号紫 */
  float a = disc * vAlpha * vTwk * uOpacity;
  if (a < 0.004) discard;
  gl_FragColor = vec4(col, a);
}
`;

function makeLayer({ count, spread, band, size, opacity, drift, seedOffset }) {
  const pos = new Float32Array(count * 3);
  const seed = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    /* 星层铺满深空；雾层收拢成一条斜向星云带 */
    let x = (Math.random() * 2 - 1) * spread.x;
    let y = (Math.random() * 2 - 1) * spread.y;
    let z = -Math.random() * spread.z - 1.5;
    if (band) {
      const t = Math.random() * 2 - 1;
      x = t * spread.x;
      y = t * spread.y * 0.8 + (Math.random() * 2 - 1) * 2.6 - 0.8;
      z = -Math.random() * spread.z * 0.55 - 2.5;
    }
    pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
    seed[i * 4] = Math.random();
    seed[i * 4 + 1] = Math.random();
    seed[i * 4 + 2] = Math.random();
    seed[i * 4 + 3] = 0.6 + Math.random() * 1.8;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
  const m = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms: {
      uTime: { value: seedOffset },
      uPixelRatio: { value: 1 },
      uSize: { value: size },
      uDrift: { value: drift },
      uOpacity: { value: opacity },
      uColA: { value: new THREE.Color('#cdd8f2') },
      uColB: { value: new THREE.Color('#7c6cff') },
      uColC: { value: new THREE.Color('#d8b48f') },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const pts = new THREE.Points(g, m);
  pts.frustumCulled = false;
  return pts;
}

export function createNebula(scene, cfg, isMobile) {
  const group = new THREE.Group();
  const stars = makeLayer({
    count: isMobile ? cfg.starsMobile : cfg.stars,
    spread: { x: 14, y: 8, z: 12 },
    band: false,
    size: cfg.starSize,
    opacity: cfg.starOpacity,
    drift: 0.55,
    seedOffset: 0,
  });
  const nebula = makeLayer({
    count: isMobile ? cfg.nebulaMobile : cfg.nebula,
    spread: { x: 11, y: 5, z: 7 },
    band: true,
    size: cfg.nebulaSize,
    opacity: cfg.nebulaOpacity,
    drift: 1.0,
    seedOffset: 37.7,
  });
  group.add(stars, nebula);
  scene.add(group);

  const api = {
    setPixelRatio(pr) {
      stars.material.uniforms.uPixelRatio.value = pr;
      nebula.material.uniforms.uPixelRatio.value = pr;
    },
    setPalette(colA, colB, colC) {
      for (const p of [stars, nebula]) {
        p.material.uniforms.uColA.value.set(colA);
        p.material.uniforms.uColB.value.set(colB);
        p.material.uniforms.uColC.value.set(colC);
      }
    },
    tick(t) {
      stars.material.uniforms.uTime.value = t;
      nebula.material.uniforms.uTime.value = t * 0.82 + 37.7;
    },
  };
  return api;
}

/* huafire3d fx-lab — original implementation
   admin-login-3d: GPU particle background + glass auth card.
   All code written from scratch. */

import * as THREE from 'three';

/* ================= CONFIG ================= */
const CONFIG = {
  brand: { name: 'NOVA' },
  bg: {
    particles: 2600,          // desktop particle count
    mobileParticles: 900,     // <=480px particle count
    colorA: '#6366f1',        // indigo
    colorB: '#22d3ee',        // cyan
    speed: 0.35,              // drift speed multiplier
    parallax: 0.35,           // mouse parallax strength (0..1)
    maxPixelRatio: 2,
    mobilePixelRatio: 1.5,
  },
  auth: {
    fakeDelayMs: 1500,        // simulated sign-in latency
    minPassword: 8,
    demoEmail: 'demo@nova.io',
    demoPassword: 'novademo1',
  },
};
document.querySelector('[data-brand]').textContent = CONFIG.brand.name;

/* ================= background ================= */
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = window.matchMedia('(max-width: 480px)').matches;

function webglOK() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext &&
      (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (e) { return false; }
}

function initBackground() {
  if (!webglOK()) { document.body.classList.add('no-webgl'); return; }

  const host = document.getElementById('bg3d');
  const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1,
    isMobile ? CONFIG.bg.mobilePixelRatio : CONFIG.bg.maxPixelRatio));
  renderer.setSize(window.innerWidth, window.innerHeight);
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  // slight tilt so the field reads as a "wall of stars" receding into depth
  const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 60);
  camera.position.set(0, 0, 9);

  const COUNT = isMobile ? CONFIG.bg.mobileParticles : CONFIG.bg.particles;
  const pos = new Float32Array(COUNT * 3);
  const seed = new Float32Array(COUNT);
  const psize = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) {
    // spread wide, deeper z for parallax layers
    pos[i * 3] = (Math.random() - 0.5) * 34;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 14;
    seed[i] = Math.random() * Math.PI * 2;
    // handcrafted size distribution: many tiny, few bright — avoids uniform "AI dots"
    const r = Math.random();
    psize[i] = r < 0.72 ? 0.5 + Math.random() * 1.1
             : r < 0.94 ? 1.6 + Math.random() * 1.6
             : 3.2 + Math.random() * 2.4;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  geo.setAttribute('aSize', new THREE.BufferAttribute(psize, 1));

  const cA = new THREE.Color(CONFIG.bg.colorA);
  const cB = new THREE.Color(CONFIG.bg.colorB);

  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uSpeed: { value: CONFIG.bg.speed },
      uColorA: { value: new THREE.Vector3(cA.r, cA.g, cA.b) },
      uColorB: { value: new THREE.Vector3(cB.r, cB.g, cB.b) },
      uPixelRatio: { value: renderer.getPixelRatio() },
    },
    vertexShader: /* glsl */`
      attribute float aSeed;
      attribute float aSize;
      uniform float uTime;
      uniform float uSpeed;
      uniform float uPixelRatio;
      varying float vSeed;
      varying float vAlpha;
      void main() {
        vSeed = aSeed;
        vec3 p = position;
        float t = uTime * uSpeed;
        // slow organic drift: each particle on its own lissajous-ish path
        p.x += sin(t * 0.22 + aSeed * 1.7) * 1.1;
        p.y += cos(t * 0.16 + aSeed * 2.3) * 0.8;
        p.z += sin(t * 0.12 + aSeed) * 0.9;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        // twinkle: alpha breathes per-particle, never fully dies
        vAlpha = 0.35 + 0.65 * (0.5 + 0.5 * sin(t * (0.6 + fract(aSeed) * 1.4) + aSeed * 3.1));
        float dist = -mv.z;
        gl_PointSize = aSize * uPixelRatio * (14.0 / dist);
      }
    `,
    fragmentShader: /* glsl */`
      uniform vec3 uColorA;
      uniform vec3 uColorB;
      varying float vSeed;
      varying float vAlpha;
      void main() {
        vec2 uv = gl_PointCoord - 0.5;
        float d = length(uv);
        if (d > 0.5) discard;
        // soft round sprite with hot core
        float core = smoothstep(0.5, 0.05, d);
        float glow = smoothstep(0.5, 0.22, d) * 0.45;
        float tone = fract(vSeed * 0.61803);           // golden-ratio hash → indigo/cyan mix
        vec3 col = mix(uColorA, uColorB, smoothstep(0.15, 0.85, tone));
        float a = (core + glow) * vAlpha * (0.35 + 0.65 * smoothstep(0.3, 1.0, tone * 0.5 + 0.5));
        gl_FragColor = vec4(col * (0.75 + core * 0.6), a);
      }
    `,
  });
  const points = new THREE.Points(geo, mat);
  scene.add(points);

  // mouse parallax with eased lerp — physical feel, no snapping
  const target = { x: 0, y: 0 };
  const cur = { x: 0, y: 0 };
  window.addEventListener('pointermove', (e) => {
    target.x = (e.clientX / window.innerWidth - 0.5) * 2;
    target.y = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  let running = true;
  document.addEventListener('visibilitychange', () => { running = !document.hidden; });

  const clock = new THREE.Clock();
  if (reduceMotion) {
    // one static frame: still pretty, zero motion
    mat.uniforms.uTime.value = 8.0;
    renderer.render(scene, camera);
    return;
  }
  (function tick() {
    requestAnimationFrame(tick);
    if (!running) return;
    mat.uniforms.uTime.value = clock.getElapsedTime();
    const k = CONFIG.bg.parallax;
    cur.x += (target.x * k - cur.x) * 0.045;   // critically-damped-ish ease
    cur.y += (target.y * k - cur.y) * 0.045;
    camera.position.x = cur.x * 1.6;
    camera.position.y = -cur.y * 1.0;
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
  })();
}

/* ================= form ================= */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function setInvalid(fieldId, message) {
  const f = document.getElementById(fieldId);
  f.classList.remove('invalid');
  void f.offsetWidth; // restart shake animation
  if (message) {
    f.classList.add('invalid');
    f.querySelector('.msg').textContent = message;
  } else {
    f.querySelector('.msg').textContent = '';
  }
}

function validate() {
  const email = document.getElementById('email').value.trim();
  const pass = document.getElementById('password').value;
  let ok = true;
  if (!email) { setInvalid('f-email', 'Enter your work email.'); ok = false; }
  else if (!EMAIL_RE.test(email)) { setInvalid('f-email', 'That email doesn’t look right.'); ok = false; }
  else setInvalid('f-email', '');
  if (!pass) { setInvalid('f-pass', 'Enter your password.'); ok = false; }
  else if (pass.length < CONFIG.auth.minPassword) {
    setInvalid('f-pass', `Password needs at least ${CONFIG.auth.minPassword} characters.`); ok = false;
  } else setInvalid('f-pass', '');
  return ok;
}

function initForm() {
  const form = document.getElementById('login-form');
  const submit = document.getElementById('submit');
  const note = document.getElementById('form-note');

  // clear error state while typing
  form.addEventListener('input', (e) => {
    const field = e.target.closest('.field');
    if (field && field.classList.contains('invalid')) setInvalid(field.id, '');
  });

  // show / hide password
  const peek = document.getElementById('peek');
  const pass = document.getElementById('password');
  peek.addEventListener('click', () => {
    const showing = pass.type === 'password';
    pass.type = showing ? 'text' : 'password';
    peek.classList.toggle('showing', showing);
    peek.setAttribute('aria-pressed', String(showing));
    peek.setAttribute('aria-label', showing ? 'Hide password' : 'Show password');
    pass.focus();
  });

  // SSO placeholders — swap for real OAuth in production
  document.querySelectorAll('[data-sso]').forEach((btn) => {
    btn.addEventListener('click', () => {
      note.classList.remove('ok');
      note.textContent = `${btn.dataset.sso === 'google' ? 'Google' : 'GitHub'} SSO isn’t wired up in this demo.`;
    });
  });

  let busy = false;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (busy) return;
    note.classList.remove('ok');
    note.textContent = '';
    if (!validate()) {
      const firstBad = document.querySelector('.field.invalid input');
      if (firstBad) firstBad.focus();
      return;
    }
    busy = true;
    submit.dataset.state = 'loading';
    submit.disabled = true;
    // simulate network round-trip; in production, replace with fetch()
    setTimeout(() => {
      const email = document.getElementById('email').value.trim();
      const passVal = document.getElementById('password').value;
      const remember = document.getElementById('remember').checked;
      try {
        if (remember) localStorage.setItem('nova.remember', email);
      } catch (err) { /* private mode — non-fatal */ }
      const ok = email === CONFIG.auth.demoEmail && passVal === CONFIG.auth.demoPassword;
      if (ok) {
        submit.dataset.state = 'success';
        note.classList.add('ok');
        note.textContent = 'Signed in — redirecting to your workspace…';
      } else {
        submit.dataset.state = 'idle';
        submit.disabled = false;
        busy = false;
        setInvalid('f-pass', 'Wrong email or password. Try demo@nova.io / novademo1.');
        document.getElementById('password').focus();
        document.getElementById('password').select();
      }
    }, CONFIG.auth.fakeDelayMs);
  });

  // prefill remembered email
  try {
    const saved = localStorage.getItem('nova.remember');
    if (saved) document.getElementById('email').value = saved;
  } catch (err) { /* ignore */ }

  // demo hint: first focus on empty password field shows the demo creds once
  let hinted = false;
  document.getElementById('email').addEventListener('focus', () => {
    if (!hinted && !document.getElementById('email').value) {
      hinted = true;
      note.textContent = `Demo account — ${CONFIG.auth.demoEmail} / ${CONFIG.auth.demoPassword}`;
    }
  }, { once: false });
}

initBackground();
initForm();

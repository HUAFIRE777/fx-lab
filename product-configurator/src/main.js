// huafire3d fx-lab — original implementation
//
// product-configurator：独立站 3D 产品配置器。
// 左侧 Three.js 实时预览（OrbitControls 旋转/缩放），右侧配置面板。
// 换色 / 换材质全部通过共享覆盖材质（material override）实现，不修改模型文件。

import * as THREE from 'three';
import { OrbitControls } from './addons/OrbitControls.js';
import { GLTFLoader } from './addons/GLTFLoader.js';
import { RoomEnvironment } from './addons/RoomEnvironment.js';
import { MeshoptDecoder } from './addons/meshopt_decoder.module.js';
import { CONFIG } from './config.js';

const $ = (s) => document.querySelector(s);
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isCoarse = window.matchMedia('(pointer: coarse)').matches;
const params = new URLSearchParams(location.search);
// ?model= 覆盖模型 URL（方便测试加载失败态）；?spin=0 关闭自动旋转
const modelUrl = params.get('model') || CONFIG.model.url;

/* ---------------- 状态 ---------------- */
// 单选组存 choiceId，多选组存 choiceId 数组
const state = {};
for (const g of CONFIG.options) {
  state[g.id] = g.type === 'check'
    ? [...(CONFIG.defaults[g.id] || [])]
    : (CONFIG.defaults[g.id] ?? g.choices[0].id);
}

const choiceOf = (groupId, choiceId) =>
  CONFIG.options.find((g) => g.id === groupId).choices.find((c) => c.id === choiceId);

function calcPrice() {
  let total = CONFIG.product.basePrice;
  const parts = [];
  for (const g of CONFIG.options) {
    const ids = g.type === 'check' ? state[g.id] : [state[g.id]];
    for (const id of ids) {
      const c = choiceOf(g.id, id);
      if (c && c.priceDelta) {
        total += c.priceDelta;
        parts.push(`${c.label} +${CONFIG.product.formatPrice(c.priceDelta)}`);
      }
    }
  }
  return { total, parts };
}

/* ---------------- 价格 UI ---------------- */
const priceEl = $('#price');
const deltaEl = $('#delta-line');

function renderPrice() {
  const { total, parts } = calcPrice();
  priceEl.textContent = CONFIG.product.formatPrice(total);
  deltaEl.innerHTML = parts.length
    ? '含：' + parts.map((p) => `<b>${p}</b>`).join('、')
    : '标配价格';
  if (!reducedMotion) {
    priceEl.classList.remove('bump');
    void priceEl.offsetWidth; // 重启动画
    priceEl.classList.add('bump');
  }
}

/* ---------------- 选项面板（由 CONFIG 动态生成） ---------------- */
const groupsEl = $('#opt-groups');

function buildOptions() {
  for (const g of CONFIG.options) {
    const wrap = document.createElement('div');
    wrap.className = 'opt-group';
    wrap.dataset.group = g.id;

    const h3 = document.createElement('h3');
    h3.textContent = g.label;
    const sel = document.createElement('span');
    sel.className = 'sel';
    h3.appendChild(sel);
    wrap.appendChild(h3);

    if (g.type === 'swatch') {
      const box = document.createElement('div');
      box.className = 'swatches';
      for (const c of g.choices) {
        const b = document.createElement('button');
        b.className = 'swatch' + (state[g.id] === c.id ? ' active' : '');
        b.dataset.choice = c.id;
        b.title = c.label;
        b.setAttribute('aria-label', `${g.label}：${c.label}`);
        const dot = document.createElement('i');
        dot.style.background = c.color;
        b.appendChild(dot);
        b.addEventListener('click', () => selectSingle(g, c.id));
        box.appendChild(b);
      }
      wrap.appendChild(box);
    } else if (g.type === 'pill') {
      const box = document.createElement('div');
      box.className = 'pills';
      for (const c of g.choices) {
        const b = document.createElement('button');
        b.className = 'pill' + (state[g.id] === c.id ? ' active' : '');
        b.dataset.choice = c.id;
        b.setAttribute('aria-label', `${g.label}：${c.label}`);
        b.innerHTML = '';
        b.appendChild(document.createTextNode(c.label + ' '));
        const sm = document.createElement('small');
        sm.textContent = c.priceDelta ? '+' + CONFIG.product.formatPrice(c.priceDelta) : '标配';
        b.appendChild(sm);
        b.addEventListener('click', () => selectSingle(g, c.id));
        box.appendChild(b);
      }
      wrap.appendChild(box);
    } else if (g.type === 'check') {
      const box = document.createElement('div');
      box.className = 'checks';
      for (const c of g.choices) {
        const label = document.createElement('label');
        label.className = 'check' + (state[g.id].includes(c.id) ? ' active' : '');
        label.dataset.choice = c.id;
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.checked = state[g.id].includes(c.id);
        input.setAttribute('aria-label', c.label);
        const boxEl = document.createElement('span');
        boxEl.className = 'box';
        const name = document.createElement('span');
        name.textContent = c.label;
        const amt = document.createElement('span');
        amt.className = 'amt';
        amt.textContent = '+' + CONFIG.product.formatPrice(c.priceDelta);
        label.append(input, boxEl, name, amt);
        input.addEventListener('change', () => toggleCheck(g, c.id));
        box.appendChild(label);
      }
      wrap.appendChild(box);
    }

    groupsEl.appendChild(wrap);
  }
  refreshGroupLabels();
}

function refreshGroupLabels() {
  for (const g of CONFIG.options) {
    const wrap = groupsEl.querySelector(`[data-group="${g.id}"]`);
    const sel = wrap.querySelector('.sel');
    if (g.type === 'check') {
      const names = state[g.id].map((id) => choiceOf(g.id, id).label);
      sel.textContent = names.length ? names.join('、') : '未选';
    } else {
      sel.textContent = choiceOf(g.id, state[g.id]).label;
    }
  }
}

function markActive(g) {
  const wrap = groupsEl.querySelector(`[data-group="${g.id}"]`);
  wrap.querySelectorAll('[data-choice]').forEach((el) => {
    const id = el.dataset.choice;
    const on = g.type === 'check' ? state[g.id].includes(id) : state[g.id] === id;
    el.classList.toggle('active', on);
    if (el.tagName === 'LABEL') el.querySelector('input').checked = on;
  });
}

function selectSingle(g, choiceId) {
  if (state[g.id] === choiceId) return;
  state[g.id] = choiceId;
  markActive(g);
  refreshGroupLabels();
  applyMaterial();
  renderPrice();
}

function toggleCheck(g, choiceId) {
  const arr = state[g.id];
  const i = arr.indexOf(choiceId);
  if (i >= 0) arr.splice(i, 1);
  else arr.push(choiceId);
  markActive(g);
  refreshGroupLabels();
  renderPrice();
}

/* ---------------- Three.js 展台 ---------------- */
const stage = $('#stage');
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(stage.clientWidth, stage.clientHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
stage.prepend(renderer.domElement);

const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

const camera = new THREE.PerspectiveCamera(
  CONFIG.camera.fov, stage.clientWidth / stage.clientHeight, 0.01, 100
);
camera.position.set(1.6, 0.9, 2.2);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.enablePan = false;
controls.autoRotate = !reducedMotion && params.get('spin') !== '0';
controls.autoRotateSpeed = CONFIG.stage.autoRotateSpeed;
controls.minPolarAngle = CONFIG.camera.polarMin;
controls.maxPolarAngle = CONFIG.camera.polarMax;

// 灯光：主光（投影）+ 轮廓光
const key = new THREE.DirectionalLight(CONFIG.stage.keyLightColor, 1.6);
key.position.set(2.5, 4, 2);
key.castShadow = true;
key.shadow.mapSize.set(1024, 1024);
key.shadow.camera.left = key.shadow.camera.bottom = -2;
key.shadow.camera.right = key.shadow.camera.top = 2;
scene.add(key);
const rim = new THREE.DirectionalLight(CONFIG.stage.rimLightColor, 0.9);
rim.position.set(-3, 1.5, -2.5);
scene.add(rim);
scene.add(new THREE.AmbientLight(0xffffff, 0.25));

// 阴影承接盘
const shadowPlane = new THREE.Mesh(
  new THREE.PlaneGeometry(10, 10),
  new THREE.ShadowMaterial({ opacity: 0.32 })
);
shadowPlane.rotation.x = -Math.PI / 2;
shadowPlane.receiveShadow = true;
scene.add(shadowPlane);

// 覆盖材质：所有可配置外观都走这一支，模型文件原样不动
const overrideMat = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  roughness: 0.8,
  metalness: 0.05,
  clearcoat: 0,
  clearcoatRoughness: 0.25,
  envMapIntensity: 0.9,
});

function applyMaterial() {
  const colorChoice = choiceOf('color', state.color);
  const finishChoice = choiceOf('finish', state.finish);
  if (colorChoice) overrideMat.color.set(colorChoice.color);
  if (finishChoice && finishChoice.material) {
    const m = finishChoice.material;
    overrideMat.roughness = m.roughness;
    overrideMat.metalness = m.metalness;
    overrideMat.clearcoat = m.clearcoat ?? 0;
    overrideMat.needsUpdate = false;
  }
}

/* ---------------- 模型加载 ---------------- */
const loaderEl = $('#loader');
const loadBar = $('#loadbar i');
const loadText = $('#loadtext');
const errorBox = $('#errorbox');

const gltfLoader = new GLTFLoader();
gltfLoader.setMeshoptDecoder(MeshoptDecoder); // 模型用了 EXT_meshopt_compression

let modelGroup = null;
let loadFailed = false;

function fitCamera(group) {
  const box = new THREE.Box3().setFromObject(group);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);

  // 模型底部贴住阴影盘
  group.position.y -= box.min.y;
  shadowPlane.position.y = 0.001;

  controls.target.copy(center).setY(center.y - box.min.y);
  const dist = maxDim * CONFIG.camera.distanceFactor;
  const dir = new THREE.Vector3(0.85, 0.42, 1).normalize();
  const endPos = controls.target.clone().addScaledVector(dir, dist);

  controls.minDistance = maxDim * CONFIG.camera.minDistanceFactor;
  controls.maxDistance = maxDim * CONFIG.camera.maxDistanceFactor;
  key.shadow.camera.left = key.shadow.camera.bottom = -maxDim;
  key.shadow.camera.right = key.shadow.camera.top = maxDim;
  key.shadow.camera.updateProjectionMatrix();

  if (reducedMotion) {
    camera.position.copy(endPos);
  } else {
    // 入场：从稍远处推近
    const startPos = controls.target.clone().addScaledVector(dir, dist * 1.6);
    camera.position.copy(startPos);
    const t0 = performance.now();
    const dur = 1100;
    const ease = (t) => 1 - Math.pow(1 - t, 3);
    const tick = (now) => {
      const k = Math.min((now - t0) / dur, 1);
      camera.position.lerpVectors(startPos, endPos, ease(k));
      if (k < 1 && !loadFailed) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  controls.update();
}

function loadModel(url) {
  loadFailed = false;
  errorBox.classList.remove('show');
  loaderEl.classList.remove('done');
  loadBar.style.width = '0%';
  loadText.textContent = '模型加载中…';

  gltfLoader.load(
    url,
    (gltf) => {
      modelGroup = gltf.scene;
      modelGroup.traverse((o) => {
        if (o.isMesh) {
          o.material = overrideMat; // 覆盖材质：换色/换工艺只改这一支
          o.castShadow = true;
        }
      });
      scene.add(modelGroup);
      applyMaterial();
      fitCamera(modelGroup);
      loaderEl.classList.add('done');
      window.__fx.ready = true;
    },
    (xhr) => {
      if (xhr.total > 0) {
        const pct = Math.round((xhr.loaded / xhr.total) * 100);
        loadBar.style.width = pct + '%';
        loadText.textContent = `模型加载中… ${pct}%`;
      } else {
        loadText.textContent = `模型加载中… ${(xhr.loaded / 1048576).toFixed(1)} MB`;
      }
    },
    (err) => {
      console.error('[configurator] 模型加载失败', err);
      loadFailed = true;
      window.__fx.error = String((err && err.message) || err);
      loaderEl.classList.add('done');
      errorBox.classList.add('show');
    }
  );
}

$('#retry').addEventListener('click', () => loadModel(modelUrl));

/* ---------------- 交互细节 ---------------- */
let idleTimer = null;
controls.addEventListener('start', () => {
  controls.autoRotate = false;
  if (idleTimer) clearTimeout(idleTimer);
  $('#hint').style.opacity = '0';
});
controls.addEventListener('end', () => {
  if (reducedMotion || params.get('spin') === '0') return;
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(() => { controls.autoRotate = true; }, CONFIG.stage.idleResumeMs);
});

window.addEventListener('resize', () => {
  const w = stage.clientWidth, h = stage.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
});

// 移动端抽屉收起/展开
$('#drawer-handle').addEventListener('click', () => {
  $('#panel').classList.toggle('collapsed');
});

// CTA
let toastTimer = null;
$('#cta').addEventListener('click', () => {
  const btn = $('#cta');
  btn.classList.add('done');
  btn.textContent = CONFIG.ui.ctaDoneLabel;
  const { total } = calcPrice();
  showToast(`已加入购物车 · ${CONFIG.product.formatPrice(total)}`);
  setTimeout(() => {
    btn.classList.remove('done');
    btn.textContent = CONFIG.ui.ctaLabel;
  }, 1800);
});

function showToast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

/* ---------------- 启动 ---------------- */
function initStaticUI() {
  document.title = `${CONFIG.product.name} · 3D 配置器`;
  $('#wordmark').innerHTML = CONFIG.ui.wordmark + '<span>®</span>';
  $('#pd-name').textContent = CONFIG.product.name;
  $('#pd-tagline').textContent = CONFIG.product.tagline;
  $('#cta').textContent = CONFIG.ui.ctaLabel;
  $('#modelcredit').textContent = CONFIG.model.credit;
  const feats = $('#pd-features');
  for (const f of CONFIG.ui.features) {
    const li = document.createElement('li');
    li.textContent = f;
    feats.appendChild(li);
  }
  stage.style.setProperty('--stage-top', CONFIG.stage.bgTop);
  stage.style.setProperty('--stage-bottom', CONFIG.stage.bgBottom);
}

// 供自动化测试的钩子（生产无影响）
window.__fx = {
  ready: false,
  error: null,
  getState() {
    return {
      price: calcPrice().total,
      priceText: priceEl.textContent,
      selected: JSON.parse(JSON.stringify(state)),
      materialColor: '#' + overrideMat.color.getHexString(),
      roughness: overrideMat.roughness,
      metalness: overrideMat.metalness,
    };
  },
  select(groupId, choiceId) {
    const g = CONFIG.options.find((x) => x.id === groupId);
    if (!g) return false;
    if (g.type === 'check') {
      const wrap = groupsEl.querySelector(`[data-group="${g.id}"] [data-choice="${choiceId}"] input`);
      if (wrap) { wrap.click(); return true; }
      return false;
    }
    const btn = groupsEl.querySelector(`[data-group="${g.id}"] [data-choice="${choiceId}"]`);
    if (btn) { btn.click(); return true; }
    return false;
  },
  debug() {
    const meshes = [];
    scene.traverse((o) => { if (o.isMesh && o !== shadowPlane) meshes.push(o); });
    let box = null;
    if (modelGroup) {
      const b = new THREE.Box3().setFromObject(modelGroup);
      box = { min: b.min.toArray().map((v) => +v.toFixed(3)), max: b.max.toArray().map((v) => +v.toFixed(3)) };
    }
    return {
      meshCount: meshes.length,
      box,
      camPos: camera.position.toArray().map((v) => +v.toFixed(3)),
      target: controls.target.toArray().map((v) => +v.toFixed(3)),
      canvas: [renderer.domElement.width, renderer.domElement.height],
      glOk: !!renderer.getContext(),
    };
  },
};

initStaticUI();
buildOptions();
renderPrice();
applyMaterial();
loadModel(modelUrl);

renderer.setAnimationLoop(() => {
  controls.update();
  renderer.render(scene, camera);
});

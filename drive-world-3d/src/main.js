/* drive-world-3d · src/main.js — 入口：场景 / 相机 / 主循环（原创实现） */
import * as THREE from 'three';
import { buildWorld } from './world.js';
import { createCar } from './car.js';
import { createInput } from './input.js';
import { createEngineSound } from './audio.js';
import { createUI } from './ui.js';

document.documentElement.classList.add('js');
if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
  document.documentElement.classList.add('touch');
}

const SKY_DAY = new THREE.Color(0xBAE6FD);   // 午后
const SKY_DUSK = new THREE.Color(0xF5C98B);   // 黄昏（沙土色系）
const SUN_DAY = new THREE.Color(0xFFF7E0);
const SUN_DUSK = new THREE.Color(0xFFD9A0);

function init() {
  const canvas = document.getElementById('scene');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  const isMobile = document.documentElement.classList.contains('touch');
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.background = SKY_DAY.clone();
  scene.fog = new THREE.Fog(SKY_DAY.clone(), 70, 170);

  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 400);

  // 灯光
  const sun = new THREE.DirectionalLight(SUN_DAY.clone(), 1.6);
  sun.position.set(30, 42, 18);
  sun.castShadow = true;
  sun.shadow.mapSize.set(isMobile ? 1024 : 2048, isMobile ? 1024 : 2048);
  sun.shadow.camera.left = -26; sun.shadow.camera.right = 26;
  sun.shadow.camera.top = 26; sun.shadow.camera.bottom = -26;
  sun.shadow.camera.far = 120; sun.shadow.bias = -0.0004;
  scene.add(sun, sun.target);
  scene.add(new THREE.HemisphereLight(0xBAE6FD, 0x4ADE80, 0.75));

  const world = buildWorld(scene);
  const car = createCar();
  car.place(world.spawn.x, world.spawn.z, world.spawn.heading);
  scene.add(car.group);

  const input = createInput();
  input.bindStick(document.getElementById('stick'), document.getElementById('knob'));
  const engine = createEngineSound();
  const ui = createUI();

  let driving = false, driveTime = 0, firstFrame = true;
  ui.onEnter(() => {
    driving = true;
    engine.unlock(); // 手势解锁音频
  });
  ui.soundBtn.addEventListener('click', () => {
    ui.setSound(engine.toggle());
  });

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  // 第三人称跟随相机（指数阻尼，帧率无关）
  const camPos = new THREE.Vector3();
  const camTarget = new THREE.Vector3();
  const lookAt = new THREE.Vector3();
  let camInit = false;
  function updateCamera(dt, speed) {
    const s = car.state;
    const fx = Math.sin(s.heading), fz = Math.cos(s.heading);
    camTarget.set(s.x - fx * 9.5, 6.2, s.z - fz * 9.5);
    if (!camInit) { camPos.copy(camTarget); camInit = true; }
    const k = 1 - Math.exp(-4.2 * dt);
    camPos.lerp(camTarget, k);
    camera.position.copy(camPos);
    lookAt.set(s.x + fx * 4.5, 1.4, s.z + fz * 4.5);
    camera.lookAt(lookAt);
    // FOV 随速度张开
    const targetFov = 55 + Math.min(Math.abs(speed) / 17, 1) * 12;
    if (Math.abs(camera.fov - targetFov) > 0.05) {
      camera.fov += (targetFov - camera.fov) * Math.min(dt * 3, 1);
      camera.updateProjectionMatrix();
    }
    // 阴影相机跟随小车
    sun.position.set(s.x + 30, 42, s.z + 18);
    sun.target.position.set(s.x, 0, s.z);
  }

  // 昼夜色调：午后 → 黄昏（约 5 分钟走完）
  const skyTmp = new THREE.Color(), sunTmp = new THREE.Color();
  function updateDaylight() {
    const k = Math.min(driveTime / 300, 1);
    // easeInOut 让过渡更自然
    const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    skyTmp.lerpColors(SKY_DAY, SKY_DUSK, e);
    scene.background.copy(skyTmp);
    scene.fog.color.copy(skyTmp);
    sunTmp.lerpColors(SUN_DAY, SUN_DUSK, e);
    sun.color.copy(sunTmp);
    sun.intensity = 1.6 - e * 0.45;
  }

  function checkRings() {
    const s = car.state;
    for (const r of world.rings) {
      if (r.got) continue;
      const d = Math.hypot(s.x - r.x, s.z - r.z);
      if (d < r.r && ui.openCard(r.id, (f) => engine.blip(f))) {
        world.collectRing(r);
      }
    }
  }

  const clock = new THREE.Clock();
  // 调试钩子（验收用）：window.__dw3d = { car, world, ui, input }
  window.__dw3d = { car, world, ui, input, engine };
  function loop() {
    requestAnimationFrame(loop);
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    const speed = driving
      ? car.update(input, dt, world.colliders, world.bounds, world.groundY)
      : 0;
    if (driving && input.driving) driveTime += dt;

    world.update(dt, t);
    updateCamera(dt, speed);
    updateDaylight();
    if (driving) checkRings();
    engine.setSpeed(speed, 17);

    renderer.render(scene, camera);
    if (firstFrame) { firstFrame = false; ui.ready(); }
  }
  loop();
}

init();

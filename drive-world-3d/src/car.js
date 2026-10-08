/* drive-world-3d · src/car.js — 自研街机小车物理（原创实现，无物理引擎） */
import * as THREE from 'three';

const C = { sand: 0xFDE68A, ink: 0x17211b, grass: 0x4ADE80 };

export function createCar() {
  const g = new THREE.Group();

  const bodyMat = new THREE.MeshStandardMaterial({ color: C.sand, roughness: 0.6, flatShading: true });
  const inkMat = new THREE.MeshStandardMaterial({ color: C.ink, roughness: 0.7, flatShading: true });

  const body = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.65, 3.6), bodyMat);
  body.position.y = 0.75; body.castShadow = true; g.add(body);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.6, 1.7), inkMat);
  cabin.position.set(0, 1.32, -0.25); cabin.castShadow = true; g.add(cabin);
  const nose = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.4, 0.5),
    new THREE.MeshStandardMaterial({ color: C.grass, roughness: 0.6, flatShading: true }));
  nose.position.set(0, 0.7, 1.95); g.add(nose);

  const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.34, 10);
  const wheels = [];
  for (const [x, z, front] of [[-1.0, 1.25, 1], [1.0, 1.25, 1], [-1.0, -1.25, 0], [1.0, -1.25, 0]]) {
    const pivot = new THREE.Group();
    const w = new THREE.Mesh(wheelGeo, inkMat);
    w.rotation.z = Math.PI / 2; w.castShadow = true;
    pivot.add(w); pivot.position.set(x, 0.42, z);
    g.add(pivot);
    wheels.push({ pivot, spin: w, front: !!front });
  }

  const state = { x: 0, z: 0, heading: 0, vx: 0, vz: 0, speed: 0, steerVis: 0 };

  const P = {
    accel: 15, brake: 26, maxFwd: 17, maxRev: 7,
    drag: 0.9,           // 无输入阻力
    grip: 7.5,           // 侧向抓地（越小越漂移）
    turnRate: 2.4,       // 满速转向角速度
    radius: 1.15,
  };

  function resolveCollisions(colliders, bounds) {
    const r = P.radius;
    // 圆 vs 圆（树、池塘）
    for (const c of colliders.circles) {
      const dx = state.x - c.x, dz = state.z - c.z;
      const d = Math.hypot(dx, dz), min = c.r + r;
      if (d < min && d > 1e-4) {
        const push = (min - d) / d;
        state.x += dx * push; state.z += dz * push;
        state.vx *= 0.55; state.vz *= 0.55;
      }
    }
    // 圆 vs AABB（房子）
    for (const b of colliders.boxes) {
      const cx = Math.max(b.minX, Math.min(state.x, b.maxX));
      const cz = Math.max(b.minZ, Math.min(state.z, b.maxZ));
      const dx = state.x - cx, dz = state.z - cz;
      const d = Math.hypot(dx, dz);
      if (d < r) {
        if (d > 1e-4) {
          state.x = cx + (dx / d) * r; state.z = cz + (dz / d) * r;
        } else {
          // 圆心卡进盒内：沿最小穿透轴推出
          const pl = state.x - b.minX, pr = b.maxX - state.x;
          const pt = state.z - b.minZ, pb = b.maxZ - state.z;
          const m = Math.min(pl, pr, pt, pb);
          if (m === pl) state.x = b.minX - r;
          else if (m === pr) state.x = b.maxX + r;
          else if (m === pt) state.z = b.minZ - r;
          else state.z = b.maxZ + r;
        }
        state.vx *= 0.45; state.vz *= 0.45;
      }
    }
    // 岛屿边缘隐形围墙
    const d0 = Math.hypot(state.x, state.z);
    if (d0 > bounds) {
      state.x *= bounds / d0; state.z *= bounds / d0;
      state.vx *= 0.6; state.vz *= 0.6;
    }
  }

  return {
    group: g, state,
    place(x, z, heading) {
      state.x = x; state.z = z; state.heading = heading;
      state.vx = state.vz = state.speed = 0;
    },
    update(input, dt, colliders, bounds, groundY) {
      dt = Math.min(dt, 0.05);
      const fx = Math.sin(state.heading), fz = Math.cos(state.heading);

      // 纵向：油门 / 刹车·倒车
      const vFwd = state.vx * fx + state.vz * fz;
      if (input.throttle > 0.05) {
        const a = P.accel * Math.min(input.throttle, 1) * Math.max(0, 1 - vFwd / P.maxFwd);
        state.vx += fx * a * dt; state.vz += fz * a * dt;
      } else if (input.throttle < -0.05) {
        if (vFwd > 1) { // 刹车
          const a = P.brake * Math.min(-input.throttle, 1);
          state.vx -= fx * a * dt; state.vz -= fz * a * dt;
        } else { // 倒车
          const a = P.accel * 0.55 * Math.min(-input.throttle, 1) * Math.max(0, 1 + vFwd / P.maxRev);
          state.vx -= fx * a * dt; state.vz -= fz * a * dt;
        }
      } else {
        const d = Math.exp(-P.drag * dt);
        state.vx *= d; state.vz *= d;
      }

      // 侧向抓地：速度方向向车头方向回正（抓地越小越漂移）
      const f2 = state.vx * fx + state.vz * fz;
      let lx = state.vx - fx * f2, lz = state.vz - fz * f2;
      const latDamp = Math.exp(-P.grip * dt);
      lx *= latDamp; lz *= latDamp;
      state.vx = fx * f2 + lx; state.vz = fz * f2 + lz;

      // 转向：角速度正比于速度（静止打方向不动，倒车自动反打）
      const spd = Math.hypot(state.vx, state.vz);
      const dir = f2 >= 0 ? 1 : -1;
      state.heading += input.steer * P.turnRate * Math.min(spd / 6, 1) * dir * dt;

      resolveCollisions(colliders, bounds);

      state.speed = Math.hypot(state.vx, state.vz);
      g.position.set(state.x, groundY, state.z);
      g.rotation.y = state.heading;

      // 果汁：侧倾 / 俯仰 / 车轮
      const targetRoll = -input.steer * Math.min(spd / P.maxFwd, 1) * 0.09;
      state.steerVis += (input.steer - state.steerVis) * Math.min(dt * 10, 1);
      g.rotation.z += (targetRoll - g.rotation.z) * Math.min(dt * 8, 1);
      const targetPitch = -input.throttle * 0.03;
      g.rotation.x += (targetPitch - g.rotation.x) * Math.min(dt * 6, 1);
      for (const w of wheels) {
        w.spin.rotation.x += (state.speed / 0.42) * dt * dir;
        if (w.front) w.pivot.rotation.y = state.steerVis * 0.45;
      }
      return state.speed;
    },
  };
}

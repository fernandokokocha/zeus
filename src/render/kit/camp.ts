import * as THREE from 'three';
import { COLORS, box, campfire, cylinder, flat, jar, log, scaled, sphere, stone, surface } from './kit';

export function leanToHut(x0: number, z0: number, w: number, d: number, doorX = 0.4, wallHeight = 0.4): THREE.Object3D {
  const group = new THREE.Group();
  const wallTop = 0.09 + wallHeight;
  const front = z0 + d;
  group.add(box(w + 0.04, 0.06, d + 0.04, surface('rubble'), x0 + w / 2, 0.03, z0 + d / 2));
  group.add(box(w, wallHeight, d, surface('mudBrick'), x0 + w / 2, 0.09, z0 + d / 2));
  group.add(scaled(box(w, 0.06, d, surface('mudBrick'), x0 + w / 2, wallTop, z0 + d / 2 - 0.1), 1, 1, 0.7));
  const roof = box(w + 0.16, 0.05, d + 0.22, surface('thatch'), x0 + w / 2, 0, z0 + d / 2);
  roof.rotation.x = 0.28;
  roof.position.y = wallTop + 0.04;
  group.add(roof);
  const poles = Math.max(2, Math.round(w / 0.21));
  for (let i = 0; i < poles; i++) {
    const pole = cylinder(0.01, 0.01, 0.1, flat(COLORS.timber), x0 + 0.1 + (i * (w - 0.2)) / (poles - 1), 0, front + 0.08, 5);
    pole.rotation.x = Math.PI / 2 + 0.28;
    pole.position.y = wallTop - 0.03;
    group.add(pole);
  }
  group.add(box(0.18, 0.28, 0.02, flat(COLORS.dark), x0 + doorX, 0.09, front + 0.005));
  const curtain = box(0.16, 0.26, 0.01, surface('hide'), x0 + doorX - 0.05, 0.1, front + 0.02);
  curtain.rotation.y = 0.3;
  group.add(curtain);
  group.add(box(0.14, 0.035, 0.03, flat(COLORS.aegean), x0 + doorX, 0.38, front + 0.02));
  return group;
}

export function hideTent(tx: number, tz: number, length = 0.62, ridge = 0.5, halfSpan = 0.3): THREE.Object3D {
  const group = new THREE.Group();
  const slope = Math.atan2(ridge, halfSpan);
  const sheet = Math.hypot(ridge, halfSpan);
  for (const side of [-1, 1]) {
    const cloth = box(sheet, 0.015, length, surface('hide'), 0, 0, 0);
    cloth.position.set(tx + (side * halfSpan) / 2, 0.03 + ridge / 2, tz);
    cloth.rotation.z = side * -slope + (side > 0 ? 0 : Math.PI);
    group.add(cloth);
  }
  group.add(log(length + 0.12, 0.012, tx, 0.03 + ridge - 0.01, tz, Math.PI / 2));
  for (const z of [tz - length / 2 - 0.04, tz + length / 2 + 0.04]) group.add(cylinder(0.012, 0.012, ridge, flat(COLORS.timber), tx, 0.03, z, 5));
  const flap = new THREE.Mesh(new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, ridge, 0), new THREE.Vector3(0.22, 0, 0.12), new THREE.Vector3(halfSpan, 0, 0),
  ]), new THREE.MeshLambertMaterial({ color: COLORS.hide, side: THREE.DoubleSide }));
  flap.geometry.computeVertexNormals();
  flap.position.set(tx, 0.03, tz + length / 2);
  group.add(flap);
  const shadowFront = new THREE.Mesh(new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-halfSpan, 0, 0), new THREE.Vector3(0.02, 0, 0), new THREE.Vector3(0, ridge, 0),
  ]), new THREE.MeshBasicMaterial({ color: COLORS.dark, side: THREE.DoubleSide }));
  shadowFront.position.set(tx, 0.031, tz + length / 2 - 0.02);
  group.add(shadowFront);
  for (const [x, z] of [[tx - 0.4, tz - 0.32], [tx + 0.4, tz - 0.32], [tx - 0.4, tz + 0.36], [tx + 0.4, tz + 0.36]]) {
    group.add(cylinder(0.008, 0.012, 0.05, flat(COLORS.timber), x, 0.03, z, 4));
  }
  return group;
}

export function tripodPot(fx: number, fz: number): THREE.Object3D {
  const group = new THREE.Group();
  group.add(campfire(fx, fz, true));
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const leg = cylinder(0.008, 0.008, 0.4, flat(COLORS.timber), 0, 0, 0, 4);
    leg.position.set(fx + Math.cos(a) * 0.1, 0.03 + 0.19, fz + Math.sin(a) * 0.1);
    leg.lookAt(fx, 0.6, fz);
    leg.rotateX(Math.PI / 2);
    group.add(leg);
  }
  group.add(cylinder(0.003, 0.003, 0.12, flat(COLORS.dark), fx, 0.24, fz, 4));
  group.add(new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), flat(0x4a3a30)).translateX(fx).translateY(0.24).translateZ(fz));
  group.add(stone(0.05, fx - 0.22, 0.05, fz + 0.05, 41), stone(0.05, fx + 0.08, 0.05, fz + 0.24, 42));
  return group;
}

export function handcart(x: number, z: number, turn: number, load: THREE.Object3D[]): THREE.Object3D {
  const cart = new THREE.Group();
  cart.add(box(0.42, 0.04, 0.26, flat(0x8a6238), 0, 0.14, 0));
  for (const side of [-1, 1]) {
    cart.add(box(0.42, 0.06, 0.015, flat(0x7a5530), 0, 0.18, side * 0.125));
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.014, 6, 16), flat(COLORS.timber));
    wheel.position.set(0, 0.11, side * 0.15);
    cart.add(wheel);
    cart.add(cylinder(0.012, 0.012, 0.03, flat(COLORS.timber), 0, 0.1, side * 0.15, 6).rotateX(Math.PI / 2));
    cart.add(log(0.36, 0.008, 0.36, 0.035, side * 0.07, 0).rotateZ(0.2));
  }
  cart.add(...load);
  cart.position.set(x, 0.03, z);
  cart.rotation.y = turn;
  return cart;
}

export function journeyLoad(): THREE.Object3D[] {
  return [
    sphere(0.08, surface('hide'), -0.08, 0.24, -0.04),
    sphere(0.07, flat(0x8a6a45), 0.1, 0.23, 0.05),
    box(0.12, 0.08, 0.1, flat(0xb08a4a), 0.05, 0.18, -0.06),
    jar(-0.12, 0.18, 0.07, 0.6),
  ];
}

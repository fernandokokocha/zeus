import * as THREE from 'three';
import { BALCONY_DEPTH, woodenBalcony } from './cottage';
import { COLORS, basket, box, cone, cylinder, flat, log, scaled, sphere } from './kit';

const FLEECE = 0xeee4cb;

function tufts(group: THREE.Group, x: number, y: number, z: number, w: number, d: number, seed: number): void {
  for (let i = 0; i < 6; i++) {
    const tx = x + ((i % 3) - 1) * w * 0.32 + ((seed + i) % 2) * 0.01;
    const tz = z + (Math.floor(i / 3) - 0.5) * d * 0.5;
    group.add(scaled(sphere(0.04, flat(FLEECE), tx, y, tz), 1.2, 0.5, 1));
  }
}

export function fleece(x: number, z: number, turn: number, y = 0.03): THREE.Object3D {
  const group = new THREE.Group();
  tufts(group, 0, 0.01, 0, 0.2, 0.14, 0);
  group.position.set(x, y, z);
  group.rotation.y = turn;
  return group;
}

export function fleeceRack(x0: number, z0: number, x1: number, z1: number, count: number): THREE.Object3D {
  const group = new THREE.Group();
  const height = 0.32;
  for (const [x, z] of [[x0, z0], [x1, z1]]) group.add(cylinder(0.014, 0.016, height, flat(COLORS.timber), x, 0.03, z, 5));
  const length = Math.hypot(x1 - x0, z1 - z0);
  const turn = -Math.atan2(z1 - z0, x1 - x0);
  group.add(log(length + 0.04, 0.014, (x0 + x1) / 2, height + 0.01, (z0 + z1) / 2, turn));
  for (let i = 0; i < count; i++) {
    const t = (i + 0.5) / count;
    const skin = new THREE.Group();
    skin.add(box(length / count - 0.03, 0.2, 0.05, flat(FLEECE), 0, -0.2, 0));
    for (const side of [-1, 1]) for (const h of [-0.15, -0.05]) skin.add(scaled(sphere(0.035, flat(FLEECE), side * 0.04, h, 0.02), 1, 1, 0.6));
    skin.position.set(x0 + (x1 - x0) * t, height + 0.05, z0 + (z1 - z0) * t);
    skin.rotation.y = turn;
    group.add(skin);
  }
  return group;
}

export function woolBasket(x: number, z: number): THREE.Object3D {
  const group = new THREE.Group();
  group.add(basket(x, z, flat(FLEECE)));
  group.add(sphere(0.035, flat(FLEECE), x + 0.04, 0.14, z - 0.02));
  return group;
}

export function loom(x: number, z: number, turn: number): THREE.Object3D {
  const group = new THREE.Group();
  const width = 0.4;
  const height = 0.5;
  for (const side of [-1, 1]) {
    const upright = cylinder(0.014, 0.016, height, flat(COLORS.timber), side * width / 2, 0, 0, 6);
    upright.rotation.x = -0.12;
    group.add(upright);
  }
  group.add(log(width + 0.08, 0.016, 0, height - 0.05, -0.03, 0));
  group.add(box(width - 0.06, 0.12, 0.008, flat(COLORS.aegean), 0, height - 0.17, -0.02));
  group.add(box(width - 0.06, 0.03, 0.008, flat(COLORS.whitewash), 0, height - 0.12, -0.015));
  group.add(box(width - 0.06, 0.22, 0.004, flat(FLEECE), 0, 0.12, 0.0).rotateX(-0.1));
  for (let i = 0; i < 6; i++) group.add(cone(0.02, 0.04, flat(COLORS.clay), -0.15 + i * 0.06, 0.06, 0.03, 6).rotateX(Math.PI));
  group.position.set(x, 0.03, z);
  group.rotation.y = turn;
  return group;
}

export function sheep(x: number, z: number, turn: number): THREE.Object3D {
  const group = new THREE.Group();
  const wool = flat(FLEECE);
  const face = flat(0x3a3028);
  for (const [bx, by] of [[-0.05, 0.17], [0.03, 0.18], [0.0, 0.21], [-0.03, 0.2]]) group.add(scaled(sphere(0.065, wool, bx, by, 0), 1.2, 0.9, 1));
  for (const [lx, lz] of [[-0.06, -0.03], [0.05, -0.03], [-0.06, 0.03], [0.05, 0.03]]) group.add(cylinder(0.009, 0.009, 0.11, face, lx, 0, lz, 4));
  group.add(scaled(sphere(0.035, face, 0.12, 0.2, 0), 1.3, 1, 0.85));
  group.position.set(x, 0.03, z);
  group.rotation.y = turn;
  return group;
}

export function fleeceBalcony(x0: number, x1: number, front: number, floor: number): THREE.Object3D {
  const group = new THREE.Group();
  group.add(woodenBalcony(x0, x1, front, floor));
  for (const x of [x0 + 0.2, x0 + 0.42, x0 + 0.72]) group.add(box(0.16, 0.18, 0.03, flat(FLEECE), x, floor + 0.02, front + BALCONY_DEPTH + 0.01));
  return group;
}

import * as THREE from 'three';
import { COLORS, box, cylinder, flat, log, surface } from './kit';

export const WATER = 0x4f93cf;
const STAVE = 0x8a6238;
const HOOP = 0x4a4038;

export const water = new THREE.MeshLambertMaterial({ color: WATER, emissive: 0x0a2440 });

export function bucket(x: number, y: number, z: number, full: boolean): THREE.Object3D {
  const group = new THREE.Group();
  group.add(cylinder(0.04, 0.034, 0.07, flat(STAVE), x, y, z, 10));
  for (const h of [0.012, 0.055]) group.add(cylinder(0.042, 0.042, 0.008, flat(HOOP), x, y + h, z, 10));
  if (full) group.add(cylinder(0.035, 0.035, 0.004, water, x, y + 0.064, z, 10));
  return group;
}

export function wellHead(x: number, z: number): THREE.Object3D {
  const group = new THREE.Group();
  group.add(cylinder(0.2, 0.22, 0.2, surface('rubble'), x, 0.03, z, 18));
  group.add(cylinder(0.215, 0.215, 0.035, surface('whitewash'), x, 0.23, z, 18));
  group.add(cylinder(0.15, 0.15, 0.01, flat(0x1c3a58), x, 0.225, z, 16));
  group.add(cylinder(0.13, 0.13, 0.004, water, x, 0.2, z, 16));
  for (const side of [-1, 1]) group.add(cylinder(0.016, 0.02, 0.38, flat(COLORS.timber), x + side * 0.19, 0.2, z, 6));
  group.add(log(0.46, 0.018, x, 0.56, z, 0));
  group.add(box(0.04, 0.04, 0.03, flat(COLORS.timber), x + 0.25, 0.56, z));
  group.add(cylinder(0.003, 0.003, 0.18, flat(0x9c7a48), x, 0.38, z, 4));
  group.add(bucket(x, 0.31, z, true));
  return group;
}

export function trough(x: number, z: number, length: number, turn: number): THREE.Object3D {
  const group = new THREE.Group();
  group.add(box(length, 0.1, 0.16, surface('rubble'), 0, 0.03, 0));
  group.add(box(length - 0.04, 0.005, 0.12, water, 0, 0.125, 0));
  group.position.set(x, 0, z);
  group.rotation.y = turn;
  return group;
}

export function cistern(x: number, z: number, w: number, d: number): THREE.Object3D {
  const group = new THREE.Group();
  group.add(box(w, 0.12, d, surface('whitewash'), x, 0.03, z));
  group.add(box(w - 0.06, 0.006, d - 0.06, water, x, 0.145, z));
  group.add(box(0.05, 0.03, 0.08, surface('whitewash'), x - w / 2 + 0.02, 0.15, z - d / 2 + 0.08));
  return group;
}

export function yoke(x: number, z: number, turn: number): THREE.Object3D {
  const group = new THREE.Group();
  group.add(log(0.4, 0.01, 0, 0.11, 0, 0));
  for (const side of [-1, 1]) {
    group.add(bucket(side * 0.16, 0.03, 0, true));
    group.add(cylinder(0.002, 0.002, 0.05, flat(0x9c7a48), side * 0.16, 0.08, 0, 3));
  }
  group.position.set(x, 0, z);
  group.rotation.y = turn;
  return group;
}

export function laundryLine(x0: number, z0: number, x1: number, z1: number, colors: number[]): THREE.Object3D {
  const group = new THREE.Group();
  const height = 0.36;
  for (const [x, z] of [[x0, z0], [x1, z1]]) group.add(cylinder(0.01, 0.012, height, flat(COLORS.timber), x, 0.03, z, 5));
  const length = Math.hypot(x1 - x0, z1 - z0);
  const turn = -Math.atan2(z1 - z0, x1 - x0);
  group.add(box(length, 0.004, 0.004, flat(0x9c7a48), (x0 + x1) / 2, height + 0.02, (z0 + z1) / 2).rotateY(turn));
  colors.forEach((color, i) => {
    const t = (i + 0.7) / (colors.length + 0.4);
    const cloth = box(0.1, 0.13, 0.006, flat(color), x0 + (x1 - x0) * t, height - 0.11, z0 + (z1 - z0) * t);
    cloth.rotation.y = turn;
    group.add(cloth);
  });
  return group;
}

export function wateredBeds(x0: number, z0: number, w: number, rows: number): THREE.Object3D {
  const group = new THREE.Group();
  group.add(box(w, 0.012, rows * 0.14, flat(0x6a5236), x0 + w / 2, 0.03, z0 + (rows * 0.14) / 2));
  for (let r = 0; r < rows; r++) {
    const z = z0 + 0.07 + r * 0.14;
    group.add(box(w - 0.04, 0.004, 0.025, water, x0 + w / 2, 0.042, z + 0.05));
    for (let p = 0; p < Math.floor(w / 0.08); p++) {
      group.add(cylinder(0.022, 0.012, 0.04, flat(p % 2 ? 0x6f9a3a : 0x8fb04a), x0 + 0.05 + p * 0.08, 0.042, z, 6));
    }
  }
  return group;
}

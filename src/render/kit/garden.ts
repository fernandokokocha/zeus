import * as THREE from 'three';
import { COLORS, box, cylinder, flat, sphere, surface } from './kit';

export const BLOOM = { red: 0xd8423a, pink: 0xe58fb0, yellow: 0xf2c84a };
const PAVING = 0xd9d2c3;
const JOINT = 0xb8ae9c;

export function flowerPot(x: number, y: number, z: number, bloom: number): THREE.Object3D {
  const group = new THREE.Group();
  group.add(cylinder(0.05, 0.035, 0.07, flat(COLORS.clay), x, y, z, 10));
  group.add(sphere(0.055, flat(COLORS.foliage), x, y + 0.1, z));
  for (const [dx, dz] of [[0.03, 0.02], [-0.02, 0.03], [0.0, -0.03]]) group.add(sphere(0.02, flat(bloom), x + dx, y + 0.13, z + dz));
  return group;
}

export function herm(x: number, z: number): THREE.Object3D {
  const group = new THREE.Group();
  group.add(box(0.1, 0.04, 0.1, surface('rubble'), x, 0.03, z));
  group.add(box(0.06, 0.26, 0.06, surface('whitewash'), x, 0.07, z));
  group.add(sphere(0.045, surface('whitewash'), x, 0.37, z));
  group.add(box(0.03, 0.03, 0.02, flat(COLORS.deepAegean), x, 0.33, z + 0.03));
  return group;
}

export function paving(x0: number, z0: number, w: number, d: number): THREE.Object3D {
  const group = new THREE.Group();
  group.add(box(w, 0.01, d, flat(PAVING), x0 + w / 2, 0.03, z0 + d / 2));
  for (let x = x0 + 0.2; x < x0 + w - 0.05; x += 0.2) group.add(box(0.008, 0.012, d, flat(JOINT), x, 0.03, z0 + d / 2));
  for (let z = z0 + 0.2; z < z0 + d - 0.05; z += 0.2) group.add(box(w, 0.012, 0.008, flat(JOINT), x0 + w / 2, 0.03, z));
  return group;
}

export function blueColumns(posts: [number, number][], height: number): THREE.Object3D {
  const group = new THREE.Group();
  for (const [x, z] of posts) {
    group.add(cylinder(0.022, 0.026, height, flat(COLORS.aegean), x, 0.03, z, 8));
    group.add(box(0.06, 0.02, 0.06, surface('whitewash'), x, 0.03 + height - 0.02, z));
  }
  return group;
}

export function portico(x0: number, z0: number, x1: number, z1: number, height: number, posts: [number, number][]): THREE.Object3D {
  const group = new THREE.Group();
  group.add(blueColumns(posts, height));
  group.add(box(x1 - x0, 0.05, z1 - z0, surface('whitewash'), (x0 + x1) / 2, 0.03 + height, (z0 + z1) / 2));
  return group;
}

export function figTree(x: number, z: number, scale: number): THREE.Object3D {
  const group = new THREE.Group();
  group.add(cylinder(0.025 * scale, 0.035 * scale, 0.3 * scale, flat(0x7a6a58), x, 0.03, z, 6));
  for (const [dx, dy, dz, r] of [[0, 0.42, 0, 0.16], [0.1, 0.36, 0.06, 0.12], [-0.09, 0.38, -0.05, 0.12], [0.02, 0.5, -0.08, 0.1]]) {
    group.add(sphere(r * scale, flat(dx > 0 ? 0x4f7a2e : COLORS.foliage), x + dx * scale, dy * scale, z + dz * scale));
  }
  return group;
}

import * as THREE from 'three';
import { box, cone, cylinder, flat, sphere } from './kit';
import { water } from './water';

const MARBLE = 0xf4f1ea;
const CYPRESS = 0x2f5a2a;
const LAWN = 0x6f9a3e;

export function fountain(x: number, z: number, radius: number): THREE.Object3D {
  const group = new THREE.Group();
  group.add(cylinder(radius, radius + 0.01, 0.08, flat(MARBLE), x, 0.03, z, 20));
  group.add(cylinder(radius - 0.025, radius - 0.025, 0.004, water, x, 0.105, z, 20));
  group.add(cylinder(0.02, 0.03, 0.16, flat(MARBLE), x, 0.1, z, 8));
  group.add(cylinder(0.06, 0.03, 0.03, flat(MARBLE), x, 0.25, z, 12));
  group.add(cylinder(0.05, 0.05, 0.004, water, x, 0.278, z, 12));
  return group;
}

export function statue(x: number, z: number, turn = 0): THREE.Object3D {
  const group = new THREE.Group();
  group.add(box(0.1, 0.08, 0.1, flat(MARBLE), 0, 0, 0));
  group.add(cylinder(0.025, 0.035, 0.16, flat(MARBLE), 0, 0.08, 0, 8));
  group.add(sphere(0.022, flat(MARBLE), 0, 0.265, 0));
  group.add(box(0.012, 0.09, 0.012, flat(MARBLE), 0.035, 0.17, 0).rotateZ(-0.6));
  group.position.set(x, 0.03, z);
  group.rotation.y = turn;
  return group;
}

export function cypress(x: number, z: number, height: number): THREE.Object3D {
  const group = new THREE.Group();
  group.add(cylinder(0.015, 0.02, 0.06, flat(0x5a4a3a), x, 0.03, z, 5));
  group.add(cone(0.07, height, flat(CYPRESS), x, 0.07, z, 8));
  group.add(sphere(0.065, flat(CYPRESS), x, 0.16, z));
  return group;
}

export function lawn(x0: number, z0: number, w: number, d: number): THREE.Mesh {
  return box(w, 0.015, d, flat(LAWN), x0 + w / 2, 0.03, z0 + d / 2);
}

import * as THREE from 'three';
import { COLORS, cylinder, flat, sphere } from './kit';

const AMPHORA_PROFILE = [[0, 0], [0.02, 0.01], [0.05, 0.08], [0.065, 0.16], [0.06, 0.22], [0.03, 0.27], [0.022, 0.31], [0.032, 0.33]];
const amphoraGeometry = new THREE.LatheGeometry(AMPHORA_PROFILE.map(([r, h]) => new THREE.Vector2(r, h)), 12);
const amphoraClay = new THREE.MeshLambertMaterial({ color: 0xb8643a, side: THREE.DoubleSide });
const OLIVE_LEAF = 0x8c9a62;

export function amphora(x: number, z: number, y = 0.03): THREE.Object3D {
  const group = new THREE.Group();
  group.add(new THREE.Mesh(amphoraGeometry, amphoraClay).translateX(x).translateY(y).translateZ(z));
  for (const side of [-1, 1]) group.add(cylinder(0.006, 0.006, 0.08, amphoraClay, x + side * 0.04, y + 0.22, z, 4).rotateZ(side * 0.5));
  group.add(cylinder(0.034, 0.034, 0.012, flat(COLORS.timber), x, y + 0.32, z, 8));
  return group;
}

export function amphoraRow(x0: number, z0: number, x1: number, z1: number, count: number): THREE.Object3D {
  const group = new THREE.Group();
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : i / (count - 1);
    group.add(amphora(x0 + (x1 - x0) * t, z0 + (z1 - z0) * t));
  }
  return group;
}

export function oliveTree(x: number, z: number, scale: number): THREE.Object3D {
  const group = new THREE.Group();
  const bark = flat(0x6e6455);
  group.add(cylinder(0.03 * scale, 0.05 * scale, 0.22 * scale, bark, x, 0.03, z, 6).rotateZ(0.15));
  group.add(cylinder(0.02 * scale, 0.03 * scale, 0.16 * scale, bark, x + 0.04 * scale, 0.2 * scale, z, 5).rotateZ(-0.4));
  for (const [dx, dy, dz, r] of [[0, 0.36, 0, 0.13], [0.1, 0.32, 0.05, 0.1], [-0.09, 0.33, -0.04, 0.11], [0.03, 0.42, -0.07, 0.09], [-0.04, 0.3, 0.08, 0.09]]) {
    group.add(sphere(r * scale, flat(OLIVE_LEAF), x + dx * scale, dy * scale, z + dz * scale));
  }
  return group;
}

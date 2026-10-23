import * as THREE from 'three';
import { type FigureParts, at, hammerArm, head, legs, rod, torso } from './figure';
import { tileHash } from '../palette';
import { COLORS, box, cylinder, flat, stone, surface } from './kit';

export const MASONRY = {
  tunic: 0x2f6fb3,
  marble: 0xeeeae2,
  plank: 0xa07a4a,
  rope: 0xc8b48a,
  iron: 0x6a6e72,
};

const BASE = 0.03;

export function marbleBlock(x: number, y: number, z: number, w: number, h: number, d: number, turn = 0): THREE.Mesh {
  const block = box(w, h, d, flat(MASONRY.marble), x, y, z);
  block.rotation.y = turn;
  return block;
}

export function stockBlock(x: number, z: number, turn: number): THREE.Mesh {
  return marbleBlock(x, BASE, z, 0.22, 0.16, 0.18, turn);
}

export function columnDrum(x: number, y: number, z: number, lying = false): THREE.Mesh {
  const drum = cylinder(0.075, 0.08, 0.14, flat(MASONRY.marble), x, y, z, 14);
  if (lying) {
    drum.rotation.z = Math.PI / 2;
    drum.position.y = y + 0.08;
  }
  return drum;
}

export function trestle(x: number, z: number, height: number): THREE.Object3D {
  const group = new THREE.Group();
  for (const dx of [-0.13, 0.13]) {
    for (const dz of [-0.08, 0.08]) group.add(rod(at(x + dx, BASE, z + dz), at(x + dx * 0.7, height, z), 0.014, COLORS.timber));
  }
  group.add(box(0.36, 0.035, 0.12, flat(MASONRY.plank), x, height, z));
  return group;
}

export function lyingHammer(x: number, y: number, z: number): THREE.Object3D {
  const group = new THREE.Group();
  group.add(rod(at(x - 0.07, y + 0.015, z), at(x + 0.05, y + 0.015, z), 0.009, COLORS.timber));
  group.add(box(0.03, 0.03, 0.06, flat(MASONRY.iron), x + 0.06, y, z));
  return group;
}

export function hoist(x: number, z: number, height: number, hangAt: number): THREE.Object3D {
  const group = new THREE.Group();
  const apex = at(x, height, z);
  for (const [dx, dz] of [[-0.32, -0.2], [0.32, -0.2], [0, 0.34]]) group.add(rod(at(x + dx, BASE, z + dz), apex, 0.022, COLORS.timber));
  const drum = cylinder(0.035, 0.035, 0.44, flat(COLORS.timber), x, 0.3, z - 0.15, 8);
  drum.rotation.z = Math.PI / 2;
  drum.position.y = 0.3;
  group.add(drum);
  group.add(rod(apex, at(x, hangAt + 0.16, z), 0.007, MASONRY.rope));
  group.add(rod(apex, at(x, 0.3, z - 0.15), 0.007, MASONRY.rope));
  group.add(marbleBlock(x, hangAt, z, 0.22, 0.16, 0.18, 0.4));
  return group;
}

export function mason(): FigureParts {
  const upper = torso(MASONRY.tunic, [at(0.15, 0.06, -0.04)]);
  upper.add(rod(at(0.15, 0.06, -0.04), at(0.2, 0.0, -0.02), 0.008, MASONRY.iron));
  return { legs: legs(), torso: upper, head: head('pilos'), arm: hammerArm() };
}

export function stoneHut(x0: number, z0: number, w: number, d: number, wallTop: number): THREE.Object3D {
  const group = new THREE.Group();
  group.add(box(w, wallTop - BASE, d, surface('rubble'), x0 + w / 2, BASE, z0 + d / 2));
  group.add(box(w + 0.04, 0.05, d + 0.04, surface('whitewash'), x0 + w / 2, wallTop - 0.05, z0 + d / 2));
  return group;
}

export function chips(x: number, z: number, count: number, seed: number): THREE.Object3D {
  const group = new THREE.Group();
  for (let i = 0; i < count; i++) {
    const a = tileHash(seed, i) * Math.PI * 2;
    const r = 0.06 + tileHash(i, seed) * 0.16;
    group.add(stone(0.018, x + Math.cos(a) * r, BASE + 0.005, z + Math.sin(a) * r, seed + i, MASONRY.marble));
  }
  return group;
}

import * as THREE from 'three';
import { type FigureParts, at, head, legs, torso } from './figure';
import { COLORS, box, cylinder, flat } from './kit';
import { bucket } from './water';

export const MAINTENANCE = {
  tunic: 0x1d4e8c,
  bronze: 0xb08040,
  plank: 0xa07a4a,
};

export function ladder(x: number, z: number, height: number, lean: number, turn: number): THREE.Object3D {
  const pivot = new THREE.Group();
  for (const side of [-0.07, 0.07]) pivot.add(box(0.025, height, 0.025, flat(COLORS.timber), side, 0, 0));
  for (let y = 0.1; y < height; y += 0.12) pivot.add(box(0.14, 0.02, 0.02, flat(COLORS.timber), 0, y, 0));
  pivot.rotation.x = -lean;
  const group = new THREE.Group();
  group.add(pivot);
  group.position.set(x, 0.03, z);
  group.rotation.y = turn;
  return group;
}

export function bucketRack(x: number, z: number, buckets: number): THREE.Object3D {
  const group = new THREE.Group();
  for (const dx of [-0.17, 0.17]) group.add(box(0.03, 0.42, 0.03, flat(COLORS.timber), x + dx, 0.03, z));
  const shelves = [0.06, 0.26];
  for (const y of shelves) group.add(box(0.4, 0.025, 0.14, flat(MAINTENANCE.plank), x, y, z));
  for (let i = 0; i < buckets; i++) group.add(bucket(x - 0.11 + (i % 3) * 0.11, shelves[Math.floor(i / 3)] + 0.025, z, true));
  return group;
}

export function gong(x: number, y: number, z: number): THREE.Object3D {
  const group = new THREE.Group();
  for (const dx of [-0.1, 0.1]) group.add(box(0.025, 0.28, 0.025, flat(COLORS.timber), x + dx, y, z));
  group.add(box(0.24, 0.025, 0.025, flat(COLORS.timber), x, y + 0.28, z));
  const disc = cylinder(0.075, 0.075, 0.015, flat(MAINTENANCE.bronze), x, y + 0.08, z, 16);
  disc.rotation.x = Math.PI / 2;
  disc.position.y = y + 0.17;
  group.add(disc);
  return group;
}

export function bucketCarrier(): FigureParts {
  const body = legs();
  const hands = [at(0.01, 0.0, 0.095), at(-0.02, 0.02, -0.09)];
  const upper = torso(MAINTENANCE.tunic, hands);
  upper.add(bucket(0.01, -0.09, 0.1, true));
  return { legs: body, torso: upper, head: head('pilos') };
}

export function lookout(): FigureParts {
  return { legs: legs(), torso: torso(MAINTENANCE.tunic, [at(0.07, 0.28, 0.03), at(0.03, 0.04, -0.095)]), head: head('pilos') };
}

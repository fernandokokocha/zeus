import * as THREE from 'three';
import { PALETTE, tileHash } from '../palette';
import { type FigureParts, at, hammerArm, head, legs, rod, torso } from './figure';
import { COLORS, box, cylinder, flat, glowing, smoke, sphere, stone } from './kit';

export const FOUNDRY = {
  clay: 0xb5673d,
  soot: 0x2e2824,
  iron: 0x5e6266,
  leather: 0x7a5232,
  tunic: COLORS.deepAegean,
  apron: 0x6b4a32,
  oreRock: PALETTE.oreRock,
  copper: PALETTE.copperGlint,
  malachite: PALETTE.malachite,
};

const BASE = 0.03;
const PUFFS = [
  { rise: 0, drift: 0, size: 0.06 },
  { rise: 0.14, drift: 0.04, size: 0.08 },
  { rise: 0.3, drift: 0.1, size: 0.1 },
  { rise: 0.48, drift: 0.18, size: 0.12 },
];

export function smokePlume(x: number, y: number, z: number): THREE.Object3D {
  const group = new THREE.Group();
  for (const { rise, drift, size } of PUFFS) group.add(sphere(size, smoke, x + drift, y + rise, z - drift * 0.5));
  return group;
}

function mouth(w: number, h: number, lit: boolean, x: number, y: number, z: number): THREE.Mesh {
  return box(w, h, 0.03, lit ? glowing : flat(FOUNDRY.soot), x, y, z);
}

export function shaftFurnace(x: number, z: number, height: number, lit: boolean): THREE.Object3D {
  const group = new THREE.Group();
  group.add(cylinder(0.1, 0.16, height, flat(FOUNDRY.clay), x, BASE, z, 12));
  group.add(cylinder(0.11, 0.11, 0.035, flat(FOUNDRY.soot), x, BASE + height - 0.02, z, 12));
  group.add(mouth(0.09, 0.09, lit, x, BASE + 0.02, z + 0.15));
  if (lit) {
    group.add(cylinder(0.08, 0.08, 0.01, glowing, x, BASE + height + 0.012, z, 12));
    group.add(smokePlume(x, BASE + height + 0.1, z));
  }
  return group;
}

export function anvil(x: number, z: number): THREE.Object3D {
  const group = new THREE.Group();
  group.add(cylinder(0.06, 0.07, 0.14, flat(COLORS.timber), x, BASE, z, 10));
  group.add(box(0.07, 0.05, 0.05, flat(FOUNDRY.iron), x, BASE + 0.14, z));
  group.add(box(0.13, 0.03, 0.06, flat(FOUNDRY.iron), x, BASE + 0.19, z));
  return group;
}

export function bellows(x: number, z: number, turn: number): THREE.Object3D {
  const group = new THREE.Group();
  const bag = box(0.18, 0.06, 0.12, flat(FOUNDRY.leather), 0, BASE, 0);
  bag.rotation.z = 0.12;
  group.add(bag);
  group.add(rod(at(0.09, BASE + 0.03, 0), at(0.2, BASE + 0.02, 0), 0.012, FOUNDRY.iron));
  group.add(rod(at(-0.09, BASE + 0.07, 0), at(-0.17, BASE + 0.1, 0), 0.01, COLORS.timber));
  group.position.set(x, 0, z);
  group.rotation.y = turn;
  return group;
}

export function castingMould(x: number, z: number, lit: boolean): THREE.Object3D {
  const group = new THREE.Group();
  group.add(box(0.3, 0.05, 0.16, flat(FOUNDRY.clay), x, BASE, z));
  for (const dz of [-0.035, 0.035]) group.add(box(0.22, 0.012, 0.045, lit ? glowing : flat(FOUNDRY.soot), x, BASE + 0.045, z + dz));
  return group;
}

export function hungTongs(x: number, y: number, z: number): THREE.Object3D {
  const group = new THREE.Group();
  for (const dx of [-0.012, 0.012]) group.add(rod(at(x, y, z), at(x + dx * 3, y - 0.2, z), 0.006, FOUNDRY.iron));
  group.add(rod(at(x + 0.07, y, z), at(x + 0.07, y - 0.12, z), 0.008, COLORS.timber));
  group.add(box(0.03, 0.04, 0.012, flat(FOUNDRY.iron), x + 0.07, y - 0.15, z));
  return group;
}

export function oreHeap(x: number, z: number, radius: number, count: number, seed: number): THREE.Object3D {
  const group = new THREE.Group();
  for (let i = 0; i < count; i++) {
    const a = tileHash(seed, i) * Math.PI * 2;
    const r = Math.sqrt(tileHash(i, seed)) * radius;
    const height = (1 - r / radius) * radius * 0.6;
    const roll = tileHash(seed + i, 7);
    const color = roll < 0.22 ? FOUNDRY.copper : roll < 0.36 ? FOUNDRY.malachite : FOUNDRY.oreRock;
    group.add(stone(0.045, x + Math.cos(a) * r, BASE + 0.02 + height, z + Math.sin(a) * r, seed + i, color));
  }
  return group;
}

export function smith(): FigureParts {
  const upper = torso(FOUNDRY.tunic, [at(0.14, 0.04, -0.05)]);
  upper.add(box(0.015, 0.2, 0.1, flat(FOUNDRY.apron), 0.075, -0.17, 0));
  upper.add(rod(at(0.14, 0.04, -0.05), at(0.24, -0.02, -0.04), 0.006, FOUNDRY.iron));
  return { legs: legs(), torso: upper, head: head('pilos'), arm: hammerArm() };
}

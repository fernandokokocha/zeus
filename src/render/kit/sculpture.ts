import * as THREE from 'three';
import { PALETTE } from '../palette';
import { type FigureParts, at, hammerArm, head, legs, rod, torso } from './figure';
import { COLORS, box, cylinder, flat, sphere } from './kit';

export const SCULPTURE = {
  bronze: 0xc98f3c,
  marble: PALETTE.marble,
  mould: COLORS.clay,
  tunic: COLORS.aegean,
  iron: 0x6a6e72,
};

const BASE = 0.03;
const PLINTH = { side: 0.18, height: 0.12, band: 0.025 };
const FOOT = BASE + PLINTH.height + PLINTH.band;
const HIP = FOOT + 0.2;
const CHEST = HIP + 0.2;
const HEAD = CHEST + 0.07;
const INGOT = { top: 0.075, bottom: 0.1, h: 0.04, narrow: 0.45 };

export function plinth(x: number, z: number): THREE.Object3D {
  const group = new THREE.Group();
  group.add(box(PLINTH.side, PLINTH.height, PLINTH.side, flat(SCULPTURE.marble), x, BASE, z));
  group.add(box(PLINTH.side + 0.02, PLINTH.band, PLINTH.side + 0.02, flat(COLORS.aegean), x, BASE + PLINTH.height, z));
  return group;
}

function lowerBody(group: THREE.Group, material: number): void {
  group.add(rod(at(0.02, FOOT, 0.04), at(0, HIP, 0.02), 0.03, material));
  group.add(rod(at(-0.03, FOOT, -0.04), at(0, HIP, -0.02), 0.03, material));
  group.add(cylinder(0.05, 0.045, 0.06, flat(material), 0, HIP - 0.03, 0, 10));
}

function upperBody(group: THREE.Group, material: number): void {
  group.add(rod(at(0, HIP, 0), at(0.01, CHEST, 0), 0.06, material));
  group.add(sphere(0.05, flat(material), 0.01, HEAD, 0));
  const spearHand = at(0.02, CHEST + 0.12, 0.09);
  group.add(rod(at(0, CHEST - 0.02, 0.06), spearHand, 0.022, material));
  group.add(rod(at(0, CHEST - 0.02, -0.06), at(0.03, HIP, -0.08), 0.022, material));
  group.add(rod(at(spearHand.x, FOOT, spearHand.z), at(spearHand.x, CHEST + 0.26, spearHand.z), 0.008, material));
}

function placed(group: THREE.Group, x: number, z: number, turn: number, size: number): THREE.Group {
  group.position.set(x, 0, z);
  group.rotation.y = turn;
  group.scale.setScalar(size);
  return group;
}

export function statue(x: number, z: number, turn: number, size = 1): THREE.Object3D {
  const group = new THREE.Group();
  group.add(plinth(0, 0));
  lowerBody(group, SCULPTURE.bronze);
  upperBody(group, SCULPTURE.bronze);
  return placed(group, x, z, turn, size);
}

export function statueInMould(x: number, z: number, turn: number, size = 1): THREE.Object3D {
  const group = new THREE.Group();
  group.add(plinth(0, 0));
  lowerBody(group, SCULPTURE.bronze);
  group.add(cylinder(0.05, 0.085, CHEST - HIP + 0.14, flat(SCULPTURE.mould), 0, HIP - 0.02, 0, 10));
  group.add(sphere(0.06, flat(SCULPTURE.mould), 0, CHEST + 0.12, 0));
  return placed(group, x, z, turn, size);
}

export function scaffold(x: number, z: number, height: number, half = 0.16): THREE.Object3D {
  const group = new THREE.Group();
  for (const dx of [-half, half]) for (const dz of [-half, half]) group.add(rod(at(x + dx, BASE, z + dz), at(x + dx, height, z + dz), 0.012, COLORS.timber));
  for (const y of [height * 0.5, height]) {
    group.add(box(half * 2 + 0.04, 0.02, 0.05, flat(COLORS.timber), x, y, z + half));
    group.add(box(0.05, 0.02, half * 2 + 0.04, flat(COLORS.timber), x - half, y, z));
  }
  return group;
}

export function bronzeIngot(x: number, y: number, z: number, turn: number): THREE.Mesh {
  const ingot = cylinder(INGOT.top, INGOT.bottom, INGOT.h, flat(SCULPTURE.bronze), x, y, z, 4);
  ingot.geometry.rotateY(Math.PI / 4);
  ingot.scale.set(1, 1, INGOT.narrow);
  ingot.rotation.y = turn;
  return ingot;
}

export function ingotPile(x: number, z: number, count: number): THREE.Object3D {
  const group = new THREE.Group();
  for (let i = 0; i < count; i++) {
    const layer = Math.floor(i / 2);
    const side = i % 2 ? 1 : -1;
    const across = layer % 2 === 1;
    const [dx, dz] = across ? [0, side * 0.035] : [side * 0.035, 0];
    group.add(bronzeIngot(x + dx, BASE + layer * INGOT.h, z + dz, across ? 0 : Math.PI / 2));
  }
  return group;
}

export function hungChisels(x: number, y: number, z: number): THREE.Object3D {
  const group = new THREE.Group();
  group.add(box(0.2, 0.025, 0.02, flat(COLORS.timber), x, y, z));
  for (const dx of [-0.06, 0, 0.06]) group.add(rod(at(x + dx, y - 0.01, z + 0.015), at(x + dx, y - 0.09, z + 0.015), 0.007, SCULPTURE.iron));
  return group;
}

export function sculptor(): FigureParts {
  const upper = torso(SCULPTURE.tunic, [at(0.14, 0.08, -0.05)]);
  upper.add(rod(at(0.14, 0.08, -0.05), at(0.2, 0.06, -0.03), 0.008, SCULPTURE.iron));
  return { legs: legs(), torso: upper, head: head('bare'), arm: hammerArm() };
}

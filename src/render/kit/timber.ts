import * as THREE from 'three';
import { FIGURE, type FigureParts, at, head, legs, rod, torso } from './figure';
import { tileHash } from '../palette';
import { COLORS, box, cylinder, flat, surface } from './kit';

export const TIMBER = {
  tunic: 0x5a6b2e,
  bark: 0x8a5f36,
  heartwood: 0xe0b77c,
  plank: 0xc4945a,
  sawdust: 0xe8cf98,
  iron: 0x55595e,
  pit: 0x2a1d12,
  rope: 0xc8b48a,
};

const BASE = 0.03;
const STACK_LOG = { length: 0.42, radius: 0.045 };
const HAND = at(0.12, -0.08, 0.02);
const SAW_BLADE = 0.3;
const AXE_HANDLE = 0.14;

export function timberLog(length: number, radius: number, x: number, y: number, z: number, turn: number): THREE.Object3D {
  const group = new THREE.Group();
  const bark = cylinder(radius, radius, length, flat(TIMBER.bark), 0, -length / 2, 0, 8);
  group.add(bark);
  for (const side of [-1, 1]) group.add(cylinder(radius * 0.85, radius * 0.85, 0.006, flat(TIMBER.heartwood), 0, side * (length / 2) - 0.003, 0, 8));
  group.rotation.z = Math.PI / 2;
  const pivot = new THREE.Group();
  pivot.add(group);
  pivot.position.set(x, y + radius, z);
  pivot.rotation.y = turn;
  return pivot;
}

export function logStack(x: number, z: number, turn: number): THREE.Object3D {
  const group = new THREE.Group();
  const { length, radius } = STACK_LOG;
  const step = radius * 2;
  for (let row = 0; row < 3; row++) {
    for (let i = 0; i < 3 - row; i++) group.add(timberLog(length, radius, 0, row * step * 0.87, (i - (2 - row) / 2) * step, 0));
  }
  group.add(box(0.04, 0.02, 0.3, flat(TIMBER.bark), -0.14, 0, 0), box(0.04, 0.02, 0.3, flat(TIMBER.bark), 0.14, 0, 0));
  group.position.set(x, BASE, z);
  group.rotation.y = turn;
  return group;
}

export function plankStack(x: number, z: number, turn: number, count: number): THREE.Object3D {
  const group = new THREE.Group();
  for (let i = 0; i < count; i++) {
    const plank = box(0.44, 0.022, 0.09, flat(TIMBER.plank), (tileHash(i, 7) - 0.5) * 0.03, i * 0.024, (i % 2) * 0.1 - 0.05);
    group.add(plank);
  }
  group.position.set(x, BASE, z);
  group.rotation.y = turn;
  return group;
}

export function leaningPlanks(x: number, z: number, wall: number): THREE.Object3D {
  const group = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const plank = box(0.08, 0.4, 0.02, flat(TIMBER.plank), x + i * 0.09, BASE, wall + 0.08);
    plank.rotation.x = -0.2;
    group.add(plank);
  }
  return group;
}

export function sawdust(x: number, z: number, radius: number): THREE.Mesh {
  return cylinder(radius, radius * 1.1, 0.008, flat(TIMBER.sawdust), x, BASE, z, 12);
}

export function sawhorse(x: number, z: number, height: number): THREE.Object3D {
  const group = new THREE.Group();
  for (const dx of [-0.18, 0.18]) {
    for (const dz of [-0.09, 0.09]) group.add(rod(at(x + dx, BASE, z + dz), at(x + dx, height, z - dz * 0.6), 0.014, COLORS.timber));
  }
  group.add(timberLog(0.62, 0.05, x, height - 0.03, z, 0));
  return group;
}

export function sawPit(x: number, z: number, length: number): THREE.Object3D {
  const group = new THREE.Group();
  group.add(box(length, 0.006, 0.3, flat(TIMBER.pit), x, BASE, z));
  for (const side of [-1, 1]) group.add(box(length + 0.06, 0.03, 0.05, flat(TIMBER.plank), x, BASE, z + side * 0.17));
  for (const dx of [-0.3, 0.3]) group.add(box(0.06, 0.12, 0.42, flat(COLORS.timber), x + dx * length, BASE, z));
  return group;
}

export function choppingBlock(x: number, z: number): THREE.Object3D {
  const group = new THREE.Group();
  group.add(cylinder(0.075, 0.085, 0.14, flat(TIMBER.bark), x, BASE, z, 10));
  group.add(cylinder(0.068, 0.068, 0.006, flat(TIMBER.heartwood), x, BASE + 0.14, z, 10));
  return group;
}

export function splitWood(x: number, z: number, count: number, seed: number): THREE.Object3D {
  const group = new THREE.Group();
  for (let i = 0; i < count; i++) {
    const a = tileHash(seed, i) * Math.PI * 2;
    const r = tileHash(i, seed) * 0.12;
    const piece = box(0.13, 0.03, 0.035, flat(i % 3 ? TIMBER.heartwood : TIMBER.plank), x + Math.cos(a) * r, BASE + (i % 3) * 0.02, z + Math.sin(a) * r);
    piece.rotation.y = a;
    group.add(piece);
  }
  return group;
}

export function hungSaw(x: number, y: number, z: number): THREE.Object3D {
  const group = new THREE.Group();
  group.add(box(0.36, 0.08, 0.01, flat(TIMBER.iron), x, y, z));
  group.add(box(0.07, 0.07, 0.025, flat(COLORS.timber), x - 0.21, y + 0.005, z));
  group.add(box(0.015, 0.03, 0.02, flat(COLORS.dark), x, y + 0.08, z - 0.005));
  return group;
}

export function hungAxe(x: number, y: number, z: number): THREE.Object3D {
  const group = new THREE.Group();
  group.add(box(0.016, 0.2, 0.016, flat(COLORS.timber), x, y - 0.2, z));
  group.add(box(0.09, 0.07, 0.012, flat(TIMBER.iron), x + 0.045, y - 0.08, z));
  return group;
}

function sawArm(): THREE.Group {
  const group = new THREE.Group();
  group.add(rod(at(0, 0, 0), HAND, 0.017, FIGURE.skin));
  group.add(box(0.06, 0.025, 0.025, flat(COLORS.timber), HAND.x, HAND.y - 0.012, HAND.z));
  group.add(box(0.012, SAW_BLADE, 0.045, flat(TIMBER.iron), HAND.x + 0.01, HAND.y - SAW_BLADE, HAND.z));
  return group;
}

function axeArm(): THREE.Group {
  const group = new THREE.Group();
  group.add(rod(at(0, 0, 0), HAND, 0.017, FIGURE.skin));
  const along = HAND.clone().setZ(0).normalize();
  const across = at(-along.y, along.x, 0);
  const top = HAND.clone().addScaledVector(across, AXE_HANDLE);
  group.add(rod(HAND, top, 0.009, COLORS.timber));
  const blade = box(0.1, 0.07, 0.014, flat(TIMBER.iron), 0, -0.035, 0);
  blade.position.copy(top.clone().addScaledVector(along, 0.04));
  blade.rotation.z = Math.atan2(across.y, across.x) - Math.PI / 2;
  group.add(blade);
  return group;
}

export function sawyer(): FigureParts {
  return { legs: legs(), torso: torso(TIMBER.tunic, [at(0.13, 0.06, -0.04)]), head: head('pilos'), arm: sawArm() };
}

export function axeman(): FigureParts {
  return { legs: legs(), torso: torso(TIMBER.tunic, [at(0.15, 0.06, -0.04)]), head: head('bare'), arm: axeArm() };
}

export function logCrane(x: number, z: number, height: number, hangAt: number): THREE.Object3D {
  const group = new THREE.Group();
  const apex = at(x, height, z);
  for (const [dx, dz] of [[-0.34, -0.22], [0.34, -0.22], [0, 0.36]]) group.add(rod(at(x + dx, BASE, z + dz), apex, 0.024, COLORS.timber));
  const drum = cylinder(0.035, 0.035, 0.46, flat(COLORS.timber), 0, 0, 0, 8);
  drum.rotation.z = Math.PI / 2;
  drum.position.set(x, 0.32, z - 0.16);
  group.add(drum);
  group.add(rod(apex, at(x, hangAt + 0.1, z), 0.008, TIMBER.rope));
  group.add(rod(apex, at(x, 0.32, z - 0.16), 0.008, TIMBER.rope));
  group.add(timberLog(0.6, 0.05, x, hangAt, z, -0.6));
  return group;
}

export function toolRack(x: number, z: number, withSaw: boolean): THREE.Object3D {
  const group = new THREE.Group();
  for (const dx of [-0.2, 0.2]) group.add(box(0.03, 0.42, 0.03, flat(COLORS.timber), x + dx, BASE, z));
  group.add(box(0.46, 0.03, 0.03, flat(COLORS.timber), x, BASE + 0.4, z));
  group.add(hungAxe(x + 0.12, BASE + 0.4, z + 0.02));
  if (withSaw) group.add(hungSaw(x - 0.04, BASE + 0.33, z + 0.02));
  return group;
}

export function awning(x0: number, z0: number, x1: number, z1: number, back: number, front: number, bays: number, sag: number): THREE.Mesh {
  const geometry = new THREE.PlaneGeometry(x1 - x0, z1 - z0, bays * 6, 4).rotateX(-Math.PI / 2);
  const position = geometry.getAttribute('position') as THREE.BufferAttribute;
  const uv = geometry.getAttribute('uv') as THREE.BufferAttribute;
  for (let i = 0; i < position.count; i++) {
    const across = (position.getX(i) - (x0 - x1) / 2) / (x1 - x0);
    const depth = (position.getZ(i) - (z0 - z1) / 2) / (z1 - z0);
    const droop = Math.sin(Math.PI * ((across * bays) % 1)) * Math.sin(Math.PI * Math.min(depth * 2, 1) / 2);
    position.setY(i, back + (front - back) * depth - sag * droop);
    uv.setXY(i, across, 1 - depth);
  }
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, surface('hide'));
  mesh.position.set((x0 + x1) / 2, 0, (z0 + z1) / 2);
  return mesh;
}

export function pole(x: number, z: number, height: number): THREE.Mesh {
  return cylinder(0.022, 0.028, height - BASE, flat(COLORS.timber), x, BASE, z, 6);
}

export function guyRope(x: number, top: number, z: number, pegX: number, pegZ: number): THREE.Object3D {
  const group = new THREE.Group();
  group.add(rod(at(x, top, z), at(pegX, BASE, pegZ), 0.006, TIMBER.rope));
  group.add(box(0.025, 0.04, 0.025, flat(COLORS.timber), pegX, BASE, pegZ));
  return group;
}

export function lyingSaw(x: number, z: number, turn: number): THREE.Object3D {
  const saw = hungSaw(0, 0, 0);
  saw.rotation.set(-Math.PI / 2, 0, turn);
  saw.position.set(x, BASE + 0.012, z);
  return saw;
}

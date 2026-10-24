import * as THREE from 'three';
import { PALETTE } from '../palette';
import { type FigureParts, FIGURE, SHOULDER, at, head, legs, rod } from './figure';
import { COLORS, box, cone, cylinder, flat, jar, sphere, surface } from './kit';
import { marbleColumn } from './palace';

export const GYM = {
  sand: PALETTE.sand,
  pit: 0xc9a66a,
  rake: 0xd6bd88,
  bronze: PALETTE.bronze,
  loincloth: PALETTE.loincloth,
  straw: 0xd8b46a,
  target: 0xc0392b,
  stone: 0x5a5650,
};

const BASE = 0.03;
const DISC_RADIUS = 0.05;
const GATE_HEIGHT = 0.42;
const GATE_SWING = 1.3;
const LEAN_TO_THICKNESS = 0.03;

export function sandGround(w: number, d: number): THREE.Object3D {
  const group = new THREE.Group();
  group.add(box(w - 0.08, BASE, d - 0.08, flat(GYM.sand), w / 2, 0, d / 2));
  return group;
}

export function rakedSand(x0: number, z0: number, w: number, d: number): THREE.Object3D {
  const group = new THREE.Group();
  group.add(box(w, 0.006, d, flat(GYM.sand), x0 + w / 2, BASE, z0 + d / 2));
  for (let z = z0 + 0.1; z < z0 + d - 0.05; z += 0.12) group.add(box(w - 0.1, 0.008, 0.012, flat(GYM.rake), x0 + w / 2, BASE, z));
  return group;
}

export function wrestlingPit(x: number, z: number, w: number, d: number): THREE.Object3D {
  const group = new THREE.Group();
  const curb = surface('rubble');
  group.add(box(w, 0.012, d, flat(GYM.pit), x, BASE, z));
  for (const side of [-1, 1]) {
    group.add(box(w + 0.08, 0.04, 0.04, curb, x, BASE, z + side * (d / 2 + 0.02)));
    group.add(box(0.04, 0.04, d, curb, x + side * (w / 2 + 0.02), BASE, z));
  }
  return group;
}

function leanToRoof(length: number, depth: number, high: number, low: number): THREE.Object3D {
  const group = new THREE.Group();
  const slope = Math.hypot(depth, high - low) + 0.06;
  const pitch = Math.atan2(high - low, depth);
  const slab = box(length, LEAN_TO_THICKNESS, slope, surface('tiles'), 0, -LEAN_TO_THICKNESS / 2, 0);
  const pivot = new THREE.Group();
  pivot.add(slab);
  pivot.position.set(0, (high + low) / 2, 0);
  pivot.rotation.x = pitch;
  group.add(pivot);
  group.add(box(length + 0.02, 0.04, 0.05, flat(COLORS.aegean), 0, low - 0.06, depth / 2 - 0.02));
  return group;
}

export function placed(object: THREE.Object3D, x: number, z: number, turn: number): THREE.Object3D {
  const pivot = new THREE.Group();
  pivot.add(object);
  pivot.position.set(x, 0, z);
  pivot.rotation.y = turn;
  return pivot;
}

export function stoaWing(length: number, depth: number, height: number, columns: number, gap = 0): THREE.Object3D {
  const group = new THREE.Group();
  const walls = surface('whitewash');
  const back = -depth / 2 + 0.04;
  const wallTop = height + 0.1;
  if (gap === 0) group.add(box(length, wallTop - BASE, 0.08, walls, 0, BASE, back));
  else {
    const piece = (length - gap) / 2;
    for (const side of [-1, 1]) group.add(box(piece, wallTop - BASE, 0.08, walls, side * (gap / 2 + piece / 2), BASE, back));
  }
  group.add(box(length, 0.04, depth - 0.04, flat(0xe8e2d4), 0, BASE, 0));
  const span = length - 2 * depth;
  for (let i = 0; i < columns; i++) group.add(marbleColumn(-span / 2 + (span * i) / (columns - 1), depth / 2 - 0.1, height, BASE + 0.04));
  group.add(box(length, 0.06, 0.12, walls, 0, BASE + 0.04 + height, depth / 2 - 0.1));
  group.add(leanToRoof(length + 0.04, depth, wallTop + 0.08, BASE + 0.1 + height));
  return group;
}

export function gate(x: number, front: number, width: number, open: boolean): THREE.Object3D {
  const group = new THREE.Group();
  const walls = surface('whitewash');
  for (const side of [-1, 1]) group.add(box(0.1, GATE_HEIGHT + 0.12, 0.12, walls, x + side * (width / 2 + 0.05), BASE, front));
  group.add(box(width + 0.3, 0.07, 0.14, flat(COLORS.deepAegean), x, BASE + GATE_HEIGHT + 0.12, front));
  const swing = open ? GATE_SWING : 0;
  for (const side of [-1, 1]) {
    const hinge = new THREE.Group();
    hinge.add(box(width / 2, GATE_HEIGHT, 0.025, flat(COLORS.aegean), -side * width / 4, 0, 0));
    hinge.add(box(width / 2 - 0.04, 0.025, 0.03, flat(COLORS.deepAegean), -side * width / 4, GATE_HEIGHT * 0.3, 0));
    hinge.add(box(width / 2 - 0.04, 0.025, 0.03, flat(COLORS.deepAegean), -side * width / 4, GATE_HEIGHT * 0.75, 0));
    hinge.position.set(x + side * width / 2, BASE, front);
    hinge.rotation.y = -side * swing;
    group.add(hinge);
  }
  return group;
}

export function parapet(x0: number, x1: number, z: number, height: number): THREE.Object3D {
  const group = new THREE.Group();
  group.add(box(x1 - x0, height, 0.09, surface('whitewash'), (x0 + x1) / 2, BASE, z));
  group.add(box(x1 - x0 + 0.01, 0.025, 0.1, flat(COLORS.aegean), (x0 + x1) / 2, BASE + height - 0.06, z));
  return group;
}

export function parapetAlongZ(x: number, z0: number, z1: number, height: number): THREE.Object3D {
  const group = new THREE.Group();
  group.add(box(0.09, height, z1 - z0, surface('whitewash'), x, BASE, (z0 + z1) / 2));
  group.add(box(0.1, 0.025, z1 - z0 + 0.01, flat(COLORS.aegean), x, BASE + height - 0.06, (z0 + z1) / 2));
  return group;
}

function standingDisc(x: number, y: number, z: number, turn = 0): THREE.Mesh {
  const disc = cylinder(DISC_RADIUS, DISC_RADIUS, 0.014, flat(GYM.bronze), 0, -0.007, 0, 16);
  disc.rotation.set(Math.PI / 2, 0, turn);
  disc.position.set(x, y, z);
  return disc;
}

export function lyingDisc(x: number, z: number): THREE.Mesh {
  return cylinder(DISC_RADIUS, DISC_RADIUS, 0.014, flat(GYM.bronze), x, BASE, z, 16);
}

export function discRack(x: number, z: number, discs: number): THREE.Object3D {
  const group = new THREE.Group();
  for (const dx of [-0.13, 0.13]) group.add(box(0.03, 0.22, 0.03, flat(COLORS.timber), x + dx, BASE, z));
  group.add(box(0.3, 0.025, 0.08, flat(COLORS.timber), x, BASE + 0.08, z));
  group.add(box(0.3, 0.02, 0.03, flat(COLORS.timber), x, BASE + 0.2, z));
  for (let i = 0; i < discs; i++) group.add(standingDisc(x - 0.08 + i * 0.08, BASE + 0.09 + DISC_RADIUS + 0.01, z, 0));
  return group;
}

export function javelinRack(x: number, z: number, javelins: number): THREE.Object3D {
  const group = new THREE.Group();
  for (const dx of [-0.14, 0.14]) group.add(box(0.03, 0.4, 0.03, flat(COLORS.timber), x + dx, BASE, z));
  group.add(box(0.34, 0.025, 0.03, flat(COLORS.timber), x, BASE + 0.38, z));
  for (let i = 0; i < javelins; i++) {
    const dx = -0.11 + i * 0.055;
    group.add(rod(at(x + dx, BASE, z + 0.1), at(x + dx, BASE + 0.62, z - 0.01), 0.007, COLORS.timber));
    group.add(rod(at(x + dx, BASE + 0.62, z - 0.01), at(x + dx, BASE + 0.67, z - 0.02), 0.01, GYM.bronze));
  }
  return group;
}

export function stuckJavelin(x: number, z: number, lean: number): THREE.Object3D {
  const group = new THREE.Group();
  const top = at(x + lean, BASE + 0.5, z + lean * 0.4);
  group.add(rod(at(x, BASE - 0.02, z), top, 0.007, COLORS.timber));
  return group;
}

export function strawTarget(x: number, z: number, turn: number): THREE.Object3D {
  const group = new THREE.Group();
  group.add(box(0.04, 0.32, 0.04, flat(COLORS.timber), 0, BASE, -0.02));
  const rings: [number, number][] = [[0.17, GYM.straw], [0.12, COLORS.whitewash], [0.08, GYM.target], [0.04, COLORS.whitewash]];
  rings.forEach(([radius, color], i) => {
    const ring = cylinder(radius, radius, 0.05 + i * 0.006, flat(color), 0, 0, 0, 18);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(0, BASE + 0.4, 0.02);
    group.add(ring);
  });
  group.position.set(x, 0, z);
  group.rotation.y = turn;
  return group;
}

export function turningPost(x: number, z: number): THREE.Object3D {
  const group = new THREE.Group();
  group.add(box(0.16, 0.05, 0.16, surface('rubble'), x, BASE, z));
  group.add(cylinder(0.05, 0.06, 0.42, flat(COLORS.whitewash), x, BASE + 0.05, z, 10));
  group.add(cone(0.07, 0.12, flat(COLORS.aegean), x, BASE + 0.47, z, 10));
  return group;
}

export function startingSill(x: number, z0: number, z1: number): THREE.Object3D {
  const group = new THREE.Group();
  group.add(box(0.1, 0.012, z1 - z0, flat(COLORS.whitewash), x, BASE, (z0 + z1) / 2));
  for (let z = z0 + 0.15; z < z1; z += 0.3) group.add(box(0.012, 0.016, 0.1, flat(GYM.stone), x, BASE, z));
  return group;
}

export function trackCurb(x0: number, x1: number, z: number): THREE.Mesh {
  return box(x1 - x0, 0.03, 0.05, flat(COLORS.whitewash), (x0 + x1) / 2, BASE, z);
}

export function stoneTiers(x0: number, x1: number, z0: number, z1: number, tiers: number): THREE.Object3D {
  const group = new THREE.Group();
  const run = (z1 - z0) / tiers;
  for (let i = 0; i < tiers; i++) {
    const depth = run * (tiers - i);
    group.add(box(x1 - x0, 0.09 * (i + 1), depth, surface('rubble'), (x0 + x1) / 2, BASE, z0 + depth / 2));
    group.add(box(x1 - x0, 0.015, 0.06, flat(COLORS.whitewash), (x0 + x1) / 2, BASE + 0.09 * (i + 1), z0 + depth - 0.03));
  }
  return group;
}

export function bench(x: number, z: number, w: number, alongZ = false): THREE.Object3D {
  const group = new THREE.Group();
  const [sx, sz] = alongZ ? [0.12, w] : [w, 0.12];
  group.add(box(sx, 0.1, sz, surface('rubble'), x, BASE, z));
  group.add(box(sx + 0.02, 0.025, sz + 0.02, flat(COLORS.whitewash), x, BASE + 0.1, z));
  return group;
}

export function oilFlask(x: number, z: number): THREE.Mesh {
  return jar(x, BASE, z, 0.45, COLORS.clay);
}

export function halteres(x: number, z: number): THREE.Object3D {
  const group = new THREE.Group();
  for (const dx of [-0.04, 0.04]) group.add(box(0.035, 0.03, 0.09, flat(GYM.stone), x + dx, BASE, z));
  return group;
}

export function discobolus(x: number, z: number, turn: number): THREE.Object3D {
  const group = new THREE.Group();
  const marble = surface('whitewash');
  const bronze = GYM.bronze;
  group.add(box(0.2, 0.14, 0.2, marble, 0, BASE, 0));
  group.add(box(0.22, 0.03, 0.22, flat(COLORS.aegean), 0, BASE + 0.14, 0));
  const foot = BASE + 0.17;
  const hip = at(-0.01, foot + 0.2, 0);
  group.add(rod(at(0.06, foot, 0.04), hip, 0.022, bronze));
  group.add(rod(at(-0.08, foot, -0.04), hip, 0.022, bronze));
  const chest = at(0.08, foot + 0.38, 0);
  group.add(rod(hip, chest, 0.045, bronze));
  group.add(sphere(0.045, flat(bronze), 0.12, foot + 0.44, 0));
  const hand = at(-0.16, foot + 0.4, 0.06);
  group.add(rod(at(0.07, foot + 0.36, 0.05), hand, 0.018, bronze));
  group.add(rod(at(0.07, foot + 0.36, -0.05), at(0.16, foot + 0.16, -0.02), 0.018, bronze));
  group.add(standingDisc(hand.x - 0.02, hand.y, hand.z + 0.02, 0));
  group.position.set(x, 0, z);
  group.rotation.y = turn;
  return group;
}

const FREE_HAND = at(0.07, 0.02, -0.1);

function athleteTorso(hands: THREE.Vector3[]): THREE.Group {
  const upper = new THREE.Group();
  upper.add(cylinder(0.075, 0.05, 0.22, flat(FIGURE.skin), 0, -0.02, 0, 10));
  upper.add(cylinder(0.07, 0.075, 0.08, flat(GYM.loincloth), 0, -0.08, 0, 10));
  for (const hand of hands) upper.add(rod(at(0, SHOULDER, Math.sign(hand.z) * 0.07), hand, 0.017, FIGURE.skin));
  return upper;
}

function throwingArm(implement: THREE.Object3D): THREE.Group {
  const arm = new THREE.Group();
  const hand = at(0.02, -0.15, 0.03);
  arm.add(rod(at(0, 0, 0), hand, 0.017, FIGURE.skin));
  implement.position.copy(hand);
  arm.add(implement);
  return arm;
}

function discInHand(): THREE.Object3D {
  const disc = cylinder(DISC_RADIUS, DISC_RADIUS, 0.014, flat(GYM.bronze), 0, -0.007, 0, 16);
  disc.rotation.x = Math.PI / 2;
  disc.position.z = 0.02;
  const group = new THREE.Group();
  group.add(disc);
  return group;
}

function javelinInHand(): THREE.Object3D {
  const group = new THREE.Group();
  group.add(rod(at(-0.3, -0.05, 0), at(0.3, 0.05, 0), 0.007, COLORS.timber));
  group.add(rod(at(0.3, 0.05, 0), at(0.35, 0.06, 0), 0.01, GYM.bronze));
  return group;
}

export function discusThrower(): FigureParts {
  return { legs: legs(), torso: athleteTorso([FREE_HAND]), head: head('bare'), arm: throwingArm(discInHand()) };
}

export function javelinThrower(): FigureParts {
  return { legs: legs(), torso: athleteTorso([FREE_HAND]), head: head('bare'), arm: throwingArm(javelinInHand()) };
}

export function runner(): FigureParts {
  return { legs: legs(), torso: athleteTorso([at(0.09, 0.04, 0.08), at(-0.07, 0.0, -0.08)]), head: head('bare') };
}

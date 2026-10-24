import * as THREE from 'three';
import { tileHash } from '../palette';
import { BLOOM } from './garden';
import { COLORS, box, cone, cylinder, flat, sphere, surface } from './kit';
import { PALACE } from './palace';
import { PARK_GROUND } from './park';
import { water } from './water';

export const FLOWER = { ...BLOOM, violet: 0x8e5cc9, white: 0xf7f4ee, orange: 0xef8a2c, blue: 0x4a7fd6 };
const WISTERIA = 0x9a7ad6;
const VINE = 0x4f7f2e;
const LEMON_LEAF = 0x3d6b2a;
const LEMON = 0xf5d63a;
const BLOOM_SPACING = 0.065;
const BLOOM_RADIUS = 0.036;
const CURB = 0.03;

export type ColourAt = (x: number, z: number) => number;

export function bloomMass(x0: number, z0: number, w: number, d: number, y: number, colourAt: ColourAt, seed: number): THREE.Object3D {
  const group = new THREE.Group();
  group.add(box(w, 0.02, d, flat(COLORS.foliage), x0 + w / 2, y, z0 + d / 2));
  const across = Math.max(1, Math.round(w / BLOOM_SPACING));
  const deep = Math.max(1, Math.round(d / BLOOM_SPACING));
  for (let i = 0; i < across; i++) {
    for (let j = 0; j < deep; j++) {
      const n = seed * 977 + i * 31 + j;
      const x = x0 + ((i + 0.5) / across) * w + (tileHash(n, 1) - 0.5) * 0.02;
      const z = z0 + ((j + 0.5) / deep) * d + (tileHash(n, 2) - 0.5) * 0.02;
      group.add(sphere(BLOOM_RADIUS, flat(colourAt(x, z)), x, y + 0.03 + tileHash(n, 3) * 0.015, z));
    }
  }
  return group;
}

export function raisedBed(x0: number, z0: number, w: number, d: number, base: number, height: number, colourAt: ColourAt, seed: number): THREE.Object3D {
  const group = new THREE.Group();
  group.add(box(w, height, d, flat(PALACE.marble), x0 + w / 2, base, z0 + d / 2));
  group.add(bloomMass(x0 + CURB, z0 + CURB, w - 2 * CURB, d - 2 * CURB, base + height - 0.01, colourAt, seed));
  return group;
}

export function bordered(x0: number, z0: number, w: number, d: number, border: number, outer: number, inner: number): ColourAt {
  return (x, z) => (x > x0 + border && x < x0 + w - border && z > z0 + border && z < z0 + d - border ? inner : outer);
}

export function stripedAlongX(x0: number, w: number, colours: number[]): ColourAt {
  return (x) => colours[Math.min(colours.length - 1, Math.floor(((x - x0) / w) * colours.length))];
}

export function tieredFountain(x: number, z: number, radius: number): THREE.Object3D {
  const group = new THREE.Group();
  const marble = flat(PALACE.marble);
  group.add(cylinder(radius, radius + 0.01, 0.09, marble, x, PARK_GROUND, z, 8));
  group.add(cylinder(radius + 0.013, radius + 0.013, 0.025, flat(COLORS.aegean), x, PARK_GROUND + 0.04, z, 8));
  group.add(cylinder(radius - 0.03, radius - 0.03, 0.004, water, x, PARK_GROUND + 0.088, z, 16));
  group.add(cylinder(0.035, 0.05, 0.24, marble, x, PARK_GROUND + 0.08, z, 10));
  group.add(cylinder(0.14, 0.05, 0.045, marble, x, PARK_GROUND + 0.3, z, 14));
  group.add(cylinder(0.12, 0.12, 0.004, water, x, PARK_GROUND + 0.342, z, 14));
  group.add(cylinder(0.015, 0.02, 0.09, marble, x, PARK_GROUND + 0.34, z, 8));
  group.add(sphere(0.03, flat(PALACE.gold), x, PARK_GROUND + 0.45, z));
  return group;
}

export function pergola(x0: number, z0: number, x1: number, z1: number, height: number, postXs: number[], seed: number): THREE.Object3D {
  const group = new THREE.Group();
  const white = surface('whitewash');
  const vine = flat(VINE);
  const top = PARK_GROUND + height;
  for (const z of [z0, z1]) {
    for (const x of postXs) {
      group.add(cylinder(0.025, 0.03, height, flat(COLORS.aegean), x, PARK_GROUND, z, 8));
      group.add(sphere(0.04, vine, x + 0.02, PARK_GROUND + height * 0.35, z));
      group.add(sphere(0.035, vine, x - 0.02, PARK_GROUND + height * 0.65, z));
    }
    group.add(box(x1 - x0 + 0.1, 0.05, 0.05, white, (x0 + x1) / 2, top, z));
  }
  for (let x = x0; x <= x1 + 0.001; x += 0.12) group.add(box(0.03, 0.025, z1 - z0 + 0.14, white, x, top + 0.05, (z0 + z1) / 2));
  for (let x = x0 + 0.06; x < x1; x += 0.16) {
    for (const z of [z0, (z0 + z1) / 2, z1]) {
      const n = seed * 53 + Math.round(x * 100) + Math.round(z * 10);
      const puff = sphere(0.06 + tileHash(n, 1) * 0.03, vine, x + (tileHash(n, 2) - 0.5) * 0.06, top + 0.09, z + (tileHash(n, 3) - 0.5) * 0.08);
      puff.scale.y = 0.6;
      group.add(puff);
    }
    for (const z of [z0, z1]) {
      const cluster = cone(0.045, 0.17, flat(WISTERIA), x + 0.04, top - 0.17, z, 6);
      cluster.rotation.x = Math.PI;
      cluster.position.y = top - 0.04;
      group.add(cluster);
    }
  }
  return group;
}

export function lemonTreeInPot(x: number, z: number, base: number, seed: number): THREE.Object3D {
  const group = new THREE.Group();
  group.add(cylinder(0.085, 0.06, 0.13, flat(COLORS.clay), x, base, z, 12));
  group.add(cylinder(0.095, 0.095, 0.025, flat(COLORS.clay), x, base + 0.12, z, 12));
  group.add(cylinder(0.075, 0.075, 0.01, flat(COLORS.earth), x, base + 0.14, z, 12));
  group.add(cylinder(0.012, 0.016, 0.14, flat(COLORS.timber), x, base + 0.14, z, 6));
  const crownY = base + 0.33;
  group.add(sphere(0.12, flat(LEMON_LEAF), x, crownY, z));
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + tileHash(seed, i) * 0.6;
    const up = (tileHash(seed + 7, i) - 0.4) * 0.12;
    group.add(sphere(0.03, flat(LEMON), x + Math.cos(a) * 0.115, crownY + up, z + Math.sin(a) * 0.115));
  }
  return group;
}

export function whiteTerrace(x0: number, z0: number, w: number, d: number, top: number): THREE.Object3D {
  const group = new THREE.Group();
  group.add(box(w, top - PARK_GROUND - 0.03, d, surface('whitewash'), x0 + w / 2, PARK_GROUND, z0 + d / 2));
  group.add(box(w + 0.01, 0.025, d + 0.01, flat(COLORS.aegean), x0 + w / 2, top - 0.075, z0 + d / 2));
  group.add(box(w + 0.04, 0.03, d + 0.04, flat(PALACE.marble), x0 + w / 2, top - 0.03, z0 + d / 2));
  group.add(box(w - 0.04, 0.004, d - 0.04, flat(PALACE.ground), x0 + w / 2, top, z0 + d / 2));
  return group;
}

import * as THREE from 'three';
import { COLORS, box, cylinder, flat, sphere, stone, surface } from './kit';
import { PALACE } from './palace';
import { water } from './water';

const PARK_LAWN = 0x6fa23c;
const GRAVEL = 0xe3dccb;
const BOXWOOD = 0x3f6a2a;
const PLANE_LEAF = 0x6c9a38;
const PLANE_LEAF_LIGHT = 0x86b24a;
const PLANE_BARK = 0xb8ab92;
const TILE = 1;
const LAWN_INSET = 0.02;
export const PARK_GROUND = 0.03;

export function parkLawn(): THREE.Mesh {
  return box(TILE - 2 * LAWN_INSET, PARK_GROUND, TILE - 2 * LAWN_INSET, flat(PARK_LAWN), TILE / 2, 0, TILE / 2);
}

export function gravelPatch(x0: number, z0: number, w: number, d: number): THREE.Mesh {
  return box(w, 0.008, d, flat(GRAVEL), x0 + w / 2, PARK_GROUND, z0 + d / 2);
}

export function gravelDisc(x: number, z: number, radius: number): THREE.Mesh {
  return cylinder(radius, radius, 0.008, flat(GRAVEL), x, PARK_GROUND, z, 24);
}

export function marbleBench(x: number, z: number, length: number, turn = 0): THREE.Object3D {
  const group = new THREE.Group();
  const marble = flat(PALACE.marble);
  for (const dx of [-length / 2 + 0.04, length / 2 - 0.04]) group.add(box(0.05, 0.08, 0.1, marble, dx, 0, 0));
  group.add(box(length, 0.03, 0.12, marble, 0, 0.08, 0));
  group.add(box(length - 0.06, 0.012, 0.09, flat(COLORS.aegean), 0, 0.11, 0));
  group.position.set(x, PARK_GROUND, z);
  group.rotation.y = turn;
  return group;
}

export function clippedBush(x: number, z: number, radius: number): THREE.Object3D {
  const group = new THREE.Group();
  group.add(sphere(radius, flat(BOXWOOD), x, PARK_GROUND + radius * 0.85, z));
  return group;
}

export function roundBed(x: number, z: number, radius: number, blooms: number[]): THREE.Object3D {
  const group = new THREE.Group();
  group.add(cylinder(radius, radius, 0.05, surface('whitewash'), x, PARK_GROUND, z, 24));
  group.add(cylinder(radius - 0.025, radius - 0.025, 0.055, flat(COLORS.foliage), x, PARK_GROUND, z, 24));
  const ring = radius * 0.62;
  blooms.forEach((bloom, i) => {
    const a = (i / blooms.length) * Math.PI * 2;
    group.add(sphere(0.035, flat(bloom), x + Math.cos(a) * ring, PARK_GROUND + 0.08, z + Math.sin(a) * ring));
  });
  return group;
}

export function planeTree(x: number, z: number, scale: number): THREE.Object3D {
  const group = new THREE.Group();
  const bark = flat(PLANE_BARK);
  group.add(cylinder(0.03 * scale, 0.045 * scale, 0.36 * scale, bark, x, PARK_GROUND, z, 7));
  const limb = cylinder(0.018 * scale, 0.025 * scale, 0.2 * scale, bark, x + 0.05 * scale, PARK_GROUND + 0.3 * scale, z, 6);
  limb.rotation.z = -0.7;
  group.add(limb);
  const crowns: [number, number, number, number, number][] = [
    [0, 0.46, 0, 0.21, PLANE_LEAF],
    [0.17, 0.42, 0.09, 0.15, PLANE_LEAF_LIGHT],
    [-0.16, 0.42, 0.07, 0.15, PLANE_LEAF],
    [0.04, 0.44, -0.17, 0.15, PLANE_LEAF_LIGHT],
    [-0.05, 0.53, -0.04, 0.13, PLANE_LEAF_LIGHT],
  ];
  for (const [dx, dy, dz, r, color] of crowns) {
    const crown = sphere(r * scale, flat(color), x + dx * scale, PARK_GROUND + dy * scale, z + dz * scale);
    crown.scale.y = 0.7;
    group.add(crown);
  }
  return group;
}

export function basin(x: number, z: number, radius: number): THREE.Object3D {
  const group = new THREE.Group();
  group.add(cylinder(radius, radius + 0.01, 0.06, flat(PALACE.marble), x, PARK_GROUND, z, 20));
  group.add(cylinder(radius - 0.02, radius - 0.02, 0.004, water, x, PARK_GROUND + 0.058, z, 20));
  return group;
}

export function steppingStones(points: [number, number][], seed: number): THREE.Object3D {
  const group = new THREE.Group();
  points.forEach(([x, z], i) => group.add(stone(0.045, x, PARK_GROUND, z, seed + i, GRAVEL)));
  return group;
}

export function parkLawnPlot(w: number, d: number): THREE.Mesh {
  return box(w - 2 * LAWN_INSET, PARK_GROUND, d - 2 * LAWN_INSET, flat(PARK_LAWN), w / 2, 0, d / 2);
}

import * as THREE from 'three';
import { tileHash } from '../palette';
import { COLORS, box, cylinder, flat, sphere } from './kit';

export type Point3 = [number, number, number];
export type Puff = [number, number, number, number];

const BARK = 0x5a4d3f;
const BARK_LIGHT = 0x7a6b58;
const LEAF_SHADE = 0x77825f;
const LEAF = 0x9aa483;
const LEAF_SILVER = 0xb2bd9f;
const OLIVE_BLACK = 0x2b1d36;
const CLOTH = 0xf4f1ea;
const CLOTH_BAND = COLORS.aegean;
const STAKE = 0x9c7f55;

const PUFF_FLATTENING = 0.72;
const OLIVE_RADIUS = 0.026;
const SPRIGS_PER_CLUSTER = 6;
const SPRIG_SPREAD = 0.75;
const SPRIG_SIZE = 0.55;
const OLIVE_EVERY_NTH_SPRIG = 2;
const OLIVE_BUNCH: Point3[] = [[0, 0, 0], [0.03, -0.015, 0.01], [-0.01, -0.025, 0.025]];
const TRUNK_SEGMENTS = 7;
const UP = new THREE.Vector3(0, 1, 0);

export function treeBed(x: number, z: number, radius: number): THREE.Mesh {
  return cylinder(radius, radius + 0.02, 0.02, flat(COLORS.earth), x, 0, z, 14);
}

function segment(from: Point3, to: Point3, rFrom: number, rTo: number, material: THREE.Material): THREE.Mesh {
  const a = new THREE.Vector3(...from);
  const b = new THREE.Vector3(...to);
  const direction = b.clone().sub(a);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rTo, rFrom, direction.length(), TRUNK_SEGMENTS), material);
  mesh.position.copy(a.clone().add(b).multiplyScalar(0.5));
  mesh.quaternion.setFromUnitVectors(UP, direction.normalize());
  return mesh;
}

export function limb(points: Point3[], rBase: number, rTip: number): THREE.Object3D {
  const group = new THREE.Group();
  const bark = flat(BARK);
  const radiusAt = (i: number) => rBase + ((rTip - rBase) * i) / (points.length - 1);
  for (let i = 0; i < points.length - 1; i++) {
    group.add(segment(points[i], points[i + 1], radiusAt(i), radiusAt(i + 1), bark));
    if (i > 0) group.add(sphere(radiusAt(i), bark, ...points[i]));
  }
  return group;
}

export function burl(x: number, y: number, z: number, radius: number): THREE.Mesh {
  const knot = sphere(radius, flat(BARK_LIGHT), x, y, z);
  knot.scale.set(1, 0.8, 1);
  return knot;
}

export function hollow(x: number, y: number, z: number, radius: number, turn: number): THREE.Mesh {
  const hole = sphere(radius, flat(COLORS.dark), x + Math.cos(turn) * radius * 0.9, y, z + Math.sin(turn) * radius * 0.9);
  hole.scale.set(0.5, 1.2, 0.5);
  return hole;
}

function sprigs(clusters: Puff[], seed: number): Puff[] {
  return clusters.flatMap(([x, y, z, r], c) =>
    Array.from({ length: SPRIGS_PER_CLUSTER }, (_, i): Puff => {
      const around = tileHash(seed + c, i) * Math.PI * 2;
      const out = Math.sqrt(tileHash(i, seed + c)) * r * SPRIG_SPREAD;
      const lift = (tileHash(seed + c + i, i + 7) - 0.4) * r * PUFF_FLATTENING;
      return [x + Math.cos(around) * out, y + lift, z + Math.sin(around) * out, r * SPRIG_SIZE];
    }),
  );
}

function sprigShade(y: number, bottom: number, top: number): number {
  const height = (y - bottom) / (top - bottom);
  if (height > 0.62) return LEAF_SILVER;
  return height > 0.3 ? LEAF : LEAF_SHADE;
}

export function crown(clusters: Puff[], seed: number): THREE.Object3D {
  const group = new THREE.Group();
  const all = sprigs(clusters, seed);
  const top = Math.max(...all.map(([, y]) => y));
  const bottom = Math.min(...all.map(([, y]) => y));
  for (const [x, y, z, r] of all) {
    const leaves = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), flat(sprigShade(y, bottom, top)));
    leaves.position.set(x, y, z);
    leaves.scale.set(1, PUFF_FLATTENING, 1);
    group.add(leaves);
  }
  return group;
}

export function olives(clusters: Puff[], seed: number): THREE.Object3D {
  const group = new THREE.Group();
  const fruit = flat(OLIVE_BLACK);
  sprigs(clusters, seed).forEach(([x, y, z, r], s) => {
    if (s % OLIVE_EVERY_NTH_SPRIG !== 0) return;
    const around = tileHash(seed, s) * Math.PI * 2;
    for (const [dx, dy, dz] of OLIVE_BUNCH) {
      const ox = Math.cos(around) * r * 0.8 + dx;
      const oz = Math.sin(around) * r * 0.8 + dz;
      group.add(sphere(OLIVE_RADIUS, fruit, x + ox, y - r * 0.45 + dy, z + oz));
    }
  });
  return group;
}

export function harvestCloth(x: number, z: number, size: number, turn: number, seed: number): THREE.Object3D {
  const group = new THREE.Group();
  const sheet = new THREE.Group().add(box(size, 0.008, size, flat(CLOTH), 0, 0.012, 0), box(size, 0.01, 0.04, flat(CLOTH_BAND), 0, 0.012, size / 2 - 0.05));
  sheet.position.set(x, 0, z);
  sheet.rotation.y = turn;
  group.add(sheet);
  const fruit = flat(OLIVE_BLACK);
  for (let i = 0; i < 6; i++) {
    const dx = (tileHash(seed, i) - 0.5) * size * 0.7;
    const dz = (tileHash(i, seed) - 0.5) * size * 0.7;
    group.add(sphere(OLIVE_RADIUS, fruit, x + dx, 0.03, z + dz));
  }
  return group;
}

export function stake(x: number, z: number, height: number): THREE.Object3D {
  const group = new THREE.Group();
  group.add(cylinder(0.012, 0.014, height, flat(STAKE), x, 0, z, 5));
  group.add(cylinder(0.022, 0.022, 0.02, flat(CLOTH), x, height * 0.6, z, 6));
  return group;
}

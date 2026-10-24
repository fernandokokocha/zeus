import * as THREE from 'three';
import { PALETTE, tileHash } from '../palette';
import { type MaskKind, mask } from './drama-school';
import { FIGURE } from './figure';
import { COLORS, box, cylinder, flat, sphere, surface } from './kit';

export const THEATER = {
  marbleShade: 0xe4e6ec,
  aisle: 0x9aa3b5,
  orchestra: PALETTE.paving,
  crowd: [0xffffff, COLORS.aegean, 0xb5452e, 0xe3a62f, 0x2f4f8a, 0x7a3f99, 0x5d8a4a],
  chorus: 0xf6f3ec,
};

const BASE = 0.03;
const ARC_SEGMENTS = 40;
const SEAT_SPACING = 0.26;
const AISLE_WIDTH = 0.09;
const SEAT_SETBACK = 0.05;
const ATTENDANCE = 0.55;
const AISLE_PROUD = 0.008;
const SPECTATOR_SCALE = 1.2;
const SPECTATOR = {
  torso: new THREE.CylinderGeometry(0.028, 0.038, 0.1, 7).translate(-0.02, 0.065, 0),
  head: new THREE.SphereGeometry(0.03, 8, 6).translate(-0.015, 0.145, 0),
  lap: new THREE.BoxGeometry(0.08, 0.03, 0.065).translate(0.02, 0.025, 0),
  shins: new THREE.BoxGeometry(0.026, 0.08, 0.06).translate(0.055, -0.03, 0),
  arms: new THREE.BoxGeometry(0.05, 0.022, 0.09).translate(0.01, 0.07, 0),
};

export interface Cavea {
  cx: number;
  cz: number;
  inner: number;
  outer: number;
  tiers: number;
  riser: number;
  from: number;
  to: number;
  aisles: number;
}

function ringSector(inner: number, outer: number, from: number, to: number, height: number, material: THREE.Material): THREE.Mesh {
  const shape = new THREE.Shape();
  shape.absarc(0, 0, outer, from, to, false);
  shape.absarc(0, 0, inner, to, from, true);
  const segments = Math.max(4, Math.round((ARC_SEGMENTS * (to - from)) / Math.PI));
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false, curveSegments: segments });
  geometry.rotateX(Math.PI / 2).translate(0, height, 0);
  return new THREE.Mesh(geometry, material);
}

function placedAt<T extends THREE.Object3D>(object: T, x: number, y: number, z: number): T {
  object.position.set(x, y, z);
  return object;
}

const tierDepth = (c: Cavea) => (c.outer - c.inner) / c.tiers;
const tierInner = (c: Cavea, i: number) => c.inner + i * tierDepth(c);
const tierTop = (c: Cavea, i: number) => BASE + (i + 1) * c.riser;
const caveaTop = (c: Cavea) => tierTop(c, c.tiers - 1);

function aisleAngles(c: Cavea): number[] {
  return Array.from({ length: c.aisles }, (_, k) => c.from + ((c.to - c.from) * (k + 1)) / (c.aisles + 1));
}

export function cavea(c: Cavea, tread: [THREE.Material, THREE.Material]): THREE.Object3D {
  const group = new THREE.Group();
  for (let i = 0; i < c.tiers; i++) {
    const tier = ringSector(tierInner(c, i), tierInner(c, i + 1), c.from, c.to, tierTop(c, i), tread[i % 2]);
    group.add(placedAt(tier, c.cx, 0, c.cz));
  }
  const stair = flat(THEATER.aisle);
  for (const a of aisleAngles(c)) {
    for (let i = 0; i < c.tiers; i++) {
      const r = tierInner(c, i) + tierDepth(c) / 2;
      const step = box(tierDepth(c), tierTop(c, i) + AISLE_PROUD, AISLE_WIDTH, stair, 0, 0, 0);
      step.position.set(c.cx + Math.cos(a) * r, step.position.y, c.cz + Math.sin(a) * r);
      step.rotation.y = -a;
      group.add(step);
    }
  }
  return group;
}

export function caveaRim(c: Cavea, height: number, thickness: number): THREE.Object3D {
  const group = new THREE.Group();
  const top = caveaTop(c);
  group.add(placedAt(ringSector(c.outer, c.outer + thickness, c.from, c.to, top + height, surface('whitewash')), c.cx, 0, c.cz));
  group.add(placedAt(ringSector(c.outer - 0.005, c.outer + thickness + 0.01, c.from, c.to, 0.04, flat(COLORS.aegean)), c.cx, top + height - 0.07, c.cz));
  return group;
}

function spectator(x: number, y: number, z: number, facing: number, tunic: number): THREE.Object3D {
  const group = new THREE.Group();
  const cloth = flat(tunic);
  const skin = flat(FIGURE.skin);
  group.add(new THREE.Mesh(SPECTATOR.torso, cloth), new THREE.Mesh(SPECTATOR.lap, cloth), new THREE.Mesh(SPECTATOR.arms, cloth));
  group.add(new THREE.Mesh(SPECTATOR.head, skin), new THREE.Mesh(SPECTATOR.shins, skin));
  group.position.set(x, y, z);
  group.rotation.y = facing;
  group.scale.setScalar(SPECTATOR_SCALE);
  return group;
}

export function audience(c: Cavea, seed: number): THREE.Object3D {
  const group = new THREE.Group();
  const aisles = aisleAngles(c);
  for (let i = 0; i < c.tiers; i++) {
    const r = tierInner(c, i) + SEAT_SETBACK;
    const count = Math.floor(((c.to - c.from) * r) / SEAT_SPACING);
    for (let s = 0; s < count; s++) {
      const a = c.from + ((s + 0.5) / count) * (c.to - c.from);
      if (aisles.some((aisle) => Math.abs(aisle - a) * r < AISLE_WIDTH)) continue;
      if (tileHash(seed + i, s) > ATTENDANCE) continue;
      const color = THEATER.crowd[Math.floor(tileHash(s, seed + i * 7) * THEATER.crowd.length)];
      group.add(spectator(c.cx + Math.cos(a) * r, tierTop(c, i), c.cz + Math.sin(a) * r, Math.PI - a, color));
    }
  }
  return group;
}

export function orchestra(x: number, z: number, radius: number): THREE.Object3D {
  const group = new THREE.Group();
  group.add(cylinder(radius + 0.06, radius + 0.06, 0.02, surface('whitewash'), x, BASE, z, 40));
  group.add(cylinder(radius, radius, 0.024, flat(THEATER.orchestra), x, BASE, z, 40));
  group.add(cylinder(0.11, 0.13, 0.05, surface('whitewash'), x, BASE, z, 12));
  group.add(cylinder(0.1, 0.1, 0.035, flat(COLORS.aegean), x, BASE + 0.05, z, 12));
  return group;
}

export function chorusMember(x: number, z: number, turn: number, kind: MaskKind): THREE.Object3D {
  const group = new THREE.Group();
  group.add(cylinder(0.05, 0.085, 0.3, flat(THEATER.chorus), 0, BASE, 0, 8));
  group.add(cylinder(0.055, 0.058, 0.025, flat(COLORS.aegean), 0, BASE + 0.18, 0, 8));
  group.add(sphere(0.05, flat(FIGURE.skin), 0, BASE + 0.36, 0));
  group.add(mask(kind, 0.045, BASE + 0.36, 0, Math.PI / 2, 0.9));
  group.position.set(x, 0, z);
  group.rotation.y = turn;
  return group;
}

export function chorusRing(x: number, z: number, radius: number, members: number, kind: MaskKind): THREE.Object3D {
  const group = new THREE.Group();
  for (let i = 0; i < members; i++) {
    const a = (i / members) * Math.PI * 2;
    group.add(chorusMember(x + Math.cos(a) * radius, z + Math.sin(a) * radius, -a - Math.PI / 2, kind));
  }
  return group;
}

export function mast(x: number, z: number, height: number, flying: boolean, cloth: number): THREE.Object3D {
  const group = new THREE.Group();
  group.add(box(0.12, 0.05, 0.12, surface('rubble'), x, BASE, z));
  group.add(cylinder(0.014, 0.02, height, flat(COLORS.timber), x, BASE + 0.05, z, 6));
  group.add(sphere(0.025, flat(PALETTE.bronze), x, BASE + 0.05 + height, z));
  if (flying) {
    group.add(box(0.34, 0.16, 0.012, flat(cloth), x + 0.18, BASE + height - 0.13, z));
    group.add(box(0.34, 0.035, 0.014, flat(COLORS.whitewash), x + 0.18, BASE + height - 0.1, z));
  }
  return group;
}

export function hangingCloth(x: number, top: number, z: number, w: number, h: number, turn: number, color: number): THREE.Object3D {
  const pivot = new THREE.Group();
  pivot.add(box(w, h, 0.012, flat(color), 0, -h, 0));
  pivot.add(box(w, 0.03, 0.016, flat(COLORS.whitewash), 0, -h * 0.35, 0));
  pivot.add(box(w + 0.04, 0.02, 0.02, flat(COLORS.timber), 0, -0.02, 0));
  pivot.position.set(x, top, z);
  pivot.rotation.y = turn;
  return pivot;
}

export function garland(x0: number, x1: number, z: number, y: number, sag: number, beads: number): THREE.Object3D {
  const group = new THREE.Group();
  for (let i = 0; i <= beads; i++) {
    const t = i / beads;
    const dip = Math.sin(t * Math.PI) * sag;
    group.add(sphere(0.022, flat(i % 3 ? PALETTE.foliage : 0xe3a62f), x0 + (x1 - x0) * t, y - dip, z));
  }
  return group;
}


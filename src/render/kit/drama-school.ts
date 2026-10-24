import * as THREE from 'three';
import { PALETTE } from '../palette';
import { type FigureParts, HIP, at, head, legs, rod, torso } from './figure';
import { COLORS, box, cylinder, flat, sphere, surface } from './kit';
import { evenly } from './palace';

export const DRAMA = {
  comic: PALETTE.mask,
  tragic: PALETTE.tragicMask,
  purple: PALETTE.actorRobe,
  blue: PALETTE.tragicRobe,
  saffron: 0xe3a62f,
  crimson: 0xb5452e,
  onkos: 0x3a2a1c,
  ground: 0xcfb98f,
  boards: 0xa8784a,
  seam: 0x6e4a2a,
  floor: 0xe6dccb,
};

export type MaskKind = 'comic' | 'tragic';

const BASE = 0.03;
const MASK_RADIUS = 0.06;
const ROBE_LENGTH = 0.3;
const BOARD_WIDTH = 0.1;
const RACK_HEIGHT = 0.42;
const STEP = 0.06;

export function schoolGround(w: number, d: number): THREE.Mesh {
  return box(w - 0.08, BASE, d - 0.08, flat(DRAMA.ground), w / 2, 0, d / 2);
}

export function mask(kind: MaskKind, x: number, y: number, z: number, turn = 0, size = 1): THREE.Object3D {
  const group = new THREE.Group();
  const face = sphere(MASK_RADIUS, flat(kind === 'comic' ? DRAMA.comic : DRAMA.tragic), 0, 0, 0);
  face.scale.set(1, 1.25, 0.45);
  group.add(face);
  const dark = flat(COLORS.dark);
  for (const side of [-1, 1]) group.add(box(0.026, 0.02, 0.02, dark, side * 0.024, 0.01, 0.022));
  if (kind === 'comic') group.add(box(0.06, 0.022, 0.02, dark, 0, -0.045, 0.02));
  else {
    group.add(box(0.026, 0.03, 0.02, dark, 0, -0.05, 0.02));
    const onkos = sphere(MASK_RADIUS * 0.8, flat(DRAMA.onkos), 0, 0.065, -0.01);
    onkos.scale.set(1.1, 0.8, 0.5);
    group.add(onkos);
  }
  group.position.set(x, y, z);
  group.rotation.y = turn;
  group.scale.setScalar(size);
  return group;
}

export function maskPost(kind: MaskKind, x: number, z: number, turn: number): THREE.Object3D {
  const group = new THREE.Group();
  group.add(box(0.1, 0.04, 0.1, surface('rubble'), x, BASE, z));
  group.add(cylinder(0.018, 0.022, 0.36, flat(COLORS.timber), x, BASE + 0.04, z, 6));
  group.add(mask(kind, x, BASE + 0.46, z, turn, 1.6));
  return group;
}

export function hangingRobe(color: number, x: number, top: number, z: number): THREE.Object3D {
  const group = new THREE.Group();
  const robe = cylinder(0.04, 0.075, ROBE_LENGTH, flat(color), x, top - ROBE_LENGTH, z, 8);
  robe.scale.z = 0.45;
  group.add(robe);
  group.add(box(0.12, 0.025, 0.035, flat(color), x, top - 0.02, z));
  const trim = color === DRAMA.saffron ? DRAMA.crimson : DRAMA.saffron;
  group.add(box(0.12, 0.02, 0.04, flat(trim), x, top - ROBE_LENGTH * 0.75, z));
  return group;
}

export function costumeRack(x: number, z: number, length: number, turn: number, robes: number[]): THREE.Object3D {
  const pivot = new THREE.Group();
  const wood = flat(COLORS.timber);
  for (const side of [-1, 1]) pivot.add(box(0.03, RACK_HEIGHT, 0.03, wood, side * length / 2, BASE, 0));
  for (const side of [-1, 1]) pivot.add(box(0.03, 0.02, 0.14, wood, side * length / 2, BASE, 0));
  const rail = cylinder(0.01, 0.01, length, wood, 0, 0, 0, 6);
  rail.rotation.z = Math.PI / 2;
  rail.position.y = BASE + RACK_HEIGHT - 0.01;
  pivot.add(rail);
  const xs = evenly(-length / 2 + 0.08, length / 2 - 0.08, Math.max(robes.length, 2));
  robes.forEach((color, i) => pivot.add(hangingRobe(color, xs[i], BASE + RACK_HEIGHT - 0.02, 0)));
  pivot.position.set(x, 0, z);
  pivot.rotation.y = turn;
  return pivot;
}

export function costumeChest(x: number, z: number, open: boolean): THREE.Object3D {
  const group = new THREE.Group();
  const w = 0.24;
  const d = 0.14;
  const h = 0.11;
  group.add(box(w, h, d, surface('planks'), x, BASE, z));
  group.add(box(w + 0.01, 0.015, 0.02, flat(COLORS.aegean), x, BASE + h * 0.6, z + d / 2));
  if (open) {
    group.add(box(w - 0.04, 0.02, d - 0.04, flat(DRAMA.crimson), x, BASE + h, z));
    group.add(box(0.06, 0.07, 0.03, flat(DRAMA.saffron), x - 0.08, BASE + h - 0.04, z + d / 2 + 0.01));
    const lid = box(w, 0.02, d, surface('planks'), 0, 0, d / 2);
    const hinge = new THREE.Group();
    hinge.add(lid);
    hinge.position.set(x, BASE + h, z - d / 2);
    hinge.rotation.x = -1.9;
    group.add(hinge);
  } else group.add(box(w + 0.02, 0.025, d + 0.02, surface('planks'), x, BASE + h, z));
  return group;
}

export function rehearsalStage(x0: number, z0: number, w: number, d: number, height: number): THREE.Object3D {
  const group = new THREE.Group();
  const cx = x0 + w / 2;
  group.add(box(w, height, d, flat(DRAMA.boards), cx, BASE, z0 + d / 2));
  for (let x = x0 + BOARD_WIDTH; x < x0 + w - 0.02; x += BOARD_WIDTH) group.add(box(0.008, 0.006, d - 0.02, flat(DRAMA.seam), x, BASE + height, z0 + d / 2));
  group.add(box(w + 0.02, 0.03, 0.03, flat(COLORS.aegean), cx, BASE + height - 0.04, z0 + d));
  const steps = Math.round(height / STEP);
  for (let i = 0; i < steps; i++) group.add(box(0.3, height - i * STEP, STEP, flat(DRAMA.boards), cx, BASE, z0 + d + STEP * (i + 0.5)));
  return group;
}

export function skeneWall(x0: number, x1: number, z: number, height: number, doors: number[]): THREE.Object3D {
  const group = new THREE.Group();
  const walls = surface('whitewash');
  const front = z + 0.06;
  group.add(box(x1 - x0, 0.08, 0.16, surface('rubble'), (x0 + x1) / 2, BASE, z));
  group.add(box(x1 - x0, height - 0.08, 0.12, walls, (x0 + x1) / 2, BASE + 0.08, z));
  group.add(box(x1 - x0 + 0.04, 0.05, 0.16, flat(COLORS.aegean), (x0 + x1) / 2, BASE + height - 0.12, z));
  group.add(box(x1 - x0 + 0.08, 0.06, 0.2, walls, (x0 + x1) / 2, BASE + height - 0.07, z));
  doors.forEach((x, i) => {
    const middle = i === Math.floor(doors.length / 2);
    const w = middle ? 0.26 : 0.18;
    const h = middle ? 0.42 : 0.34;
    group.add(box(w, h, 0.02, flat(COLORS.dark), x, BASE + 0.08, front));
    group.add(box(w + 0.06, 0.035, 0.03, flat(COLORS.deepAegean), x, BASE + 0.08 + h, front + 0.005));
    for (const side of [-1, 1]) group.add(box(0.03, h, 0.03, flat(COLORS.deepAegean), x + side * (w / 2 + 0.015), BASE + 0.08, front + 0.005));
  });
  return group;
}

export function paintedPanel(x: number, y: number, front: number, color: number): THREE.Object3D {
  const group = new THREE.Group();
  group.add(box(0.26, 0.22, 0.015, flat(COLORS.deepAegean), x, y, front));
  group.add(box(0.21, 0.17, 0.02, flat(color), x, y + 0.025, front));
  group.add(box(0.21, 0.04, 0.025, flat(DRAMA.floor), x, y + 0.025, front));
  return group;
}

export function trainerStool(x: number, z: number): THREE.Object3D {
  const group = new THREE.Group();
  for (const [dx, dz] of [[-0.05, -0.05], [0.05, -0.05], [-0.05, 0.05], [0.05, 0.05]]) group.add(box(0.015, 0.12, 0.015, flat(COLORS.timber), x + dx, BASE, z + dz));
  group.add(box(0.14, 0.02, 0.14, flat(DRAMA.crimson), x, BASE + 0.12, z));
  return group;
}

const SKIRT = HIP + 0.02;

function robedLegs(color: number): THREE.Group {
  const group = legs();
  group.add(cylinder(0.062, 0.085, SKIRT - 0.02, flat(color), 0, 0.02, 0, 10));
  return group;
}

function maskedHead(kind: MaskKind): THREE.Group {
  const group = head('bare');
  const face = mask(kind, 0.045, 0.005, 0, Math.PI / 2, 0.85);
  group.add(face);
  return group;
}

function declaimingArm(color: number): THREE.Group {
  const group = new THREE.Group();
  const hand = at(0.07, 0.12, 0.05);
  group.add(rod(at(0, 0, 0), at(0.02, 0.04, 0.015), 0.03, color));
  group.add(rod(at(0, 0, 0), hand, 0.017, PALETTE.skin));
  return group;
}

export function actor(): FigureParts {
  return {
    legs: robedLegs(DRAMA.purple),
    torso: torso(DRAMA.purple, [at(0.06, 0.0, -0.09)]),
    head: maskedHead('comic'),
    arm: declaimingArm(DRAMA.purple),
  };
}

export function tragedian(): FigureParts {
  return {
    legs: robedLegs(DRAMA.blue),
    torso: torso(DRAMA.blue, [at(0.06, 0.0, -0.09)]),
    head: maskedHead('tragic'),
    arm: declaimingArm(DRAMA.blue),
  };
}

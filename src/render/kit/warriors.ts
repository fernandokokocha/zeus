import * as THREE from 'three';
import { PALETTE } from '../palette';
import { doorway } from './cottage';
import { type FigureParts, FIGURE, at, head, legs, rod, torso } from './figure';
import { COLORS, box, cylinder, flat, sphere, surface } from './kit';

export const WARRIORS = {
  bronze: FIGURE.bronze,
  darkBronze: 0x8a5f28,
  red: 0xa8322a,
  crest: FIGURE.crest,
  black: 0x2a2420,
  tunic: 0xa8322a,
  straw: 0xd8b46a,
};

const HEALING = {
  robe: 0xf1ebdc,
  sash: 0x6f9a6a,
  snake: 0x4f7a3a,
  staff: 0x8a6a3a,
  soil: 0x6a5236,
  herbs: [0x6f9a3a, 0x8fb04a, 0x5a8a4a],
  lavender: 0x9a7ac9,
  chamomile: 0xf4efd8,
  blanket: 0xe8e0cc,
};

const BASE = 0.03;
const SPEAR_LENGTH = 0.78;

function hopliteShield(radius: number, face = WARRIORS.red): THREE.Object3D {
  const group = new THREE.Group();
  group.add(cylinder(radius, radius, 0.025, flat(WARRIORS.bronze), 0, -0.0125, 0, 18));
  group.add(cylinder(radius * 0.82, radius * 0.82, 0.03, flat(face), 0, -0.015, 0, 18));
  group.add(cylinder(radius * 0.22, radius * 0.22, 0.04, flat(WARRIORS.bronze), 0, -0.02, 0, 12));
  group.rotation.x = Math.PI / 2;
  return group;
}

export function hungShields(x0: number, x1: number, y: number, front: number, count: number, radius = 0.09): THREE.Object3D {
  const group = new THREE.Group();
  const faces = [WARRIORS.red, WARRIORS.black];
  for (let i = 0; i < count; i++) {
    const shield = hopliteShield(radius, faces[i % 2]);
    shield.position.set(x0 + ((x1 - x0) * (i + 0.5)) / count, y, front + 0.02);
    group.add(shield);
  }
  return group;
}

export function hungShieldsAlongZ(x: number, z0: number, z1: number, y: number, count: number, radius = 0.09): THREE.Object3D {
  const group = new THREE.Group();
  group.add(hungShields(-(z1 - z0) / 2, (z1 - z0) / 2, y, 0, count, radius));
  group.position.set(x, 0, (z0 + z1) / 2);
  group.rotation.y = Math.PI / 2;
  return group;
}

function spear(x: number, z: number, lean: number): THREE.Object3D {
  const group = new THREE.Group();
  const top = at(x + lean, BASE + SPEAR_LENGTH, z);
  group.add(rod(at(x, BASE, z), top, 0.008, COLORS.timber));
  group.add(rod(top, at(x + lean * 1.1, BASE + SPEAR_LENGTH + 0.07, z), 0.014, WARRIORS.bronze));
  return group;
}

export function spearRack(x: number, z: number, spears: number, turn = 0): THREE.Object3D {
  const group = new THREE.Group();
  const width = 0.1 + spears * 0.06;
  for (const side of [-1, 1]) group.add(box(0.035, 0.46, 0.035, flat(COLORS.timber), side * width / 2, BASE, 0));
  group.add(box(width + 0.04, 0.03, 0.04, flat(COLORS.timber), 0, BASE + 0.42, 0));
  group.add(box(width, 0.025, 0.07, flat(COLORS.timber), 0, BASE + 0.1, 0));
  for (let i = 0; i < spears; i++) group.add(spear(-width / 2 + 0.08 + i * 0.06, 0.03, -0.02));
  group.position.set(x, 0, z);
  group.rotation.y = turn;
  return group;
}

function crestedHelmet(x: number, y: number, z: number, turn = 0): THREE.Object3D {
  const group = new THREE.Group();
  group.add(sphere(0.06, flat(WARRIORS.bronze), 0, 0.04, 0));
  group.add(box(0.11, 0.06, 0.1, flat(WARRIORS.bronze), 0.012, -0.01, 0));
  group.add(box(0.02, 0.035, 0.03, flat(WARRIORS.black), 0.065, 0.015, 0));
  group.add(box(0.15, 0.06, 0.022, flat(WARRIORS.crest), -0.01, 0.1, 0));
  group.add(box(0.03, 0.05, 0.022, flat(WARRIORS.black), -0.01, 0.07, 0));
  group.position.set(x, y, z);
  group.rotation.y = turn;
  return group;
}

export function helmetStand(x: number, z: number, turn = 0): THREE.Object3D {
  const group = new THREE.Group();
  group.add(box(0.1, 0.04, 0.1, surface('rubble'), x, BASE, z));
  group.add(cylinder(0.014, 0.018, 0.3, flat(COLORS.timber), x, BASE + 0.04, z, 6));
  group.add(crestedHelmet(x, BASE + 0.36, z, turn));
  return group;
}

export function armorStand(x: number, z: number, turn = 0): THREE.Object3D {
  const group = new THREE.Group();
  group.add(box(0.14, 0.04, 0.14, surface('rubble'), 0, BASE, 0));
  group.add(cylinder(0.018, 0.022, 0.62, flat(COLORS.timber), 0, BASE + 0.04, 0, 6));
  group.add(box(0.03, 0.03, 0.3, flat(COLORS.timber), 0, BASE + 0.5, 0));
  group.add(cylinder(0.075, 0.06, 0.2, flat(WARRIORS.bronze), 0, BASE + 0.32, 0, 12));
  group.add(box(0.1, 0.05, 0.16, flat(WARRIORS.red), 0, BASE + 0.27, 0));
  group.add(crestedHelmet(0, BASE + 0.62, 0));
  const shield = hopliteShield(0.11);
  shield.rotation.y = Math.PI / 2;
  shield.position.set(0.04, BASE + 0.3, 0.17);
  group.add(shield);
  group.position.set(x, 0, z);
  group.rotation.y = turn;
  return group;
}

export function practicePost(x: number, z: number, turn = 0): THREE.Object3D {
  const group = new THREE.Group();
  group.add(cylinder(0.035, 0.04, 0.52, flat(COLORS.timber), 0, BASE, 0, 8));
  group.add(cylinder(0.07, 0.07, 0.22, flat(WARRIORS.straw), 0, BASE + 0.22, 0, 10));
  for (const y of [0.25, 0.4]) group.add(cylinder(0.073, 0.073, 0.02, flat(COLORS.timber), 0, BASE + y, 0, 10));
  group.add(box(0.04, 0.03, 0.34, flat(COLORS.timber), 0, BASE + 0.47, 0));
  group.position.set(x, 0, z);
  group.rotation.y = turn;
  return group;
}

export function stackedShields(x: number, z: number, count: number): THREE.Object3D {
  const group = new THREE.Group();
  for (let i = 0; i < count; i++) {
    const shield = hopliteShield(0.1, i % 2 ? WARRIORS.black : WARRIORS.red);
    shield.rotation.set(-0.35, 0, 0);
    shield.position.set(x + i * 0.05, BASE + 0.1, z - i * 0.02);
    group.add(shield);
  }
  return group;
}

export function framedDoor(x: number, front: number, base: number, ajar: number, frame = WARRIORS.red): THREE.Object3D {
  const group = new THREE.Group();
  const door = doorway(0.2, 0.32, ajar);
  door.position.set(x, base, front + 0.005);
  group.add(door);
  for (const side of [-1, 1]) group.add(box(0.03, 0.36, 0.02, flat(frame), x + side * 0.125, base, front + 0.01));
  group.add(box(0.28, 0.035, 0.02, flat(frame), x, base + 0.34, front + 0.01));
  return group;
}

const SPEAR_HAND = at(0.07, 0.0, 0.1);
const SHIELD_HAND = at(0.08, 0.03, -0.09);

export function hoplite(): FigureParts {
  const upper = torso(WARRIORS.tunic, [SPEAR_HAND, SHIELD_HAND]);
  upper.add(cylinder(0.062, 0.07, 0.15, flat(WARRIORS.bronze), 0, 0.03, 0, 10));
  upper.add(rod(at(0.07, -0.2, 0.1), at(0.07, 0.46, 0.1), 0.008, COLORS.timber));
  upper.add(rod(at(0.07, 0.46, 0.1), at(0.07, 0.52, 0.1), 0.013, WARRIORS.bronze));
  const shield = hopliteShield(0.11);
  shield.rotation.y = Math.PI / 2;
  shield.position.set(0.1, 0.02, -0.1);
  upper.add(shield);
  return { legs: legs(), torso: upper, head: head('helmet') };
}

function snakeCoil(height: number, radius: number, turns: number): THREE.Mesh {
  const points: THREE.Vector3[] = [];
  const steps = turns * 16;
  for (let i = 0; i <= steps; i++) {
    const a = (i / 16) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(a) * radius, (height * i) / steps, Math.sin(a) * radius));
  }
  return new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), steps, radius * 0.45, 6), flat(HEALING.snake));
}

export function asclepiusStaff(x: number, z: number, height: number): THREE.Object3D {
  const group = new THREE.Group();
  group.add(box(0.2, 0.08, 0.2, surface('whitewash'), 0, BASE, 0));
  group.add(box(0.16, 0.04, 0.16, flat(0xe8e2d4), 0, BASE + 0.08, 0));
  const foot = BASE + 0.12;
  group.add(cylinder(0.016, 0.02, height, flat(HEALING.staff), 0, foot, 0, 8));
  const coil = snakeCoil(height * 0.7, 0.032, 3);
  coil.position.y = foot + height * 0.15;
  group.add(coil);
  group.add(sphere(0.03, flat(HEALING.snake), 0.03, foot + height * 0.88, 0));
  group.position.set(x, 0, z);
  return group;
}

export function herbBed(x0: number, z0: number, w: number, d: number): THREE.Object3D {
  const group = new THREE.Group();
  group.add(box(w, 0.05, d, surface('rubble'), x0 + w / 2, BASE, z0 + d / 2));
  group.add(box(w - 0.05, 0.012, d - 0.05, flat(HEALING.soil), x0 + w / 2, BASE + 0.05, z0 + d / 2));
  const rows = Math.max(1, Math.floor((d - 0.04) / 0.12));
  const per = Math.max(1, Math.floor((w - 0.04) / 0.1));
  for (let r = 0; r < rows; r++) {
    for (let p = 0; p < per; p++) {
      const x = x0 + 0.06 + p * ((w - 0.12) / Math.max(1, per - 1));
      const z = z0 + 0.06 + r * ((d - 0.12) / Math.max(1, rows - 1));
      const colour = HEALING.herbs[(r + p) % HEALING.herbs.length];
      group.add(sphere(0.032, flat(colour), x, BASE + 0.08, z));
      if ((r * 3 + p) % 4 === 0) group.add(sphere(0.016, flat(r % 2 ? HEALING.lavender : HEALING.chamomile), x, BASE + 0.115, z));
    }
  }
  return group;
}

export function sickbed(x: number, z: number, turn: number, occupied: boolean): THREE.Object3D {
  const group = new THREE.Group();
  for (const dx of [-0.13, 0.13]) for (const dz of [-0.05, 0.05]) group.add(box(0.02, 0.08, 0.02, flat(COLORS.timber), dx, BASE, dz));
  group.add(box(0.3, 0.025, 0.13, flat(COLORS.timber), 0, BASE + 0.08, 0));
  group.add(box(0.06, 0.04, 0.11, flat(COLORS.whitewash), -0.11, BASE + 0.105, 0));
  if (occupied) {
    group.add(box(0.2, 0.035, 0.12, flat(HEALING.blanket), 0.03, BASE + 0.105, 0));
    group.add(sphere(0.03, flat(FIGURE.skin), -0.1, BASE + 0.15, 0));
  } else group.add(box(0.08, 0.02, 0.12, flat(HEALING.blanket), 0.1, BASE + 0.105, 0));
  group.position.set(x, 0, z);
  group.rotation.y = turn;
  return group;
}

export function herbBasket(x: number, y: number, z: number): THREE.Object3D {
  const group = new THREE.Group();
  group.add(cylinder(0.05, 0.04, 0.04, flat(0xb08a4a), x, y, z, 10));
  group.add(sphere(0.035, flat(HEALING.herbs[1]), x, y + 0.045, z));
  group.add(sphere(0.015, flat(HEALING.lavender), x + 0.02, y + 0.07, z));
  return group;
}

export function healer(): FigureParts {
  const upper = torso(HEALING.robe, [at(0.08, 0.0, 0.08), at(0.06, -0.04, -0.08)]);
  upper.add(cylinder(0.08, 0.1, 0.2, flat(HEALING.robe), 0, -0.2, 0, 12));
  upper.add(box(0.03, 0.26, 0.15, flat(HEALING.sash), -0.02, -0.12, 0.0));
  upper.add(herbBasket(0.1, -0.06, 0.09));
  upper.add(rod(at(0.07, -0.2, -0.08), at(0.07, 0.3, -0.08), 0.008, HEALING.staff));
  return { legs: legs(), torso: upper, head: head('bare') };
}

const MERLON = 0.12;

export function merlons(x0: number, z0: number, w: number, d: number, y: number): THREE.Object3D {
  const group = new THREE.Group();
  const walls = surface('whitewash');
  for (let t = MERLON / 2; t < w; t += MERLON * 2) for (const z of [z0 + 0.03, z0 + d - 0.03]) group.add(box(MERLON, MERLON, 0.06, walls, x0 + t, y, z));
  for (let t = MERLON * 2.5; t < d - MERLON; t += MERLON * 2) for (const x of [x0 + 0.03, x0 + w - 0.03]) group.add(box(0.06, MERLON, MERLON, walls, x, y, z0 + t));
  return group;
}

export function pennant(x: number, y: number, z: number, height: number): THREE.Object3D {
  const group = new THREE.Group();
  group.add(cylinder(0.012, 0.014, height, flat(COLORS.timber), x, y, z, 6));
  group.add(box(0.26, 0.13, 0.012, flat(WARRIORS.red), x + 0.13, y + height - 0.16, z));
  group.add(sphere(0.022, flat(WARRIORS.bronze), x, y + height, z));
  return group;
}

export function plainWall(x0: number, z0: number, x1: number, z1: number, height: number): THREE.Object3D {
  const group = new THREE.Group();
  const alongX = Math.abs(x1 - x0) > Math.abs(z1 - z0);
  const [w, d] = alongX ? [x1 - x0, 0.1] : [0.1, z1 - z0];
  group.add(box(w, height, d, surface('whitewash'), (x0 + x1) / 2, BASE, (z0 + z1) / 2));
  group.add(box(w + 0.01, 0.03, d + 0.01, flat(WARRIORS.red), (x0 + x1) / 2, BASE + height - 0.07, (z0 + z1) / 2));
  return group;
}

export function sandYard(x0: number, z0: number, w: number, d: number): THREE.Mesh {
  return box(w, 0.016, d, flat(PALETTE.sand), x0 + w / 2, BASE, z0 + d / 2);
}

export function marketShield(x: number, y: number, z: number, radius: number, turn = 0): THREE.Object3D {
  const shield = hopliteShield(radius);
  shield.position.set(x, y + radius, z);
  shield.rotation.y = turn;
  return shield;
}

export function storedArmor(): THREE.Object3D {
  const group = new THREE.Group();
  group.add(box(0.22, 0.03, 0.2, flat(COLORS.timber), 0, 0, 0));
  group.add(stackedShields(-0.05, 0.02, 3));
  group.add(crestedHelmet(0.06, BASE + 0.06, -0.04));
  return group;
}

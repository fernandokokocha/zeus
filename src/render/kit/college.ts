import * as THREE from 'three';
import { PALETTE } from '../palette';
import { type FigureParts, FIGURE, HIP, SHOULDER, at, head, legs, rod } from './figure';
import { COLORS, box, cone, cylinder, flat, sphere, surface } from './kit';
import { PALACE, marbleColumn } from './palace';

export const COLLEGE = {
  robe: PALETTE.philosopherRobe,
  beard: PALETTE.beard,
  scroll: PALETTE.scroll,
  scrollEnd: 0xb89a62,
  shelf: 0x5a3d24,
  bronze: PALETTE.bronze,
  studentTunic: 0xf2efe6,
  mantle: COLORS.aegean,
  owl: 0x8a7a64,
  hourLine: 0x4a4038,
};

const BASE = 0.03;
const SCROLL_RADIUS = 0.022;
const SCROLL_LENGTH = 0.12;
const SEAT = 0.13;

export function lyingScroll(x: number, y: number, z: number, turn: number): THREE.Object3D {
  const group = new THREE.Group();
  const roll = cylinder(SCROLL_RADIUS, SCROLL_RADIUS, SCROLL_LENGTH, flat(COLLEGE.scroll), 0, -SCROLL_LENGTH / 2, 0, 8);
  roll.rotation.z = Math.PI / 2;
  group.add(roll);
  group.position.set(x, y + SCROLL_RADIUS, z);
  group.rotation.y = turn;
  return group;
}

export function openScroll(x: number, y: number, z: number, turn: number, width = 0.16): THREE.Object3D {
  const group = new THREE.Group();
  group.add(box(width, 0.008, 0.09, flat(COLLEGE.scroll), 0, 0, 0));
  for (const side of [-1, 1]) {
    const roll = cylinder(0.016, 0.016, 0.1, flat(COLLEGE.scroll), 0, -0.05, 0, 8);
    roll.rotation.x = Math.PI / 2;
    roll.position.set(side * width / 2, 0.016, 0);
    group.add(roll);
  }
  for (let i = 0; i < 3; i++) group.add(box(width * 0.6, 0.004, 0.006, flat(COLLEGE.hourLine), 0, 0.008, -0.025 + i * 0.025));
  group.position.set(x, y, z);
  group.rotation.y = turn;
  return group;
}

export function scrollBucket(x: number, z: number, lidded: boolean): THREE.Object3D {
  const group = new THREE.Group();
  group.add(cylinder(0.06, 0.055, 0.12, flat(COLORS.timber), x, BASE, z, 12));
  group.add(cylinder(0.062, 0.062, 0.02, flat(COLORS.aegean), x, BASE + 0.09, z, 12));
  if (lidded) group.add(cylinder(0.066, 0.066, 0.025, flat(COLORS.timber), x, BASE + 0.12, z, 12));
  else for (const [dx, dz] of [[-0.02, -0.02], [0.02, 0], [-0.01, 0.025]]) group.add(cylinder(SCROLL_RADIUS * 0.9, SCROLL_RADIUS * 0.9, 0.08, flat(COLLEGE.scroll), x + dx, BASE + 0.1, z + dz, 8));
  return group;
}

export function sundial(x: number, z: number, base = BASE): THREE.Object3D {
  const group = new THREE.Group();
  const marble = flat(PALACE.marble);
  group.add(box(0.2, 0.04, 0.2, surface('rubble'), x, base, z));
  group.add(cylinder(0.06, 0.07, 0.26, marble, x, base + 0.04, z, 12));
  const top = base + 0.3;
  group.add(cylinder(0.14, 0.11, 0.04, marble, x, top, z, 20));
  for (let i = 0; i < 7; i++) {
    const angle = Math.PI * (i / 6);
    const line = box(0.1, 0.006, 0.008, flat(COLLEGE.hourLine), x - Math.cos(angle) * 0.06, top + 0.04, z + Math.sin(angle) * 0.06);
    line.rotation.y = angle;
    group.add(line);
  }
  const gnomon = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(0.12, 0), new THREE.Vector2(0, 0.1)]);
  const blade = new THREE.Mesh(new THREE.ExtrudeGeometry(gnomon, { depth: 0.012, bevelEnabled: false }), flat(COLLEGE.bronze));
  blade.position.set(x - 0.06, top + 0.04, z - 0.006);
  group.add(blade);
  return group;
}

export function lectern(x: number, z: number, turn: number, withScroll: boolean): THREE.Object3D {
  const group = new THREE.Group();
  group.add(box(0.12, 0.03, 0.12, flat(PALACE.marble), 0, BASE, 0));
  group.add(box(0.04, 0.3, 0.04, flat(COLORS.timber), 0, BASE + 0.03, 0));
  const desk = new THREE.Group();
  desk.add(box(0.14, 0.015, 0.18, flat(COLORS.timber), 0, 0, 0));
  if (withScroll) desk.add(openScroll(0, 0.015, 0, Math.PI / 2, 0.14));
  desk.position.set(0, BASE + 0.33, 0);
  desk.rotation.z = 0.45;
  group.add(desk);
  group.position.set(x, 0, z);
  group.rotation.y = turn;
  return group;
}

export function writingDesk(x: number, z: number, w: number, withWork: boolean): THREE.Object3D {
  const group = new THREE.Group();
  const marble = flat(PALACE.marble);
  for (const dx of [-w / 2 + 0.04, w / 2 - 0.04]) group.add(box(0.04, 0.14, 0.12, marble, x + dx, BASE, z));
  group.add(box(w, 0.025, 0.16, flat(COLORS.timber), x, BASE + 0.14, z));
  if (withWork) {
    group.add(openScroll(x - w / 4, BASE + 0.165, z, 0, 0.12));
    group.add(box(0.07, 0.012, 0.09, flat(COLORS.dark), x + w / 4, BASE + 0.165, z));
  }
  return group;
}

export function stool(x: number, z: number): THREE.Mesh {
  return cylinder(0.05, 0.045, SEAT - BASE, flat(COLORS.timber), x, BASE, z, 8);
}

export function seatedStudent(x: number, z: number, turn: number, mantle: number, seat = SEAT): THREE.Object3D {
  const group = new THREE.Group();
  const skin = flat(FIGURE.skin);
  for (const side of [-1, 1]) {
    group.add(rod(at(0, 0.015, side * 0.035), at(0.09, 0.015, side * 0.035), 0.022, COLLEGE.studentTunic));
    group.add(rod(at(0.09, 0.015, side * 0.035), at(0.1, -seat + BASE + 0.01, side * 0.035), 0.017, FIGURE.skin));
  }
  group.add(cylinder(0.05, 0.07, 0.2, flat(COLLEGE.studentTunic), 0, 0, 0, 10));
  const sash = box(0.03, 0.2, 0.15, flat(mantle), -0.03, 0.0, 0);
  sash.rotation.z = 0.25;
  group.add(sash);
  for (const side of [-1, 1]) group.add(rod(at(0, 0.17, side * 0.065), at(0.1, 0.07, side * 0.03), 0.016, FIGURE.skin));
  group.add(openScroll(0.11, 0.07, 0, Math.PI / 2, 0.1));
  group.add(sphere(0.05, skin, 0.01, 0.26, 0));
  group.add(sphere(0.046, flat(FIGURE.hair), -0.002, 0.27, 0));
  group.position.set(x, seat, z);
  group.rotation.y = turn;
  return group;
}

function philosopherTorso(): THREE.Group {
  const group = new THREE.Group();
  group.add(cylinder(0.06, 0.1, HIP + 0.19, flat(COLLEGE.robe), 0, -HIP + 0.01, 0, 12));
  const himation = box(0.13, 0.32, 0.03, flat(COLORS.aegean), -0.01, -0.12, 0.05);
  himation.rotation.x = -0.15;
  group.add(himation);
  const fold = box(0.04, 0.3, 0.16, flat(COLORS.aegean), -0.035, -0.1, 0.0);
  fold.rotation.z = 0.35;
  group.add(fold);
  group.add(rod(at(0, SHOULDER, -0.065), at(0.06, 0.04, -0.08), 0.017, FIGURE.skin));
  group.add(lyingScroll(0.07, 0.03, -0.08, Math.PI / 2));
  return group;
}

function bearded(): THREE.Group {
  const group = head('bare');
  group.add(sphere(0.046, flat(COLLEGE.beard), -0.012, 0.01, 0));
  const beard = sphere(0.04, flat(COLLEGE.beard), 0.03, -0.035, 0);
  beard.scale.set(0.8, 1.2, 1);
  group.add(beard);
  return group;
}

function pointingArm(): THREE.Group {
  const group = new THREE.Group();
  group.add(rod(at(0, 0, 0), at(0.15, -0.04, 0.02), 0.017, FIGURE.skin));
  return group;
}

export function philosopher(): FigureParts {
  return { legs: legs(), torso: philosopherTorso(), head: bearded(), arm: pointingArm() };
}

export function tholos(x: number, z: number, radius: number, columns: number, height: number, open: boolean): THREE.Object3D {
  const group = new THREE.Group();
  const marble = flat(PALACE.marble);
  const steps = [radius + 0.14, radius + 0.07];
  steps.forEach((r, i) => group.add(cylinder(r, r, 0.06, i === 0 ? surface('rubble') : marble, x, BASE + i * 0.06, z, 32)));
  const floor = BASE + steps.length * 0.06;
  for (let i = 0; i < columns; i++) {
    const angle = (Math.PI * 2 * i) / columns;
    group.add(marbleColumn(x + Math.cos(angle) * radius, z + Math.sin(angle) * radius, height, floor));
  }
  const cella = radius * 0.62;
  group.add(cylinder(cella, cella, height, surface('whitewash'), x, floor, z, 24));
  const eaves = floor + height;
  group.add(cylinder(radius + 0.1, radius + 0.1, 0.07, surface('whitewash'), x, eaves, z, 32));
  group.add(cylinder(radius + 0.11, radius + 0.11, 0.05, flat(COLORS.aegean), x, eaves + 0.07, z, 32));
  group.add(cone(radius + 0.16, radius * 0.75, surface('tiles'), x, eaves + 0.12, z, 24));
  group.add(sphere(0.05, flat(PALACE.gold), x, eaves + 0.12 + radius * 0.75, z));
  const door = new THREE.Group();
  door.add(box(0.22, 0.36, 0.04, flat(COLORS.dark), 0, 0, 0));
  const leaf = box(0.2, 0.34, 0.02, flat(COLORS.aegean), open ? -0.1 : 0, 0, open ? 0.1 : 0.025);
  if (open) leaf.rotation.y = Math.PI / 2;
  door.add(leaf);
  door.add(box(0.3, 0.04, 0.05, flat(COLORS.deepAegean), 0, 0.36, 0.01));
  door.position.set(x, floor, z + cella);
  group.add(door);
  return group;
}

import * as THREE from 'three';
import { FIGURE, type FigureParts, at, head, legs, rod, torso } from './figure';
import { COLORS, box, cylinder, flat, surface } from './kit';
import { tiledRoof } from './roofs';

export const GUILD = {
  tunic: 0x2f6fb3,
  column: 0xf4f2ee,
  red: 0xb5442e,
  ochre: 0xd8a030,
  plank: 0xa07a4a,
  parchment: 0xefe6cc,
  ink: 0x3a3a48,
};

const BASE = 0.03;
const TABLE_TOP = 0.24;

function scroll(length: number, x: number, y: number, z: number, turn: number): THREE.Object3D {
  const group = new THREE.Group();
  const roll = cylinder(0.016, 0.016, length, flat(GUILD.parchment), 0, -length / 2, 0, 8);
  roll.rotation.z = Math.PI / 2;
  group.add(roll);
  group.position.set(x, y + 0.016, z);
  group.rotation.y = turn;
  return group;
}

export function architect(): FigureParts {
  const hold = at(0.07, 0.0, -0.085);
  const upper = torso(GUILD.tunic, [hold]);
  upper.add(scroll(0.12, hold.x, hold.y - 0.016, hold.z, Math.PI / 2));
  const arm = new THREE.Group();
  arm.add(rod(at(0, 0, 0), at(0.06, -0.13, 0.02), 0.017, FIGURE.skin));
  return { legs: legs(), torso: upper, head: head('bare'), arm };
}

export function guildColumn(x: number, z: number, y: number, height: number, radius: number): THREE.Object3D {
  const group = new THREE.Group();
  group.add(cylinder(radius * 0.85, radius, height, flat(GUILD.column), x, y, z, 12));
  group.add(box(radius * 2.6, 0.045, radius * 2.6, flat(COLORS.aegean), x, y + height, z));
  group.add(box(radius * 2.4, 0.03, radius * 2.4, flat(GUILD.column), x, y, z));
  return group;
}

export function pediment(width: number, rise: number): THREE.Object3D {
  const group = new THREE.Group();
  const half = width / 2;
  const triangle = (w: number, h: number) => new THREE.Shape([new THREE.Vector2(-w, 0), new THREE.Vector2(w, 0), new THREE.Vector2(0, h)]);
  group.add(new THREE.Mesh(new THREE.ExtrudeGeometry(triangle(half, rise), { depth: 0.04, bevelEnabled: false }), flat(GUILD.column)));
  const field = new THREE.Mesh(new THREE.ShapeGeometry(triangle(half * 0.78, rise * 0.72)), flat(COLORS.aegean));
  field.position.set(0, rise * 0.1, 0.042);
  group.add(field);
  for (const dx of [-0.32, 0, 0.32]) {
    const figure = box(0.035, rise * 0.4, 0.004, flat(GUILD.red), dx * half, rise * 0.12, 0.044);
    figure.scale.y = 1 - Math.abs(dx);
    group.add(figure);
  }
  group.add(box(width + 0.04, 0.035, 0.05, flat(GUILD.ochre), 0, -0.035, 0.02));
  return group;
}

export function planTable(x: number, z: number, turn: number, w = 0.42, d = 0.28): THREE.Object3D {
  const group = new THREE.Group();
  for (const dx of [-1, 1]) for (const dz of [-1, 1]) group.add(box(0.025, TABLE_TOP - BASE, 0.025, flat(COLORS.timber), dx * (w / 2 - 0.03), BASE, dz * (d / 2 - 0.03)));
  group.add(box(w, 0.025, d, flat(GUILD.plank), 0, TABLE_TOP, 0));
  const sheetTop = TABLE_TOP + 0.03;
  group.add(box(w * 0.8, 0.004, d * 0.8, flat(GUILD.parchment), 0, TABLE_TOP + 0.025, 0));
  const [pw, pd] = [w * 0.5, d * 0.45];
  for (const dz of [-pd / 2, pd / 2]) group.add(box(pw, 0.003, 0.012, flat(COLORS.aegean), 0, sheetTop, dz));
  for (const dx of [-pw / 2, pw / 2]) group.add(box(0.012, 0.003, pd, flat(COLORS.aegean), dx, sheetTop, 0));
  for (let i = 1; i < 4; i++) group.add(box(0.014, 0.003, 0.014, flat(GUILD.ink), -pw / 2 + (i * pw) / 4, sheetTop, -pd / 2 + 0.03));
  group.add(scroll(d * 0.8, w * 0.42, TABLE_TOP + 0.025, 0, Math.PI / 2));
  group.position.set(x, 0, z);
  group.rotation.y = turn;
  return group;
}

export function templeModel(x: number, z: number, w: number, d: number, plinth: number): THREE.Object3D {
  const group = new THREE.Group();
  group.add(box(w + 0.1, plinth - BASE, d + 0.1, surface('ashlar'), x, BASE, z));
  group.add(box(w, 0.03, d, flat(GUILD.column), x, plinth, z));
  const base = plinth + 0.03;
  const height = d * 0.55;
  const radius = 0.012;
  const across = 4;
  const along = 6;
  for (let i = 0; i < along; i++) {
    for (const side of [-1, 1]) group.add(cylinder(radius, radius, height, flat(GUILD.column), x - w / 2 + 0.03 + (i * (w - 0.06)) / (along - 1), base, z + side * (d / 2 - 0.03), 6));
  }
  for (let i = 1; i < across - 1; i++) {
    for (const side of [-1, 1]) group.add(cylinder(radius, radius, height, flat(GUILD.column), x + side * (w / 2 - 0.03), base, z - d / 2 + 0.03 + (i * (d - 0.06)) / (across - 1), 6));
  }
  group.add(box(w, 0.025, d, flat(COLORS.aegean), x, base + height, z));
  group.add(tiledRoof(x - w / 2, z - d / 2, w, d, base + height + 0.025, d * 0.28));
  return group;
}


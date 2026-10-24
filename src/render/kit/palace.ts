import * as THREE from 'three';
import { COLORS, box, cone, cylinder, flat, scaled, sphere, surface } from './kit';
import { tiledRoofAlongZ } from './roofs';

export const PALACE = {
  marble: 0xf4f1ea,
  gold: 0xe0b03a,
  bronze: 0xb07a3a,
  ground: 0xd9d2c3,
};

const COLUMN_RADIUS = 0.07;

export function palaceGround(w: number, d: number): THREE.Mesh {
  return box(w - 0.12, 0.03, d - 0.12, flat(PALACE.ground), w / 2, 0, d / 2);
}

export function marbleColumn(x: number, z: number, height: number, base: number): THREE.Object3D {
  const group = new THREE.Group();
  const marble = flat(PALACE.marble);
  group.add(box(0.19, 0.05, 0.19, marble, x, base, z));
  group.add(cylinder(COLUMN_RADIUS * 0.85, COLUMN_RADIUS, height - 0.11, marble, x, base + 0.05, z, 10));
  group.add(box(0.19, 0.06, 0.19, marble, x, base + height - 0.06, z));
  return group;
}

export function evenly(from: number, to: number, count: number): number[] {
  return Array.from({ length: count }, (_, i) => from + ((to - from) * i) / (count - 1));
}

export function entablature(x0: number, z0: number, w: number, d: number, y: number): THREE.Object3D {
  const group = new THREE.Group();
  group.add(box(w, 0.1, d, surface('whitewash'), x0 + w / 2, y, z0 + d / 2));
  group.add(box(w + 0.02, 0.05, d + 0.02, flat(COLORS.aegean), x0 + w / 2, y + 0.1, z0 + d / 2));
  group.add(box(w + 0.06, 0.05, d + 0.06, surface('whitewash'), x0 + w / 2, y + 0.15, z0 + d / 2));
  return group;
}

export const ENTABLATURE_HEIGHT = 0.2;

export const polishedGold = new THREE.MeshPhongMaterial({ color: 0xf5c542, emissive: 0x6b4500, specular: 0xfff4c0, shininess: 80 });
const glint = new THREE.MeshBasicMaterial({ color: 0xfffbe6 });
const MAX_MEDALLION_RADIUS = 0.22;

export function sparkle(x: number, y: number, z: number, size: number): THREE.Mesh {
  const star = new THREE.Mesh(new THREE.OctahedronGeometry(size), glint);
  star.position.set(x, y, z);
  star.scale.set(0.5, 1.6, 0.5);
  return star;
}

export function medallion(x: number, y: number, z: number, radius: number): THREE.Object3D {
  const group = new THREE.Group();
  const face = cylinder(radius * 0.92, radius * 0.92, radius * 0.18, polishedGold, 0, 0, 0, 24);
  const boss = cylinder(radius * 0.5, radius * 0.55, radius * 0.34, polishedGold, 0, 0, 0, 18);
  for (const disc of [face, boss]) {
    disc.rotation.x = Math.PI / 2;
    disc.position.set(x, y, z);
    group.add(disc);
  }
  const rim = new THREE.Mesh(new THREE.TorusGeometry(radius, radius * 0.13, 8, 28), polishedGold);
  rim.position.set(x, y, z + radius * 0.05);
  group.add(rim);
  group.add(scaled(sphere(radius * 0.22, polishedGold, x, y, z + radius * 0.3), 1, 1, 0.6));
  group.add(sparkle(x - radius * 0.6, y + radius * 0.6, z + radius * 0.2, radius * 0.18));
  group.add(sparkle(x + radius * 0.35, y - radius * 0.15, z + radius * 0.3, radius * 0.12));
  return group;
}

export function tympanum(x: number, front: number, span: number, rise: number, eaves: number): THREE.Object3D {
  const group = new THREE.Group();
  const half = span / 2 - 0.12;
  const shape = new THREE.Shape([new THREE.Vector2(-half, 0), new THREE.Vector2(half, 0), new THREE.Vector2(0, rise * (half / (span / 2)))]);
  const panel = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.02, bevelEnabled: false }), flat(COLORS.aegean));
  panel.position.set(x, eaves + 0.05, front);
  group.add(panel);
  const radius = Math.min(MAX_MEDALLION_RADIUS, rise * 0.38);
  group.add(medallion(x, eaves + 0.03 + radius * 0.95, front + 0.03, radius));
  return group;
}

export function acroterion(x: number, y: number, z: number): THREE.Object3D {
  const group = new THREE.Group();
  group.add(cone(0.06, 0.16, flat(PALACE.gold), x, y, z, 8));
  group.add(sphere(0.035, flat(PALACE.gold), x, y + 0.17, z));
  return group;
}

export function marbleStairs(x: number, back: number, width: number, count: number, rise: number, run: number, base = 0.03): THREE.Object3D {
  const group = new THREE.Group();
  const marble = flat(PALACE.marble);
  for (let i = 0; i < count; i++) {
    const depth = run * (count - i);
    group.add(box(width, rise * (i + 1), depth, marble, x, base, back + depth / 2));
  }
  return group;
}

export function palaceDoor(x: number, front: number, base: number, width: number, height: number): THREE.Object3D {
  const group = new THREE.Group();
  group.add(box(width, height, 0.02, flat(COLORS.dark), x, base, front + 0.005));
  for (const side of [-1, 1]) {
    group.add(box(width * 0.42, height * 0.92, 0.02, flat(COLORS.aegean), x + side * width * 0.24, base, front + 0.015));
    group.add(box(0.05, height + 0.05, 0.03, flat(COLORS.deepAegean), x + side * (width / 2 + 0.025), base, front + 0.015));
  }
  group.add(box(width + 0.16, 0.06, 0.03, flat(COLORS.deepAegean), x, base + height + 0.02, front + 0.015));
  return group;
}

export function marbleTerrace(x0: number, z0: number, w: number, d: number, top: number): THREE.Object3D {
  const group = new THREE.Group();
  group.add(box(w, top - 0.06, d, surface('rubble'), x0 + w / 2, 0.03, z0 + d / 2));
  group.add(box(w + 0.06, 0.05, d + 0.06, surface('whitewash'), x0 + w / 2, top - 0.05, z0 + d / 2));
  group.add(box(w - 0.04, 0.01, d - 0.04, flat(PALACE.ground), x0 + w / 2, top, z0 + d / 2));
  return group;
}

export function pedimentRoof(group: THREE.Group, x0: number, z0: number, w: number, d: number, eaves: number, rise: number): void {
  group.add(tiledRoofAlongZ(x0, z0, w, d, eaves, rise));
  group.add(tympanum(x0 + w / 2, z0 + d + 0.005, w, rise, eaves));
  for (const z of [z0, z0 + d]) group.add(acroterion(x0 + w / 2, eaves + rise, z));
  for (const x of [x0 + 0.05, x0 + w - 0.05]) group.add(acroterion(x, eaves, z0 + d));
}

const PAINT = { red: 0xa83a2a, cream: 0xefe4cc };

export function megaronColumn(x: number, z: number, height: number, base: number): THREE.Object3D {
  const group = new THREE.Group();
  const lower = height * 0.35;
  group.add(box(0.24, 0.06, 0.24, flat(PALACE.marble), x, base, z));
  group.add(cylinder(0.095, 0.1, lower, flat(PAINT.cream), x, base + 0.06, z, 12));
  group.add(cylinder(0.11, 0.095, height - lower - 0.18, flat(PAINT.red), x, base + 0.06 + lower, z, 12));
  group.add(cylinder(0.15, 0.11, 0.06, flat(PAINT.cream), x, base + height - 0.12, z, 12));
  group.add(box(0.3, 0.06, 0.3, flat(PAINT.cream), x, base + height - 0.06, z));
  return group;
}

export function paintedFrieze(x0: number, x1: number, y: number, z: number): THREE.Object3D {
  const group = new THREE.Group();
  group.add(box(x1 - x0, 0.16, 0.14, flat(PAINT.cream), (x0 + x1) / 2, y, z));
  const colors = [COLORS.aegean, PAINT.red];
  for (let x = x0 + 0.15, i = 0; x < x1 - 0.1; x += 0.22, i++) group.add(box(0.12, 0.08, 0.02, flat(colors[i % 2]), x, y + 0.04, z + 0.07));
  return group;
}

export function throne(x: number, z: number, y: number): THREE.Object3D {
  const group = new THREE.Group();
  const gold = flat(PALACE.gold);
  group.add(box(0.36, 0.06, 0.12, flat(PAINT.red), x, y, z + 0.18));
  group.add(box(0.24, 0.16, 0.2, gold, x, y, z));
  group.add(box(0.26, 0.42, 0.05, gold, x, y, z - 0.1));
  group.add(sphere(0.035, gold, x, y + 0.45, z - 0.1));
  return group;
}

const MERLON = 0.18;

export function crenellatedWall(x0: number, z0: number, x1: number, z1: number, height: number): THREE.Object3D {
  const group = new THREE.Group();
  const ashlar = surface('ashlar');
  const thick = 0.24;
  const alongX = Math.abs(x1 - x0) > Math.abs(z1 - z0);
  const length = alongX ? x1 - x0 : z1 - z0;
  const [cx, cz] = [(x0 + x1) / 2, (z0 + z1) / 2];
  group.add(box(alongX ? length : thick, height, alongX ? thick : length, ashlar, cx, 0.03, cz));
  for (let t = MERLON / 2; t < length; t += MERLON * 2) {
    const [mx, mz] = alongX ? [x0 + t, cz] : [cx, z0 + t];
    group.add(box(MERLON, MERLON, MERLON, ashlar, mx, 0.03 + height, mz));
  }
  return group;
}

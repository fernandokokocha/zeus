import * as THREE from 'three';
import { terraceBlock } from './cottage';
import { COLORS, box, cone, cylinder, flat, sphere, surface } from './kit';
import { hipRoof, tiledRoofAlongZ } from './roofs';

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

export function colonnade(spots: [number, number][], height: number, base: number): THREE.Object3D {
  const group = new THREE.Group();
  for (const [x, z] of spots) group.add(marbleColumn(x, z, height, base));
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

export function tympanum(x: number, front: number, span: number, rise: number, eaves: number): THREE.Object3D {
  const group = new THREE.Group();
  const half = span / 2 - 0.12;
  const shape = new THREE.Shape([new THREE.Vector2(-half, 0), new THREE.Vector2(half, 0), new THREE.Vector2(0, rise * (half / (span / 2)))]);
  const panel = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.02, bevelEnabled: false }), flat(COLORS.aegean));
  panel.position.set(x, eaves + 0.05, front);
  group.add(panel);
  const disc = cylinder(0.09, 0.09, 0.02, flat(PALACE.gold), 0, 0, 0, 14);
  disc.rotation.x = Math.PI / 2;
  disc.position.set(x, eaves + 0.05 + rise * 0.3, front + 0.03);
  group.add(disc);
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

export function raised<T extends THREE.Object3D>(object: T, height: number): T {
  object.position.y += height;
  return object;
}

export function banner(x: number, top: number, z: number, length: number, facingX = false): THREE.Object3D {
  const group = new THREE.Group();
  const [w, d] = facingX ? [0.02, 0.22] : [0.22, 0.02];
  group.add(box(w, length, d, flat(COLORS.aegean), x, top - length, z));
  group.add(box(facingX ? 0.025 : 0.22, 0.06, facingX ? 0.22 : 0.025, flat(PALACE.gold), x, top - length - 0.02, z));
  group.add(box(facingX ? 0.03 : 0.28, 0.025, facingX ? 0.28 : 0.03, flat(PALACE.gold), x, top, z));
  return group;
}

export function bannerPole(x: number, z: number, height: number): THREE.Object3D {
  const group = new THREE.Group();
  group.add(box(0.12, 0.08, 0.12, flat(PALACE.marble), x, 0.03, z));
  group.add(cylinder(0.018, 0.022, height, flat(COLORS.timber), x, 0.11, z, 6));
  group.add(sphere(0.04, flat(PALACE.gold), x, 0.13 + height, z));
  group.add(banner(x + 0.13, height - 0.04, z, height * 0.55));
  return group;
}

export function goldTripod(x: number, z: number, y = 0.03): THREE.Object3D {
  const group = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const leg = cylinder(0.012, 0.012, 0.24, flat(PALACE.bronze), x + Math.cos(a) * 0.06, y, z + Math.sin(a) * 0.06, 5);
    leg.rotation.set(Math.sin(a) * 0.25, 0, -Math.cos(a) * 0.25);
    group.add(leg);
  }
  group.add(cylinder(0.11, 0.06, 0.1, flat(PALACE.gold), x, y + 0.22, z, 14));
  group.add(cylinder(0.08, 0.08, 0.01, flat(COLORS.ember), x, y + 0.31, z, 12));
  return group;
}

export function pedestalStatue(x: number, z: number, scale = 1): THREE.Object3D {
  const group = new THREE.Group();
  const marble = flat(PALACE.marble);
  const gold = flat(PALACE.gold);
  group.add(box(0.26 * scale, 0.28 * scale, 0.26 * scale, marble, x, 0.03, z));
  const top = 0.03 + 0.28 * scale;
  group.add(cylinder(0.05 * scale, 0.07 * scale, 0.3 * scale, gold, x, top, z, 8));
  group.add(sphere(0.045 * scale, gold, x, top + 0.36 * scale, z));
  group.add(box(0.02 * scale, 0.2 * scale, 0.02 * scale, gold, x + 0.07 * scale, top + 0.25 * scale, z).rotateZ(-0.5));
  group.add(cylinder(0.006 * scale, 0.006 * scale, 0.5 * scale, gold, x - 0.08 * scale, top, z, 4));
  return group;
}

export function hedge(x0: number, z0: number, w: number, d: number): THREE.Mesh {
  return box(w, 0.16, d, flat(0x4e7330), x0 + w / 2, 0.03, z0 + d / 2);
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

export function wing(group: THREE.Group, x0: number, z0: number, w: number, d: number, top: number): void {
  group.add(terraceBlock(x0, z0, w, d, top));
  group.add(hipRoof(x0, z0, w, d, top + 0.03, 0.35, 'tiles'));
}

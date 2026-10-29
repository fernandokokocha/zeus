import * as THREE from 'three';
import { tileHash } from '../palette';
import { openScroll } from './college';
import { type FigureParts, FIGURE, at, head, legs, rod, torso } from './figure';
import { COLORS, box, cylinder, flat, scaled, sphere, surface } from './kit';
import { PALACE } from './palace';
import { SCROLLS } from './scrolls';

export const LIBRARY = {
  purple: 0x6e4a86,
  ochre: 0xc9923e,
  shelf: 0x5a3d24,
  chiton: 0xf4f1ea,
  ink: 0x1c1a24,
  sky: 0x6fa3d6,
  linen: 0xe6d6ae,
};

const BASE = 0.03;
const CELL = 0.1;
const SHELF_DEPTH = 0.14;
const SCROLL_END = 0.032;
const TAKEN_OUT = 0.45;
const DESK = { top: 0.34, w: 0.26, d: 0.18, slope: 0.35 };

export function pigeonholes(x: number, front: number, cols: number, rows: number, base: number, reading: boolean): THREE.Object3D {
  const group = new THREE.Group();
  const w = cols * CELL + 0.04;
  const h = rows * CELL + 0.04;
  group.add(box(w, h, SHELF_DEPTH, flat(LIBRARY.shelf), x, base, front + SHELF_DEPTH / 2));
  group.add(box(w + 0.04, 0.03, SHELF_DEPTH + 0.03, flat(COLORS.aegean), x, base + h, front + SHELF_DEPTH / 2));
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const cx = x - (cols * CELL) / 2 + (c + 0.5) * CELL;
      const cy = base + 0.02 + r * CELL + 0.01;
      group.add(box(CELL - 0.018, CELL - 0.018, 0.01, flat(COLORS.dark), cx, cy, front - 0.002));
      if (reading && tileHash(c + Math.round(x * 10), r) < TAKEN_OUT) continue;
      for (const [dx, dy] of [[-0.02, 0.012], [0.02, 0.012], [0, 0.045]]) {
        const end = cylinder(SCROLL_END / 2, SCROLL_END / 2, 0.02, flat(SCROLLS.sheet), 0, 0, 0, 8);
        end.rotation.x = Math.PI / 2;
        end.position.set(cx + dx, cy + dy + SCROLL_END / 2, front - 0.008);
        group.add(end);
      }
    }
  }
  return group;
}

export function bust(x: number, z: number, height = 0.3): THREE.Object3D {
  const group = new THREE.Group();
  const marble = flat(PALACE.marble);
  group.add(box(0.14, 0.04, 0.14, surface('rubble'), x, BASE, z));
  group.add(box(0.1, height, 0.1, marble, x, BASE + 0.04, z));
  group.add(box(0.12, 0.025, 0.12, flat(COLORS.aegean), x, BASE + 0.04 + height, z));
  const top = BASE + 0.065 + height;
  group.add(scaled(sphere(0.07, marble, x, top + 0.03, z), 1, 0.6, 0.55));
  group.add(cylinder(0.022, 0.025, 0.05, marble, x, top + 0.05, z, 8));
  group.add(sphere(0.048, marble, x, top + 0.13, z));
  group.add(scaled(sphere(0.05, marble, x, top + 0.15, z + 0.01), 1, 0.8, 1));
  for (const side of [-1, 1]) group.add(sphere(0.012, flat(PALACE.gold), x + side * 0.04, top + 0.17, z));
  return group;
}

function painting(w: number, h: number): THREE.Object3D {
  const group = new THREE.Group();
  group.add(box(w + 0.04, h + 0.04, 0.02, flat(COLORS.deepAegean), 0, -0.02, 0));
  group.add(box(w, h * 0.55, 0.025, flat(LIBRARY.sky), 0, h * 0.45, 0));
  group.add(box(w, h * 0.45, 0.025, flat(LIBRARY.ochre), 0, 0, 0));
  group.add(sphere(0.025, flat(0xf2c84a), w * 0.3, h * 0.78, -0.012));
  group.add(box(0.035, 0.1, 0.02, flat(COLORS.whitewash), -w * 0.15, h * 0.2, -0.014));
  group.add(sphere(0.02, flat(COLORS.whitewash), -w * 0.15, h * 0.2 + 0.12, -0.014));
  group.add(box(0.05, 0.07, 0.02, flat(COLORS.clay), w * 0.18, h * 0.12, -0.014));
  return group;
}

export function easel(x: number, z: number, painted: boolean): THREE.Object3D {
  const group = new THREE.Group();
  const wood = COLORS.timber;
  group.add(rod(at(-0.1, BASE, -0.05), at(0, 0.5, -0.01), 0.012, wood));
  group.add(rod(at(0.1, BASE, -0.05), at(0, 0.5, -0.01), 0.012, wood));
  group.add(rod(at(0, BASE, 0.14), at(0, 0.48, 0), 0.012, wood));
  group.add(box(0.26, 0.02, 0.05, flat(wood), 0, 0.2, -0.04));
  const panel = new THREE.Group();
  panel.add(painting(0.26, 0.2));
  if (!painted) panel.add(box(0.32, 0.26, 0.03, flat(LIBRARY.linen), 0, -0.04, -0.012));
  panel.position.set(0, 0.24, -0.04);
  panel.rotation.x = 0.12;
  group.add(panel);
  group.position.set(x, 0, z);
  return group;
}

export function copyDesk(x: number, z: number, working: boolean): THREE.Object3D {
  const group = new THREE.Group();
  const wood = flat(COLORS.timber);
  for (const dx of [-0.09, 0.09]) group.add(box(0.03, DESK.top, 0.03, wood, dx, BASE, 0));
  group.add(box(0.2, 0.025, 0.12, wood, 0, BASE + 0.06, 0));
  const board = new THREE.Group();
  board.add(box(DESK.w, 0.02, DESK.d, wood, 0, 0, 0));
  if (working) board.add(openScroll(0, 0.02, 0, 0, 0.18));
  board.position.set(0, BASE + DESK.top, 0);
  board.rotation.x = -DESK.slope;
  group.add(board);
  if (working) {
    group.add(cylinder(0.022, 0.025, 0.04, flat(LIBRARY.ink), DESK.w / 2 + 0.03, BASE + 0.085, 0, 8));
    group.add(scaled(cylinder(0.04, 0.04, 0.02, flat(SCROLLS.sheet), DESK.w / 2 + 0.03, BASE + 0.085, -0.08, 8), 1, 1, 0.6));
  }
  group.position.set(x, 0, z);
  return group;
}

export function readingTable(x: number, z: number, w: number, reading: boolean): THREE.Object3D {
  const group = new THREE.Group();
  const marble = flat(PALACE.marble);
  for (const dx of [-w / 2 + 0.05, w / 2 - 0.05]) group.add(box(0.05, 0.16, 0.14, marble, x + dx, BASE, z));
  group.add(box(w, 0.03, 0.2, flat(COLORS.timber), x, BASE + 0.16, z));
  if (reading) for (const dx of [-w / 4, w / 4]) group.add(openScroll(x + dx, BASE + 0.19, z, 0, 0.14));
  for (const dx of [-w / 4, w / 4]) group.add(box(0.12, 0.08, 0.1, flat(LIBRARY.purple), x + dx, BASE, z + 0.2));
  return group;
}

function writingArm(): THREE.Group {
  const group = new THREE.Group();
  const hand = at(0.13, -0.12, -0.03);
  group.add(rod(at(0, 0, 0), hand, 0.017, FIGURE.skin));
  group.add(rod(hand, at(0.16, -0.08, -0.04), 0.005, LIBRARY.ink));
  return group;
}

export function copyist(): FigureParts {
  const upper = torso(LIBRARY.chiton, [at(0.12, -0.06, -0.08)]);
  const sash = box(0.15, 0.3, 0.04, flat(LIBRARY.purple), 0, -0.1, 0);
  sash.rotation.x = 0.6;
  upper.add(sash);
  return { legs: legs(), torso: upper, head: head('bare'), arm: writingArm() };
}

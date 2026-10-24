import * as THREE from 'three';
import { windowHole } from '../render/kit/cottage';
import { guard } from '../render/kit/guard';
import { box, surface } from '../render/kit/kit';
import { cypress } from '../render/kit/luxury';
import { amphora } from '../render/kit/oil';
import {
  evenly, marbleStairs, marbleTerrace, medallion, megaronColumn, paintedFrieze, palaceDoor, palaceGround, throne,
} from '../render/kit/palace';
import { hipRoof, tiledRoof } from '../render/kit/roofs';
import { ANTA, GATE_GUARDS, PALACE_PODIUM, PALACE_WALL, gardenMegaron, guarded, megaron } from '../render/palace-models';
import type { DesignOption } from './options';

const W = 9;
const D = 6;

function annex(g: THREE.Group, x0: number, z0: number, w: number, d: number, top: number): void {
  g.add(box(w, top - 0.03, d, surface('whitewash'), x0 + w / 2, 0.03, z0 + d / 2));
  g.add(hipRoof(x0, z0, w, d, top, 0.4, 'tiles'));
  for (let x = x0 + 0.45; x < x0 + w - 0.2; x += 0.7) g.add(windowHole(x, z0 + d, top * 0.55));
}

function porch(g: THREE.Group, x0: number, z0: number, w: number, d: number, height: number): void {
  const count = Math.round(w / 0.7) + 1;
  for (let i = 0; i < count; i++) g.add(megaronColumn(x0 + 0.15 + ((w - 0.3) * i) / (count - 1), z0 + d - 0.15, height, 0.03));
  g.add(hipRoof(x0, z0, w, d, height + 0.03, 0.3, 'tiles'));
}

function whiteMegaron(): THREE.Object3D {
  const g = new THREE.Group();
  g.add(palaceGround(W, D));
  megaron(g, 2.9, 0.6, 3.2, 4.0);
  for (const x0 of [0.4, 6.5]) {
    annex(g, x0, 0.9, 2.1, 2.8, 1.1);
    porch(g, x0, 3.7, 2.1, 0.9, 0.85);
  }
  for (const x of [0.6, 8.4]) for (const z of [5.0, 5.5]) g.add(cypress(x, z, 0.55));
  for (const x of [1.4, 7.6]) g.add(amphora(x, 5.0));
  return guarded(g, GATE_GUARDS, 0, guard);
}

function longHall(g: THREE.Group, x0: number, z0: number, w: number, d: number): void {
  const x1 = x0 + w;
  const front = z0 + d;
  const cx = x0 + w / 2;
  const porch = 0.9;
  const walls = surface('whitewash');
  g.add(marbleTerrace(x0 - 0.2, z0 - 0.2, w + 0.4, d + 0.5, PALACE_PODIUM));
  g.add(box(w, PALACE_WALL, d - porch, walls, cx, PALACE_PODIUM, z0 + (d - porch) / 2));
  for (const ax of [x0 + ANTA / 2, x1 - ANTA / 2]) g.add(box(ANTA, PALACE_WALL, porch, walls, ax, PALACE_PODIUM, front - porch / 2));
  g.add(palaceDoor(cx, front - porch, PALACE_PODIUM, 0.6, 0.9));
  g.add(throne(cx, front - porch + 0.35, PALACE_PODIUM));
  for (const x of evenly(x0 + 0.8, x1 - 0.8, 6)) g.add(megaronColumn(x, front - 0.15, PALACE_WALL, PALACE_PODIUM));
  g.add(paintedFrieze(x0, x1, PALACE_PODIUM + PALACE_WALL, front - 0.07));
  g.add(medallion(cx, PALACE_PODIUM + PALACE_WALL + 0.08, front + 0.03, 0.14));
  g.add(tiledRoof(x0 - 0.1, z0 - 0.1, w + 0.2, d + 0.25, PALACE_PODIUM + PALACE_WALL + 0.16, d * 0.32));
  g.add(marbleStairs(cx, front + 0.3, 2.4, 3, PALACE_PODIUM / 3, 0.12));
}

function wideMegaron(): THREE.Object3D {
  const g = new THREE.Group();
  g.add(palaceGround(W, D));
  longHall(g, 1.4, 1.0, 6.2, 3.0);
  for (const x of [0.6, 8.4]) for (const z of [1.2, 2.2, 3.2, 4.2]) g.add(cypress(x, z, 0.55));
  for (const x of [1.4, 7.6]) g.add(amphora(x, 5.0));
  return guarded(g, [[3.6, 5.55, 'rest'], [5.4, 5.55, 'rest'], [2.0, 5.65, 'patrol']], 0, guard);
}

export const PALACE_OPTIONS: DesignOption[] = [
  { name: 'C1 · White megaron, as is', build: whiteMegaron },
  { name: 'C2 · Wide hall along the road', build: wideMegaron },
  { name: 'C3 · Lone megaron in a garden', build: gardenMegaron },
];

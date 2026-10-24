import * as THREE from 'three';
import { BUILDING_SPECS } from '../sim/buildings';
import type { Building } from '../sim/state';
import { bakedOnce } from './bake';
import { type FigureParts, type Motion, posedFigure } from './kit/figure';
import { guard } from './kit/guard';
import { box, surface } from './kit/kit';
import { cypress, fountain, lawn } from './kit/luxury';
import { marbleStairs, marbleTerrace, medallion, megaronColumn, paintedFrieze, palaceDoor, palaceGround, throne } from './kit/palace';
import { tiledRoofAlongZ } from './kit/roofs';
import { bakedFigure, staffPhase } from './staff';

const { width: W, height: D } = BUILDING_SPECS.palace;
const FACING_THE_ROAD = -Math.PI / 2;
const GUARD_PHASE_STEP = 7;

export const PALACE_PODIUM = 0.2;
export const PALACE_WALL = 1.4;
export const ANTA = 0.3;

type Post = [x: number, z: number, motion: Motion];

export const GATE_GUARDS: Post[] = [[3.7, 5.55, 'rest'], [5.3, 5.55, 'rest'], [2.0, 5.65, 'patrol']];

export function guarded(shell: THREE.Object3D, posts: Post[], phase: number, parts: () => FigureParts): THREE.Object3D {
  posts.forEach(([x, z, motion], i) => shell.add(posedFigure(x, z, FACING_THE_ROAD, phase + i * GUARD_PHASE_STEP, parts(), motion)));
  return shell;
}

export function megaron(g: THREE.Group, x0: number, z0: number, w: number, d: number): void {
  const x1 = x0 + w;
  const front = z0 + d;
  const cx = x0 + w / 2;
  const porch = 1.0;
  const walls = surface('whitewash');
  g.add(marbleTerrace(x0 - 0.2, z0 - 0.2, w + 0.4, d + 0.5, PALACE_PODIUM));
  g.add(box(w, PALACE_WALL, d - porch, walls, cx, PALACE_PODIUM, z0 + (d - porch) / 2));
  for (const ax of [x0 + ANTA / 2, x1 - ANTA / 2]) g.add(box(ANTA, PALACE_WALL, porch, walls, ax, PALACE_PODIUM, front - porch / 2));
  g.add(palaceDoor(cx, front - porch, PALACE_PODIUM, 0.6, 0.9));
  g.add(throne(cx, front - porch + 0.35, PALACE_PODIUM));
  for (const x of [cx - w * 0.2, cx + w * 0.2]) g.add(megaronColumn(x, front - 0.15, PALACE_WALL, PALACE_PODIUM));
  g.add(paintedFrieze(x0, x1, PALACE_PODIUM + PALACE_WALL, front - 0.07));
  const eaves = PALACE_PODIUM + PALACE_WALL + 0.16;
  const rise = w * 0.27;
  g.add(tiledRoofAlongZ(x0 - 0.1, z0 - 0.1, w + 0.2, d + 0.25, eaves, rise));
  g.add(medallion(cx, eaves + rise * 0.35, front + 0.17, 0.16));
  g.add(marbleStairs(cx, front + 0.3, 1.6, 3, PALACE_PODIUM / 3, 0.12));
}

function gardenMegaronShell(): THREE.Group {
  const g = new THREE.Group();
  g.add(palaceGround(W, D));
  megaron(g, 2.9, 0.6, 3.2, 4.0);
  for (const x0 of [0.5, 6.6]) g.add(lawn(x0, 1.0, 1.9, 3.4));
  for (const x of [0.7, 2.2, 6.8, 8.3]) for (const z of [1.3, 2.5, 3.7]) g.add(cypress(x, z, 0.55));
  for (const x of [1.45, 7.55]) g.add(fountain(x, 2.5, 0.35));
  return g;
}

export function gardenMegaron(): THREE.Object3D {
  return guarded(gardenMegaronShell(), GATE_GUARDS, 0, guard);
}

const shell = bakedOnce(gardenMegaronShell);
const bakedGuard = bakedFigure(guard);

export function palaceModel(palace: Building): THREE.Object3D {
  return guarded(shell(), GATE_GUARDS, staffPhase(palace), bakedGuard);
}

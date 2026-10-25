import * as THREE from 'three';
import { UNITS_PER_LOAD } from '../sim/food';
import { BRONZE_PER_SCULPTURE, STUDIO_BRONZE_CAPACITY, STUDIO_SCULPTURE_CAPACITY } from '../sim/materials';
import type { Building } from '../sim/state';
import { bakedOnce } from './bake';
import { blueDoor, cube } from './kit/cottage';
import { type FigureParts, posedFigure } from './kit/figure';
import { lotGround, surface } from './kit/kit';
import { stockBlock } from './kit/masonry';
import { tiledRoof } from './kit/roofs';
import { hungChisels, ingotPile, plinth, scaffold, sculptor, statue, statueInMould } from './kit/sculpture';
import { bakedFigure, staffPhase } from './staff';

const CLOSED = 0;
const OPEN = 1.2;
const DOOR_BASE = 0.12;
const FACING_FRONT = -Math.PI / 2;

export const STUDIO_BRONZE_LOADS = STUDIO_BRONZE_CAPACITY / UNITS_PER_LOAD;
export const STUDIO_SCULPTURE_LOADS = STUDIO_SCULPTURE_CAPACITY / UNITS_PER_LOAD;
const BRONZE_LOADS_PER_SCULPTURE = BRONZE_PER_SCULPTURE / UNITS_PER_LOAD;
const INGOTS_PER_LOAD = 2;

export interface StudioStock {
  staffed: boolean;
  bronze: number;
  sculptures: number;
}

type Spot = [number, number];

const casting = ({ staffed, bronze, sculptures }: StudioStock) =>
  staffed && bronze >= BRONZE_LOADS_PER_SCULPTURE && sculptures < STUDIO_SCULPTURE_LOADS;

function workpiece(group: THREE.Group, stock: StudioStock, x: number, z: number, size: number): void {
  if (casting(stock)) {
    group.add(statueInMould(x, z, FACING_FRONT, size));
    group.add(scaffold(x, z, 0.45 * size, 0.17 * size));
  } else group.add(plinth(x, z));
}

function finished(group: THREE.Group, spots: Spot[], sculptures: number, size = 1): void {
  spots.slice(0, sculptures).forEach(([x, z]) => group.add(statue(x, z, FACING_FRONT, size)));
}

function bronze(group: THREE.Group, spots: Spot[], loads: number): void {
  const perSpot = STUDIO_BRONZE_LOADS / spots.length;
  spots.forEach(([x, z], i) => {
    const here = Math.min(Math.max(loads - i * perSpot, 0), perSpot);
    if (here > 0) group.add(ingotPile(x, z, here * INGOTS_PER_LOAD));
  });
}

const HALL = { x0: 0.12, z0: 0.14, w: 1.76, d: 0.6, top: 0.56 };
const PORTICO_WORK = { x: 1.0, z: 1.15 };
const PORTICO_ROW: Spot[] = [[0.35, 1.7], [0.78, 1.7], [1.22, 1.7], [1.65, 1.7]];
const PORTICO_BRONZE: Spot[] = [[0.35, 1.05], [0.35, 1.3]];

export function porticoShell(stock: StudioStock): THREE.Object3D {
  const group = new THREE.Group();
  group.add(lotGround(surface('ashlar')));
  const front = HALL.z0 + HALL.d;
  group.add(cube(HALL.x0, HALL.z0, HALL.w, HALL.d, HALL.top));
  group.add(tiledRoof(HALL.x0 - 0.03, HALL.z0 - 0.04, HALL.w + 0.06, HALL.d + 0.08, HALL.top + 0.04, 0.22));
  group.add(blueDoor(1.0, front, DOOR_BASE, stock.staffed ? OPEN : CLOSED));
  if (!stock.staffed) group.add(hungChisels(1.45, 0.4, front + 0.01));
  for (const x of [0.25, 1.75]) group.add(stockBlock(x, front + 0.15, 0.2));
  workpiece(group, stock, PORTICO_WORK.x, PORTICO_WORK.z, 1);
  bronze(group, PORTICO_BRONZE, stock.bronze);
  finished(group, PORTICO_ROW, stock.sculptures);
  return group;
}

export function withPorticoSculptor(shell: THREE.Object3D, phase: number, parts: FigureParts): THREE.Object3D {
  shell.add(posedFigure(PORTICO_WORK.x - 0.3, PORTICO_WORK.z + 0.05, 0, phase, parts, 'hammer'));
  return shell;
}

export function portico(stock: StudioStock): THREE.Object3D {
  const shell = porticoShell(stock);
  return stock.staffed ? withPorticoSculptor(shell, 0, sculptor()) : shell;
}

const shells = new Map<string, () => THREE.Object3D>();
const bakedSculptor = bakedFigure(sculptor);

export function sculptureStudioModel(studio: Building): THREE.Object3D {
  const stock: StudioStock = {
    staffed: studio.workers > 0,
    bronze: Math.floor(studio.bronze / UNITS_PER_LOAD),
    sculptures: Math.floor(studio.sculptures / UNITS_PER_LOAD),
  };
  const key = `${stock.staffed}/${stock.bronze}/${stock.sculptures}`;
  if (!shells.has(key)) shells.set(key, bakedOnce(() => porticoShell(stock)));
  const shell = shells.get(key)!();
  return stock.staffed ? withPorticoSculptor(shell, staffPhase(studio), bakedSculptor()) : shell;
}

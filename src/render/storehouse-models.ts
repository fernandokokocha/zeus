import * as THREE from 'three';
import type { Building, GameState } from '../sim/state';
import { type Bay, type StoredGood, baysOf } from '../sim/storehouse';
import { bakedOnce } from './bake';
import { handcart } from './kit/camp';
import { clothBolts } from './kit/cloth';
import { storedPapyrus, storedScrolls } from './kit/scrolls';
import { blueDoor, cube, frontWindow } from './kit/cottage';
import { type FigureParts, posedFigure } from './kit/figure';
import { sack } from './kit/food';
import { surface } from './kit/kit';
import { amphora } from './kit/oil';
import { tiledRoof } from './kit/roofs';
import { BAY_PAD, GROUND_EDGE, LOT_3, bayPad, bronzeIngots, crated, fleeceBales, marbleBlocks, oilAmphorae, oliveBaskets, stackedLogs, storeGround, storekeeper } from './kit/storehouse';
import { tileHash } from './palette';
import { bakedFigure, staffPhase } from './staff';

export const STORED_LOADS: Record<StoredGood, () => THREE.Object3D> = {
  fleece: bakedOnce(fleeceBales),
  olives: bakedOnce(oliveBaskets),
  oil: bakedOnce(oilAmphorae),
  wood: bakedOnce(stackedLogs),
  marble: bakedOnce(marbleBlocks),
  bronze: bakedOnce(bronzeIngots),
  sculptures: bakedOnce(crated),
  cloth: bakedOnce(clothBolts),
  papyrus: bakedOnce(storedPapyrus),
  scrolls: bakedOnce(storedScrolls),
};

const ROWS_BY_LOADS = { 4: [-1, 1], 6: [-1, 0, 1] };
const LOAD_COLUMNS = [-1, 1];
const LOAD_JITTER = 0.4;
const CLOSED = 0;
const OPEN = 1.2;
const DOOR_BASE = 0.12;
const FACING_ROAD = -Math.PI / 2;

type BaySpot = [number, number, number];

function loadSpots(capacity: number): [number, number][] {
  const rows = ROWS_BY_LOADS[capacity as keyof typeof ROWS_BY_LOADS];
  const across = BAY_SIZE / 4;
  const deep = BAY_SIZE / (rows.length + 1);
  return rows.flatMap((row) => LOAD_COLUMNS.map((column): [number, number] => [column * across, row * deep]));
}

function stock(group: THREE.Object3D, bays: Bay[]): void {
  bays.forEach(({ good, loads, capacity }, slot) => {
    const [x, floor, z] = YARD_BAYS[slot];
    loadSpots(capacity).slice(0, loads).forEach(([dx, dz], i) => {
      const load = STORED_LOADS[good]();
      load.position.set(x + dx, floor, z + dz);
      load.rotation.y = (tileHash(slot, i) - 0.5) * LOAD_JITTER;
      group.add(load);
    });
  });
}

function keeper(shell: THREE.Object3D, x: number, floor: number, z: number, phase: number, parts: FigureParts): THREE.Object3D {
  const figure = posedFigure(x, z, FACING_ROAD, phase, parts, 'rest');
  figure.position.y = floor;
  shell.add(figure);
  return shell;
}

function cartLoad(): THREE.Object3D[] {
  return [sack(-0.09, 0, 0.4, 0.16), amphora(0.08, -0.03, 0.16)];
}

const YARD_FLOOR = 0.03;
const HALL = { x0: 0.18, z0: 0.18, w: 1.85, d: 0.72, top: 0.66, door: 1.1 };
const YARD_KEEPER = { x: HALL.door, z: 1.06 };
const BAY_GAP = 0.03;
const BAYS_ACROSS = 4;
const BAYS_DEEP = 2;
const YARD = { x0: GROUND_EDGE, x1: LOT_3 - GROUND_EDGE, z1: LOT_3 - GROUND_EDGE };
const BAY_SIZE = (YARD.x1 - YARD.x0 - (BAYS_ACROSS - 1) * BAY_GAP) / BAYS_ACROSS;

const bayCentres = (start: number, count: number) => Array.from({ length: count }, (_, i) => start + BAY_SIZE / 2 + i * (BAY_SIZE + BAY_GAP));

const YARD_BAYS: BaySpot[] = bayCentres(YARD.z1 - BAYS_DEEP * BAY_SIZE - (BAYS_DEEP - 1) * BAY_GAP, BAYS_DEEP).flatMap((z) =>
  bayCentres(YARD.x0, BAYS_ACROSS).map((x): BaySpot => [x, YARD_FLOOR + BAY_PAD, z]),
);

export function yardShell(staffed: boolean): THREE.Object3D {
  const group = new THREE.Group();
  group.add(storeGround(surface('earth')));
  const { x0, z0, w, d, top, door } = HALL;
  group.add(cube(x0, z0, w, d, top));
  group.add(tiledRoof(x0 - 0.03, z0 - 0.05, w + 0.06, d + 0.1, top + 0.04, 0.24));
  group.add(blueDoor(door, z0 + d, DOOR_BASE, staffed ? OPEN : CLOSED));
  for (const x of [0.45, 1.65]) group.add(frontWindow(x, z0 + d, 0.36));
  for (const [x, , z] of YARD_BAYS) group.add(bayPad(x, z, BAY_SIZE, YARD_FLOOR));
  if (staffed) group.add(handcart(2.45, 0.55, 0.3, cartLoad()));
  return group;
}

export function storeYard(staffed: boolean, bays: Bay[]): THREE.Object3D {
  const shell = yardShell(staffed);
  stock(shell, bays);
  return staffed ? keeper(shell, YARD_KEEPER.x, YARD_FLOOR, YARD_KEEPER.z, 0, storekeeper()) : shell;
}

const shells = { staffed: bakedOnce(() => yardShell(true)), idle: bakedOnce(() => yardShell(false)) };
const bakedKeeper = bakedFigure(storekeeper);

export function storehouseModel(storehouse: Building, state: GameState): THREE.Object3D {
  const staffed = storehouse.workers > 0;
  const shell = (staffed ? shells.staffed : shells.idle)();
  stock(shell, baysOf(state, storehouse));
  return staffed ? keeper(shell, YARD_KEEPER.x, YARD_FLOOR, YARD_KEEPER.z, staffPhase(storehouse), bakedKeeper()) : shell;
}

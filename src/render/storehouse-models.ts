import * as THREE from 'three';
import type { Building } from '../sim/state';
import { type Bay, type StoredGood, baysOf } from '../sim/storehouse';
import { bakedOnce } from './bake';
import { handcart } from './kit/camp';
import { clothBolts } from './kit/cloth';
import { blueDoor, cube, frontWindow } from './kit/cottage';
import { type FigureParts, posedFigure } from './kit/figure';
import { sack } from './kit/food';
import { surface } from './kit/kit';
import { amphora } from './kit/oil';
import { tiledRoof } from './kit/roofs';
import { BAY_PAD, bayPad, bronzeIngots, crated, fleeceBales, marbleBlocks, oilAmphorae, oliveBaskets, stackedLogs, storeGround, storekeeper } from './kit/storehouse';
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
};

const LOAD_SPACING = 0.15;
const LOAD_SPOTS = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
const LOAD_JITTER = 0.4;
const BAY_SIZE = 0.64;
const CLOSED = 0;
const OPEN = 1.2;
const DOOR_BASE = 0.12;
const FACING_ROAD = -Math.PI / 2;

type BaySpot = [number, number, number];

function stock(group: THREE.Object3D, spots: BaySpot[], bays: Bay[]): void {
  bays.forEach(({ good, loads }, slot) => {
    const [x, floor, z] = spots[slot];
    LOAD_SPOTS.slice(0, loads).forEach(([dx, dz], i) => {
      const load = STORED_LOADS[good]();
      load.position.set(x + dx * LOAD_SPACING, floor, z + dz * LOAD_SPACING);
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
const YARD_BAYS: BaySpot[] = [1.5, 2.3].flatMap((z) => [0.5, 1.17, 1.84, 2.51].map((x): BaySpot => [x, YARD_FLOOR + BAY_PAD, z]));

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
  stock(shell, YARD_BAYS, bays);
  return staffed ? keeper(shell, YARD_KEEPER.x, YARD_FLOOR, YARD_KEEPER.z, 0, storekeeper()) : shell;
}

const shells = { staffed: bakedOnce(() => yardShell(true)), idle: bakedOnce(() => yardShell(false)) };
const bakedKeeper = bakedFigure(storekeeper);

export function storehouseModel(storehouse: Building): THREE.Object3D {
  const staffed = storehouse.workers > 0;
  const shell = (staffed ? shells.staffed : shells.idle)();
  stock(shell, YARD_BAYS, baysOf(storehouse));
  return staffed ? keeper(shell, YARD_KEEPER.x, YARD_FLOOR, YARD_KEEPER.z, staffPhase(storehouse), bakedKeeper()) : shell;
}

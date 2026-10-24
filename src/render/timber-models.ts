import * as THREE from 'three';
import { UNITS_PER_LOAD } from '../sim/food';
import type { Building } from '../sim/state';
import { bakedOnce } from './bake';
import { bakedFigure, staffPhase } from './staff';
import { WORKSHOP_CAPACITY } from '../sim/materials';
import { blueDoor, cube } from './kit/cottage';
import { type FigureParts, posedFigure } from './kit/figure';
import { COLORS, box, cylinder, flat, lotGround, surface } from './kit/kit';
import { tiledRoof } from './kit/roofs';
import {
  TIMBER,
  awning,
  axeman,
  choppingBlock,
  hungAxe,
  hungSaw,
  leaningPlanks,
  guyRope,
  logCrane,
  logStack,
  lyingSaw,
  plankStack,
  pole,
  sawdust,
  sawhorse,
  sawPit,
  sawyer,
  splitWood,
  timberLog,
  toolRack,
} from './kit/timber';

const CLOSED = 0;
const OPEN = 1.2;
const DOOR_BASE = 0.12;
const ALONG_Z = Math.PI / 2;

export const TIMBER_MILL_LOADS = WORKSHOP_CAPACITY / UNITS_PER_LOAD;

type Spot = [number, number, number];

function stock(group: THREE.Group, spots: Spot[], loads: number): void {
  spots.slice(0, loads).forEach(([x, z, turn]) => group.add(logStack(x, z, turn)));
}

const SHED = { x0: 1.0, x1: 1.86, z0: 0.18, z1: 0.92, eaves: 0.56 };
const PIT = { x: 0.85, z: 1.45, length: 0.9 };
const PIT_LOG = { radius: 0.06, y: 0.15 };
const PIT_LOG_TOP = PIT_LOG.y + PIT_LOG.radius * 2;
const STORE = { x0: 0.12, z0: 0.15, w: 0.8, d: 0.55, top: 0.55 };
const SHED_STOCK: Spot[] = [[1.2, 0.38, 0], [1.66, 0.38, 0], [1.2, 0.74, 0], [1.66, 0.74, 0]];

function openShed(group: THREE.Group): void {
  for (const x of [SHED.x0, SHED.x1]) for (const z of [SHED.z0, SHED.z1]) group.add(box(0.05, SHED.eaves - 0.03, 0.05, flat(COLORS.timber), x, 0.03, z));
  group.add(box(SHED.x1 - SHED.x0 + 0.06, 0.04, 0.05, flat(COLORS.timber), (SHED.x0 + SHED.x1) / 2, SHED.eaves - 0.04, SHED.z1));
  group.add(tiledRoof(SHED.x0 - 0.04, SHED.z0 - 0.06, SHED.x1 - SHED.x0 + 0.08, SHED.z1 - SHED.z0 + 0.12, SHED.eaves, 0.24));
}

export function sawPitShedShell(staffed: boolean, loads: number): THREE.Object3D {
  const group = new THREE.Group();
  group.add(lotGround());
  const front = STORE.z0 + STORE.d;
  group.add(cube(STORE.x0, STORE.z0, STORE.w, STORE.d, STORE.top));
  group.add(blueDoor(0.68, front, DOOR_BASE, staffed ? OPEN : CLOSED));
  if (!staffed) group.add(hungSaw(0.33, 0.36, front + 0.01));
  openShed(group);
  stock(group, SHED_STOCK, loads);
  group.add(sawPit(PIT.x, PIT.z, PIT.length));
  group.add(timberLog(PIT.length + 0.12, PIT_LOG.radius, PIT.x, PIT_LOG.y, PIT.z, 0));
  if (staffed) group.add(sawdust(PIT.x + 0.05, PIT.z, 0.1));
  group.add(plankStack(1.55, 1.55, 0.2, 6));
  return group;
}

export function withPitSawyer(shell: THREE.Object3D, phase: number, parts: FigureParts): THREE.Object3D {
  const figure = posedFigure(PIT.x - 0.12, PIT.z, 0, phase, parts, 'saw');
  figure.position.y = PIT_LOG_TOP;
  shell.add(figure);
  return shell;
}

export function sawPitShed(staffed: boolean, loads: number): THREE.Object3D {
  const shell = sawPitShedShell(staffed, loads);
  return staffed ? withPitSawyer(shell, 0, sawyer()) : shell;
}

const SHELTER = { x0: 0.15, z0: 0.18, x1: 1.85, z1: 0.78, back: 0.62, front: 0.5, sag: 0.08 };
const SHELTER_BAYS = 2;
const BLOCK = { x: 0.5, z: 1.3 };
const YARD_STOCK: Spot[] = [[1.12, 1.0, 0], [1.62, 1.0, 0], [1.12, 1.42, 0], [1.62, 1.42, 0]];

function clothShelter(group: THREE.Group): void {
  const { x0, z0, x1, z1, back, front, sag } = SHELTER;
  const middle = (x0 + x1) / 2;
  for (const x of [x0, middle, x1]) group.add(pole(x, z0, back), pole(x, z1, front));
  group.add(awning(x0, z0, x1, z1, back + 0.01, front + 0.01, SHELTER_BAYS, sag));
  group.add(guyRope(x0, front, z1, x0 - 0.05, z1 + 0.22), guyRope(x1, front, z1, x1 + 0.03, z1 + 0.22));
  group.add(box(x1 - x0 - 0.1, 0.2, 0.1, surface('rubble'), middle, 0.03, z0 + 0.05));
}

export function logYardShell(staffed: boolean, loads: number): THREE.Object3D {
  const group = new THREE.Group();
  group.add(lotGround());
  clothShelter(group);
  group.add(leaningPlanks(1.25, 0, SHELTER.z0 + 0.06));
  group.add(plankStack(0.55, 0.5, 0, 4));
  group.add(choppingBlock(BLOCK.x, BLOCK.z));
  if (staffed) {
    group.add(cylinder(0.05, 0.05, 0.1, flat(TIMBER.heartwood), BLOCK.x, 0.176, BLOCK.z, 10));
    group.add(lyingSaw(0.75, 1.55, 0.4));
  } else {
    group.add(hungAxe(SHELTER.x0 + 0.02, 0.42, SHELTER.z1 + 0.03));
    group.add(hungSaw(0.85, 0.36, SHELTER.z0 + 0.11));
  }
  group.add(splitWood(0.5, 1.68, 14, 41));
  stock(group, YARD_STOCK, loads);
  group.add(plankStack(1.38, 1.76, 0, 5));
  return group;
}

export function withAxeman(shell: THREE.Object3D, phase: number, parts: FigureParts): THREE.Object3D {
  shell.add(posedFigure(BLOCK.x - 0.2, BLOCK.z + 0.02, 0, phase, parts, 'hammer'));
  return shell;
}

export function logYard(staffed: boolean, loads: number): THREE.Object3D {
  const shell = logYardShell(staffed, loads);
  return staffed ? withAxeman(shell, 0, axeman()) : shell;
}

const HUT = { x0: 0.14, z0: 0.14, w: 0.5, d: 0.45, top: 0.5 };
const HORSE = { x: 0.95, z: 1.35, height: 0.3 };
const CRANE = { x: 1.3, z: 0.62, height: 1.15 };
const FENCE_HEIGHT = 0.16;
const CRANE_STOCK: Spot[] = [[0.3, 1.0, ALONG_Z], [0.3, 1.5, ALONG_Z], [1.7, 1.25, ALONG_Z], [1.7, 1.7, ALONG_Z]];

function yardFence(group: THREE.Group): void {
  group.add(box(1.2, FENCE_HEIGHT, 0.04, flat(COLORS.timber), 1.28, 0.03, 0.14));
  group.add(box(0.04, FENCE_HEIGHT, 0.76, flat(COLORS.timber), 1.88, 0.03, 0.52));
  for (const x of [0.72, 1.08, 1.48, 1.86]) group.add(box(0.05, FENCE_HEIGHT + 0.06, 0.05, flat(COLORS.timber), x, 0.03, 0.14));
}

export function craneYardShell(staffed: boolean, loads: number): THREE.Object3D {
  const group = new THREE.Group();
  group.add(lotGround(surface('rubble')));
  yardFence(group);
  const front = HUT.z0 + HUT.d;
  group.add(cube(HUT.x0, HUT.z0, HUT.w, HUT.d, HUT.top));
  group.add(box(HUT.w + 0.08, 0.04, HUT.d + 0.08, flat(COLORS.aegean), HUT.x0 + HUT.w / 2, HUT.top - 0.09, HUT.z0 + HUT.d / 2));
  group.add(blueDoor(0.39, front, DOOR_BASE, staffed ? OPEN : CLOSED));
  group.add(toolRack(0.95, 0.3, !staffed));
  group.add(logCrane(CRANE.x, CRANE.z, CRANE.height, staffed ? 0.5 : 0.03));
  group.add(sawhorse(HORSE.x, HORSE.z, HORSE.height));
  group.add(sawdust(HORSE.x, HORSE.z + 0.05, staffed ? 0.14 : 0.08));
  stock(group, CRANE_STOCK, loads);
  return group;
}

export function withHorseSawyer(shell: THREE.Object3D, phase: number, parts: FigureParts): THREE.Object3D {
  shell.add(posedFigure(HORSE.x, HORSE.z + 0.17, ALONG_Z, phase, parts, 'saw'));
  return shell;
}

export function craneYard(staffed: boolean, loads: number): THREE.Object3D {
  const shell = craneYardShell(staffed, loads);
  return staffed ? withHorseSawyer(shell, 0, sawyer()) : shell;
}

const shells = new Map<string, () => THREE.Object3D>();
const bakedAxeman = bakedFigure(axeman);

export function timberMillModel(mill: Building): THREE.Object3D {
  const staffed = mill.workers > 0;
  const loads = Math.floor(mill.wood / UNITS_PER_LOAD);
  const key = `${staffed}/${loads}`;
  if (!shells.has(key)) shells.set(key, bakedOnce(() => logYardShell(staffed, loads)));
  const shell = shells.get(key)!();
  return staffed ? withAxeman(shell, staffPhase(mill), bakedAxeman()) : shell;
}

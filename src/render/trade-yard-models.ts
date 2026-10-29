import * as THREE from 'three';
import { BUILDING_SPECS } from '../sim/buildings';
import { slotHoldings } from '../sim/exports';
import { UNITS_PER_LOAD } from '../sim/food';
import { guildOfYard } from '../sim/guild';
import type { Building, GameState, Good } from '../sim/state';
import { routeOf } from '../sim/trade';
import { bakedOnce } from './bake';
import { handcart } from './kit/camp';
import { blueDoor, cube, frontWindow } from './kit/cottage';
import { type FigureParts, posedFigure } from './kit/figure';
import { sack } from './kit/food';
import { paving } from './kit/garden';
import { placed } from './kit/gymnasium';
import { COLORS, box, cylinder, flat, surface } from './kit/kit';
import { MARKET, clothTent } from './kit/market';
import { tiledRoof } from './kit/roofs';
import { BAY_PAD, storekeeper } from './kit/storehouse';
import { PARTNER_COLORS, tileHash } from './palette';
import { bakedFigure, staffPhase } from './staff';
import { STORED_LOADS } from './storehouse-models';

const { width: W, height: D } = BUILDING_SPECS.tradeYard;
const RAIL = { z: 0.2, height: 0.28, posts: 7 };
const YARD_FLOOR = 0.03;
const SLOT_XS = [0.5, 1.5, 2.5, 3.5];
const BAY = { z: 0.82, w: 0.86, d: 0.6 };
const TENT = { z0: 0.48, z1: 1.18, halfWidth: 0.44, eaves: 0.72, ridge: 0.98 };
const HALL = { z0: 1.42, d: 0.48, top: 0.6, door: 2.0, windows: [0.8, 3.2] };
const KEEPER = { x: 2.0, z: 1.25 };
const BAY_LOAD_SPOTS = [-0.31, -0.1, 0.11, 0.32].flatMap((dx) => [0.13, -0.13].map((dz) => [dx, dz]));
const LOAD_JITTER = 0.4;
const FACING_ROAD = Math.PI;
const TOWARD_ROAD = Math.PI;
const OPEN = 1.2;
const SHUT = 0;
const EXPORT_FLAG = COLORS.aegean;

export interface YardBay {
  good: Good;
  loads: number;
  flag: number;
}

const YARD_LOADS: Record<Good, () => THREE.Object3D> = { ...STORED_LOADS, food: bakedOnce(() => sack(0, 0, 0, 0)) };

function hitchingRail(): THREE.Object3D {
  const group = new THREE.Group();
  const wood = flat(COLORS.timber);
  for (let i = 0; i < RAIL.posts; i++) {
    const x = 0.2 + (i * (W - 0.4)) / (RAIL.posts - 1);
    group.add(cylinder(0.02, 0.022, RAIL.height, wood, x, 0.03, RAIL.z, 6));
  }
  group.add(box(W - 0.36, 0.03, 0.03, wood, W / 2, 0.03 + RAIL.height - 0.05, RAIL.z));
  return group;
}

function roadFacing(part: THREE.Object3D, x: number): THREE.Object3D {
  return placed(part, x, HALL.z0, TOWARD_ROAD);
}

function yardShell(staffed: boolean, flags: (number | null)[]): THREE.Object3D {
  const group = new THREE.Group();
  group.add(paving(0.05, 0.05, W - 0.1, D - 0.1));
  group.add(hitchingRail());
  const { z0, d, top } = HALL;
  group.add(cube(0.2, z0, W - 0.4, d, top));
  group.add(tiledRoof(0.17, z0 - 0.05, W - 0.34, d + 0.1, top + 0.04, 0.2));
  group.add(roadFacing(blueDoor(0, 0, 0.12, staffed ? OPEN : SHUT), HALL.door));
  for (const x of HALL.windows) group.add(roadFacing(frontWindow(0, 0, 0.34), x));
  SLOT_XS.forEach((x, slot) => {
    group.add(box(BAY.w, BAY_PAD, BAY.d, surface('ashlar'), x, YARD_FLOOR, BAY.z));
    group.add(clothTent(x - TENT.halfWidth, TENT.z0, x + TENT.halfWidth, TENT.z1, TENT.eaves, TENT.ridge, flags[slot] ?? MARKET.linen));
  });
  if (staffed) group.add(handcart(3.55, 1.28, Math.PI / 2, []));
  return group;
}

function stock(group: THREE.Object3D, bays: (YardBay | null)[]): void {
  bays.forEach((bay, slot) => {
    if (bay === null) return;
    BAY_LOAD_SPOTS.slice(0, bay.loads).forEach(([dx, dz], i) => {
      const load = YARD_LOADS[bay.good]();
      load.position.set(SLOT_XS[slot] + dx, YARD_FLOOR + BAY_PAD, BAY.z + dz);
      load.rotation.y = (tileHash(slot, i) - 0.5) * LOAD_JITTER;
      group.add(load);
    });
  });
}

function withKeeper(shell: THREE.Object3D, phase: number, parts: FigureParts): THREE.Object3D {
  shell.add(posedFigure(KEEPER.x, KEEPER.z, FACING_ROAD, phase, parts, 'rest'));
  return shell;
}

export function tentedBays(staffed: boolean, bays: (YardBay | null)[]): THREE.Object3D {
  const shell = yardShell(staffed, bays.map((bay) => bay && bay.flag));
  stock(shell, bays);
  return staffed ? withKeeper(shell, 0, storekeeper()) : shell;
}

function importFlag(state: GameState, yard: Building): number {
  const route = routeOf(state, guildOfYard(state, yard));
  if (route === null) throw new Error(`Trade Yard ${yard.id} imports without a route`);
  return PARTNER_COLORS[route.partner];
}

function yardBays(state: GameState, yard: Building): (YardBay | null)[] {
  const holdings = slotHoldings(yard);
  return yard.tradeSlots.map((slot, i) => {
    if (slot === null) return null;
    const flag = slot.trade === 'export' ? EXPORT_FLAG : importFlag(state, yard);
    return { good: slot.good, loads: Math.floor(holdings[i].units / UNITS_PER_LOAD), flag };
  });
}

const shells = new Map<string, () => THREE.Object3D>();
const bakedKeeper = bakedFigure(storekeeper);

export function tradeYardModel(yard: Building, state: GameState): THREE.Object3D {
  const staffed = yard.workers > 0;
  const bays = yardBays(state, yard);
  const flags = bays.map((bay) => bay && bay.flag);
  const key = `${staffed}/${flags.join(',')}`;
  if (!shells.has(key)) shells.set(key, bakedOnce(() => yardShell(staffed, flags)));
  const shell = shells.get(key)!();
  stock(shell, bays);
  return staffed ? withKeeper(shell, staffPhase(yard), bakedKeeper()) : shell;
}

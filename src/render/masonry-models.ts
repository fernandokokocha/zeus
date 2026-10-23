import * as THREE from 'three';
import { UNITS_PER_LOAD } from '../sim/food';
import type { Building } from '../sim/state';
import { bakedOnce } from './bake';
import { type FigureParts, posedFigure } from './kit/figure';
import { box, lotGround, surface } from './kit/kit';
import { chips, columnDrum, hoist, lyingHammer, marbleBlock, mason, stockBlock, trestle } from './kit/masonry';
import { bakedFigure, staffPhase } from './staff';

const TRESTLE_TOP = 0.26;
const BENCH = { x: 1.05, z: 1.3 };
const STOCK_SPOTS = [[0.3, 1.2], [0.3, 1.5], [0.6, 1.75], [0.3, 1.8]];
const [X0, Z0, W, D, TOP] = [0.12, 0.12, 1.76, 0.62, 0.5];

function shedWalls(group: THREE.Group): void {
  group.add(box(W, TOP - 0.03, 0.12, surface('rubble'), X0 + W / 2, 0.03, Z0 + 0.06));
  for (const x of [X0 + 0.06, X0 + W - 0.06]) group.add(box(0.12, TOP - 0.03, D, surface('rubble'), x, 0.03, Z0 + D / 2));
  group.add(box(0.12, TOP - 0.03, 0.12, surface('rubble'), X0 + W / 2, 0.03, Z0 + D - 0.06));
  group.add(box(W + 0.04, 0.05, 0.05, surface('whitewash'), X0 + W / 2, TOP - 0.05, Z0 + D));
  const roof = box(W + 0.12, 0.045, D + 0.2, surface('tiles'), X0 + W / 2, TOP + 0.06, Z0 + D / 2 + 0.04);
  roof.rotation.x = -0.14;
  group.add(roof);
}

function shedContents(group: THREE.Group): void {
  for (const [x, z, turn] of [[0.45, 0.4, 0.1], [0.75, 0.42, -0.2], [0.6, 0.4, 0]] as const) group.add(stockBlock(x, z, turn));
  group.add(marbleBlock(0.6, 0.19, 0.4, 0.2, 0.15, 0.17, 0.2));
  for (const x of [1.3, 1.5]) group.add(columnDrum(x, 0.03, 0.4));
  group.add(columnDrum(1.4, 0.17, 0.4));
}

function stoneShedShell(staffed: boolean, loads: number): THREE.Object3D {
  const group = new THREE.Group();
  group.add(lotGround());
  shedWalls(group);
  shedContents(group);
  group.add(trestle(BENCH.x, BENCH.z, TRESTLE_TOP));
  group.add(marbleBlock(BENCH.x, TRESTLE_TOP + 0.035, BENCH.z, 0.2, 0.14, 0.16, 0.1));
  group.add(chips(BENCH.x - 0.05, BENCH.z, 9, 105));
  if (!staffed) group.add(lyingHammer(BENCH.x, TRESTLE_TOP + 0.175, BENCH.z));
  group.add(hoist(1.6, 1.15, 0.95, staffed ? 0.42 : 0.03));
  STOCK_SPOTS.slice(0, loads).forEach(([x, z], i) => group.add(stockBlock(x, z, i % 2 ? 0.3 : -0.2)));
  return group;
}

function withMason(shell: THREE.Object3D, phase: number, parts: FigureParts): THREE.Object3D {
  shell.add(posedFigure(BENCH.x - 0.28, BENCH.z + 0.03, 0, phase, parts, 'hammer'));
  return shell;
}

export function stoneShed(staffed: boolean, loads: number): THREE.Object3D {
  const shell = stoneShedShell(staffed, loads);
  return staffed ? withMason(shell, 0, mason()) : shell;
}

const shells = new Map<string, () => THREE.Object3D>();
const bakedMason = bakedFigure(mason);

export function masonryShopModel(shop: Building): THREE.Object3D {
  const staffed = shop.workers > 0;
  const loads = Math.floor(shop.marble / UNITS_PER_LOAD);
  const key = `${staffed}/${loads}`;
  if (!shells.has(key)) shells.set(key, bakedOnce(() => stoneShedShell(staffed, loads)));
  const shell = shells.get(key)!();
  return staffed ? withMason(shell, staffPhase(shop), bakedMason()) : shell;
}

import * as THREE from 'three';
import { BUILDING_SPECS } from '../sim/buildings';
import { UNITS_PER_LOAD } from '../sim/food';
import type { Building } from '../sim/state';
import { bakedOnce } from './bake';
import { type FigureParts, posedFigure } from './kit/figure';
import { paving } from './kit/garden';
import { type Good, MARKET, emblem, frontBaskets, clothTent, seller, standGoods, stockPile, tieredStand } from './kit/market';
import { bakedFigure, staffPhase } from './staff';

const FACING_OUT = 0;
const STAND = { x: 1.62, z0: 0.2, z1: 1.25 };
const STOCK = { x: 1.45, z: 1.42, rows: 3 };
const SELLER = { x: 1.3, z: 0.72 };
const BASKETS_AT = [0.35, 0.72, 1.09];

export function agoraFloor(): THREE.Object3D {
  const { width: W, height: D } = BUILDING_SPECS.agora;
  return paving(0.04, 0.04, W - 0.08, D - 0.08);
}

function emblemStallShell(good: Good, staffed: boolean, loads: number): THREE.Object3D {
  const group = new THREE.Group();
  group.add(clothTent(0.12, 0.15, 1.08, 1.85, 0.88, 1.22, MARKET.trim[good]));
  group.add(emblem(good, 0.64, 1.5, 1.0, 0.24));
  group.add(tieredStand(STAND.x, STAND.z0, STAND.z1));
  group.add(stockPile(good, STOCK.x, STOCK.z, loads, STOCK.rows));
  if (staffed) {
    group.add(standGoods(good, STAND.x, STAND.z0, STAND.z1));
    group.add(frontBaskets(good, 1.93, BASKETS_AT));
  }
  return group;
}

function withSeller(shell: THREE.Object3D, phase: number, parts: FigureParts): THREE.Object3D {
  shell.add(posedFigure(SELLER.x, SELLER.z, FACING_OUT, phase, parts, 'rest'));
  return shell;
}

export function emblemStall(good: Good, staffed: boolean, loads: number): THREE.Object3D {
  const shell = emblemStallShell(good, staffed, loads);
  return staffed ? withSeller(shell, 0, seller()) : shell;
}

export const VENDOR_GOODS: Record<string, Good> = { foodVendor: 'food', fleeceVendor: 'fleece', oilVendor: 'oil' };
const shells = new Map<string, () => THREE.Object3D>();
const bakedSeller = bakedFigure(seller);

export const agoraModel = bakedOnce(agoraFloor);

export function vendorModel(vendor: Building): THREE.Object3D {
  const good = VENDOR_GOODS[vendor.type];
  const staffed = vendor.workers > 0;
  const loads = Math.floor(vendor[good] / UNITS_PER_LOAD);
  const key = `${good}/${staffed}/${loads}`;
  if (!shells.has(key)) shells.set(key, bakedOnce(() => emblemStallShell(good, staffed, loads)));
  const shell = shells.get(key)!();
  return staffed ? withSeller(shell, staffPhase(vendor), bakedSeller()) : shell;
}

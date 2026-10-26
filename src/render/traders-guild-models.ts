import * as THREE from 'three';
import { BUILDING_SPECS } from '../sim/buildings';
import { bakedOnce } from './bake';
import { CLOTH, clothBolt } from './kit/cloth';
import { blueDoor, terraceBlock } from './kit/cottage';
import { type FigureParts, posedFigure } from './kit/figure';
import { paving } from './kit/garden';
import { placed } from './kit/gymnasium';
import { COLORS, box, flat } from './kit/kit';
import { cypress } from './kit/luxury';
import { clothTent, emblem, seller } from './kit/market';
import { ENTABLATURE_HEIGHT, entablature, evenly, marbleColumn, marbleStairs, marbleTerrace, pedimentRoof } from './kit/palace';
import { TAX, clerk, countingTable, strongbox, taxStele } from './kit/tax';
import { hangingCloth } from './kit/theater';
import { bakedFigure } from './staff';

const { width: W, height: D } = BUILDING_SPECS.tradersGuild;
const FACING_ROAD = 0;
const TOWARD_ROAD = -Math.PI / 2;
const DOOR = { open: 0.9, shut: 0 };
const HALL = { x0: 0.55, z0: 0.2, w: 2.9, d: 1.5, floor: 0.22, columns: 0.95 };
const CHEST = { w: 0.42, h: 0.18, d: 0.22 };
const TENT = { w: 1.1, d: 1.0, eaves: 0.82, ridge: 1.12, z: 2.75, xs: [0.95, 3.05] };
const MERCHANT = { x: 1.5, z: 3.5 };
const BANKER = { x: 1.6, z: 2.9, phase: 0.7 };

function clothChest(x: number, z: number, stocked: boolean): THREE.Object3D {
  const group = new THREE.Group();
  group.add(box(CHEST.w, CHEST.h, CHEST.d, flat(COLORS.timber), x, 0.04, z));
  const top = 0.04 + CHEST.h;
  if (stocked) group.add(clothBolt(x, top, z - 0.05, 0), clothBolt(x, top, z + 0.05, 0), clothBolt(x, top + 0.08, z, 0));
  else {
    group.add(box(CHEST.w + 0.02, 0.04, CHEST.d + 0.02, flat(TAX.chest), x, top, z));
    group.add(box(0.05, 0.05, 0.01, flat(TAX.iron), x, top - 0.04, z + CHEST.d / 2 + 0.006));
  }
  return group;
}

function stall(x: number, supplied: boolean): THREE.Object3D {
  const group = new THREE.Group();
  group.add(placed(clothTent(-TENT.d / 2, -TENT.w / 2, TENT.d / 2, TENT.w / 2, TENT.eaves, TENT.ridge, CLOTH.dyed), x, TENT.z, Math.PI / 2));
  group.add(placed(emblem('cloth', 0, TENT.ridge + 0.3, 0, 0.2), x, TENT.z, TOWARD_ROAD));
  for (const dx of [-0.25, 0.25]) for (const dz of [-0.15, 0.2]) group.add(clothChest(x + dx, TENT.z + dz, supplied));
  return group;
}

function hall(group: THREE.Group, supplied: boolean): void {
  const { x0, z0, w, d, floor, columns } = HALL;
  const front = z0 + d;
  group.add(marbleTerrace(x0, z0, w, d, floor));
  group.add(terraceBlock(x0 + 0.15, z0 + 0.08, w - 0.3, d - 0.5, floor + columns));
  for (const x of [1.4, 2.6]) group.add(blueDoor(x, front - 0.42, floor, supplied ? DOOR.open : DOOR.shut));
  for (const x of evenly(x0 + 0.15, x0 + w - 0.15, 6)) group.add(marbleColumn(x, front - 0.12, columns, floor));
  group.add(entablature(x0, z0, w, d, floor + columns));
  pedimentRoof(group, x0, z0, w, d, floor + columns + ENTABLATURE_HEIGHT, 0.55, 'blueTiles');
  group.add(marbleStairs(W / 2, front, 1.6, 3, floor / 3, 0.09));
  if (supplied) for (const x of [0.95, 3.05]) group.add(hangingCloth(x, floor + columns - 0.02, front - 0.06, 0.36, 0.5, 0, CLOTH.dyed));
}

function guildShell(supplied: boolean): THREE.Object3D {
  const group = new THREE.Group();
  group.add(paving(0.08, 0.08, W - 0.16, D - 0.16));
  hall(group, supplied);
  for (const x of TENT.xs) group.add(stall(x, supplied));
  group.add(countingTable(1.8, 2.55, 0.6, supplied));
  group.add(strongbox(2.3, 2.6, supplied, -0.3, 1.2));
  group.add(taxStele(W / 2, 3.75));
  group.add(cypress(0.2, 0.3, 0.6), cypress(3.8, 0.3, 0.6), cypress(0.2, 3.8, 0.5), cypress(3.8, 3.8, 0.5));
  return group;
}

function withStaff(shell: THREE.Object3D, merchant: FigureParts, banker: FigureParts): THREE.Object3D {
  shell.add(posedFigure(MERCHANT.x, MERCHANT.z, FACING_ROAD, 0, merchant, 'rest'));
  shell.add(posedFigure(BANKER.x, BANKER.z, FACING_ROAD, BANKER.phase, banker, 'rest'));
  return shell;
}

export function exchangeHall(supplied: boolean): THREE.Object3D {
  return withStaff(guildShell(supplied), seller(), clerk());
}

const shells = { supplied: bakedOnce(() => guildShell(true)), wanting: bakedOnce(() => guildShell(false)) };
const bakedMerchant = bakedFigure(seller);
const bakedBanker = bakedFigure(clerk);

export function tradersGuildModel(occupied: boolean, missingNeed: boolean): THREE.Object3D {
  const shell = missingNeed ? shells.wanting() : shells.supplied();
  return occupied ? withStaff(shell, bakedMerchant(), bakedBanker()) : shell;
}

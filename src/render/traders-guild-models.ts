import * as THREE from 'three';
import { BUILDING_SPECS } from '../sim/buildings';
import { bakedOnce } from './bake';
import { CLOTH, clothBolt } from './kit/cloth';
import { blueDoor, frontWindow, terraceBlock } from './kit/cottage';
import { type FigureParts, posedFigure } from './kit/figure';
import { blueColumns, paving } from './kit/garden';
import { placed } from './kit/gymnasium';
import { COLORS, box, flat } from './kit/kit';
import { clothTent, emblem, seller } from './kit/market';
import { ENTABLATURE_HEIGHT, entablature, evenly, marbleColumn, marbleStairs, marbleTerrace, pedimentRoof } from './kit/palace';
import { hipRoof, hipRoofAlongZ, leanToRoof } from './kit/roofs';
import { TAX, clerk, countingTable, strongbox, taxStele } from './kit/tax';
import { hangingCloth } from './kit/theater';
import { bakedFigure } from './staff';

const { width: W, height: D } = BUILDING_SPECS.tradersGuild;
const FACING_ROAD = 0;
const TOWARD_ROAD = -Math.PI / 2;
const TOWARD_EAST = Math.PI / 2;
const DOOR = { open: 0.9, shut: 0 };
const CHEST = { w: 0.42, h: 0.18, d: 0.22 };
const TENT = { w: 1.1, d: 1.0, eaves: 0.82, ridge: 1.12, z: 2.6, xs: [1.62, 2.72] };
const HALL = { x: 3.0, z: 0.92, w: 1.5, d: 1.15, floor: 0.16, columns: 0.72 };
const HOUSE_RISE = 0.26;
const EAVES = 0.03;
const COLONNADE = { x0: 3.3, x1: 3.8, zs: [1.95, 2.6, 3.25, 3.85] };
const MERCHANT = { x: 2.15, z: 3.5 };
const BANKER = { x: 2.0, z: 1.55, phase: 0.7 };

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

function house(group: THREE.Group, x0: number, z0: number, w: number, d: number, top: number, alongZ = false): void {
  group.add(terraceBlock(x0, z0, w, d, top));
  const roof = alongZ ? hipRoofAlongZ : hipRoof;
  group.add(roof(x0, z0, w, d, top + EAVES, HOUSE_RISE, 'blueTiles'));
}

function courtStall(x: number, z: number, supplied: boolean): THREE.Object3D {
  const group = new THREE.Group();
  group.add(placed(clothTent(-TENT.d / 2, -TENT.w / 2, TENT.d / 2, TENT.w / 2, TENT.eaves, TENT.ridge, CLOTH.dyed), x, z, Math.PI / 2));
  group.add(placed(emblem('cloth', 0, TENT.ridge + 0.3, 0, 0.2), x, z, TOWARD_ROAD));
  for (const dx of [-0.25, 0.25]) for (const dz of [-0.15, 0.2]) group.add(clothChest(x + dx, z + dz, supplied));
  return group;
}

function smallHall(supplied: boolean): THREE.Object3D {
  const group = new THREE.Group();
  const { w, d, floor, columns } = HALL;
  const [x0, z0, front] = [-w / 2, -d / 2, d / 2];
  group.add(marbleTerrace(x0, z0, w, d, floor));
  group.add(terraceBlock(x0 + 0.12, z0 + 0.06, w - 0.24, d - 0.42, floor + columns));
  group.add(blueDoor(0, front - 0.36, floor, supplied ? DOOR.open : DOOR.shut));
  for (const x of evenly(x0 + 0.12, x0 + w - 0.12, 4)) group.add(marbleColumn(x, front - 0.1, columns, floor));
  group.add(entablature(x0, z0, w, d, floor + columns));
  pedimentRoof(group, x0, z0, w, d, floor + columns + ENTABLATURE_HEIGHT, 0.4, 'blueTiles');
  group.add(marbleStairs(0, front, 1.0, 2, floor / 2, 0.09));
  if (supplied) for (const x of [x0 + 0.33, x0 + w - 0.33]) group.add(hangingCloth(x, floor + columns - 0.02, front - 0.05, 0.28, 0.4, 0, CLOTH.dyed));
  return placed(group, HALL.x, HALL.z, TOWARD_EAST);
}

function chestColonnade(group: THREE.Group, supplied: boolean): void {
  const { x0, x1, zs } = COLONNADE;
  group.add(blueColumns(zs.map((z) => [x0, z]), 0.62), blueColumns(zs.map((z) => [x1, z]), 0.78));
  group.add(leanToRoof(x0 - 0.06, zs[0] - 0.15, x1 + 0.04, zs[zs.length - 1] + 0.06, 0.68, 0.84, 'west'));
  for (let i = 0; i < zs.length - 1; i++) group.add(clothChest((x0 + x1) / 2, (zs[i] + zs[i + 1]) / 2, supplied));
}

function guildShell(supplied: boolean): THREE.Object3D {
  const group = new THREE.Group();
  group.add(paving(0.08, 0.08, W - 0.16, D - 0.16));
  house(group, 0.14, 0.14, 1.36, 1.0, 1.4);
  group.add(frontWindow(0.5, 1.14, 0.95), frontWindow(1.15, 1.14, 0.95));
  house(group, 0.14, 1.3, 0.86, 2.56, 1.05, true);
  group.add(frontWindow(0.57, 3.86, 0.62));
  for (const z of [1.9, 2.7, 3.5]) group.add(placed(blueDoor(0, 0, 0.12, supplied ? 0.4 : 0), 1.0, z, Math.PI / 2));
  group.add(smallHall(supplied));
  chestColonnade(group, supplied);
  for (const x of TENT.xs) group.add(courtStall(x, TENT.z, supplied));
  group.add(countingTable(2.0, 1.2, 0.5, supplied));
  group.add(strongbox(1.85, 0.55, supplied, 0, 0.9));
  group.add(taxStele(2.15, 3.78));
  return group;
}

function withStaff(shell: THREE.Object3D, merchant: FigureParts, banker: FigureParts): THREE.Object3D {
  shell.add(posedFigure(MERCHANT.x, MERCHANT.z, FACING_ROAD, 0, merchant, 'rest'));
  shell.add(posedFigure(BANKER.x, BANKER.z, FACING_ROAD, BANKER.phase, banker, 'rest'));
  return shell;
}

export function marketCourt(supplied: boolean): THREE.Object3D {
  return withStaff(guildShell(supplied), seller(), clerk());
}

const shells = { supplied: bakedOnce(() => guildShell(true)), wanting: bakedOnce(() => guildShell(false)) };
const bakedMerchant = bakedFigure(seller);
const bakedBanker = bakedFigure(clerk);

export function tradersGuildModel(occupied: boolean, missingNeed: boolean): THREE.Object3D {
  const shell = missingNeed ? shells.wanting() : shells.supplied();
  return occupied ? withStaff(shell, bakedMerchant(), bakedBanker()) : shell;
}

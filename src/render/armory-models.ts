import * as THREE from 'three';
import { UNITS_PER_LOAD } from '../sim/food';
import type { Building } from '../sim/state';
import { cube } from './kit/cottage';
import { anvil, shaftFurnace } from './kit/foundry';
import { lotGround, surface } from './kit/kit';
import { tiledRoof } from './kit/roofs';
import { ingotPile } from './kit/sculpture';
import { armorStand, framedDoor, hungShields } from './kit/warriors';

const CLOSED = 0;
const OPEN = 1.2;
const INGOTS_PER_LOAD = 6;
const HALL = { x0: 0.15, z0: 0.15, w: 1.3, d: 0.75, top: 0.6 };
const FURNACE = { x: 1.7, z: 0.5, height: 0.45 };
const ANVIL = { x: 1.15, z: 1.25 };
const BRONZE_SPOTS: [number, number][] = [[0.3, 1.25], [0.3, 1.55], [0.6, 1.25], [0.6, 1.55]];
const ARMOR_SPOTS: [number, number][] = [[1.45, 1.75], [1.75, 1.75], [1.75, 1.45], [1.75, 1.15]];

export function armoryModel(armory: Building): THREE.Object3D {
  const group = new THREE.Group();
  const { x0, z0, w, d, top } = HALL;
  const staffed = armory.workers > 0;
  group.add(lotGround(surface('earth')));
  group.add(cube(x0, z0, w, d, top));
  group.add(tiledRoof(x0 - 0.03, z0 - 0.05, w + 0.06, d + 0.1, top + 0.04, 0.22));
  group.add(framedDoor(0.45, z0 + d, 0.03, staffed ? OPEN : CLOSED));
  group.add(hungShields(0.8, 1.4, 0.38, z0 + d, 2));
  group.add(shaftFurnace(FURNACE.x, FURNACE.z, FURNACE.height, staffed));
  group.add(anvil(ANVIL.x, ANVIL.z));
  const bronze = Math.floor(armory.bronze / UNITS_PER_LOAD);
  BRONZE_SPOTS.slice(0, bronze).forEach(([x, z]) => group.add(ingotPile(x, z, INGOTS_PER_LOAD)));
  const armor = Math.floor(armory.armor / UNITS_PER_LOAD);
  ARMOR_SPOTS.slice(0, armor).forEach(([x, z]) => group.add(armorStand(x, z)));
  return group;
}

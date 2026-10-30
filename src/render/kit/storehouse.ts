import * as THREE from 'three';
import { type FigureParts, at, head, legs, torso } from './figure';
import { COLORS, box, flat, surface } from './kit';
import { statue } from './luxury';
import { MARKET, wickerBasket } from './market';
import { marbleBlock } from './masonry';
import { amphora } from './oil';
import { logStack } from './timber';

export const STOREHOUSE = {
  twine: 0xa8875a,
  bronze: 0xd08a34,
  pallet: 0x8a6238,
  tablet: 0xd8b45a,
};

export const LOT_3 = 3;
const BASE = 0.03;
export const GROUND_EDGE = 0.05;
export const BAY_PAD = 0.035;
const STACKED_LOGS = 0.7;
const STATUE_SIZE = 1.25;

export function storeGround(material: THREE.Material): THREE.Mesh {
  return box(LOT_3 - 2 * GROUND_EDGE, BASE, LOT_3 - 2 * GROUND_EDGE, material, LOT_3 / 2, 0, LOT_3 / 2);
}

function bale(y: number, turn: number): THREE.Object3D {
  const group = new THREE.Group();
  group.add(box(0.24, 0.13, 0.18, flat(MARKET.fleece), 0, 0, 0));
  for (const dx of [-0.07, 0.07]) group.add(box(0.02, 0.134, 0.184, flat(STOREHOUSE.twine), dx, 0, 0));
  group.position.y = y;
  group.rotation.y = turn;
  return group;
}

export function fleeceBales(): THREE.Object3D {
  const group = new THREE.Group();
  group.add(bale(0, 0), bale(0.13, 0.35));
  return group;
}

export function oliveBaskets(): THREE.Object3D {
  const group = new THREE.Group();
  for (const [x, z] of [[-0.08, -0.05], [0.08, -0.05], [0, 0.09]]) group.add(wickerBasket(x, z, MARKET.olive, 0));
  return group;
}

export function oilAmphorae(): THREE.Object3D {
  const group = new THREE.Group();
  for (const [x, z] of [[-0.065, -0.04], [0.065, 0.05]]) group.add(amphora(x, z, 0));
  return group;
}

export function stackedLogs(): THREE.Object3D {
  const stack = logStack(0, 0, 0);
  stack.position.y = 0;
  stack.scale.setScalar(STACKED_LOGS);
  return stack;
}

export function marbleBlocks(): THREE.Object3D {
  const group = new THREE.Group();
  group.add(box(0.26, 0.03, 0.22, flat(STOREHOUSE.pallet), 0, 0, 0));
  group.add(marbleBlock(0, 0.03, 0, 0.22, 0.13, 0.18));
  group.add(marbleBlock(0.01, 0.16, 0, 0.15, 0.1, 0.13, 0.5));
  return group;
}

export function bronzeIngots(): THREE.Object3D {
  const group = new THREE.Group();
  for (let layer = 0; layer < 3; layer++) {
    for (const offset of [-0.06, 0, 0.06]) {
      const ingot = box(0.2, 0.035, 0.05, flat(STOREHOUSE.bronze), 0, layer * 0.037, offset);
      ingot.rotation.y = layer % 2 ? Math.PI / 2 : 0;
      group.add(ingot);
    }
  }
  return group;
}

export function crated(): THREE.Object3D {
  const group = new THREE.Group();
  group.add(box(0.2, 0.03, 0.2, flat(STOREHOUSE.pallet), 0, 0, 0));
  const figure = statue(0, 0);
  figure.position.y = 0.03;
  figure.scale.setScalar(STATUE_SIZE);
  group.add(figure);
  return group;
}

export function storekeeper(): FigureParts {
  const upper = torso(COLORS.aegean, [at(0.11, 0.02, 0.06), at(0.11, 0.02, -0.06)]);
  upper.add(box(0.03, 0.1, 0.13, flat(STOREHOUSE.tablet), 0.13, -0.03, 0));
  return { legs: legs(), torso: upper, head: head('bare') };
}

export function bayPad(x: number, z: number, size: number, floor: number): THREE.Mesh {
  return box(size, BAY_PAD, size, surface('ashlar'), x, floor, z);
}

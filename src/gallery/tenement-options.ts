import * as THREE from 'three';
import { blueDoor, frontWindow, pergola, sideWindow, terraceBlock, tidyWalls } from '../render/kit/cottage';
import { plankOnStones, sack } from '../render/kit/food';
import { BLOOM, figTree, flowerPot, herm, paving } from '../render/kit/garden';
import { COLORS, box, flat, lotGround } from '../render/kit/kit';
import { bucket, cistern } from '../render/kit/water';
import { fleece, fleeceBalcony, woolBasket } from '../render/kit/wool';
import { tenementModel } from '../render/house-models';
import type { DesignOption } from './options';

const vine = (i: number) => (i % 3 ? 0x5f8a34 : 0x7da044);

function homesteadBlock(group: THREE.Group, doorX: number): void {
  group.add(lotGround());
  group.add(terraceBlock(0.14, 0.14, 0.94, 0.7, 1.0));
  group.add(blueDoor(doorX, 0.84, 0.12, 0.5));
  for (const x of [0.4, 0.82]) group.add(frontWindow(x, 0.84, 0.72));
}

function blueRailing(x0: number, z0: number, w: number, d: number, y: number): THREE.Object3D {
  const group = new THREE.Group();
  const rail = flat(COLORS.aegean);
  for (const [rw, rd, x, z] of [[w, 0.02, x0 + w / 2, z0 + d], [0.02, d, x0, z0 + d / 2], [0.02, d, x0 + w, z0 + d / 2], [w, 0.02, x0 + w / 2, z0]]) {
    group.add(box(rw, 0.1, rd, rail, x, y, z));
  }
  return group;
}

function threeWings(): THREE.Object3D {
  const group = new THREE.Group();
  homesteadBlock(group, 0.92);
  group.add(terraceBlock(1.1, 0.14, 0.76, 0.7, 1.0));
  for (const x of [1.3, 1.7]) group.add(frontWindow(x, 0.84, 0.3));
  group.add(fleeceBalcony(1.02, 1.86, 0.84, 0.55));
  group.add(terraceBlock(0.14, 0.92, 0.6, 0.9, 0.56));
  for (const z of [1.15, 1.5]) group.add(sideWindow(0.74, z, 0.3));
  group.add(flowerPot(0.3, 0.58, 1.2, BLOOM.red), flowerPot(0.55, 0.58, 1.5, BLOOM.pink));
  group.add(paving(0.78, 0.88, 1.08, 0.98));

  group.add(cistern(1.5, 1.24, 0.38, 0.28));
  group.add(bucket(1.22, 0.04, 1.16, true));
  group.add(herm(1.72, 1.66));
  group.add(flowerPot(0.88, 0.04, 1.0, BLOOM.yellow), flowerPot(0.88, 0.04, 1.7, BLOOM.red), flowerPot(1.78, 0.04, 1.0, BLOOM.pink));
  group.add(plankOnStones(1.2, 1.62, 0, 3));
  group.add(woolBasket(0.96, 1.36));
  group.add(tidyWalls(1.0, 1.28, 0.9));
  return group;
}

function towerCorner(): THREE.Object3D {
  const group = new THREE.Group();
  homesteadBlock(group, 0.84);
  group.add(fleeceBalcony(0.18, 1.04, 0.84, 0.55));
  group.add(terraceBlock(1.3, 0.14, 0.56, 0.56, 1.5));
  for (const y of [0.3, 0.72, 1.14]) group.add(frontWindow(1.58, 0.7, y));
  group.add(blueRailing(1.3, 0.14, 0.56, 0.56, 1.52));
  group.add(flowerPot(1.45, 1.52, 0.3, BLOOM.red), flowerPot(1.7, 1.52, 0.5, BLOOM.yellow));
  group.add(terraceBlock(0.14, 0.92, 0.46, 0.84, 0.46));
  group.add(sideWindow(0.6, 1.3, 0.26));
  group.add(pergola(0.62, 1.0, 1.0, 1.7, vine, 0.38));
  group.add(fleece(0.32, 1.2, 0.4, 0.48), fleece(0.36, 1.5, 1.6, 0.48));

  group.add(figTree(1.5, 1.4, 1.3));
  group.add(cistern(1.6, 0.98, 0.38, 0.26));
  group.add(bucket(1.32, 0.03, 0.96, true));
  group.add(herm(1.1, 1.74));
  group.add(flowerPot(1.78, 0.04, 1.76, BLOOM.pink));
  group.add(plankOnStones(0.82, 1.3, Math.PI / 2, 3));
  group.add(woolBasket(1.12, 1.0), sack(1.1, 1.25, 0.4));
  group.add(tidyWalls(1.22, 1.5, 0.84));
  return group;
}

export const TENEMENT_OPTIONS: DesignOption[] = [
  {
    name: 'A · Three wings',
    notes: [
      'Two-storey blocks fill both back corners; a lower wing takes the front-left',
      'The balcony with fleeces moves to the new right-hand block',
      'The open corner is a paved court with a cistern, a herm and flower pots',
      'From above: a white C around a pale square',
    ],
    build: threeWings,
  },
  {
    name: 'B · Tower & fig tree',
    notes: [
      'A slim three-storey tower in the back-right corner, potted roof with blue railing',
      'A low room front-left with a vine pergola along the courtyard',
      'A big fig tree shades the earth courtyard',
      'Three heights at once: tall tower, Homestead block, low room',
    ],
    build: towerCorner,
  },
  {
    name: 'C · Portico court',
    notes: [
      'Two low wings in the right-back and left-front corners, each with a blue-columned portico',
      'The cistern sits in the middle of the court with a herm, pots at the corners',
      'Fleeces dry on the low flat roofs',
      'The first step toward the Townhouse’s colonnaded court',
    ],
    build: tenementModel,
  },
];

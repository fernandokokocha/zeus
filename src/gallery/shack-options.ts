import * as THREE from 'three';
import { blueDoor, brushwood, pergola, poorCube, roughWall, windowHole } from '../render/kit/cottage';
import {
  FOOD, bowl, domeOven, plankOnStones, figBasket, grainBasket, groundMat, hen, loaf, onionString, pithos, sack,
} from '../render/kit/food';
import { box, cylinder, flat, jar, lotGround, path, shrubAt, stone, surface, wattleFence, woodpile } from '../render/kit/kit';
import { shackModel } from '../render/house-models';
import type { DesignOption } from './options';

const OLIVE = 0x4a5a2a;

function patchedCottage(): THREE.Object3D {
  const group = new THREE.Group();
  group.add(lotGround());
  const x0 = 0.16;
  const z0 = 0.16;
  const w = 0.95;
  const d = 0.7;
  const front = z0 + d;
  group.add(path([[x0 + 0.28, front + 0.05], [0.5, 1.4], [0.55, 1.92]], 0.15));
  group.add(poorCube(x0, z0, w, d, 0.5));
  group.add(blueDoor(x0 + 0.28, front, 0.08, 0.5));
  group.add(windowHole(x0 + 0.72, front, 0.3));

  group.add(pergola(1.26, 1.82, 0.2, 0.7, brushwood, 0.34));
  group.add(woodpile(1.68, 0.4, Math.PI / 2));
  group.add(jar(1.38, 0.03, 0.32, 0.85), jar(1.5, 0.03, 0.28, 0.75));
  group.add(sack(1.4, 0.58, 0.4));

  group.add(domeOven(0.36, 1.28, true));
  group.add(plankOnStones(0.84, 1.2, 0.3, 4));
  group.add(groundMat(1.3, 1.2, 0.36, 0.26, FOOD.fig, -0.2));
  group.add(figBasket(1.62, 1.02), grainBasket(1.66, 1.28), sack(1.0, 0.98, 1.3));
  group.add(hen(1.1, 1.55, 0.5), hen(1.3, 1.62, 2.4, 0xa0683a));

  group.add(roughWall([[0.12, 1.88], [0.42, 1.88]], 500));
  group.add(roughWall([[0.7, 1.88], [1.88, 1.88], [1.88, 0.9]], 520));
  group.add(shrubAt(0.2, 1.65, 0.8, 8));
  return group;
}

function reedShade(): THREE.Object3D {
  const group = new THREE.Group();
  group.add(lotGround());
  const x0 = 0.16;
  const z0 = 0.16;
  const w = 1.0;
  const d = 0.66;
  const front = z0 + d;
  group.add(poorCube(x0, z0, w, d, 0.48));
  group.add(blueDoor(x0 + 0.78, front, 0.08, 0.5));
  group.add(windowHole(x0 + 0.3, front, 0.28));
  group.add(path([[x0 + 0.78, front + 0.05], [1.0, 1.4], [1.05, 1.92]], 0.15));

  group.add(pergola(0.24, 0.8, 0.98, 1.46, brushwood, 0.34));
  for (const x of [0.4, 0.62]) group.add(onionString(x, 0.35, 1.46, 4));
  group.add(box(0.42, 0.008, 0.28, surface('hide'), 0.52, 0.03, 1.22));
  group.add(loaf(0.4, 0.04, 1.16), loaf(0.47, 0.04, 1.2));
  group.add(bowl(0.6, 0.04, 1.14, OLIVE), bowl(0.66, 0.04, 1.28, 0xe8dcb8));
  group.add(jar(0.42, 0.04, 1.3, 0.45));

  group.add(pithos(1.38, 0.32));
  group.add(jar(1.56, 0.03, 0.28, 0.8));
  group.add(sack(1.62, 0.52, 0.3), sack(1.48, 0.58, 1.7));
  group.add(figBasket(1.3, 1.0), grainBasket(1.48, 1.08));

  for (let r = 0; r < 3; r++) {
    for (let p = 0; p < 5; p++) {
      group.add(cylinder(0.006, 0.006, 0.06, flat(0x7a9a3a), 1.36 + r * 0.14, 0.03, 1.38 + p * 0.09, 4));
      group.add(stone(0.018, 1.36 + r * 0.14, 0.04, 1.38 + p * 0.09, 600 + r * 5 + p, FOOD.onion));
    }
  }
  group.add(wattleFence([[1.26, 1.32], [1.72, 1.32], [1.72, 1.84]], 31));
  group.add(hen(0.95, 1.2, 1.2), hen(0.2, 1.65, 0.3, 0xa0683a), hen(0.9, 1.72, 2.2));
  group.add(roughWall([[0.12, 1.88], [0.92, 1.88]], 540));
  group.add(roughWall([[1.2, 1.88], [1.88, 1.88], [1.88, 0.8]], 560));
  return group;
}

export const SHACK_OPTIONS: DesignOption[] = [
  {
    name: 'A · Patched cottage & yard oven',
    notes: [
      'A small cube whose whitewash is flaking off the mud brick, reed roof held down by stones',
      'One blue door, a bare window hole, a brushwood lean-to for wood and jars',
      'In the yard: lit oven, loaves on a plank on two stones, figs drying on a mat',
      'Baskets of figs and wheat, a sack, two hens; loose dry-stone walls',
    ],
    build: patchedCottage,
  },
  {
    name: 'B · Reed shade & meal',
    notes: [
      'The same poor cottage, longer and lower',
      'A brushwood shade over a hide spread with bread, olives, curds and a jug',
      'An onion patch behind wattle; onions hanging from the shade',
      'A storage jar sunk by the wall, sacks, baskets, hens about the yard',
    ],
    build: reedShade,
  },
  {
    name: 'C · Threshing yard',
    notes: [
      'The small cottage, now with clean whitewashed walls like Hut B; reed roof held down by stones',
      'Most of the lot is a stone-ringed threshing floor heaped with wheat',
      'A raised straw granary with two sacks, a basket of grain, bread on a plank',
      'A tethered goat and a hen; no jars, so oil can be the next visible step',
    ],
    build: shackModel,
  },
];

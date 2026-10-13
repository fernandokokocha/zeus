import * as THREE from 'three';
import { handcart, hideTent, journeyLoad, leanToHut, tripodPot } from './kit/camp';
import { blueDoor, frontWindow, poorCube, roughWall, terraceBlock, tidyWalls, whiteCottage, windowHole, woodenBalcony } from './kit/cottage';
import { goat, grainBasket, hen, plankOnStones, raisedGranary, sack, threshingFloor } from './kit/food';
import {
  COLORS, basket, cylinder, flat, lotGround, path, scaled, shrubAt, sphere, surface, tippedJar, wattleFence, woodpile,
} from './kit/kit';
import { bucket, cistern, wateredBeds } from './kit/water';
import { fleece, fleeceBalcony, woolBasket } from './kit/wool';
import { BLOOM, flowerPot, herm, paving, portico } from './kit/garden';
import { cypress } from './kit/luxury';
import { steps, volume, windowsFront, windowsSide } from './kit/blocks';
import { amphora, amphoraRow } from './kit/oil';
import { tiledRoof, tiledRoofAlongZ } from './kit/roofs';

export function hutModel(): THREE.Object3D {
  const group = new THREE.Group();
  group.add(lotGround());
  group.add(path([[0.55, 0.85], [0.9, 1.3], [1.0, 1.92]], 0.15));

  group.add(leanToHut(0.14, 0.14, 0.82, 0.64));
  group.add(hideTent(1.48, 0.5));
  group.add(tripodPot(0.95, 1.05));
  group.add(handcart(1.48, 1.42, -0.5, journeyLoad()));

  for (const [x, z, c] of [[1.12, 0.28, COLORS.hide], [1.06, 0.4, 0x8a6a45]]) group.add(scaled(sphere(0.07, flat(c), x, 0.09, z), 1.2, 0.75, 1));
  const bedroll = cylinder(0.04, 0.04, 0.24, surface('hide'), 0, 0, 0, 10);
  bedroll.rotation.z = Math.PI / 2;
  bedroll.position.set(1.8, 0.07, 1.0);
  group.add(bedroll);

  group.add(wattleFence([[0.1, 1.86], [0.1, 0.95]], 9));
  group.add(tippedJar(0.3, 1.25, 1.2));
  group.add(basket(0.45, 1.55, null));
  group.add(woodpile(0.3, 1.0, 0));
  group.add(shrubAt(1.85, 1.85, 0.9, 11), shrubAt(0.55, 1.85, 0.7, 12));
  return group;
}

export function shackModel(): THREE.Object3D {
  const group = new THREE.Group();
  group.add(lotGround());
  const x0 = 0.14;
  const z0 = 0.14;
  const w = 0.86;
  const d = 0.68;
  const front = z0 + d;
  group.add(poorCube(x0, z0, w, d, 0.5, 'whitewash'));
  group.add(blueDoor(x0 + 0.26, front, 0.08, 0.5));
  group.add(windowHole(x0 + 0.64, front, 0.3));
  group.add(path([[x0 + 0.26, front + 0.05], [0.42, 1.4], [0.46, 1.92]], 0.15));

  group.add(raisedGranary(1.55, 0.36));
  group.add(sack(1.25, 0.34, 0.4), sack(1.3, 0.5, 1.1));
  group.add(threshingFloor(1.34, 1.26, 0.36));
  group.add(grainBasket(1.12, 0.9));
  group.add(plankOnStones(0.3, 1.2, 1.4, 3));
  group.add(goat(1.72, 1.72, 2.6));
  group.add(cylinder(0.01, 0.01, 0.12, flat(COLORS.timber), 1.86, 0.03, 1.62, 4));
  group.add(hen(0.86, 1.58, 0.9));

  group.add(roughWall([[0.12, 1.88], [0.32, 1.88]], 580));
  group.add(roughWall([[0.6, 1.88], [1.88, 1.88]], 600));
  return group;
}

export function hovelModel(): THREE.Object3D {
  const group = new THREE.Group();
  group.add(lotGround());
  group.add(whiteCottage(0.14, 0.14, 0.9, 0.7, 0.26, 0.68));
  group.add(poorCube(1.1, 0.14, 0.56, 0.5, 0.42, 'whitewash'));
  group.add(windowHole(1.38, 0.64, 0.24));
  group.add(path([[0.4, 0.88], [0.44, 1.4], [0.48, 1.92]], 0.15));

  group.add(cistern(1.5, 0.96, 0.46, 0.34));
  group.add(bucket(1.2, 0.03, 0.9, true), bucket(1.24, 0.03, 1.02, false));
  group.add(wateredBeds(0.7, 1.26, 0.56, 3));

  group.add(threshingFloor(1.5, 1.52, 0.24));
  group.add(raisedGranary(1.78, 0.48));
  group.add(sack(1.82, 0.76, 0.4));
  group.add(plankOnStones(0.24, 1.2, 1.4, 3));
  group.add(goat(0.3, 1.7, 0.4));
  group.add(tidyWalls(0.32, 0.6, 1.2));
  return group;
}

export function homesteadModel(): THREE.Object3D {
  const group = new THREE.Group();
  group.add(lotGround());
  group.add(terraceBlock(0.14, 0.14, 0.94, 0.7, 1.0));
  group.add(blueDoor(0.4, 0.84, 0.12, 0.5));
  group.add(windowHole(0.82, 0.84, 0.3));
  for (const x of [0.4, 0.82]) group.add(frontWindow(x, 0.84, 0.72));
  group.add(fleeceBalcony(0.18, 1.04, 0.84, 0.55));
  group.add(terraceBlock(1.14, 0.14, 0.56, 0.5, 0.46));
  group.add(windowHole(1.42, 0.64, 0.24));
  group.add(path([[0.4, 1.04], [0.44, 1.4], [0.48, 1.92]], 0.15));

  group.add(cistern(1.5, 1.0, 0.42, 0.32));
  group.add(bucket(1.2, 0.03, 1.1, true));
  group.add(threshingFloor(1.5, 1.54, 0.24));
  group.add(raisedGranary(1.8, 0.5));
  group.add(woolBasket(0.66, 1.12), woolBasket(0.84, 1.16));
  group.add(wateredBeds(0.7, 1.3, 0.5, 3));
  group.add(plankOnStones(0.24, 1.26, 1.4, 3));
  group.add(goat(0.3, 1.7, 0.4));
  group.add(tidyWalls(0.32, 0.6, 1.2));
  return group;
}

export function tenementModel(): THREE.Object3D {
  const group = new THREE.Group();
  group.add(lotGround());
  group.add(terraceBlock(0.14, 0.14, 0.94, 0.7, 1.0));
  group.add(blueDoor(0.84, 0.84, 0.12, 0.5));
  for (const x of [0.4, 0.82]) group.add(frontWindow(x, 0.84, 0.72));
  group.add(terraceBlock(1.14, 0.14, 0.72, 0.56, 0.5));
  group.add(terraceBlock(0.14, 0.9, 0.46, 0.9, 0.5));
  group.add(portico(1.04, 0.7, 1.86, 0.92, 0.42, [[1.12, 0.88], [1.46, 0.88], [1.8, 0.88]]));
  group.add(portico(0.6, 0.92, 0.82, 1.8, 0.42, [[0.78, 1.0], [0.78, 1.38], [0.78, 1.74]]));
  group.add(fleece(1.3, 0.36, 0.4, 0.52), fleece(1.62, 0.42, 1.8, 0.52), fleece(0.34, 1.3, 0.9, 0.52));
  group.add(fleece(1.4, 0.8, 0.2, 0.48));
  group.add(paving(0.82, 0.92, 1.04, 0.94));

  group.add(cistern(1.32, 1.36, 0.42, 0.42));
  group.add(herm(1.32, 1.12));
  group.add(flowerPot(1.0, 0.04, 1.06, BLOOM.red), flowerPot(1.66, 0.04, 1.06, BLOOM.pink));
  group.add(flowerPot(1.0, 0.04, 1.66, BLOOM.yellow), flowerPot(1.66, 0.04, 1.66, BLOOM.red));
  group.add(bucket(1.04, 0.04, 1.36, true));
  group.add(plankOnStones(1.32, 1.76, 0, 3));
  group.add(woolBasket(0.7, 1.2), sack(0.7, 1.5, 0.4));
  group.add(tidyWalls(0.92, 1.1, 0.92));
  return group;
}

export function apartmentModel(): THREE.Object3D {
  const group = new THREE.Group();
  group.add(lotGround());
  group.add(terraceBlock(0.14, 0.14, 0.94, 0.7, 1.0));
  group.add(blueDoor(0.84, 0.84, 0.12, 0.5));
  for (const x of [0.4, 0.82]) group.add(frontWindow(x, 0.84, 0.72));
  group.add(tiledRoof(0.14, 0.14, 0.94, 0.7, 0.97, 0.26, 'blueTiles'));
  group.add(terraceBlock(1.14, 0.14, 0.72, 0.56, 0.92));
  for (const x of [1.3, 1.7]) group.add(frontWindow(x, 0.7, 0.62));
  group.add(tiledRoof(1.14, 0.14, 0.72, 0.56, 0.89, 0.22, 'blueTiles'));
  group.add(terraceBlock(0.14, 0.9, 0.46, 0.9, 0.92));
  group.add(tiledRoofAlongZ(0.14, 0.9, 0.46, 0.9, 0.89, 0.2, 'blueTiles'));
  group.add(portico(1.04, 0.7, 1.86, 0.92, 0.42, [[1.12, 0.88], [1.46, 0.88], [1.8, 0.88]]));
  group.add(portico(0.6, 0.92, 0.82, 1.8, 0.42, [[0.78, 1.0], [0.78, 1.38], [0.78, 1.74]]));
  group.add(paving(0.82, 0.92, 1.04, 0.94));
  group.add(cistern(1.32, 1.36, 0.42, 0.42));
  group.add(bucket(1.04, 0.04, 1.36, true));
  group.add(plankOnStones(1.32, 1.76, 0, 3));
  group.add(woolBasket(0.7, 1.2), sack(0.7, 1.5, 0.4));
  group.add(tidyWalls(0.92, 1.1, 0.92));
  group.add(amphoraRow(1.2, 0.78, 1.72, 0.78, 5));
  group.add(herm(1.32, 1.12));
  group.add(amphora(1.0, 1.06), amphora(1.66, 1.06));
  group.add(flowerPot(1.0, 0.04, 1.66, BLOOM.yellow), flowerPot(1.66, 0.04, 1.66, BLOOM.red));
  return group;
}

export function townhouseModel(): THREE.Object3D {
  const group = new THREE.Group();
  group.add(lotGround());
  volume(group, 0.16, 0.16, 0.76, 0.84, 1.5);
  windowsFront(group, [0.36, 0.72], 1.0, [0.72, 1.12]);
  group.add(woodenBalcony(0.2, 0.88, 1.0, 0.95));
  volume(group, 1.04, 0.3, 0.8, 0.76, 1.24);
  windowsFront(group, [1.26, 1.62], 1.06, [0.66, 0.98]);
  windowsSide(group, 1.84, [0.5, 0.86], [0.66, 0.98]);
  volume(group, 0.5, 1.0, 1.0, 0.64, 0.62);
  group.add(blueDoor(1.0, 1.64, 0.1, 0.4));
  windowsFront(group, [0.68, 1.32], 1.64, [0.3]);
  windowsSide(group, 1.5, [1.32], [0.3]);
  steps(group, 1.0, 1.64, 0.32);

  group.add(flowerPot(0.3, 0.04, 1.2, BLOOM.red), flowerPot(0.3, 0.04, 1.5, BLOOM.yellow), flowerPot(1.66, 0.04, 1.22, BLOOM.pink));
  group.add(amphora(1.66, 1.5), amphora(1.78, 1.44));
  group.add(cypress(0.24, 1.78, 0.4), cypress(1.78, 1.78, 0.4));
  return group;
}

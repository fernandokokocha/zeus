import * as THREE from 'three';
import { handcart, hideTent, journeyLoad, leanToHut, tripodPot } from './kit/camp';
import { blueDoor, frontWindow, poorCube, roughWall, sideWindow, terraceBlock, tidyWalls, whiteCottage, windowHole } from './kit/cottage';
import { goat, grainBasket, hen, plankOnStones, raisedGranary, sack, threshingFloor } from './kit/food';
import {
  COLORS, basket, cylinder, flat, lotGround, path, scaled, shrubAt, sphere, surface, tippedJar, wattleFence, woodpile,
} from './kit/kit';
import { bucket, cistern, wateredBeds } from './kit/water';
import { fleece, fleeceBalcony, woolBasket } from './kit/wool';
import { BLOOM, blueColumns, flowerPot, herm, paving, portico } from './kit/garden';
import { cypress, statue } from './kit/luxury';
import { amphora, amphoraRow, oliveTree } from './kit/oil';
import { hipRoof, hipRoofAlongZ, leanToRoof } from './kit/roofs';

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

const EAVES = 0.03;
const PORTICO_HEIGHT = 0.42;
const RIGHT_PORTICO: [number, number][] = [[1.12, 0.88], [1.46, 0.88], [1.8, 0.88]];
const LEFT_PORTICO: [number, number][] = [[0.78, 1.0], [0.78, 1.38], [0.78, 1.74]];
const APARTMENT = { main: 1.0, rightWing: 0.92, leftWing: 0.5 };

export function apartmentModel(): THREE.Object3D {
  const group = new THREE.Group();
  group.add(lotGround());
  group.add(terraceBlock(0.14, 0.14, 0.94, 0.7, APARTMENT.main));
  group.add(blueDoor(0.84, 0.84, 0.12, 0.5));
  for (const x of [0.4, 0.82]) group.add(frontWindow(x, 0.84, 0.72));
  group.add(hipRoof(0.14, 0.14, 0.94, 0.7, APARTMENT.main + EAVES, 0.22, 'blueTiles'));

  group.add(terraceBlock(1.14, 0.14, 0.72, 0.56, APARTMENT.rightWing));
  for (const x of [1.3, 1.7]) group.add(frontWindow(x, 0.7, 0.66));
  group.add(hipRoof(1.14, 0.14, 0.72, 0.56, APARTMENT.rightWing + EAVES, 0.18, 'blueTiles'));
  group.add(blueColumns(RIGHT_PORTICO, PORTICO_HEIGHT));
  group.add(leanToRoof(1.08, 0.7, 1.86, 0.94, 0.47, 0.6, 'south'));

  group.add(terraceBlock(0.14, 0.9, 0.46, 0.9, APARTMENT.leftWing));
  group.add(portico(0.6, 0.92, 0.82, 1.8, PORTICO_HEIGHT, LEFT_PORTICO));
  group.add(fleece(0.34, 1.3, 0.9, 0.52), fleece(0.66, 1.4, 1.6, 0.48));

  group.add(paving(0.82, 0.92, 1.04, 0.94));
  group.add(cistern(1.32, 1.36, 0.42, 0.42));
  group.add(herm(1.32, 1.12));
  group.add(bucket(1.04, 0.04, 1.36, true));
  group.add(plankOnStones(1.32, 1.76, 0, 3));
  group.add(woolBasket(0.7, 1.2), sack(0.7, 1.5, 0.4));
  group.add(flowerPot(1.0, 0.04, 1.66, BLOOM.yellow), flowerPot(1.66, 0.04, 1.66, BLOOM.red));
  group.add(tidyWalls(0.92, 1.1, 0.92));
  group.add(amphoraRow(1.2, 0.78, 1.72, 0.78, 5));
  group.add(amphora(1.0, 1.06), amphora(1.66, 1.06));
  return group;
}

const TOWNHOUSE = { main: 1.05, wing: 0.9, column: 0.5, leanLow: 0.55, leanHigh: 0.68, wall: 0.36, gate: 1.01 };

export function townhouseModel(): THREE.Object3D {
  const group = new THREE.Group();
  group.add(lotGround());
  group.add(terraceBlock(0.14, 0.14, 0.94, 0.7, TOWNHOUSE.main));
  group.add(blueDoor(0.84, 0.84, 0.12, 0.5));
  group.add(frontWindow(0.4, 0.84, 0.76));
  group.add(hipRoof(0.14, 0.14, 0.94, 0.7, TOWNHOUSE.main + EAVES, 0.22, 'blueTiles'));

  group.add(terraceBlock(1.14, 0.14, 0.72, 0.56, TOWNHOUSE.wing));
  group.add(sideWindow(1.86, 0.42, 0.6));
  group.add(hipRoof(1.14, 0.14, 0.72, 0.56, TOWNHOUSE.wing + EAVES, 0.18, 'blueTiles'));
  group.add(blueColumns([[1.14, 0.9], [1.5, 0.9], [1.84, 0.9]], TOWNHOUSE.column));
  group.add(leanToRoof(1.08, 0.7, 1.86, 0.94, TOWNHOUSE.leanLow, TOWNHOUSE.leanHigh, 'south'));

  group.add(terraceBlock(0.14, 0.9, 0.46, 0.9, TOWNHOUSE.wing));
  group.add(frontWindow(0.37, 1.8, 0.6));
  group.add(hipRoofAlongZ(0.14, 0.9, 0.46, 0.9, TOWNHOUSE.wing + EAVES, 0.16, 'blueTiles'));
  group.add(blueColumns([[0.8, 1.0], [0.8, 1.37], [0.8, 1.74]], TOWNHOUSE.column));
  group.add(leanToRoof(0.6, 0.9, 0.84, 1.78, TOWNHOUSE.leanLow, TOWNHOUSE.leanHigh, 'east'));

  group.add(terraceBlock(0.6, 1.8, TOWNHOUSE.gate - 0.74, 0.08, TOWNHOUSE.wall));
  group.add(terraceBlock(TOWNHOUSE.gate + 0.14, 1.8, 1.72 - TOWNHOUSE.gate, 0.08, TOWNHOUSE.wall));
  group.add(terraceBlock(1.78, 0.94, 0.08, 0.86, TOWNHOUSE.wall));
  group.add(blueColumns([[0.87, 1.92], [1.15, 1.92]], 0.42));
  group.add(blueDoor(TOWNHOUSE.gate, 1.82, 0.03, 0.4));
  group.add(hipRoof(0.82, 1.74, 0.38, 0.22, 0.48, 0.1, 'blueTiles'));

  group.add(paving(0.84, 0.94, 1.02, 0.86));
  group.add(cistern(1.06, 1.26, 0.3, 0.3));
  group.add(oliveTree(1.6, 1.5, 1.1));
  group.add(statue(1.36, 1.12, -0.6));
  group.add(cypress(1.76, 1.04, 0.42), cypress(1.0, 1.66, 0.36));
  group.add(flowerPot(1.3, 0.04, 1.66, BLOOM.red), flowerPot(1.76, 0.04, 1.72, BLOOM.yellow));
  group.add(amphoraRow(1.24, 0.78, 1.7, 0.78, 4));
  return group;
}

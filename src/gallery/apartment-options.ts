import * as THREE from 'three';
import { blueDoor, frontWindow, terraceBlock, tidyWalls } from '../render/kit/cottage';
import { plankOnStones, sack } from '../render/kit/food';
import { BLOOM, flowerPot, herm, paving, portico } from '../render/kit/garden';
import { lotGround } from '../render/kit/kit';
import { amphora, amphoraRow } from '../render/kit/oil';
import { hipRoof, hipRoofAlongZ } from '../render/kit/roofs';
import { bucket, cistern } from '../render/kit/water';
import { fleece, woolBasket } from '../render/kit/wool';
import { apartmentModel } from '../render/house-models';
import type { DesignOption } from './options';

const RIGHT_PORTICO: [number, number][] = [[1.12, 0.88], [1.46, 0.88], [1.8, 0.88]];
const LEFT_PORTICO: [number, number][] = [[0.78, 1.0], [0.78, 1.38], [0.78, 1.74]];
const PORTICO_HEIGHT = 0.42;
const LOW_WING = 0.5;
const MAIN_TOP = 1.0;
const EAVES = 0.03;

function mainBlock(group: THREE.Group): void {
  group.add(terraceBlock(0.14, 0.14, 0.94, 0.7, MAIN_TOP));
  group.add(blueDoor(0.84, 0.84, 0.12, 0.5));
  for (const x of [0.4, 0.82]) group.add(frontWindow(x, 0.84, 0.72));
  group.add(hipRoof(0.14, 0.14, 0.94, 0.7, MAIN_TOP + EAVES, 0.22, 'blueTiles'));
}

function rightWing(group: THREE.Group, top: number): void {
  group.add(terraceBlock(1.14, 0.14, 0.72, 0.56, top));
}

function leftWing(group: THREE.Group): void {
  group.add(terraceBlock(0.14, 0.9, 0.46, 0.9, LOW_WING));
}

function court(group: THREE.Group): void {
  group.add(paving(0.82, 0.92, 1.04, 0.94));
  group.add(cistern(1.32, 1.36, 0.42, 0.42));
  group.add(herm(1.32, 1.12));
  group.add(bucket(1.04, 0.04, 1.36, true));
  group.add(plankOnStones(1.32, 1.76, 0, 3));
  group.add(woolBasket(0.7, 1.2), sack(0.7, 1.5, 0.4));
  group.add(flowerPot(1.0, 0.04, 1.66, BLOOM.yellow), flowerPot(1.66, 0.04, 1.66, BLOOM.red));
  group.add(tidyWalls(0.92, 1.1, 0.92));
}

function oil(group: THREE.Group): void {
  group.add(amphoraRow(1.2, 0.78, 1.72, 0.78, 5));
  group.add(amphora(1.0, 1.06), amphora(1.66, 1.06));
}

function blueMainRoof(): THREE.Object3D {
  const group = new THREE.Group();
  group.add(lotGround());
  mainBlock(group);
  rightWing(group, LOW_WING);
  leftWing(group);
  group.add(portico(1.04, 0.7, 1.86, 0.92, PORTICO_HEIGHT, RIGHT_PORTICO));
  group.add(portico(0.6, 0.92, 0.82, 1.8, PORTICO_HEIGHT, LEFT_PORTICO));
  group.add(fleece(1.3, 0.36, 0.4, 0.52), fleece(1.62, 0.42, 1.8, 0.52), fleece(0.34, 1.3, 0.9, 0.52));
  court(group);
  oil(group);
  group.add(amphoraRow(0.7, 0.98, 0.7, 1.08, 2));
  return group;
}

function blueRoofsAllRound(): THREE.Object3D {
  const group = new THREE.Group();
  group.add(lotGround());
  mainBlock(group);
  rightWing(group, LOW_WING);
  group.add(hipRoof(1.14, 0.14, 0.72, 0.56, LOW_WING + EAVES, 0.16, 'blueTiles'));
  leftWing(group);
  group.add(hipRoofAlongZ(0.14, 0.9, 0.46, 0.9, LOW_WING + EAVES, 0.14, 'blueTiles'));
  group.add(portico(1.04, 0.7, 1.86, 0.92, PORTICO_HEIGHT, RIGHT_PORTICO));
  group.add(portico(0.6, 0.92, 0.82, 1.8, PORTICO_HEIGHT, LEFT_PORTICO));
  group.add(fleece(1.4, 0.8, 0.2, 0.48));
  court(group);
  oil(group);
  return group;
}

export const APARTMENT_OPTIONS: DesignOption[] = [
  { name: 'A · Blue main roof', build: blueMainRoof },
  { name: 'B · Blue roofs all round', build: blueRoofsAllRound },
  { name: 'C · Raised wing, tiled colonnade', build: apartmentModel },
];

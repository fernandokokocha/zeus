import * as THREE from 'three';
import { blueDoor, frontWindow, sideWindow, terraceBlock, woodenBalcony } from '../render/kit/cottage';
import { BLOOM, blueColumns, flowerPot, herm, paving } from '../render/kit/garden';
import { box, flat, lotGround, surface } from '../render/kit/kit';
import { cypress, statue } from '../render/kit/luxury';
import { amphora, amphoraRow } from '../render/kit/oil';
import { hipRoof, hipRoofAlongZ, leanToRoof } from '../render/kit/roofs';
import { cistern } from '../render/kit/water';
import { townhouseModel } from '../render/house-models';
import type { DesignOption } from './options';

const EAVES = 0.03;
const MAIN_TOP = 1.05;
const WING_TOP = 0.9;
const COLUMN = 0.5;
const LEAN_LOW = 0.55;
const LEAN_HIGH = 0.68;

function mainBlock(group: THREE.Group): void {
  group.add(terraceBlock(0.14, 0.14, 0.94, 0.7, MAIN_TOP));
  group.add(blueDoor(0.84, 0.84, 0.12, 0.5));
  group.add(frontWindow(0.4, 0.84, 0.76));
  group.add(hipRoof(0.14, 0.14, 0.94, 0.7, MAIN_TOP + EAVES, 0.22, 'blueTiles'));
}

function rightWing(group: THREE.Group): void {
  group.add(terraceBlock(1.14, 0.14, 0.72, 0.56, WING_TOP));
  group.add(sideWindow(1.86, 0.42, 0.6));
  group.add(hipRoof(1.14, 0.14, 0.72, 0.56, WING_TOP + EAVES, 0.18, 'blueTiles'));
}

function leftWing(group: THREE.Group, z1: number): void {
  const d = z1 - 0.9;
  group.add(terraceBlock(0.14, 0.9, 0.46, d, WING_TOP));
  group.add(frontWindow(0.37, z1, 0.6));
  group.add(hipRoofAlongZ(0.14, 0.9, 0.46, d, WING_TOP + EAVES, 0.16, 'blueTiles'));
}

function backColonnade(group: THREE.Group): void {
  group.add(blueColumns([[1.14, 0.9], [1.5, 0.9], [1.84, 0.9]], COLUMN));
  group.add(leanToRoof(1.08, 0.7, 1.86, 0.94, LEAN_LOW, LEAN_HIGH, 'south'));
}

function sideColonnade(group: THREE.Group, z1: number): void {
  const posts: [number, number][] = [[0.8, 1.0], [0.8, (1.0 + z1) / 2], [0.8, z1]];
  group.add(blueColumns(posts, COLUMN));
  group.add(leanToRoof(0.6, 0.9, 0.84, z1 + 0.04, LEAN_LOW, LEAN_HIGH, 'east'));
}

function streetWall(group: THREE.Group, x0: number, x1: number, gate: number): void {
  group.add(terraceBlock(x0, 1.8, gate - 0.14 - x0, 0.08, 0.36));
  group.add(terraceBlock(gate + 0.14, 1.8, x1 - gate - 0.14, 0.08, 0.36));
}

function peristyle(): THREE.Object3D {
  const group = new THREE.Group();
  group.add(lotGround());
  mainBlock(group);
  rightWing(group);
  leftWing(group, 1.86);
  backColonnade(group);
  sideColonnade(group, 1.3);

  group.add(terraceBlock(1.26, 1.32, 0.6, 0.54, 0.62));
  group.add(blueDoor(1.56, 1.86, 0.12, 0.3));
  group.add(hipRoof(1.26, 1.32, 0.6, 0.54, 0.65, 0.16, 'blueTiles'));
  group.add(blueColumns([[1.3, 1.24], [1.82, 1.24]], 0.42));
  group.add(leanToRoof(1.26, 1.18, 1.86, 1.32, 0.47, 0.56, 'north'));

  group.add(terraceBlock(0.6, 1.78, 0.66, 0.08, 0.42));
  group.add(blueDoor(0.93, 1.86, 0.03, 0.4));
  group.add(box(0.36, 0.04, 0.16, surface('whitewash'), 0.93, 0.46, 1.84));

  group.add(paving(0.84, 0.94, 0.42, 0.84));
  group.add(paving(1.26, 0.94, 0.6, 0.24));
  group.add(cistern(1.05, 1.36, 0.3, 0.42));
  group.add(statue(1.5, 1.04));
  group.add(herm(1.05, 1.06));
  group.add(flowerPot(1.18, 0.04, 1.66, BLOOM.red), flowerPot(0.92, 0.04, 1.66, BLOOM.pink));
  group.add(amphoraRow(1.24, 0.78, 1.7, 0.78, 4));
  return group;
}

const GALLERY_FLOOR = 0.5;
const GALLERY_TOP = 0.92;

function longHall(): THREE.Object3D {
  const group = new THREE.Group();
  group.add(lotGround());
  group.add(terraceBlock(0.14, 0.14, 1.72, 0.62, MAIN_TOP));
  group.add(hipRoof(0.14, 0.14, 1.72, 0.62, MAIN_TOP + EAVES, 0.22, 'blueTiles'));
  group.add(blueDoor(0.9, 0.76, 0.12, 0.5));
  group.add(blueDoor(1.5, 0.76, GALLERY_FLOOR + 0.03, 0.3));
  group.add(frontWindow(0.5, 0.76, 0.72), frontWindow(1.2, 0.76, 0.72));
  group.add(sideWindow(1.86, 0.44, 0.66));

  group.add(blueColumns([[0.66, 1.08], [1.06, 1.08], [1.46, 1.08], [1.84, 1.08]], GALLERY_TOP - 0.03));
  group.add(woodenBalcony(0.62, 1.86, 0.76, GALLERY_FLOOR).translateZ(0.12));
  group.add(box(1.24, 0.03, 0.12, flat(0x8a6238), 1.24, GALLERY_FLOOR, 0.82));
  group.add(leanToRoof(0.6, 0.76, 1.86, 1.1, GALLERY_TOP, GALLERY_TOP + 0.1, 'south'));

  group.add(terraceBlock(0.14, 0.82, 0.46, 1.04, WING_TOP));
  group.add(frontWindow(0.37, 1.86, 0.6));
  group.add(hipRoofAlongZ(0.14, 0.82, 0.46, 1.04, WING_TOP + EAVES, 0.16, 'blueTiles'));

  streetWall(group, 0.6, 1.86, 1.2);
  group.add(terraceBlock(1.78, 1.12, 0.08, 0.68, 0.36));
  group.add(blueDoor(1.2, 1.82, 0.03, 0.4));

  group.add(paving(0.66, 1.16, 1.16, 0.6));
  group.add(cistern(1.0, 1.44, 0.34, 0.34));
  group.add(statue(1.56, 1.44));
  group.add(herm(1.26, 1.3));
  group.add(cypress(1.74, 1.72, 0.4), cypress(0.72, 1.72, 0.36));
  group.add(amphora(0.72, 0.96), amphora(0.84, 0.98));
  group.add(flowerPot(1.4, 0.04, 1.7, BLOOM.red));
  return group;
}

export const TOWNHOUSE_OPTIONS: DesignOption[] = [
  { name: 'A · Peristyle house', build: peristyle },
  { name: 'B · Garden court and gatehouse', build: townhouseModel },
  { name: 'C · Long hall with gallery', build: longHall },
];

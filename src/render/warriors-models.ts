import * as THREE from 'three';
import { bakedOnce } from './bake';
import { bakedFigure } from './staff';
import { frontWindow, terraceBlock } from './kit/cottage';
import { type FigureParts, posedFigure } from './kit/figure';
import { placed } from './kit/gymnasium';
import { hipRoof, hipRoofAlongZ } from './kit/roofs';
import {
  WARRIORS,
  armorStand,
  framedDoor,
  helmetStand,
  hoplite,
  hungShields,
  hungShieldsAlongZ,
  merlons,
  pennant,
  plainWall,
  practicePost,
  sandYard,
  spearRack,
  stackedShields,
} from './kit/warriors';

const W = 4;
const D = 4;
const EAVES = 0.03;
const HOUSE_RISE = 0.26;
const FACING_EAST = 0;
const DOOR = { open: 0.9, shut: 0 };
const SIDE_DOOR = Math.PI / 2;

function house(group: THREE.Group, x0: number, z0: number, w: number, d: number, top: number, alongZ = false): void {
  group.add(terraceBlock(x0, z0, w, d, top, WARRIORS.red));
  const roof = alongZ ? hipRoofAlongZ : hipRoof;
  group.add(roof(x0, z0, w, d, top + EAVES, HOUSE_RISE, 'blueTiles'));
}

const WARRIOR = { x: 2.7, z: 2.85 };

function withWarrior(shell: THREE.Object3D, parts: FigureParts, supplied: boolean): THREE.Object3D {
  shell.add(posedFigure(WARRIOR.x, WARRIOR.z, FACING_EAST, 0, parts, supplied ? 'drill' : 'rest'));
  return shell;
}

const TOWER = { x0: 2.7, z0: 0.2, w: 0.95, d: 0.95, top: 2.3 };

function towerCourtShell(supplied: boolean): THREE.Object3D {
  const group = new THREE.Group();
  group.add(sandYard(0.08, 0.08, W - 0.16, D - 0.16));
  house(group, 0.14, 0.14, 1.5, 1.1, 1.6);
  group.add(framedDoor(0.95, 1.24, 0.12, supplied ? DOOR.open : DOOR.shut));
  group.add(frontWindow(0.45, 1.24, 1.05), frontWindow(1.4, 1.24, 1.05));
  group.add(hungShields(0.25, 1.55, 0.72, 1.24, 4));
  house(group, 1.64, 0.14, 1.06, 0.72, 1.05);
  const { x0, z0, w, d, top } = TOWER;
  group.add(terraceBlock(x0, z0, w, d, top, WARRIORS.red));
  group.add(merlons(x0 - 0.03, z0 - 0.03, w + 0.06, d + 0.06, top + 0.03));
  group.add(frontWindow(x0 + w / 2, z0 + d, 1.6), frontWindow(x0 + w / 2, z0 + d, 1.05));
  group.add(pennant(x0 + w / 2, top + 0.03, z0 + d / 2, 0.55));
  house(group, 0.14, 1.4, 0.82, 2.46, 1.05, true);
  group.add(placed(framedDoor(0, 0, 0.12, supplied ? DOOR.open : DOOR.shut), 0.96, 3.1, SIDE_DOOR));
  group.add(hungShieldsAlongZ(0.97, 1.5, 2.8, 0.62, 3));
  group.add(plainWall(1.0, 3.86, 2.2, 3.86, 0.3), plainWall(2.75, 3.86, 3.86, 3.86, 0.3));
  group.add(plainWall(3.86, 1.2, 3.86, 3.86, 0.3));
  group.add(spearRack(3.45, 1.55, 6), helmetStand(1.95, 1.2), helmetStand(2.3, 1.2));
  group.add(armorStand(1.65, 2.35, FACING_EAST));
  group.add(practicePost(3.15, 2.85), stackedShields(1.35, 3.45, 3));
  return group;
}

export function towerCourt(supplied: boolean): THREE.Object3D {
  return withWarrior(towerCourtShell(supplied), hoplite(), supplied);
}

const shells = { supplied: bakedOnce(() => towerCourtShell(true)), wanting: bakedOnce(() => towerCourtShell(false)) };
const bakedHoplite = bakedFigure(hoplite);

export function warriorsHouseModel(missingNeed: boolean): THREE.Object3D {
  const shell = missingNeed ? shells.wanting() : shells.supplied();
  return withWarrior(shell, bakedHoplite(), !missingNeed);
}


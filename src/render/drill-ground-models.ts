import * as THREE from 'three';
import type { Building } from '../sim/state';
import { bakedOnce } from './bake';
import { type FigureParts, posedFigure } from './kit/figure';
import { rakedSand, sandGround } from './kit/gymnasium';
import { hoplite, plainWall, practicePost, spearRack, stackedShields } from './kit/warriors';
import { bakedFigure, staffPhase } from './staff';

const W = 4;
const D = 2;
const ALONG_Z = Math.PI / 2;
const TOWARD_BACK = -Math.PI / 2;
const WALL = 0.3;
const RACKED = { idle: 6, drilling: 3 };

function backAndSides(group: THREE.Group): void {
  group.add(plainWall(0.1, D - 0.1, W - 0.1, D - 0.1, WALL));
  group.add(plainWall(0.1, 0.1, 0.1, D - 0.1, WALL), plainWall(W - 0.1, 0.1, W - 0.1, D - 0.1, WALL));
}

function racked(staffed: boolean): number {
  return staffed ? RACKED.drilling : RACKED.idle;
}

const POSTS = [1.0, 1.65, 2.35, 3.0];
const DRILLING_AT = POSTS.slice(0, 3);

function postRowShell(staffed: boolean): THREE.Object3D {
  const group = new THREE.Group();
  group.add(sandGround(W, D));
  group.add(rakedSand(0.6, 0.3, 2.8, 1.3));
  backAndSides(group);
  for (const x of POSTS) group.add(practicePost(x, 1.45));
  group.add(spearRack(0.35, 1.3, racked(staffed), ALONG_Z), spearRack(W - 0.35, 1.3, racked(staffed), ALONG_Z));
  group.add(stackedShields(0.25, 0.5, staffed ? 1 : 3), stackedShields(W - 0.45, 0.5, staffed ? 1 : 3));
  return group;
}

function withHoplites(shell: THREE.Object3D, phase: number, parts: () => FigureParts): THREE.Object3D {
  DRILLING_AT.forEach((x, i) => shell.add(posedFigure(x + 0.05, 0.95, TOWARD_BACK, phase + i * 0.4, parts(), 'drill')));
  return shell;
}

export function postRow(staffed: boolean): THREE.Object3D {
  return staffed ? withHoplites(postRowShell(true), 0, hoplite) : postRowShell(false);
}

const shells = { staffed: bakedOnce(() => postRowShell(true)), empty: bakedOnce(() => postRowShell(false)) };
const bakedHoplite = bakedFigure(hoplite);

export function drillGroundModel(drillGround: Building): THREE.Object3D {
  if (drillGround.workers === 0) return shells.empty();
  return withHoplites(shells.staffed(), staffPhase(drillGround), bakedHoplite);
}


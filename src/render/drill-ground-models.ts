import * as THREE from 'three';
import { posedFigure } from './kit/figure';
import { rakedSand, sandGround } from './kit/gymnasium';
import { hoplite, plainWall, practicePost, spearRack, stackedShields } from './kit/warriors';

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

export function postRow(staffed: boolean): THREE.Object3D {
  const group = new THREE.Group();
  group.add(sandGround(W, D));
  group.add(rakedSand(0.6, 0.3, 2.8, 1.3));
  backAndSides(group);
  const posts = [1.0, 1.65, 2.35, 3.0];
  for (const x of posts) group.add(practicePost(x, 1.45));
  group.add(spearRack(0.35, 1.3, racked(staffed), ALONG_Z), spearRack(W - 0.35, 1.3, racked(staffed), ALONG_Z));
  group.add(stackedShields(0.25, 0.5, staffed ? 1 : 3), stackedShields(W - 0.45, 0.5, staffed ? 1 : 3));
  if (staffed) posts.slice(0, 3).forEach((x, i) => group.add(posedFigure(x + 0.05, 0.95, TOWARD_BACK, i * 0.4, hoplite(), 'drill')));
  return group;
}


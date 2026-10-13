import * as THREE from 'three';
import { frontWindow, sideWindow, terraceBlock } from './cottage';
import { box, surface } from './kit';
import { hipRoof } from './roofs';

const EAVES_ABOVE_WALL = 0.03;
const ROOF_RISE = 0.3;

export function volume(group: THREE.Group, x0: number, z0: number, w: number, d: number, top: number): void {
  group.add(terraceBlock(x0, z0, w, d, top));
  group.add(hipRoof(x0, z0, w, d, top + EAVES_ABOVE_WALL, ROOF_RISE, 'blueTiles'));
}

export function windowsFront(group: THREE.Group, xs: number[], front: number, sills: number[]): void {
  for (const x of xs) for (const y of sills) group.add(frontWindow(x, front, y));
}

export function windowsSide(group: THREE.Group, right: number, zs: number[], sills: number[]): void {
  for (const z of zs) for (const y of sills) group.add(sideWindow(right, z, y));
}

export function steps(group: THREE.Group, x: number, front: number, width: number): void {
  for (let i = 0; i < 2; i++) group.add(box(width, 0.04, 0.08, surface('rubble'), x, 0.03 + i * 0.04, front + 0.12 - i * 0.07));
}

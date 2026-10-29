import * as THREE from 'three';
import { sideWindow } from './cottage';

export function windowsSide(group: THREE.Group, right: number, zs: number[], sills: number[]): void {
  for (const z of zs) for (const y of sills) group.add(sideWindow(right, z, y));
}

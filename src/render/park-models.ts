import * as THREE from 'three';
import { bakedOnce } from './bake';
import { BLOOM, herm } from './kit/garden';
import { cypress } from './kit/luxury';
import { basin, clippedBush, gravelDisc, gravelPatch, marbleBench, parkLawn, planeTree, roundBed, steppingStones } from './kit/park';

const ALONG_THE_SIDE = Math.PI / 2;

export function cypressSquare(): THREE.Object3D {
  const group = new THREE.Group();
  group.add(parkLawn());
  group.add(gravelPatch(0.2, 0.52, 0.6, 0.18));
  group.add(cypress(0.2, 0.22, 0.62), cypress(0.8, 0.22, 0.62), cypress(0.5, 0.16, 0.5));
  group.add(marbleBench(0.5, 0.42, 0.42));
  group.add(clippedBush(0.17, 0.83, 0.08), clippedBush(0.83, 0.83, 0.08));
  return group;
}

export function hermInARoseRing(): THREE.Object3D {
  const group = new THREE.Group();
  group.add(parkLawn());
  group.add(gravelDisc(0.5, 0.5, 0.38));
  group.add(roundBed(0.5, 0.5, 0.25, [BLOOM.red, BLOOM.pink, BLOOM.yellow, BLOOM.red, BLOOM.pink, BLOOM.yellow, BLOOM.red, BLOOM.pink]));
  group.add(herm(0.5, 0.5));
  for (const [x, z] of [[0.12, 0.12], [0.88, 0.12], [0.12, 0.88], [0.88, 0.88]]) group.add(clippedBush(x, z, 0.085));
  return group;
}

export function planeTreeShade(): THREE.Object3D {
  const group = new THREE.Group();
  group.add(parkLawn());
  group.add(planeTree(0.38, 0.36, 1.35));
  group.add(marbleBench(0.2, 0.6, 0.34, ALONG_THE_SIDE));
  group.add(basin(0.68, 0.7, 0.14));
  group.add(steppingStones([[0.42, 0.88], [0.5, 0.78], [0.6, 0.86]], 7));
  group.add(clippedBush(0.84, 0.3, 0.07));
  return group;
}

export const parkModel = bakedOnce(hermInARoseRing);

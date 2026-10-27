import * as THREE from 'three';
import { fastRoadMeshes } from '../render/road-looks';
import { newGameState } from '../sim/state';
import type { Terrain } from '../sim/terrain';
import type { DesignOption } from './options';

const PATCH = 3;
const MIDDLE = 1;

function fastPatch(arms: { x: number; y: number }[]): () => THREE.Object3D {
  return () => {
    const state = newGameState(PATCH, new Array<Terrain>(PATCH * PATCH).fill('grass'), []);
    for (const p of [{ x: MIDDLE, y: MIDDLE }, ...arms]) {
      const i = p.y * PATCH + p.x;
      state.roads[i] = true;
      state.roadUpgrades[i] = 'fast';
    }
    const group = new THREE.Group();
    group.add(...fastRoadMeshes(state));
    return group;
  };
}

const NORTH = { x: MIDDLE, y: 0 };
const SOUTH = { x: MIDDLE, y: 2 };
const WEST = { x: 0, y: MIDDLE };
const EAST = { x: 2, y: MIDDLE };

export const FAST_ROAD_OPTIONS: DesignOption[] = [
  {
    name: 'Wheel ruts',
    build: fastPatch([NORTH, SOUTH, WEST, EAST]),
    variants: [
      { label: 'Crossroads', build: fastPatch([NORTH, SOUTH, WEST, EAST]) },
      { label: 'T-junction', build: fastPatch([NORTH, WEST, EAST]) },
      { label: 'Corner', build: fastPatch([NORTH, WEST]) },
      { label: 'Straight', build: fastPatch([WEST, EAST]) },
    ],
  },
];

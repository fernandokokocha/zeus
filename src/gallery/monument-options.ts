import * as THREE from 'three';
import { CROWDED_CITY, type Emblem, SEA_ROUTE, TRADE_ROUTE } from '../render/kit/monument';
import { choregic, greatAltar, mausoleum } from '../render/monument-models';
import { fastRoadMeshes } from '../render/road-looks';
import { newGameState } from '../sim/state';
import type { Terrain } from '../sim/terrain';
import type { DesignOption } from './options';

const PATCH = 5;
const CROSSING = 3;

function atCrossroads(body: (emblem: Emblem) => THREE.Object3D, emblem: Emblem): () => THREE.Object3D {
  return () => {
    const state = newGameState(PATCH, new Array<Terrain>(PATCH * PATCH).fill('grass'), []);
    for (let t = 0; t < PATCH; t++) {
      for (const i of [CROSSING * PATCH + t, t * PATCH + CROSSING]) {
        state.roads[i] = true;
        state.roadUpgrades[i] = 'fast';
      }
    }
    const scene = new THREE.Group();
    scene.add(...fastRoadMeshes(state));
    scene.add(body(emblem));
    return scene;
  };
}

function option(name: string, body: (emblem: Emblem) => THREE.Object3D): DesignOption {
  return {
    name,
    build: atCrossroads(body, CROWDED_CITY),
    variants: [
      { label: '1,000 citizens', build: atCrossroads(body, CROWDED_CITY) },
      { label: 'Trade route, same body', build: atCrossroads(body, TRADE_ROUTE) },
      { label: 'Sea route (future), same body', build: atCrossroads(body, SEA_ROUTE) },
    ],
  };
}

export const MONUMENT_OPTIONS: DesignOption[] = [
  option('Choregic monument (Lysicrates)', choregic),
  option('Mausoleum (Halicarnassus)', mausoleum),
  option('Great Altar (Pergamon)', greatAltar),
];

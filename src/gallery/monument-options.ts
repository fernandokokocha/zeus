import * as THREE from 'three';
import { COLORS, box, cylinder, flat, surface } from '../render/kit/kit';
import { CROWDED_CITY, type Emblem, TRADE_ROUTE, monumentSteps, onFourFaces } from '../render/kit/monument';
import { PALACE, acroterion, marbleColumn, palaceGround } from '../render/kit/palace';
import { fastRoadMeshes } from '../render/road-looks';
import { newGameState } from '../sim/state';
import type { Terrain } from '../sim/terrain';
import type { DesignOption } from './options';

const SIZE = 3;
const C = SIZE / 2;
const APRON = 0.03;

function crowned(emblem: Emblem, y: number, scale: number): THREE.Object3D {
  const crown = emblem.crown();
  crown.position.set(C, y, C);
  crown.scale.setScalar(scale);
  return crown;
}

function victoryPillar(emblem: Emblem): THREE.Object3D {
  const g = new THREE.Group();
  g.add(palaceGround(SIZE, SIZE));
  const { steps, top } = monumentSteps(C, C, [2.5, 2.1, 1.7], 0.08, APRON);
  g.add(steps);
  const pedestal = { side: 1.1, height: 0.55 };
  g.add(box(pedestal.side, pedestal.height, pedestal.side, surface('whitewash'), C, top, C));
  g.add(onFourFaces(() => emblem.relief(0.9, 0.4), C, C, pedestal.side / 2, top + 0.07));
  const cornice = top + pedestal.height;
  g.add(box(pedestal.side + 0.08, 0.05, pedestal.side + 0.08, flat(COLORS.aegean), C, cornice, C));
  g.add(box(pedestal.side - 0.1, 0.05, pedestal.side - 0.1, flat(PALACE.marble), C, cornice + 0.05, C));
  const shaftBase = cornice + 0.1;
  const shaft = 1.15;
  g.add(cylinder(0.17, 0.21, shaft, surface('whitewash'), C, shaftBase, C, 16));
  for (const at of [0.3, 0.7]) g.add(cylinder(0.205, 0.205, 0.04, flat(COLORS.aegean), C, shaftBase + shaft * at, C, 16));
  g.add(cylinder(0.27, 0.18, 0.06, flat(PALACE.marble), C, shaftBase + shaft, C, 16));
  g.add(box(0.62, 0.06, 0.62, flat(PALACE.marble), C, shaftBase + shaft + 0.06, C));
  g.add(crowned(emblem, shaftBase + shaft + 0.12, 1.1));
  for (const dx of [-1, 1]) for (const dz of [-1, 1]) {
    g.add(box(0.14, 0.32, 0.14, flat(PALACE.marble), C + dx * 1.05, APRON + 0.08, C + dz * 1.05));
    g.add(acroterion(C + dx * 1.05, APRON + 0.4, C + dz * 1.05));
  }
  return g;
}

function grandPedestal(emblem: Emblem): THREE.Object3D {
  const g = new THREE.Group();
  g.add(palaceGround(SIZE, SIZE));
  const { steps, top } = monumentSteps(C, C, [2.8, 2.5], 0.1, APRON);
  g.add(steps);
  const pedestal = { side: 2.0, height: 0.75 };
  g.add(box(pedestal.side, pedestal.height, pedestal.side, surface('whitewash'), C, top, C));
  g.add(onFourFaces(() => emblem.relief(1.7, 0.5), C, C, pedestal.side / 2, top + 0.1));
  const cornice = top + pedestal.height;
  g.add(box(pedestal.side + 0.1, 0.06, pedestal.side + 0.1, flat(COLORS.aegean), C, cornice, C));
  g.add(box(pedestal.side - 0.1, 0.06, pedestal.side - 0.1, flat(PALACE.marble), C, cornice + 0.06, C));
  for (const dx of [-1, 1]) for (const dz of [-1, 1]) g.add(acroterion(C + dx * 0.88, cornice + 0.12, C + dz * 0.88));
  g.add(crowned(emblem, cornice + 0.12, 2.3));
  return g;
}

function stele(emblem: Emblem): THREE.Object3D {
  const g = new THREE.Group();
  g.add(palaceGround(SIZE, SIZE));
  const { steps, top } = monumentSteps(C, C, [2.6, 2.2], 0.09, APRON);
  g.add(steps);
  g.add(box(1.7, 0.25, 0.8, flat(PALACE.marble), C, top, C));
  const slab = { width: 1.2, height: 1.45, depth: 0.32, base: top + 0.25 };
  g.add(box(slab.width, slab.height, slab.depth, surface('whitewash'), C, slab.base, C));
  for (const side of [-1, 1]) {
    const relief = emblem.relief(1.0, 1.1);
    relief.position.set(C, slab.base + 0.17, C + side * (slab.depth / 2));
    relief.rotation.y = side > 0 ? 0 : Math.PI;
    g.add(relief);
  }
  const head = slab.base + slab.height;
  g.add(box(slab.width + 0.1, 0.06, slab.depth + 0.08, flat(COLORS.aegean), C, head, C));
  const pediment = new THREE.Shape([new THREE.Vector2(-0.65, 0), new THREE.Vector2(0.65, 0), new THREE.Vector2(0, 0.3)]);
  const gable = new THREE.Mesh(new THREE.ExtrudeGeometry(pediment, { depth: slab.depth + 0.04, bevelEnabled: false }), flat(PALACE.marble));
  gable.position.set(C, head + 0.06, C - (slab.depth + 0.04) / 2);
  g.add(gable);
  g.add(crowned(emblem, head + 0.32, 1.25));
  for (const side of [-1, 1]) {
    g.add(marbleColumn(C + side * 1.0, C, 1.3, top));
    g.add(acroterion(C + side * 1.0, top + 1.3, C));
  }
  return g;
}

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
    ],
  };
}

export const MONUMENT_OPTIONS: DesignOption[] = [
  option('Victory pillar', victoryPillar),
  option('Grand pedestal', grandPedestal),
  option('Decree stele', stele),
];

import * as THREE from 'three';
import type { GameState, RoamerKind, Walk } from '../sim/state';
import { WALKER_TILES_PER_TICK, walkerPosition } from '../sim/walking';
import { PALETTE } from './palette';

const BOB_HEIGHT = 0.06;
const FIGURE_SCALE = 1.7;
const BOB_STEPS_PER_TILE = 2;
const START_CAPACITY = 64;

interface Part {
  geometry: THREE.BufferGeometry;
  color: number;
}

type Figure = 'settler' | RoamerKind;

function body(tunic: number): Part[] {
  return [
    { geometry: new THREE.CylinderGeometry(0.06, 0.09, 0.26, 8).translate(0, 0.13, 0), color: tunic },
    { geometry: new THREE.SphereGeometry(0.06, 10, 8).translate(0, 0.32, 0), color: PALETTE.skin },
  ];
}

const jar = new THREE.LatheGeometry(
  [[0, 0], [0.04, 0.01], [0.065, 0.06], [0.06, 0.11], [0.03, 0.15], [0.04, 0.17]].map(([r, y]) => new THREE.Vector2(r, y)),
  10,
);

const FIGURES: Record<Figure, Part[]> = {
  settler: [
    ...body(PALETTE.tunic),
    { geometry: new THREE.BoxGeometry(0.14, 0.14, 0.1).translate(0, 0.2, -0.1), color: PALETTE.bundle },
  ],
  waterCarrier: [
    ...body(PALETTE.carrierTunic),
    { geometry: jar.clone().rotateZ(-0.35).translate(0.09, 0.27, 0), color: PALETTE.carrierJar },
  ],
  taxCollector: [
    ...body(PALETTE.clerkTunic),
    { geometry: new THREE.BoxGeometry(0.12, 0.09, 0.02).rotateX(-0.6).translate(0, 0.2, 0.09), color: PALETTE.tablet },
    { geometry: new THREE.SphereGeometry(0.04, 8, 6).translate(0.09, 0.1, 0), color: PALETTE.coins },
  ],
};

function createFigureSet(parts: Part[], group: THREE.Group): { show(walks: Walk[], ticksAhead: number): void } {
  let capacity = 0;
  let meshes: THREE.InstancedMesh[] = [];
  const matrix = new THREE.Matrix4();
  const rotation = new THREE.Quaternion();
  const position = new THREE.Vector3();
  const scale = new THREE.Vector3(FIGURE_SCALE, FIGURE_SCALE, FIGURE_SCALE);
  const up = new THREE.Vector3(0, 1, 0);

  function allocate(size: number): void {
    for (const mesh of meshes) {
      mesh.dispose();
      group.remove(mesh);
    }
    capacity = size;
    meshes = parts.map((part) => {
      const mesh = new THREE.InstancedMesh(part.geometry, new THREE.MeshLambertMaterial({ color: part.color }), size);
      mesh.frustumCulled = false;
      return mesh;
    });
    group.add(...meshes);
  }

  return {
    show(walks, ticksAhead) {
      if (walks.length > capacity) allocate(Math.max(START_CAPACITY, 2 * walks.length));
      walks.forEach((walk, i) => {
        const at = walkerPosition(walk, ticksAhead * WALKER_TILES_PER_TICK);
        const travelled = Math.abs(at.x) + Math.abs(at.y);
        const bob = Math.abs(Math.sin(travelled * Math.PI * BOB_STEPS_PER_TILE)) * BOB_HEIGHT;
        position.set(at.x + 0.5, bob, at.y + 0.5);
        rotation.setFromAxisAngle(up, Math.atan2(at.facing.x, at.facing.y));
        matrix.compose(position, rotation, scale);
        for (const mesh of meshes) mesh.setMatrixAt(i, matrix);
      });
      for (const mesh of meshes) {
        mesh.count = walks.length;
        mesh.instanceMatrix.needsUpdate = true;
      }
    },
  };
}

export function createWalkerLayer(): { group: THREE.Group; sync(state: GameState, ticksAhead: number): void } {
  const group = new THREE.Group();
  const sets = {
    settler: createFigureSet(FIGURES.settler, group),
    waterCarrier: createFigureSet(FIGURES.waterCarrier, group),
    taxCollector: createFigureSet(FIGURES.taxCollector, group),
  };

  return {
    group,
    sync(state, ticksAhead) {
      sets.settler.show(state.settlers, ticksAhead);
      sets.waterCarrier.show(state.roamers.filter((r) => r.kind === 'waterCarrier'), ticksAhead);
      sets.taxCollector.show(state.roamers.filter((r) => r.kind === 'taxCollector'), ticksAhead);
    },
  };
}

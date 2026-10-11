import * as THREE from 'three';
import { WALKER_TILES_PER_TICK, walkerPosition } from '../sim/walking';
import type { GameState } from '../sim/state';
import { PALETTE } from './palette';

const BOB_HEIGHT = 0.06;
const FIGURE_SCALE = 1.7;
const BOB_STEPS_PER_TILE = 2;
const START_CAPACITY = 64;

const PARTS = [
  { geometry: new THREE.CylinderGeometry(0.06, 0.09, 0.26, 8).translate(0, 0.13, 0), color: PALETTE.tunic },
  { geometry: new THREE.SphereGeometry(0.06, 10, 8).translate(0, 0.32, 0), color: PALETTE.skin },
  { geometry: new THREE.BoxGeometry(0.14, 0.14, 0.1).translate(0, 0.2, -0.1), color: PALETTE.bundle },
];

export function createWalkerLayer(): { group: THREE.Group; sync(state: GameState, ticksAhead: number): void } {
  const group = new THREE.Group();
  let capacity = 0;
  let meshes: THREE.InstancedMesh[] = [];
  const matrix = new THREE.Matrix4();
  const rotation = new THREE.Quaternion();
  const position = new THREE.Vector3();
  const scale = new THREE.Vector3(FIGURE_SCALE, FIGURE_SCALE, FIGURE_SCALE);
  const up = new THREE.Vector3(0, 1, 0);

  function allocate(size: number): void {
    for (const mesh of meshes) mesh.dispose();
    group.clear();
    capacity = size;
    meshes = PARTS.map((part) => {
      const mesh = new THREE.InstancedMesh(part.geometry, new THREE.MeshLambertMaterial({ color: part.color }), size);
      mesh.frustumCulled = false;
      return mesh;
    });
    group.add(...meshes);
  }

  return {
    group,
    sync(state, ticksAhead) {
      if (state.settlers.length > capacity) allocate(Math.max(START_CAPACITY, 2 * state.settlers.length));
      state.settlers.forEach((settler, i) => {
        const at = walkerPosition(settler, ticksAhead * WALKER_TILES_PER_TICK);
        const travelled = Math.abs(at.x) + Math.abs(at.y);
        const bob = Math.abs(Math.sin(travelled * Math.PI * BOB_STEPS_PER_TILE)) * BOB_HEIGHT;
        position.set(at.x + 0.5, bob, at.y + 0.5);
        rotation.setFromAxisAngle(up, Math.atan2(at.facing.x, at.facing.y));
        matrix.compose(position, rotation, scale);
        for (const mesh of meshes) mesh.setMatrixAt(i, matrix);
      });
      for (const mesh of meshes) {
        mesh.count = state.settlers.length;
        mesh.instanceMatrix.needsUpdate = true;
      }
    },
  };
}

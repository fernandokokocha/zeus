import * as THREE from 'three';
import type { GameState } from '../sim/state';
import { buildingModel } from './models';
import { PALETTE } from './palette';

const ROAD_HEIGHT = 0.02;
const roadGeometry = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
const roadMaterial = new THREE.MeshLambertMaterial({ color: PALETTE.road });

export function createWorldLayer(): { group: THREE.Group; sync(state: GameState): void } {
  const group = new THREE.Group();
  let renderedVersion = -1;
  let roads: THREE.InstancedMesh = new THREE.InstancedMesh(roadGeometry, roadMaterial, 0);

  return {
    group,
    sync(state) {
      if (state.version === renderedVersion) return;
      renderedVersion = state.version;
      group.clear();
      roads.dispose();
      roads = roadMesh(state);
      group.add(roads);

      for (const building of state.buildings) {
        const model = buildingModel(building);
        model.position.set(building.x, 0, building.y);
        group.add(model);
      }
    },
  };
}

function roadMesh(state: GameState): THREE.InstancedMesh {
  const roadTiles = state.roads.flatMap((isRoad, i) => (isRoad ? [i] : []));
  const mesh = new THREE.InstancedMesh(roadGeometry, roadMaterial, roadTiles.length);
  const matrix = new THREE.Matrix4();
  roadTiles.forEach((tile, n) => {
    matrix.makeTranslation((tile % state.size) + 0.5, ROAD_HEIGHT, Math.floor(tile / state.size) + 0.5);
    mesh.setMatrixAt(n, matrix);
  });
  return mesh;
}

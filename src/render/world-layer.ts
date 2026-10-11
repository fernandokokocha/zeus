import * as THREE from 'three';
import { BUILDING_SPECS, buildingSize } from '../sim/buildings';
import type { Building, GameState } from '../sim/state';
import { buildingModel, roadblockModel } from './models';
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

      for (const model of roadblockModels(state)) group.add(model);
      for (const building of state.buildings) {
        group.add(placedModel(building));
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

function roadblockModels(state: GameState): THREE.Object3D[] {
  return state.roadblocks.flatMap((blocked, i) => {
    if (!blocked) return [];
    const x = i % state.size;
    const y = Math.floor(i / state.size);
    const alongX = (x > 0 && state.roads[i - 1]) || (x < state.size - 1 && state.roads[i + 1]);
    const model = roadblockModel(alongX);
    model.position.x += x;
    model.position.z += y;
    return [model];
  });
}

function placedModel(building: Building): THREE.Object3D {
  const { width, height } = BUILDING_SPECS[building.type];
  const turned = buildingSize(building.type, building.rotation);
  const model = buildingModel(building);
  model.position.set(-width / 2, 0, -height / 2);
  const pivot = new THREE.Group();
  pivot.add(model);
  pivot.rotation.y = -building.rotation * (Math.PI / 2);
  pivot.position.set(building.x + turned.width / 2, 0, building.y + turned.height / 2);
  return pivot;
}

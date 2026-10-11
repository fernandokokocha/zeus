import * as THREE from 'three';
import { BUILDING_SPECS, type BuildingType } from '../sim/buildings';
import { PALETTE } from './palette';

const plaster = new THREE.MeshLambertMaterial({ color: PALETTE.plaster });
const terracotta = new THREE.MeshLambertMaterial({ color: PALETTE.terracotta });

function testBuildingModel(): THREE.Object3D {
  const { width, height } = BUILDING_SPECS.testBuilding;
  const group = new THREE.Group();
  const walls = new THREE.Mesh(new THREE.BoxGeometry(width - 0.3, 0.8, height - 0.3), plaster);
  walls.position.set(width / 2, 0.4, height / 2);
  const roof = new THREE.Mesh(new THREE.ConeGeometry((width - 0.1) * Math.SQRT1_2, 0.6, 4), terracotta);
  roof.rotation.y = Math.PI / 4;
  roof.position.set(width / 2, 1.1, height / 2);
  group.add(walls, roof);
  return group;
}

export const BUILDING_MODELS: Record<BuildingType, () => THREE.Object3D> = {
  testBuilding: testBuildingModel,
};

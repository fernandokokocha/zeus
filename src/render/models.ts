import * as THREE from 'three';
import { BUILDING_SPECS } from '../sim/buildings';
import { houseLevel } from '../sim/housing';
import type { Building } from '../sim/state';
import { PALETTE } from './palette';

const lambert = (color: number) => new THREE.MeshLambertMaterial({ color });
const dirt = lambert(PALETTE.dirt);
const wood = lambert(PALETTE.trunk);
const signBoard = lambert(PALETTE.plaster);
const mudBrick = lambert(PALETTE.mudBrick);
const thatch = lambert(PALETTE.thatch);
const doorway = lambert(PALETTE.doorway);

const { width: HOUSE_WIDTH, height: HOUSE_DEPTH } = BUILDING_SPECS.house;
const LOT_INSET = 0.12;
const STAKE_HEIGHT = 0.3;

function box(w: number, h: number, d: number, material: THREE.Material, x: number, y: number, z: number): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  return mesh;
}

function vacantLotModel(): THREE.Object3D {
  const group = new THREE.Group();
  group.add(box(HOUSE_WIDTH - 2 * LOT_INSET, 0.03, HOUSE_DEPTH - 2 * LOT_INSET, dirt, HOUSE_WIDTH / 2, 0.015, HOUSE_DEPTH / 2));
  for (const x of [LOT_INSET, HOUSE_WIDTH - LOT_INSET]) {
    for (const z of [LOT_INSET, HOUSE_DEPTH - LOT_INSET]) {
      group.add(box(0.05, STAKE_HEIGHT, 0.05, wood, x, STAKE_HEIGHT / 2, z));
    }
  }
  const signX = HOUSE_WIDTH - 0.45;
  const signZ = HOUSE_DEPTH - 0.3;
  group.add(box(0.05, 0.5, 0.05, wood, signX, 0.25, signZ));
  group.add(box(0.36, 0.22, 0.03, signBoard, signX, 0.5, signZ + 0.03));
  return group;
}

function hutModel(): THREE.Object3D {
  const group = new THREE.Group();
  const cx = HOUSE_WIDTH / 2 - 0.1;
  const cz = HOUSE_DEPTH / 2 - 0.1;
  group.add(box(HOUSE_WIDTH - 2 * LOT_INSET, 0.03, HOUSE_DEPTH - 2 * LOT_INSET, dirt, HOUSE_WIDTH / 2, 0.015, HOUSE_DEPTH / 2));
  group.add(box(1.1, 0.55, 1.1, mudBrick, cx, 0.275, cz));
  const roof = new THREE.Mesh(new THREE.ConeGeometry(0.92, 0.55, 4), thatch);
  roof.rotation.y = Math.PI / 4;
  roof.position.set(cx, 0.82, cz);
  group.add(roof);
  group.add(box(0.26, 0.38, 0.02, doorway, cx + 0.15, 0.19, cz + 0.56));
  group.add(box(0.2, 0.18, 0.2, mudBrick, HOUSE_WIDTH - 0.3, 0.09, HOUSE_DEPTH - 0.3));
  return group;
}

export function buildingModel(building: Building): THREE.Object3D {
  return houseLevel(building) ? hutModel() : vacantLotModel();
}

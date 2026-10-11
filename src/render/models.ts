import * as THREE from 'three';
import { BUILDING_SPECS } from '../sim/buildings';
import { houseLevel } from '../sim/housing';
import type { Building } from '../sim/state';
import { PALETTE, tileHash } from './palette';

const lambert = (color: number) => new THREE.MeshLambertMaterial({ color });
const earth = lambert(PALETTE.dirt);
const fieldstone = lambert(PALETTE.fieldstone);
const mudBrick = lambert(PALETTE.mudBrick);
const reed = lambert(PALETTE.reed);
const timber = lambert(PALETTE.trunk);
const doorway = lambert(PALETTE.doorway);
const clay = lambert(PALETTE.terracotta);

const unitBox = new THREE.BoxGeometry(1, 1, 1);
const stone = new THREE.DodecahedronGeometry(0.05);
const beamEnd = new THREE.CylinderGeometry(0.025, 0.025, 0.12, 6).rotateX(Math.PI / 2);
const oven = new THREE.SphereGeometry(0.16, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2);
const amphora = new THREE.LatheGeometry(
  [[0, 0], [0.04, 0.01], [0.08, 0.08], [0.085, 0.14], [0.05, 0.22], [0.03, 0.26], [0.045, 0.28]].map(
    ([r, y]) => new THREE.Vector2(r, y),
  ),
  10,
);

const { width: LOT_WIDTH, height: LOT_DEPTH } = BUILDING_SPECS.house;
const LOT_INSET = 0.1;
const STONE_SPACING = 0.22;

function box(w: number, h: number, d: number, material: THREE.Material, x: number, y: number, z: number): THREE.Mesh {
  const mesh = new THREE.Mesh(unitBox, material);
  mesh.scale.set(w, h, d);
  mesh.position.set(x, y + h / 2, z);
  return mesh;
}

function placed(geometry: THREE.BufferGeometry, material: THREE.Material, x: number, y: number, z: number): THREE.Mesh {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  return mesh;
}

function packedEarth(): THREE.Mesh {
  return box(LOT_WIDTH - 2 * LOT_INSET, 0.03, LOT_DEPTH - 2 * LOT_INSET, earth, LOT_WIDTH / 2, 0, LOT_DEPTH / 2);
}

function stoneBorder(): THREE.Object3D {
  const group = new THREE.Group();
  const min = LOT_INSET;
  const maxX = LOT_WIDTH - LOT_INSET;
  const maxZ = LOT_DEPTH - LOT_INSET;
  const along = (from: number, to: number) =>
    Array.from({ length: Math.floor((to - from) / STONE_SPACING) + 1 }, (_, i) => from + i * STONE_SPACING);
  const spots = [
    ...along(min, maxX).flatMap((x) => [[x, min], [x, maxZ]]),
    ...along(min + STONE_SPACING, maxZ - STONE_SPACING / 2).flatMap((z) => [[min, z], [maxX, z]]),
  ];
  for (const [x, z] of spots) {
    const piece = placed(stone, fieldstone, x, 0.04, z);
    piece.rotation.set(tileHash(x * 7, z * 7) * Math.PI, tileHash(z * 5, x * 5) * Math.PI, 0);
    piece.scale.setScalar(0.8 + tileHash(x * 3, z * 11) * 0.5);
    group.add(piece);
  }
  return group;
}

function brickPile(x: number, z: number): THREE.Object3D {
  const group = new THREE.Group();
  for (const [dx, dy, dz, turn] of [[0, 0, 0, 0], [0.15, 0, 0.02, 0.1], [0.07, 0.07, 0.01, -0.15], [0.02, 0, 0.16, 1.5]]) {
    const brick = box(0.13, 0.07, 0.08, mudBrick, x + dx, 0.03 + dy, z + dz);
    brick.rotation.y = turn;
    group.add(brick);
  }
  return group;
}

function vacantLotModel(): THREE.Object3D {
  const group = new THREE.Group();
  group.add(packedEarth(), stoneBorder(), brickPile(LOT_WIDTH - 0.55, LOT_DEPTH - 0.5));
  return group;
}

function hutModel(): THREE.Object3D {
  const group = new THREE.Group();
  group.add(packedEarth());

  const x0 = 0.2;
  const z0 = 0.2;
  const width = 1.0;
  const depth = 0.9;
  const wallHeight = 0.48;
  const cx = x0 + width / 2;
  const cz = z0 + depth / 2;
  group.add(box(width + 0.06, 0.07, depth + 0.06, fieldstone, cx, 0.03, cz));
  group.add(box(width, wallHeight, depth, mudBrick, cx, 0.1, cz));
  group.add(box(width + 0.14, 0.06, depth + 0.14, reed, cx, 0.1 + wallHeight, cz));
  for (const bx of [x0 + 0.15, x0 + 0.5, x0 + 0.85]) group.add(placed(beamEnd, timber, bx, 0.1 + wallHeight - 0.03, z0 + depth + 0.04));
  group.add(box(0.2, 0.3, 0.02, doorway, x0 + 0.3, 0.1, z0 + depth + 0.005));
  group.add(box(0.02, 0.07, 0.14, doorway, x0 + width + 0.005, 0.38, cz));

  const wallHeightYard = 0.16;
  const yardEdge = LOT_WIDTH - 0.16;
  group.add(box(yardEdge - x0 - 0.45, wallHeightYard, 0.08, fieldstone, (x0 + 0.45 + yardEdge) / 2 + 0.04, 0.03, yardEdge));
  group.add(box(0.08, wallHeightYard, yardEdge - z0, fieldstone, yardEdge, 0.03, (z0 + yardEdge) / 2));

  group.add(placed(oven, mudBrick, LOT_WIDTH - 0.45, 0.03, 0.45));
  group.add(placed(amphora, clay, LOT_WIDTH - 0.5, 0.03, LOT_DEPTH - 0.55));
  group.add(placed(amphora, clay, LOT_WIDTH - 0.68, 0.03, LOT_DEPTH - 0.45));
  return group;
}

export function buildingModel(building: Building): THREE.Object3D {
  return houseLevel(building) ? hutModel() : vacantLotModel();
}

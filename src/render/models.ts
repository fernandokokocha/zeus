import * as THREE from 'three';
import { AGORA_VENDOR_SPOTS, BUILDING_SPECS, type BuildingType } from '../sim/buildings';
import { CROP_STAGES, UNITS_PER_LOAD, cropStage } from '../sim/food';
import { SLOT_SIZE, STOREHOUSE_SLOTS } from '../sim/storehouse';
import { houseLevel, type HouseLevel } from '../sim/housing';
import { isPerforming } from '../sim/schools';
import type { Building, GameState } from '../sim/state';
import { PALETTE, tileHash } from './palette';

const lambert = (color: number) => new THREE.MeshLambertMaterial({ color });
const earth = lambert(PALETTE.dirt);
const fieldstone = lambert(PALETTE.fieldstone);
const mudBrick = lambert(PALETTE.mudBrick);
const reed = lambert(PALETTE.reed);
const timber = lambert(PALETTE.trunk);
const doorway = lambert(PALETTE.doorway);
const clay = lambert(PALETTE.terracotta);
const marble = lambert(PALETTE.marble);
const plaster = lambert(PALETTE.plaster);
const paving = lambert(PALETTE.paving);
const water = lambert(PALETTE.water);
const bronze = lambert(PALETTE.bronze);
const gold = lambert(PALETTE.coins);
const foliage = lambert(PALETTE.foliage);
const furrow = lambert(PALETTE.furrow);
const ripeWheat = lambert(PALETTE.wheat);
const sack = lambert(PALETTE.sack);
const bread = lambert(PALETTE.bread);
const awning = lambert(PALETTE.awning);
const lawn = lambert(PALETTE.lawn);
const sand = lambert(PALETTE.sand);
const wool = lambert(PALETTE.wool);
const twine = lambert(PALETTE.twine);
const vine = lambert(PALETTE.vine);
const shutter = lambert(PALETTE.shutter);
const fleeceAwning = lambert(PALETTE.fleeceAwning);
const scroll = lambert(PALETTE.scroll);
const skin = lambert(PALETTE.skin);
const philosopherRobe = lambert(PALETTE.philosopherRobe);
const actorRobe = lambert(PALETTE.actorRobe);
const tragicRobe = lambert(PALETTE.tragicRobe);
const comicMask = lambert(PALETTE.mask);
const tragicMask = lambert(PALETTE.tragicMask);
const petalMaterials = PALETTE.petals.map(lambert);
const sprouts = Array.from({ length: CROP_STAGES }, (_, stage) =>
  lambert(new THREE.Color(PALETTE.sprout).lerp(new THREE.Color(PALETTE.wheat), stage / (CROP_STAGES - 1)).getHex()),
);
const falling = new THREE.MeshBasicMaterial({ color: PALETTE.spray, transparent: true, opacity: 0.85 });

const unitBox = new THREE.BoxGeometry(1, 1, 1);
const stone = new THREE.DodecahedronGeometry(0.05);
const column = new THREE.CylinderGeometry(0.07, 0.08, 1, 10).translate(0, 0.5, 0);
const disc = new THREE.CylinderGeometry(1, 1, 1, 20).translate(0, 0.5, 0);
const shrub = new THREE.SphereGeometry(0.22, 8, 6);
const stream = new THREE.CylinderGeometry(0.035, 0.06, 1, 8);
const spray = new THREE.SphereGeometry(0.06, 8, 6);
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
const FOUNTAIN_STREAMS = 6;

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


function cylinder(radius: number, height: number, material: THREE.Material, x: number, y: number, z: number): THREE.Mesh {
  const mesh = placed(disc, material, x, y, z);
  mesh.scale.set(radius, height, radius);
  return mesh;
}

function columnAt(height: number, material: THREE.Material, x: number, y: number, z: number): THREE.Mesh {
  const mesh = placed(column, material, x, y, z);
  mesh.scale.y = height;
  return mesh;
}

function gableRoof(span: number, rise: number, length: number, gable: THREE.Material, roofing = clay): THREE.Object3D {
  const group = new THREE.Group();
  const shape = new THREE.Shape([new THREE.Vector2(-span / 2, 0), new THREE.Vector2(span / 2, 0), new THREE.Vector2(0, rise)]);
  const prism = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: length, bevelEnabled: false }), gable);
  prism.position.z = -length / 2;
  group.add(prism);
  const slope = Math.atan2(rise, span / 2);
  const slab = Math.hypot(span / 2, rise) + 0.08;
  for (const side of [-1, 1]) {
    const tiles = box(slab, 0.05, length + 0.1, roofing, 0, 0, 0);
    tiles.position.set((side * span) / 4, rise / 2 + 0.02, 0);
    tiles.rotation.z = -side * slope;
    group.add(tiles);
  }
  return group;
}

function waterStream(from: THREE.Vector3, to: THREE.Vector3): THREE.Mesh {
  const mesh = new THREE.Mesh(stream, falling);
  mesh.position.copy(from).add(to).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), to.clone().sub(from).normalize());
  mesh.scale.y = from.distanceTo(to);
  return mesh;
}

function fountainModel(working: boolean): THREE.Object3D {
  const group = new THREE.Group();
  group.add(box(1.84, 0.04, 1.84, paving, 1, 0, 1));
  group.add(cylinder(0.7, 0.24, marble, 1, 0.04, 1));
  group.add(cylinder(0.6, 0.02, working ? water : earth, 1, 0.27, 1));
  group.add(cylinder(0.14, 0.12, marble, 1, 0.04, 1));
  group.add(columnAt(0.55, marble, 1, 0.16, 1));
  group.add(cylinder(0.24, 0.07, marble, 1, 0.7, 1));
  group.add(cylinder(0.2, 0.02, working ? water : fieldstone, 1, 0.76, 1));
  group.add(cylinder(0.05, 0.12, bronze, 1, 0.77, 1));
  if (working) {
    group.add(placed(spray, falling, 1, 0.93, 1));
    for (let i = 0; i < FOUNTAIN_STREAMS; i++) {
      const angle = (i / FOUNTAIN_STREAMS) * Math.PI * 2;
      const out = (r: number, y: number) => new THREE.Vector3(1 + Math.cos(angle) * r, y, 1 + Math.sin(angle) * r);
      group.add(waterStream(out(0.24, 0.76), out(0.38, 0.29)));
    }
  }
  for (const [x, z] of [[0.22, 0.22], [1.78, 0.22], [0.22, 1.78], [1.78, 1.78]]) group.add(placed(shrub, foliage, x, 0.16, z));
  return group;
}

function taxOfficeModel(working: boolean): THREE.Object3D {
  const group = new THREE.Group();
  group.add(box(1.84, 0.04, 1.84, paving, 1, 0, 1));
  const width = 1.5;
  const depth = 0.95;
  const wallHeight = 0.6;
  const cz = 0.2 + depth / 2;
  group.add(box(width + 0.08, 0.08, depth + 0.08, fieldstone, 1, 0.04, cz));
  group.add(box(width, wallHeight, depth, plaster, 1, 0.12, cz));
  const roof = gableRoof(depth + 0.2, 0.3, width + 0.16, plaster);
  roof.rotation.y = Math.PI / 2;
  roof.position.set(1, 0.12 + wallHeight, cz);
  group.add(roof);
  group.add(box(0.26, 0.4, 0.02, doorway, 1, 0.12, cz + depth / 2 + 0.005));
  for (const wx of [0.55, 1.45]) group.add(box(0.16, 0.12, 0.02, doorway, wx, 0.42, cz + depth / 2 + 0.005));

  const porchZ = cz + depth / 2 + 0.3;
  for (const px of [0.62, 1.38]) group.add(columnAt(wallHeight, marble, px, 0.12, porchZ));
  group.add(box(0.96, 0.06, 0.4, clay, 1, 0.12 + wallHeight, porchZ - 0.12));
  group.add(box(1.0, 0.08, 0.5, fieldstone, 1, 0.04, porchZ - 0.15));

  group.add(box(0.3, 0.16, 0.2, timber, 1.6, 0.04, 1.7));
  if (working) {
    group.add(box(0.26, 0.04, 0.16, gold, 1.6, 0.2, 1.7));
    const lid = box(0.3, 0.02, 0.2, timber, 0, 0, 0);
    lid.position.set(1.6, 0.29, 1.6);
    lid.rotation.x = -1.2;
    group.add(lid);
  } else {
    group.add(box(0.31, 0.03, 0.21, timber, 1.6, 0.2, 1.7));
  }
  group.add(placed(amphora, clay, 0.3, 0.04, 1.72));
  return group;
}

function palaceModel(): THREE.Object3D {
  const group = new THREE.Group();
  const { width: W, height: D } = BUILDING_SPECS.palace;
  group.add(box(W - 0.2, 0.04, D - 0.2, paving, W / 2, 0, D / 2));
  group.add(box(W - 0.6, 0.18, 3.0, marble, W / 2, 0.04, 1.8));

  const hallWidth = 4.6;
  const hallDepth = 2.2;
  const hallZ = 1.65;
  const floor = 0.22;
  const wallHeight = 1.1;
  group.add(box(hallWidth - 0.6, wallHeight, hallDepth - 0.5, plaster, W / 2, floor, hallZ - 0.1));
  const columns = 8;
  for (let i = 0; i < columns; i++) {
    const x = W / 2 - hallWidth / 2 + 0.15 + (i * (hallWidth - 0.3)) / (columns - 1);
    group.add(columnAt(wallHeight, marble, x, floor, hallZ + hallDepth / 2 - 0.12));
    group.add(columnAt(wallHeight, marble, x, floor, hallZ - hallDepth / 2 + 0.12));
  }
  group.add(box(hallWidth + 0.1, 0.12, hallDepth + 0.1, marble, W / 2, floor + wallHeight, hallZ));
  const roof = gableRoof(hallWidth + 0.1, 0.65, hallDepth + 0.1, marble);
  roof.position.set(W / 2, floor + wallHeight + 0.12, hallZ);
  group.add(roof);
  group.add(box(0.5, 0.7, 0.02, doorway, W / 2, floor, hallZ + hallDepth / 2 - 0.34));

  for (const side of [-1, 1]) {
    const wx = W / 2 + side * 3.25;
    group.add(box(1.7, 0.75, 2.4, plaster, wx, 0.22, 1.8));
    group.add(box(1.84, 0.08, 2.54, clay, wx, 0.97, 1.8));
    for (const dz of [-0.6, 0, 0.6]) group.add(box(0.02, 0.18, 0.14, doorway, wx - side * 0.86, 0.6, 1.8 + dz));
    for (const dx of [-0.45, 0.45]) group.add(box(0.14, 0.18, 0.02, doorway, wx + dx, 0.6, 3.01));
  }

  for (let i = 0; i < 4; i++) group.add(box(1.6 - i * 0.04, 0.045, 0.16, marble, W / 2, 0.04 + i * 0.045, 3.6 - i * 0.12));
  group.add(box(5.2, 0.02, 1.9, marble, W / 2, 0.04, 4.7));
  group.add(box(1.6, 0.06, 0.9, fieldstone, W / 2, 0.06, 4.75));
  group.add(box(1.48, 0.02, 0.78, water, W / 2, 0.11, 4.75));
  for (const side of [-1, 1]) {
    group.add(box(0.3, 0.3, 0.3, marble, W / 2 + side * 1.6, 0.04, 4.75));
    group.add(placed(shrub, foliage, W / 2 + side * 1.6, 0.52, 4.75));
    for (const dz of [0.2, 1.3]) group.add(placed(shrub, foliage, W / 2 + side * 3.6, 0.2, 3.7 + dz));
  }
  return group;
}

function shackModel(): THREE.Object3D {
  const group = new THREE.Group();
  group.add(packedEarth());
  const x0 = 0.18;
  const z0 = 0.18;
  const width = 1.25;
  const depth = 1.0;
  const wallHeight = 0.55;
  const cx = x0 + width / 2;
  const cz = z0 + depth / 2;
  group.add(box(width + 0.06, 0.07, depth + 0.06, fieldstone, cx, 0.03, cz));
  group.add(box(width, wallHeight, depth, plaster, cx, 0.1, cz));
  const roof = gableRoof(depth + 0.16, 0.32, width + 0.14, mudBrick);
  roof.rotation.y = Math.PI / 2;
  roof.position.set(cx, 0.1 + wallHeight, cz);
  group.add(roof);
  group.add(box(0.22, 0.34, 0.02, doorway, x0 + 0.35, 0.1, z0 + depth + 0.005));
  group.add(box(0.15, 0.1, 0.02, doorway, x0 + 0.9, 0.38, z0 + depth + 0.005));
  group.add(box(0.02, 0.1, 0.15, doorway, x0 + width + 0.005, 0.38, cz));

  const leanX = x0 + width + 0.22;
  group.add(box(0.36, 0.34, 0.6, mudBrick, leanX, 0.03, z0 + 0.4));
  const leanRoof = box(0.48, 0.04, 0.7, reed, leanX, 0.37, z0 + 0.4);
  leanRoof.rotation.z = -0.25;
  group.add(leanRoof);

  group.add(box(0.08, 0.14, LOT_DEPTH - 0.3, fieldstone, LOT_WIDTH - 0.16, 0.03, LOT_DEPTH / 2 + 0.05));
  for (const [x, z] of [[1.5, 1.55], [1.66, 1.62], [1.58, 1.76]]) group.add(placed(amphora, clay, x, 0.03, z));
  group.add(box(0.16, 0.12, 0.12, sack, 1.2, 0.03, 1.62));
  return group;
}

function wheatRow(length: number, stage: number, x: number, z: number): THREE.Mesh {
  if (stage === 0) return box(0.16, 0.03, length, furrow, x, 0.03, z);
  return box(0.18, 0.05 + stage * 0.07, length, sprouts[stage], x, 0.03, z);
}

function wheatFarmModel(farm: Building): THREE.Object3D {
  const group = new THREE.Group();
  const { width: W, height: D } = BUILDING_SPECS.wheatFarm;
  group.add(box(W - 0.1, 0.03, D - 0.1, earth, W / 2, 0, D / 2));
  const stage = cropStage(farm);
  for (let i = 0; i < 6; i++) group.add(wheatRow(D - 0.3, stage, 1.15 + i * 0.3, D / 2));
  for (let i = 0; i < 3; i++) group.add(wheatRow(D - 1.25, stage, 0.25 + i * 0.3, 1.0 + (D - 1.25) / 2 + 0.07));

  group.add(box(0.8, 0.42, 0.62, timber, 0.48, 0.03, 0.4));
  const roof = gableRoof(0.74, 0.26, 0.92, timber, reed);
  roof.rotation.y = Math.PI / 2;
  roof.position.set(0.48, 0.45, 0.4);
  group.add(roof);
  group.add(box(0.26, 0.3, 0.02, doorway, 0.48, 0.03, 0.715));
  if (farm.food > 0) {
    for (const [x, z] of [[0.15, 0.85], [0.3, 0.9], [0.22, 0.98]]) group.add(box(0.13, 0.13, 0.1, sack, x + 0.6, 0.03, z));
  }
  return group;
}

function granaryModel(granary: Building): THREE.Object3D {
  const group = new THREE.Group();
  const { width: W, height: D } = BUILDING_SPECS.granary;
  group.add(box(W - 0.16, 0.04, D - 0.16, paving, W / 2, 0, D / 2));
  group.add(box(3.5, 0.08, 1.3, fieldstone, W / 2, 0.04, 0.8));
  group.add(box(3.4, 0.75, 1.2, mudBrick, W / 2, 0.12, 0.8));
  const roof = gableRoof(1.4, 0.4, 3.55, mudBrick);
  roof.rotation.y = Math.PI / 2;
  roof.position.set(W / 2, 0.87, 0.8);
  group.add(roof);
  group.add(box(0.4, 0.5, 0.02, doorway, W / 2, 0.12, 1.405));

  GRANARY_BINS.forEach(([bx, bz]) => {
    group.add(box(GRANARY_BIN_SIZE, 0.02, GRANARY_BIN_SIZE, earth, bx, 0.04, bz));
    for (const [w, d, x, z] of [
      [GRANARY_BIN_SIZE, 0.05, 0, -GRANARY_BIN_SIZE / 2],
      [GRANARY_BIN_SIZE, 0.05, 0, GRANARY_BIN_SIZE / 2],
      [0.05, GRANARY_BIN_SIZE, -GRANARY_BIN_SIZE / 2, 0],
      [0.05, GRANARY_BIN_SIZE, GRANARY_BIN_SIZE / 2, 0],
    ]) {
      group.add(box(w, 0.08, d, fieldstone, bx + x, 0.04, bz + z));
    }
  });
  const loads = Math.floor(granary.food / UNITS_PER_LOAD);
  for (let load = 0; load < loads; load++) {
    const [bx, bz] = GRANARY_BINS[Math.floor(load / GRANARY_SACKS_PER_BIN)];
    const corner = load % GRANARY_SACKS_PER_BIN;
    const offset = GRANARY_BIN_SIZE / 4;
    const grain = box(0.3, 0.22, 0.3, sack, bx + (corner % 2 ? offset : -offset), 0.04, bz + (corner < 2 ? -offset : offset));
    grain.rotation.y = tileHash(load, granary.id) * 0.5 - 0.25;
    group.add(grain);
  }
  return group;
}

const GRANARY_BIN_SIZE = 0.86;
const GRANARY_SACKS_PER_BIN = 4;
const GRANARY_BINS = [2.4, 3.4].flatMap((z) => [0.55, 1.52, 2.48, 3.45].map((x) => [x, z]));

function agoraModel(): THREE.Object3D {
  const group = new THREE.Group();
  const { width: W, height: D } = BUILDING_SPECS.agora;
  group.add(box(W - 0.06, 0.04, D - 0.06, paving, W / 2, 0, D / 2));
  group.add(box(0.9, 0.05, D - 0.1, marble, 2.5, 0, D / 2));
  for (const spot of AGORA_VENDOR_SPOTS) {
    const { width, height } = BUILDING_SPECS.foodVendor;
    for (const [w, d, x, z] of [
      [width - 0.2, 0.04, width / 2, 0.12],
      [width - 0.2, 0.04, width / 2, height - 0.12],
      [0.04, height - 0.2, 0.12, height / 2],
      [0.04, height - 0.2, width - 0.12, height / 2],
    ]) {
      group.add(box(w, 0.02, d, fieldstone, spot.x + x, 0.04, spot.y + z));
    }
  }
  for (const z of [0.5, D - 0.5]) {
    group.add(box(0.3, 0.2, 0.3, marble, 2.5, 0.05, z));
    group.add(placed(shrub, foliage, 2.5, 0.42, z));
  }
  group.add(box(0.3, 0.32, 0.3, marble, 2.5, 0.05, D / 2));
  group.add(cylinder(0.08, 0.36, bronze, 2.5, 0.37, D / 2));
  group.add(placed(spray, bronze, 2.5, 0.78, D / 2));
  return group;
}

function foodVendorModel(vendor: Building): THREE.Object3D {
  const group = new THREE.Group();
  const posts: [number, number][] = [[0.35, 0.35], [1.65, 0.35], [0.35, 1.45], [1.65, 1.45]];
  for (const [x, z] of posts) group.add(columnAt(0.62, timber, x, 0.05, z));
  for (let i = 0; i < 6; i++) {
    const stripe = box(0.24, 0.04, 1.36, i % 2 === 0 ? awning : plaster, 0.38 + i * 0.25, 0.68, 0.9);
    stripe.rotation.x = 0.12;
    group.add(stripe);
  }
  group.add(box(1.2, 0.24, 0.32, timber, 1, 0.05, 1.3));
  if (vendor.workers > 0 && vendor.food > 0) {
    for (const x of [0.55, 0.8, 1.05, 1.3]) {
      const loaf = placed(spray, bread, x, 0.33, 1.3);
      loaf.scale.set(1.3, 0.8, 1);
      group.add(loaf);
    }
    for (const [x, z] of [[0.55, 0.7], [0.85, 0.65]]) group.add(cylinder(0.12, 0.14, reed, x, 0.05, z));
    for (const [x, z] of [[0.55, 0.7], [0.85, 0.65]]) group.add(cylinder(0.1, 0.02, ripeWheat, x, 0.19, z));
  }
  group.add(placed(amphora, clay, 1.5, 0.05, 0.7));
  return group;
}

function parkModel(): THREE.Object3D {
  const group = new THREE.Group();
  group.add(box(0.94, 0.04, 0.94, lawn, 0.5, 0, 0.5));
  group.add(columnAt(0.35, timber, 0.35, 0.04, 0.35));
  const canopy = placed(shrub, foliage, 0.35, 0.55, 0.35);
  canopy.scale.setScalar(1.4);
  group.add(canopy);
  group.add(box(0.4, 0.04, 0.12, timber, 0.62, 0.15, 0.75));
  for (const x of [0.46, 0.78]) group.add(box(0.04, 0.12, 0.1, fieldstone, x, 0.04, 0.75));
  group.add(placed(shrub, petalMaterials[0], 0.78, 0.1, 0.25));
  return group;
}

function columnModel(): THREE.Object3D {
  const group = new THREE.Group();
  group.add(box(0.6, 0.1, 0.6, marble, 0.5, 0, 0.5));
  group.add(box(0.44, 0.1, 0.44, marble, 0.5, 0.1, 0.5));
  group.add(columnAt(1.1, marble, 0.5, 0.2, 0.5));
  group.add(box(0.26, 0.08, 0.26, marble, 0.5, 1.3, 0.5));
  group.add(placed(spray, bronze, 0.5, 1.45, 0.5));
  return group;
}

function flowerGardenModel(): THREE.Object3D {
  const group = new THREE.Group();
  const { width: W, height: D } = BUILDING_SPECS.flowerGarden;
  group.add(box(W - 0.1, 0.04, D - 0.1, lawn, W / 2, 0, D / 2));
  group.add(box(W - 0.2, 0.05, 0.22, paving, W / 2, 0, D / 2));
  group.add(box(0.22, 0.05, D - 0.2, paving, W / 2, 0, D / 2));
  const beds: [number, number][] = [[0.5, 0.5], [1.5, 0.5], [0.5, 1.5], [1.5, 1.5]];
  beds.forEach(([bx, bz], bed) => {
    group.add(box(0.66, 0.08, 0.66, fieldstone, bx, 0.03, bz));
    group.add(box(0.58, 0.04, 0.58, earth, bx, 0.07, bz));
    for (let i = 0; i < 9; i++) {
      const flower = placed(spray, petalMaterials[(bed + i) % petalMaterials.length], bx - 0.2 + (i % 3) * 0.2, 0.15, bz - 0.2 + Math.floor(i / 3) * 0.2);
      flower.scale.setScalar(0.9);
      group.add(flower);
    }
  });
  group.add(placed(amphora, marble, W / 2, 0.05, D / 2));
  return group;
}

function hovelModel(): THREE.Object3D {
  const group = new THREE.Group();
  group.add(packedEarth());
  const wallHeight = 0.6;
  group.add(box(1.3, 0.07, 0.9, fieldstone, 0.8, 0.03, 0.6));
  group.add(box(1.24, wallHeight, 0.84, plaster, 0.8, 0.1, 0.6));
  const roof = gableRoof(0.98, 0.34, 1.38, plaster);
  roof.rotation.y = Math.PI / 2;
  roof.position.set(0.8, 0.1 + wallHeight, 0.6);
  group.add(roof);

  group.add(box(0.7, 0.07, 0.9, fieldstone, 0.5, 0.03, 1.38));
  group.add(box(0.64, 0.48, 0.84, plaster, 0.5, 0.1, 1.38));
  const wingRoof = gableRoof(0.78, 0.26, 0.98, plaster);
  wingRoof.position.set(0.5, 0.58, 1.38);
  group.add(wingRoof);
  group.add(box(0.22, 0.34, 0.02, doorway, 0.5, 0.1, 1.805));
  group.add(box(0.14, 0.1, 0.02, doorway, 1.1, 0.44, 1.025));
  group.add(box(0.02, 0.1, 0.14, doorway, 1.425, 0.44, 0.45));

  const yardEdge = LOT_WIDTH - 0.14;
  group.add(box(0.08, 0.2, 0.86, plaster, yardEdge, 0.03, 1.42));
  group.add(box(0.98, 0.2, 0.08, plaster, 1.33, 0.03, yardEdge));
  group.add(cylinder(0.14, 0.16, fieldstone, 1.38, 0.03, 1.4));
  group.add(cylinder(0.1, 0.01, water, 1.38, 0.19, 1.4));
  group.add(placed(amphora, clay, 1.65, 0.03, 1.15));
  group.add(placed(shrub, foliage, 1.7, 0.18, 0.25));
  return group;
}

function homesteadModel(): THREE.Object3D {
  const group = new THREE.Group();
  group.add(box(LOT_WIDTH - 0.1, 0.03, LOT_DEPTH - 0.1, paving, LOT_WIDTH / 2, 0, LOT_DEPTH / 2));
  group.add(box(1.5, 0.07, 1.0, fieldstone, 0.85, 0.03, 0.62));
  group.add(box(1.44, 0.55, 0.94, plaster, 0.85, 0.1, 0.62));
  group.add(box(0.8, 0.4, 0.8, plaster, 0.6, 0.65, 0.6));
  const upperRoof = gableRoof(0.92, 0.28, 0.94, plaster);
  upperRoof.rotation.y = Math.PI / 2;
  upperRoof.position.set(0.6, 1.05, 0.6);
  group.add(upperRoof);
  group.add(box(0.66, 0.05, 0.98, clay, 1.25, 0.65, 0.62));
  group.add(box(0.24, 0.36, 0.02, doorway, 0.45, 0.1, 1.095));
  for (const x of [0.95, 1.35]) group.add(box(0.14, 0.12, 0.02, shutter, x, 0.38, 1.095));
  group.add(box(0.14, 0.12, 0.02, shutter, 0.6, 0.82, 1.005));
  group.add(box(0.02, 0.12, 0.14, shutter, 1.575, 0.38, 0.62));

  const yardEdge = LOT_WIDTH - 0.12;
  group.add(box(0.08, 0.22, 0.75, plaster, yardEdge, 0.03, 1.5));
  group.add(box(1.0, 0.22, 0.08, plaster, 1.38, 0.03, yardEdge));
  for (const [x, z] of [[1.1, 1.3], [1.75, 1.3]]) group.add(columnAt(0.42, timber, x, 0.03, z));
  group.add(box(0.75, 0.04, 0.5, vine, 1.42, 0.45, 1.55));
  group.add(placed(amphora, clay, 1.7, 0.03, 1.75));
  group.add(box(0.16, 0.12, 0.12, sack, 1.2, 0.03, 1.75));
  group.add(placed(shrub, foliage, 0.3, 0.18, 1.6));
  return group;
}

function tenementModel(): THREE.Object3D {
  const group = new THREE.Group();
  group.add(box(LOT_WIDTH - 0.06, 0.03, LOT_DEPTH - 0.06, paving, LOT_WIDTH / 2, 0, LOT_DEPTH / 2));
  const storey = 0.48;
  const wings: [number, number, number, number][] = [
    [1.8, 0.62, 1.0, 0.41],
    [0.62, 1.1, 0.41, 1.37],
  ];
  for (const [w, d, x, z] of wings) {
    group.add(box(w + 0.06, 0.07, d + 0.06, fieldstone, x, 0.03, z));
    group.add(box(w, 2 * storey, d, plaster, x, 0.1, z));
    group.add(box(w + 0.02, 0.03, d + 0.02, mudBrick, x, 0.1 + storey, z));
  }
  const backRoof = gableRoof(0.74, 0.26, 1.9, plaster);
  backRoof.rotation.y = Math.PI / 2;
  backRoof.position.set(1.0, 0.1 + 2 * storey, 0.41);
  group.add(backRoof);
  const sideRoof = gableRoof(0.74, 0.26, 1.2, plaster);
  sideRoof.position.set(0.41, 0.1 + 2 * storey, 1.37);
  group.add(sideRoof);
  for (const x of [0.95, 1.3, 1.65]) {
    for (const y of [0.32, 0.32 + storey]) group.add(box(0.13, 0.14, 0.02, shutter, x, y, 0.725));
  }
  for (const z of [1.05, 1.45]) group.add(box(0.02, 0.14, 0.13, shutter, 0.725, 0.32 + storey, z));
  group.add(box(0.24, 0.36, 0.02, doorway, 0.41, 0.1, 1.925));
  group.add(box(0.02, 0.36, 0.24, doorway, 0.725, 0.1, 1.5));
  const yardEdge = LOT_WIDTH - 0.08;
  group.add(box(0.08, 0.26, 1.2, plaster, yardEdge, 0.03, 1.32));
  group.add(box(1.2, 0.26, 0.08, plaster, 1.32, 0.03, yardEdge));
  group.add(cylinder(0.14, 0.16, fieldstone, 1.3, 0.03, 1.3));
  group.add(cylinder(0.1, 0.01, water, 1.3, 0.19, 1.3));
  group.add(box(0.95, 0.04, 0.3, vine, 1.3, 0.5, 1.75));
  group.add(placed(amphora, clay, 1.72, 0.03, 1.0));
  return group;
}

function scrollRack(x: number, z: number): THREE.Object3D {
  const group = new THREE.Group();
  group.add(box(0.5, 0.36, 0.14, timber, x, 0.04, z));
  for (const dy of [0.1, 0.22]) {
    for (const dx of [-0.15, 0, 0.15]) {
      const roll = cylinder(0.035, 0.12, scroll, x + dx, 0.04 + dy, z + 0.02);
      roll.rotation.x = Math.PI / 2;
      group.add(roll);
    }
  }
  return group;
}

function collegeModel(): THREE.Object3D {
  const group = new THREE.Group();
  const { width: W, height: D } = BUILDING_SPECS.college;
  group.add(box(W - 0.1, 0.04, D - 0.1, paving, W / 2, 0, D / 2));
  group.add(box(2.6, 0.1, 1.5, marble, W / 2, 0.04, 0.95));
  group.add(box(2.4, 0.75, 0.95, plaster, W / 2, 0.14, 0.75));
  for (let i = 0; i < 6; i++) group.add(columnAt(0.75, marble, 0.4 + i * 0.44, 0.14, 1.55));
  group.add(box(2.6, 0.08, 1.5, marble, W / 2, 0.89, 0.95));
  const roof = gableRoof(1.55, 0.42, 2.66, clay);
  roof.rotation.y = Math.PI / 2;
  roof.position.set(W / 2, 0.97, 0.95);
  group.add(roof);
  group.add(box(0.36, 0.5, 0.02, doorway, W / 2, 0.14, 1.235));
  group.add(scrollRack(0.75, 1.3));
  group.add(scrollRack(2.25, 1.3));
  for (const x of [0.7, 2.3]) group.add(box(0.7, 0.12, 0.22, marble, x, 0.04, 2.4));
  group.add(box(0.24, 0.5, 0.24, marble, W / 2, 0.04, 2.35));
  group.add(placed(spray, bronze, W / 2, 0.64, 2.35));
  return group;
}

function standingFigure(robe: THREE.Material, x: number, y: number, z: number): THREE.Object3D {
  const group = new THREE.Group();
  group.add(cylinder(0.07, 0.34, robe, x, y, z));
  group.add(placed(spray, skin, x, y + 0.42, z));
  return group;
}

function podiumModel(performing: boolean): THREE.Object3D {
  const group = new THREE.Group();
  group.add(box(1.86, 0.04, 1.86, paving, 1, 0, 1));
  for (let i = 0; i < 3; i++) group.add(box(1.2 - i * 0.3, 0.12, 1.0 - i * 0.24, marble, 1, 0.04 + i * 0.12, 0.8 - i * 0.04));
  group.add(box(0.2, 0.3, 0.14, timber, 1.25, 0.4, 0.62));
  for (const x of [0.5, 1.5]) group.add(box(0.6, 0.1, 0.16, fieldstone, x, 0.04, 1.7));
  group.add(placed(shrub, foliage, 0.2, 0.18, 0.2));
  group.add(placed(shrub, foliage, 1.8, 0.18, 0.2));
  if (performing) group.add(standingFigure(philosopherRobe, 0.9, 0.4, 0.75));
  return group;
}

function gymnasiumModel(): THREE.Object3D {
  const group = new THREE.Group();
  const { width: W, height: D } = BUILDING_SPECS.gymnasium;
  group.add(box(W - 0.06, 0.04, D - 0.06, sand, W / 2, 0, D / 2));
  group.add(box(W - 0.9, 0.05, D - 1.6, lawn, W / 2, 0, 1.75));
  for (const [w, d, x, z] of [
    [W - 0.3, 0.05, W / 2, 0.85],
    [W - 0.3, 0.05, W / 2, D - 0.15],
    [0.05, D - 1.0, 0.15, 1.85],
    [0.05, D - 1.0, W - 0.15, 1.85],
  ]) {
    group.add(box(w, 0.06, d, fieldstone, x, 0.04, z));
  }
  group.add(box(W - 0.2, 0.06, 0.7, fieldstone, W / 2, 0.04, 0.4));
  group.add(box(W - 0.3, 0.55, 0.2, plaster, W / 2, 0.1, 0.18));
  for (let i = 0; i < 6; i++) group.add(columnAt(0.55, marble, 0.25 + i * 0.5, 0.1, 0.65));
  const roof = box(W - 0.1, 0.06, 0.8, clay, W / 2, 0.65, 0.4);
  roof.rotation.x = -0.18;
  group.add(roof);
  for (const x of [0.6, 2.4]) group.add(box(0.12, 0.6, 0.12, marble, x, 0.04, 1.75));
  group.add(cylinder(0.1, 0.03, bronze, W / 2, 0.06, 2.3));
  return group;
}

function maskAt(material: THREE.Material, x: number, y: number, z: number): THREE.Object3D {
  const group = new THREE.Group();
  const face = placed(spray, material, x, y, z);
  face.scale.set(1.6, 2, 0.6);
  group.add(face);
  for (const dx of [-0.035, 0.035]) group.add(box(0.025, 0.02, 0.02, doorway, x + dx, y + 0.02, z + 0.035));
  group.add(box(0.05, 0.015, 0.02, doorway, x, y - 0.05, z + 0.035));
  return group;
}

function dramaSchoolModel(): THREE.Object3D {
  const group = new THREE.Group();
  const { width: W, height: D } = BUILDING_SPECS.dramaSchool;
  group.add(box(W - 0.1, 0.04, D - 0.1, paving, W / 2, 0, D / 2));
  group.add(box(2.5, 0.08, 1.4, fieldstone, W / 2, 0.04, 0.9));
  group.add(box(2.4, 0.8, 1.3, plaster, W / 2, 0.12, 0.9));
  const roof = gableRoof(1.5, 0.4, 2.56, clay);
  roof.rotation.y = Math.PI / 2;
  roof.position.set(W / 2, 0.92, 0.9);
  group.add(roof);
  group.add(box(0.4, 0.52, 0.02, doorway, W / 2, 0.12, 1.555));
  group.add(maskAt(comicMask, W / 2 - 0.42, 0.7, 1.58));
  group.add(maskAt(tragicMask, W / 2 + 0.42, 0.7, 1.58));
  group.add(box(1.4, 0.14, 0.6, timber, W / 2, 0.04, 2.25));
  for (const x of [0.35, 2.65]) group.add(columnAt(0.5, timber, x, 0.04, 2.25));
  group.add(box(W - 0.4, 0.04, 0.06, awning, W / 2, 0.54, 2.25));
  group.add(placed(amphora, clay, 0.4, 0.04, 2.7));
  return group;
}

const THEATER_TIERS = 5;
const THEATER_RADIUS = 2.35;
const THEATER_ORCHESTRA = 0.85;
const THEATER_AISLE = 0.15;
const THEATER_RISER = 0.13;
const theaterTiers = Array.from({ length: THEATER_TIERS }, (_, i) => {
  const firstRow = THEATER_ORCHESTRA + THEATER_AISLE;
  const inner = firstRow + (i * (THEATER_RADIUS - firstRow)) / THEATER_TIERS;
  const shape = new THREE.Shape();
  shape.absarc(0, 0, THEATER_RADIUS, 0, Math.PI, false);
  shape.absarc(0, 0, inner, Math.PI, 0, true);
  return new THREE.ExtrudeGeometry(shape, { depth: (i + 1) * THEATER_RISER, bevelEnabled: false, curveSegments: 24 }).rotateX(
    -Math.PI / 2,
  );
});

function theaterModel(performing: boolean): THREE.Object3D {
  const group = new THREE.Group();
  const { width: W, height: D } = BUILDING_SPECS.theater;
  const orchestraZ = 3.15;
  group.add(box(W - 0.1, 0.04, D - 0.1, lawn, W / 2, 0, D / 2));
  theaterTiers.forEach((tier, i) => group.add(placed(tier, i % 2 === 0 ? marble : fieldstone, W / 2, 0.04, orchestraZ)));
  group.add(cylinder(THEATER_ORCHESTRA, 0.04, paving, W / 2, 0.04, orchestraZ));
  group.add(box(4.0, 0.12, 0.7, fieldstone, W / 2, 0.04, 4.35));
  group.add(box(3.6, 0.55, 0.3, plaster, W / 2, 0.16, 4.55));
  for (let i = 0; i < 6; i++) group.add(columnAt(0.55, marble, 0.95 + i * 0.62, 0.16, 4.3));
  group.add(box(3.8, 0.06, 0.6, clay, W / 2, 0.71, 4.45));
  for (const x of [1.6, 3.4]) group.add(box(0.3, 0.4, 0.02, doorway, x, 0.16, 4.39));
  if (performing) {
    group.add(standingFigure(actorRobe, W / 2 - 0.3, 0.08, orchestraZ + 0.2));
    group.add(standingFigure(tragicRobe, W / 2 + 0.3, 0.08, orchestraZ + 0.1));
    group.add(maskAt(comicMask, W / 2 - 0.3, 0.5, orchestraZ + 0.27));
    group.add(maskAt(tragicMask, W / 2 + 0.3, 0.5, orchestraZ + 0.17));
  }
  return group;
}

function fleecePile(x: number, z: number, size: number): THREE.Object3D {
  const group = new THREE.Group();
  for (const [dx, dz, s] of [[0, 0, 1.2], [0.12, 0.05, 0.9], [-0.06, 0.12, 0.8]]) {
    const puff = placed(shrub, wool, x + dx * size, 0.08 * size, z + dz * size);
    puff.scale.set(s * size, 0.55 * s * size, s * size);
    group.add(puff);
  }
  return group;
}

function cardingShedModel(shed: Building): THREE.Object3D {
  const group = new THREE.Group();
  group.add(box(1.86, 0.04, 1.86, earth, 1, 0, 1));
  group.add(box(1.5, 0.06, 0.8, fieldstone, 1, 0.04, 0.55));
  group.add(box(1.4, 0.5, 0.7, timber, 1, 0.1, 0.55));
  const roof = gableRoof(0.86, 0.3, 1.56, timber, reed);
  roof.rotation.y = Math.PI / 2;
  roof.position.set(1, 0.6, 0.55);
  group.add(roof);
  group.add(box(0.3, 0.36, 0.02, doorway, 0.7, 0.1, 0.905));
  group.add(box(0.5, 0.16, 0.22, timber, 1.35, 0.04, 1.25));
  for (const x of [1.2, 1.5]) group.add(box(0.14, 0.02, 0.16, fieldstone, x, 0.2, 1.25));
  group.add(fleecePile(0.45, 1.35, 1.2));
  if (shed.fleece > 0) group.add(fleecePile(1.55, 1.65, 1));
  for (const [x, z] of [[0.15, 1.85], [0.6, 1.85], [1.05, 1.85], [1.5, 1.85]]) group.add(columnAt(0.22, timber, x, 0.04, z));
  group.add(box(1.5, 0.03, 0.03, timber, 0.83, 0.18, 1.85));
  return group;
}

function bale(x: number, y: number, z: number, turn: number): THREE.Object3D {
  const group = new THREE.Group();
  group.add(box(0.26, 0.18, 0.2, wool, 0, 0, 0));
  for (const dx of [-0.07, 0.07]) group.add(box(0.025, 0.185, 0.21, twine, dx, 0, 0));
  group.position.set(x, y, z);
  group.rotation.y = turn;
  return group;
}

const STOREHOUSE_SLOT_WIDTH = 0.68;
const STOREHOUSE_SLOT_DEPTH = 0.86;
const STOREHOUSE_SLOT_SPOTS = [1.55, 2.47].flatMap((z) => [0.42, 1.14, 1.86, 2.58].map((x) => [x, z]));
const BALES_PER_SLOT = SLOT_SIZE / UNITS_PER_LOAD;

function storehouseModel(storehouse: Building): THREE.Object3D {
  const group = new THREE.Group();
  const { width: W } = BUILDING_SPECS.storehouse;
  group.add(box(W - 0.1, 0.04, W - 0.1, paving, W / 2, 0, W / 2));
  group.add(box(2.8, 0.08, 0.95, fieldstone, W / 2, 0.04, 0.58));
  group.add(box(2.7, 0.6, 0.85, plaster, W / 2, 0.12, 0.58));
  const roof = gableRoof(1.05, 0.32, 2.86, plaster);
  roof.rotation.y = Math.PI / 2;
  roof.position.set(W / 2, 0.72, 0.58);
  group.add(roof);
  for (const x of [0.75, W / 2, W - 0.75]) group.add(box(0.36, 0.44, 0.02, doorway, x, 0.12, 1.01));
  STOREHOUSE_SLOT_SPOTS.slice(0, STOREHOUSE_SLOTS).forEach(([sx, sz]) => {
    for (const [w, d, x, z] of [
      [STOREHOUSE_SLOT_WIDTH, 0.04, 0, STOREHOUSE_SLOT_DEPTH / 2],
      [0.04, STOREHOUSE_SLOT_DEPTH, -STOREHOUSE_SLOT_WIDTH / 2, 0],
      [0.04, STOREHOUSE_SLOT_DEPTH, STOREHOUSE_SLOT_WIDTH / 2, 0],
    ]) {
      group.add(box(w, 0.1, d, timber, sx + x, 0.04, sz + z));
    }
  });
  const loads = Math.floor(storehouse.fleece / UNITS_PER_LOAD);
  for (let load = 0; load < loads; load++) {
    const [sx, sz] = STOREHOUSE_SLOT_SPOTS[Math.floor(load / BALES_PER_SLOT)];
    const spot = load % BALES_PER_SLOT;
    const turn = tileHash(load, storehouse.id) * 0.4 - 0.2;
    group.add(bale(sx + (spot % 2 ? 0.14 : -0.14), 0.04, sz + (spot < 2 ? -0.2 : 0.2), turn));
  }
  return group;
}

function fleeceVendorModel(vendor: Building): THREE.Object3D {
  const group = new THREE.Group();
  const posts: [number, number][] = [[0.35, 0.35], [1.65, 0.35], [0.35, 1.45], [1.65, 1.45]];
  for (const [x, z] of posts) group.add(columnAt(0.62, timber, x, 0.05, z));
  for (let i = 0; i < 6; i++) {
    const stripe = box(0.24, 0.04, 1.36, i % 2 === 0 ? fleeceAwning : plaster, 0.38 + i * 0.25, 0.68, 0.9);
    stripe.rotation.x = 0.12;
    group.add(stripe);
  }
  group.add(box(1.2, 0.24, 0.32, timber, 1, 0.05, 1.3));
  group.add(box(1.3, 0.03, 0.03, timber, 1, 0.58, 0.4));
  if (vendor.workers > 0 && vendor.fleece > 0) {
    for (const x of [0.6, 1.0, 1.4]) group.add(box(0.26, 0.24, 0.03, wool, x, 0.32, 0.42));
    group.add(bale(0.75, 0.29, 1.3, 0.1));
    group.add(bale(1.15, 0.29, 1.3, -0.15));
  }
  group.add(placed(amphora, clay, 1.5, 0.05, 0.75));
  return group;
}

const MODELS: Record<Exclude<BuildingType, 'house'>, (building: Building, state: GameState) => THREE.Object3D> = {
  fountain: (b) => fountainModel(b.workers > 0),
  taxOffice: (b) => taxOfficeModel(b.workers > 0),
  palace: palaceModel,
  wheatFarm: wheatFarmModel,
  granary: granaryModel,
  agora: agoraModel,
  foodVendor: foodVendorModel,
  park: parkModel,
  column: columnModel,
  flowerGarden: flowerGardenModel,
  college: collegeModel,
  podium: (b, state) => podiumModel(isPerforming(state, b)),
  gymnasium: gymnasiumModel,
  dramaSchool: dramaSchoolModel,
  theater: (b, state) => theaterModel(isPerforming(state, b)),
  cardingShed: cardingShedModel,
  storehouse: storehouseModel,
  fleeceVendor: fleeceVendorModel,
};

const HOUSE_MODELS: Record<HouseLevel, () => THREE.Object3D> = {
  hut: hutModel,
  shack: shackModel,
  hovel: hovelModel,
  homestead: homesteadModel,
  tenement: tenementModel,
};

export function buildingModel(building: Building, state: GameState): THREE.Object3D {
  if (building.type === 'house') {
    const level = houseLevel(building);
    return level ? HOUSE_MODELS[level]() : vacantLotModel();
  }
  return MODELS[building.type](building, state);
}

export function roadblockModel(roadRunsAlongX: boolean): THREE.Object3D {
  const barrier = new THREE.Group();
  for (const x of [-0.36, 0.36]) {
    barrier.add(box(0.12, 0.34, 0.12, marble, x, 0, 0));
    barrier.add(box(0.15, 0.04, 0.15, clay, x, 0.34, 0));
  }
  barrier.add(box(0.72, 0.06, 0.06, timber, 0, 0.24, 0));
  for (const x of [-0.18, 0, 0.18]) barrier.add(box(0.07, 0.065, 0.065, clay, x, 0.238, 0));
  barrier.rotation.y = roadRunsAlongX ? Math.PI / 2 : 0;
  barrier.position.set(0.5, 0, 0.5);
  return barrier;
}

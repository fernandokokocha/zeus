import * as THREE from 'three';
import { AGORA_VENDOR_SPOTS, BUILDING_SPECS, type BuildingType } from '../sim/buildings';
import { CROP_STAGES, UNITS_PER_LOAD, cropStage } from '../sim/food';
import { SLOT_SIZE, STOREHOUSE_GOODS, STOREHOUSE_SLOTS, slotsOf, type StoredGood } from '../sim/storehouse';
import { houseLevel, type HouseLevel } from '../sim/housing';
import { BRONZE_PER_SCULPTURE } from '../sim/materials';
import { SANCTUARY_STAGES, builtStages, isFinished, materialNeeded, type Sanctuary, type SanctuaryMaterial } from '../sim/sanctuaries';
import { isRipe } from '../sim/olives';
import { isPerforming } from '../sim/schools';
import { isBurning } from '../sim/safety';
import type { Building, GameState } from '../sim/state';
import { PALETTE, tileHash } from './palette';
import { bakedOnce } from './bake';
import { hovelModel, hutModel, shackModel } from './house-models';

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
const oliveLeaf = lambert(PALETTE.oliveLeaf);
const oliveLeafDark = lambert(PALETTE.oliveLeafDark);
const ripeOlive = lambert(PALETTE.olive);
const oilGold = lambert(PALETTE.oil);
const oilAwning = lambert(PALETTE.oilAwning);
const petalMaterials = PALETTE.petals.map(lambert);
const sprouts = Array.from({ length: CROP_STAGES }, (_, stage) =>
  lambert(new THREE.Color(PALETTE.sprout).lerp(new THREE.Color(PALETTE.wheat), stage / (CROP_STAGES - 1)).getHex()),
);
const charred = lambert(PALETTE.char);
const ash = lambert(PALETTE.ash);
const ember = new THREE.MeshBasicMaterial({ color: PALETTE.ember });
const flame = new THREE.MeshBasicMaterial({ color: PALETTE.flame });
const ore = lambert(PALETTE.ore);
const logWood = lambert(PALETTE.log);
const sawdust = lambert(PALETTE.sawdust);
const steel = lambert(PALETTE.axeHead);
const glow = new THREE.MeshBasicMaterial({ color: PALETTE.glow });
const smoke = new THREE.MeshLambertMaterial({ color: PALETTE.smoke, transparent: true, opacity: 0.55 });
const falling = new THREE.MeshBasicMaterial({ color: PALETTE.spray, transparent: true, opacity: 0.85 });

const unitBox = new THREE.BoxGeometry(1, 1, 1);
const stone = new THREE.DodecahedronGeometry(0.05);
const column = new THREE.CylinderGeometry(0.07, 0.08, 1, 10).translate(0, 0.5, 0);
const disc = new THREE.CylinderGeometry(1, 1, 1, 20).translate(0, 0.5, 0);
const shrub = new THREE.SphereGeometry(0.22, 8, 6);
const stream = new THREE.CylinderGeometry(0.035, 0.06, 1, 8);
const spray = new THREE.SphereGeometry(0.06, 8, 6);
const tongue = new THREE.ConeGeometry(0.09, 0.32, 7).translate(0, 0.16, 0);
const puff = new THREE.SphereGeometry(0.12, 8, 6);
const log = new THREE.CylinderGeometry(0.04, 0.04, 0.3, 8).rotateZ(Math.PI / 2);
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
const LOADS_PER_SLOT = SLOT_SIZE / UNITS_PER_LOAD;

const STORED_LOAD: Record<StoredGood, (x: number, z: number, turn: number) => THREE.Object3D> = {
  fleece: (x, z, turn) => bale(x, 0.04, z, turn),
  olives: (x, z) => basket(x, z, true),
  oil: (x, z) => oilJar(x, 0.04, z),
  wood: (x, z, turn) => logPile(x, 0.04, z, turn),
  marble: (x, z, turn) => marbleBlock(x, 0.04, z, turn),
  bronze: (x, z) => ingots(x, 0.04, z),
  sculptures: (x, z) => statue(x, 0.04, z, 0.5),
};

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
  let firstSlot = 0;
  for (const good of STOREHOUSE_GOODS) {
    const loads = Math.floor(storehouse[good] / UNITS_PER_LOAD);
    for (let load = 0; load < loads; load++) {
      const [sx, sz] = STOREHOUSE_SLOT_SPOTS[firstSlot + Math.floor(load / LOADS_PER_SLOT)];
      const spot = load % LOADS_PER_SLOT;
      const x = sx + (spot % 2 ? 0.14 : -0.14);
      const z = sz + (spot < 2 ? -0.2 : 0.2);
      group.add(STORED_LOAD[good](x, z, tileHash(load, storehouse.id) * 0.4 - 0.2));
    }
    firstSlot += slotsOf(storehouse, good);
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

const oliveBerry = new THREE.SphereGeometry(0.025, 6, 4);
const OLIVE_SPOTS = Array.from({ length: 14 }, (_, i) => {
  const angle = i * 2.4;
  const radius = 0.12 + (i % 3) * 0.06;
  return [0.5 + Math.cos(angle) * radius, 0.42 + (i % 4) * 0.06, 0.5 + Math.sin(angle) * radius];
});

function oilJar(x: number, y: number, z: number): THREE.Object3D {
  const group = new THREE.Group();
  group.add(placed(amphora, clay, x, y, z));
  group.add(cylinder(0.03, 0.01, oilGold, x, y + 0.28, z));
  return group;
}

function oliveTreeModel(tree: Building): THREE.Object3D {
  const group = new THREE.Group();
  group.add(cylinder(0.3, 0.02, earth, 0.5, 0, 0.5));
  const trunk = columnAt(0.36, timber, 0.5, 0.02, 0.5);
  trunk.scale.set(1.1, 0.36, 1.1);
  trunk.rotation.z = 0.18;
  group.add(trunk);
  const bough = columnAt(0.22, timber, 0.47, 0.25, 0.5);
  bough.rotation.z = -0.5;
  group.add(bough);
  for (const [x, y, z, s, leaf] of [
    [0.42, 0.46, 0.45, 1.1, oliveLeaf],
    [0.62, 0.5, 0.55, 0.9, oliveLeafDark],
    [0.5, 0.6, 0.62, 0.8, oliveLeaf],
    [0.36, 0.52, 0.66, 0.7, oliveLeafDark],
  ] as [number, number, number, number, THREE.Material][]) {
    const crown = placed(shrub, leaf, x, y, z);
    crown.scale.set(s, 0.6 * s, s);
    group.add(crown);
  }
  if (isRipe(tree)) {
    for (const [x, y, z] of OLIVE_SPOTS) {
      const reach = 1.25;
      group.add(placed(oliveBerry, ripeOlive, 0.5 + (x - 0.5) * reach, y, 0.5 + (z - 0.5) * reach));
    }
  }
  return group;
}

function basket(x: number, z: number, full: boolean): THREE.Object3D {
  const group = new THREE.Group();
  group.add(cylinder(0.1, 0.12, reed, x, 0.04, z));
  if (full) {
    for (const [dx, dz] of [[-0.04, 0], [0.04, 0.02], [0, -0.04], [0.01, 0.04]]) group.add(placed(oliveBerry, ripeOlive, x + dx, 0.17, z + dz));
  }
  return group;
}

function growersLodgeModel(lodge: Building): THREE.Object3D {
  const group = new THREE.Group();
  group.add(box(1.86, 0.04, 1.86, earth, 1, 0, 1));
  group.add(box(1.3, 0.06, 0.8, fieldstone, 0.75, 0.04, 0.55));
  group.add(box(1.2, 0.5, 0.7, plaster, 0.75, 0.1, 0.55));
  const roof = gableRoof(0.86, 0.3, 1.36, plaster, reed);
  roof.rotation.y = Math.PI / 2;
  roof.position.set(0.75, 0.6, 0.55);
  group.add(roof);
  group.add(box(0.26, 0.34, 0.02, doorway, 0.55, 0.1, 0.905));
  group.add(box(0.14, 0.1, 0.02, shutter, 1.05, 0.38, 0.905));
  for (const x of [1.52, 1.72]) {
    const rail = box(0.03, 0.8, 0.03, timber, x, 0.04, 0.55);
    rail.rotation.x = 0.3;
    group.add(rail);
  }
  for (let i = 0; i < 4; i++) group.add(box(0.22, 0.02, 0.02, timber, 1.62, 0.18 + i * 0.17, 0.62 + i * 0.05));
  const full = lodge.olives > 0;
  for (const [x, z] of [[0.4, 1.35], [0.7, 1.5], [1.05, 1.4]]) group.add(basket(x, z, full));
  for (const [x, z] of [[1.5, 1.6], [1.75, 1.3]]) group.add(placed(amphora, clay, x, 0.04, z));
  return group;
}

function olivePressModel(press: Building): THREE.Object3D {
  const group = new THREE.Group();
  group.add(box(1.9, 0.04, 1.9, paving, 1, 0, 1));
  group.add(box(1.7, 0.08, 0.8, fieldstone, 1, 0.04, 0.5));
  group.add(box(1.6, 0.55, 0.7, fieldstone, 1, 0.12, 0.5));
  const roof = gableRoof(0.86, 0.28, 1.76, fieldstone);
  roof.rotation.y = Math.PI / 2;
  roof.position.set(1, 0.67, 0.5);
  group.add(roof);
  group.add(box(0.4, 0.4, 0.02, doorway, 0.6, 0.12, 0.855));
  group.add(cylinder(0.32, 0.14, fieldstone, 0.55, 0.04, 1.35));
  group.add(cylinder(0.27, 0.02, press.olives > 0 ? ripeOlive : fieldstone, 0.55, 0.17, 1.35));
  const millstone = placed(disc, fieldstone, 0.55, 0.36, 1.35);
  millstone.scale.set(0.17, 0.08, 0.17);
  millstone.rotation.z = Math.PI / 2;
  group.add(millstone);
  group.add(box(0.04, 0.32, 0.04, timber, 0.55, 0.17, 1.35));
  group.add(columnAt(0.5, timber, 1.75, 0.04, 1.2));
  const beam = box(1.0, 0.07, 0.07, timber, 1.3, 0.34, 1.2);
  beam.rotation.z = -0.18;
  group.add(beam);
  group.add(box(0.18, 0.16, 0.18, fieldstone, 0.85, 0.14, 1.2));
  group.add(cylinder(0.14, 0.1, fieldstone, 1.3, 0.04, 1.2));
  const loads = Math.floor(press.oil / UNITS_PER_LOAD);
  for (let i = 0; i < loads; i++) {
    group.add(oilJar(1.05 + i * 0.2, 0.04, 1.75));
  }
  return group;
}

function oilVendorModel(vendor: Building): THREE.Object3D {
  const group = new THREE.Group();
  const posts: [number, number][] = [[0.35, 0.35], [1.65, 0.35], [0.35, 1.45], [1.65, 1.45]];
  for (const [x, z] of posts) group.add(columnAt(0.62, timber, x, 0.05, z));
  for (let i = 0; i < 6; i++) {
    const stripe = box(0.24, 0.04, 1.36, i % 2 === 0 ? oilAwning : plaster, 0.38 + i * 0.25, 0.68, 0.9);
    stripe.rotation.x = 0.12;
    group.add(stripe);
  }
  group.add(box(1.2, 0.24, 0.32, timber, 1, 0.05, 1.3));
  if (vendor.workers > 0 && vendor.oil > 0) {
    for (const x of [0.55, 0.85, 1.15, 1.45]) group.add(placed(amphora, clay, x, 0.29, 1.3));
    for (const [x, z] of [[0.5, 0.65], [0.8, 0.6]]) group.add(oilJar(x, 0.05, z));
  }
  return group;
}

function apartmentModel(): THREE.Object3D {
  const group = new THREE.Group();
  group.add(box(LOT_WIDTH - 0.06, 0.03, LOT_DEPTH - 0.06, paving, LOT_WIDTH / 2, 0, LOT_DEPTH / 2));
  const storey = 0.42;
  const storeys = 3;
  group.add(box(1.86, 0.07, 1.16, fieldstone, 1, 0.03, 0.64));
  group.add(box(1.8, storeys * storey, 1.1, plaster, 1, 0.1, 0.64));
  for (let i = 1; i < storeys; i++) group.add(box(1.82, 0.03, 1.12, mudBrick, 1, 0.1 + i * storey, 0.64));
  const roof = gableRoof(1.2, 0.3, 1.9, plaster);
  roof.rotation.y = Math.PI / 2;
  roof.position.set(1, 0.1 + storeys * storey, 0.64);
  group.add(roof);
  for (let i = 0; i < storeys; i++) {
    for (const x of [0.4, 0.8, 1.2, 1.6]) group.add(box(0.13, 0.15, 0.02, shutter, x, 0.28 + i * storey, 1.2));
    group.add(box(0.02, 0.15, 0.13, shutter, 1.905, 0.28 + i * storey, 0.64));
  }
  group.add(box(0.26, 0.34, 0.02, doorway, 1, 0.1, 1.2));
  group.add(box(1.2, 0.04, 0.26, timber, 1, 0.1 + storey, 1.32));
  group.add(box(1.2, 0.14, 0.02, timber, 1, 0.14 + storey, 1.44));
  for (const x of [0.45, 1.55]) group.add(columnAt(storey, timber, x, 0.1, 1.42));
  group.add(box(1.2, 0.03, 0.3, vine, 1, 0.1 + 2 * storey - 0.05, 1.33));
  group.add(placed(amphora, clay, 0.3, 0.03, 1.75));
  group.add(placed(shrub, foliage, 1.7, 0.18, 1.7));
  return group;
}

function townhouseModel(): THREE.Object3D {
  const group = new THREE.Group();
  group.add(box(LOT_WIDTH - 0.04, 0.06, LOT_DEPTH - 0.04, marble, LOT_WIDTH / 2, 0, LOT_DEPTH / 2));
  const height = 0.85;
  const wings: [number, number, number, number][] = [
    [1.9, 0.55, 1.0, 0.33],
    [0.5, 1.3, 0.3, 1.3],
    [0.5, 1.3, 1.7, 1.3],
  ];
  for (const [w, d, x, z] of wings) {
    group.add(box(w, height, d, plaster, x, 0.06, z));
    group.add(box(w + 0.04, 0.05, d + 0.04, marble, x, 0.06 + height, z));
  }
  const backRoof = gableRoof(0.6, 0.24, 1.98, plaster);
  backRoof.rotation.y = Math.PI / 2;
  backRoof.position.set(1, 0.11 + height, 0.33);
  group.add(backRoof);
  for (const x of [0.3, 1.7]) {
    const sideRoof = gableRoof(0.54, 0.2, 1.34, plaster);
    sideRoof.position.set(x, 0.11 + height, 1.3);
    group.add(sideRoof);
  }
  group.add(box(0.9, 0.02, 1.1, lawn, 1, 0.06, 1.25));
  for (const [x, z] of [[0.62, 0.75], [1.0, 0.75], [1.38, 0.75], [0.62, 1.25], [1.38, 1.25], [0.62, 1.75], [1.38, 1.75]]) {
    group.add(columnAt(0.6, marble, x, 0.06, z));
  }
  group.add(cylinder(0.16, 0.08, marble, 1, 0.08, 1.3));
  group.add(cylinder(0.12, 0.01, water, 1, 0.16, 1.3));
  group.add(placed(shrub, foliage, 0.8, 0.2, 1.7));
  group.add(placed(shrub, foliage, 1.2, 0.2, 1.7));
  group.add(box(0.3, 0.45, 0.02, doorway, 1, 0.06, 0.61));
  for (const z of [1.0, 1.6]) {
    group.add(box(0.02, 0.15, 0.13, shutter, 0.045, 0.45, z));
    group.add(box(0.02, 0.15, 0.13, shutter, 1.955, 0.45, z));
  }
  return group;
}

function ladder(height: number, x: number, z: number): THREE.Object3D {
  const group = new THREE.Group();
  for (const side of [-0.07, 0.07]) group.add(box(0.025, height, 0.025, timber, side, 0, 0));
  for (let y = 0.1; y < height; y += 0.12) group.add(box(0.14, 0.02, 0.02, timber, 0, y, 0));
  group.position.set(x, 0.04, z);
  group.rotation.x = -0.3;
  return group;
}

function bucket(x: number, z: number): THREE.Object3D {
  const group = new THREE.Group();
  group.add(cylinder(0.06, 0.09, bronze, x, 0.04, z));
  group.add(cylinder(0.05, 0.005, water, x, 0.125, z));
  return group;
}

function maintenanceOfficeModel(): THREE.Object3D {
  const group = new THREE.Group();
  group.add(box(1.84, 0.04, 1.84, paving, 1, 0, 1));
  const width = 1.1;
  const depth = 1.0;
  const wallHeight = 0.55;
  group.add(box(width, wallHeight, depth, mudBrick, 0.65, 0.04, 0.6));
  const roof = gableRoof(depth + 0.16, 0.28, width + 0.14, mudBrick);
  roof.rotation.y = Math.PI / 2;
  roof.position.set(0.65, 0.04 + wallHeight, 0.6);
  group.add(roof);
  group.add(box(0.28, 0.38, 0.02, doorway, 0.65, 0.04, 0.6 + depth / 2 + 0.005));
  group.add(ladder(0.75, 1.3, 0.25));
  for (const [x, z] of [[1.45, 1.25], [1.62, 1.25], [1.45, 1.42], [1.62, 1.42], [1.53, 1.6]]) group.add(bucket(x, z));
  for (const x of [0.3, 0.9]) group.add(box(0.05, 0.42, 0.05, timber, x, 0.04, 1.6));
  group.add(box(0.7, 0.04, 0.05, timber, 0.6, 0.4, 1.6));
  for (const [x, tool] of [[0.42, bronze], [0.6, timber], [0.78, bronze]] as const) group.add(box(0.03, 0.3, 0.03, tool, x, 0.1, 1.62));
  for (let n = 0; n < 3; n++) group.add(box(0.7, 0.06, 0.08, timber, 1.35, 0.04 + n * 0.06, 0.95 + (n % 2) * 0.03));
  return group;
}

function ruinsModel(ruins: Building, burning: boolean): THREE.Object3D {
  const group = new THREE.Group();
  const jitter = (n: number) => tileHash(ruins.x * 3 + n, ruins.y * 5 + n);
  group.add(box(0.9, 0.03, 0.9, burning ? charred : ash, 0.5, 0, 0.5));
  for (let n = 0; n < 7; n++) {
    const piece = placed(stone, n % 3 === 0 ? charred : fieldstone, 0.15 + jitter(n) * 0.7, 0.05, 0.15 + jitter(n + 7) * 0.7);
    piece.scale.setScalar(1.2 + jitter(n + 14) * 1.3);
    piece.rotation.set(jitter(n + 21) * Math.PI, jitter(n + 28) * Math.PI, 0);
    group.add(piece);
  }
  group.add(box(0.14, 0.12 + jitter(40) * 0.18, 0.5, mudBrick, 0.2 + jitter(41) * 0.6, 0.03, 0.5));
  const beam = box(0.65, 0.05, 0.06, charred, 0.5, 0.06, 0.5);
  beam.rotation.set(0, jitter(42) * Math.PI, 0.25);
  group.add(beam);
  if (!burning) return group;
  for (let n = 0; n < 3; n++) {
    const x = 0.25 + jitter(n + 50) * 0.5;
    const z = 0.25 + jitter(n + 60) * 0.5;
    const tall = 0.8 + jitter(n + 70) * 0.9;
    const fire = placed(tongue, n === 0 ? ember : flame, x, 0.03, z);
    fire.scale.set(1, tall, 1);
    group.add(fire);
    const cloud = placed(puff, smoke, x + 0.08 * n, 0.6 + 0.3 * n, z - 0.05 * n);
    cloud.scale.setScalar(0.8 + 0.4 * n);
    group.add(cloud);
  }
  return group;
}

function logPile(x: number, y: number, z: number, turn: number): THREE.Object3D {
  const group = new THREE.Group();
  for (const [dx, dy] of [[-0.045, 0], [0.045, 0], [0, 0.07]]) group.add(placed(log, logWood, dx, 0.04 + dy, 0));
  group.position.set(x, y, z);
  group.rotation.y = turn;
  return group;
}

function marbleBlock(x: number, y: number, z: number, turn: number): THREE.Object3D {
  const block = box(0.18, 0.13, 0.15, marble, x, y, z);
  block.rotation.y = turn;
  return block;
}

function ingots(x: number, y: number, z: number): THREE.Object3D {
  const group = new THREE.Group();
  for (const [dx, dy, dz] of [[-0.05, 0, -0.04], [0.05, 0, 0.04], [0, 0.04, 0]]) group.add(box(0.12, 0.04, 0.06, bronze, x + dx, y + dy, z + dz));
  return group;
}

function statue(x: number, y: number, z: number, size: number): THREE.Object3D {
  const group = new THREE.Group();
  group.add(box(0.2, 0.1, 0.2, marble, 0, 0, 0));
  group.add(columnAt(0.3, bronze, 0, 0.1, 0));
  group.add(placed(spray, bronze, 0, 0.46, 0));
  const arm = box(0.04, 0.2, 0.04, bronze, 0.08, 0.26, 0);
  arm.rotation.z = -0.5;
  group.add(arm);
  group.position.set(x, y, z);
  group.scale.setScalar(size);
  return group;
}

function workshopBase(material: THREE.Material): THREE.Mesh {
  return box(1.9, 0.04, 1.9, material, 1, 0, 1);
}

function smokePlume(x: number, y: number, z: number): THREE.Object3D {
  const group = new THREE.Group();
  for (let n = 0; n < 3; n++) {
    const cloud = placed(puff, smoke, x + 0.06 * n, y + 0.22 * n, z - 0.04 * n);
    cloud.scale.setScalar(0.6 + 0.3 * n);
    group.add(cloud);
  }
  return group;
}

function addStock(
  group: THREE.Group,
  units: number,
  spots: [number, number][],
  piece: (x: number, z: number, turn: number) => THREE.Object3D,
): void {
  spots.slice(0, Math.floor(units / UNITS_PER_LOAD)).forEach(([x, z], i) => group.add(piece(x, z, tileHash(i, x * 9) * 0.6 - 0.3)));
}

function timberMillModel(mill: Building): THREE.Object3D {
  const group = new THREE.Group();
  group.add(workshopBase(earth));
  for (const [x, z] of [[0.25, 0.2], [1.75, 0.2], [0.25, 1.0], [1.75, 1.0]]) group.add(columnAt(0.6, timber, x, 0.04, z));
  const roof = gableRoof(1.0, 0.3, 1.7, timber, reed);
  roof.rotation.y = Math.PI / 2;
  roof.position.set(1, 0.64, 0.6);
  group.add(roof);
  group.add(box(1.1, 0.24, 0.3, timber, 1, 0.04, 0.6));
  const trunkOnBench = placed(log, logWood, 1, 0.33, 0.6);
  trunkOnBench.scale.set(3.4, 1.4, 1.4);
  group.add(trunkOnBench);
  group.add(box(0.02, 0.18, 0.2, steel, 1, 0.28, 0.6));
  group.add(cylinder(0.32, 0.015, sawdust, 1.3, 0.04, 1.0));
  addStock(group, mill.wood + 2 * UNITS_PER_LOAD, [[0.4, 1.55], [0.75, 1.6], [1.1, 1.55], [1.45, 1.6], [1.75, 1.45], [0.35, 1.25]], (x, z, turn) =>
    logPile(x, 0.04, z, turn),
  );
  return group;
}

function masonryShopModel(shop: Building): THREE.Object3D {
  const group = new THREE.Group();
  group.add(workshopBase(paving));
  group.add(box(0.9, 0.45, 0.7, fieldstone, 0.55, 0.04, 0.45));
  const roof = gableRoof(0.8, 0.22, 1.0, fieldstone);
  roof.position.set(0.55, 0.49, 0.45);
  group.add(roof);
  group.add(box(0.24, 0.3, 0.02, doorway, 0.55, 0.04, 0.805));
  for (const side of [-1, 1]) {
    const leg = box(0.04, 1.0, 0.04, timber, 1.45 + side * 0.2, 0.04, 0.55);
    leg.rotation.z = side * 0.2;
    group.add(leg);
  }
  group.add(box(0.5, 0.04, 0.04, timber, 1.45, 0.98, 0.55));
  group.add(box(0.01, 0.5, 0.01, twine, 1.45, 0.48, 0.55));
  group.add(marbleBlock(1.45, 0.34, 0.55, 0.2));
  addStock(group, shop.marble + UNITS_PER_LOAD, [[1.45, 1.5], [0.4, 1.4], [0.75, 1.55], [1.1, 1.45], [1.75, 1.2]], (x, z, turn) =>
    marbleBlock(x, 0.04, z, turn),
  );
  return group;
}

function foundryModel(foundry: Building): THREE.Object3D {
  const group = new THREE.Group();
  group.add(workshopBase(earth));
  group.add(box(1.3, 0.55, 0.8, mudBrick, 0.8, 0.04, 0.55));
  const roof = gableRoof(0.9, 0.24, 1.4, mudBrick);
  roof.rotation.y = Math.PI / 2;
  roof.position.set(0.8, 0.59, 0.55);
  group.add(roof);
  group.add(box(0.28, 1.2, 0.28, fieldstone, 1.6, 0.04, 0.45));
  const working = foundry.workers > 0;
  group.add(box(0.36, 0.26, 0.02, working ? glow : doorway, 0.8, 0.04, 0.955));
  if (working) group.add(smokePlume(1.6, 1.42, 0.45));
  for (const [x, z] of [[1.55, 1.35], [1.7, 1.55], [1.4, 1.55]]) {
    const lump = placed(stone, ore, x, 0.08, z);
    lump.scale.setScalar(2.4);
    group.add(lump);
  }
  addStock(group, foundry.bronze, [[0.35, 1.3], [0.65, 1.4], [0.95, 1.3], [0.5, 1.65]], (x, z) => ingots(x, 0.04, z));
  return group;
}

function sculptureStudioModel(studio: Building): THREE.Object3D {
  const group = new THREE.Group();
  group.add(workshopBase(paving));
  group.add(box(1.5, 0.55, 0.75, plaster, 1, 0.04, 0.5));
  group.add(box(1.56, 0.06, 0.8, marble, 1, 0.59, 0.5));
  const roof = gableRoof(0.85, 0.26, 1.6, marble);
  roof.rotation.y = Math.PI / 2;
  roof.position.set(1, 0.65, 0.5);
  group.add(roof);
  group.add(box(0.34, 0.38, 0.02, doorway, 1, 0.04, 0.88));
  group.add(statue(0.45, 0.04, 1.35, 1.7));
  if (studio.bronze >= BRONZE_PER_SCULPTURE) group.add(ingots(1.0, 0.04, 1.2));
  addStock(group, studio.sculptures, [[1.3, 1.45], [1.6, 1.45], [1.3, 1.75], [1.6, 1.75]], (x, z) => statue(x, 0.04, z, 0.55));
  return group;
}

function artisansGuildModel(): THREE.Object3D {
  const group = new THREE.Group();
  group.add(workshopBase(paving));
  group.add(box(1.7, 0.08, 1.2, marble, 1, 0.04, 0.75));
  group.add(box(1.5, 0.6, 0.7, plaster, 1, 0.12, 0.6));
  for (const x of [0.35, 0.78, 1.22, 1.65]) group.add(columnAt(0.6, marble, x, 0.12, 1.22));
  const roof = gableRoof(1.2, 0.3, 1.74, marble);
  roof.rotation.y = Math.PI / 2;
  roof.position.set(1, 0.72, 0.75);
  group.add(roof);
  group.add(box(0.3, 0.4, 0.02, doorway, 1, 0.12, 0.955));
  for (let i = 0; i < 3; i++) group.add(box(0.5, 0.04, 0.12, timber, 0.4, 0.04 + i * 0.045, 1.7));
  group.add(marbleBlock(1.6, 0.04, 1.65, 0.3));
  group.add(marbleBlock(1.35, 0.04, 1.72, -0.2));
  return group;
}

const SANCTUARY_COLUMN_SPACING = 1.0;
const SANCTUARY_COLUMN_HEIGHT = 1.5;
const SANCTUARY_STEP = 0.1;
const SANCTUARY_STEPS = 3;
const PILE_LOADS = 4;
const MAX_PILES = 6;
const PILE_SCALE = 2.2;
const PILE_SPACING = 1.3;

interface TempleLayout {
  x: number;
  z: number;
  width: number;
  depth: number;
}

function templeLayout(type: Sanctuary): TempleLayout {
  const { width: W, height: D } = BUILDING_SPECS[type];
  const width = Math.round(W * 0.55);
  const depth = Math.round(D * 0.45);
  return { x: W / 2, z: 0.8 + depth / 2, width, depth };
}

function templePlatform({ x, z, width, depth }: TempleLayout): THREE.Object3D {
  const group = new THREE.Group();
  for (let i = 0; i < SANCTUARY_STEPS; i++) {
    const inset = (SANCTUARY_STEPS - 1 - i) * 0.2;
    group.add(box(width + 0.6 + inset * 2 - 0.4, SANCTUARY_STEP, depth + 0.6 + inset * 2 - 0.4, marble, x, i * SANCTUARY_STEP, z));
  }
  return group;
}

function columnSpots({ x, z, width, depth }: TempleLayout): [number, number][] {
  const across = Math.round(width / SANCTUARY_COLUMN_SPACING);
  const along = Math.round(depth / SANCTUARY_COLUMN_SPACING);
  const spots: [number, number][] = [];
  for (let i = 0; i <= across; i++) {
    const cx = x - width / 2 + (i * width) / across;
    spots.push([cx, z - depth / 2], [cx, z + depth / 2]);
  }
  for (let j = 1; j < along; j++) {
    const cz = z - depth / 2 + (j * depth) / along;
    spots.push([x - width / 2, cz], [x + width / 2, cz]);
  }
  return spots;
}

function templeColumns(layout: TempleLayout): THREE.Object3D {
  const group = new THREE.Group();
  const floor = SANCTUARY_STEPS * SANCTUARY_STEP;
  for (const [cx, cz] of columnSpots(layout)) {
    const shaft = columnAt(SANCTUARY_COLUMN_HEIGHT, marble, cx, floor, cz);
    shaft.scale.set(1.8, SANCTUARY_COLUMN_HEIGHT, 1.8);
    group.add(shaft);
  }
  return group;
}

function templeCellaAndBeams({ x, z, width, depth }: TempleLayout): THREE.Object3D {
  const group = new THREE.Group();
  const floor = SANCTUARY_STEPS * SANCTUARY_STEP;
  group.add(box(width - 1.4, SANCTUARY_COLUMN_HEIGHT, depth - 1.4, plaster, x, floor, z));
  group.add(box(0.7, 0.95, 0.02, doorway, x, floor, z + depth / 2 - 0.69));
  group.add(box(width + 0.35, 0.22, depth + 0.35, marble, x, floor + SANCTUARY_COLUMN_HEIGHT, z));
  return group;
}

function templeRoof({ x, z, width, depth }: TempleLayout): THREE.Object3D {
  const roof = gableRoof(depth + 0.35, 0.75, width + 0.35, marble);
  roof.rotation.y = Math.PI / 2;
  roof.position.set(x, SANCTUARY_STEPS * SANCTUARY_STEP + SANCTUARY_COLUMN_HEIGHT + 0.22, z);
  return roof;
}

function scaffolding({ x, z, width, depth }: TempleLayout, height: number): THREE.Object3D {
  const group = new THREE.Group();
  const corners = [-1, 1].flatMap((sx) => [-1, 1].map((sz) => [x + sx * (width / 2 + 0.55), z + sz * (depth / 2 + 0.55)]));
  for (const [px, pz] of corners) group.add(box(0.07, height, 0.07, timber, px, 0, pz));
  for (const level of [0.45, 0.9, 1.35].filter((y) => y < height)) {
    for (const sz of [-1, 1]) group.add(box(width + 1.1, 0.05, 0.12, timber, x, level, z + sz * (depth / 2 + 0.55)));
  }
  return group;
}

function unusedLoads(site: Building, material: SanctuaryMaterial): number {
  const used = (materialNeeded(site.type as Sanctuary, material) * builtStages(site)) / SANCTUARY_STAGES;
  return Math.max(0, site[material] - used) / UNITS_PER_LOAD;
}

function materialPiles(site: Building): THREE.Object3D {
  const group = new THREE.Group();
  const { width: W, height: D } = BUILDING_SPECS[site.type];
  const piles = (material: SanctuaryMaterial) => Math.min(MAX_PILES, Math.ceil(unusedLoads(site, material) / PILE_LOADS));
  const pieces: ((x: number, z: number, turn: number) => THREE.Object3D)[] = [
    ...Array.from({ length: piles('marble') }, () => (x: number, z: number, turn: number) => {
      const pile = new THREE.Group();
      pile.add(marbleBlock(x, 0.02, z, turn), marbleBlock(x + 0.2, 0.02, z + 0.05, -turn), marbleBlock(x + 0.1, 0.15, z, turn));
      return pile;
    }),
    ...Array.from({ length: piles('wood') }, () => (x: number, z: number, turn: number) => logPile(x, 0.02, z, turn)),
    ...Array.from({ length: piles('sculptures') }, () => (x: number, z: number) => statue(x, 0.02, z, 1.2)),
  ];
  const perRow = Math.floor((W - 1) / PILE_SPACING);
  pieces.forEach((piece, i) => {
    const pile = piece(0, 0, tileHash(i, 3) * 0.8 - 0.4);
    pile.scale.setScalar(PILE_SCALE);
    pile.position.set(1 + (i % perRow) * PILE_SPACING, 0, D - 1.2 - Math.floor(i / perRow) * PILE_SPACING);
    group.add(pile);
  });
  return group;
}

function stakedOutline({ x, z, width, depth }: TempleLayout): THREE.Object3D {
  const group = new THREE.Group();
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) group.add(box(0.05, 0.3, 0.05, timber, x + (sx * (width + 0.6)) / 2, 0, z + (sz * (depth + 0.6)) / 2));
  }
  for (const sz of [-1, 1]) group.add(box(width + 0.6, 0.01, 0.015, twine, x, 0.25, z + (sz * (depth + 0.6)) / 2));
  for (const sx of [-1, 1]) group.add(box(0.015, 0.01, depth + 0.6, twine, x + (sx * (width + 0.6)) / 2, 0.25, z));
  return group;
}

function altar(x: number, z: number): THREE.Object3D {
  const group = new THREE.Group();
  group.add(box(0.9, 0.4, 0.6, marble, x, 0.04, z));
  group.add(box(1.0, 0.06, 0.7, marble, x, 0.44, z));
  group.add(placed(tongue, flame, x, 0.5, z));
  return group;
}

function grove(x: number, z: number, size: number): THREE.Object3D {
  const group = new THREE.Group();
  const trunk = columnAt(0.5 * size, timber, x, 0.04, z);
  trunk.scale.set(1.4, 0.5 * size, 1.4);
  group.add(trunk);
  for (const [dx, dy, dz, s, leaf] of [
    [0, 0.6, 0, 1.3, oliveLeaf],
    [0.15, 0.7, 0.1, 1.0, oliveLeafDark],
    [-0.12, 0.75, -0.08, 0.9, oliveLeaf],
  ] as [number, number, number, number, THREE.Material][]) {
    const crown = placed(shrub, leaf, x + dx * size, dy * size, z + dz * size);
    crown.scale.set(s * size, 0.65 * s * size, s * size);
    group.add(crown);
  }
  return group;
}

const PRECINCT_GARDENS: Record<Sanctuary, (W: number, D: number) => THREE.Object3D> = {
  demeterSanctuary: (W, D) => {
    const group = new THREE.Group();
    for (const side of [-1, 1]) {
      const bedX = W / 2 + side * (W / 4 + 0.8);
      group.add(box(W / 3, 0.05, D * 0.35, furrow, bedX, 0.04, D * 0.72));
      for (let row = 0; row < 5; row++) group.add(box(W / 3 - 0.3, 0.14, 0.18, ripeWheat, bedX, 0.09, D * 0.72 - D * 0.14 + row * D * 0.07));
    }
    return group;
  },
  athenaSanctuary: (W, D) => {
    const group = new THREE.Group();
    for (const side of [-1, 1]) {
      for (const [dx, dz] of [[1.2, 0.62], [2.6, 0.7], [1.8, 0.85], [3.3, 0.88]]) group.add(grove(W / 2 + side * dx * (W / 10), D * dz, 1.6));
    }
    return group;
  },
  hephaestusSanctuary: (W, D) => {
    const group = new THREE.Group();
    for (const side of [-1, 1]) {
      const fx = W / 2 + side * (W / 4 + 0.6);
      group.add(box(1.1, 0.6, 0.9, fieldstone, fx, 0.04, D * 0.72));
      group.add(box(0.5, 0.3, 0.02, glow, fx, 0.1, D * 0.72 + 0.46));
      group.add(smokePlume(fx, 0.8, D * 0.72));
      group.add(box(0.5, 0.3, 0.22, steel, fx, 0.04, D * 0.72 + 0.9));
      group.add(box(0.7, 0.08, 0.3, steel, fx, 0.34, D * 0.72 + 0.9));
    }
    return group;
  },
};

function sanctuaryModel(site: Building): THREE.Object3D {
  const type = site.type as Sanctuary;
  const { width: W, height: D } = BUILDING_SPECS[type];
  const layout = templeLayout(type);
  const built = builtStages(site);
  const group = new THREE.Group();
  group.add(box(W - 0.1, 0.04, D - 0.1, isFinished(site) ? paving : earth, W / 2, 0, D / 2));
  if (built === 0) group.add(stakedOutline(layout));
  if (built >= 1) group.add(templePlatform(layout));
  if (built >= 2) group.add(templeColumns(layout));
  if (built >= 3) group.add(templeCellaAndBeams(layout));
  if (built >= 4) group.add(templeRoof(layout));
  if (!isFinished(site)) {
    if (built >= 1) group.add(scaffolding(layout, built >= 3 ? 1.9 : 1.0));
    group.add(materialPiles(site));
    return group;
  }
  group.add(box(2.2, 0.03, D - layout.z - layout.depth / 2 - 0.3, marble, W / 2, 0.04, (D + layout.z + layout.depth / 2) / 2));
  group.add(statue(W / 2, 0.04, D - 1.6, 5));
  group.add(altar(W / 2, D - 3));
  group.add(PRECINCT_GARDENS[type](W, D));
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
  oliveTree: oliveTreeModel,
  growersLodge: growersLodgeModel,
  olivePress: olivePressModel,
  oilVendor: oilVendorModel,
  timberMill: timberMillModel,
  masonryShop: masonryShopModel,
  foundry: foundryModel,
  sculptureStudio: sculptureStudioModel,
  artisansGuild: artisansGuildModel,
  maintenanceOffice: maintenanceOfficeModel,
  demeterSanctuary: sanctuaryModel,
  athenaSanctuary: sanctuaryModel,
  hephaestusSanctuary: sanctuaryModel,
  ruins: (b, state) => ruinsModel(b, isBurning(state, b)),
};

const HOUSE_MODELS: Record<HouseLevel, () => THREE.Object3D> = {
  hut: bakedOnce(hutModel),
  shack: bakedOnce(shackModel),
  hovel: bakedOnce(hovelModel),
  homestead: homesteadModel,
  tenement: tenementModel,
  apartment: apartmentModel,
  townhouse: townhouseModel,
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

import * as THREE from 'three';
import { BUILDING_SPECS, type BuildingType } from '../sim/buildings';
import { UNITS_PER_LOAD } from '../sim/food';
import { houseLevel, type HouseLevel } from '../sim/housing';
import { SANCTUARY_STAGES, builtStages, isFinished, materialNeeded, type Sanctuary, type SanctuaryMaterial } from '../sim/sanctuaries';
import { isPerforming } from '../sim/schools';
import { isBurning } from '../sim/safety';
import type { Building, GameState } from '../sim/state';
import { PALETTE, tileHash } from './palette';
import { bakedOnce } from './bake';
import { wheatFarmModel } from './farm-models';
import { maintenanceOfficeModel } from './maintenance-models';
import { masonryShopModel } from './masonry-models';
import { agoraModel, vendorModel } from './agora-models';
import { palaceModel } from './palace-models';
import { taxOfficeModel } from './tax-models';
import { gymnasiumModel } from './gymnasium-models';
import { oliveTreeModel } from './olive-models';
import { parkModel } from './park-models';
import { timberMillModel } from './timber-models';
import { storehouseModel } from './storehouse-models';
import { foundryModel } from './foundry-models';
import { sculptureStudioModel } from './sculpture-models';
import { artisansGuildModel } from './guild-models';
import { weaverModel } from './weaver-models';
import { collegeModel } from './college-models';
import { dramaSchoolModel } from './drama-school-models';
import { theaterModel } from './theater-models';
import { columnModel } from './column-models';
import { fountainModel } from './fountain-models';
import { flowerGardenModel } from './flower-garden-models';
import { homesteadModel, hovelModel, hutModel, shackModel, tenementModel, apartmentModel, townhouseModel } from './house-models';

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
const bronze = lambert(PALETTE.bronze);
const foliage = lambert(PALETTE.foliage);
const furrow = lambert(PALETTE.furrow);
const ripeWheat = lambert(PALETTE.wheat);
const sack = lambert(PALETTE.sack);
const wool = lambert(PALETTE.wool);
const twine = lambert(PALETTE.twine);
const shutter = lambert(PALETTE.shutter);
const skin = lambert(PALETTE.skin);
const philosopherRobe = lambert(PALETTE.philosopherRobe);
const oliveLeaf = lambert(PALETTE.oliveLeaf);
const oliveLeafDark = lambert(PALETTE.oliveLeafDark);
const ripeOlive = lambert(PALETTE.olive);
const oilGold = lambert(PALETTE.oil);
const charred = lambert(PALETTE.char);
const ash = lambert(PALETTE.ash);
const ember = new THREE.MeshBasicMaterial({ color: PALETTE.ember });
const flame = new THREE.MeshBasicMaterial({ color: PALETTE.flame });
const logWood = lambert(PALETTE.log);
const steel = lambert(PALETTE.axeHead);
const glow = new THREE.MeshBasicMaterial({ color: PALETTE.glow });
const smoke = new THREE.MeshLambertMaterial({ color: PALETTE.smoke, transparent: true, opacity: 0.55 });

const unitBox = new THREE.BoxGeometry(1, 1, 1);
const stone = new THREE.DodecahedronGeometry(0.05);
const column = new THREE.CylinderGeometry(0.07, 0.08, 1, 10).translate(0, 0.5, 0);
const disc = new THREE.CylinderGeometry(1, 1, 1, 20).translate(0, 0.5, 0);
const shrub = new THREE.SphereGeometry(0.22, 8, 6);
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


const oliveBerry = new THREE.SphereGeometry(0.025, 6, 4);

function oilJar(x: number, y: number, z: number): THREE.Object3D {
  const group = new THREE.Group();
  group.add(placed(amphora, clay, x, y, z));
  group.add(cylinder(0.03, 0.01, oilGold, x, y + 0.28, z));
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

function smokePlume(x: number, y: number, z: number): THREE.Object3D {
  const group = new THREE.Group();
  for (let n = 0; n < 3; n++) {
    const cloud = placed(puff, smoke, x + 0.06 * n, y + 0.22 * n, z - 0.04 * n);
    cloud.scale.setScalar(0.6 + 0.3 * n);
    group.add(cloud);
  }
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
  fountain: fountainModel,
  taxOffice: taxOfficeModel,
  palace: palaceModel,
  wheatFarm: wheatFarmModel,
  granary: granaryModel,
  agora: agoraModel,
  foodVendor: vendorModel,
  park: parkModel,
  column: columnModel,
  flowerGarden: flowerGardenModel,
  college: collegeModel,
  podium: (b, state) => podiumModel(isPerforming(state, b)),
  gymnasium: gymnasiumModel,
  dramaSchool: dramaSchoolModel,
  theater: (b, state) => theaterModel(b, isPerforming(state, b)),
  cardingShed: cardingShedModel,
  storehouse: storehouseModel,
  fleeceVendor: vendorModel,
  oliveTree: oliveTreeModel,
  growersLodge: growersLodgeModel,
  olivePress: olivePressModel,
  oilVendor: vendorModel,
  weaver: weaverModel,
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
  homestead: bakedOnce(homesteadModel),
  tenement: bakedOnce(tenementModel),
  apartment: bakedOnce(apartmentModel),
  townhouse: bakedOnce(townhouseModel),
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

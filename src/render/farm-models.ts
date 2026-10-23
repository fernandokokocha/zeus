import * as THREE from 'three';
import { BUILDING_SPECS } from '../sim/buildings';
import { CROP_STAGES, cropStage } from '../sim/food';
import type { Building } from '../sim/state';
import { bakedOnce } from './bake';
import { blueDoor, poorCube, windowHole } from './kit/cottage';
import { farmerParts, leaningHoe, wheatRow } from './kit/farm';
import { type FigureParts, posedFigure } from './kit/figure';
import { sack } from './kit/food';
import { box, surface } from './kit/kit';
import { bakedFigure, staffPhase } from './staff';

const { width: W, height: D } = BUILDING_SPECS.wheatFarm;
const CLOSED = 0;
const OPEN = 1.2;
const FARMER_SPOT = { x: 1.13, z: 1.12, turn: -Math.PI / 4 };
const RIPE_STAGE = CROP_STAGES - 1;

function wheatFarmShell(stage: number, staffed: boolean, stocked: boolean): THREE.Object3D {
  const group = new THREE.Group();
  group.add(box(W - 0.1, 0.03, D - 0.1, surface('earth'), W / 2, 0, D / 2));
  group.add(poorCube(0.15, 0.15, 0.95, 0.72, 0.52, 'whitewash'));
  group.add(blueDoor(0.42, 0.87, 0.08, staffed ? OPEN : CLOSED));
  group.add(windowHole(0.85, 0.87, 0.3));
  for (let i = 0; i < 6; i++) group.add(wheatRow(1.38 + i * 0.29, D / 2, D - 0.3, stage));
  for (let i = 0; i < 3; i++) group.add(wheatRow(0.3 + i * 0.29, 2.0, 1.7, stage));
  if (stocked) group.add(sack(1.0, 1.0, 0.4));
  group.add(leaningHoe(0.75, 0.93, 0.89));
  if (!staffed) group.add(leaningHoe(0.95, 0.93, 0.89));
  return group;
}

function withFarmer(shell: THREE.Object3D, phase: number, parts: FigureParts): THREE.Object3D {
  shell.add(posedFigure(FARMER_SPOT.x, FARMER_SPOT.z, FARMER_SPOT.turn, phase, parts, 'rest'));
  return shell;
}

export function wheatFarm(stage: number, staffed: boolean, stocked: boolean): THREE.Object3D {
  const shell = wheatFarmShell(stage, staffed, stocked);
  return staffed ? withFarmer(shell, 0, farmerParts()) : shell;
}

const shells = new Map<string, () => THREE.Object3D>();
const bakedFarmer = bakedFigure(farmerParts);

export function wheatFarmModel(farm: Building): THREE.Object3D {
  const stage = Math.min(cropStage(farm), RIPE_STAGE);
  const staffed = farm.workers > 0;
  const stocked = farm.food > 0;
  const key = `${stage}/${staffed}/${stocked}`;
  if (!shells.has(key)) shells.set(key, bakedOnce(() => wheatFarmShell(stage, staffed, stocked)));
  const shell = shells.get(key)!();
  return staffed ? withFarmer(shell, staffPhase(farm), bakedFarmer()) : shell;
}

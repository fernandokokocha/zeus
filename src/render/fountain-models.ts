import * as THREE from 'three';
import type { Building } from '../sim/state';
import { bakedOnce } from './bake';
import { terraceBlock } from './kit/cottage';
import { type FigureParts, at, posedFigure } from './kit/figure';
import { carrierJar, lionSpout, poseidon, ripples, roundPool, spoutPipe, squarePool, stream, tilePanel, wallPediment, waterCarrier } from './kit/fountain';
import { paving } from './kit/garden';
import { COLORS, box, cylinder, flat, lotGround, surface } from './kit/kit';
import { cypress } from './kit/luxury';
import { ENTABLATURE_HEIGHT, PALACE, entablature, marbleColumn, pedimentRoof } from './kit/palace';
import { bakedFigure, staffPhase } from './staff';

const carriers = { shoulder: bakedFigure(() => waterCarrier('shoulder')), filling: bakedFigure(() => waterCarrier('filling')) };

const FACING_THE_CAMERA = -Math.PI / 4;
const FACING_THE_WALL = Math.PI / 2;
const BASE = 0.03;

const HOUSE = { x0: 0.25, z0: 0.15, w: 1.5, d: 0.55, front: 0.7, wallTop: 0.75, columnHeight: 0.72 };
const HOUSE_POOL = { x0: 0.45, z0: 0.78, w: 1.1, d: 0.6, height: 0.2 };
const HOUSE_SPOUTS = [0.62, 1.0, 1.38];
const HOUSE_SPOUT_HEIGHT = 0.48;
const HOUSE_SPLASH_Z = 1.0;
const HOUSE_WATER = BASE + HOUSE_POOL.height - 0.03;

function fountainHouseShell(staffed: boolean): THREE.Object3D {
  const group = new THREE.Group();
  group.add(lotGround(surface('rubble')));
  group.add(paving(0.1, 0.1, 1.8, 1.8));
  group.add(terraceBlock(HOUSE.x0, HOUSE.z0, HOUSE.w, HOUSE.d, HOUSE.wallTop));
  group.add(tilePanel(0.42, 1.58, 0.22, 0.62, HOUSE.front));
  for (const x of [HOUSE.x0 + 0.07, HOUSE.x0 + HOUSE.w - 0.07]) group.add(marbleColumn(x, 0.84, HOUSE.columnHeight, BASE));
  group.add(entablature(0.2, 0.12, 1.6, 0.8, HOUSE.wallTop));
  pedimentRoof(group, 0.2, 0.12, 1.6, 0.8, HOUSE.wallTop + ENTABLATURE_HEIGHT, 0.35);
  for (const x of HOUSE_SPOUTS) group.add(lionSpout(x, HOUSE_SPOUT_HEIGHT, HOUSE.front + 0.01));
  group.add(squarePool(HOUSE_POOL.x0, HOUSE_POOL.z0, HOUSE_POOL.w, HOUSE_POOL.d, HOUSE_POOL.height, staffed));
  if (staffed) {
    for (const x of HOUSE_SPOUTS) group.add(stream(at(x, HOUSE_SPOUT_HEIGHT - 0.04, HOUSE.front + 0.08), at(x, HOUSE_WATER, HOUSE_SPLASH_Z)));
    group.add(carrierJar(0.28, BASE, 1.55), carrierJar(0.36, BASE, 1.68));
  }
  return group;
}

function withHouseCarrier(shell: THREE.Object3D, phase: number, carrier: FigureParts): THREE.Object3D {
  shell.add(ripples(HOUSE_SPOUTS.map((x) => at(x, HOUSE_WATER + 0.008, HOUSE_SPLASH_Z)), phase));
  shell.add(posedFigure(1.72, 1.55, FACING_THE_CAMERA, phase, carrier, 'rest'));
  return shell;
}

const houseShells = { staffed: bakedOnce(() => fountainHouseShell(true)), empty: bakedOnce(() => fountainHouseShell(false)) };

export function fountainHouse(staffed: boolean): THREE.Object3D {
  return staffed ? withHouseCarrier(houseShells.staffed(), 0, carriers.shoulder()) : houseShells.empty();
}

const TIERED = { x: 1, z: 1, radius: 0.72, height: 0.2, bowlRadius: 0.28, bowlHeight: 0.08, bowlBase: 0.45 };
const TIERED_STREAMS = 8;
const TIERED_SPLASH_RADIUS = 0.5;
const TIERED_WATER = BASE + TIERED.height - 0.03;

function aroundTheBowl(radius: number, y: number): THREE.Vector3[] {
  return Array.from({ length: TIERED_STREAMS }, (_, i) => {
    const angle = (i / TIERED_STREAMS) * Math.PI * 2;
    return at(TIERED.x + Math.cos(angle) * radius, y, TIERED.z + Math.sin(angle) * radius);
  });
}

function tieredFountainShell(staffed: boolean): THREE.Object3D {
  const group = new THREE.Group();
  group.add(lotGround(surface('rubble')));
  group.add(paving(0.1, 0.1, 1.8, 1.8));
  group.add(cylinder(TIERED.radius + 0.14, TIERED.radius + 0.14, 0.012, flat(COLORS.aegean), TIERED.x, BASE, TIERED.z, 32));
  group.add(roundPool(TIERED.x, TIERED.z, TIERED.radius, TIERED.height, staffed));
  group.add(cylinder(0.08, 0.12, TIERED.bowlBase - BASE, flat(PALACE.marble), TIERED.x, BASE, TIERED.z, 12));
  group.add(cylinder(TIERED.bowlRadius, 0.08, 0.07, flat(PALACE.marble), TIERED.x, TIERED.bowlBase - 0.07, TIERED.z, 20));
  group.add(roundPool(TIERED.x, TIERED.z, TIERED.bowlRadius, TIERED.bowlHeight, staffed, TIERED.bowlBase));
  group.add(poseidon(TIERED.x, TIERED.bowlBase + 0.02, TIERED.z));
  if (staffed) {
    const lips = aroundTheBowl(TIERED.bowlRadius + 0.02, TIERED.bowlBase + TIERED.bowlHeight - 0.01);
    const splashes = aroundTheBowl(TIERED_SPLASH_RADIUS, TIERED_WATER);
    lips.forEach((lip, i) => group.add(stream(lip, splashes[i])));
  }
  for (const [x, z] of [[0.25, 0.25], [1.75, 0.25], [0.25, 1.75]]) group.add(cypress(x, z, 0.5));
  return group;
}

function withTieredCarrier(shell: THREE.Object3D, phase: number, carrier: FigureParts): THREE.Object3D {
  shell.add(ripples(aroundTheBowl(TIERED_SPLASH_RADIUS, TIERED_WATER + 0.008), phase));
  shell.add(posedFigure(1.72, 1.72, FACING_THE_CAMERA, phase, carrier, 'rest'));
  return shell;
}

const tieredShells = { staffed: bakedOnce(() => tieredFountainShell(true)), empty: bakedOnce(() => tieredFountainShell(false)) };

export function tieredFountain(staffed: boolean): THREE.Object3D {
  return staffed ? withTieredCarrier(tieredShells.staffed(), 0, carriers.shoulder()) : tieredShells.empty();
}

const SPRING = { x0: 0.1, x1: 1.9, back: 0.12, front: 0.32, height: 0.72 };
const SPRING_POOL = { x0: 0.15, z0: 0.33, w: 1.7, d: 0.5, height: 0.18 };
const SPRING_SPOUTS = [0.42, 0.78, 1.22, 1.58];
const SPRING_SPOUT_HEIGHT = 0.5;
const SPRING_SPLASH_Z = 0.52;
const SPRING_WATER = BASE + SPRING_POOL.height - 0.03;
const GABLE = { span: 0.8, rise: 0.28 };

function springWallShell(staffed: boolean): THREE.Object3D {
  const group = new THREE.Group();
  const [cx, cz, depth] = [(SPRING.x0 + SPRING.x1) / 2, (SPRING.back + SPRING.front) / 2, SPRING.front - SPRING.back];
  group.add(lotGround(surface('rubble')));
  group.add(paving(0.1, 0.85, 1.8, 1.05));
  group.add(box(SPRING.x1 - SPRING.x0, SPRING.height - BASE, depth, surface('whitewash'), cx, BASE, cz));
  group.add(box(SPRING.x1 - SPRING.x0 + 0.04, 0.05, depth + 0.04, flat(COLORS.aegean), cx, SPRING.height - 0.08, cz));
  group.add(box(SPRING.x1 - SPRING.x0 + 0.08, 0.05, depth + 0.08, surface('whitewash'), cx, SPRING.height - 0.03, cz));
  group.add(wallPediment(cx, SPRING.height + 0.02, SPRING.back - 0.04, SPRING.front + 0.04, GABLE.span, GABLE.rise));
  group.add(tilePanel(SPRING.x0 + 0.1, SPRING.x1 - 0.1, 0.24, 0.64, SPRING.front));
  for (const x of SPRING_SPOUTS) group.add(spoutPipe(x, SPRING_SPOUT_HEIGHT, SPRING.front + 0.012, 0.1));
  group.add(squarePool(SPRING_POOL.x0, SPRING_POOL.z0, SPRING_POOL.w, SPRING_POOL.d, SPRING_POOL.height, staffed));
  if (staffed) {
    for (const x of SPRING_SPOUTS) group.add(stream(at(x, SPRING_SPOUT_HEIGHT, SPRING.front + 0.12), at(x, SPRING_WATER, SPRING_SPLASH_Z)));
    for (const [x, z] of [[0.3, 1.05], [0.42, 1.12], [0.32, 1.2]]) group.add(carrierJar(x, BASE, z));
  }
  for (const x of [0.2, 1.8]) group.add(cypress(x, 1.72, 0.38));
  return group;
}

function withSpringCarrier(shell: THREE.Object3D, phase: number, carrier: FigureParts): THREE.Object3D {
  shell.add(ripples(SPRING_SPOUTS.map((x) => at(x, SPRING_WATER + 0.008, SPRING_SPLASH_Z)), phase));
  shell.add(posedFigure(1.0, 1.02, FACING_THE_WALL, phase, carrier, 'rest'));
  return shell;
}

const springShells = { staffed: bakedOnce(() => springWallShell(true)), empty: bakedOnce(() => springWallShell(false)) };

export function springWall(staffed: boolean): THREE.Object3D {
  return staffed ? withSpringCarrier(springShells.staffed(), 0, carriers.filling()) : springShells.empty();
}

export function fountainModel(fountain: Building): THREE.Object3D {
  if (fountain.workers === 0) return tieredShells.empty();
  return withTieredCarrier(tieredShells.staffed(), staffPhase(fountain), carriers.shoulder());
}

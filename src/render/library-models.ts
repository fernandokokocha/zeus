import * as THREE from 'three';
import { BUILDING_SPECS } from '../sim/buildings';
import type { Building } from '../sim/state';
import { bakedOnce } from './bake';
import { type FigureParts, posedFigure } from './kit/figure';
import { paving } from './kit/garden';
import { gate, parapet, parapetAlongZ, placed, stoaWing } from './kit/gymnasium';
import { bust, copyDesk, copyist, easel, pigeonholes, readingTable } from './kit/library';
import { palaceGround } from './kit/palace';
import { bakedFigure, staffPhase } from './staff';

const { width: W, height: D } = BUILDING_SPECS.library;
const TOWARD_ROAD = Math.PI;
const FACING_ROAD = Math.PI / 2;
const WALL = 0.24;

type Spot = [number, number];

const STOA = { z: 1.42, depth: 0.85, height: 0.62, columns: 7, shelves: [0.75, 1.55, 2.45, 3.25] };
const COURT = { gate: 2.0, gateWidth: 0.5, tables: [0.95, 1.65], tableZ: 0.72 };
const STOA_COPYIST: Spot = [3.0, 0.78];

function roadFacing(part: THREE.Object3D, x: number, z: number): THREE.Object3D {
  return placed(part, x, z, TOWARD_ROAD);
}

function courtWalls(gateX: number, gateWidth: number, x0: number, x1: number, z1: number, staffed: boolean): THREE.Object3D {
  const group = new THREE.Group();
  const front = 0.12;
  const halfGate = gateWidth / 2 + 0.1;
  group.add(parapet(x0, gateX - halfGate, front, WALL), parapet(gateX + halfGate, x1, front, WALL));
  group.add(parapetAlongZ(x0, front, z1, WALL), parapetAlongZ(x1, front, z1, WALL));
  group.add(roadFacing(gate(0, 0, gateWidth, staffed), gateX, front));
  return group;
}

function stoaShell(staffed: boolean): THREE.Object3D {
  const group = new THREE.Group();
  group.add(palaceGround(W, D));
  group.add(paving(0.15, 0.15, W - 0.3, STOA.z - 0.5));
  group.add(roadFacing(stoaWing(W - 0.2, STOA.depth, STOA.height, STOA.columns), W / 2, STOA.z));
  for (const x of STOA.shelves) group.add(pigeonholes(x, STOA.z + 0.18, 6, 4, 0.07, staffed));
  group.add(courtWalls(COURT.gate, COURT.gateWidth, 0.12, W - 0.12, STOA.z - 0.3, staffed));
  for (const x of COURT.tables) group.add(readingTable(x, COURT.tableZ, 0.56, staffed));
  group.add(copyDesk(STOA_COPYIST[0], STOA_COPYIST[1] - 0.2, staffed));
  group.add(bust(0.35, 0.4), bust(W - 0.35, 0.4));
  group.add(easel(3.55, 0.85, staffed));
  return group;
}

function withCopyist(shell: THREE.Object3D, [x, z]: Spot, phase: number, parts: FigureParts): THREE.Object3D {
  shell.add(posedFigure(x, z, FACING_ROAD, phase, parts, 'write'));
  return shell;
}

export function stoaLibrary(staffed: boolean): THREE.Object3D {
  return staffed ? withCopyist(stoaShell(true), STOA_COPYIST, 0, copyist()) : stoaShell(false);
}

const shells = { staffed: bakedOnce(() => stoaShell(true)), empty: bakedOnce(() => stoaShell(false)) };
const bakedCopyist = bakedFigure(copyist);

export function libraryModel(library: Building): THREE.Object3D {
  if (library.workers === 0) return shells.empty();
  return withCopyist(shells.staffed(), STOA_COPYIST, staffPhase(library), bakedCopyist());
}

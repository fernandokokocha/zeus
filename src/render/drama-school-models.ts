import * as THREE from 'three';
import { BUILDING_SPECS } from '../sim/buildings';
import type { Building } from '../sim/state';
import { bakedOnce } from './bake';
import { blueDoor, cube } from './kit/cottage';
import { DRAMA, costumeChest, costumeRack, maskPost, paintedPanel, rehearsalStage, schoolGround, skeneWall, tragedian, trainerStool } from './kit/drama-school';
import { type FigureParts, posedFigure } from './kit/figure';
import { paving } from './kit/garden';
import { tiledRoofAlongZ } from './kit/roofs';
import { bakedFigure, staffPhase } from './staff';

const { width: W, height: D } = BUILDING_SPECS.dramaSchool;
const CLOSED = 0;
const OPEN = 1.2;
const DOOR_BASE = 0.12;
const FACING_THE_FRONT = -Math.PI / 2;
const ALONG_Z = Math.PI / 2;
const STAFFED_ROBES = [DRAMA.purple, DRAMA.saffron, DRAMA.blue];
const PACKED_ROBES = [DRAMA.blue, DRAMA.purple];

const SKENE = { x0: 0.25, x1: W - 0.25, z: 0.35, height: 0.95 };
const WING = { w: 0.5, d: 0.75, top: 0.85 };
const BOARDS = { x0: 0.75, z0: 0.47, w: 1.5, d: 0.85, height: 0.16 };
const SKENE_DOORS = [1.05, W / 2, 1.95];

function dressingWing(group: THREE.Group, x0: number, doorX: number, staffed: boolean): void {
  const z0 = 0.15;
  group.add(cube(x0, z0, WING.w, WING.d, WING.top));
  group.add(tiledRoofAlongZ(x0 - 0.05, z0 - 0.05, WING.w + 0.1, WING.d + 0.1, WING.top + 0.03, 0.22));
  group.add(blueDoor(doorX, z0 + WING.d, DOOR_BASE, staffed ? OPEN : CLOSED));
}

export function backdropStageShell(staffed: boolean): THREE.Object3D {
  const group = new THREE.Group();
  group.add(schoolGround(W, D));
  group.add(skeneWall(SKENE.x0, SKENE.x1, SKENE.z, SKENE.height, SKENE_DOORS));
  const face = SKENE.z + 0.07;
  for (const [x, color] of [[0.8, DRAMA.saffron], [1.5, DRAMA.purple], [2.2, DRAMA.crimson]] as const) group.add(paintedPanel(x, 0.6, face, color));
  dressingWing(group, 0.1, 0.35, staffed);
  dressingWing(group, W - 0.1 - WING.w, W - 0.35, false);
  group.add(rehearsalStage(BOARDS.x0, BOARDS.z0, BOARDS.w, BOARDS.d, BOARDS.height));
  group.add(maskPost('comic', 0.35, 1.25, 0), maskPost('tragic', W - 0.35, 1.25, 0));
  group.add(costumeRack(0.45, 2.1, 0.6, ALONG_Z, staffed ? STAFFED_ROBES : PACKED_ROBES));
  group.add(costumeChest(2.55, 2.0, staffed));
  for (const x of [1.15, 1.85]) group.add(trainerStool(x, 2.2));
  group.add(paving(0.9, 2.45, 1.2, 0.45));
  return group;
}

export function withStageActor(shell: THREE.Object3D, phase: number, parts: FigureParts): THREE.Object3D {
  const figure = posedFigure(W / 2, BOARDS.z0 + BOARDS.d * 0.6, FACING_THE_FRONT, phase, parts, 'declaim');
  figure.position.y += BOARDS.height;
  shell.add(figure);
  return shell;
}

export function backdropStage(staffed: boolean): THREE.Object3D {
  const shell = backdropStageShell(staffed);
  return staffed ? withStageActor(shell, 0, tragedian()) : shell;
}

const shells = { staffed: bakedOnce(() => backdropStageShell(true)), empty: bakedOnce(() => backdropStageShell(false)) };
const bakedTragedian = bakedFigure(tragedian);

export function dramaSchoolModel(school: Building): THREE.Object3D {
  if (school.workers === 0) return shells.empty();
  return withStageActor(shells.staffed(), staffPhase(school), bakedTragedian());
}

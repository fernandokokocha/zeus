import * as THREE from 'three';
import { BUILDING_SPECS } from '../sim/buildings';
import type { Building } from '../sim/state';
import { bakedOnce } from './bake';
import { blueDoor, terraceBlock } from './kit/cottage';
import { type FigureParts, posedFigure } from './kit/figure';
import { herm } from './kit/garden';
import { bench, halteres, oilFlask, rakedSand, runner, sandGround, startingSill, stoneTiers, trackCurb, turningPost } from './kit/gymnasium';
import { lawn } from './kit/luxury';
import { tiledRoof } from './kit/roofs';
import { bakedFigure, staffPhase } from './staff';

const { width: W, height: D } = BUILDING_SPECS.gymnasium;
const CLOSED = 0;
const OPEN = 1.2;
const ALONG_THE_TRACK = 0;
const TRACK = { x0: 0.15, x1: W - 0.15, z0: 1.3, z1: D - 0.2 };
const TRACK_MIDDLE = (TRACK.z0 + TRACK.z1) / 2;

function stadionShell(staffed: boolean): THREE.Object3D {
  const group = new THREE.Group();
  group.add(sandGround(W, D));
  group.add(lawn(0.06, 0.06, W - 0.12, TRACK.z0 - 0.1));
  group.add(rakedSand(TRACK.x0, TRACK.z0, TRACK.x1 - TRACK.x0, TRACK.z1 - TRACK.z0));
  group.add(trackCurb(TRACK.x0, TRACK.x1, TRACK.z0), trackCurb(TRACK.x0, TRACK.x1, TRACK.z1));
  group.add(startingSill(0.48, TRACK.z0, TRACK.z1), startingSill(W - 0.48, TRACK.z0, TRACK.z1));
  group.add(turningPost(0.3, TRACK_MIDDLE), turningPost(W - 0.3, TRACK_MIDDLE));
  group.add(terraceBlock(0.2, 0.2, 0.95, 0.75, 0.72));
  group.add(tiledRoof(0.14, 0.14, 1.07, 0.87, 0.76, 0.3));
  group.add(blueDoor(0.68, 0.95, 0.08, staffed ? OPEN : CLOSED));
  group.add(stoneTiers(1.35, W - 0.15, 0.2, 1.15, 3));
  group.add(herm(1.2, 1.1));
  group.add(bench(0.68, 1.12, 0.5));
  if (staffed) group.add(halteres(1.0, 1.15), oilFlask(0.42, 1.12));
  return group;
}

function withRunner(shell: THREE.Object3D, phase: number, parts: FigureParts): THREE.Object3D {
  shell.add(posedFigure(W / 2, TRACK_MIDDLE, ALONG_THE_TRACK, phase, parts, 'sprint'));
  return shell;
}

export function stadion(staffed: boolean): THREE.Object3D {
  const shell = stadionShell(staffed);
  return staffed ? withRunner(shell, 0, runner()) : shell;
}

const shells = { staffed: bakedOnce(() => stadionShell(true)), empty: bakedOnce(() => stadionShell(false)) };
const bakedRunner = bakedFigure(runner);

export function gymnasiumModel(gymnasium: Building): THREE.Object3D {
  if (gymnasium.workers === 0) return shells.empty();
  return withRunner(shells.staffed(), staffPhase(gymnasium), bakedRunner());
}

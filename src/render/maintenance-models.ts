import * as THREE from 'three';
import type { Building } from '../sim/state';
import { bakedOnce } from './bake';
import { blueDoor, frontWindow, sideWindow, terraceBlock } from './kit/cottage';
import { type FigureParts, posedFigure } from './kit/figure';
import { box, flat, lotGround, surface } from './kit/kit';
import { gong, ladder, lookout } from './kit/maintenance';
import { hipRoof } from './kit/roofs';
import { bucket } from './kit/water';
import { bakedFigure, staffPhase } from './staff';

const CLOSED = 0;
const OPEN = 1.2;
const FACING_THE_CAMERA = -Math.PI / 4;
const LOOKOUT_HEIGHT = 0.95;
const POST = 0x6b4a2b;
const [X0, Z0, W, D] = [0.45, 0.4, 1.05, 1.0];
const FRONT = Z0 + D;
const RIGHT = X0 + W;
const TOWER_TOP = 1.35;

function fireTowerShell(staffed: boolean): THREE.Object3D {
  const group = new THREE.Group();
  group.add(lotGround(surface('rubble')));
  group.add(terraceBlock(X0, Z0, W, D, TOWER_TOP));
  group.add(blueDoor(X0 + 0.3, FRONT, 0.12, staffed ? OPEN : CLOSED));
  group.add(frontWindow(X0 + 0.75, FRONT, 0.36));
  group.add(frontWindow(X0 + 0.52, FRONT, 0.85));
  for (const z of [Z0 + 0.3, Z0 + 0.7]) group.add(sideWindow(RIGHT, z, 0.85));
  group.add(sideWindow(RIGHT, Z0 + 0.5, 0.36));
  for (const [x, z] of [[X0 + 0.03, Z0 + 0.03], [RIGHT - 0.03, Z0 + 0.03], [X0 + 0.03, FRONT - 0.03], [RIGHT - 0.03, FRONT - 0.03]]) {
    group.add(box(0.05, LOOKOUT_HEIGHT, 0.05, flat(POST), x, TOWER_TOP + 0.03, z));
  }
  for (const [rx, rz, rw, rd] of [[X0 + W / 2, FRONT - 0.03, W - 0.06, 0.03], [RIGHT - 0.03, Z0 + D / 2, 0.03, D - 0.06]]) {
    group.add(box(rw, 0.03, rd, flat(POST), rx, TOWER_TOP + 0.22, rz));
  }
  group.add(hipRoof(X0 - 0.03, Z0 - 0.03, W + 0.06, D + 0.06, TOWER_TOP + LOOKOUT_HEIGHT + 0.03, 0.24, 'tiles'));
  group.add(gong(X0 + 0.25, TOWER_TOP + 0.03, Z0 + 0.2));
  group.add(ladder(RIGHT + 0.12, Z0 + 0.6, 0.95, 0.25, Math.PI / 2));
  group.add(bucket(0.2, 0.03, 1.55, true), bucket(0.3, 0.03, 1.65, true), bucket(0.18, 0.03, 1.72, true));
  return group;
}

function withWatchman(shell: THREE.Object3D, phase: number, parts: FigureParts): THREE.Object3D {
  const watchman = posedFigure(X0 + 0.45, FRONT - 0.2, FACING_THE_CAMERA, phase, parts, 'lookout');
  watchman.position.y += TOWER_TOP;
  shell.add(watchman);
  return shell;
}

export function fireTower(staffed: boolean): THREE.Object3D {
  const shell = fireTowerShell(staffed);
  return staffed ? withWatchman(shell, 0, lookout()) : shell;
}

const shells = { staffed: bakedOnce(() => fireTowerShell(true)), empty: bakedOnce(() => fireTowerShell(false)) };
const bakedWatchman = bakedFigure(lookout);

export function maintenanceOfficeModel(office: Building): THREE.Object3D {
  if (office.workers === 0) return shells.empty();
  return withWatchman(shells.staffed(), staffPhase(office), bakedWatchman());
}

import * as THREE from 'three';
import type { Building } from '../sim/state';
import { bakedOnce } from './bake';
import { blueDoor, terraceBlock } from './kit/cottage';
import { type FigureParts, posedFigure } from './kit/figure';
import { paving } from './kit/garden';
import { lotGround, surface } from './kit/kit';
import { cypress } from './kit/luxury';
import { ENTABLATURE_HEIGHT, entablature, marbleColumn, marbleStairs, marbleTerrace, pedimentRoof } from './kit/palace';
import { clerk, strongbox, taxStele } from './kit/tax';
import { bakedFigure, staffPhase } from './staff';

const CLOSED = 0;
const OPEN = 1.2;
const FACING_THE_CAMERA = -Math.PI / 4;
const [X0, Z0, W, D] = [0.45, 0.2, 1.1, 1.25];
const PLINTH_TOP = 0.18;
const COLUMN_HEIGHT = 0.62;
const CHEST_SIZE = 1.4;

function treasuryShell(staffed: boolean): THREE.Object3D {
  const group = new THREE.Group();
  group.add(lotGround(surface('rubble')));
  group.add(paving(0.1, 0.1, 1.8, 1.8));
  group.add(marbleTerrace(X0, Z0, W, D, PLINTH_TOP));
  group.add(terraceBlock(X0 + 0.08, Z0 + 0.05, W - 0.16, D - 0.4, PLINTH_TOP + COLUMN_HEIGHT));
  group.add(blueDoor(1, Z0 + D - 0.35, PLINTH_TOP, staffed ? OPEN : CLOSED));
  for (const x of [X0 + 0.3, X0 + W - 0.3]) group.add(marbleColumn(x, Z0 + D - 0.12, COLUMN_HEIGHT, PLINTH_TOP));
  group.add(entablature(X0, Z0, W, D, PLINTH_TOP + COLUMN_HEIGHT));
  pedimentRoof(group, X0, Z0, W, D, PLINTH_TOP + COLUMN_HEIGHT + ENTABLATURE_HEIGHT, 0.45);
  group.add(marbleStairs(1, Z0 + D, 0.7, 3, PLINTH_TOP / 3, 0.08));
  group.add(strongbox(0.45, 1.68, staffed, 0.3, CHEST_SIZE));
  group.add(taxStele(1.65, 1.7));
  for (const z of [0.4, 0.95]) group.add(cypress(0.22, z, 0.42), cypress(1.78, z, 0.42));
  return group;
}

function withClerk(shell: THREE.Object3D, phase: number, parts: FigureParts): THREE.Object3D {
  shell.add(posedFigure(0.22, 1.3, FACING_THE_CAMERA, phase, parts, 'rest'));
  return shell;
}

export function treasury(staffed: boolean): THREE.Object3D {
  const shell = treasuryShell(staffed);
  return staffed ? withClerk(shell, 0, clerk()) : shell;
}

const shells = { staffed: bakedOnce(() => treasuryShell(true)), empty: bakedOnce(() => treasuryShell(false)) };
const bakedClerk = bakedFigure(clerk);

export function taxOfficeModel(office: Building): THREE.Object3D {
  if (office.workers === 0) return shells.empty();
  return withClerk(shells.staffed(), staffPhase(office), bakedClerk());
}

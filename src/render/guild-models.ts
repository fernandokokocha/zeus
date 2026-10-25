import * as THREE from 'three';
import type { Building } from '../sim/state';
import { bakedOnce } from './bake';
import { blueDoor, sideWindow, terraceBlock } from './kit/cottage';
import { type FigureParts, posedFigure } from './kit/figure';
import { GUILD, architect, guildColumn, pediment, planTable, templeModel } from './kit/guild';
import { box, flat, lotGround, surface } from './kit/kit';
import { tiledRoofAlongZ } from './kit/roofs';
import { bakedFigure, staffPhase } from './staff';

const CLOSED = 0;
const OPEN = 1.2;
const FACING_RIGHT = 0;

const HALL = { x0: 0.45, z0: 0.15, w: 1.1, d: 0.85, top: 0.66, porch: 1.3, eaves: 0.72, rise: 0.36 };
const HALL_TABLE = { x: 1.42, z: 1.62 };

function architectsHallShell(staffed: boolean): THREE.Object3D {
  const group = new THREE.Group();
  const { x0, z0, w, d, top, porch, eaves, rise } = HALL;
  const front = z0 + d;
  const cx = x0 + w / 2;
  group.add(lotGround(surface('rubble')));
  group.add(terraceBlock(x0, z0, w, d, top));
  group.add(box(w + 0.16, 0.06, porch - front + 0.06, surface('ashlar'), cx, 0.03, (front + porch) / 2));
  for (const x of [x0 + 0.14, x0 + w - 0.14]) group.add(guildColumn(x, porch - 0.08, 0.09, eaves - 0.135, 0.05));
  group.add(box(w + 0.1, 0.03, 0.1, flat(GUILD.column), cx, eaves - 0.03, porch - 0.08));
  group.add(tiledRoofAlongZ(x0 - 0.05, z0 - 0.03, w + 0.1, porch - z0 + 0.03, eaves, rise));
  const gable = pediment(w + 0.1, rise);
  gable.position.set(cx, eaves, porch - 0.02);
  group.add(gable);
  group.add(blueDoor(cx, front, 0.12, staffed ? OPEN : CLOSED));
  for (const z of [z0 + 0.25, z0 + 0.6]) group.add(sideWindow(x0 + w, z, 0.36));
  group.add(templeModel(0.5, 1.62, 0.44, 0.26, 0.14));
  group.add(planTable(HALL_TABLE.x, HALL_TABLE.z, 0));
  return group;
}

function withHallArchitect(shell: THREE.Object3D, phase: number, parts: FigureParts): THREE.Object3D {
  shell.add(posedFigure(HALL_TABLE.x - 0.3, HALL_TABLE.z, FACING_RIGHT, phase, parts, 'rest'));
  return shell;
}


export function architectsHall(staffed: boolean): THREE.Object3D {
  const shell = architectsHallShell(staffed);
  return staffed ? withHallArchitect(shell, 0, architect()) : shell;
}

const shells = { staffed: bakedOnce(() => architectsHallShell(true)), empty: bakedOnce(() => architectsHallShell(false)) };
const bakedArchitect = bakedFigure(architect);

export function artisansGuildModel(guild: Building): THREE.Object3D {
  if (guild.workers === 0) return shells.empty();
  return withHallArchitect(shells.staffed(), staffPhase(guild), bakedArchitect());
}

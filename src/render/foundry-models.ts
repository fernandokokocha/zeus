import * as THREE from 'three';
import { UNITS_PER_LOAD } from '../sim/food';
import { WORKSHOP_CAPACITY } from '../sim/materials';
import type { Building } from '../sim/state';
import { bakedOnce } from './bake';
import { blueDoor, cube } from './kit/cottage';
import { type FigureParts, posedFigure } from './kit/figure';
import {
  anvil,
  bellows,
  castingMould,
  hungTongs,
  oreHeap,
  shaftFurnace,
  smith,
} from './kit/foundry';
import { COLORS, box, flat, lotGround, surface } from './kit/kit';
import { ingotPile } from './kit/sculpture';
import { bakedFigure, staffPhase } from './staff';

export const FOUNDRY_LOADS = WORKSHOP_CAPACITY / UNITS_PER_LOAD;

const CLOSED = 0;
const OPEN = 1.2;
const DOOR_BASE = 0.12;
const INGOTS_PER_LOAD = 6;
const SMITH_REACH = 0.22;

type Spot = [number, number];
type Shell = (staffed: boolean, loads: number) => THREE.Object3D;

function bronzeStock(group: THREE.Group, spots: Spot[], loads: number): void {
  spots.slice(0, loads).forEach(([x, z]) => group.add(ingotPile(x, z, INGOTS_PER_LOAD)));
}

function withSmith(shell: THREE.Object3D, [x, z]: Spot, phase: number, parts: FigureParts): THREE.Object3D {
  shell.add(posedFigure(x - SMITH_REACH, z, 0, phase, parts, 'hammer'));
  return shell;
}

function staffedWith(shell: Shell, anvilAt: Spot): Shell {
  return (staffed, loads) => {
    const group = shell(staffed, loads);
    return staffed ? withSmith(group, anvilAt, 0, smith()) : group;
  };
}

const FURNACES: [number, number, number][] = [[0.98, 0.4, 0.75], [1.34, 0.38, 0.9], [1.7, 0.4, 0.75]];
const HUT = { x0: 0.14, z0: 0.14, w: 0.56, d: 0.56, top: 0.48 };
const ROW_ANVIL: Spot = [1.12, 1.25];
const ROW_STOCK: Spot[] = [[0.3, 1.1], [0.58, 1.1], [0.3, 1.45], [0.58, 1.45]];

function backWall(group: THREE.Group): void {
  group.add(box(1.1, 0.22, 0.1, surface('rubble'), 1.33, 0.03, 0.17));
  group.add(box(0.1, 0.22, 0.6, surface('rubble'), 1.83, 0.03, 0.5));
  group.add(box(1.14, 0.03, 0.12, surface('whitewash'), 1.33, 0.25, 0.17));
}

export function furnaceRowShell(staffed: boolean, loads: number): THREE.Object3D {
  const group = new THREE.Group();
  group.add(lotGround(surface('rubble')));
  backWall(group);
  for (const [x, z, height] of FURNACES) group.add(shaftFurnace(x, z, height, staffed));
  group.add(castingMould(1.34, 0.78, staffed));
  const { x0, z0, w, d, top } = HUT;
  group.add(cube(x0, z0, w, d, top));
  group.add(box(w + 0.08, 0.04, d + 0.08, flat(COLORS.aegean), x0 + w / 2, top - 0.09, z0 + d / 2));
  group.add(blueDoor(x0 + w / 2, z0 + d, DOOR_BASE, staffed ? OPEN : CLOSED));
  if (!staffed) group.add(hungTongs(x0 + 0.08, 0.42, z0 + d + 0.01));
  group.add(anvil(...ROW_ANVIL));
  group.add(bellows(0.92, 0.8, 0.3));
  if (staffed) group.add(oreHeap(1.6, 1.5, 0.24, 28, 23));
  bronzeStock(group, ROW_STOCK, loads);
  return group;
}

export const furnaceRow = staffedWith(furnaceRowShell, ROW_ANVIL);

const shells = new Map<string, () => THREE.Object3D>();
const bakedSmith = bakedFigure(smith);

export function foundryModel(foundry: Building): THREE.Object3D {
  const staffed = foundry.workers > 0;
  const loads = Math.floor(foundry.bronze / UNITS_PER_LOAD);
  const key = `${staffed}/${loads}`;
  if (!shells.has(key)) shells.set(key, bakedOnce(() => furnaceRowShell(staffed, loads)));
  const shell = shells.get(key)!();
  return staffed ? withSmith(shell, ROW_ANVIL, staffPhase(foundry), bakedSmith()) : shell;
}

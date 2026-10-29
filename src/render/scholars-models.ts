import * as THREE from 'three';
import { BUILDING_SPECS } from '../sim/buildings';
import { bakedOnce } from './bake';
import { lectern, philosopher, scrollBucket, seatedStudent, sundial } from './kit/college';
import { blueDoor, frontWindow, terraceBlock } from './kit/cottage';
import { type FigureParts, posedFigure } from './kit/figure';
import { blueColumns, herm, paving } from './kit/garden';
import { COLORS, box, flat } from './kit/kit';
import { cypress, lawn } from './kit/luxury';
import { planeTree } from './kit/park';
import { EXEDRA_SEAT_TOP, exedra, exedraSeatRadius } from './kit/scholars';
import { hipRoof, hipRoofAlongZ, leanToRoof } from './kit/roofs';
import { bakedFigure } from './staff';

const OCHRE = 0xc9923e;
const { width: W, height: D } = BUILDING_SPECS.scholarsHouse;
const TOWARD_BACK = Math.PI / 2;
const MANTLES = [COLORS.aegean, COLORS.deepAegean, 0x4f8fc9, COLORS.aegean];
const DOOR = { open: 0.7, shut: 0 };
const EAVES = 0.03;
const HOUSE_RISE = 0.26;
const FRIEZE = 0.06;
const EXEDRA = { x: 2.62, z: 2.6, radius: 0.82, depth: 0.32, height: 0.62, columns: 7 };
const SCHOLAR = { x: EXEDRA.x, z: EXEDRA.z + 0.15 };
const BENCH_ANGLES = [1.2, 1.4, 1.6, 1.8].map((a) => a * Math.PI);

function house(group: THREE.Group, x0: number, z0: number, w: number, d: number, top: number, alongZ = false): void {
  group.add(terraceBlock(x0, z0, w, d, top));
  const roof = alongZ ? hipRoofAlongZ : hipRoof;
  group.add(roof(x0, z0, w, d, top + EAVES, HOUSE_RISE, 'blueTiles'));
}

function frieze(group: THREE.Group, x0: number, z0: number, w: number, d: number, top: number): void {
  group.add(box(w + 0.025, FRIEZE, d + 0.025, flat(OCHRE), x0 + w / 2, top - 0.2, z0 + d / 2));
}

function exedraShell(supplied: boolean): THREE.Object3D {
  const group = new THREE.Group();
  group.add(lawn(0.08, 0.08, W - 0.16, D - 0.16));
  group.add(paving(1.25, 2.55, 2.6, 1.0), paving(0.25, 2.85, 1.0, 1.0));
  house(group, 0.14, 0.14, 1.35, 1.05, 1.6);
  frieze(group, 0.14, 0.14, 1.35, 1.05, 1.6);
  group.add(frontWindow(0.45, 1.19, 1.05), frontWindow(1.15, 1.19, 1.05));
  house(group, 1.6, 0.14, 1.0, 0.78, 1.15);
  group.add(frontWindow(2.1, 0.92, 0.7));
  house(group, 0.14, 1.29, 0.85, 1.45, 1.05, true);
  group.add(blueDoor(0.56, 2.74, 0.12, supplied ? DOOR.open : DOOR.shut), frontWindow(0.56, 2.74, 0.68));
  group.add(blueColumns([[1.2, 1.4], [1.2, 1.9], [1.2, 2.4]], 0.5));
  group.add(leanToRoof(0.99, 1.29, 1.24, 2.5, 0.55, 0.7, 'east'));
  const { x, z, radius, depth, height, columns } = EXEDRA;
  const hall = exedra(radius, depth, height, columns);
  hall.position.set(x, 0, z);
  group.add(hall);
  group.add(scrollBucket(x - radius - 0.2, z + 0.15, !supplied), scrollBucket(x + radius + 0.2, z + 0.15, !supplied));
  if (supplied) {
    const seat = exedraSeatRadius(radius, depth);
    BENCH_ANGLES.forEach((a, i) => group.add(seatedStudent(x + Math.cos(a) * seat, z + Math.sin(a) * seat, Math.PI - a, MANTLES[i], EXEDRA_SEAT_TOP)));
  }
  group.add(lectern(x, z + 0.4, TOWARD_BACK, supplied));
  group.add(planeTree(3.65, 3.62, 0.8), planeTree(3.55, 0.55, 0.9));
  group.add(cypress(1.55, 3.7, 0.55), cypress(0.25, 3.7, 0.5), cypress(1.4, 1.2, 0.5));
  group.add(sundial(1.65, 3.15), herm(0.75, 3.3));
  return group;
}

function withScholar(shell: THREE.Object3D, parts: FigureParts, supplied: boolean): THREE.Object3D {
  shell.add(posedFigure(SCHOLAR.x, SCHOLAR.z, TOWARD_BACK, 0, parts, supplied ? 'lecture' : 'rest'));
  return shell;
}

export function exedraHouse(supplied: boolean): THREE.Object3D {
  return withScholar(exedraShell(supplied), philosopher(), supplied);
}

const shells = { supplied: bakedOnce(() => exedraShell(true)), wanting: bakedOnce(() => exedraShell(false)) };
const bakedScholar = bakedFigure(philosopher);

export function scholarsHouseModel(missingNeed: boolean): THREE.Object3D {
  const shell = missingNeed ? shells.wanting() : shells.supplied();
  return withScholar(shell, bakedScholar(), !missingNeed);
}

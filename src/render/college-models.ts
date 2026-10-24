import * as THREE from 'three';
import { BUILDING_SPECS } from '../sim/buildings';
import type { Building } from '../sim/state';
import { bakedOnce } from './bake';
import { lectern, lyingScroll, philosopher, scrollBucket, seatedStudent, stool, sundial, tholos, writingDesk } from './kit/college';
import { type FigureParts, posedFigure } from './kit/figure';
import { herm, paving } from './kit/garden';
import { COLORS } from './kit/kit';
import { cypress } from './kit/luxury';
import { palaceGround } from './kit/palace';
import { bakedFigure, staffPhase } from './staff';

const { width: W, height: D } = BUILDING_SPECS.college;
const TOWARD_FRONT = -Math.PI / 2;
const TOWARD_BACK = Math.PI / 2;
const MANTLES = [COLORS.aegean, COLORS.deepAegean, 0x4f8fc9, COLORS.aegean];

const THOLOS = { x: W / 2, z: 0.85, radius: 0.55, columns: 10, height: 0.6 };
const DESK_ROWS = [2.2, 2.6];
const DESK_XS = [1.05, 1.95];
const DESK_WIDTH = 0.5;
const STUDENT_BEHIND_DESK = 0.17;
const STOOL_SEAT = 0.13;
const THOLOS_TEACHER: [number, number] = [W / 2, 1.72];

export function tholosShell(staffed: boolean): THREE.Object3D {
  const group = new THREE.Group();
  group.add(palaceGround(W, D));
  group.add(paving(0.4, 1.55, W - 0.8, D - 1.65));
  const { x, z, radius, columns, height } = THOLOS;
  group.add(tholos(x, z, radius, columns, height, staffed));
  group.add(cypress(0.35, 0.35, 0.6), cypress(W - 0.35, 0.35, 0.6), cypress(0.3, 1.1, 0.5), cypress(W - 0.3, 1.1, 0.5));
  group.add(sundial(0.35, 2.1));
  group.add(herm(W - 0.3, 2.1));
  group.add(lectern(x, 1.9, TOWARD_FRONT, staffed));
  group.add(scrollBucket(2.3, 1.65, !staffed), scrollBucket(2.45, 1.75, !staffed));
  let seat = 0;
  for (const row of DESK_ROWS) {
    for (const dx of DESK_XS) {
      group.add(writingDesk(dx, row, DESK_WIDTH, staffed));
      const behind = row + STUDENT_BEHIND_DESK;
      if (staffed) {
        group.add(stool(dx, behind));
        group.add(seatedStudent(dx, behind + 0.02, TOWARD_BACK, MANTLES[seat++], STOOL_SEAT));
      } else group.add(stool(dx - 0.12, behind), stool(dx + 0.12, behind));
    }
  }
  if (staffed) group.add(lyingScroll(1.3, 0.03, 1.6, 0.3));
  return group;
}

export function withTholosTeacher(shell: THREE.Object3D, phase: number, parts: FigureParts): THREE.Object3D {
  const [x, z] = THOLOS_TEACHER;
  shell.add(posedFigure(x, z, TOWARD_FRONT, phase, parts, 'lecture'));
  return shell;
}

export function tholosSchool(staffed: boolean): THREE.Object3D {
  const shell = tholosShell(staffed);
  return staffed ? withTholosTeacher(shell, 0, philosopher()) : shell;
}

const shells = { staffed: bakedOnce(() => tholosShell(true)), empty: bakedOnce(() => tholosShell(false)) };
const bakedPhilosopher = bakedFigure(philosopher);

export function collegeModel(college: Building): THREE.Object3D {
  if (college.workers === 0) return shells.empty();
  return withTholosTeacher(shells.staffed(), staffPhase(college), bakedPhilosopher());
}

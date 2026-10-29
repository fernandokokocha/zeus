import * as THREE from 'three';
import { BUILDING_SPECS } from '../sim/buildings';
import type { Building } from '../sim/state';
import { blueDoor, cube, frontWindow } from './kit/cottage';
import { paving } from './kit/garden';
import { COLORS, box, flat, lotGround, surface } from './kit/kit';
import { ENTABLATURE_HEIGHT, entablature, evenly, marbleColumn, marbleStairs, marbleTerrace, pedimentRoof } from './kit/palace';
import { hipRoof } from './kit/roofs';
import { scroll } from './kit/scrolls';

const OCHRE = 0xc9923e;
const HOUSE = { W: BUILDING_SPECS.scholarsHouse.width, D: BUILDING_SPECS.scholarsHouse.height };
const WING = { x0: 0.2, z0: 0.2, w: 3.6, d: 1.5, top: 1.15 };
const PORCH = { x0: 0.9, z0: 2.3, w: 2.2, d: 1.1, floor: 0.12, columns: 0.62 };
const LIBRARY = { W: BUILDING_SPECS.library.width, D: BUILDING_SPECS.library.height };
const HALL = { x0: 0.2, z0: 0.55, w: 3.6, d: 1.25, floor: 0.12, columns: 0.7 };
const RACKS = [0.7, 1.55, 2.45, 3.3];

function lecturePorch(supplied: boolean): THREE.Object3D {
  const group = new THREE.Group();
  const { x0, z0, w, d, floor, columns } = PORCH;
  group.add(marbleTerrace(x0, z0, w, d, floor));
  for (const x of evenly(x0 + 0.1, x0 + w - 0.1, 5)) group.add(marbleColumn(x, z0 + d - 0.1, columns, floor));
  group.add(entablature(x0, z0, w, d, floor + columns));
  pedimentRoof(group, x0, z0, w, d, floor + columns + ENTABLATURE_HEIGHT, 0.35, 'tiles');
  group.add(marbleStairs(x0 + w / 2, z0 + d, 1.2, 2, floor / 2, 0.09));
  if (supplied) for (const x of [x0 + 0.6, x0 + w / 2, x0 + w - 0.6]) group.add(scroll(x, floor + 0.02, z0 + 0.5, 0.3));
  return group;
}

export function scholarsHouseModel(missingNeed: boolean): THREE.Object3D {
  const group = new THREE.Group();
  group.add(paving(0.08, 0.08, HOUSE.W - 0.16, HOUSE.D - 0.16));
  const { x0, z0, w, d, top } = WING;
  group.add(cube(x0, z0, w, d, top));
  group.add(box(w + 0.02, 0.12, d + 0.02, flat(OCHRE), x0 + w / 2, top - 0.12, z0 + d / 2));
  group.add(hipRoof(x0 - 0.04, z0 - 0.04, w + 0.08, d + 0.08, top + 0.03, 0.3, 'tiles'));
  for (const x of [0.6, 1.2, 2.8, 3.4]) group.add(frontWindow(x, z0 + d, 0.6));
  group.add(blueDoor(2.0, z0 + d, 0.1, missingNeed ? 0 : 0.6));
  group.add(lecturePorch(!missingNeed));
  return group;
}

function scrollRack(x: number, scrolls: number): THREE.Object3D {
  const group = new THREE.Group();
  const z = HALL.z0 + 0.35;
  group.add(box(0.5, 0.42, 0.18, flat(COLORS.timber), x, HALL.floor, z));
  for (let i = 0; i < scrolls; i++) group.add(scroll(x - 0.12 + (i % 2) * 0.24, HALL.floor + 0.42, z, 0));
  return group;
}

export function libraryModel(library: Building): THREE.Object3D {
  const group = new THREE.Group();
  group.add(lotGround(surface('earth')));
  group.add(box(LIBRARY.W - 0.16, 0.02, LIBRARY.D - 0.16, flat(OCHRE), LIBRARY.W / 2, 0.02, LIBRARY.D / 2));
  const { x0, z0, w, d, floor, columns } = HALL;
  group.add(marbleTerrace(x0, z0, w, d, floor));
  group.add(cube(x0 + 0.1, z0 + 0.6, w - 0.2, d - 0.65, floor + columns, floor, false));
  for (const x of evenly(x0 + 0.1, x0 + w - 0.1, 7)) group.add(marbleColumn(x, z0 + 0.1, columns, floor));
  group.add(entablature(x0, z0, w, d, floor + columns));
  pedimentRoof(group, x0, z0, w, d, floor + columns + ENTABLATURE_HEIGHT, 0.3, 'tiles');
  RACKS.forEach((x) => group.add(scrollRack(x, library.workers > 0 ? 2 : 0)));
  group.rotation.y = Math.PI;
  group.position.set(LIBRARY.W, 0, LIBRARY.D);
  const turned = new THREE.Group();
  turned.add(group);
  return turned;
}

import * as THREE from 'three';
import { UNITS_PER_LOAD } from '../sim/food';
import type { Building } from '../sim/state';
import { blueDoor, cube, frontWindow } from './kit/cottage';
import { COLORS, box, cylinder, flat, lotGround, surface } from './kit/kit';
import { tiledRoof } from './kit/roofs';
import { SCROLLS, papyrusBundle, scroll } from './kit/scrolls';

const CLOSED = 0;
const OPEN = 1.2;
const HALL = { x0: 0.15, z0: 0.15, w: 1.7, d: 0.75, top: 0.62 };
const PORCH = { front: 1.3, height: 0.5, columns: [0.35, 0.85, 1.35] };
const DESK = { x: 1.25, z: 1.12, w: 0.36, d: 0.22, height: 0.16 };
const INPUT_SPOT = { x: 0.35, z: 1.6 };
const SCROLL_SPOTS: [number, number][] = [[1.55, 1.6], [1.55, 1.7], [1.75, 1.6], [1.75, 1.7]];

function porch(): THREE.Object3D {
  const group = new THREE.Group();
  const back = HALL.z0 + HALL.d;
  for (const x of PORCH.columns) group.add(cylinder(0.025, 0.028, PORCH.height, flat(COLORS.whitewash), x, 0.03, PORCH.front, 8));
  group.add(box(HALL.w - 0.1, 0.03, PORCH.front - back + 0.08, flat(COLORS.whitewash), HALL.x0 + HALL.w / 2, PORCH.height + 0.03, (PORCH.front + back) / 2));
  return group;
}

function writingDesk(): THREE.Object3D {
  const group = new THREE.Group();
  const { x, z, w, d, height } = DESK;
  group.add(box(w, 0.025, d, flat(COLORS.timber), x, height, z));
  for (const dx of [-w / 2 + 0.02, w / 2 - 0.02]) group.add(box(0.02, height, d - 0.04, flat(COLORS.timber), x + dx, 0.03, z));
  group.add(box(w - 0.08, 0.004, d - 0.08, flat(SCROLLS.sheet), x, height + 0.025, z));
  return group;
}

export function scriptoriumModel(scriptorium: Building): THREE.Object3D {
  const group = new THREE.Group();
  const { x0, z0, w, d, top } = HALL;
  group.add(lotGround(surface('earth')));
  group.add(cube(x0, z0, w, d, top));
  group.add(tiledRoof(x0 - 0.03, z0 - 0.05, w + 0.06, d + 0.1, top + 0.04, 0.22));
  group.add(blueDoor(0.6, z0 + d, 0.1, scriptorium.workers > 0 ? OPEN : CLOSED));
  group.add(frontWindow(1.3, z0 + d, 0.34));
  group.add(porch());
  group.add(writingDesk());
  if (scriptorium.papyrus > 0) group.add(papyrusBundle(INPUT_SPOT.x, 0.03, INPUT_SPOT.z, 0));
  else if (scriptorium.fleece > 0) group.add(box(0.2, 0.12, 0.18, flat(0xf6f1e2), INPUT_SPOT.x, 0.03, INPUT_SPOT.z));
  const scrolls = Math.floor(scriptorium.scrolls / UNITS_PER_LOAD);
  SCROLL_SPOTS.slice(0, scrolls).forEach(([x, z]) => group.add(scroll(x, 0.03, z, 0)));
  return group;
}

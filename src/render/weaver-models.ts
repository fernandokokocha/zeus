import * as THREE from 'three';
import { UNITS_PER_LOAD } from '../sim/food';
import type { Building } from '../sim/state';
import { CLOTH, clothBolt } from './kit/cloth';
import { blueDoor, cube, frontWindow } from './kit/cottage';
import { COLORS, basket, box, cylinder, flat, lotGround, scaled, surface } from './kit/kit';
import { tiledRoof } from './kit/roofs';
import { loom, woolBasket } from './kit/wool';

const CLOSED = 0;
const OPEN = 1.2;
const LOOM_SCALE = 1.9;
const WORKSHOP = { x0: 0.15, z0: 0.15, w: 1.3, d: 0.7, top: 0.6 };
const LEAN_TO = { x: 0.8, front: 1.2, w: 1.3, height: 0.5 };
const LOOM = { x: 0.95, z: 1.42 };
const BOLT_SPOTS: [number, number, number][] = [[1.72, 0, 1.6], [1.72, 0, 1.7], [1.72, 0.085, 1.65], [1.72, 0, 1.8]];

function leanTo(): THREE.Object3D {
  const group = new THREE.Group();
  const { x, front, w, height } = LEAN_TO;
  const back = WORKSHOP.z0 + WORKSHOP.d;
  for (const dx of [-w / 2, w / 2]) group.add(cylinder(0.018, 0.02, height, flat(COLORS.timber), x + dx, 0.03, front, 6));
  const awning = box(w + 0.08, 0.015, front - back + 0.08, flat(CLOTH.dyed), x, height + 0.03, (front + back) / 2);
  awning.rotation.x = 0.2;
  group.add(awning);
  return group;
}

function wovenLoom(): THREE.Object3D {
  const frame = scaled(loom(LOOM.x, LOOM.z, 0), LOOM_SCALE, LOOM_SCALE, LOOM_SCALE);
  const group = new THREE.Group();
  group.add(frame);
  group.add(box(0.6, 0.38, 0.01, flat(CLOTH.dyed), LOOM.x, 0.45, LOOM.z + 0.01));
  group.add(box(0.6, 0.04, 0.012, flat(CLOTH.band), LOOM.x, 0.62, LOOM.z + 0.01));
  return group;
}

export function weaverModel(weaver: Building): THREE.Object3D {
  const group = new THREE.Group();
  const { x0, z0, w, d, top } = WORKSHOP;
  group.add(lotGround(surface('earth')));
  group.add(cube(x0, z0, w, d, top));
  group.add(tiledRoof(x0 - 0.03, z0 - 0.05, w + 0.06, d + 0.1, top + 0.04, 0.22));
  group.add(blueDoor(0.45, z0 + d, 0.1, weaver.workers > 0 ? OPEN : CLOSED));
  group.add(frontWindow(1.15, z0 + d, 0.34));
  group.add(leanTo());
  group.add(wovenLoom());
  group.add(weaver.fleece > 0 ? woolBasket(0.3, 1.45) : basket(0.3, 1.45, null));
  const bolts = Math.floor(weaver.cloth / UNITS_PER_LOAD);
  BOLT_SPOTS.slice(0, bolts).forEach(([x, y, z]) => group.add(clothBolt(x, y + 0.03, z, 0)));
  return group;
}

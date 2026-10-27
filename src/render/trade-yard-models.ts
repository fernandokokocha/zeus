import * as THREE from 'three';
import { BUILDING_SPECS } from '../sim/buildings';
import { sack } from './kit/food';
import { paving } from './kit/garden';
import { COLORS, box, cylinder, flat } from './kit/kit';
import { amphoraRow } from './kit/oil';
import { awning } from './kit/tax';

const { width: W, height: D } = BUILDING_SPECS.tradeYard;
const RAIL = { z: 0.2, height: 0.28, posts: 7 };
const CRATE = 0.24;
const CRATE_STACKS: [number, number, number][] = [[0.5, 1.0, 2], [0.8, 1.05, 1], [1.5, 1.0, 3], [2.4, 1.05, 2], [2.7, 0.95, 1], [3.4, 1.0, 2]];
const AWNING = { x0: 0.3, x1: 3.7, front: 1.35, back: 1.85, high: 0.62, low: 0.5 };

function hitchingRail(): THREE.Object3D {
  const group = new THREE.Group();
  const wood = flat(COLORS.timber);
  for (let i = 0; i < RAIL.posts; i++) {
    const x = 0.2 + (i * (W - 0.4)) / (RAIL.posts - 1);
    group.add(cylinder(0.02, 0.022, RAIL.height, wood, x, 0.03, RAIL.z, 6));
  }
  group.add(box(W - 0.36, 0.03, 0.03, wood, W / 2, 0.03 + RAIL.height - 0.05, RAIL.z));
  return group;
}

function crateStack(x: number, z: number, count: number): THREE.Object3D {
  const group = new THREE.Group();
  for (let level = 0; level < count; level++) {
    const crate = box(CRATE, CRATE * 0.8, CRATE, flat(level % 2 ? COLORS.timber : COLORS.thatch), x, 0.03 + level * CRATE * 0.8, z);
    crate.rotation.y = level * 0.3;
    group.add(crate);
  }
  return group;
}

export function tradeYardModel(): THREE.Object3D {
  const group = new THREE.Group();
  group.add(paving(0.05, 0.05, W - 0.1, D - 0.1));
  group.add(hitchingRail());
  for (const [x, z, count] of CRATE_STACKS) group.add(crateStack(x, z, count));
  const { x0, x1, front, back, high, low } = AWNING;
  group.add(awning(x0, back, x1, front, high, low));
  group.add(amphoraRow(0.5, 1.6, 1.7, 1.6, 5));
  group.add(sack(2.3, 1.6, 0.2), sack(2.6, 1.65, -0.4), sack(3.2, 1.6, 0.6));
  return group;
}

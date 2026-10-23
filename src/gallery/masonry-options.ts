import * as THREE from 'three';
import { blueDoor, stoneWall, gatePost } from '../render/kit/cottage';
import { posedFigure } from '../render/kit/figure';
import { lotGround, surface } from '../render/kit/kit';
import { chips, hoist, lyingHammer, marbleBlock, mason, stockBlock, stoneHut, trestle } from '../render/kit/masonry';
import { tiledRoof } from '../render/kit/roofs';
import { stoneShed } from '../render/masonry-models';
import { type DesignOption, withoutAndWithWorkers } from './options';

const CLOSED = 0;
const OPEN = 1.2;
const TRESTLE_TOP = 0.26;
const STOCK_LOADS = 3;

function workBench(group: THREE.Group, x: number, z: number, staffed: boolean): void {
  group.add(trestle(x, z, TRESTLE_TOP));
  group.add(marbleBlock(x, TRESTLE_TOP + 0.035, z, 0.2, 0.14, 0.16, 0.1));
  group.add(chips(x - 0.05, z, 9, Math.round(x * 100)));
  if (staffed) group.add(posedFigure(x - 0.28, z + 0.03, 0, 0, mason(), 'hammer'));
  else group.add(lyingHammer(x, TRESTLE_TOP + 0.175, z));
}

function stock(group: THREE.Group, spots: [number, number][]): void {
  spots.slice(0, STOCK_LOADS).forEach(([x, z], i) => group.add(stockBlock(x, z, (i % 2 ? 0.3 : -0.2))));
}

function hoistYard(staffed: boolean): THREE.Object3D {
  const group = new THREE.Group();
  group.add(lotGround(surface('rubble')));
  group.add(stoneHut(0.15, 0.15, 0.9, 0.75, 0.55));
  group.add(tiledRoof(0.11, 0.11, 0.98, 0.83, 0.55, 0.26));
  group.add(blueDoor(0.45, 0.9, 0.08, staffed ? OPEN : CLOSED));
  group.add(hoist(1.5, 0.55, 1.05, staffed ? 0.45 : 0.03));
  workBench(group, 1.12, 1.4, staffed);
  stock(group, [[1.75, 1.15], [1.75, 1.45], [1.75, 1.75], [1.45, 1.78]]);
  return group;
}

function walledYard(staffed: boolean): THREE.Object3D {
  const group = new THREE.Group();
  group.add(lotGround());
  group.add(stoneHut(0.15, 0.15, 0.7, 0.65, 0.5));
  group.add(tiledRoof(0.11, 0.11, 0.78, 0.73, 0.5, 0.24));
  group.add(blueDoor(0.38, 0.8, 0.08, staffed ? OPEN : CLOSED));
  group.add(stoneWall(0.12, 1.88, 0.8, 1.88, 0.16), stoneWall(1.2, 1.88, 1.88, 1.88, 0.16));
  group.add(stoneWall(1.88, 0.12, 1.88, 1.88, 0.16), stoneWall(0.95, 0.12, 1.88, 0.12, 0.16));
  group.add(gatePost(0.8, 1.88), gatePost(1.2, 1.88));
  group.add(hoist(1.35, 0.65, 1.1, staffed ? 0.5 : 0.03));
  for (const [x, z] of [[1.15, 0.35], [1.6, 0.35], [1.65, 0.75]]) group.add(stockBlock(x, z, 0.2), marbleBlock(x, 0.19, z, 0.18, 0.13, 0.15, -0.3));
  workBench(group, 0.62, 1.3, staffed);
  stock(group, [[1.6, 1.15], [1.6, 1.5], [1.3, 1.55], [1.3, 1.25]]);
  return group;
}

export const MASONRY_OPTIONS: DesignOption[] = [
  {
    name: 'A · Hoist yard',
    notes: [
      'Closest to today: a rough-stone hut under red tiles, a timber hoist and marble blocks on a paved yard',
      'Staffed: the hoist holds a block in the air and a mason hammers at the trestle, chips at his feet; door open',
      'Empty: the block rests on the ground, the hammer lies on the bench, door shut',
    ],
    build: () => hoistYard(true),
    variants: withoutAndWithWorkers(hoistYard),
  },
  {
    name: 'B · Stone shed',
    notes: [
      'A long open-fronted stone shed across the back, stacked with blocks and column drums',
      'The hoist and the mason’s bench stand in the yard in front of it',
      'Staffed: block hoisted, mason hammering. Empty: block down, hammer on the bench',
    ],
    build: () => stoneShed(true, STOCK_LOADS),
    variants: withoutAndWithWorkers((staffed) => stoneShed(staffed, STOCK_LOADS)),
  },
  {
    name: 'C · Walled cutting yard',
    notes: [
      'A low stone wall rings the yard with a gate to the road; a small hut in the corner',
      'Rough blocks stacked two high around a big central hoist',
      'Staffed: block hoisted, mason hammering by the gate. Empty: block down, hammer on the bench',
    ],
    build: () => walledYard(true),
    variants: withoutAndWithWorkers(walledYard),
  },
];

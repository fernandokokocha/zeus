import * as THREE from 'three';
import { posedFigure } from '../render/kit/figure';
import { herm } from '../render/kit/garden';
import {
  bench,
  discRack,
  discobolus,
  discusThrower,
  gate,
  javelinRack,
  javelinThrower,
  lyingDisc,
  oilFlask,
  parapet,
  parapetAlongZ,
  placed,
  rakedSand,
  sandGround,
  stoaWing,
  strawTarget,
  stuckJavelin,
  wrestlingPit,
} from '../render/kit/gymnasium';
import { box, surface } from '../render/kit/kit';
import { marbleColumn, marbleTerrace } from '../render/kit/palace';
import { tiledRoof } from '../render/kit/roofs';
import { BUILDING_SPECS } from '../sim/buildings';
import { stadion } from '../render/gymnasium-models';
import { type DesignOption, withoutAndWithWorkers } from './options';

const { width: W, height: D } = BUILDING_SPECS.gymnasium;
const FACING_THE_CAMERA = -Math.PI / 4;
const GATE_WIDTH = 0.45;

const WING = { length: W - 0.2, depth: 0.42, height: 0.5, columns: 5 };

function palaestra(staffed: boolean): THREE.Object3D {
  const group = new THREE.Group();
  group.add(sandGround(W, D));
  const { length, depth, height, columns } = WING;
  const near = 0.1 + depth / 2;
  group.add(placed(stoaWing(length, depth, height, columns), W / 2, near, 0));
  group.add(placed(stoaWing(length, depth, height, columns), near, D / 2, Math.PI / 2));
  group.add(placed(stoaWing(length, depth, height, columns), W - near, D / 2, -Math.PI / 2));
  group.add(placed(stoaWing(length, depth, height, columns, GATE_WIDTH + 0.06), W / 2, D - near, Math.PI));
  group.add(gate(W / 2, D - 0.14, GATE_WIDTH, staffed));
  group.add(rakedSand(0.62, 0.62, 1.76, 1.76));
  group.add(wrestlingPit(1.85, 1.15, 0.55, 0.5));
  group.add(herm(0.7, 0.7));
  group.add(discRack(1.1, 0.72, staffed ? 1 : 3));
  if (staffed) {
    group.add(lyingDisc(1.5, 1.05), lyingDisc(0.8, 1.6));
    group.add(oilFlask(1.45, 0.7));
    group.add(posedFigure(1.15, 1.35, FACING_THE_CAMERA, 0, discusThrower(), 'throw'));
  }
  return group;
}

const HALL = { x0: 0.15, z0: 0.15, w: W - 0.3, d: 1.0, floor: 0.12, columns: 6, height: 0.6 };
const TARGET: [number, number] = [0.45, 2.3];
const THROWER: [number, number] = [2.2, 1.75];

function exerciseHall(staffed: boolean): THREE.Object3D {
  const group = new THREE.Group();
  const walls = surface('whitewash');
  const { x0, z0, w, d, floor, columns, height } = HALL;
  const front = z0 + d - 0.1;
  group.add(sandGround(W, D));
  group.add(marbleTerrace(x0, z0, w, d, floor));
  group.add(box(w - 0.1, height + 0.1, 0.1, walls, W / 2, floor, z0 + 0.1));
  for (const x of [x0 + 0.05, x0 + w - 0.05]) group.add(box(0.1, height + 0.1, d - 0.15, walls, x, floor, z0 + (d - 0.15) / 2 + 0.05));
  for (let i = 0; i < columns; i++) group.add(marbleColumn(x0 + 0.2 + ((w - 0.4) * i) / (columns - 1), front, height, floor));
  group.add(box(w, 0.1, 0.16, walls, W / 2, floor + height, front));
  group.add(tiledRoof(x0 - 0.05, z0 - 0.03, w + 0.1, d + 0.06, floor + height + 0.1, 0.34));
  group.add(javelinRack(0.75, z0 + 0.3, staffed ? 2 : 5));
  group.add(discRack(1.55, z0 + 0.3, 3));
  group.add(bench(2.3, z0 + 0.3, 0.6));
  group.add(parapet(0.1, W / 2 - GATE_WIDTH / 2 - 0.1, D - 0.14, 0.18), parapet(W / 2 + GATE_WIDTH / 2 + 0.1, W - 0.1, D - 0.14, 0.18));
  group.add(parapetAlongZ(0.14, z0 + d, D - 0.1, 0.18), parapetAlongZ(W - 0.14, z0 + d, D - 0.1, 0.18));
  group.add(gate(W / 2, D - 0.14, GATE_WIDTH, staffed));
  const [tx, tz] = TARGET;
  const [ax, az] = THROWER;
  group.add(strawTarget(tx, tz, Math.atan2(ax - tx, az - tz)));
  group.add(discobolus(2.5, 2.4, FACING_THE_CAMERA));
  if (staffed) {
    group.add(stuckJavelin(0.75, 2.1, -0.08), stuckJavelin(0.8, 2.5, -0.1));
    group.add(posedFigure(ax, az, Math.atan2(az - tz, tx - ax), 0, javelinThrower(), 'throw'));
  }
  return group;
}

export const GYMNASIUM_OPTIONS: DesignOption[] = [
  { name: 'A · Palaestra', build: () => palaestra(true), variants: withoutAndWithWorkers(palaestra) },
  { name: 'B · Stadion', build: () => stadion(true), variants: withoutAndWithWorkers(stadion) },
  { name: 'C · Exercise hall', build: () => exerciseHall(true), variants: withoutAndWithWorkers(exerciseHall) },
];

import * as THREE from 'three';
import { blueDoor, frontWindow, terraceBlock } from './kit/cottage';
import { posedFigure } from './kit/figure';
import { paving } from './kit/garden';
import { COLORS } from './kit/kit';
import { cypress, lawn } from './kit/luxury';
import { evenly, marbleColumn } from './kit/palace';
import { tholos } from './kit/college';
import { leanToRoof, tiledRoof } from './kit/roofs';
import { wellHead } from './kit/water';
import { asclepiusStaff, healer, herbBasket, herbBed, sickbed } from './kit/warriors';

const W = 4;
const D = 4;
const ALONG_X = 0;
const ABOVE_LAWN = 0.012;

function path(x0: number, z0: number, w: number, d: number): THREE.Object3D {
  const stones = paving(x0, z0, w, d);
  stones.position.y = ABOVE_LAWN;
  return stones;
}

const ABATON = { x0: 1.85, z0: 0.18, w: 1.95, d: 0.9, top: 0.82 };

export function tholosAndAbaton(staffed: boolean): THREE.Object3D {
  const group = new THREE.Group();
  group.add(lawn(0.08, 0.08, W - 0.16, D - 0.16));
  group.add(path(0.2, 1.3, 1.9, 2.5));
  group.add(tholos(1.15, 2.55, 0.62, 8, 0.6, staffed));
  const { x0, z0, w, d, top } = ABATON;
  group.add(terraceBlock(x0, z0, w, d, top, COLORS.deepAegean));
  group.add(tiledRoof(x0 - 0.04, z0 - 0.04, w + 0.08, d + 0.08, top + 0.03, 0.32));
  group.add(blueDoor(x0 + w / 2, z0 + d, 0.12, staffed ? 0.9 : 0));
  for (const x of [x0 + 0.35, x0 + w - 0.35]) group.add(frontWindow(x, z0 + d, 0.5));
  const porch = z0 + d + 0.45;
  for (const x of evenly(x0 + 0.1, x0 + w - 0.1, 5)) group.add(marbleColumn(x, porch, 0.5, 0.03));
  group.add(leanToRoof(x0, z0 + d, x0 + w, porch + 0.05, 0.55, 0.68, 'south', 'tiles'));
  for (const x of [x0 + 0.4, x0 + w - 0.4]) group.add(sickbed(x, z0 + d + 0.22, ALONG_X, staffed));
  group.add(wellHead(0.6, 0.65));
  group.add(herbBed(2.2, 1.95, 0.7, 0.75), herbBed(3.05, 1.95, 0.7, 0.75));
  group.add(herbBed(2.2, 2.9, 0.7, 0.75), herbBed(3.05, 2.9, 0.7, 0.75));
  group.add(asclepiusStaff(2.0, 3.75, 0.75));
  group.add(cypress(1.35, 0.5, 0.65), cypress(0.3, 1.5, 0.55));
  if (staffed) {
    group.add(herbBasket(2.95, 0.03, 2.8));
    group.add(posedFigure(2.9, 2.75, ALONG_X, 0, healer(), 'rest'));
  }
  return group;
}


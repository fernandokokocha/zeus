import * as THREE from 'three';
import { windowsFront, windowsSide } from '../render/kit/blocks';
import { terraceBlock } from '../render/kit/cottage';
import { BLOOM, flowerPot, paving } from '../render/kit/garden';
import { box, surface } from '../render/kit/kit';
import { cypress, fountain, lawn } from '../render/kit/luxury';
import {
  ENTABLATURE_HEIGHT, acroterion, banner, bannerPole, colonnade, entablature, evenly, goldTripod, marbleColumn, marbleStairs,
  marbleTerrace, palaceDoor, palaceGround, pedestalStatue, pedimentRoof, raised,
} from '../render/kit/palace';
import { hipRoof, tiledRoof, tiledRoofAlongZ } from '../render/kit/roofs';
import { megaronPalace } from '../render/palace-models';
import type { DesignOption } from './options';

const W = 9;
const D = 6;

export function courtyardPalace(): THREE.Object3D {
  const group = new THREE.Group();
  group.add(palaceGround(W, D));

  group.add(terraceBlock(0.4, 0.4, 8.2, 1.3, 1.3));
  group.add(tiledRoof(0.4, 0.4, 8.2, 1.3, 1.33, 0.45));
  windowsSide(group, 8.6, [0.75, 1.35], [0.45, 0.85]);

  const hallTop = 1.6;
  group.add(terraceBlock(3.4, 0.3, 2.2, 1.7, hallTop));
  group.add(palaceDoor(W / 2, 2.0, 0.12, 0.5, 0.8));
  group.add(colonnade(evenly(3.52, 5.48, 4).map((x) => [x, 2.45]), hallTop - 0.03, 0.03));
  group.add(entablature(3.4, 0.3, 2.2, 2.3, hallTop));
  pedimentRoof(group, 3.4, 0.3, 2.2, 2.3, hallTop + ENTABLATURE_HEIGHT, 0.6);

  for (const [x0, inner] of [[0.4, 1.6], [7.4, 7.4]]) {
    group.add(terraceBlock(x0, 1.7, 1.2, 3.7, 1.1));
    group.add(tiledRoofAlongZ(x0, 1.7, 1.2, 3.7, 1.13, 0.4));
    const columnX = inner === 1.6 ? 1.78 : 7.22;
    group.add(colonnade(evenly(2.0, 4.1, 4).map((z) => [columnX, z]), 0.8, 0.03));
    group.add(box(0.36, 0.06, 2.4, surface('whitewash'), (columnX + inner) / 2, 0.83, 3.05));
  }
  windowsSide(group, 8.6, [2.2, 3.1, 4.0, 4.9], [0.4, 0.75]);

  group.add(terraceBlock(1.6, 4.3, 5.8, 1.1, 0.95));
  group.add(tiledRoof(1.6, 4.3, 5.8, 1.1, 0.98, 0.35));
  windowsFront(group, [2.1, 2.8, 6.2, 6.9], 5.4, [0.42]);

  const gateTop = 1.35;
  group.add(terraceBlock(3.75, 4.1, 1.5, 1.2, gateTop));
  group.add(palaceDoor(W / 2, 5.3, 0.12, 0.5, 0.75));
  group.add(colonnade(evenly(3.85, 5.15, 4).map((x) => [x, 5.6]), gateTop - 0.03, 0.03));
  group.add(entablature(3.7, 4.1, 1.6, 1.65, gateTop));
  pedimentRoof(group, 3.7, 4.1, 1.6, 1.65, gateTop + ENTABLATURE_HEIGHT, 0.45);
  for (const x of [3.3, 5.7]) group.add(bannerPole(x, 5.75, 1.0));

  group.add(paving(4.2, 2.6, 0.6, 1.7));
  for (const [lx, lz] of [[2.05, 2.15], [5.0, 2.15], [2.05, 3.35], [5.0, 3.35]]) group.add(lawn(lx, lz, 1.95, 0.85));
  group.add(fountain(W / 2, 3.35, 0.4));
  for (const [x, z] of [[2.5, 2.55], [6.5, 2.55], [2.5, 3.75], [6.5, 3.75]]) group.add(cypress(x, z, 0.45));
  for (const x of [3.7, 5.3]) group.add(goldTripod(x, 2.75));
  return group;
}

export function terracedPalace(): THREE.Object3D {
  const group = new THREE.Group();
  group.add(palaceGround(W, D));
  const lower = 0.35;
  const upper = 0.7;
  group.add(marbleTerrace(0.4, 0.3, 8.2, 4.4, lower));
  group.add(marbleTerrace(1.9, 0.3, 5.2, 2.7, upper));
  group.add(marbleStairs(W / 2, 4.7, 1.8, 4, lower / 4, 0.2));
  group.add(marbleStairs(W / 2, 3.0, 1.6, 4, (upper - lower) / 4, 0.18, lower));

  const columnHeight = 1.2;
  const eaves = upper + columnHeight + ENTABLATURE_HEIGHT;
  group.add(box(4.4, columnHeight, 1.8, surface('whitewash'), W / 2, upper, 1.4));
  group.add(palaceDoor(W / 2, 2.3, upper, 0.6, 0.85));
  for (const x of [3.0, 6.0]) group.add(palaceDoor(x, 2.3, upper, 0.3, 0.55));
  group.add(colonnade(evenly(2.4, 6.6, 7).map((x) => [x, 2.72]), columnHeight, upper));
  group.add(entablature(2.25, 0.45, 4.5, 2.45, upper + columnHeight));
  group.add(hipRoof(2.25, 0.45, 4.5, 2.45, eaves, 0.6, 'tiles'));
  for (const x of [2.25, 6.75]) group.add(acroterion(x, eaves, 2.9));
  for (const x of [2.1, 6.9]) group.add(raised(goldTripod(x, 2.85), upper - 0.03));

  group.add(terraceBlock(7.3, 0.5, 1.1, 1.2, 2.6));
  group.add(hipRoof(7.3, 0.5, 1.1, 1.2, 2.63, 0.45, 'tiles'));
  windowsFront(group, [7.6, 8.1], 1.7, [1.4, 1.95]);
  windowsSide(group, 8.4, [0.85, 1.35], [1.4, 1.95]);
  group.add(banner(7.85, 2.45, 1.72, 0.7));
  group.add(acroterion(7.85, 3.08, 1.1));

  for (const x of [3.3, 5.7]) group.add(raised(pedestalStatue(x, 3.6), lower - 0.03));
  for (const x of [3.35, 5.65]) group.add(bannerPole(x, 5.3, 1.1));
  group.add(raised(lawn(0.6, 3.3, 2.0, 1.2), lower - 0.03));
  group.add(raised(fountain(1.6, 3.9, 0.4), lower - 0.03));
  for (const z of [0.6, 1.3, 2.0, 2.7]) group.add(raised(cypress(1.15, z, 0.55), lower - 0.03));
  group.add(raised(lawn(7.1, 2.2, 1.3, 2.3), lower - 0.03));
  group.add(raised(pedestalStatue(7.75, 3.35), lower - 0.03));
  for (const z of [2.4, 4.3]) group.add(raised(cypress(8.35, z, 0.5), lower - 0.03));
  for (const [x, bloom] of [[0.7, BLOOM.red], [2.3, BLOOM.pink], [6.7, BLOOM.yellow], [8.3, BLOOM.red]] as [number, number][]) {
    group.add(flowerPot(x, lower, 4.55, bloom));
  }
  for (const x of [2.2, 6.8]) group.add(marbleColumn(x, 5.35, 0.6, 0.03));
  return group;
}

export const PALACE_OPTIONS: DesignOption[] = [
  {
    name: 'A · Megaron hall',
    notes: [
      'A temple-like hall on a marble podium, ringed by columns, under a red-tiled pediment with a blue tympanum and gold acroteria',
      'Two white wings with red hip roofs flank it, blue banners on their fronts',
      'A front court with fountains, gold statues and gold tripods: the seat of power, and where the taxes go',
    ],
    build: megaronPalace,
  },
  {
    name: 'B · Courtyard palace',
    notes: [
      'A ring of white blocks under red tiles around an inner court with lawns, a fountain and colonnades',
      'From above: a red frame with a green heart — nothing else in the city looks like it',
      'A columned gatehouse with a pediment faces the road; the throne hall at the back has its own pediment',
    ],
    build: courtyardPalace,
  },
  {
    name: 'C · Terraced acropolis',
    notes: [
      'Two marble terraces climb from the road, linked by a grand central stair between blue banners',
      'A long columned hall crowns the top terrace; a white tower with a banner stands at the corner',
      'Gardens, a fountain and gold statues on the lower terrace',
    ],
    build: terracedPalace,
  },
];

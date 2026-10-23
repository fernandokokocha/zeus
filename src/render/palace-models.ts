import * as THREE from 'three';
import { BUILDING_SPECS } from '../sim/buildings';
import { bakedOnce } from './bake';
import { windowsFront, windowsSide } from './kit/blocks';
import { paving } from './kit/garden';
import { box, surface } from './kit/kit';
import { cypress, fountain } from './kit/luxury';
import {
  ENTABLATURE_HEIGHT, banner, colonnade, entablature, evenly, goldTripod, hedge, marbleStairs, marbleTerrace, palaceDoor,
  palaceGround, pedestalStatue, pedimentRoof, wing,
} from './kit/palace';

const { width: W, height: D } = BUILDING_SPECS.palace;

export function megaronPalace(): THREE.Object3D {
  const group = new THREE.Group();
  group.add(palaceGround(W, D));
  const podium = 0.28;
  const columnHeight = 1.25;
  const [x0, z0, w, d] = [2.5, 0.5, 4, 4];
  const front = z0 + d;
  group.add(marbleTerrace(x0, z0, w, d, podium));
  group.add(box(3.1, columnHeight, 2.9, surface('whitewash'), W / 2, podium, 0.8 + 1.45));
  group.add(palaceDoor(W / 2, 3.7, podium, 0.6, 0.9));
  const xs = evenly(x0 + 0.18, x0 + w - 0.18, 6);
  const zs = evenly(z0 + 0.18, front - 0.18, 6);
  const spots: [number, number][] = [
    ...xs.flatMap((x) => [[x, zs[0]], [x, zs[5]]] as [number, number][]),
    ...zs.slice(1, -1).flatMap((z) => [[xs[0], z], [xs[5], z]] as [number, number][]),
  ];
  group.add(colonnade(spots, columnHeight, podium));
  group.add(entablature(x0 + 0.05, z0 + 0.05, w - 0.1, d - 0.1, podium + columnHeight));
  pedimentRoof(group, x0, z0, w, d, podium + columnHeight + ENTABLATURE_HEIGHT, 0.75);
  group.add(marbleStairs(W / 2, front, 2.0, 4, podium / 4, 0.1));

  for (const [wx, right] of [[0.35, false], [6.75, true]] as [number, boolean][]) {
    wing(group, wx, 0.8, 1.9, 3.0, 1.15);
    windowsFront(group, [wx + 0.4, wx + 1.5], 3.8, [0.4, 0.75]);
    group.add(palaceDoor(wx + 0.95, 3.8, 0.12, 0.3, 0.42));
    group.add(banner(wx + (right ? 0.4 : 1.5), 1.08, 3.82, 0.32));
    if (right) windowsSide(group, wx + 1.9, [1.3, 2.2, 3.1], [0.4, 0.75]);
  }

  group.add(paving(3.5, 4.9, 2.0, 1.0));
  for (const x of [3.05, 5.95]) group.add(pedestalStatue(x, 5.0));
  for (const x of [1.3, 7.7]) group.add(fountain(x, 4.85, 0.42));
  for (const x of [2.35, 6.65]) group.add(goldTripod(x, 5.35));
  for (const [hx, hw] of [[0.2, 3.1], [5.7, 3.1]]) group.add(hedge(hx, 5.62, hw, 0.18));
  for (const z of [1.0, 2.0, 3.0]) for (const x of [0.15, 8.85]) group.add(cypress(x, z, 0.55));
  return group;
}

export const palaceModel = bakedOnce(megaronPalace);

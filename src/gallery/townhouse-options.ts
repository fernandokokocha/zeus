import * as THREE from 'three';
import { blueDoor, woodenBalcony } from '../render/kit/cottage';
import { BLOOM, flowerPot } from '../render/kit/garden';
import { box, cylinder, flat, lotGround, shrubAt, surface } from '../render/kit/kit';
import { cypress } from '../render/kit/luxury';
import { amphora } from '../render/kit/oil';
import { hipRoof } from '../render/kit/roofs';
import { townhouseModel } from '../render/house-models';
import { steps, volume, windowsFront, windowsSide } from '../render/kit/blocks';
import type { DesignOption } from './options';

function rising(): THREE.Object3D {
  const group = new THREE.Group();
  group.add(lotGround());
  volume(group, 0.98, 0.16, 0.84, 0.72, 1.55);
  windowsFront(group, [1.2, 1.6], 0.88, [1.15]);
  windowsSide(group, 1.82, [0.4, 0.66], [0.72, 1.15]);
  volume(group, 0.5, 0.5, 0.92, 0.82, 1.08);
  windowsFront(group, [1.25], 1.32, [0.3]);
  windowsSide(group, 1.42, [1.05], [0.3, 0.72]);
  group.add(woodenBalcony(0.98, 1.42, 1.32, 0.58));
  group.add(blueDoor(1.0, 1.32, 0.1, 0.3));
  volume(group, 0.18, 1.02, 0.72, 0.68, 0.58);
  group.add(blueDoor(0.42, 1.7, 0.1, 0.4));
  windowsFront(group, [0.72], 1.7, [0.28]);
  steps(group, 0.42, 1.7, 0.3);

  group.add(flowerPot(0.2, 0.04, 1.82, BLOOM.red), flowerPot(0.86, 0.04, 1.82, BLOOM.pink));
  group.add(amphora(1.6, 1.48), amphora(1.72, 1.5));
  group.add(cypress(1.78, 1.76, 0.42), shrubAt(1.3, 1.7, 0.9, 8));
  group.add(shrubAt(0.24, 0.3, 0.9, 9));
  return group;
}

function stairAndLoggia(): THREE.Object3D {
  const group = new THREE.Group();
  group.add(lotGround());
  volume(group, 0.16, 0.16, 1.68, 0.7, 1.4);
  windowsFront(group, [0.36, 0.7, 1.1, 1.5], 0.86, [1.04]);
  windowsSide(group, 1.84, [0.36, 0.66], [0.62, 1.04]);
  volume(group, 0.16, 0.86, 0.8, 0.82, 0.84);
  windowsFront(group, [0.66], 1.68, [0.3, 0.56]);
  windowsSide(group, 0.96, [1.1], [0.56]);
  group.add(blueDoor(0.34, 1.68, 0.1, 0.4));
  steps(group, 0.34, 1.68, 0.28);

  group.add(box(0.86, 0.03, 0.4, flat(0x8a6238), 1.39, 0.8, 1.06));
  for (const [x, z] of [[1.0, 1.24], [1.39, 1.24], [1.8, 1.24]]) group.add(cylinder(0.02, 0.024, 0.77, flat(0x6b4a2b), x, 0.03, z, 6));
  group.add(woodenBalcony(0.98, 1.8, 1.08, 0.8));
  group.add(hipRoof(0.96, 0.86, 0.88, 0.42, 1.18, 0.12, 'blueTiles'));
  for (let i = 0; i < 6; i++) group.add(box(0.26, 0.04 + i * 0.13, 0.1, surface('whitewash'), 1.66, 0.03, 1.86 - i * 0.1));
  group.add(blueDoor(1.4, 0.86, 0.83, 0.3));
  group.add(blueDoor(1.2, 0.86, 0.1, 0.3));

  group.add(amphora(1.08, 1.5), amphora(1.2, 1.56));
  group.add(flowerPot(1.4, 0.04, 1.7, BLOOM.red), flowerPot(1.86, 0.84, 1.2, BLOOM.pink), flowerPot(1.0, 0.84, 1.2, BLOOM.yellow));
  group.add(shrubAt(1.1, 1.8, 0.8, 10));
  return group;
}

export const TOWNHOUSE_OPTIONS: DesignOption[] = [
  {
    name: 'A · Rising blocks',
    notes: [
      'Three white blocks step up from the street to a tall back tower, each under its own blue hipped roof',
      'A wooden balcony on the middle block, doors on two levels with stone steps',
      'Small shuttered windows on every storey and side',
      'Pots, amphorae and a cypress in the corners left free',
    ],
    build: rising,
  },
  {
    name: 'B · Twin towers',
    notes: [
      'Two tall blocks side by side at the back, one taller than the other',
      'A low front block with the main door joins them into one house',
      'Balcony across the taller block’s upper floor',
      'Cypresses at the front corners',
    ],
    build: townhouseModel,
  },
  {
    name: 'C · Stair & loggia',
    notes: [
      'A wide three-storey block across the back, a lower block in front-left',
      'An outside stair climbs to a timber loggia with its own small blue roof',
      'Doors at ground and loggia level',
      'Amphorae under the loggia, pots on the rail',
    ],
    build: stairAndLoggia,
  },
];

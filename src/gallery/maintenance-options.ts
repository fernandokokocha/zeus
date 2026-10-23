import * as THREE from 'three';
import { blueDoor, cube, frontWindow } from '../render/kit/cottage';
import { posedFigure } from '../render/kit/figure';
import { lotGround, surface } from '../render/kit/kit';
import { bucketCarrier, bucketRack, ladder } from '../render/kit/maintenance';
import { fireTower } from '../render/maintenance-models';
import { tiledRoof } from '../render/kit/roofs';
import { bucket } from '../render/kit/water';
import { type DesignOption, withoutAndWithWorkers } from './options';

const CLOSED = 0;
const OPEN = 1.2;
const FACING_THE_CAMERA = -Math.PI / 4;
const RACK_BUCKETS = 6;

function watchHouse(staffed: boolean): THREE.Object3D {
  const group = new THREE.Group();
  group.add(lotGround(surface('rubble')));
  group.add(cube(0.2, 0.2, 1.15, 0.8, 0.6, 0.03, true));
  group.add(tiledRoof(0.17, 0.17, 1.21, 0.86, 0.64, 0.28));
  group.add(blueDoor(0.5, 1.0, 0.12, staffed ? OPEN : CLOSED));
  group.add(frontWindow(0.95, 1.0, 0.36));
  group.add(bucketRack(1.62, 0.5, staffed ? RACK_BUCKETS - 1 : RACK_BUCKETS));
  group.add(ladder(1.45, 1.05, 0.8, 0.25, Math.PI / 2));
  group.add(bucket(0.2, 0.03, 1.2, true), bucket(0.3, 0.03, 1.25, true));
  if (staffed) group.add(posedFigure(0.95, 1.35, FACING_THE_CAMERA, 0, bucketCarrier(), 'rest'));
  return group;
}

export const MAINTENANCE_OPTIONS: DesignOption[] = [
  {
    name: 'A · Watch house',
    notes: [
      'A white office under red tiles, a rack of water buckets and a ladder against the wall',
      'Staffed: a superintendent in a blue tunic and felt cap stands by the door with a bucket, idling; the door is open',
      'Empty: all six buckets on the rack, door shut',
    ],
    build: () => watchHouse(true),
    variants: withoutAndWithWorkers(watchHouse),
  },
  {
    name: 'B · Fire tower',
    notes: [
      'One white tower: the office on the ground floor behind a blue door, an open red-roofed lookout on top with an alarm gong',
      'Staffed: a watchman on the lookout slowly turns, shading his eyes to scan the city; the door is open',
      'Empty: the lookout is bare and the door is shut',
    ],
    build: () => fireTower(true),
    variants: withoutAndWithWorkers(fireTower),
  },
];

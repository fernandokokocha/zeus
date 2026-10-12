import * as THREE from 'three';
import { tidyWalls, whiteCottage } from '../render/kit/cottage';
import { hovelModel } from '../render/house-models';
import { goat, grainBasket, hen, plankOnStones, raisedGranary, sack, threshingFloor } from '../render/kit/food';
import { COLORS, cylinder, flat, lotGround, path, shrubAt } from '../render/kit/kit';
import type { DesignOption } from './options';
import { bucket, laundryLine, trough, wellHead, yoke } from '../render/kit/water';

function wellYard(): THREE.Object3D {
  const group = new THREE.Group();
  group.add(lotGround());
  group.add(whiteCottage(0.14, 0.14, 0.96, 0.7, 0.26, 0.7));
  group.add(path([[0.4, 0.88], [0.44, 1.4], [0.48, 1.92]], 0.15));

  group.add(wellHead(1.5, 0.42));
  group.add(trough(1.52, 0.86, 0.46, 0));
  group.add(goat(1.62, 1.08, -1.4));
  group.add(bucket(1.2, 0.03, 0.62, true));

  group.add(threshingFloor(1.3, 1.44, 0.28));
  group.add(grainBasket(0.9, 1.08));
  group.add(sack(1.22, 0.98, 0.4), sack(1.06, 0.98, 1.4));
  group.add(plankOnStones(0.24, 1.2, 1.4, 3));
  group.add(hen(0.8, 1.6, 0.9));
  group.add(tidyWalls(0.32, 0.62, 1.1));
  return group;
}

function washingYard(): THREE.Object3D {
  const group = new THREE.Group();
  group.add(lotGround());
  group.add(whiteCottage(0.14, 0.14, 0.9, 0.7, 0.26, 0.66));
  group.add(path([[0.4, 0.88], [0.44, 1.4], [0.48, 1.92]], 0.15));

  group.add(raisedGranary(1.55, 0.36));
  group.add(sack(1.25, 0.34, 0.4), sack(1.3, 0.5, 1.1));

  group.add(yoke(0.72, 1.02, 0.2));
  group.add(trough(1.25, 0.92, 0.4, 0));
  group.add(bucket(1.5, 0.03, 0.98, true));
  group.add(laundryLine(0.2, 1.42, 0.2, 1.84, [COLORS.whitewash, COLORS.aegean, COLORS.whitewash]));

  group.add(threshingFloor(1.36, 1.42, 0.3));
  group.add(grainBasket(0.82, 1.4));
  group.add(plankOnStones(0.56, 1.66, 0.2, 3));
  group.add(goat(1.72, 0.9, 2.8));
  group.add(cylinder(0.01, 0.01, 0.12, flat(COLORS.timber), 1.86, 0.03, 0.76, 4));
  group.add(hen(1.0, 1.7, 0.9));
  group.add(tidyWalls(0.32, 0.6, 1.1));
  group.add(shrubAt(1.86, 0.2, 0.8, 9));
  return group;
}

export const HOVEL_OPTIONS: DesignOption[] = [
  {
    name: 'A · Well & trough',
    notes: [
      'The Shack’s white cottage, slightly bigger; yard walls now tidy with white coping',
      'A whitewashed well-head with a crossbar, rope and a full bucket',
      'A stone trough of water where the goat drinks; a spare bucket by the house',
      'Food stays from the Shack: smaller threshing floor, sacks, grain, bread',
    ],
    build: wellYard,
  },
  {
    name: 'B · Cistern & second room',
    notes: [
      'A second, lower white room added beside the cottage (24 people now)',
      'A white plastered cistern brimming with water, buckets beside it',
      'Garden beds with little blue irrigation channels',
      'Granary, threshing floor, sacks, bread and the goat carried over',
    ],
    build: hovelModel,
  },
  {
    name: 'C · Washing yard',
    notes: [
      'The Shack C layout kept almost as is: granary, threshing floor, goat',
      'Water brought home: a yoke with two full buckets set down by the door',
      'A stone trough and a laundry line with white and blue cloths',
      'Fits the game: water arrives with the fountain’s carrier rather than from a private well',
    ],
    build: washingYard,
  },
];

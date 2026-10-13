import * as THREE from 'three';
import { blueDoor, frontWindow, terraceBlock, tidyWalls } from '../render/kit/cottage';
import { tiledRoof } from '../render/kit/roofs';
import { goat, plankOnStones, sack, threshingFloor } from '../render/kit/food';
import { lotGround, path } from '../render/kit/kit';
import { bucket, cistern, wateredBeds } from '../render/kit/water';
import { fleece, fleeceRack, loom, woolBasket } from '../render/kit/wool';
import { homesteadModel } from '../render/house-models';
import type { DesignOption } from './options';

function redTiledHouse(): THREE.Object3D {
  const group = new THREE.Group();
  group.add(lotGround());
  group.add(terraceBlock(0.14, 0.14, 1.56, 0.7, 0.56));
  group.add(tiledRoof(0.14, 0.14, 1.56, 0.7, 0.53, 0.3));
  group.add(blueDoor(0.42, 0.84, 0.12, 0.5));
  for (const x of [0.9, 1.4]) group.add(frontWindow(x, 0.84, 0.3));
  group.add(path([[0.42, 0.9], [0.44, 1.4], [0.48, 1.92]], 0.15));

  group.add(cistern(1.5, 1.06, 0.4, 0.3));
  group.add(bucket(1.2, 0.03, 1.0, true));
  group.add(threshingFloor(1.5, 1.56, 0.22));
  group.add(sack(1.82, 1.0, 0.4), sack(1.84, 1.18, 1.3));
  group.add(fleeceRack(0.74, 1.02, 1.16, 1.02, 2));
  group.add(woolBasket(0.66, 1.2));
  group.add(wateredBeds(0.7, 1.32, 0.5, 3));
  group.add(plankOnStones(0.24, 1.2, 1.4, 3));
  group.add(goat(0.3, 1.7, 0.4));
  group.add(tidyWalls(0.32, 0.6, 1.0));
  return group;
}

function whiteCourtyard(): THREE.Object3D {
  const group = new THREE.Group();
  group.add(lotGround());
  group.add(terraceBlock(0.14, 0.14, 1.72, 0.54, 0.58));
  group.add(terraceBlock(0.14, 0.68, 0.5, 0.92, 0.5));
  group.add(blueDoor(1.0, 0.68, 0.12, 0.5));
  for (const x of [1.4, 1.7]) group.add(frontWindow(x, 0.68, 0.32));
  group.add(blueDoor(0.39, 1.6, 0.12, 0.5));
  group.add(path([[0.39, 1.64], [0.44, 1.92]], 0.15));

  group.add(fleece(0.9, 0.36, 0.3, 0.6), fleece(1.2, 0.4, 1.4, 0.6), fleece(0.38, 1.0, 0.8, 0.52));
  group.add(loom(0.82, 0.78, 0));
  group.add(woolBasket(1.2, 0.84));
  group.add(cistern(1.5, 1.04, 0.4, 0.3));
  group.add(bucket(1.2, 0.03, 1.06, true));
  group.add(threshingFloor(1.4, 1.56, 0.22));
  group.add(sack(0.8, 1.6, 0.4));
  group.add(goat(0.9, 1.25, 2.2));
  group.add(tidyWalls(0.64, 0.66, 0.68));
  return group;
}

export const HOMESTEAD_OPTIONS: DesignOption[] = [
  {
    name: 'A · Red-tiled house',
    notes: [
      'The cottage and side room become one long house under a terracotta roof',
      'From above the roof turns from straw to red at once',
      'Window holes get blue shutters; walls and yard stay white',
      'A fleece rack and wool basket join the cistern and food yard',
    ],
    build: redTiledHouse,
  },
  {
    name: 'B · White courtyard',
    notes: [
      'Two flat-roofed white wings wrap the yard in an L, with a blue band under the parapet',
      'From above the roofs turn from straw to white',
      'Fleeces drying on the roof terraces, a loom in the courtyard',
      'Cistern, threshing floor and goat move inside the courtyard',
    ],
    build: whiteCourtyard,
  },
  {
    name: 'C · Two storeys',
    notes: [
      'The cottage is built up a full storey, twice the Hovel’s height',
      'A wooden balcony across the front, with fleeces hung over the rail',
      'Flat white roofs with a blue band, like B, on both rooms',
      'The Hovel yard is kept, with wool baskets by the door',
    ],
    build: homesteadModel,
  },
];

import * as THREE from 'three';
import { blueDoor, frontWindow, terraceBlock, tidyWalls } from '../render/kit/cottage';
import { plankOnStones, sack } from '../render/kit/food';
import { BLOOM, flowerPot, herm, paving, portico } from '../render/kit/garden';
import { lotGround } from '../render/kit/kit';
import { amphoraRow, oliveTree } from '../render/kit/oil';
import { barrelVault, barrelVaultAlongZ, dome, tiledRoof, tiledRoofAlongZ } from '../render/kit/roofs';
import { bucket, cistern } from '../render/kit/water';
import { fleece, woolBasket } from '../render/kit/wool';
import { apartmentModel } from '../render/house-models';
import type { DesignOption } from './options';

const RIGHT_PORTICO: [number, number][] = [[1.12, 0.88], [1.46, 0.88], [1.8, 0.88]];
const LEFT_PORTICO: [number, number][] = [[0.78, 1.0], [0.78, 1.38], [0.78, 1.74]];

function mainBlock(group: THREE.Group, wallTop: number): void {
  group.add(lotGround());
  group.add(terraceBlock(0.14, 0.14, 0.94, 0.7, wallTop));
  group.add(blueDoor(0.84, 0.84, 0.12, 0.5));
  for (let y = 0.72; y < wallTop - 0.2; y += 0.42) for (const x of [0.4, 0.82]) group.add(frontWindow(x, 0.84, y));
}

function court(group: THREE.Group): void {
  group.add(portico(1.04, 0.7, 1.86, 0.92, 0.42, RIGHT_PORTICO));
  group.add(portico(0.6, 0.92, 0.82, 1.8, 0.42, LEFT_PORTICO));
  group.add(paving(0.82, 0.92, 1.04, 0.94));
  group.add(cistern(1.32, 1.36, 0.42, 0.42));
  group.add(bucket(1.04, 0.04, 1.36, true));
  group.add(plankOnStones(1.32, 1.76, 0, 3));
  group.add(woolBasket(0.7, 1.2), sack(0.7, 1.5, 0.4));
  group.add(tidyWalls(0.92, 1.1, 0.92));
}

function slateAndOlive(): THREE.Object3D {
  const group = new THREE.Group();
  mainBlock(group, 1.42);
  group.add(tiledRoof(0.14, 0.14, 0.94, 0.7, 1.39, 0.28, 'slate'));
  group.add(terraceBlock(1.14, 0.14, 0.72, 0.56, 0.5));
  group.add(tiledRoof(1.14, 0.14, 0.72, 0.56, 0.47, 0.18, 'slate'));
  group.add(terraceBlock(0.14, 0.9, 0.46, 0.9, 0.5));
  group.add(tiledRoofAlongZ(0.14, 0.9, 0.46, 0.9, 0.47, 0.16, 'slate'));
  court(group);
  group.add(oliveTree(1.66, 1.62, 1.4));
  group.add(amphoraRow(0.7, 0.98, 0.7, 1.12, 2), amphoraRow(0.7, 1.62, 0.7, 1.74, 2));
  group.add(herm(1.32, 1.12));
  group.add(flowerPot(1.0, 0.04, 1.06, BLOOM.red), flowerPot(1.66, 0.04, 1.06, BLOOM.pink));
  return group;
}

function vaultsAndDome(): THREE.Object3D {
  const group = new THREE.Group();
  mainBlock(group, 1.0);
  group.add(dome(0.5, 0.42, 0.22, 1.0));
  group.add(flowerPot(0.9, 1.02, 0.3, BLOOM.red), flowerPot(0.92, 1.02, 0.66, BLOOM.pink));
  group.add(fleece(0.86, 0.48, 0.3, 1.02));
  group.add(terraceBlock(1.14, 0.14, 0.72, 0.56, 0.5));
  group.add(barrelVault(1.14, 0.14, 0.72, 0.56, 0.5));
  group.add(terraceBlock(0.14, 0.9, 0.46, 0.9, 0.5));
  group.add(barrelVaultAlongZ(0.14, 0.9, 0.46, 0.9, 0.5));
  court(group);
  group.add(oliveTree(1.0, 1.66, 1.0));
  group.add(amphoraRow(1.2, 0.78, 1.72, 0.78, 4));
  group.add(herm(1.32, 1.12));
  group.add(flowerPot(1.66, 0.04, 1.06, BLOOM.yellow), flowerPot(1.66, 0.04, 1.66, BLOOM.red));
  return group;
}

export const APARTMENT_OPTIONS: DesignOption[] = [
  {
    name: 'A · Blue-glazed tiles',
    notes: [
      'All three wings rise to two storeys under pitched roofs of blue-glazed tile',
      'From above: three blue roofs around the pale court',
      'A row of oil amphorae along the back portico, more by the cistern',
      'Tenement court, porticos and herm kept',
    ],
    build: apartmentModel,
  },
  {
    name: 'B · Slate & olive tree',
    notes: [
      'The main block goes up a third storey; grey slate roofs on every wing',
      'Low wings keep their height, so the tall block stands out',
      'An olive tree in the court corner, amphorae under the left portico',
      'From above: grey roofs and a silver-green tree',
    ],
    build: slateAndOlive,
  },
  {
    name: 'C · Blue vaults & dome',
    notes: [
      'The low wings get blue barrel-vaulted roofs, the main block a blue dome',
      'Its flat roof stays a terrace with pots and a fleece',
      'Amphorae under the back portico, a young olive tree by the gate',
      'Island-style rather than strictly ancient, but unmistakable from above',
    ],
    build: vaultsAndDome,
  },
];

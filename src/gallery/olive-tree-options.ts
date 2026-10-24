import * as THREE from 'three';
import { bakedOnce } from '../render/bake';
import { box, flat } from '../render/kit/kit';
import { burl, crown, harvestCloth, hollow, limb, olives, stake, treeBed, type Puff } from '../render/kit/olive-tree';
import { TERRAIN_COLORS } from '../render/palette';
import { gnarledElder, twinTrunk } from '../render/olive-models';
import type { DesignOption } from './options';

function youngTree(ripe: boolean): THREE.Object3D {
  const group = new THREE.Group();
  group.add(treeBed(0.5, 0.5, 0.14));
  group.add(limb([[0.5, 0, 0.5], [0.51, 0.18, 0.5], [0.49, 0.36, 0.51]], 0.032, 0.02));
  group.add(stake(0.56, 0.45, 0.3));
  const puffs: Puff[] = [
    [0.5, 0.5, 0.5, 0.12], [0.4, 0.44, 0.48, 0.08], [0.6, 0.45, 0.53, 0.08], [0.52, 0.44, 0.4, 0.08], [0.47, 0.46, 0.6, 0.08],
  ];
  group.add(crown(puffs, 37));
  if (ripe) group.add(olives(puffs, 37), harvestCloth(0.36, 0.72, 0.26, 0.15, 37));
  return group;
}

function wideOldTree(ripe: boolean): THREE.Object3D {
  const group = new THREE.Group();
  group.add(treeBed(0.5, 0.5, 0.24));
  group.add(limb([[0.5, 0, 0.5], [0.52, 0.12, 0.49], [0.5, 0.22, 0.5]], 0.11, 0.085));
  group.add(hollow(0.5, 0.1, 0.5, 0.1, Math.PI / 2), burl(0.42, 0.06, 0.48, 0.06));
  for (const [x, z] of [[0.24, 0.38], [0.76, 0.42], [0.42, 0.78], [0.62, 0.26]]) {
    group.add(limb([[0.5, 0.2, 0.5], [(0.5 + x) / 2, 0.3, (0.5 + z) / 2], [x, 0.36, z]], 0.05, 0.028));
  }
  const puffs: Puff[] = [
    [0.22, 0.4, 0.38, 0.14], [0.78, 0.42, 0.44, 0.14], [0.4, 0.4, 0.78, 0.14], [0.64, 0.42, 0.24, 0.13],
    [0.66, 0.42, 0.68, 0.13], [0.3, 0.44, 0.62, 0.12], [0.4, 0.46, 0.28, 0.12], [0.5, 0.5, 0.5, 0.16],
  ];
  group.add(crown(puffs, 41));
  if (ripe) group.add(olives(puffs, 41), harvestCloth(0.22, 0.8, 0.24, 0.2, 41));
  return group;
}

function leaningTree(ripe: boolean): THREE.Object3D {
  const group = new THREE.Group();
  group.add(treeBed(0.42, 0.56, 0.18));
  group.add(limb([[0.36, 0, 0.6], [0.46, 0.16, 0.56], [0.55, 0.3, 0.48], [0.64, 0.42, 0.42]], 0.065, 0.035));
  group.add(burl(0.4, 0.06, 0.58, 0.05));
  const puffs: Puff[] = [
    [0.66, 0.5, 0.4, 0.14], [0.56, 0.58, 0.46, 0.12], [0.74, 0.58, 0.48, 0.1], [0.62, 0.62, 0.32, 0.1],
    [0.47, 0.3, 0.56, 0.08], [0.66, 0.66, 0.42, 0.1],
  ];
  group.add(crown(puffs, 53));
  if (ripe) group.add(olives(puffs, 53), harvestCloth(0.3, 0.3, 0.3, 0.6, 53));
  return group;
}

function onMeadow(build: () => THREE.Object3D): () => THREE.Object3D {
  return () => new THREE.Group().add(box(1, 0.004, 1, flat(TERRAIN_COLORS.meadow), 0.5, 0, 0.5), build());
}

function option(name: string, tree: (ripe: boolean) => THREE.Object3D): DesignOption {
  const growing = bakedOnce(() => tree(false));
  const ripe = bakedOnce(() => tree(true));
  return {
    name,
    build: onMeadow(ripe),
    variants: [
      { label: 'Growing', build: onMeadow(growing) },
      { label: 'Ripe', build: onMeadow(ripe) },
    ],
  };
}

export const OLIVE_TREE_OPTIONS: DesignOption[] = [
  option('A · Gnarled elder', gnarledElder),
  option('B · Twin trunk', twinTrunk),
  option('C · Young tree', youngTree),
  option('D · Wide old tree', wideOldTree),
  option('E · Leaning tree', leaningTree),
];

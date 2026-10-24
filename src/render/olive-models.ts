import * as THREE from 'three';
import { isRipe } from '../sim/olives';
import type { Building } from '../sim/state';
import { bakedOnce } from './bake';
import { burl, crown, harvestCloth, limb, olives, treeBed, type Puff } from './kit/olive-tree';
import { variantIndexAt } from './palette';

export function gnarledElder(ripe: boolean): THREE.Object3D {
  const group = new THREE.Group();
  group.add(treeBed(0.5, 0.5, 0.2));
  group.add(limb([[0.5, 0, 0.5], [0.46, 0.12, 0.54], [0.53, 0.22, 0.47], [0.47, 0.31, 0.5]], 0.08, 0.05));
  group.add(burl(0.54, 0.08, 0.53, 0.055), burl(0.44, 0.19, 0.48, 0.045));
  group.add(limb([[0.47, 0.3, 0.5], [0.38, 0.38, 0.45], [0.3, 0.46, 0.42]], 0.045, 0.025));
  group.add(limb([[0.47, 0.3, 0.5], [0.58, 0.36, 0.56], [0.65, 0.47, 0.6]], 0.045, 0.025));
  group.add(limb([[0.47, 0.3, 0.5], [0.5, 0.42, 0.4]], 0.035, 0.022));
  const puffs: Puff[] = [
    [0.3, 0.5, 0.42, 0.14], [0.65, 0.52, 0.6, 0.14], [0.52, 0.55, 0.34, 0.13], [0.4, 0.58, 0.62, 0.12],
    [0.5, 0.65, 0.5, 0.15], [0.68, 0.6, 0.4, 0.11], [0.33, 0.62, 0.52, 0.1],
  ];
  group.add(crown(puffs, 11));
  if (ripe) group.add(olives(puffs, 11), harvestCloth(0.3, 0.72, 0.34, 0.3, 11));
  return group;
}

export function twinTrunk(ripe: boolean): THREE.Object3D {
  const group = new THREE.Group();
  group.add(treeBed(0.5, 0.5, 0.2));
  group.add(burl(0.5, 0.04, 0.5, 0.07));
  group.add(limb([[0.5, 0, 0.5], [0.42, 0.14, 0.46], [0.36, 0.26, 0.47], [0.3, 0.4, 0.4]], 0.05, 0.03));
  group.add(limb([[0.5, 0, 0.5], [0.58, 0.16, 0.55], [0.62, 0.3, 0.53], [0.7, 0.44, 0.6]], 0.05, 0.03));
  const puffs: Puff[] = [
    [0.28, 0.48, 0.38, 0.13], [0.36, 0.56, 0.48, 0.11], [0.22, 0.56, 0.48, 0.09],
    [0.7, 0.52, 0.62, 0.13], [0.62, 0.6, 0.54, 0.11], [0.76, 0.6, 0.52, 0.09], [0.5, 0.62, 0.5, 0.1],
  ];
  group.add(crown(puffs, 23));
  if (ripe) group.add(olives(puffs, 23), harvestCloth(0.36, 0.72, 0.32, -0.25, 23));
  return group;
}

const TREES = [gnarledElder, twinTrunk].map((tree) => ({ growing: bakedOnce(() => tree(false)), ripe: bakedOnce(() => tree(true)) }));

export function oliveTreeModel(tree: Building): THREE.Object3D {
  const variant = TREES[variantIndexAt(tree.x, tree.y, TREES.length)];
  return isRipe(tree) ? variant.ripe() : variant.growing();
}

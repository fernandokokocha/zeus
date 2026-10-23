import * as THREE from 'three';
import { type FigureParts, at, head, legs, rod, torso } from './figure';
import { COLORS, box, flat } from './kit';

export const FARM = {
  tunic: 0x2f6fb3,
  furrow: 0x8a6b45,
  sprout: 0x8fb04a,
  ripening: 0xb5b74e,
  ripe: 0xe3c35c,
  ear: 0xf2da84,
  steel: 0x9aa0a6,
};

const BASE = 0.03;
const CROP_HEIGHTS = [0, 0.06, 0.16, 0.22];
const CROP_COLORS = [0, FARM.sprout, FARM.ripening, FARM.ripe];

function hoe(foot: THREE.Vector3, grip: THREE.Vector3): THREE.Object3D {
  const group = new THREE.Group();
  group.add(rod(foot, grip, 0.011, COLORS.timber));
  group.add(box(0.07, 0.03, 0.012, flat(FARM.steel), foot.x, foot.y, foot.z + 0.01));
  return group;
}

export function leaningHoe(x: number, z: number, wallZ: number): THREE.Object3D {
  return hoe(at(x, BASE, z), at(x + 0.03, 0.42, wallZ));
}

export function farmerParts(): FigureParts {
  const body = legs();
  body.add(hoe(at(0.14, 0, 0.1), at(0.07, 0.42, 0.08)));
  return { legs: body, torso: torso(FARM.tunic, [at(0.07, 0.17, 0.085), at(-0.01, 0.01, -0.085)]), head: head('straw') };
}

export function wheatRow(x: number, z: number, length: number, stage: number): THREE.Object3D {
  const group = new THREE.Group();
  group.add(box(0.2, 0.025, length, flat(FARM.furrow), x, BASE, z));
  if (stage === 0) return group;
  const height = CROP_HEIGHTS[stage];
  group.add(box(0.15, height, length - 0.06, flat(CROP_COLORS[stage]), x, BASE + 0.02, z));
  if (stage === CROP_HEIGHTS.length - 1) group.add(box(0.17, 0.04, length - 0.04, flat(FARM.ear), x, BASE + height, z));
  return group;
}

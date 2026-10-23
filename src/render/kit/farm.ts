import * as THREE from 'three';
import { COLORS, box, cylinder, flat, sphere } from './kit';

export const FARM = {
  tunic: 0x2f6fb3,
  belt: 0xffffff,
  skin: 0xd9a77a,
  hair: 0x3a2a1c,
  straw: 0xd8b46a,
  furrow: 0x8a6b45,
  sprout: 0x8fb04a,
  ripening: 0xb5b74e,
  ripe: 0xe3c35c,
  ear: 0xf2da84,
  steel: 0x9aa0a6,
};

const HIP = 0.2;
const SHOULDER = 0.17;
const NECK = 0.27;
const FIGURE_SCALE = 1.25;
const BASE = 0.03;
const CROP_HEIGHTS = [0, 0.06, 0.16, 0.22];
const CROP_COLORS = [0, FARM.sprout, FARM.ripening, FARM.ripe];

export type Animate = (seconds: number) => void;

function rod(from: THREE.Vector3, to: THREE.Vector3, radius: number, color: number): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, from.distanceTo(to), 6), flat(color));
  mesh.position.copy(from).add(to).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), to.clone().sub(from).normalize());
  return mesh;
}

const at = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

function hoe(foot: THREE.Vector3, grip: THREE.Vector3): THREE.Object3D {
  const group = new THREE.Group();
  group.add(rod(foot, grip, 0.011, COLORS.timber));
  group.add(box(0.07, 0.03, 0.012, flat(FARM.steel), foot.x, foot.y, foot.z + 0.01));
  return group;
}

export function leaningHoe(x: number, z: number, wallZ: number): THREE.Object3D {
  return hoe(at(x, BASE, z), at(x + 0.03, 0.42, wallZ));
}

export interface FarmerParts {
  legs: THREE.Object3D;
  torso: THREE.Object3D;
  head: THREE.Object3D;
}

function farmerLegs(): THREE.Object3D {
  const group = new THREE.Group();
  for (const side of [-1, 1]) group.add(rod(at(0, HIP, side * 0.03), at(0, 0.01, side * 0.045), 0.019, FARM.skin));
  group.add(hoe(at(0.14, 0, 0.1), at(0.07, 0.42, 0.08)));
  return group;
}

function farmerTorso(): THREE.Object3D {
  const group = new THREE.Group();
  group.add(cylinder(0.055, 0.08, 0.27, flat(FARM.tunic), 0, -0.07, 0, 10));
  group.add(cylinder(0.064, 0.066, 0.03, flat(FARM.belt), 0, 0.02, 0, 10));
  group.add(rod(at(0, SHOULDER, 0.065), at(0.07, 0.17, 0.085), 0.017, FARM.skin));
  group.add(rod(at(0, SHOULDER, -0.065), at(-0.01, 0.01, -0.085), 0.017, FARM.skin));
  return group;
}

function farmerHead(): THREE.Object3D {
  const group = new THREE.Group();
  group.add(sphere(0.05, flat(FARM.skin), 0, 0, 0));
  group.add(sphere(0.046, flat(FARM.hair), -0.012, 0.008, 0));
  group.add(sphere(0.012, flat(FARM.skin), 0.05, -0.005, 0));
  group.add(cylinder(0.035, 0.115, 0.03, flat(FARM.straw), 0, 0.02, 0, 12));
  group.add(cylinder(0.025, 0.035, 0.04, flat(FARM.straw), 0, 0.04, 0, 8));
  return group;
}

export function farmerParts(): FarmerParts {
  return { legs: farmerLegs(), torso: farmerTorso(), head: farmerHead() };
}

export function restingFarmer(x: number, z: number, turn: number, phase: number, parts: FarmerParts): THREE.Object3D {
  const group = new THREE.Group();
  group.add(parts.legs);
  const torso = new THREE.Group();
  torso.position.y = HIP;
  torso.add(parts.torso);
  const neck = new THREE.Group();
  neck.position.y = NECK;
  neck.add(parts.head);
  torso.add(neck);
  group.add(torso);

  const animate: Animate = (seconds) => {
    const t = seconds + phase;
    torso.rotation.z = Math.sin(t * 1.3) * 0.035;
    torso.rotation.x = Math.sin(t * 0.8) * 0.025;
    neck.rotation.y = Math.sin(t * 0.45) * 0.7;
    neck.rotation.z = Math.sin(t * 0.7) * 0.06;
  };
  group.userData.animate = animate;

  group.position.set(x, BASE, z);
  group.rotation.y = turn;
  group.scale.setScalar(FIGURE_SCALE);
  return group;
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

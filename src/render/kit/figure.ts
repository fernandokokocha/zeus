import * as THREE from 'three';
import { COLORS, cone, cylinder, flat, sphere } from './kit';

export const FIGURE = {
  skin: 0xd9a77a,
  hair: 0x3a2a1c,
  belt: 0xffffff,
  straw: 0xd8b46a,
  felt: 0x9a5a3a,
};

export const HIP = 0.2;
export const SHOULDER = 0.17;
const NECK = 0.27;
const FIGURE_SCALE = 1.25;
const BASE = 0.03;

export type Animate = (seconds: number) => void;
export type Hat = 'straw' | 'pilos';
export type Motion = 'rest' | 'lookout' | 'hammer';

export interface FigureParts {
  legs: THREE.Object3D;
  torso: THREE.Object3D;
  head: THREE.Object3D;
  arm?: THREE.Object3D;
}

export function rod(from: THREE.Vector3, to: THREE.Vector3, radius: number, color: number): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, from.distanceTo(to), 6), flat(color));
  mesh.position.copy(from).add(to).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), to.clone().sub(from).normalize());
  return mesh;
}

export const at = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

export function legs(): THREE.Group {
  const group = new THREE.Group();
  for (const side of [-1, 1]) group.add(rod(at(0, HIP, side * 0.03), at(0, 0.01, side * 0.045), 0.019, FIGURE.skin));
  return group;
}

export function torso(tunic: number, hands: THREE.Vector3[]): THREE.Group {
  const group = new THREE.Group();
  group.add(cylinder(0.055, 0.08, 0.27, flat(tunic), 0, -0.07, 0, 10));
  group.add(cylinder(0.064, 0.066, 0.03, flat(FIGURE.belt), 0, 0.02, 0, 10));
  for (const hand of hands) group.add(rod(at(0, SHOULDER, Math.sign(hand.z) * 0.065), hand, 0.017, FIGURE.skin));
  return group;
}

export function head(hat: Hat): THREE.Group {
  const group = new THREE.Group();
  group.add(sphere(0.05, flat(FIGURE.skin), 0, 0, 0));
  group.add(sphere(0.046, flat(FIGURE.hair), -0.012, 0.008, 0));
  group.add(sphere(0.012, flat(FIGURE.skin), 0.05, -0.005, 0));
  if (hat === 'straw') {
    group.add(cylinder(0.035, 0.115, 0.03, flat(FIGURE.straw), 0, 0.02, 0, 12));
    group.add(cylinder(0.025, 0.035, 0.04, flat(FIGURE.straw), 0, 0.04, 0, 8));
  } else {
    group.add(cone(0.052, 0.09, flat(FIGURE.felt), 0, 0.02, 0, 12));
  }
  return group;
}

const HAND = at(0.12, -0.08, 0.02);
const HAMMER_HANDLE = 0.11;
const HAMMER_HEAD = 0.07;

export function hammerArm(): THREE.Group {
  const group = new THREE.Group();
  group.add(rod(at(0, 0, 0), HAND, 0.017, FIGURE.skin));
  const along = HAND.clone().setZ(0).normalize();
  const across = at(-along.y, along.x, 0);
  const top = HAND.clone().addScaledVector(across, HAMMER_HANDLE);
  group.add(rod(HAND, top, 0.009, COLORS.timber));
  group.add(rod(top.clone().addScaledVector(along, -HAMMER_HEAD / 2), top.clone().addScaledVector(along, HAMMER_HEAD / 2), 0.018, 0x6a6e72));
  return group;
}

const MOTIONS: Record<Motion, (pose: { torso: THREE.Object3D; neck: THREE.Object3D; arm?: THREE.Object3D; body: THREE.Object3D }, t: number) => void> = {
  rest: ({ torso, neck }, t) => {
    torso.rotation.z = Math.sin(t * 1.3) * 0.035;
    torso.rotation.x = Math.sin(t * 0.8) * 0.025;
    neck.rotation.y = Math.sin(t * 0.45) * 0.7;
    neck.rotation.z = Math.sin(t * 0.7) * 0.06;
  },
  lookout: ({ torso, neck, body }, t) => {
    body.rotation.y = Math.sin(t * 0.25) * 1.2;
    torso.rotation.z = Math.sin(t * 1.1) * 0.03;
    neck.rotation.y = Math.sin(t * 0.6) * 0.5;
  },
  hammer: ({ torso, neck, arm }, t) => {
    const swing = Math.sin(t * 5);
    arm!.rotation.z = 0.2 + Math.max(swing, -0.4) * 0.9;
    torso.rotation.z = -0.15 - swing * 0.04;
    neck.rotation.y = Math.sin(t * 0.3) * 0.15;
  },
};

export function posedFigure(x: number, z: number, turn: number, phase: number, parts: FigureParts, motion: Motion): THREE.Object3D {
  const group = new THREE.Group();
  const body = new THREE.Group();
  body.add(parts.legs);
  const upper = new THREE.Group();
  upper.position.y = HIP;
  upper.add(parts.torso);
  const neck = new THREE.Group();
  neck.position.y = NECK;
  neck.add(parts.head);
  upper.add(neck);
  let arm: THREE.Group | undefined;
  if (parts.arm) {
    arm = new THREE.Group();
    arm.position.set(0, SHOULDER, 0.065);
    arm.add(parts.arm);
    upper.add(arm);
  }
  body.add(upper);
  group.add(body);

  const animate: Animate = (seconds) => MOTIONS[motion]({ torso: upper, neck, arm, body }, seconds + phase);
  group.userData.animate = animate;

  group.position.set(x, BASE, z);
  group.rotation.y = turn;
  group.scale.setScalar(FIGURE_SCALE);
  return group;
}

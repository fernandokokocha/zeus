import * as THREE from 'three';
import { box, cylinder, flat } from './kit';

export const SCROLLS = {
  sheet: 0xeadfbf,
  rod: 0x5a3a22,
  reed: 0xb9a05a,
  tie: 0x6f5a2e,
};

const SCROLL = { radius: 0.03, length: 0.2, knob: 0.012 };
const BUNDLE = { radius: 0.05, length: 0.28 };

function lying(part: THREE.Object3D, y: number): THREE.Object3D {
  part.rotation.z = Math.PI / 2;
  part.position.y = y;
  return part;
}

export function scroll(x: number, y: number, z: number, turn: number): THREE.Object3D {
  const group = new THREE.Group();
  const { radius, length, knob } = SCROLL;
  group.add(lying(cylinder(radius, radius, length, flat(SCROLLS.sheet), 0, -length / 2, 0, 10), radius));
  group.add(lying(cylinder(knob, knob, length + 0.05, flat(SCROLLS.rod), 0, -(length + 0.05) / 2, 0, 6), radius));
  group.position.set(x, y, z);
  group.rotation.y = turn;
  return group;
}

export function papyrusBundle(x: number, y: number, z: number, turn: number): THREE.Object3D {
  const group = new THREE.Group();
  const { radius, length } = BUNDLE;
  group.add(lying(cylinder(radius, radius, length, flat(SCROLLS.reed), 0, -length / 2, 0, 8), radius));
  for (const dx of [-0.08, 0.08]) group.add(lying(cylinder(radius + 0.004, radius + 0.004, 0.02, flat(SCROLLS.tie), 0, dx - 0.01, 0, 8), radius));
  group.position.set(x, y, z);
  group.rotation.y = turn;
  return group;
}

export function storedScrolls(): THREE.Object3D {
  const group = new THREE.Group();
  group.add(box(0.28, 0.03, 0.22, flat(0x8a6238), 0, 0, 0));
  for (const z of [-0.06, 0, 0.06]) group.add(scroll(0, 0.03, z, 0));
  for (const z of [-0.03, 0.03]) group.add(scroll(0, 0.03 + 2 * SCROLL.radius - 0.01, z, 0));
  return group;
}

export function storedPapyrus(): THREE.Object3D {
  const group = new THREE.Group();
  for (const z of [-0.055, 0.055]) group.add(papyrusBundle(0, 0, z, 0));
  group.add(papyrusBundle(0, 2 * BUNDLE.radius - 0.015, 0, 0));
  return group;
}

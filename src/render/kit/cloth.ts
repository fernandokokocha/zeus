import * as THREE from 'three';
import { box, cylinder, flat } from './kit';

export const CLOTH = {
  dyed: 0x24509a,
  band: 0xd8b45a,
};

const BOLT = { radius: 0.05, length: 0.3 };

export function clothBolt(x: number, y: number, z: number, turn: number): THREE.Object3D {
  const group = new THREE.Group();
  const roll = cylinder(BOLT.radius, BOLT.radius, BOLT.length, flat(CLOTH.dyed), 0, -BOLT.length / 2, 0, 12);
  const band = cylinder(BOLT.radius + 0.004, BOLT.radius + 0.004, 0.03, flat(CLOTH.band), 0, -0.015, 0, 12);
  for (const part of [roll, band]) {
    part.rotation.z = Math.PI / 2;
    part.position.y = BOLT.radius;
    group.add(part);
  }
  group.position.set(x, y, z);
  group.rotation.y = turn;
  return group;
}

export function clothBolts(): THREE.Object3D {
  const group = new THREE.Group();
  group.add(box(0.3, 0.03, 0.24, flat(0x8a6238), 0, 0, 0));
  for (const z of [-0.055, 0.055]) group.add(clothBolt(0, 0.03, z, 0));
  group.add(clothBolt(0, 0.03 + 2 * BOLT.radius - 0.015, 0, 0));
  return group;
}

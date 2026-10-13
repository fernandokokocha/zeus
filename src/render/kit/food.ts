import * as THREE from 'three';
import { COLORS, box, cone, cylinder, flat, glowing, jar, scaled, smoke, sphere, stone, surface } from './kit';

export const FOOD = {
  bread: 0xc4873f,
  crust: 0xa86a2c,
  sack: 0xc49a52,
  wheat: 0xe3c35c,
  fig: 0x6a3f5a,
  cheese: 0xeee2b8,
  onion: 0xd8b07a,
  leaf: 0x6f9a3a,
};

export function loaf(x: number, y: number, z: number): THREE.Object3D {
  const group = new THREE.Group();
  group.add(scaled(sphere(0.035, flat(FOOD.bread), x, y + 0.015, z), 1, 0.55, 1));
  group.add(box(0.05, 0.004, 0.006, flat(FOOD.crust), x, y + 0.033, z));
  return group;
}

export function sack(x: number, z: number, turn: number, y = 0.03): THREE.Object3D {
  const group = new THREE.Group();
  group.add(cylinder(0.06, 0.07, 0.12, flat(FOOD.sack), 0, 0, 0, 10));
  group.add(scaled(sphere(0.06, flat(FOOD.sack), 0, 0.12, 0), 1, 0.4, 1));
  group.add(cylinder(0.02, 0.025, 0.04, flat(0x9c7a48), 0, 0.13, 0, 6));
  group.position.set(x, y, z);
  group.rotation.set(0, turn, (turn % 1) * 0.15);
  return group;
}

export function pithos(x: number, z: number): THREE.Object3D {
  const group = new THREE.Group();
  group.add(jar(x, -0.06, z, 1.7));
  group.add(cylinder(0.075, 0.075, 0.015, flat(COLORS.timber), x, 0.4, z, 12));
  group.add(cylinder(0.12, 0.13, 0.02, surface('earth'), x, 0.025, z, 14));
  return group;
}

export function domeOven(x: number, z: number, lit: boolean): THREE.Object3D {
  const group = new THREE.Group();
  group.add(cylinder(0.16, 0.18, 0.06, surface('rubble'), x, 0.03, z, 14));
  group.add(new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), surface('mudBrick')).translateX(x).translateY(0.09).translateZ(z));
  group.add(box(0.08, 0.07, 0.04, lit ? glowing : flat(COLORS.dark), x + 0.07, 0.09, z + 0.11).rotateY(Math.PI / 4));
  group.add(cylinder(0.02, 0.025, 0.04, surface('mudBrick'), x - 0.03, 0.22, z - 0.03, 8));
  if (lit) group.add(sphere(0.04, smoke, x - 0.02, 0.32, z - 0.05), sphere(0.055, smoke, x, 0.43, z - 0.08));
  return group;
}

export function onionString(x: number, y: number, z: number, count = 5): THREE.Object3D {
  const group = new THREE.Group();
  group.add(cylinder(0.003, 0.003, count * 0.03, flat(0x9c7a48), x, y - count * 0.03, z, 4));
  for (let i = 0; i < count; i++) group.add(sphere(0.018, flat(i % 2 ? FOOD.onion : 0xc89a64), x + (i % 2 ? 0.01 : -0.01), y - 0.02 - i * 0.03, z));
  return group;
}

export function garden(x0: number, z0: number, w: number, d: number): THREE.Object3D {
  const group = new THREE.Group();
  group.add(box(w, 0.02, d, flat(0x7a5f3c), x0 + w / 2, 0.03, z0 + d / 2));
  const rows = Math.floor(w / 0.14);
  for (let r = 0; r < rows; r++) {
    for (let p = 0; p < Math.floor(d / 0.1); p++) {
      group.add(scaled(sphere(0.03, flat(r % 2 ? FOOD.leaf : 0x8fb04a), x0 + 0.07 + r * 0.14, 0.07, z0 + 0.06 + p * 0.1), 1, 0.8, 1));
    }
  }
  return group;
}

export function figBasket(x: number, z: number): THREE.Object3D {
  const group = new THREE.Group();
  const weave = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.065, 0.08, 14, 1, true), new THREE.MeshLambertMaterial({ color: 0xb08a4a, side: THREE.DoubleSide }));
  weave.position.set(x, 0.07, z);
  group.add(weave, cylinder(0.085, 0.085, 0.02, flat(FOOD.fig), x, 0.08, z, 12));
  for (let i = 0; i < 5; i++) group.add(sphere(0.022, flat(FOOD.fig), x + Math.cos(i * 1.3) * 0.04, 0.105, z + Math.sin(i * 1.3) * 0.04));
  return group;
}

export function grainBasket(x: number, z: number): THREE.Object3D {
  const group = new THREE.Group();
  const weave = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.065, 0.08, 14, 1, true), new THREE.MeshLambertMaterial({ color: 0xb08a4a, side: THREE.DoubleSide }));
  weave.position.set(x, 0.07, z);
  group.add(weave, scaled(sphere(0.085, flat(FOOD.wheat), x, 0.09, z), 1, 0.4, 1));
  return group;
}

export function raisedGranary(x: number, z: number): THREE.Object3D {
  const group = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 4 + (i * Math.PI) / 2;
    group.add(cylinder(0.012, 0.014, 0.16, flat(COLORS.timber), x + Math.cos(a) * 0.12, 0.03, z + Math.sin(a) * 0.12, 5));
  }
  group.add(box(0.3, 0.02, 0.3, flat(0x8a6238), x, 0.19, z));
  group.add(cylinder(0.14, 0.12, 0.26, surface('thatch'), x, 0.21, z, 16));
  group.add(cone(0.2, 0.18, surface('thatch'), x, 0.46, z, 16));
  group.add(scaled(sphere(0.12, flat(FOOD.wheat), x, 0.47, z), 1, 0.25, 1));
  return group;
}

export function goat(x: number, z: number, turn: number): THREE.Object3D {
  const group = new THREE.Group();
  const coat = flat(0xe4dccb);
  const patch = flat(0x7a5a3a);
  group.add(scaled(sphere(0.07, coat, 0, 0.16, 0), 1.6, 0.9, 1));
  group.add(scaled(sphere(0.04, patch, -0.03, 0.2, 0.03), 1.4, 0.8, 1));
  for (const [lx, lz] of [[-0.07, -0.035], [0.07, -0.035], [-0.07, 0.035], [0.07, 0.035]]) group.add(cylinder(0.01, 0.01, 0.12, coat, lx, 0, lz, 4));
  group.add(scaled(sphere(0.04, coat, 0.13, 0.23, 0), 1.3, 1, 0.9));
  for (const side of [-1, 1]) {
    const horn = cone(0.01, 0.06, flat(0x5a4a3a), 0.12, 0.25, side * 0.02, 4);
    horn.rotation.z = 0.6;
    group.add(horn);
  }
  group.add(cone(0.012, 0.04, coat, 0.16, 0.16, 0, 4).rotateZ(Math.PI));
  group.position.set(x, 0.03, z);
  group.rotation.y = turn;
  return group;
}

export function hen(x: number, z: number, turn: number, color = 0xf2ece0): THREE.Object3D {
  const group = new THREE.Group();
  group.add(scaled(sphere(0.035, flat(color), 0, 0.06, 0), 1.3, 1, 1));
  group.add(sphere(0.02, flat(color), 0.04, 0.095, 0));
  group.add(cone(0.008, 0.02, flat(0xe0a030), 0.062, 0.088, 0, 4).rotateZ(-Math.PI / 2));
  group.add(box(0.02, 0.015, 0.005, flat(0xc8322a), 0.04, 0.11, 0));
  group.add(cone(0.02, 0.04, flat(color), -0.05, 0.07, 0, 5).rotateZ(0.8));
  for (const dz of [-0.01, 0.01]) group.add(cylinder(0.003, 0.003, 0.03, flat(0xe0a030), 0, 0, dz, 3));
  group.position.set(x, 0.03, z);
  group.rotation.y = turn;
  return group;
}

export function groundMat(x: number, z: number, w: number, d: number, fruit: number, turn = 0): THREE.Object3D {
  const group = new THREE.Group();
  group.add(box(w, 0.008, d, surface('thatch'), 0, 0, 0));
  const cols = Math.floor(w / 0.045);
  const rows = Math.floor(d / 0.045);
  for (let i = 0; i < cols * rows; i++) {
    if (i % 4 === 3) continue;
    group.add(scaled(sphere(0.015, flat(fruit), -w / 2 + 0.025 + (i % cols) * 0.045, 0.012, -d / 2 + 0.025 + Math.floor(i / cols) * 0.045), 1, 0.6, 1));
  }
  group.position.set(x, 0.03, z);
  group.rotation.y = turn;
  return group;
}

export function threshingFloor(x: number, z: number, radius: number): THREE.Object3D {
  const group = new THREE.Group();
  group.add(cylinder(radius, radius, 0.01, flat(0xb8a67e), x, 0.03, z, 24));
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * Math.PI * 2;
    group.add(sphere(0.025, flat(0xa89d8c), x + Math.cos(a) * radius, 0.045, z + Math.sin(a) * radius));
  }
  group.add(scaled(sphere(radius * 0.55, flat(FOOD.wheat), x - 0.04, 0.04, z + 0.03), 1, 0.18, 1));
  return group;
}

export function bowl(x: number, y: number, z: number, filling: number): THREE.Object3D {
  const group = new THREE.Group();
  group.add(cylinder(0.035, 0.022, 0.025, flat(0xb0603a), x, y, z, 10));
  group.add(cylinder(0.03, 0.03, 0.004, flat(filling), x, y + 0.022, z, 10));
  return group;
}

export function plankOnStones(x: number, z: number, turn: number, loaves: number): THREE.Object3D {
  const group = new THREE.Group();
  for (const dx of [-0.12, 0.12]) group.add(stone(0.045, dx, 0.04, 0, 400 + loaves + dx * 10));
  group.add(box(0.34, 0.02, 0.11, flat(0x8a6238), 0, 0.07, 0));
  for (let i = 0; i < loaves; i++) group.add(loaf(-0.12 + i * 0.08, 0.09, (i % 2) * 0.02 - 0.01));
  group.position.set(x, 0, z);
  group.rotation.y = turn;
  return group;
}

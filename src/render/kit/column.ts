import * as THREE from 'three';
import { COLORS, box, cone, cylinder, flat, scaled, sphere, surface } from './kit';
import { PALACE, polishedGold } from './palace';

const TILE = 1;
const SQUARE_INSET = 0.02;
export const SQUARE_TOP = 0.03;
const SLAB = 0.25;
const JOINT = 0xc4baa6;
const LAUREL = 0x3f6a2a;
const LAUREL_LIGHT = 0x5a8a3a;
const EARTH = 0x7a5a3a;
const CENTRE = TILE / 2;
const SPHINX_SCALE = 1.7;

export function pavedSquare(): THREE.Object3D {
  const group = new THREE.Group();
  const side = TILE - 2 * SQUARE_INSET;
  group.add(box(side, SQUARE_TOP, side, flat(PALACE.ground), CENTRE, 0, CENTRE));
  for (let t = SQUARE_INSET + SLAB; t < TILE - SQUARE_INSET - 0.05; t += SLAB) {
    group.add(box(0.008, 0.004, side, flat(JOINT), t, SQUARE_TOP, CENTRE));
    group.add(box(side, 0.004, 0.008, flat(JOINT), CENTRE, SQUARE_TOP, t));
  }
  return group;
}

export function squareSteps(widths: number[], rise: number): { steps: THREE.Object3D; top: number } {
  const steps = new THREE.Group();
  widths.forEach((w, i) => steps.add(box(w, rise, w, flat(PALACE.marble), CENTRE, SQUARE_TOP + i * rise, CENTRE)));
  return { steps, top: SQUARE_TOP + widths.length * rise };
}

export function roundSteps(radii: number[], rise: number): { steps: THREE.Object3D; top: number } {
  const steps = new THREE.Group();
  radii.forEach((r, i) => steps.add(cylinder(r, r, rise, flat(PALACE.marble), CENTRE, SQUARE_TOP + i * rise, CENTRE, 24)));
  return { steps, top: SQUARE_TOP + radii.length * rise };
}

export function doricShaft(base: number, height: number, radius: number): { shaft: THREE.Object3D; top: number } {
  const shaft = new THREE.Group();
  const marble = flat(PALACE.marble);
  shaft.add(cylinder(radius * 0.8, radius, height, surface("whitewash"), CENTRE, base, CENTRE, 12));
  shaft.add(cylinder(radius * 1.25, radius * 0.8, 0.05, marble, CENTRE, base + height, CENTRE, 12));
  const abacus = radius * 2.7;
  shaft.add(box(abacus, 0.045, abacus, marble, CENTRE, base + height + 0.05, CENTRE));
  return { shaft, top: base + height + 0.095 };
}

export function ionicShaft(base: number, height: number, radius: number): { shaft: THREE.Object3D; top: number } {
  const shaft = new THREE.Group();
  const marble = flat(PALACE.marble);
  shaft.add(cylinder(radius * 1.3, radius * 1.4, 0.035, marble, CENTRE, base, CENTRE, 16));
  shaft.add(cylinder(radius * 0.88, radius, height, surface("whitewash"), CENTRE, base + 0.035, CENTRE, 16));
  const neck = base + 0.035 + height;
  const span = radius * 3.2;
  shaft.add(box(span, 0.05, radius * 1.7, marble, CENTRE, neck, CENTRE));
  for (const side of [-1, 1]) {
    for (const face of [-1, 1]) {
      const volute = new THREE.Mesh(new THREE.TorusGeometry(0.032, 0.013, 6, 14), flat(COLORS.aegean));
      volute.position.set(CENTRE + side * (span / 2 - 0.02), neck + 0.015, CENTRE + face * radius * 0.85);
      shaft.add(volute);
      shaft.add(sphere(0.012, polishedGold, volute.position.x, volute.position.y, volute.position.z + face * 0.01));
    }
  }
  shaft.add(box(span * 0.82, 0.03, span * 0.82, marble, CENTRE, neck + 0.05, CENTRE));
  return { shaft, top: neck + 0.08 };
}

export function goldBand(y: number, radius: number): THREE.Mesh {
  return cylinder(radius, radius, 0.03, polishedGold, CENTRE, y, CENTRE, 16);
}

export function squareBlueBand(y: number, side: number): THREE.Mesh {
  return box(side, 0.035, side, flat(COLORS.aegean), CENTRE, y, CENTRE);
}

export function blueBand(y: number, radius: number): THREE.Mesh {
  return cylinder(radius, radius, 0.035, flat(COLORS.aegean), CENTRE, y, CENTRE, 16);
}

export function sphinx(base: number): THREE.Object3D {
  const group = new THREE.Group();
  const marble = flat(PALACE.marble);
  group.add(box(0.07, 0.07, 0.17, marble, 0, 0, -0.02));
  for (const side of [-1, 1]) group.add(box(0.022, 0.08, 0.025, marble, side * 0.025, 0, 0.07));
  group.add(box(0.06, 0.09, 0.05, marble, 0, 0.06, 0.06));
  group.add(sphere(0.035, marble, 0, 0.19, 0.075));
  group.add(box(0.072, 0.05, 0.03, flat(COLORS.deepAegean), 0, 0.165, 0.055));
  group.add(cylinder(0.04, 0.038, 0.02, flat(COLORS.aegean), 0, 0.215, 0.07, 10));
  for (const side of [-1, 1]) {
    const wing = box(0.016, 0.2, 0.15, polishedGold, side * 0.05, 0.05, -0.04);
    wing.rotation.x = -0.8;
    wing.rotation.z = side * -0.4;
    group.add(wing);
  }
  const tail = cylinder(0.008, 0.008, 0.12, marble, 0, 0.02, -0.12, 5);
  tail.rotation.x = -0.6;
  group.add(tail);
  group.position.set(CENTRE, base, CENTRE);
  group.rotation.y = Math.PI / 4;
  group.scale.setScalar(SPHINX_SCALE);
  return group;
}

export function goldEagle(base: number): THREE.Object3D {
  const group = new THREE.Group();
  group.add(sphere(0.035, polishedGold, 0, 0.02, 0));
  group.add(scaled(sphere(0.045, polishedGold, 0, 0.07, 0), 0.8, 1.3, 0.8));
  group.add(sphere(0.026, polishedGold, 0, 0.14, 0.02));
  group.add(cone(0.012, 0.035, flat(PALACE.gold), 0, 0.13, 0.05, 6).rotateX(Math.PI / 2));
  for (const side of [-1, 1]) {
    const wing = box(0.16, 0.015, 0.07, polishedGold, side * 0.09, 0.08, -0.01);
    wing.rotation.z = side * 0.6;
    group.add(wing);
    const tip = box(0.08, 0.012, 0.05, polishedGold, side * 0.19, 0.17, -0.01);
    tip.rotation.z = side * 1.05;
    group.add(tip);
  }
  group.position.set(CENTRE, base, CENTRE);
  return group;
}

export function laurelRing(base: number, radius: number, count: number): THREE.Object3D {
  const group = new THREE.Group();
  group.add(cylinder(radius + 0.06, radius + 0.06, 0.07, flat(PALACE.marble), CENTRE, base, CENTRE, 24));
  group.add(blueBand(base + 0.02, radius + 0.062));
  group.add(cylinder(radius + 0.04, radius + 0.04, 0.072, flat(EARTH), CENTRE, base, CENTRE, 24));
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const color = i % 2 ? LAUREL : LAUREL_LIGHT;
    group.add(scaled(sphere(0.06, flat(color), CENTRE + Math.cos(a) * radius, base + 0.12, CENTRE + Math.sin(a) * radius), 1, 1.3, 1));
  }
  return group;
}

export function victoryWreath(y: number, radius: number): THREE.Object3D {
  const group = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.014, 6, 20), polishedGold);
  ring.rotation.x = Math.PI / 2;
  ring.position.set(CENTRE, y, CENTRE);
  group.add(ring);
  for (const side of [-1, 1]) {
    const ribbon = box(0.018, 0.12, 0.006, flat(COLORS.aegean), CENTRE + side * 0.02, y - 0.12, CENTRE + radius + 0.005);
    ribbon.rotation.z = side * 0.15;
    group.add(ribbon);
  }
  return group;
}

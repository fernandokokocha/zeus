import * as THREE from 'three';
import { PALETTE } from '../palette';
import { type Animate, type FigureParts, at, head, legs, torso } from './figure';
import { COLORS, box, cylinder, flat, sphere, surface } from './kit';
import { PALACE, polishedGold, tympanum } from './palace';
import { water } from './water';

export const FOUNTAIN = {
  dryFloor: 0xb9ab90,
  damp: 0x8f8670,
  grout: 0xf4f6f8,
  rim: 0xe9e4d8,
};

const BASE = 0.03;
const RIM = 0.05;
const TILE = 0.1;
const TILE_GAP = 0.012;
const STREAM_RADIUS = 0.016;
const RIPPLE_SPEED = 0.7;
const RIPPLE_GROWTH = 2.2;
const RIPPLES_PER_SPLASH = 2;

export const fallingWater = new THREE.MeshLambertMaterial({ color: 0x9fd0f5, emissive: 0x24507a });
const foam = new THREE.MeshBasicMaterial({ color: 0xe6f4ff, transparent: true, opacity: 0.75, side: THREE.DoubleSide });
const RIPPLE = new THREE.RingGeometry(0.03, 0.045, 18).rotateX(-Math.PI / 2);

const CARRIER_JAR = new THREE.LatheGeometry(
  [[0, 0], [0.04, 0.01], [0.065, 0.06], [0.06, 0.11], [0.03, 0.15], [0.04, 0.17]].map(([r, y]) => new THREE.Vector2(r, y)),
  12,
);

export function carrierJar(x: number, y: number, z: number, tiltX = 0, tiltZ = 0): THREE.Mesh {
  const mesh = new THREE.Mesh(CARRIER_JAR, flat(PALETTE.carrierJar));
  mesh.position.set(x, y, z);
  mesh.rotation.set(tiltX, 0, tiltZ);
  return mesh;
}

export type CarrierPose = 'shoulder' | 'filling';

export function waterCarrier(pose: CarrierPose): FigureParts {
  if (pose === 'shoulder') {
    const upper = torso(PALETTE.carrierTunic, [at(0.02, 0.27, 0.08), at(0.01, -0.03, -0.09)]);
    upper.add(carrierJar(0, 0.19, 0.1, 0.35));
    return { legs: legs(), torso: upper, head: head('bare') };
  }
  const upper = torso(PALETTE.carrierTunic, [at(0.13, 0.0, 0.05), at(0.13, 0.0, -0.05)]);
  upper.add(carrierJar(0.12, -0.08, 0, 0, -0.9));
  return { legs: legs(), torso: upper, head: head('bare') };
}

export function stream(from: THREE.Vector3, to: THREE.Vector3): THREE.Mesh {
  const bend = new THREE.Vector3(to.x, from.y, to.z).lerp(from, 0.55);
  const curve = new THREE.QuadraticBezierCurve3(from, bend, to);
  return new THREE.Mesh(new THREE.TubeGeometry(curve, 10, STREAM_RADIUS, 6), fallingWater);
}

export function ripples(spots: THREE.Vector3[], phase: number): THREE.Object3D {
  const group = new THREE.Group();
  const rings: THREE.Mesh[] = [];
  spots.forEach((spot, i) => {
    for (let r = 0; r < RIPPLES_PER_SPLASH; r++) {
      const ring = new THREE.Mesh(RIPPLE, foam);
      ring.position.copy(spot);
      ring.userData.offset = r / RIPPLES_PER_SPLASH + i * 0.37;
      rings.push(ring);
      group.add(ring);
    }
  });
  const animate: Animate = (seconds) => {
    for (const ring of rings) {
      const age = (((seconds + phase) * RIPPLE_SPEED + ring.userData.offset) % 1 + 1) % 1;
      ring.scale.setScalar(1 + age * RIPPLE_GROWTH);
    }
  };
  group.userData.animate = animate;
  return group;
}

function poolFloor(full: boolean): THREE.Material {
  return full ? water : flat(FOUNTAIN.dryFloor);
}

export function squarePool(x0: number, z0: number, w: number, d: number, height: number, full: boolean): THREE.Object3D {
  const group = new THREE.Group();
  const marble = flat(FOUNTAIN.rim);
  const [cx, cz] = [x0 + w / 2, z0 + d / 2];
  group.add(box(w - 2 * RIM, 0.01, d - 2 * RIM, flat(FOUNTAIN.damp), cx, BASE, cz));
  for (const z of [z0 + RIM / 2, z0 + d - RIM / 2]) group.add(box(w, height, RIM, marble, cx, BASE, z));
  for (const x of [x0 + RIM / 2, x0 + w - RIM / 2]) group.add(box(RIM, height, d - 2 * RIM, marble, x, BASE, cz));
  group.add(box(w - 2 * RIM, 0.006, d - 2 * RIM, poolFloor(full), cx, full ? BASE + height - 0.035 : BASE + 0.012, cz));
  return group;
}

export function roundPool(x: number, z: number, radius: number, height: number, full: boolean, y = BASE): THREE.Object3D {
  const group = new THREE.Group();
  const inner = radius - RIM;
  const floor = 0.02;
  const profile = [[0, floor], [inner, floor], [inner, height], [radius + 0.025, height], [radius + 0.025, height - 0.025], [radius, height - 0.025], [radius + 0.02, 0]];
  const basin = new THREE.Mesh(new THREE.LatheGeometry(profile.map(([r, h]) => new THREE.Vector2(r, h)).reverse(), 32), flat(FOUNTAIN.rim));
  basin.position.set(x, y, z);
  group.add(basin);
  const level = full ? height - 0.03 : floor + 0.004;
  group.add(cylinder(inner, inner, 0.004, poolFloor(full), x, y + level, z, 32));
  return group;
}

export function lionSpout(x: number, y: number, z: number): THREE.Object3D {
  const group = new THREE.Group();
  const mane = cylinder(0.065, 0.065, 0.025, polishedGold, 0, 0, 0, 14);
  mane.rotation.x = Math.PI / 2;
  group.add(mane);
  group.add(sphere(0.04, polishedGold, 0, -0.005, 0.03));
  group.add(box(0.035, 0.03, 0.04, polishedGold, 0, -0.035, 0.06));
  for (const side of [-1, 1]) group.add(sphere(0.008, flat(COLORS.dark), side * 0.016, 0.01, 0.065));
  group.position.set(x, y, z);
  return group;
}

export function spoutPipe(x: number, y: number, z: number, length: number): THREE.Object3D {
  const group = new THREE.Group();
  const pipe = cylinder(0.018, 0.022, length, flat(PALACE.bronze), 0, -length / 2, 0, 8);
  pipe.rotation.x = Math.PI / 2;
  group.add(pipe);
  const plate = cylinder(0.05, 0.05, 0.015, flat(PALACE.marble), 0, 0, 0, 12);
  plate.rotation.x = Math.PI / 2;
  plate.position.z = -length / 2;
  group.add(plate);
  group.position.set(x, y, z + length / 2);
  return group;
}

export function tilePanel(x0: number, x1: number, y0: number, y1: number, z: number): THREE.Object3D {
  const group = new THREE.Group();
  group.add(box(x1 - x0, y1 - y0, 0.01, flat(FOUNTAIN.grout), (x0 + x1) / 2, y0, z));
  const cols = Math.round((x1 - x0) / TILE);
  const rows = Math.round((y1 - y0) / TILE);
  const [tw, th] = [(x1 - x0) / cols, (y1 - y0) / rows];
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const color = (c + r) % 2 ? COLORS.aegean : COLORS.deepAegean;
      group.add(box(tw - TILE_GAP, th - TILE_GAP, 0.012, flat(color), x0 + (c + 0.5) * tw, y0 + r * th + TILE_GAP / 2, z + 0.004));
    }
  }
  return group;
}

export function poseidon(x: number, y: number, z: number): THREE.Object3D {
  const group = new THREE.Group();
  const marble = surface('whitewash');
  group.add(cylinder(0.05, 0.07, 0.24, marble, 0, 0, 0, 10));
  group.add(cylinder(0.075, 0.055, 0.08, marble, 0, 0.22, 0, 10));
  group.add(sphere(0.04, marble, 0, 0.35, 0));
  group.add(cylinder(0.007, 0.007, 0.42, polishedGold, 0.09, 0.02, 0, 6));
  group.add(box(0.07, 0.012, 0.012, polishedGold, 0.09, 0.42, 0));
  for (const dx of [-0.03, 0, 0.03]) group.add(prong(0.09 + dx, 0.43));
  group.position.set(x, y, z);
  return group;
}

function prong(x: number, y: number): THREE.Mesh {
  return cylinder(0.001, 0.009, 0.05, polishedGold, x, y, 0, 6);
}

export function wallPediment(x: number, base: number, back: number, front: number, span: number, rise: number): THREE.Object3D {
  const group = new THREE.Group();
  const shape = new THREE.Shape([new THREE.Vector2(-span / 2, 0), new THREE.Vector2(span / 2, 0), new THREE.Vector2(0, rise)]);
  const gable = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: front - back, bevelEnabled: false }), surface('whitewash'));
  gable.position.set(x, base, back);
  group.add(gable);
  group.add(tympanum(x, front, span, rise, base - 0.04));
  return group;
}

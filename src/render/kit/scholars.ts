import * as THREE from 'three';
import { COLORS, box, flat, surface } from './kit';
import { PALACE, marbleColumn } from './palace';

const BASE = 0.03;
const EXEDRA_FLOOR = 0.06;
const SEAT = { height: 0.13, depth: 0.14 };
export const EXEDRA_SEAT_TOP = BASE + EXEDRA_FLOOR + SEAT.height;

function radial(group: THREE.Group, angle: number, part: THREE.Object3D): void {
  const spoke = new THREE.Group();
  spoke.rotation.y = -angle;
  spoke.add(part);
  group.add(spoke);
}

function halfDisc(radius: number, height: number, material: THREE.Material, y: number): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 24, 1, false, Math.PI / 2, Math.PI), material);
  mesh.position.y = y + height / 2;
  return mesh;
}

export function exedraSeatRadius(radius: number, depth: number): number {
  return radius + depth - 0.04 - SEAT.depth / 2;
}

export function exedra(radius: number, depth: number, height: number, columns: number): THREE.Object3D {
  const group = new THREE.Group();
  const outer = radius + depth;
  group.add(halfDisc(outer + 0.08, EXEDRA_FLOOR, flat(PALACE.marble), BASE));
  const floor = BASE + EXEDRA_FLOOR;
  const segments = 9;
  const step = Math.PI / segments;
  const chord = 2 * outer * Math.sin(step / 2) + 0.02;
  const wallTop = floor + height + 0.18;
  const slope = Math.hypot(depth + 0.1, wallTop - (floor + height));
  const pitch = Math.atan2(wallTop - (floor + height), depth + 0.1);
  for (let i = 0; i < segments; i++) {
    const angle = Math.PI + (i + 0.5) * step;
    const segment = new THREE.Group();
    segment.add(box(0.08, wallTop - floor, chord, surface('whitewash'), outer, floor, 0));
    segment.add(box(0.1, 0.05, chord + 0.01, flat(COLORS.aegean), outer, wallTop - 0.14, 0));
    segment.add(box(SEAT.depth, SEAT.height - 0.02, chord * ((outer - 0.12) / outer), surface('rubble'), exedraSeatRadius(radius, depth), floor, 0));
    segment.add(box(SEAT.depth + 0.02, 0.02, chord * ((outer - 0.12) / outer), flat(PALACE.marble), exedraSeatRadius(radius, depth), floor + SEAT.height - 0.02, 0));
    const roof = box(slope, 0.03, chord + 0.04, surface('blueTiles'), 0, -0.015, 0);
    roof.rotation.z = pitch;
    roof.position.set(radius + depth / 2 - 0.02, (floor + height + wallTop) / 2 + 0.02, 0);
    segment.add(roof);
    radial(group, angle, segment);
  }
  for (let i = 0; i < columns; i++) {
    const angle = Math.PI + (i * Math.PI) / (columns - 1);
    group.add(marbleColumn(Math.cos(angle) * radius, Math.sin(angle) * radius, height, floor));
  }
  const beam = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.05, 6, 24, Math.PI), surface('whitewash'));
  beam.rotation.x = -Math.PI / 2;
  beam.position.y = floor + height;
  group.add(beam);
  return group;
}


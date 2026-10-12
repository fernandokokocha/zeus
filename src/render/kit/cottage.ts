import * as THREE from 'three';
import { COLORS, type Surface, box, cylinder, flat, log, scaled, sphere, stone, surface } from './kit';

const PLINTH = 0.09;
const BEAM_SPACING = 0.21;

export function doorway(width: number, height: number, ajar: number): THREE.Object3D {
  const group = new THREE.Group();
  group.add(box(width, height, 0.05, flat(COLORS.dark), 0, 0, 0));
  const leaf = box(width * 0.9, height * 0.95, 0.018, surface('planks'), width * 0.45, 0, 0);
  const hinge = new THREE.Group();
  hinge.position.set(-width / 2, 0, 0.03);
  leaf.position.x = width * 0.45;
  hinge.add(leaf);
  hinge.rotation.y = -ajar;
  group.add(hinge);
  group.add(box(width + 0.1, 0.04, 0.08, flat(COLORS.timber), 0, height, 0));
  return group;
}

export function cube(x0: number, z0: number, w: number, d: number, wallTop: number, base = 0.03, plinth = true): THREE.Object3D {
  const group = new THREE.Group();
  const cx = x0 + w / 2;
  const cz = z0 + d / 2;
  const front = z0 + d;
  const right = x0 + w;
  const wallBase = plinth ? base + PLINTH : base;
  if (plinth) group.add(box(w + 0.05, PLINTH, d + 0.05, surface('rubble'), cx, base, cz));
  group.add(box(w, wallTop - wallBase, d, surface('whitewash'), cx, wallBase, cz));
  group.add(box(w + 0.06, 0.04, d + 0.06, surface('whitewash'), cx, wallTop, cz));
  group.add(box(w - 0.08, 0.015, d - 0.08, surface('earth'), cx, wallTop + 0.04, cz));
  for (const [pw, pd, px, pz] of [[w + 0.06, 0.04, cx, z0 - 0.01], [w + 0.06, 0.04, cx, front + 0.01], [0.04, d + 0.06, x0 - 0.01, cz], [0.04, d + 0.06, right + 0.01, cz]]) {
    group.add(box(pw, 0.045, pd, surface('whitewash'), px, wallTop + 0.04, pz));
  }
  const beams = Math.round((w - 0.24) / BEAM_SPACING) + 1;
  for (let i = 0; i < beams; i++) {
    const beam = cylinder(0.016, 0.016, 0.07, flat(COLORS.timber), x0 + 0.12 + i * BEAM_SPACING, 0, front + 0.03, 6);
    beam.rotation.x = Math.PI / 2;
    beam.position.y = wallTop - 0.025;
    group.add(beam);
  }
  return group;
}

export function blueDoor(x: number, front: number, base = 0.1, ajar = 0.6): THREE.Object3D {
  const group = new THREE.Group();
  const door = doorway(0.2, 0.32, ajar);
  door.position.set(x, base, front + 0.005);
  group.add(door);
  for (const side of [-1, 1]) group.add(box(0.03, 0.36, 0.02, flat(COLORS.deepAegean), x + side * 0.125, base, front + 0.01));
  group.add(box(0.28, 0.035, 0.02, flat(COLORS.deepAegean), x, base + 0.34, front + 0.01));
  return group;
}

export function frontWindow(x: number, front: number, sill = 0.32): THREE.Object3D {
  const group = new THREE.Group();
  group.add(box(0.12, 0.12, 0.02, flat(COLORS.dark), x, sill, front + 0.005));
  for (const side of [-1, 1]) {
    const shutter = box(0.065, 0.12, 0.012, surface('planks'), 0, 0, 0);
    shutter.position.set(x + side * 0.095, sill + 0.06, front + 0.03);
    shutter.rotation.y = side * 0.7;
    group.add(shutter);
  }
  return group;
}

export function sideWindow(right: number, z: number, sill = 0.34): THREE.Object3D {
  const group = new THREE.Group();
  group.add(box(0.02, 0.1, 0.1, flat(COLORS.dark), right + 0.005, sill, z));
  group.add(box(0.012, 0.1, 0.11, surface('planks'), right + 0.02, sill, z + 0.07).rotateY(0.6));
  return group;
}

export function stoneWall(x0: number, z0: number, x1: number, z1: number, height: number): THREE.Object3D {
  const group = new THREE.Group();
  const length = Math.hypot(x1 - x0, z1 - z0);
  const turn = -Math.atan2(z1 - z0, x1 - x0);
  group.add(box(length, height, 0.1, surface('rubble'), (x0 + x1) / 2, 0.03, (z0 + z1) / 2).rotateY(turn));
  group.add(box(length + 0.02, 0.025, 0.12, surface('whitewash'), (x0 + x1) / 2, 0.03 + height, (z0 + z1) / 2).rotateY(turn));
  return group;
}

export function gatePost(x: number, z: number): THREE.Mesh {
  return box(0.1, 0.22, 0.12, surface('whitewash'), x, 0.03, z);
}

export function steppingStones(spots: [number, number][], seed: number): THREE.Object3D {
  const group = new THREE.Group();
  spots.forEach(([x, z], i) => group.add(scaled(stone(0.07, x, 0.03, z, seed + i, 0xc9c0ae), 1.2, 0.35, 1)));
  return group;
}

export function pergola(x0: number, x1: number, z0: number, z1: number, leaves: (i: number) => number, height = 0.42): THREE.Object3D {
  const group = new THREE.Group();
  for (const [x, z] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1]]) group.add(cylinder(0.018, 0.022, height, flat(COLORS.timber), x, 0.03, z, 6));
  for (const z of [z0, z1]) group.add(log(x1 - x0 + 0.06, 0.016, (x0 + x1) / 2, height + 0.01, z, 0));
  const slats = Math.round((x1 - x0) / 0.1) + 1;
  for (let i = 0; i < slats; i++) group.add(log(z1 - z0 + 0.08, 0.01, x0 + 0.03 + i * 0.1, height + 0.04, (z0 + z1) / 2, Math.PI / 2));
  const across = Math.floor((x1 - x0) / 0.2) + 1;
  const along = Math.floor((z1 - z0) / 0.25) + 1;
  for (let i = 0; i < across * along; i++) {
    group.add(sphere(0.06, flat(leaves(i)), x0 + 0.05 + (i % across) * 0.2 + (i % 2) * 0.05, height + 0.08, z0 + 0.1 + Math.floor(i / across) * 0.25));
  }
  return group;
}

export const brushwood = (i: number) => (i % 3 ? 0x7d8f45 : 0x9a8a50);

export function poorCube(x0: number, z0: number, w: number, d: number, wallTop: number, walls: Surface = 'patchyWhitewash'): THREE.Object3D {
  const group = new THREE.Group();
  const cx = x0 + w / 2;
  const cz = z0 + d / 2;
  const front = z0 + d;
  const right = x0 + w;
  group.add(box(w + 0.04, 0.05, d + 0.04, surface('rubble'), cx, 0.03, cz));
  group.add(box(w, wallTop - 0.08, d, surface(walls), cx, 0.08, cz));
  for (const [i, x] of [x0 + 0.1, x0 + 0.3, x0 + 0.5, x0 + 0.7, x0 + 0.9].filter((x) => x < right - 0.05).entries()) {
    group.add(log(0.08, 0.014, x, wallTop - 0.03 + (i % 2) * 0.006, front + 0.02, Math.PI / 2));
  }
  for (const z of [z0 + 0.15, z0 + 0.4, z0 + 0.65].filter((z) => z < front - 0.05)) group.add(log(0.08, 0.014, right + 0.02, wallTop - 0.03, z, 0));
  group.add(box(w + 0.1, 0.025, d + 0.1, flat(0x8a7a5a), cx, wallTop, cz));
  const reeds = box(w + 0.14, 0.035, d + 0.14, surface('thatch'), cx, wallTop + 0.02, cz);
  reeds.rotation.z = 0.02;
  group.add(reeds);
  for (const [i, [sx, sz]] of [[0.2, 0.2], [0.75, 0.3], [0.4, 0.7], [0.9, 0.75]].entries()) {
    group.add(stone(0.035, x0 + sx * w, wallTop + 0.07, z0 + sz * d, 300 + i));
  }
  return group;
}

export function roughWall(points: [number, number][], seed: number, height = 0.12): THREE.Object3D {
  const group = new THREE.Group();
  let n = seed;
  for (let i = 0; i < points.length - 1; i++) {
    const [ax, az] = points[i];
    const [bx, bz] = points[i + 1];
    const length = Math.hypot(bx - ax, bz - az);
    const count = Math.round(length / 0.09);
    for (let s = 0; s <= count; s++) {
      const t = s / count;
      const x = ax + (bx - ax) * t;
      const z = az + (bz - az) * t;
      group.add(stone(0.05, x, 0.06, z, n++));
      if (s % 2 === 0) group.add(stone(0.042, x + 0.02, 0.06 + height * 0.6, z, n++));
    }
  }
  return group;
}

export function windowHole(x: number, front: number, sill: number): THREE.Mesh {
  return box(0.1, 0.09, 0.02, flat(COLORS.dark), x, sill, front + 0.005);
}

export function tidyWalls(gateFrom: number, gateTo: number, sideFrom: number): THREE.Object3D {
  const group = new THREE.Group();
  group.add(stoneWall(0.12, 1.88, gateFrom, 1.88, 0.14));
  group.add(stoneWall(gateTo, 1.88, 1.88, 1.88, 0.14));
  group.add(stoneWall(1.88, sideFrom, 1.88, 1.88, 0.14));
  group.add(gatePost(gateFrom, 1.88), gatePost(gateTo, 1.88));
  return group;
}

export function whiteCottage(x0: number, z0: number, w: number, d: number, doorX: number, windowX: number): THREE.Object3D {
  const group = new THREE.Group();
  const front = z0 + d;
  group.add(poorCube(x0, z0, w, d, 0.52, 'whitewash'));
  group.add(blueDoor(x0 + doorX, front, 0.08, 0.5));
  group.add(windowHole(x0 + windowX, front, 0.3));
  return group;
}

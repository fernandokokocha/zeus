import * as THREE from 'three';
import { COLORS, type Surface, TEXTURE_WORLD_SIZE, box, cylinder, flat, log, surface } from './kit';

export function tiledRoof(x0: number, z0: number, w: number, d: number, eaves: number, rise: number, roofing: Surface = 'tiles'): THREE.Object3D {
  const group = new THREE.Group();
  const half = d / 2;
  const gable = new THREE.Shape([new THREE.Vector2(-half, 0), new THREE.Vector2(half, 0), new THREE.Vector2(0, rise)]);
  const body = new THREE.Mesh(new THREE.ExtrudeGeometry(gable, { depth: w, bevelEnabled: false }), surface('whitewash'));
  body.rotation.y = Math.PI / 2;
  body.position.set(x0, eaves, z0 + half);
  group.add(body);
  const slope = Math.hypot(half, rise) + 0.08;
  const pitch = Math.atan2(rise, half);
  for (const side of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.add(box(w + 0.12, 0.03, slope, surface(roofing), 0, -0.015, 0));
    pivot.position.set(x0 + w / 2, eaves + rise / 2 + 0.02, z0 + half + (side * half) / 2);
    pivot.rotation.x = side * pitch;
    group.add(pivot);
  }
  group.add(log(w + 0.14, 0.025, x0 + w / 2, eaves + rise - 0.005, z0 + half, 0));
  return group;
}

function turnedToZ(x0: number, z0: number, w: number, d: number, build: (x0: number, z0: number, w: number, d: number) => THREE.Object3D): THREE.Object3D {
  const pivot = new THREE.Group();
  pivot.add(build(-d / 2, -w / 2, d, w));
  pivot.rotation.y = Math.PI / 2;
  pivot.position.set(x0 + w / 2, 0, z0 + d / 2);
  return pivot;
}

export function tiledRoofAlongZ(x0: number, z0: number, w: number, d: number, eaves: number, rise: number, roofing: Surface = 'tiles'): THREE.Object3D {
  return turnedToZ(x0, z0, w, d, (a, b, c, e) => tiledRoof(a, b, c, e, eaves, rise, roofing));
}

export function barrelVault(x0: number, z0: number, w: number, d: number, eaves: number): THREE.Object3D {
  const group = new THREE.Group();
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(d / 2, d / 2, w + 0.06, 18, 1, false, 0, Math.PI).rotateZ(Math.PI / 2), flat(COLORS.aegean));
  shell.position.set(x0 + w / 2, eaves, z0 + d / 2);
  group.add(shell);
  group.add(box(w + 0.08, 0.04, d + 0.06, surface('whitewash'), x0 + w / 2, eaves - 0.04, z0 + d / 2));
  return group;
}

export function barrelVaultAlongZ(x0: number, z0: number, w: number, d: number, eaves: number): THREE.Object3D {
  return turnedToZ(x0, z0, w, d, (a, b, c, e) => barrelVault(a, b, c, e, eaves));
}

export function dome(x: number, z: number, radius: number, base: number): THREE.Object3D {
  const group = new THREE.Group();
  group.add(cylinder(radius, radius, 0.12, surface('whitewash'), x, base, z, 20));
  group.add(new THREE.Mesh(new THREE.SphereGeometry(radius, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), flat(COLORS.aegean)).translateX(x).translateY(base + 0.12).translateZ(z));
  group.add(cylinder(0.012, 0.02, 0.08, surface('whitewash'), x, base + 0.12 + radius - 0.01, z, 6));
  return group;
}

type Corner = [number, number, number];

function sloped(faces: Corner[][], roofing: Surface): THREE.Mesh {
  const positions: number[] = [];
  const uvs: number[] = [];
  for (const face of faces) {
    const [a, b, c] = face.map((p) => new THREE.Vector3(...p));
    const upward = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).y > 0;
    const ordered = upward ? face : [...face].reverse();
    const runsAlongX = Math.abs(ordered[1][0] - ordered[0][0]) >= Math.abs(ordered[1][2] - ordered[0][2]);
    for (let i = 1; i < ordered.length - 1; i++) {
      for (const [x, y, z] of [ordered[0], ordered[i], ordered[i + 1]]) {
        positions.push(x, y, z);
        uvs.push((runsAlongX ? x : z) / TEXTURE_WORLD_SIZE, ((runsAlongX ? z : x) + y) / TEXTURE_WORLD_SIZE);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.computeVertexNormals();
  return new THREE.Mesh(geometry, surface(roofing));
}

const OVERHANG = 0.06;

export function hipRoof(x0: number, z0: number, w: number, d: number, eaves: number, rise: number, roofing: Surface): THREE.Object3D {
  const group = new THREE.Group();
  const [ax, az, bx, bz] = [x0 - OVERHANG, z0 - OVERHANG, x0 + w + OVERHANG, z0 + d + OVERHANG];
  const inset = (bz - az) / 2;
  const zc = (az + bz) / 2;
  const top = eaves + rise;
  const r1: Corner = [ax + inset, top, zc];
  const r2: Corner = [bx - inset, top, zc];
  group.add(sloped([
    [[ax, eaves, bz], [bx, eaves, bz], r2, r1],
    [[bx, eaves, az], [ax, eaves, az], r1, r2],
    [[ax, eaves, az], [ax, eaves, bz], r1],
    [[bx, eaves, bz], [bx, eaves, az], r2],
  ], roofing));
  if (r2[0] > r1[0]) group.add(box(r2[0] - r1[0] + 0.04, 0.035, 0.05, surface('whitewash'), (r1[0] + r2[0]) / 2, top - 0.02, zc));
  return group;
}

export function hipRoofAlongZ(x0: number, z0: number, w: number, d: number, eaves: number, rise: number, roofing: Surface): THREE.Object3D {
  return turnedToZ(x0, z0, w, d, (a, b, c, e) => hipRoof(a, b, c, e, eaves, rise, roofing));
}

export type Fall = 'north' | 'south' | 'east' | 'west';

export function leanToRoof(x0: number, z0: number, x1: number, z1: number, low: number, high: number, fall: Fall, roofing: Surface = 'blueTiles'): THREE.Object3D {
  const [ax, az, bx, bz] = [x0 - OVERHANG / 2, z0 - OVERHANG / 2, x1 + OVERHANG / 2, z1 + OVERHANG / 2];
  const height = (x: number, z: number): number => {
    const onLowEdge = { north: z === az, south: z === bz, east: x === bx, west: x === ax }[fall];
    return onLowEdge ? low : high;
  };
  const corner = (x: number, z: number): Corner => [x, height(x, z), z];
  return sloped([[corner(ax, az), corner(bx, az), corner(bx, bz), corner(ax, bz)]], roofing);
}

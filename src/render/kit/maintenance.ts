import * as THREE from 'three';
import { type FigureParts, at, head, legs, torso } from './figure';
import { COLORS, box, flat } from './kit';

export const MAINTENANCE = {
  tunic: 0x1d4e8c,
  plank: 0xa07a4a,
  rope: 0xc8b48a,
  linen: 0xeadcb0,
  glaze: 0x27486f,
};

export function ladder(x: number, z: number, height: number, lean: number, turn: number): THREE.Object3D {
  const pivot = new THREE.Group();
  for (const side of [-0.07, 0.07]) pivot.add(box(0.025, height, 0.025, flat(COLORS.timber), side, 0, 0));
  for (let y = 0.1; y < height; y += 0.12) pivot.add(box(0.14, 0.02, 0.02, flat(COLORS.timber), 0, y, 0));
  pivot.rotation.x = -lean;
  const group = new THREE.Group();
  group.add(pivot);
  group.position.set(x, 0.03, z);
  group.rotation.y = turn;
  return group;
}

export function lookout(): FigureParts {
  return { legs: legs(), torso: torso(MAINTENANCE.tunic, [at(0.07, 0.28, 0.03), at(0.03, 0.04, -0.095)]), head: head('pilos') };
}

const sailcloth = new THREE.MeshLambertMaterial({ color: MAINTENANCE.linen, side: THREE.DoubleSide });

export function sailShade(corners: [THREE.Vector3, THREE.Vector3, THREE.Vector3, THREE.Vector3], sag: number): THREE.Mesh {
  const [a, b, c, d] = corners;
  const geometry = new THREE.PlaneGeometry(1, 1, 6, 6);
  const positions = geometry.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const u = positions.getX(i) + 0.5;
    const v = positions.getY(i) + 0.5;
    const near = a.clone().lerp(b, u);
    const far = d.clone().lerp(c, u);
    const point = near.lerp(far, v);
    point.y -= sag * Math.sin(Math.PI * u) * Math.sin(Math.PI * v);
    positions.setXYZ(i, point.x, point.y, point.z);
  }
  geometry.computeVertexNormals();
  return new THREE.Mesh(geometry, sailcloth);
}

export function pole(from: THREE.Vector3, to: THREE.Vector3, radius = 0.014, color = COLORS.timber): THREE.Mesh {
  const along = to.clone().sub(from);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, along.length(), 6), flat(color));
  mesh.position.copy(from).addScaledVector(along, 0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), along.normalize());
  return mesh;
}

function lashing(at: THREE.Vector3): THREE.Mesh {
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.026, 0.008, 4, 8), flat(MAINTENANCE.rope));
  ring.rotation.x = Math.PI / 2;
  ring.position.copy(at);
  return ring;
}

export function plankDeck(cx: number, y: number, cz: number, size: number): THREE.Object3D {
  const group = new THREE.Group();
  const planks = 5;
  const width = size / planks;
  for (let i = 0; i < planks; i++) {
    const shade = i % 2 ? MAINTENANCE.plank : COLORS.timber;
    group.add(box(width - 0.012, 0.035, size + (i % 2) * 0.05, flat(shade), cx - size / 2 + width * (i + 0.5), y, cz));
  }
  return group;
}

export function lashedStand(cx: number, cz: number, base: number, top: number, height: number): THREE.Object3D {
  const group = new THREE.Group();
  const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  const legAt = (i: number, y: number) => {
    const t = y / (height + 0.3);
    const span = (base + (top - base) * t) / 2;
    return new THREE.Vector3(cx + corners[i][0] * span, y, cz + corners[i][1] * span);
  };
  for (let i = 0; i < 4; i++) group.add(pole(legAt(i, 0.03), legAt(i, height + 0.3), 0.022));
  for (const [i, j] of [[1, 2], [2, 3], [0, 1], [3, 0]]) {
    for (const [low, high] of [[0.08, height * 0.5], [height * 0.5, height - 0.04]]) {
      group.add(pole(legAt(i, low), legAt(j, high), 0.011), pole(legAt(j, low), legAt(i, high), 0.011));
    }
    group.add(pole(legAt(i, height + 0.24), legAt(j, height + 0.24), 0.012));
  }
  for (let i = 0; i < 4; i++) group.add(lashing(legAt(i, height * 0.5)), lashing(legAt(i, height + 0.24)));
  group.add(plankDeck(cx, height, cz, top + 0.12));
  return group;
}


import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { PALETTE } from '../palette';

export const FIGURE_SCALE = 1.7;

export interface Part {
  geometry: THREE.BufferGeometry;
  color: number;
}

export function body(tunic: number): Part[] {
  return [
    { geometry: new THREE.CylinderGeometry(0.06, 0.09, 0.26, 8).translate(0, 0.13, 0), color: tunic },
    { geometry: new THREE.SphereGeometry(0.06, 10, 8).translate(0, 0.32, 0), color: PALETTE.skin },
  ];
}

export const jar = new THREE.LatheGeometry(
  [[0, 0], [0.04, 0.01], [0.065, 0.06], [0.06, 0.11], [0.03, 0.15], [0.04, 0.17]].map(([r, y]) => new THREE.Vector2(r, y)),
  10,
);

export function cart(load: Part[]): Part[] {
  return [
    ...body(PALETTE.cartTunic),
    { geometry: new THREE.BoxGeometry(0.2, 0.08, 0.24).translate(0, 0.1, 0.22), color: PALETTE.trunk },
    { geometry: new THREE.CylinderGeometry(0.06, 0.06, 0.26, 10).rotateZ(Math.PI / 2).translate(0, 0.06, 0.24), color: PALETTE.doorway },
    ...load,
  ];
}

export function figureModel(parts: Part[]): THREE.Group {
  const group = new THREE.Group();
  for (const { geometry, color } of parts) group.add(new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({ color })));
  group.scale.setScalar(FIGURE_SCALE);
  return group;
}

export function mergedByColour(parts: Part[]): Part[] {
  const colours = [...new Set(parts.map((p) => p.color))];
  return colours.map((color) => {
    const geometry = mergeGeometries(parts.filter((p) => p.color === color).map((p) => p.geometry));
    if (!geometry) throw new Error(`Cannot merge the figure parts coloured ${color.toString(16)}`);
    return { geometry, color };
  });
}

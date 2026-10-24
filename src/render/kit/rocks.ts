import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { tileHash } from '../palette';

export type FacePainter = (centre: THREE.Vector3, normal: THREE.Vector3) => number;

const VERTEX_COLOURED = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });
const HASH_PRECISION = 1000;

const quantized = (n: number) => Math.round(n * HASH_PRECISION) / HASH_PRECISION;

export function pointHash(p: THREE.Vector3, seed: number): number {
  return tileHash(quantized(p.x) * 13.7 + quantized(p.y) * 5.3 + seed, quantized(p.z) * 11.1 - quantized(p.y) * 7.9 + seed * 0.37);
}

export function lumpyStone(radius: number, seed: number, roughness: number, detail = 0): THREE.BufferGeometry {
  const geometry = new THREE.DodecahedronGeometry(radius, detail);
  const position = geometry.getAttribute('position');
  const v = new THREE.Vector3();
  for (let i = 0; i < position.count; i++) {
    v.fromBufferAttribute(position, i);
    v.multiplyScalar(1 + (pointHash(v, seed) - 0.5) * 2 * roughness);
    position.setXYZ(i, v.x, v.y, v.z);
  }
  return geometry;
}

export function painted(geometry: THREE.BufferGeometry, painter: FacePainter): THREE.BufferGeometry {
  const flat = geometry.index ? geometry.toNonIndexed() : geometry;
  const position = flat.getAttribute('position');
  const colours = new Float32Array(position.count * 3);
  const triangle = new THREE.Triangle();
  const centre = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const colour = new THREE.Color();
  for (let first = 0; first < position.count; first += 3) {
    triangle.setFromAttributeAndIndices(position, first, first + 1, first + 2);
    triangle.getMidpoint(centre);
    triangle.getNormal(normal);
    colour.setHex(painter(centre, normal));
    for (let v = first; v < first + 3; v++) colour.toArray(colours, v * 3);
  }
  flat.setAttribute('color', new THREE.Float32BufferAttribute(colours, 3));
  flat.computeVertexNormals();
  return flat;
}

export function vertexColoured(parts: THREE.BufferGeometry[]): THREE.Mesh {
  const merged = mergeGeometries(parts);
  if (!merged) throw new Error('Cannot merge vertex-coloured parts');
  for (const part of parts) part.dispose();
  return new THREE.Mesh(merged, VERTEX_COLOURED);
}

const FACE_SHADE_JITTER = 0.07;

export function lumpy(geometry: THREE.BufferGeometry, amount: number, seed: number): THREE.BufferGeometry {
  const result = geometry.index ? geometry.toNonIndexed() : geometry.clone();
  const position = result.getAttribute('position');
  const p = new THREE.Vector3();
  for (let i = 0; i < position.count; i++) {
    p.fromBufferAttribute(position, i);
    const offset = (axis: number) => (pointHash(p, seed + axis) - 0.5) * 2 * amount;
    position.setXYZ(i, p.x + offset(1), p.y + offset(2), p.z + offset(3));
  }
  return result;
}

export function boulder(seed: number, lumpiness = 0.18): THREE.BufferGeometry {
  return lumpy(new THREE.IcosahedronGeometry(1, 1), lumpiness, seed);
}

export function block(width: number, height: number, depth: number, chip: number, seed: number): THREE.BufferGeometry {
  return lumpy(new THREE.BoxGeometry(width, height, depth, 3, 2, 3), chip, seed);
}

export function sliced(geometry: THREE.BufferGeometry, axis: 'x' | 'y' | 'z', at: number, keep: 'above' | 'below'): THREE.BufferGeometry {
  const position = geometry.getAttribute('position');
  const index = { x: 0, y: 1, z: 2 }[axis];
  for (let i = 0; i < position.count; i++) {
    const value = position.getComponent(i, index);
    position.setComponent(i, index, keep === 'above' ? Math.max(value, at) : Math.min(value, at));
  }
  return geometry;
}

export function veinedStone(base: number, vein: number, seed: number, spacing: number, width: number): FacePainter {
  const direction = new THREE.Vector3(tileHash(seed, 1) - 0.5, tileHash(seed, 2) * 0.6 - 0.3, tileHash(seed, 3) - 0.5).normalize();
  const offset = tileHash(seed, 4);
  return (centre) => {
    const band = centre.dot(direction) / spacing + offset;
    return band - Math.floor(band) < width ? vein : base;
  };
}

export function groundedStone(stone: FacePainter, base: number, baseHeight: number): FacePainter {
  return (centre, normal) => (centre.y < baseHeight && normal.y < 0.5 ? base : stone(centre, normal));
}

export function mottled(painter: FacePainter): FacePainter {
  const colour = new THREE.Color();
  return (centre, normal) => colour.setHex(painter(centre, normal)).multiplyScalar(1 - FACE_SHADE_JITTER / 2 + pointHash(centre, 7) * FACE_SHADE_JITTER).getHex();
}

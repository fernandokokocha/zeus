import * as THREE from 'three';
import type { Point } from '../sim/point';
import type { View } from './view';

const GROUND = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const hit = new THREE.Vector3();

export function tileUnderPointer(view: View, clientX: number, clientY: number): Point {
  const rect = view.canvas.getBoundingClientRect();
  pointer.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
  raycaster.setFromCamera(pointer, view.camera);
  raycaster.ray.intersectPlane(GROUND, hit);
  return { x: Math.floor(hit.x), y: Math.floor(hit.z) };
}

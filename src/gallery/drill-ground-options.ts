import * as THREE from 'three';
import { postRow } from '../render/drill-ground-models';
import { type DesignOption, withoutAndWithWorkers } from './options';

type Build = (staffed: boolean) => THREE.Object3D;

function facingGalleryRoad(ground: THREE.Object3D): THREE.Object3D {
  const turned = new THREE.Group();
  turned.add(ground);
  turned.rotation.y = Math.PI;
  turned.position.set(4, 0, 2);
  const placedOnLot = new THREE.Group();
  placedOnLot.add(turned);
  return placedOnLot;
}

const option = (name: string, build: Build): DesignOption => ({
  name,
  build: () => facingGalleryRoad(build(true)),
  variants: withoutAndWithWorkers((staffed) => facingGalleryRoad(build(staffed))),
});

export const DRILL_GROUND_OPTIONS: DesignOption[] = [
  option('A · Row of posts', postRow),
];

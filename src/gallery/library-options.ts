import * as THREE from 'three';
import { stoaLibrary } from '../render/library-models';
import type { DesignOption } from './options';

type Build = (staffed: boolean) => THREE.Object3D;

function facingGalleryRoad(library: THREE.Object3D): THREE.Object3D {
  const turned = new THREE.Group();
  turned.add(library);
  turned.rotation.y = Math.PI;
  turned.position.set(4, 0, 2);
  const placedOnLot = new THREE.Group();
  placedOnLot.add(turned);
  return placedOnLot;
}

const option = (name: string, build: Build): DesignOption => ({
  name,
  build: () => facingGalleryRoad(build(true)),
  variants: [
    { label: 'No workers', build: () => facingGalleryRoad(build(false)) },
    { label: 'With workers', build: () => facingGalleryRoad(build(true)) },
  ],
});

export const LIBRARY_OPTIONS: DesignOption[] = [
  option('A · Stoa and reading court', stoaLibrary),
];

import type * as THREE from 'three';
import { exedraHouse } from '../render/scholars-models';
import type { DesignOption } from './options';

type Build = (supplied: boolean) => THREE.Object3D;

const option = (name: string, build: Build): DesignOption => ({
  name,
  build: () => build(true),
  variants: [
    { label: 'Supplied', build: () => build(true) },
    { label: 'Missing a need', build: () => build(false) },
  ],
});

export const SCHOLARS_HOUSE_OPTIONS: DesignOption[] = [
  option('B · Exedra grove', exedraHouse),
];

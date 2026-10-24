import type * as THREE from 'three';
import { whiteSemicircle } from '../render/theater-models';
import type { DesignOption } from './options';

type Build = (performing: boolean) => THREE.Object3D;

const option = (name: string, build: Build): DesignOption => ({
  name,
  build: () => build(true),
  variants: [
    { label: 'Idle', build: () => build(false) },
    { label: 'Performing', build: () => build(true) },
  ],
});

export const THEATER_OPTIONS: DesignOption[] = [
  option('A · White semicircle', whiteSemicircle),
];

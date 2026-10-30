import type * as THREE from 'three';
import { towerCourt } from '../render/warriors-models';
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

export const WARRIORS_HOUSE_OPTIONS: DesignOption[] = [
  option('A · Tower court', towerCourt),
];

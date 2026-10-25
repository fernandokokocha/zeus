import type * as THREE from 'three';
import { FOUNDRY_LOADS, furnaceRow } from '../render/foundry-models';
import type { DesignOption } from './options';

type Build = (staffed: boolean, loads: number) => THREE.Object3D;

const SOME = FOUNDRY_LOADS / 2;

const variants = (build: Build) => [
  { label: 'No workers · empty', build: () => build(false, 0) },
  { label: 'With workers · ore in, some bronze', build: () => build(true, SOME) },
  { label: 'With workers · full', build: () => build(true, FOUNDRY_LOADS) },
];

const option = (name: string, build: Build): DesignOption => ({ name, build: () => build(true, SOME), variants: variants(build) });

export const FOUNDRY_OPTIONS: DesignOption[] = [
  option('Furnace row', furnaceRow),
];

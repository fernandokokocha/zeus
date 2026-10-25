import type * as THREE from 'three';
import { STUDIO_BRONZE_LOADS, STUDIO_SCULPTURE_LOADS, type StudioStock, portico } from '../render/sculpture-models';
import type { DesignOption } from './options';

type Build = (stock: StudioStock) => THREE.Object3D;

const EMPTY: StudioStock = { staffed: false, bronze: 0, sculptures: 0 };
const CASTING: StudioStock = { staffed: true, bronze: STUDIO_BRONZE_LOADS, sculptures: 1 };
const FULL: StudioStock = { staffed: true, bronze: STUDIO_BRONZE_LOADS / 2, sculptures: STUDIO_SCULPTURE_LOADS };

const variants = (build: Build) => [
  { label: 'No workers · empty', build: () => build(EMPTY) },
  { label: 'With workers · bronze in, casting', build: () => build(CASTING) },
  { label: 'With workers · full of statues', build: () => build(FULL) },
];

const option = (name: string, build: Build): DesignOption => ({ name, build: () => build(CASTING), variants: variants(build) });

export const SCULPTURE_STUDIO_OPTIONS: DesignOption[] = [
  option('Portico and statue row', portico),
];

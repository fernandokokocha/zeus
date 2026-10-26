import type * as THREE from 'three';
import { storeYard } from '../render/storehouse-models';
import { type Bay, LOADS_PER_SLOT } from '../sim/storehouse';
import type { DesignOption } from './options';

type Build = (staffed: boolean, bays: Bay[]) => THREE.Object3D;

const full = (good: Bay['good']): Bay => ({ good, loads: LOADS_PER_SLOT });

const MIXED: Bay[] = [
  { good: 'fleece', loads: 3 },
  { good: 'oil', loads: 4 },
  { good: 'oil', loads: 1 },
  { good: 'wood', loads: 2 },
  { good: 'bronze', loads: 3 },
];

const FULL: Bay[] = [full('fleece'), full('olives'), full('oil'), full('wood'), full('wood'), full('marble'), full('bronze'), full('sculptures')];

const variants = (build: Build) => [
  { label: 'No workers · empty', build: () => build(false, []) },
  { label: 'With workers · some goods', build: () => build(true, MIXED) },
  { label: 'With workers · every good, full', build: () => build(true, FULL) },
];

const option = (name: string, build: Build): DesignOption => ({ name, build: () => build(true, MIXED), variants: variants(build) });

export const STOREHOUSE_OPTIONS: DesignOption[] = [
  option('A · Storeyard', storeYard),
];

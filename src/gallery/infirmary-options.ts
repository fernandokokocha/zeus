import type * as THREE from 'three';
import { tholosAndAbaton } from '../render/infirmary-models';
import { type DesignOption, withoutAndWithWorkers } from './options';

const option = (name: string, build: (staffed: boolean) => THREE.Object3D): DesignOption => ({
  name,
  build: () => build(true),
  variants: withoutAndWithWorkers(build),
});

export const INFIRMARY_OPTIONS: DesignOption[] = [
  option('B · Tholos and abaton', tholosAndAbaton),
];

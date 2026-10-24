import type * as THREE from 'three';
import { TIMBER_MILL_LOADS, craneYard, logYard, sawPitShed } from '../render/timber-models';
import type { DesignOption } from './options';

type Build = (staffed: boolean, loads: number) => THREE.Object3D;

const HALF = TIMBER_MILL_LOADS / 2;

const variants = (build: Build) => [
  { label: 'No workers · empty', build: () => build(false, 0) },
  { label: 'With workers · half', build: () => build(true, HALF) },
  { label: 'With workers · full', build: () => build(true, TIMBER_MILL_LOADS) },
];

const option = (name: string, build: Build): DesignOption => ({ name, build: () => build(true, HALF), variants: variants(build) });

export const TIMBER_MILL_OPTIONS: DesignOption[] = [
  option('A · Saw-pit shed', sawPitShed),
  option('B · Awning and log yard', logYard),
  option('C · Crane yard', craneYard),
];

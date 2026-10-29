import type * as THREE from 'three';
import { marketCourt } from '../render/traders-guild-models';
import type { DesignOption } from './options';

type Build = (supplied: boolean) => THREE.Object3D;

const option = (name: string, build: Build): DesignOption => ({
  name,
  build: () => build(true),
  variants: [
    { label: 'Fully supplied', build: () => build(true) },
    { label: 'Missing a need', build: () => build(false) },
  ],
});

export const TRADERS_GUILD_OPTIONS: DesignOption[] = [
  option('C1 · Ordered L', marketCourt),
];

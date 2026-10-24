import type * as THREE from 'three';

export interface DesignOption {
  name: string;
  notes?: string[];
  build: () => THREE.Object3D;
  variants?: { label: string; build: () => THREE.Object3D }[];
}

export interface DesignSet {
  title: string;
  needs: string;
  options: DesignOption[];
  chosen?: number;
  previous?: DesignOption;
  footprint?: [number, number];
  strip?: boolean;
}

export function withoutAndWithWorkers(build: (staffed: boolean) => THREE.Object3D): { label: string; build: () => THREE.Object3D }[] {
  return [
    { label: 'No workers', build: () => build(false) },
    { label: 'With workers', build: () => build(true) },
  ];
}

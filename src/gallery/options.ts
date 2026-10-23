import type * as THREE from 'three';

export interface DesignOption {
  name: string;
  notes: string[];
  build: () => THREE.Object3D;
  variants?: { label: string; build: () => THREE.Object3D }[];
}

export interface DesignSet {
  title: string;
  needs: string;
  options: DesignOption[];
  chosen?: number;
  previous?: DesignOption;
  size?: number;
}

import * as THREE from 'three';
import { TERRAIN_COLORS } from '../render/palette';
import { MARBLE_OUTCROPS } from '../render/rock-models';
import type { DesignOption } from './options';

const NAMES = ['A · Split boulder', 'B · Stepped ledge', 'C · Block cluster', 'D · Cracked slab', 'E · Pinnacle'];

function onMarbleTile(rock: () => THREE.Mesh): () => THREE.Object3D {
  return () => {
    const tile = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ color: TERRAIN_COLORS.marble }));
    tile.position.set(0.5, 0.002, 0.5);
    const outcrop = rock();
    outcrop.position.set(0.5, 0, 0.5);
    return new THREE.Group().add(tile, outcrop);
  };
}

export const MARBLE_OPTIONS: DesignOption[] = MARBLE_OUTCROPS.map((outcrop, i) => ({ name: NAMES[i], build: onMarbleTile(outcrop) }));

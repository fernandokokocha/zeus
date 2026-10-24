import * as THREE from 'three';
import { TERRAIN_COLORS } from '../render/palette';
import { COPPER_DEPOSITS } from '../render/rock-models';
import type { DesignOption } from './options';

const NAMES = ['A · Veined mound', 'B · Malachite crags', 'C · Glinting rubble', 'D · Split boulder', 'E · Speckled stones'];

function onOreTile(model: THREE.Object3D): THREE.Object3D {
  const tile = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ color: TERRAIN_COLORS.copper }));
  tile.position.y = 0.002;
  const group = new THREE.Group();
  group.position.set(0.5, 0, 0.5);
  group.add(tile, model);
  return group;
}

export const COPPER_OPTIONS: DesignOption[] = COPPER_DEPOSITS.map((deposit, i) => ({ name: NAMES[i], build: () => onOreTile(deposit()) }));

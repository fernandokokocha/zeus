import * as THREE from 'three';
import { FOREST_STUMPS, FOREST_TREES } from '../render/forest-models';
import { TERRAIN_COLORS } from '../render/palette';
import type { DesignOption } from './options';

const NAMES = ['A · Aleppo pine', 'B · Cypress pair', 'C · Holm oak', 'D · Stone pine bush', 'E · Young pines'];

function onForestTile(cover: () => THREE.Mesh): () => THREE.Object3D {
  return () => {
    const tile = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ color: TERRAIN_COLORS.forest }));
    tile.position.set(0.5, 0.002, 0.5);
    const model = cover();
    model.position.set(0.5, 0, 0.5);
    return new THREE.Group().add(tile, model);
  };
}

export const FOREST_OPTIONS: DesignOption[] = FOREST_TREES.map((tree, i) => ({
  name: NAMES[i],
  build: onForestTile(tree),
  variants: [
    { label: 'Standing', build: onForestTile(tree) },
    { label: 'Felled', build: onForestTile(FOREST_STUMPS[i]) },
  ],
}));

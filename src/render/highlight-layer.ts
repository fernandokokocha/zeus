import * as THREE from 'three';
import type { Point } from '../sim/point';
import { PALETTE } from './palette';

const HIGHLIGHT_HEIGHT = 0.07;
const HIGHLIGHT_OPACITY = 0.45;

export function createHighlightLayer(mapSize: number): { mesh: THREE.InstancedMesh; show(tiles: Point[]): void } {
  const mesh = new THREE.InstancedMesh(
    new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: PALETTE.inspected, transparent: true, opacity: HIGHLIGHT_OPACITY, depthTest: false, depthWrite: false }),
    mapSize * mapSize,
  );
  mesh.count = 0;
  mesh.renderOrder = 2;
  mesh.frustumCulled = false;
  const matrix = new THREE.Matrix4();

  return {
    mesh,
    show(tiles) {
      tiles.forEach((tile, i) => {
        matrix.makeTranslation(tile.x + 0.5, HIGHLIGHT_HEIGHT, tile.y + 0.5);
        mesh.setMatrixAt(i, matrix);
      });
      mesh.count = tiles.length;
      mesh.instanceMatrix.needsUpdate = true;
    },
  };
}

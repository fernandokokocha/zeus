import * as THREE from 'three';
import type { PreviewKind, PreviewTile } from '../ui/preview';
import { PALETTE } from './palette';

const GHOST_HEIGHT = 0.05;
const KIND_COLORS: Record<PreviewKind, THREE.Color> = {
  valid: new THREE.Color(PALETTE.ghostValid),
  warning: new THREE.Color(PALETTE.ghostWarning),
  invalid: new THREE.Color(PALETTE.ghostInvalid),
};

export function createGhostLayer(mapSize: number): { mesh: THREE.InstancedMesh; show(tiles: PreviewTile[]): void } {
  const mesh = new THREE.InstancedMesh(
    new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.45, depthWrite: false }),
    mapSize * mapSize,
  );
  const colors = new THREE.InstancedBufferAttribute(new Float32Array(mapSize * mapSize * 3), 3);
  mesh.instanceColor = colors;
  mesh.count = 0;
  const matrix = new THREE.Matrix4();

  return {
    mesh,
    show(tiles) {
      tiles.forEach((tile, i) => {
        matrix.makeTranslation(tile.x + 0.5, GHOST_HEIGHT, tile.y + 0.5);
        mesh.setMatrixAt(i, matrix);
        mesh.setColorAt(i, KIND_COLORS[tile.kind]);
      });
      mesh.count = tiles.length;
      mesh.instanceMatrix.needsUpdate = true;
      colors.needsUpdate = true;
    },
  };
}

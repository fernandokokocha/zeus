import * as THREE from 'three';
import { appealMap } from '../sim/appeal';
import type { GameState } from '../sim/state';
import { PALETTE } from './palette';

export const APPEAL_SCALE = 20;
const OVERLAY_HEIGHT = 0.06;
const OVERLAY_OPACITY = 0.6;

export function appealColor(appeal: number): THREE.Color {
  const strength = Math.min(Math.abs(appeal) / APPEAL_SCALE, 1);
  const hue = new THREE.Color(appeal > 0 ? PALETTE.appealHigh : PALETTE.appealLow);
  return new THREE.Color(PALETTE.plaster).lerp(hue, strength);
}

export function createAppealLayer(mapSize: number): { mesh: THREE.InstancedMesh; sync(state: GameState, visible: boolean): void } {
  const mesh = new THREE.InstancedMesh(
    new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: OVERLAY_OPACITY, depthTest: false, depthWrite: false }),
    mapSize * mapSize,
  );
  const colors = new THREE.InstancedBufferAttribute(new Float32Array(mapSize * mapSize * 3), 3);
  mesh.instanceColor = colors;
  mesh.renderOrder = 1;
  mesh.frustumCulled = false;
  const matrix = new THREE.Matrix4();
  let renderedVersion = -1;

  function paint(state: GameState): void {
    let count = 0;
    appealMap(state).forEach((appeal, i) => {
      if (appeal === 0) return;
      matrix.makeTranslation((i % state.size) + 0.5, OVERLAY_HEIGHT, Math.floor(i / state.size) + 0.5);
      mesh.setMatrixAt(count, matrix);
      mesh.setColorAt(count, appealColor(appeal));
      count++;
    });
    mesh.count = count;
    mesh.instanceMatrix.needsUpdate = true;
    colors.needsUpdate = true;
  }

  return {
    mesh,
    sync(state, visible) {
      mesh.visible = visible;
      if (!visible || state.version === renderedVersion) return;
      renderedVersion = state.version;
      paint(state);
    },
  };
}

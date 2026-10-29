import * as THREE from 'three';
import { ELITE_SITE_READINGS, isColumnOverlay, overlayReadings, type Overlay, type TintOverlay } from '../sim/overlays';
import type { GameState } from '../sim/state';
import { PALETTE } from './palette';

const OVERLAY_HEIGHT = 0.06;
const OVERLAY_OPACITY = 0.6;
const REPAINT_TICKS = 8;

interface ColorStop {
  at: number;
  color: number;
}

const { overlayGood: good, overlayBad: bad } = PALETTE;

const TINT_SCALES: Record<TintOverlay, ColorStop[]> = {
  appeal: [
    { at: -20, color: bad },
    { at: 0, color: PALETTE.plaster },
    { at: 20, color: good },
  ],
  eliteSites: [
    { at: ELITE_SITE_READINGS.guildRange, color: PALETTE.overlayGuildRange },
    { at: ELITE_SITE_READINGS.tradersGuild, color: PALETTE.overlayTradersGuild },
    { at: ELITE_SITE_READINGS.scholarsHouse, color: PALETTE.overlayScholarsHouse },
  ],
};

export function overlayColor(overlay: TintOverlay, reading: number): THREE.Color {
  const stops = TINT_SCALES[overlay];
  const upper = stops.findIndex((stop) => stop.at >= reading);
  if (upper === -1) return new THREE.Color(stops[stops.length - 1].color);
  if (upper === 0) return new THREE.Color(stops[0].color);
  const low = stops[upper - 1];
  const high = stops[upper];
  return new THREE.Color(low.color).lerp(new THREE.Color(high.color), (reading - low.at) / (high.at - low.at));
}

export function createOverlayLayer(mapSize: number): { mesh: THREE.InstancedMesh; sync(state: GameState, overlay: Overlay | null): void } {
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
  let rendered: { version: number; tick: number; overlay: TintOverlay } | null = null;

  function paint(state: GameState, overlay: TintOverlay): void {
    let count = 0;
    overlayReadings(state, overlay).forEach((reading, i) => {
      if (reading === null) return;
      matrix.makeTranslation((i % state.size) + 0.5, OVERLAY_HEIGHT, Math.floor(i / state.size) + 0.5);
      mesh.setMatrixAt(count, matrix);
      mesh.setColorAt(count, overlayColor(overlay, reading));
      count++;
    });
    mesh.count = count;
    mesh.instanceMatrix.needsUpdate = true;
    colors.needsUpdate = true;
  }

  return {
    mesh,
    sync(state, overlay) {
      mesh.visible = overlay !== null && !isColumnOverlay(overlay);
      if (!overlay || isColumnOverlay(overlay)) return;
      const tick = overlay === 'appeal' ? 0 : state.tick - (state.tick % REPAINT_TICKS);
      if (rendered && rendered.overlay === overlay && rendered.version === state.version && rendered.tick === tick) return;
      rendered = { version: state.version, tick, overlay };
      paint(state, overlay);
    },
  };
}

import * as THREE from 'three';
import { HOUSE_LEVELS } from '../sim/housing';
import { overlayReadings, type Overlay } from '../sim/overlays';
import type { GameState } from '../sim/state';
import { PALETTE } from './palette';

const OVERLAY_HEIGHT = 0.06;
const OVERLAY_OPACITY = 0.6;
const REPAINT_TICKS = 8;

export interface ColorStop {
  at: number;
  color: number;
  label: string;
}

export interface OverlayScale {
  name: string;
  title: string;
  stops: ColorStop[];
}

const { overlayGood: good, overlayFair: fair, overlayMid: mid, overlayBad: bad } = PALETTE;

function coverageStops(none: string, soon: string, fresh: string): ColorStop[] {
  return [
    { at: 0, color: bad, label: none },
    { at: 0.25, color: mid, label: soon },
    { at: 1, color: good, label: fresh },
  ];
}

function riskStops(full: string): ColorStop[] {
  return [
    { at: 0, color: good, label: 'Just maintained' },
    { at: 0.5, color: mid, label: 'Half way' },
    { at: 1, color: bad, label: full },
  ];
}

const levelNames = Object.values(HOUSE_LEVELS).map((level) => level.name);
const levelStops = levelNames.map((label, i) => ({
  at: i,
  color: new THREE.Color(PALETTE.overlayLevelLow).lerp(new THREE.Color(PALETTE.overlayLevelHigh), i / (levelNames.length - 1)).getHex(),
  label,
}));

export const OVERLAY_SCALES: Record<Overlay, OverlayScale> = {
  water: { name: 'Water', title: 'Water access', stops: coverageStops('No water', 'Running out', 'Just served') },
  food: {
    name: 'Food',
    title: 'Food in houses',
    stops: [
      { at: 0, color: bad, label: 'None' },
      { at: 1, color: mid, label: '1 month' },
      { at: 3, color: good, label: '3 months' },
    ],
  },
  supply: {
    name: 'Supply',
    title: 'Fleece and oil in houses',
    stops: [
      { at: 0, color: bad, label: 'Neither' },
      { at: 1, color: mid, label: 'Fleece or oil' },
      { at: 2, color: good, label: 'Fleece and oil' },
    ],
  },
  culture: {
    name: 'Culture',
    title: 'Culture points',
    stops: [
      { at: 0, color: bad, label: '0' },
      { at: HOUSE_LEVELS.hovel.culture, color: mid, label: `${HOUSE_LEVELS.hovel.culture} · Hovel` },
      { at: HOUSE_LEVELS.tenement.culture, color: fair, label: `${HOUSE_LEVELS.tenement.culture} · Tenement` },
      { at: HOUSE_LEVELS.townhouse.culture, color: good, label: `${HOUSE_LEVELS.townhouse.culture} · Townhouse` },
    ],
  },
  appeal: {
    name: 'Appeal',
    title: 'Appeal',
    stops: [
      { at: -20, color: bad, label: '−20' },
      { at: 0, color: PALETTE.plaster, label: '0' },
      { at: 20, color: good, label: '+20' },
    ],
  },
  fireRisk: { name: 'Fire', title: 'Fire risk', stops: riskStops('About to burn') },
  collapseRisk: { name: 'Collapse', title: 'Collapse risk', stops: riskStops('About to collapse') },
  tax: { name: 'Tax', title: 'Tax collection', stops: coverageStops('Not collected', 'Due soon', 'Just collected') },
  houseLevel: { name: 'Houses', title: 'House level', stops: levelStops },
  staffing: {
    name: 'Staff',
    title: 'Staffing',
    stops: [
      { at: 0, color: bad, label: 'No workers' },
      { at: 0.5, color: mid, label: 'Half staffed' },
      { at: 1, color: good, label: 'Fully staffed' },
    ],
  },
};

export function overlayColor(overlay: Overlay, reading: number): THREE.Color {
  const { stops } = OVERLAY_SCALES[overlay];
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
  let rendered: { version: number; tick: number; overlay: Overlay } | null = null;

  function paint(state: GameState, overlay: Overlay): void {
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
      mesh.visible = overlay !== null;
      if (!overlay) return;
      const tick = overlay === 'appeal' ? 0 : state.tick - (state.tick % REPAINT_TICKS);
      if (rendered && rendered.overlay === overlay && rendered.version === state.version && rendered.tick === tick) return;
      rendered = { version: state.version, tick, overlay };
      paint(state, overlay);
    },
  };
}

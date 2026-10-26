import * as THREE from 'three';
import { buildingSize } from '../sim/buildings';
import { buildingLook, isColumnOverlay, overlayColumns, type ColumnKind, type ColumnPart, type Overlay } from '../sim/overlays';
import type { Building, GameState } from '../sim/state';
import { PALETTE } from './palette';

const FLAT_BASE_HEIGHT = 0.05;
const FLAT_BASE_GAP = 0.12;
const STUB_SIZE = 0.5;
const STUB_HEIGHT = 0.14;
const SHAFT_SIZE = 0.32;
const FULL_HEIGHT = 2.4;
const RISK_WARNING_SHARE = 0.8;
const REPAINT_TICKS = 8;

const PART_COLORS: Record<ColumnKind, number> = {
  water: PALETTE.columnWater,
  philosophy: PALETTE.columnPhilosophy,
  athletics: PALETTE.columnAthletics,
  drama: PALETTE.columnDrama,
  fire: PALETTE.columnFire,
  collapse: PALETTE.columnCollapse,
  staff: PALETTE.columnStaff,
};

function partColor({ kind, share }: ColumnPart): number {
  const isRisk = kind === 'fire' || kind === 'collapse';
  return isRisk && share >= RISK_WARNING_SHARE ? PALETTE.columnDanger : PART_COLORS[kind];
}

const box = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0);

interface Boxes {
  mesh: THREE.InstancedMesh;
  colors: THREE.InstancedBufferAttribute;
}

function boxes(capacity: number): Boxes {
  const mesh = new THREE.InstancedMesh(box, new THREE.MeshLambertMaterial(), capacity);
  const colors = new THREE.InstancedBufferAttribute(new Float32Array(capacity * 3), 3);
  mesh.instanceColor = colors;
  mesh.frustumCulled = false;
  return { mesh, colors };
}

export function createColumnLayer(mapSize: number): { group: THREE.Group; sync(state: GameState, overlay: Overlay | null): void } {
  const group = new THREE.Group();
  const capacity = mapSize * mapSize;
  const bases = boxes(capacity);
  const stubs = boxes(capacity);
  const shafts = boxes(capacity);
  const all = [bases, stubs, shafts];
  group.add(...all.map(({ mesh }) => mesh));
  const matrix = new THREE.Matrix4();
  const color = new THREE.Color();
  let rendered: { version: number; tick: number; overlay: Overlay } | null = null;

  function add({ mesh }: Boxes, at: THREE.Vector3, scale: THREE.Vector3, hex: number): void {
    matrix.makeScale(scale.x, scale.y, scale.z).setPosition(at);
    mesh.setMatrixAt(mesh.count, matrix);
    mesh.setColorAt(mesh.count, color.setHex(hex));
    mesh.count++;
  }

  function centre(building: Building): THREE.Vector3 {
    const { width, height } = buildingSize(building.type, building.rotation);
    return new THREE.Vector3(building.x + width / 2, 0, building.y + height / 2);
  }

  function paint(state: GameState, overlay: Overlay): void {
    for (const { mesh } of all) mesh.count = 0;
    for (const building of state.buildings) {
      if (buildingLook(state, overlay, building) !== 'reported') continue;
      const { width, height } = buildingSize(building.type, building.rotation);
      add(bases, centre(building), new THREE.Vector3(width - FLAT_BASE_GAP, FLAT_BASE_HEIGHT, height - FLAT_BASE_GAP), PALETTE.flatBase);
    }
    if (isColumnOverlay(overlay)) {
      for (const { building, parts } of overlayColumns(state, overlay)) {
        const at = centre(building).setY(FLAT_BASE_HEIGHT);
        add(stubs, at, new THREE.Vector3(STUB_SIZE, STUB_HEIGHT, STUB_SIZE), PALETTE.columnStub);
        let y = FLAT_BASE_HEIGHT + STUB_HEIGHT;
        for (const part of parts) {
          const length = part.share * FULL_HEIGHT;
          if (length <= 0) continue;
          add(shafts, at.clone().setY(y), new THREE.Vector3(SHAFT_SIZE, length, SHAFT_SIZE), partColor(part));
          y += length;
        }
      }
    }
    for (const { mesh, colors } of all) {
      mesh.instanceMatrix.needsUpdate = true;
      colors.needsUpdate = true;
    }
  }

  return {
    group,
    sync(state, overlay) {
      group.visible = overlay !== null;
      if (!overlay) return;
      const tick = state.tick - (state.tick % REPAINT_TICKS);
      if (rendered && rendered.overlay === overlay && rendered.version === state.version && rendered.tick === tick) return;
      rendered = { version: state.version, tick, overlay };
      paint(state, overlay);
    },
  };
}

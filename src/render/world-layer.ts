import * as THREE from 'three';
import { BUILDING_SPECS, buildingSize } from '../sim/buildings';
import { buildingLook, type Look, type Overlay } from '../sim/overlays';
import type { Building, GameState } from '../sim/state';
import type { Animate } from './kit/figure';
import { lookKey } from './look-key';
import { buildingModel, roadblockModel } from './models';
import { PALETTE, tileHash } from './palette';

const ROAD_HEIGHT = 0.02;
const roadGeometry = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
const roadMaterial = new THREE.MeshLambertMaterial({ color: PALETTE.road });
const PAVING_SLABS_PER_SIDE = 2;
const PAVING_GAP = 0.06;
const PAVING_SLAB_HEIGHT = 0.02;
const PAVING_SHADE_SPREAD = 0.12;
const pavingSlabSize = 1 / PAVING_SLABS_PER_SIDE - PAVING_GAP;
const jointMaterial = new THREE.MeshLambertMaterial({ color: PALETTE.pavingJoint });
const slabGeometry = new THREE.BoxGeometry(pavingSlabSize, PAVING_SLAB_HEIGHT, pavingSlabSize);
const slabMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
const FADED_OPACITY = 0.25;
const RESTYLE_TICKS = 8;
const fadedMaterials = new Map<THREE.Material, THREE.Material>();

function faded(material: THREE.Material): THREE.Material {
  let copy = fadedMaterials.get(material);
  if (!copy) {
    copy = material.clone();
    copy.transparent = true;
    copy.opacity = material.opacity * FADED_OPACITY;
    copy.depthWrite = false;
    fadedMaterials.set(material, copy);
  }
  return copy;
}

function applyLook(object: THREE.Object3D, look: Look | null): void {
  object.visible = look !== 'reported';
  const fade = look === 'faded';
  object.traverse((node) => {
    if (!(node instanceof THREE.Mesh)) return;
    if (node.userData.solid === undefined) node.userData.solid = node.material;
    const solid: THREE.Material | THREE.Material[] = node.userData.solid;
    node.material = !fade ? solid : Array.isArray(solid) ? solid.map(faded) : faded(solid);
  });
}

interface Placed {
  key: string;
  look: Look | null;
  object: THREE.Object3D;
  animations: Animate[];
}

export function createWorldLayer(): {
  group: THREE.Group;
  sync(state: GameState): void;
  style(state: GameState, overlay: Overlay | null): void;
  animate(seconds: number): void;
} {
  const group = new THREE.Group();
  const streets = new THREE.Group();
  group.add(streets);
  const geometries = geometryUsers();
  const placed = new Map<number, Placed>();
  let renderedVersion = -1;
  let renderedStreets = '';
  let styled: { version: number; tick: number; overlay: Overlay | null } | null = null;

  function syncStreets(state: GameState): void {
    const key = streetsKey(state);
    if (key === renderedStreets) return;
    renderedStreets = key;
    const old = [...streets.children];
    streets.clear();
    streets.add(roadMesh(state, (i) => state.roads[i] && !state.mainRoad[i], roadMaterial), ...pavingMeshes(state), ...roadblockModels(state));
    geometries.retain(streets);
    for (const child of old) {
      if (child instanceof THREE.InstancedMesh) child.dispose();
      geometries.release(child);
    }
  }

  function syncBuildings(state: GameState): void {
    const present = new Set<number>();
    for (const building of state.buildings) {
      present.add(building.id);
      const key = lookKey(building, state);
      const old = placed.get(building.id);
      if (old && old.key === key) continue;
      const object = placedModel(building, state);
      const animations: Animate[] = [];
      object.traverse((node) => node.userData.animate && animations.push(node.userData.animate));
      geometries.retain(object);
      group.add(object);
      placed.set(building.id, { key, look: null, object, animations });
      if (old) remove(old);
    }
    for (const [id, old] of placed) {
      if (present.has(id)) continue;
      placed.delete(id);
      remove(old);
    }
  }

  function remove({ object }: Placed): void {
    group.remove(object);
    geometries.release(object);
  }

  return {
    group,
    sync(state) {
      if (state.version === renderedVersion) return;
      renderedVersion = state.version;
      syncStreets(state);
      syncBuildings(state);
    },
    style(state, overlay) {
      const tick = state.tick - (state.tick % RESTYLE_TICKS);
      if (styled && styled.overlay === overlay && styled.version === state.version && styled.tick === tick) return;
      styled = { version: state.version, tick, overlay };
      for (const building of state.buildings) {
        const shown = placed.get(building.id)!;
        const look = overlay ? buildingLook(state, overlay, building) : null;
        if (look === shown.look) continue;
        shown.look = look;
        applyLook(shown.object, look);
      }
    },
    animate(seconds) {
      for (const { animations } of placed.values()) for (const animate of animations) animate(seconds);
    },
  };
}

function geometryUsers(): { retain(object: THREE.Object3D): void; release(object: THREE.Object3D): void } {
  const users = new Map<THREE.BufferGeometry, number>();
  const eachGeometry = (object: THREE.Object3D, visit: (geometry: THREE.BufferGeometry) => void) =>
    object.traverse((node) => node instanceof THREE.Mesh && visit(node.geometry));
  return {
    retain: (object) => eachGeometry(object, (geometry) => users.set(geometry, (users.get(geometry) ?? 0) + 1)),
    release: (object) =>
      eachGeometry(object, (geometry) => {
        const left = users.get(geometry)! - 1;
        if (left > 0) {
          users.set(geometry, left);
        } else {
          users.delete(geometry);
          geometry.dispose();
        }
      }),
  };
}

function streetsKey(state: GameState): string {
  return state.roads.map((road, i) => +road + 2 * +state.mainRoad[i] + 4 * +state.roadblocks[i]).join('');
}

function roadMesh(state: GameState, drawn: (tile: number) => boolean, material: THREE.Material): THREE.InstancedMesh {
  const roadTiles = state.roads.flatMap((_, i) => (drawn(i) ? [i] : []));
  const mesh = new THREE.InstancedMesh(roadGeometry, material, roadTiles.length);
  const matrix = new THREE.Matrix4();
  roadTiles.forEach((tile, n) => {
    matrix.makeTranslation((tile % state.size) + 0.5, ROAD_HEIGHT, Math.floor(tile / state.size) + 0.5);
    mesh.setMatrixAt(n, matrix);
  });
  return mesh;
}

function pavingMeshes(state: GameState): THREE.InstancedMesh[] {
  const joints = roadMesh(state, (i) => state.mainRoad[i], jointMaterial);
  const tiles = state.mainRoad.flatMap((paved, i) => (paved ? [i] : []));
  const slabs = new THREE.InstancedMesh(slabGeometry, slabMaterial, tiles.length * PAVING_SLABS_PER_SIDE ** 2);
  const matrix = new THREE.Matrix4();
  const color = new THREE.Color();
  let n = 0;
  for (const tile of tiles) {
    for (let sy = 0; sy < PAVING_SLABS_PER_SIDE; sy++) {
      for (let sx = 0; sx < PAVING_SLABS_PER_SIDE; sx++) {
        const x = (tile % state.size) + (sx + 0.5) / PAVING_SLABS_PER_SIDE;
        const z = Math.floor(tile / state.size) + (sy + 0.5) / PAVING_SLABS_PER_SIDE;
        matrix.makeTranslation(x, ROAD_HEIGHT + PAVING_SLAB_HEIGHT / 2, z);
        slabs.setMatrixAt(n, matrix);
        slabs.setColorAt(n, color.setHex(PALETTE.pavingStone).offsetHSL(0, 0, (tileHash(x, z) - 0.5) * PAVING_SHADE_SPREAD));
        n++;
      }
    }
  }
  return [joints, slabs];
}

function roadblockModels(state: GameState): THREE.Object3D[] {
  return state.roadblocks.flatMap((blocked, i) => {
    if (!blocked) return [];
    const x = i % state.size;
    const y = Math.floor(i / state.size);
    const alongX = (x > 0 && state.roads[i - 1]) || (x < state.size - 1 && state.roads[i + 1]);
    const model = roadblockModel(alongX);
    model.position.x += x;
    model.position.z += y;
    return [model];
  });
}

function placedModel(building: Building, state: GameState): THREE.Object3D {
  const { width, height } = BUILDING_SPECS[building.type];
  const turned = buildingSize(building.type, building.rotation);
  const model = buildingModel(building, state);
  model.position.set(-width / 2, 0, -height / 2);
  const pivot = new THREE.Group();
  pivot.add(model);
  pivot.rotation.y = -building.rotation * (Math.PI / 2);
  pivot.position.set(building.x + turned.width / 2, 0, building.y + turned.height / 2);
  return pivot;
}

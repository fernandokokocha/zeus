import * as THREE from 'three';
import { isFelled } from '../sim/materials';
import type { Point } from '../sim/point';
import { tileIndex, type GameState } from '../sim/state';
import type { Terrain } from '../sim/terrain';
import { TERRAIN_COLORS, tileHash, variantIndexAt } from './palette';
import { FOREST_STUMPS, FOREST_TREES } from './forest-models';
import { COPPER_DEPOSITS, MARBLE_OUTCROPS } from './rock-models';

const SHADE_VARIATION = 0.08;

type Cover = Terrain | 'stump';

interface Scattered {
  cover: Cover;
  variant: number;
  variants: number;
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
}

const varied = (cover: Cover, builds: (() => THREE.Mesh)[]): Scattered[] =>
  builds.map((build, variant) => {
    const mesh = build();
    return { cover, variant, variants: builds.length, geometry: mesh.geometry, material: mesh.material as THREE.Material };
  });

const SCATTERED: Scattered[] = [
  ...varied('forest', FOREST_TREES),
  ...varied('stump', FOREST_STUMPS),
  ...varied('marble', MARBLE_OUTCROPS),
  ...varied('copper', COPPER_DEPOSITS),
];
const groundMaterial = new THREE.MeshLambertMaterial({ vertexColors: true });

export function createTerrainLayer(): { group: THREE.Group; sync(state: GameState): void } {
  const group = new THREE.Group();
  let renderedVersion = -1;
  let ground: THREE.Mesh | null = null;
  let scattered: THREE.InstancedMesh[] = [];

  return {
    group,
    sync(state) {
      if (state.version === renderedVersion) return;
      renderedVersion = state.version;
      if (ground) ground.geometry.dispose();
      for (const mesh of scattered) mesh.dispose();
      group.clear();

      ground = groundMesh(state);
      scattered = SCATTERED.map((s) => scatter(tilesOf(state, s), s.geometry, s.material));
      group.add(ground, ...scattered);
    },
  };
}

function groundMesh(state: GameState): THREE.Mesh {
  const positions: number[] = [];
  const colors: number[] = [];
  const color = new THREE.Color();
  for (let y = 0; y < state.size; y++) {
    for (let x = 0; x < state.size; x++) {
      positions.push(x, 0, y, x, 0, y + 1, x + 1, 0, y, x + 1, 0, y, x, 0, y + 1, x + 1, 0, y + 1);
      color.setHex(TERRAIN_COLORS[state.terrain[tileIndex(state, x, y)]]);
      color.multiplyScalar(1 - SHADE_VARIATION / 2 + tileHash(x, y) * SHADE_VARIATION);
      for (let v = 0; v < 6; v++) colors.push(color.r, color.g, color.b);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return new THREE.Mesh(geometry, groundMaterial);
}

function coverOf(state: GameState, x: number, y: number): Cover {
  const terrain = state.terrain[tileIndex(state, x, y)];
  return terrain === 'forest' && isFelled(state, { x, y }) ? 'stump' : terrain;
}

function tilesOf(state: GameState, { cover, variant, variants }: Scattered): Point[] {
  const tiles: Point[] = [];
  for (let y = 0; y < state.size; y++) {
    for (let x = 0; x < state.size; x++) if (coverOf(state, x, y) === cover && variantIndexAt(x, y, variants) === variant) tiles.push({ x, y });
  }
  return tiles;
}

function scatter(tiles: Point[], geometry: THREE.BufferGeometry, material: THREE.Material): THREE.InstancedMesh {
  const mesh = new THREE.InstancedMesh(geometry, material, tiles.length);
  const matrix = new THREE.Matrix4();
  tiles.forEach((tile, i) => {
    const jitterX = (tileHash(tile.x, tile.y) - 0.5) * 0.3;
    const jitterZ = (tileHash(tile.y, tile.x) - 0.5) * 0.3;
    matrix.makeTranslation(tile.x + 0.5 + jitterX, 0, tile.y + 0.5 + jitterZ);
    mesh.setMatrixAt(i, matrix);
  });
  return mesh;
}

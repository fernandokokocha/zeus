import * as THREE from 'three';
import type { Point } from '../sim/point';
import { tileIndex, type GameState } from '../sim/state';
import type { Terrain } from '../sim/terrain';
import { PALETTE, TERRAIN_COLORS, tileHash } from './palette';

const SHADE_VARIATION = 0.08;

export function createTerrainLayer(state: GameState): THREE.Group {
  const group = new THREE.Group();
  group.add(groundMesh(state));

  const forest = tilesOf(state, 'forest');
  group.add(scatter(forest, new THREE.ConeGeometry(0.32, 0.9, 6).translate(0, 0.75, 0), PALETTE.foliage));
  group.add(scatter(forest, new THREE.CylinderGeometry(0.06, 0.08, 0.3).translate(0, 0.15, 0), PALETTE.trunk));
  group.add(scatter(tilesOf(state, 'marble'), new THREE.DodecahedronGeometry(0.38).translate(0, 0.2, 0), PALETTE.marbleRock));
  group.add(scatter(tilesOf(state, 'copper'), new THREE.DodecahedronGeometry(0.32).translate(0, 0.15, 0), PALETTE.copperRock));
  return group;
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
  return new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({ vertexColors: true }));
}

function tilesOf(state: GameState, kind: Terrain): Point[] {
  const tiles: Point[] = [];
  state.terrain.forEach((terrain, i) => {
    if (terrain === kind) tiles.push({ x: i % state.size, y: Math.floor(i / state.size) });
  });
  return tiles;
}

function scatter(tiles: Point[], geometry: THREE.BufferGeometry, color: number): THREE.InstancedMesh {
  const mesh = new THREE.InstancedMesh(geometry, new THREE.MeshLambertMaterial({ color }), tiles.length);
  const matrix = new THREE.Matrix4();
  tiles.forEach((tile, i) => {
    const jitterX = (tileHash(tile.x, tile.y) - 0.5) * 0.3;
    const jitterZ = (tileHash(tile.y, tile.x) - 0.5) * 0.3;
    matrix.makeTranslation(tile.x + 0.5 + jitterX, 0, tile.y + 0.5 + jitterZ);
    mesh.setMatrixAt(i, matrix);
  });
  return mesh;
}

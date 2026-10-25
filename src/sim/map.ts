import { layMainRoad } from './main-road';
import type { Point } from './point';
import { createRng, type Rng } from './rng';
import type { Terrain } from './terrain';

export const MAP_SIZE = 100;
export const DEFAULT_SEED = 1500;

const COAST_START = 14;
const COAST_JITTER = 8;
const FOREST_THRESHOLD = 0.64;
const MEADOW_THRESHOLD = 0.6;
const DEPOSIT_RADIUS = 2;
const MARBLE_DEPOSITS = 4;
const COPPER_DEPOSITS = 3;
const DEPOSIT_MARGIN = 10;
const DEPOSIT_COAST_CLEARANCE = 25;

export function generateTerrain(seed: number): { terrain: Terrain[]; mainRoad: Point[] } {
  const rng = createRng(seed);
  const coast = noiseField(rng, 16);
  const forest = noiseField(rng, 10);
  const meadow = noiseField(rng, 12);

  const terrain: Terrain[] = [];
  for (let y = 0; y < MAP_SIZE; y++) {
    for (let x = 0; x < MAP_SIZE; x++) {
      if (x > MAP_SIZE - COAST_START + coast(x, y) * COAST_JITTER) terrain.push('water');
      else if (forest(x, y) > FOREST_THRESHOLD) terrain.push('forest');
      else if (meadow(x, y) > MEADOW_THRESHOLD) terrain.push('meadow');
      else terrain.push('grass');
    }
  }

  placeDeposits(rng, terrain, 'marble', MARBLE_DEPOSITS);
  placeDeposits(rng, terrain, 'copper', COPPER_DEPOSITS);

  const mainRoad = layMainRoad(rng, terrain, MAP_SIZE);
  return { terrain, mainRoad };
}

function placeDeposits(rng: Rng, terrain: Terrain[], kind: Terrain, count: number): void {
  for (let i = 0; i < count; i++) {
    const cx = DEPOSIT_MARGIN + Math.floor(rng() * (MAP_SIZE - DEPOSIT_MARGIN - DEPOSIT_COAST_CLEARANCE));
    const cy = DEPOSIT_MARGIN + Math.floor(rng() * (MAP_SIZE - 2 * DEPOSIT_MARGIN));
    for (let y = cy - DEPOSIT_RADIUS; y <= cy + DEPOSIT_RADIUS; y++) {
      for (let x = cx - DEPOSIT_RADIUS; x <= cx + DEPOSIT_RADIUS; x++) {
        if ((x - cx) ** 2 + (y - cy) ** 2 <= DEPOSIT_RADIUS ** 2) terrain[y * MAP_SIZE + x] = kind;
      }
    }
  }
}

function noiseField(rng: Rng, cellSize: number): (x: number, y: number) => number {
  const cells = Math.ceil(MAP_SIZE / cellSize) + 2;
  const corners = Array.from({ length: cells * cells }, () => rng());
  const corner = (cx: number, cy: number) => corners[cy * cells + cx];

  return (x, y) => {
    const fx = x / cellSize;
    const fy = y / cellSize;
    const cx = Math.floor(fx);
    const cy = Math.floor(fy);
    const tx = smoothstep(fx - cx);
    const ty = smoothstep(fy - cy);
    const top = lerp(corner(cx, cy), corner(cx + 1, cy), tx);
    const bottom = lerp(corner(cx, cy + 1), corner(cx + 1, cy + 1), tx);
    return lerp(top, bottom, ty);
  };
}

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

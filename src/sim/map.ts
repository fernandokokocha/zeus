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
const DEPOSIT_MARGIN = 10;
const DEPOSIT_COAST_CLEARANCE = 25;
const DEPOSIT_ROAD_CLEARANCE = 8;
const DEPOSIT_ATTEMPTS = 1000;
const DEPOSITS: ReadonlySet<Terrain> = new Set<Terrain>(['marble', 'copper']);

export interface Orientation {
  transpose: boolean;
  flipX: boolean;
  flipY: boolean;
}

export const ORIENTATIONS: Orientation[] = [false, true].flatMap((transpose) =>
  [false, true].flatMap((flipX) => [false, true].map((flipY) => ({ transpose, flipX, flipY }))),
);

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

  const mainRoad = layMainRoad(rng, terrain, MAP_SIZE);
  placeDeposit(rng, terrain, mainRoad, 'marble');
  placeDeposit(rng, terrain, mainRoad, 'copper');
  return orientMap(terrain, mainRoad, ORIENTATIONS[Math.floor(rng() * ORIENTATIONS.length)]);
}

export function orientMap(terrain: Terrain[], mainRoad: Point[], orientation: Orientation): { terrain: Terrain[]; mainRoad: Point[] } {
  const turn = (p: Point) => orientPoint(p, orientation);
  const turned = new Array<Terrain>(terrain.length);
  terrain.forEach((kind, i) => {
    const p = turn({ x: i % MAP_SIZE, y: Math.floor(i / MAP_SIZE) });
    turned[p.y * MAP_SIZE + p.x] = kind;
  });
  return { terrain: turned, mainRoad: mainRoad.map(turn) };
}

function orientPoint(p: Point, { transpose, flipX, flipY }: Orientation): Point {
  const { x, y } = transpose ? { x: p.y, y: p.x } : p;
  return { x: flipX ? MAP_SIZE - 1 - x : x, y: flipY ? MAP_SIZE - 1 - y : y };
}

function placeDeposit(rng: Rng, terrain: Terrain[], mainRoad: Point[], kind: Terrain): void {
  for (let attempt = 0; attempt < DEPOSIT_ATTEMPTS; attempt++) {
    const centre = {
      x: DEPOSIT_MARGIN + Math.floor(rng() * (MAP_SIZE - DEPOSIT_MARGIN - DEPOSIT_COAST_CLEARANCE)),
      y: DEPOSIT_MARGIN + Math.floor(rng() * (MAP_SIZE - 2 * DEPOSIT_MARGIN)),
    };
    const tiles = discAround(centre);
    if (tiles.every((p) => !DEPOSITS.has(terrain[p.y * MAP_SIZE + p.x]) && farFromRoad(p, mainRoad))) {
      for (const p of tiles) terrain[p.y * MAP_SIZE + p.x] = kind;
      return;
    }
  }
  throw new Error(`No room for a ${kind} deposit`);
}

function discAround(centre: Point): Point[] {
  const tiles: Point[] = [];
  for (let y = centre.y - DEPOSIT_RADIUS; y <= centre.y + DEPOSIT_RADIUS; y++) {
    for (let x = centre.x - DEPOSIT_RADIUS; x <= centre.x + DEPOSIT_RADIUS; x++) {
      if ((x - centre.x) ** 2 + (y - centre.y) ** 2 <= DEPOSIT_RADIUS ** 2) tiles.push({ x, y });
    }
  }
  return tiles;
}

function farFromRoad(p: Point, mainRoad: Point[]): boolean {
  return mainRoad.every((r) => Math.max(Math.abs(p.x - r.x), Math.abs(p.y - r.y)) > DEPOSIT_ROAD_CLEARANCE);
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

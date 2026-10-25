import type { Point } from './point';
import type { Rng } from './rng';
import type { Terrain } from './terrain';

export const MAIN_ROAD = {
  minHorizontalRuns: 3,
  maxHorizontalRuns: 5,
  minRun: 12,
  maxVerticalRun: 24,
  firstTurnX: 12,
  lastTurnX: 68,
};

export function layMainRoad(rng: Rng, terrain: Terrain[], size: number): Point[] {
  const band = { minY: size / 4, maxY: (size * 3) / 4 - 1 };
  const horizontalRuns = MAIN_ROAD.minHorizontalRuns + Math.floor(rng() * (MAIN_ROAD.maxHorizontalRuns - MAIN_ROAD.minHorizontalRuns + 1));
  let x = 0;
  let y = size / 2;
  const road: Point[] = [{ x, y }];

  for (const turnX of turnColumns(rng, horizontalRuns - 1)) {
    while (x < turnX) road.push({ x: ++x, y });
    const turnY = verticalRunEnd(rng, y, band);
    const step = Math.sign(turnY - y);
    while (y !== turnY) road.push({ x, y: (y += step) });
  }
  while (terrain[y * size + x + 1] !== 'water') road.push({ x: ++x, y });

  for (const p of road) terrain[p.y * size + p.x] = 'grass';
  return road;
}

function turnColumns(rng: Rng, count: number): number[] {
  const slack = MAIN_ROAD.lastTurnX - MAIN_ROAD.firstTurnX - (count - 1) * MAIN_ROAD.minRun;
  const offsets = Array.from({ length: count }, () => Math.floor(rng() * (slack + 1))).sort((a, b) => a - b);
  return offsets.map((offset, i) => MAIN_ROAD.firstTurnX + i * MAIN_ROAD.minRun + offset);
}

function verticalRunEnd(rng: Rng, y: number, band: { minY: number; maxY: number }): number {
  const steps = MAIN_ROAD.minRun + Math.floor(rng() * (MAIN_ROAD.maxVerticalRun - MAIN_ROAD.minRun + 1));
  const direction = rng() < 0.5 ? -1 : 1;
  const end = y + direction * steps;
  return end >= band.minY && end <= band.maxY ? end : y - direction * steps;
}

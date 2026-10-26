import type { Point } from './point';
import type { Rng } from './rng';
import type { Terrain } from './terrain';

export const MAIN_ROAD = {
  maxTurns: 2,
  minRun: 12,
  maxVerticalRun: 24,
  firstTurnX: 12,
  lastTurnX: 68,
  minEndX: 25,
  maxEndX: 115,
};

export function layMainRoad(rng: Rng, terrain: Terrain[], size: number): Point[] {
  const band = { minY: size / 4, maxY: (size * 3) / 4 - 1 };
  const endX = MAIN_ROAD.minEndX + Math.floor(rng() * (MAIN_ROAD.maxEndX - MAIN_ROAD.minEndX + 1));
  const lastTurnX = Math.min(endX - MAIN_ROAD.minRun, MAIN_ROAD.lastTurnX);
  const turnsThatFit = 1 + Math.floor((lastTurnX - MAIN_ROAD.firstTurnX) / MAIN_ROAD.minRun);
  const turns = 1 + Math.floor(rng() * Math.min(turnsThatFit, MAIN_ROAD.maxTurns));
  const direction = rng() < 0.5 ? -1 : 1;
  let x = 0;
  let y = size / 2;
  const road: Point[] = [{ x, y }];

  turnColumns(rng, turns, lastTurnX).forEach((turnX, i) => {
    while (x < turnX) road.push({ x: ++x, y });
    const room = direction > 0 ? band.maxY - y : y - band.minY;
    const turnY = y + direction * verticalRun(rng, room, turns - i);
    while (y !== turnY) road.push({ x, y: (y += direction) });
  });
  while (x < endX && terrain[y * size + x + 1] !== 'water') road.push({ x: ++x, y });

  for (const p of road) terrain[p.y * size + p.x] = 'grass';
  return road;
}

function turnColumns(rng: Rng, count: number, lastTurnX: number): number[] {
  const slack = lastTurnX - MAIN_ROAD.firstTurnX - (count - 1) * MAIN_ROAD.minRun;
  const offsets = Array.from({ length: count }, () => Math.floor(rng() * (slack + 1))).sort((a, b) => a - b);
  return offsets.map((offset, i) => MAIN_ROAD.firstTurnX + i * MAIN_ROAD.minRun + offset);
}

function verticalRun(rng: Rng, room: number, turnsLeft: number): number {
  const longest = Math.min(MAIN_ROAD.maxVerticalRun, room - (turnsLeft - 1) * MAIN_ROAD.minRun);
  return MAIN_ROAD.minRun + Math.floor(rng() * (longest - MAIN_ROAD.minRun + 1));
}

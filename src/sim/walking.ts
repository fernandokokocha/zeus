import { TICKS_PER_MONTH } from './clock';
import type { Point } from './point';
import { tileIndex, type GameState, type Walk } from './state';

export const WALKER_TILES_PER_MONTH = 54.4;
export const WALKER_TILES_PER_TICK = WALKER_TILES_PER_MONTH / TICKS_PER_MONTH;

const STANDING_FACING: Point = { x: 0, y: 1 };

export function isRoad(state: GameState, p: Point): boolean {
  return state.roads[tileIndex(state, p.x, p.y)];
}

export function walkerTile(walk: Walk): Point {
  const ahead = walk.progress >= 0.5 && walk.step < walk.path.length - 1;
  return walk.path[ahead ? walk.step + 1 : walk.step];
}

export function walkerPosition(walk: Walk, lookAhead: number): Point & { facing: Point } {
  const lastStep = walk.path.length - 1;
  if (lastStep === 0) return { ...walk.path[0], facing: STANDING_FACING };
  const travelled = Math.min(walk.step + walk.progress + lookAhead, lastStep);
  const step = Math.min(Math.floor(travelled), lastStep - 1);
  const from = walk.path[step];
  const to = walk.path[step + 1];
  const t = travelled - step;
  return {
    x: from.x + (to.x - from.x) * t,
    y: from.y + (to.y - from.y) * t,
    facing: { x: to.x - from.x, y: to.y - from.y },
  };
}

export function walkPath(state: GameState, walk: Walk, replan: () => boolean, arrive: () => void): void {
  walk.progress += WALKER_TILES_PER_TICK;
  while (walk.progress >= 1 && walk.step < walk.path.length - 1) {
    if (!isRoad(state, walk.path[walk.step + 1]) && !replan()) return;
    if (walk.step === walk.path.length - 1) break;
    walk.step++;
    walk.progress--;
  }
  if (walk.step === walk.path.length - 1) arrive();
}

import { addRingAppeal, appealMap } from './appeal';
import { roadPath, type Result } from './commands';
import { UNITS_PER_LOAD } from './food';
import type { Point } from './point';
import { recordConstruction, storedMarble, takeStoredMarble } from './sanctuaries';
import { inBounds, tileIndex, type GameState } from './state';

export type RoadUpgrade = 'ornate' | 'fast';

export interface RoadUpgradeSpec {
  name: string;
  marbleLoads: number;
  minAppeal: number | null;
  appeal: number[];
  speed: number;
}

export const ROAD_UPGRADE_SPECS: Record<RoadUpgrade, RoadUpgradeSpec> = {
  ornate: { name: 'Ornate Road', marbleLoads: 1, minAppeal: 25, appeal: [2, 1], speed: 1 },
  fast: { name: 'Fast Road', marbleLoads: 1, minAppeal: null, appeal: [], speed: 1.5 },
};

export interface UpgradePlan {
  taken: Point[];
  skipped: { at: Point; reason: string }[];
}

const NO_MARBLE = 'No marble in storehouses';

export function roadUpgradeAt(state: GameState, p: Point): RoadUpgrade | null {
  return state.roadUpgrades[tileIndex(state, p.x, p.y)];
}

export function upgradeObstacle(state: GameState, kind: RoadUpgrade, p: Point, appeal: number[]): string | null {
  const i = tileIndex(state, p.x, p.y);
  if (!state.roads[i]) return 'An upgrade goes on a road';
  if (state.mainRoad[i]) return 'The Main Road cannot be upgraded';
  if (state.roadUpgrades[i]) return 'Already upgraded';
  const { name, minAppeal } = ROAD_UPGRADE_SPECS[kind];
  if (minAppeal !== null && appeal[i] < minAppeal) return `${name} needs appeal ${minAppeal} (has ${appeal[i]})`;
  return null;
}

export function canBeOrnate(state: GameState, p: Point, appeal: number[]): boolean {
  return upgradeObstacle(state, 'ornate', p, appeal) === null;
}

export function upgradePlan(state: GameState, kind: RoadUpgrade, from: Point, to: Point): UpgradePlan {
  const appeal = appealMap(state);
  const marbleUnits = ROAD_UPGRADE_SPECS[kind].marbleLoads * UNITS_PER_LOAD;
  let marble = storedMarble(state);
  const plan: UpgradePlan = { taken: [], skipped: [] };
  for (const p of roadPath(from, to).filter((p) => inBounds(state, p.x, p.y))) {
    const obstacle = upgradeObstacle(state, kind, p, appeal) ?? (marble < marbleUnits ? NO_MARBLE : null);
    if (obstacle) {
      plan.skipped.push({ at: p, reason: obstacle });
      continue;
    }
    plan.taken.push(p);
    marble -= marbleUnits;
    addRingAppeal(state, appeal, { x: p.x, y: p.y, width: 1, height: 1 }, ROAD_UPGRADE_SPECS[kind].appeal);
  }
  return plan;
}

export function upgradeRoads(state: GameState, kind: RoadUpgrade, from: Point, to: Point): Result {
  const { taken, skipped } = upgradePlan(state, kind, from, to);
  if (taken.length === 0) return { ok: false, reason: skipped[0].reason };
  const marble = taken.length * ROAD_UPGRADE_SPECS[kind].marbleLoads * UNITS_PER_LOAD;
  takeStoredMarble(state, marble);
  recordConstruction(state, 'marble', marble);
  for (const p of taken) state.roadUpgrades[tileIndex(state, p.x, p.y)] = kind;
  state.version++;
  return { ok: true };
}

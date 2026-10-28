import { postNotice } from './notices';
import { population } from './settlers';
import type { GameState } from './state';

export type MonumentKind = 'crowdedCity' | 'tradeRoute';

export const MONUMENT_NAMES: Record<MonumentKind, string> = { crowdedCity: '1,000 citizens', tradeRoute: 'trade route' };

export const MONUMENT_POPULATION = 1000;
export const MONUMENT_EARNED_NOTICE = 'The city has grown to 1,000 citizens. A monument can be raised.';

export function earnMonuments(state: GameState): void {
  if (state.crowdedCityEarned || population(state) < MONUMENT_POPULATION) return;
  state.crowdedCityEarned = true;
  state.monumentsToPlace.push('crowdedCity');
  postNotice(state, MONUMENT_EARNED_NOTICE, null);
}

export function monumentsWaiting(state: GameState, kind: MonumentKind): number {
  return state.monumentsToPlace.filter((waiting) => waiting === kind).length;
}

export function monumentObstacle(state: GameState, kind: MonumentKind): string | null {
  return monumentsWaiting(state, kind) > 0 ? null : `No ${MONUMENT_NAMES[kind]} monument is waiting`;
}

export function takeMonument(state: GameState, kind: MonumentKind): void {
  const at = state.monumentsToPlace.indexOf(kind);
  if (at === -1) throw new Error(`No ${kind} monument is waiting`);
  state.monumentsToPlace.splice(at, 1);
}

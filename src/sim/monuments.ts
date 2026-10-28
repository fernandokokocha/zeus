import { postNotice } from './notices';
import { population } from './settlers';
import type { GameState } from './state';

export type MonumentKind = 'crowdedCity' | 'tradeRoute';

export const MONUMENT_POPULATION = 1000;
export const MONUMENT_EARNED_NOTICE = 'The city has grown to 1,000 citizens. A monument can be raised.';

export function earnMonuments(state: GameState): void {
  if (state.crowdedCityEarned || population(state) < MONUMENT_POPULATION) return;
  state.crowdedCityEarned = true;
  state.monumentsToPlace.push('crowdedCity');
  postNotice(state, MONUMENT_EARNED_NOTICE, null);
}

export function monumentObstacle(state: GameState): string | null {
  return state.monumentsToPlace.length > 0 ? null : 'No monument has been earned yet';
}

export function takeMonument(state: GameState): MonumentKind {
  const kind = state.monumentsToPlace.shift();
  if (kind === undefined) throw new Error('No monument has been earned');
  return kind;
}

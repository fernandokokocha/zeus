import { postNotice } from './notices';
import { population } from './settlers';
import type { GameState } from './state';

export type MonumentKind = 'crowdedCity' | 'greatCity' | 'tradeRoute';

export interface EarnedMonument {
  kind: MonumentKind;
  honours: string;
}

export interface RaisedMonument extends EarnedMonument {
  raisedAt: number;
}

export const MONUMENT_NAMES: Record<MonumentKind, string> = { crowdedCity: '1,000 citizens', greatCity: '2,000 citizens', tradeRoute: 'trade route' };

const POPULATION_MONUMENTS: { kind: MonumentKind; population: number }[] = [
  { kind: 'crowdedCity', population: 1000 },
  { kind: 'greatCity', population: 2000 },
];

export function earnMonuments(state: GameState): void {
  const reached = population(state);
  for (const { kind, population: needed } of POPULATION_MONUMENTS) {
    if (state.populationMonumentsEarned.includes(kind) || reached < needed) continue;
    const citizens = `${needed.toLocaleString('en-US')} citizens`;
    state.populationMonumentsEarned.push(kind);
    state.monumentsToPlace.push({ kind, honours: `the city reaching ${citizens}` });
    postNotice(state, `The city has grown to ${citizens}. A monument can be raised.`, null);
  }
}

export function monumentsWaiting(state: GameState, kind: MonumentKind): number {
  return state.monumentsToPlace.filter((waiting) => waiting.kind === kind).length;
}

export function monumentObstacle(state: GameState, kind: MonumentKind): string | null {
  return monumentsWaiting(state, kind) > 0 ? null : `No ${MONUMENT_NAMES[kind]} monument is waiting`;
}

export function takeMonument(state: GameState, kind: MonumentKind): EarnedMonument {
  const at = state.monumentsToPlace.findIndex((waiting) => waiting.kind === kind);
  if (at === -1) throw new Error(`No ${kind} monument is waiting`);
  return state.monumentsToPlace.splice(at, 1)[0];
}

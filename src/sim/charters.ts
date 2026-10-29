import { CULTURES } from './culture';
import { monthlyUse } from './food';
import { ELITE_NAMES, buildingName, houseLevel, type EliteType } from './housing';
import { postNotice } from './notices';
import { hasService } from './roamers';
import type { Building, GameState, PeddledGood } from './state';

export const WELL_DRESSED_MONTHS = 24;
export const LEARNED_CITY_MONTHS = 24;
const NO_TOWNHOUSE = 'no Townhouse in the city';
const DRESS_GOODS: PeddledGood[] = ['fleece', 'oil'];

export interface CharterCount {
  months: number;
  reset: { tick: number; cause: string } | null;
}

export interface Charter {
  name: string;
  months: number;
  progress: 'wellDressed' | 'learnedCity';
  grants: EliteType;
  missed(state: GameState, house: Building): string | null;
}

export const WELL_DRESSED: Charter = {
  name: 'Well dressed',
  months: WELL_DRESSED_MONTHS,
  progress: 'wellDressed',
  grants: 'tradersGuild',
  missed: (_state, house) => {
    const good = DRESS_GOODS.find((g) => monthEmptiesStock(house, g));
    return good ? `ran out of ${good}` : null;
  },
};

export const LEARNED_CITY: Charter = {
  name: 'Learned city',
  months: LEARNED_CITY_MONTHS,
  progress: 'learnedCity',
  grants: 'scholarsHouse',
  missed: (state, house) => {
    const culture = CULTURES.find((c) => !hasService(state, house, c));
    return culture ? `missed ${culture}` : null;
  },
};

export const CHARTERS = [WELL_DRESSED, LEARNED_CITY];

export function tallyWellDressed(state: GameState): void {
  tally(state, WELL_DRESSED);
}

export function tallyLearnedCity(state: GameState): void {
  tally(state, LEARNED_CITY);
}

function tally(state: GameState, charter: Charter): void {
  const townhouses = state.buildings.filter(countsAsTownhouse);
  if (townhouses.length === 0) {
    if (state[charter.progress].months > 0) reset(state, charter, NO_TOWNHOUSE);
    return;
  }
  const cause = firstMiss(state, charter, townhouses);
  if (cause !== null) {
    reset(state, charter, cause);
    return;
  }
  state[charter.progress].months++;
  if (state[charter.progress].months < charter.months) return;
  state[charter.progress] = { months: 0, reset: null };
  state.permits[charter.grants]++;
  postNotice(state, `Charter complete: ${charter.name}. A ${ELITE_NAMES[charter.grants]} permit is granted`, null);
}

function reset(state: GameState, charter: Charter, cause: string): void {
  state[charter.progress] = { months: 0, reset: { tick: state.tick, cause } };
}

function countsAsTownhouse(building: Building): boolean {
  return building.type === 'tradersGuild' || (building.type === 'house' && houseLevel(building) === 'townhouse');
}

function firstMiss(state: GameState, charter: Charter, townhouses: Building[]): string | null {
  for (const house of townhouses) {
    const miss = charter.missed(state, house);
    if (miss) return `${buildingName(house)} at ${house.x},${house.y} ${miss}`;
  }
  return null;
}

function monthEmptiesStock(house: Building, good: PeddledGood): boolean {
  return house[good] <= monthlyUse(house, good);
}

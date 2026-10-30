import { CULTURES } from './culture';
import { TICKS_PER_MONTH } from './clock';
import { monthlyUse } from './food';
import { PERMIT_NAMES, buildingName, houseLevel, isElite, type PermitType } from './housing';
import { postNotice } from './notices';
import { hasService } from './roamers';
import type { Building, GameState, PeddledGood } from './state';

export const WELL_DRESSED_MONTHS = 24;
export const LEARNED_CITY_MONTHS = 24;
export const HEALTHY_AND_WELL_FED_MONTHS = 24;
const NO_TOWNHOUSE = 'no Townhouse in the city';
const DRESS_GOODS: PeddledGood[] = ['fleece', 'oil'];

export interface CharterCount {
  months: number;
  reset: { tick: number; cause: string } | null;
}

export interface Charter {
  name: string;
  months: number;
  progress: 'wellDressed' | 'learnedCity' | 'healthyAndWellFed';
  grants: PermitType;
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

export const HEALTHY_AND_WELL_FED: Charter = {
  name: 'Healthy and well fed',
  months: HEALTHY_AND_WELL_FED_MONTHS,
  progress: 'healthyAndWellFed',
  grants: 'warriorsHouse',
  missed: (state, house) => {
    if (monthEmptiesStock(house, 'food')) return 'ran out of food';
    if (house.sick || fellSickThisMonth(state, house)) return 'fell sick';
    return null;
  },
};

export const CHARTERS = [WELL_DRESSED, LEARNED_CITY, HEALTHY_AND_WELL_FED];

export function tallyWellDressed(state: GameState): void {
  tally(state, WELL_DRESSED);
}

export function tallyLearnedCity(state: GameState): void {
  tally(state, LEARNED_CITY);
}

export function tallyHealthyAndWellFed(state: GameState): void {
  tally(state, HEALTHY_AND_WELL_FED);
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
  postNotice(state, `Charter complete: ${charter.name}. A ${PERMIT_NAMES[charter.grants]} permit is granted`, null);
}

function reset(state: GameState, charter: Charter, cause: string): void {
  state[charter.progress] = { months: 0, reset: { tick: state.tick, cause } };
}

function countsAsTownhouse(building: Building): boolean {
  return isElite(building) || (building.type === 'house' && houseLevel(building) === 'townhouse');
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

function fellSickThisMonth(state: GameState, house: Building): boolean {
  return house.fellSickAt !== null && state.tick - house.fellSickAt <= TICKS_PER_MONTH;
}

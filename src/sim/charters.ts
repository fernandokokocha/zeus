import { CULTURES } from './culture';
import { TICKS_PER_MONTH } from './clock';
import { monthlyUse } from './food';
import { ELITE_NAMES, HOUSE_LEVELS, buildingName, houseLevel, isElite, isResidence, residentNeeds, type EliteType } from './housing';
import { postNotice } from './notices';
import { hasService } from './roamers';
import { population } from './settlers';
import type { Building, GameState, PeddledGood } from './state';

export const WELL_DRESSED_MONTHS = 24;
export const LEARNED_CITY_MONTHS = 24;
export const HEALTHY_AND_WELL_FED_MONTHS = 24;
export const HEALTHY_AND_WELL_FED_POPULATION = 1000;
const DRESS_GOODS: PeddledGood[] = ['fleece', 'oil'];

export interface CharterCount {
  months: number;
  reset: { tick: number; cause: string } | null;
}

export interface CharterCondition {
  label: string;
  unmet(state: GameState): string | null;
}

export interface Charter {
  name: string;
  months: number;
  progress: 'wellDressed' | 'learnedCity' | 'healthyAndWellFed';
  grants: EliteType;
  requires: CharterCondition[];
  keeps: CharterCondition[];
}

export const WELL_DRESSED: Charter = {
  name: 'Well dressed',
  months: WELL_DRESSED_MONTHS,
  progress: 'wellDressed',
  grants: 'tradersGuild',
  requires: [
    {
      label: 'The city has a Townhouse',
      unmet: (state) => (state.buildings.some(countsAsTownhouse) ? null : 'no Townhouse in the city'),
    },
  ],
  keeps: [
    {
      label: 'No house that wears fleece or oil runs out of it',
      unmet: (state) =>
        firstHouseMissing(state, (house) => {
          const good = DRESS_GOODS.find((g) => runsOut(house, g));
          return good ? `ran out of ${good}` : null;
        }),
    },
  ],
};

export const LEARNED_CITY: Charter = {
  name: 'Learned city',
  months: LEARNED_CITY_MONTHS,
  progress: 'learnedCity',
  grants: 'scholarsHouse',
  requires: [
    {
      label: 'The city has a house from Hovel up',
      unmet: (state) => (state.buildings.some(wantsCulture) ? null : 'no house from Hovel up in the city'),
    },
  ],
  keeps: [
    {
      label: 'Every house from Hovel up has philosophy, athletics and drama',
      unmet: (state) =>
        firstHouseMissing(state, (house) => {
          if (!wantsCulture(house)) return null;
          const culture = CULTURES.find((c) => !hasService(state, house, c));
          return culture ? `missed ${culture}` : null;
        }),
    },
  ],
};

export const HEALTHY_AND_WELL_FED: Charter = {
  name: 'Healthy and well fed',
  months: HEALTHY_AND_WELL_FED_MONTHS,
  progress: 'healthyAndWellFed',
  grants: 'warriorsHouse',
  requires: [
    {
      label: 'The city has a staffed Infirmary',
      unmet: (state) => (state.buildings.some((b) => b.type === 'infirmary' && b.workers > 0) ? null : 'no staffed Infirmary in the city'),
    },
    {
      label: `At least ${HEALTHY_AND_WELL_FED_POPULATION} people live in the city`,
      unmet: (state) =>
        population(state) >= HEALTHY_AND_WELL_FED_POPULATION ? null : `fewer than ${HEALTHY_AND_WELL_FED_POPULATION} people in the city`,
    },
  ],
  keeps: [
    {
      label: 'No house runs out of food',
      unmet: (state) => firstHouseMissing(state, (house) => (runsOut(house, 'food') ? 'ran out of food' : null)),
    },
    {
      label: 'No house falls sick',
      unmet: (state) => firstHouseMissing(state, (house) => (house.sick || fellSickThisMonth(state, house) ? 'fell sick' : null)),
    },
  ],
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
  const missing = firstUnmet(state, charter.requires);
  if (missing !== null) {
    if (state[charter.progress].months > 0) reset(state, charter, missing);
    return;
  }
  const cause = firstUnmet(state, charter.keeps);
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

function firstUnmet(state: GameState, conditions: CharterCondition[]): string | null {
  for (const condition of conditions) {
    const cause = condition.unmet(state);
    if (cause !== null) return cause;
  }
  return null;
}

function reset(state: GameState, charter: Charter, cause: string): void {
  state[charter.progress] = { months: 0, reset: { tick: state.tick, cause } };
}

function countsAsTownhouse(building: Building): boolean {
  return isElite(building) || (building.type === 'house' && houseLevel(building) === 'townhouse');
}

function wantsCulture(building: Building): boolean {
  if (isElite(building)) return true;
  const level = building.type === 'house' ? houseLevel(building) : null;
  return level !== null && HOUSE_LEVELS[level].culture > 0;
}

function firstHouseMissing(state: GameState, miss: (house: Building) => string | null): string | null {
  for (const house of state.buildings.filter(isOccupiedResidence)) {
    const missed = miss(house);
    if (missed) return `${buildingName(house)} at ${house.x},${house.y} ${missed}`;
  }
  return null;
}

function isOccupiedResidence(building: Building): boolean {
  return isResidence(building) && building.residents > 0;
}

function runsOut(house: Building, good: PeddledGood): boolean {
  return residentNeeds(house).includes(good) && house[good] <= monthlyUse(house, good);
}

function fellSickThisMonth(state: GameState, house: Building): boolean {
  return house.fellSickAt !== null && state.tick - house.fellSickAt <= TICKS_PER_MONTH;
}

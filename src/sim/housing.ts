import { appealMap, houseAppeal } from './appeal';
import { culturePoints } from './culture';
import { hasService } from './roamers';
import type { Building, GameState } from './state';

export type HouseLevel = 'hut' | 'shack' | 'hovel' | 'homestead' | 'tenement';

export type HouseNeed = 'food' | 'water' | 'fleece';

export interface HouseLevelSpec {
  name: string;
  capacity: number;
  needs: HouseNeed[];
  culture: number;
  taxMultiplier: number;
  appeal: { evolve: number; devolve: number };
}

export const HOUSE_LEVELS: Record<HouseLevel, HouseLevelSpec> = {
  hut: { name: 'Hut', capacity: 8, needs: [], culture: 0, taxMultiplier: 1, appeal: { evolve: -10, devolve: -99 } },
  shack: { name: 'Shack', capacity: 16, needs: ['food'], culture: 0, taxMultiplier: 1, appeal: { evolve: 0, devolve: -12 } },
  hovel: { name: 'Hovel', capacity: 24, needs: ['food', 'water'], culture: 15, taxMultiplier: 1, appeal: { evolve: 10, devolve: -2 } },
  homestead: {
    name: 'Homestead',
    capacity: 32,
    needs: ['food', 'water', 'fleece'],
    culture: 15,
    taxMultiplier: 2,
    appeal: { evolve: 10, devolve: -2 },
  },
  tenement: {
    name: 'Tenement',
    capacity: 40,
    needs: ['food', 'water', 'fleece'],
    culture: 35,
    taxMultiplier: 2,
    appeal: { evolve: 20, devolve: 5 },
  },
};

export const NEXT_LEVEL: Record<HouseLevel, HouseLevel | null> = {
  hut: 'shack',
  shack: 'hovel',
  hovel: 'homestead',
  homestead: 'tenement',
  tenement: null,
};
export const PREVIOUS_LEVEL: Record<HouseLevel, HouseLevel | null> = {
  hut: null,
  shack: 'hut',
  hovel: 'shack',
  homestead: 'hovel',
  tenement: 'homestead',
};

export const VACANT_LOT_NAME = 'Vacant Lot';

export function houseLevel(house: Building): HouseLevel | null {
  return house.residents > 0 ? house.level : null;
}

export function houseCapacity(house: Building): number {
  return HOUSE_LEVELS[houseLevel(house) ?? 'hut'].capacity;
}

export function houseName(house: Building): string {
  const level = houseLevel(house);
  return level ? HOUSE_LEVELS[level].name : VACANT_LOT_NAME;
}

function hasNeed(state: GameState, house: Building, need: HouseNeed): boolean {
  return need === 'water' ? hasService(state, house, need) : house[need] > 0;
}

export function missingNeeds(state: GameState, house: Building, level: HouseLevel): HouseNeed[] {
  return HOUSE_LEVELS[level].needs.filter((need) => !hasNeed(state, house, need));
}

export function lacksCulture(state: GameState, house: Building, level: HouseLevel): boolean {
  return culturePoints(state, house) < HOUSE_LEVELS[level].culture;
}

function meetsNeeds(state: GameState, house: Building, level: HouseLevel): boolean {
  return missingNeeds(state, house, level).length === 0 && !lacksCulture(state, house, level);
}

export function evolveHouses(state: GameState): void {
  const map = appealMap(state);
  for (const house of state.buildings) {
    const level = houseLevel(house);
    if (!level) continue;
    const appeal = houseAppeal(state, house, map);
    const previous = PREVIOUS_LEVEL[level];
    const next = NEXT_LEVEL[level];
    if (previous && (!meetsNeeds(state, house, level) || appeal <= HOUSE_LEVELS[level].appeal.devolve)) {
      setLevel(state, house, previous);
    } else if (next && meetsNeeds(state, house, next) && appeal >= HOUSE_LEVELS[next].appeal.evolve) {
      setLevel(state, house, next);
    }
  }
}

function setLevel(state: GameState, house: Building, level: HouseLevel): void {
  house.level = level;
  house.residents = Math.min(house.residents, HOUSE_LEVELS[level].capacity);
  state.version++;
}

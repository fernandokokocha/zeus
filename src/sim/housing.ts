import { appealMap, houseAppeal } from './appeal';
import type { Building, GameState } from './state';

export type HouseLevel = 'hut' | 'shack';

export type HouseNeed = 'food';

export interface HouseLevelSpec {
  name: string;
  capacity: number;
  needs: HouseNeed[];
  taxMultiplier: number;
  appeal: { evolve: number; devolve: number };
}

export const HOUSE_LEVELS: Record<HouseLevel, HouseLevelSpec> = {
  hut: { name: 'Hut', capacity: 8, needs: [], taxMultiplier: 1, appeal: { evolve: -10, devolve: -99 } },
  shack: { name: 'Shack', capacity: 16, needs: ['food'], taxMultiplier: 1, appeal: { evolve: 0, devolve: -12 } },
};

export const NEXT_LEVEL: Record<HouseLevel, HouseLevel | null> = { hut: 'shack', shack: null };
export const PREVIOUS_LEVEL: Record<HouseLevel, HouseLevel | null> = { hut: null, shack: 'hut' };

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

export function missingNeeds(house: Building, level: HouseLevel): HouseNeed[] {
  return HOUSE_LEVELS[level].needs.filter((need) => need === 'food' && house.food <= 0);
}

export function evolveHouses(state: GameState): void {
  const map = appealMap(state);
  for (const house of state.buildings) {
    const level = houseLevel(house);
    if (!level) continue;
    const appeal = houseAppeal(state, house, map);
    const previous = PREVIOUS_LEVEL[level];
    const next = NEXT_LEVEL[level];
    if (previous && (missingNeeds(house, level).length > 0 || appeal <= HOUSE_LEVELS[level].appeal.devolve)) {
      setLevel(state, house, previous);
    } else if (next && missingNeeds(house, next).length === 0 && appeal >= HOUSE_LEVELS[next].appeal.evolve) {
      setLevel(state, house, next);
    }
  }
}

function setLevel(state: GameState, house: Building, level: HouseLevel): void {
  house.level = level;
  house.residents = Math.min(house.residents, HOUSE_LEVELS[level].capacity);
  state.version++;
}

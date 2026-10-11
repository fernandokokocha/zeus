import type { Building } from './state';

export type HouseLevel = 'hut' | 'shack';

export interface HouseLevelSpec {
  name: string;
  capacity: number;
  needs: string[];
}

export const HOUSE_LEVELS: Record<HouseLevel, HouseLevelSpec> = {
  hut: { name: 'Hut', capacity: 8, needs: [] },
  shack: { name: 'Shack', capacity: 16, needs: ['food'] },
};

export const NEXT_LEVEL: Record<HouseLevel, HouseLevel | null> = { hut: 'shack', shack: null };

export const VACANT_LOT_NAME = 'Vacant Lot';

export function houseLevel(house: Building): HouseLevel | null {
  return house.residents > 0 ? 'hut' : null;
}

export function houseCapacity(house: Building): number {
  return HOUSE_LEVELS[houseLevel(house) ?? 'hut'].capacity;
}

export function houseName(house: Building): string {
  const level = houseLevel(house);
  return level ? HOUSE_LEVELS[level].name : VACANT_LOT_NAME;
}

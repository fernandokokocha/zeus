import { appealMap, houseAppeal } from './appeal';
import { BUILDING_SPECS } from './buildings';
import { culturePoints } from './culture';
import { hasService } from './roamers';
import { TICKS_PER_MONTH } from './clock';
import { postNotice } from './notices';
import type { Building, GameState } from './state';

export type HouseLevel = 'hut' | 'shack' | 'hovel' | 'homestead' | 'tenement' | 'apartment' | 'townhouse';

export type HouseNeed = 'food' | 'water' | 'fleece' | 'oil';
export type ResidentNeed = HouseNeed | 'cloth';

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
  apartment: {
    name: 'Apartment',
    capacity: 48,
    needs: ['food', 'water', 'fleece', 'oil'],
    culture: 35,
    taxMultiplier: 2,
    appeal: { evolve: 30, devolve: 15 },
  },
  townhouse: {
    name: 'Townhouse',
    capacity: 60,
    needs: ['food', 'water', 'fleece', 'oil'],
    culture: 45,
    taxMultiplier: 2,
    appeal: { evolve: 100, devolve: 25 },
  },
};

const ELITE_HOUSES = 4;

export const TRADERS_GUILD = {
  houses: ELITE_HOUSES,
  capacity: ELITE_HOUSES * HOUSE_LEVELS.townhouse.capacity,
  taxMultiplier: 1,
  needs: [...HOUSE_LEVELS.townhouse.needs, 'cloth'] as ResidentNeed[],
  culture: HOUSE_LEVELS.townhouse.culture,
  appeal: HOUSE_LEVELS.townhouse.appeal.devolve,
};

export const NEXT_LEVEL: Record<HouseLevel, HouseLevel | null> = {
  hut: 'shack',
  shack: 'hovel',
  hovel: 'homestead',
  homestead: 'tenement',
  tenement: 'apartment',
  apartment: 'townhouse',
  townhouse: null,
};
export const PREVIOUS_LEVEL: Record<HouseLevel, HouseLevel | null> = {
  hut: null,
  shack: 'hut',
  hovel: 'shack',
  homestead: 'hovel',
  tenement: 'homestead',
  apartment: 'tenement',
  townhouse: 'apartment',
};

export const LEVEL_CHANGE_TICKS = TICKS_PER_MONTH;

export const VACANT_LOT_NAME = 'Vacant Lot';

export function houseLevel(house: Building): HouseLevel | null {
  return house.residents > 0 ? house.level : null;
}

export function houseCapacity(house: Building): number {
  if (house.type === 'tradersGuild') return TRADERS_GUILD.capacity;
  return HOUSE_LEVELS[houseLevel(house) ?? 'hut'].capacity;
}

export function taxMultiplier(residence: Building, level: HouseLevel): number {
  return residence.type === 'tradersGuild' ? TRADERS_GUILD.taxMultiplier : HOUSE_LEVELS[level].taxMultiplier;
}

export function houseName(house: Building): string {
  const level = houseLevel(house);
  return level ? HOUSE_LEVELS[level].name : VACANT_LOT_NAME;
}

export function isResidence(building: Building): boolean {
  return building.type === 'house' || building.type === 'tradersGuild';
}

export function residentNeeds(residence: Building): ResidentNeed[] {
  if (residence.type === 'tradersGuild') return TRADERS_GUILD.needs;
  const level = houseLevel(residence);
  return level ? HOUSE_LEVELS[level].needs : [];
}

export function buildingName(building: Building): string {
  return building.type === 'house' ? houseName(building) : BUILDING_SPECS[building.type].name;
}

export function hasNeed(state: GameState, house: Building, need: ResidentNeed): boolean {
  return need === 'water' ? hasService(state, house, need) : house[need] > 0;
}

export function missingNeeds(state: GameState, house: Building, level: HouseLevel): HouseNeed[] {
  return HOUSE_LEVELS[level].needs.filter((need) => !hasNeed(state, house, need));
}

export function lacksCulture(state: GameState, house: Building, level: HouseLevel): boolean {
  return culturePoints(state, house) < HOUSE_LEVELS[level].culture;
}

export type EvolutionBlocker =
  | { kind: 'need'; need: HouseNeed }
  | { kind: 'culture' | 'appeal'; needs: number; has: number };

export function evolutionBlockers(state: GameState, house: Building, level: HouseLevel, next: HouseLevel, appeal: number): EvolutionBlocker[] {
  const blockers: EvolutionBlocker[] = missingNeeds(state, house, next).map((need) => ({ kind: 'need', need }));
  if (lacksCulture(state, house, next)) blockers.push({ kind: 'culture', needs: HOUSE_LEVELS[next].culture, has: culturePoints(state, house) });
  const { evolve } = HOUSE_LEVELS[level].appeal;
  if (appeal < evolve) blockers.push({ kind: 'appeal', needs: evolve, has: appeal });
  return blockers;
}

function meetsNeeds(state: GameState, house: Building, level: HouseLevel): boolean {
  return missingNeeds(state, house, level).length === 0 && !lacksCulture(state, house, level);
}

export function evolveHouses(state: GameState): void {
  const map = appealMap(state);
  for (const house of state.buildings.filter((b) => b.type === 'house')) {
    const level = houseLevel(house);
    if (!level) continue;
    const target = levelWanted(state, house, level, houseAppeal(state, house, map));
    if (target !== house.pendingLevel) {
      house.pendingLevel = target;
      house.pendingTicks = 0;
    }
    if (!target) continue;
    house.pendingTicks++;
    if (house.pendingTicks >= LEVEL_CHANGE_TICKS) setLevel(state, house, target);
  }
}

function levelWanted(state: GameState, house: Building, level: HouseLevel, appeal: number): HouseLevel | null {
  const previous = PREVIOUS_LEVEL[level];
  const next = NEXT_LEVEL[level];
  if (previous && (!meetsNeeds(state, house, level) || appeal <= HOUSE_LEVELS[level].appeal.devolve)) return previous;
  if (next && meetsNeeds(state, house, next) && appeal >= HOUSE_LEVELS[level].appeal.evolve) return next;
  return null;
}

function setLevel(state: GameState, house: Building, level: HouseLevel): void {
  if (level === PREVIOUS_LEVEL[house.level]) postDevolved(state, house, level);
  house.level = level;
  house.residents = Math.min(house.residents, HOUSE_LEVELS[level].capacity);
  house.pendingLevel = null;
  house.pendingTicks = 0;
  state.version++;
}

function postDevolved(state: GameState, house: Building, level: HouseLevel): void {
  const from = HOUSE_LEVELS[house.level].name;
  postNotice(state, `${from} at ${house.x},${house.y} devolved to ${withArticle(HOUSE_LEVELS[level].name)}`, house);
}

function withArticle(name: string): string {
  return `${/^[AEIOU]/.test(name) ? 'an' : 'a'} ${name}`;
}

import type { BuildingType } from './buildings';
import type { Building, GameState } from './state';

export const INDUSTRIES = [
  'wheatFarm',
  'cardingShed',
  'growersLodge',
  'olivePress',
  'weaver',
  'scriptorium',
  'timberMill',
  'masonryShop',
  'foundry',
  'sculptureStudio',
] as const satisfies readonly BuildingType[];

export type Industry = (typeof INDUSTRIES)[number];

export const NO_PRIORITY = 0;
export type Priority = typeof NO_PRIORITY | 1 | 2 | 3;

export interface IndustrySetting {
  priority: Priority;
  open: boolean;
}

export type IndustrySettings = Record<Industry, IndustrySetting>;

export function defaultIndustrySettings(): IndustrySettings {
  return Object.fromEntries(INDUSTRIES.map((industry) => [industry, { priority: NO_PRIORITY, open: true }])) as IndustrySettings;
}

export function isIndustry(type: BuildingType): type is Industry {
  return (INDUSTRIES as readonly BuildingType[]).includes(type);
}

export function isClosed(state: GameState, building: Building): boolean {
  return isIndustry(building.type) && !state.industries[building.type].open;
}

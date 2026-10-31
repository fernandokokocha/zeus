import type { BuildingType } from './buildings';

export const INDUSTRIES = [
  'wheatFarm',
  'carrotFarm',
  'cardingShed',
  'growersLodge',
  'olivePress',
  'weaver',
  'scriptorium',
  'timberMill',
  'masonryShop',
  'foundry',
  'sculptureStudio',
  'armory',
] as const satisfies readonly BuildingType[];

export type Industry = (typeof INDUSTRIES)[number];

export function isIndustry(type: BuildingType): type is Industry {
  return (INDUSTRIES as readonly BuildingType[]).includes(type);
}

export type BuildingType = 'house';

export interface BuildingSpec {
  name: string;
  width: number;
  height: number;
  cost: number;
}

export const BUILDING_SPECS: Record<BuildingType, BuildingSpec> = {
  house: { name: 'House', width: 2, height: 2, cost: 10 },
};

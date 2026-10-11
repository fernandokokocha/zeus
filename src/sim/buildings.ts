export type BuildingType = 'house' | 'fountain' | 'taxOffice' | 'palace';

export interface BuildingSpec {
  name: string;
  width: number;
  height: number;
  cost: number;
  workers: number;
}

export const BUILDING_SPECS: Record<BuildingType, BuildingSpec> = {
  house: { name: 'House', width: 2, height: 2, cost: 10, workers: 0 },
  fountain: { name: 'Fountain', width: 2, height: 2, cost: 16, workers: 4 },
  taxOffice: { name: 'Tax Office', width: 2, height: 2, cost: 25, workers: 8 },
  palace: { name: 'Palace', width: 9, height: 6, cost: 125, workers: 0 },
};

export type BuildingType = 'testBuilding';

export interface BuildingSpec {
  name: string;
  width: number;
  height: number;
}

export const BUILDING_SPECS: Record<BuildingType, BuildingSpec> = {
  testBuilding: { name: 'Test Building', width: 2, height: 2 },
};

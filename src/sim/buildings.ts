import type { Point } from './point';

export type BuildingType =
  | 'house'
  | 'fountain'
  | 'taxOffice'
  | 'palace'
  | 'wheatFarm'
  | 'granary'
  | 'agora'
  | 'foodVendor'
  | 'park'
  | 'column'
  | 'flowerGarden';

export interface BuildingSpec {
  name: string;
  width: number;
  height: number;
  cost: number;
  workers: number;
  appeal: number[];
  needsRoad: boolean;
}

export const BUILDING_SPECS: Record<BuildingType, BuildingSpec> = {
  house: { name: 'House', width: 2, height: 2, cost: 10, workers: 0, appeal: [], needsRoad: true },
  fountain: { name: 'Fountain', width: 2, height: 2, cost: 16, workers: 4, appeal: [4, 4, 2, 2], needsRoad: true },
  taxOffice: { name: 'Tax Office', width: 2, height: 2, cost: 25, workers: 8, appeal: [-4, -3], needsRoad: true },
  palace: { name: 'Palace', width: 9, height: 6, cost: 125, workers: 0, appeal: [18, 18, 18, 15, 15, 15], needsRoad: true },
  wheatFarm: { name: 'Wheat Farm', width: 3, height: 3, cost: 20, workers: 10, appeal: [-3, -2, -1], needsRoad: true },
  granary: { name: 'Granary', width: 4, height: 4, cost: 50, workers: 18, appeal: [-12, -10, -8, -6], needsRoad: true },
  agora: { name: 'Agora', width: 3, height: 6, cost: 25, workers: 0, appeal: [12, 12, 10, 10, 8, 8], needsRoad: true },
  foodVendor: { name: 'Food Vendor', width: 2, height: 2, cost: 10, workers: 4, appeal: [], needsRoad: true },
  park: { name: 'Park', width: 1, height: 1, cost: 6, workers: 0, appeal: [3, 2, 1], needsRoad: false },
  column: { name: 'Column', width: 1, height: 1, cost: 8, workers: 0, appeal: [4, 2, 0], needsRoad: false },
  flowerGarden: { name: 'Flower Garden', width: 2, height: 2, cost: 20, workers: 0, appeal: [8, 7, 6], needsRoad: false },
};

export type Rotation = 0 | 1 | 2 | 3;

export interface Placement {
  type: BuildingType;
  x: number;
  y: number;
  rotation: Rotation;
}

export function buildingSize(type: BuildingType, rotation: Rotation): { width: number; height: number } {
  const { width, height } = BUILDING_SPECS[type];
  return rotation % 2 === 0 ? { width, height } : { width: height, height: width };
}

export function footprintDistance(building: Placement, p: Point): number {
  const { width, height } = buildingSize(building.type, building.rotation);
  const dx = Math.max(building.x - p.x, 0, p.x - (building.x + width - 1));
  const dy = Math.max(building.y - p.y, 0, p.y - (building.y + height - 1));
  return Math.max(dx, dy);
}

export const AGORA_VENDOR_SPOTS = [{ x: 0, y: 0 }, { x: 0, y: 2 }, { x: 0, y: 4 }];

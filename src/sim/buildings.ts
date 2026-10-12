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
  | 'flowerGarden'
  | 'college'
  | 'podium'
  | 'gymnasium'
  | 'dramaSchool'
  | 'theater'
  | 'cardingShed'
  | 'storehouse'
  | 'fleeceVendor'
  | 'oliveTree'
  | 'growersLodge'
  | 'olivePress'
  | 'oilVendor'
  | 'timberMill'
  | 'masonryShop'
  | 'foundry'
  | 'sculptureStudio'
  | 'artisansGuild'
  | 'maintenanceOffice'
  | 'demeterSanctuary'
  | 'athenaSanctuary'
  | 'hephaestusSanctuary'
  | 'ruins';

export interface BuildingSpec {
  name: string;
  width: number;
  height: number;
  cost: number;
  workers: number;
  appeal: number[];
  needsRoad: boolean;
}

const SANCTUARY_APPEAL = [20, 18, 16, 14, 12, 10];

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
  college: { name: 'College', width: 3, height: 3, cost: 30, workers: 12, appeal: [-5, -8], needsRoad: true },
  podium: { name: 'Podium', width: 2, height: 2, cost: 15, workers: 4, appeal: [3, 2, 1], needsRoad: true },
  gymnasium: { name: 'Gymnasium', width: 3, height: 3, cost: 30, workers: 7, appeal: [], needsRoad: true },
  dramaSchool: { name: 'Drama School', width: 3, height: 3, cost: 16, workers: 10, appeal: [], needsRoad: true },
  theater: { name: 'Theater', width: 5, height: 5, cost: 60, workers: 18, appeal: [6, 5, 4], needsRoad: true },
  storehouse: { name: 'Storehouse', width: 3, height: 3, cost: 25, workers: 12, appeal: [-2, -2, -2, -2], needsRoad: true },
  fleeceVendor: { name: 'Fleece Vendor', width: 2, height: 2, cost: 10, workers: 4, appeal: [], needsRoad: true },
  cardingShed: { name: 'Carding Shed', width: 2, height: 2, cost: 16, workers: 8, appeal: [-5, -3, -1], needsRoad: true },
  oliveTree: { name: 'Olive Tree', width: 1, height: 1, cost: 3, workers: 0, appeal: [1], needsRoad: false },
  growersLodge: { name: "Growers' Lodge", width: 2, height: 2, cost: 25, workers: 12, appeal: [-3, -2], needsRoad: true },
  olivePress: { name: 'Olive Press', width: 2, height: 2, cost: 45, workers: 12, appeal: [-4, -4, -2, -2], needsRoad: true },
  oilVendor: { name: 'Oil Vendor', width: 2, height: 2, cost: 10, workers: 4, appeal: [], needsRoad: true },
  timberMill: { name: 'Timber Mill', width: 2, height: 2, cost: 35, workers: 12, appeal: [-5, -4, -3, -2], needsRoad: true },
  masonryShop: { name: 'Masonry Shop', width: 2, height: 2, cost: 75, workers: 15, appeal: [-6, -5, -4, -3], needsRoad: true },
  foundry: { name: 'Foundry', width: 2, height: 2, cost: 60, workers: 15, appeal: [-10, -9, -8, -7, -6, -5], needsRoad: true },
  sculptureStudio: { name: 'Sculpture Studio', width: 2, height: 2, cost: 100, workers: 12, appeal: [-2, -1], needsRoad: true },
  artisansGuild: { name: "Artisans' Guild", width: 2, height: 2, cost: 35, workers: 25, appeal: [-6, -6, -5], needsRoad: true },
  maintenanceOffice: { name: 'Maintenance Office', width: 2, height: 2, cost: 10, workers: 5, appeal: [], needsRoad: true },
  demeterSanctuary: { name: 'Garden of Demeter', width: 18, height: 12, cost: 840, workers: 60, appeal: SANCTUARY_APPEAL, needsRoad: true },
  athenaSanctuary: { name: 'Arbor of Athena', width: 16, height: 12, cost: 2160, workers: 60, appeal: SANCTUARY_APPEAL, needsRoad: true },
  hephaestusSanctuary: { name: 'Forge of Hephaestus', width: 13, height: 8, cost: 760, workers: 60, appeal: SANCTUARY_APPEAL, needsRoad: true },
  ruins: { name: 'Ruins', width: 1, height: 1, cost: 0, workers: 0, appeal: [], needsRoad: false },
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

export function localToWorld(building: Placement, local: Point): Point {
  const { width: w, height: h } = BUILDING_SPECS[building.type];
  const turned = [
    { x: local.x, y: local.y },
    { x: h - 1 - local.y, y: local.x },
    { x: w - 1 - local.x, y: h - 1 - local.y },
    { x: local.y, y: w - 1 - local.x },
  ][building.rotation];
  return { x: building.x + turned.x, y: building.y + turned.y };
}

export function worldToLocal(building: Placement, p: Point): Point {
  const { width: w, height: h } = BUILDING_SPECS[building.type];
  const dx = p.x - building.x;
  const dy = p.y - building.y;
  return [
    { x: dx, y: dy },
    { x: dy, y: h - 1 - dx },
    { x: w - 1 - dx, y: h - 1 - dy },
    { x: w - 1 - dy, y: dx },
  ][building.rotation];
}

export const AGORA_VENDORS: ReadonlySet<BuildingType> = new Set<BuildingType>(['foodVendor', 'fleeceVendor', 'oilVendor']);

export function isAgoraVendor(type: BuildingType): boolean {
  return AGORA_VENDORS.has(type);
}

export const AGORA_VENDOR_SPOTS = [{ x: 0, y: 0 }, { x: 0, y: 2 }, { x: 0, y: 4 }];

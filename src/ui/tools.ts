import { BUILDING_SPECS, type BuildingType } from '../sim/buildings';
import { ROADBLOCK_COST, ROAD_TILE_COST } from '../sim/treasury';

export type SingleBuilding = Exclude<BuildingType, 'house'>;
export type Tool = 'road' | 'roadblock' | 'house' | SingleBuilding | 'demolish';

const priced = (type: BuildingType) => `${BUILDING_SPECS[type].name} (${BUILDING_SPECS[type].cost} dr)`;

export const TOOL_LABELS: Record<Tool, string> = {
  road: `Road (${ROAD_TILE_COST} dr)`,
  roadblock: `Roadblock (${ROADBLOCK_COST} dr)`,
  house: `Housing (${BUILDING_SPECS.house.cost} dr)`,
  fountain: priced('fountain'),
  taxOffice: priced('taxOffice'),
  palace: priced('palace'),
  wheatFarm: priced('wheatFarm'),
  granary: priced('granary'),
  agora: priced('agora'),
  foodVendor: priced('foodVendor'),
  park: priced('park'),
  column: priced('column'),
  flowerGarden: priced('flowerGarden'),
  college: priced('college'),
  podium: priced('podium'),
  gymnasium: priced('gymnasium'),
  dramaSchool: priced('dramaSchool'),
  theater: priced('theater'),
  demolish: 'Demolish',
};

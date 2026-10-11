import { BUILDING_SPECS, type BuildingType } from '../sim/buildings';
import { ROAD_TILE_COST } from '../sim/treasury';

export type SingleBuilding = Exclude<BuildingType, 'house'>;
export type Tool = 'road' | 'house' | SingleBuilding | 'demolish';

const priced = (type: BuildingType) => `${BUILDING_SPECS[type].name} (${BUILDING_SPECS[type].cost} dr)`;

export const TOOL_LABELS: Record<Tool, string> = {
  road: `Road (${ROAD_TILE_COST} dr)`,
  house: `Housing (${BUILDING_SPECS.house.cost} dr)`,
  fountain: priced('fountain'),
  taxOffice: priced('taxOffice'),
  palace: priced('palace'),
  demolish: 'Demolish',
};

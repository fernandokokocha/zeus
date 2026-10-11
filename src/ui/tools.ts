import { BUILDING_SPECS } from '../sim/buildings';
import { ROAD_TILE_COST } from '../sim/treasury';

export type Tool = 'road' | 'house' | 'demolish';

export const TOOL_LABELS: Record<Tool, string> = {
  road: `Road (${ROAD_TILE_COST} dr)`,
  house: `Housing (${BUILDING_SPECS.house.cost} dr)`,
  demolish: 'Demolish',
};

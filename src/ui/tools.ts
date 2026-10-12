import { BUILDING_SPECS, type BuildingType } from '../sim/buildings';
import { ROADBLOCK_COST, ROAD_TILE_COST, SHEEP_COST } from '../sim/treasury';

export type SingleBuilding = Exclude<BuildingType, 'house' | 'ruins'>;
export type Tool = 'road' | 'roadblock' | 'house' | SingleBuilding | 'sheep' | 'demolish';

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
  fleeceVendor: priced('fleeceVendor'),
  park: priced('park'),
  column: priced('column'),
  flowerGarden: priced('flowerGarden'),
  college: priced('college'),
  podium: priced('podium'),
  gymnasium: priced('gymnasium'),
  dramaSchool: priced('dramaSchool'),
  theater: priced('theater'),
  storehouse: priced('storehouse'),
  cardingShed: priced('cardingShed'),
  oliveTree: priced('oliveTree'),
  growersLodge: priced('growersLodge'),
  olivePress: priced('olivePress'),
  oilVendor: priced('oilVendor'),
  timberMill: priced('timberMill'),
  masonryShop: priced('masonryShop'),
  foundry: priced('foundry'),
  sculptureStudio: priced('sculptureStudio'),
  artisansGuild: priced('artisansGuild'),
  maintenanceOffice: priced('maintenanceOffice'),
  sheep: `Sheep (${SHEEP_COST} dr)`,
  demolish: 'Demolish',
};

export interface ToolGroup {
  name: string;
  tools: Tool[];
}

export const QUICK_TOOLS = ['road', 'roadblock'] as const satisfies Tool[];
export type QuickTool = (typeof QUICK_TOOLS)[number];

export const TOOL_GROUPS: ToolGroup[] = [
  { name: 'Housing', tools: ['house'] },
  { name: 'Husbandry', tools: ['wheatFarm', 'sheep', 'oliveTree', 'growersLodge'] },
  { name: 'Industry', tools: ['cardingShed', 'olivePress', 'timberMill', 'masonryShop', 'foundry', 'sculptureStudio'] },
  { name: 'Distribution', tools: ['granary', 'storehouse', 'agora', 'foodVendor', 'fleeceVendor', 'oilVendor'] },
  { name: 'Hygiene', tools: ['fountain'] },
  { name: 'Safety', tools: ['maintenanceOffice'] },
  { name: 'Administration', tools: ['palace', 'taxOffice'] },
  { name: 'Mythology', tools: ['artisansGuild'] },
  { name: 'Culture', tools: ['college', 'podium', 'gymnasium', 'dramaSchool', 'theater'] },
  { name: 'Aesthetics', tools: ['park', 'column', 'flowerGarden'] },
  { name: 'Demolish', tools: ['demolish'] },
];

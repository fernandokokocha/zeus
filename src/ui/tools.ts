import { BUILDING_SPECS, type BuildingType } from '../sim/buildings';
import { ROAD_UPGRADE_SPECS, type RoadUpgrade } from '../sim/road-upgrades';
import type { GameState } from '../sim/state';
import { SANCTUARY_SPECS, type Sanctuary } from '../sim/sanctuaries';
import { ROADBLOCK_COST, ROAD_TILE_COST, SHEEP_COST } from '../sim/treasury';

export type SingleBuilding = Exclude<BuildingType, 'house' | 'ruins' | 'tradeYard'>;
export const UPGRADE_TOOLS = { ornateRoad: 'ornate', fastRoad: 'fast' } as const satisfies Record<string, RoadUpgrade>;
export type UpgradeTool = keyof typeof UPGRADE_TOOLS;

export function isUpgradeTool(tool: Tool): tool is UpgradeTool {
  return tool in UPGRADE_TOOLS;
}

export type Tool = 'road' | UpgradeTool | 'roadblock' | 'house' | SingleBuilding | 'sheep' | 'demolish';

const priced = (type: BuildingType) => `${BUILDING_SPECS[type].name} (${BUILDING_SPECS[type].cost} dr)`;

const sanctuaryLabel = (type: Sanctuary) =>
  `${BUILDING_SPECS[type].name} (${BUILDING_SPECS[type].cost} dr + ${SANCTUARY_SPECS[type].initialMarbleLoads} marble)`;

const upgradeLabel = (kind: RoadUpgrade) => `${ROAD_UPGRADE_SPECS[kind].name} (${ROAD_UPGRADE_SPECS[kind].marbleLoads} marble)`;

export const TOOL_LABELS: Record<Tool, string> = {
  road: `Road (${ROAD_TILE_COST} dr)`,
  ornateRoad: upgradeLabel('ornate'),
  fastRoad: upgradeLabel('fast'),
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
  monument: BUILDING_SPECS.monument.name,
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
  clothVendor: priced('clothVendor'),
  tradersGuild: `${BUILDING_SPECS.tradersGuild.name} (${BUILDING_SPECS.tradersGuild.cost} dr + permit)`,
  weaver: priced('weaver'),
  timberMill: priced('timberMill'),
  masonryShop: priced('masonryShop'),
  foundry: priced('foundry'),
  sculptureStudio: priced('sculptureStudio'),
  artisansGuild: priced('artisansGuild'),
  maintenanceOffice: priced('maintenanceOffice'),
  demeterSanctuary: sanctuaryLabel('demeterSanctuary'),
  athenaSanctuary: sanctuaryLabel('athenaSanctuary'),
  hephaestusSanctuary: sanctuaryLabel('hephaestusSanctuary'),
  sheep: `Sheep (${SHEEP_COST} dr)`,
  demolish: 'Demolish',
};

export const QUICK_TOOLS = ['road', 'roadblock', 'house', 'demolish'] as const satisfies Tool[];
export type QuickTool = (typeof QUICK_TOOLS)[number];

export const QUICK_TILE_LABELS: Record<QuickTool, string> = {
  road: 'Road',
  roadblock: 'Block',
  house: 'Housing',
  demolish: 'Demolish',
};

export type GroupName =
  | 'Husbandry'
  | 'Industry'
  | 'Distribution'
  | 'Hygiene & Safety'
  | 'Administration'
  | 'Mythology'
  | 'Culture'
  | 'Aesthetics'
  | 'Elite';

export interface ToolGroup {
  name: GroupName;
  tileLabel: string;
  tools: Tool[];
}

export const TOOL_GROUPS: ToolGroup[] = [
  { name: 'Husbandry', tileLabel: 'Husbandry', tools: ['wheatFarm', 'sheep', 'oliveTree', 'growersLodge'] },
  { name: 'Industry', tileLabel: 'Industry', tools: ['cardingShed', 'weaver', 'olivePress', 'timberMill', 'masonryShop', 'foundry', 'sculptureStudio'] },
  { name: 'Distribution', tileLabel: 'Distribution', tools: ['granary', 'storehouse', 'fastRoad', 'agora', 'foodVendor', 'fleeceVendor', 'oilVendor', 'clothVendor'] },
  { name: 'Hygiene & Safety', tileLabel: 'Hygiene', tools: ['fountain', 'maintenanceOffice'] },
  { name: 'Administration', tileLabel: 'Admin', tools: ['palace', 'taxOffice'] },
  { name: 'Mythology', tileLabel: 'Mythology', tools: ['artisansGuild', 'demeterSanctuary', 'athenaSanctuary', 'hephaestusSanctuary'] },
  { name: 'Culture', tileLabel: 'Culture', tools: ['college', 'podium', 'gymnasium', 'dramaSchool', 'theater'] },
  { name: 'Aesthetics', tileLabel: 'Aesthetics', tools: ['park', 'column', 'flowerGarden', 'monument', 'ornateRoad'] },
  { name: 'Elite', tileLabel: 'Elite', tools: ['tradersGuild'] },
];

export function toolLabel(tool: Tool, state: GameState): string {
  return tool === 'monument' ? `${TOOL_LABELS.monument} (${state.monumentsToPlace.length})` : TOOL_LABELS[tool];
}

export function toolEnabled(tool: Tool, state: GameState): boolean {
  return tool !== 'monument' || state.monumentsToPlace.length > 0;
}

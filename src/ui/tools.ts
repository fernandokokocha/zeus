import { BUILDING_SPECS, type BuildingType } from '../sim/buildings';
import { ROAD_UPGRADE_SPECS, type RoadUpgrade } from '../sim/road-upgrades';
import { MONUMENT_NAMES, monumentsWaiting, type MonumentKind } from '../sim/monuments';
import type { GameState } from '../sim/state';
import { SANCTUARY_SPECS, type Sanctuary } from '../sim/sanctuaries';
import { ROADBLOCK_COST, ROAD_TILE_COST, SHEEP_COST } from '../sim/treasury';

export type SingleBuilding = Exclude<BuildingType, 'house' | 'ruins' | 'tradeYard' | 'monument'>;
export const UPGRADE_TOOLS = { ornateRoad: 'ornate', fastRoad: 'fast' } as const satisfies Record<string, RoadUpgrade>;
export type UpgradeTool = keyof typeof UPGRADE_TOOLS;
export const MONUMENT_TOOLS = { crowdedCityMonument: 'crowdedCity', tradeRouteMonument: 'tradeRoute' } as const satisfies Record<string, MonumentKind>;
export type MonumentTool = keyof typeof MONUMENT_TOOLS;

export function isUpgradeTool(tool: Tool): tool is UpgradeTool {
  return tool in UPGRADE_TOOLS;
}

export function isMonumentTool(tool: Tool): tool is MonumentTool {
  return tool in MONUMENT_TOOLS;
}

export type Tool = 'road' | UpgradeTool | 'roadblock' | 'house' | SingleBuilding | MonumentTool | 'sheep' | 'demolish';

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
  crowdedCityMonument: `${BUILDING_SPECS.monument.name}: ${MONUMENT_NAMES.crowdedCity}`,
  tradeRouteMonument: `${BUILDING_SPECS.monument.name}: ${MONUMENT_NAMES.tradeRoute}`,
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
  { name: 'Aesthetics', tileLabel: 'Aesthetics', tools: ['park', 'column', 'flowerGarden', 'crowdedCityMonument', 'tradeRouteMonument', 'ornateRoad'] },
  { name: 'Elite', tileLabel: 'Elite', tools: ['tradersGuild'] },
];

export function toolLabel(tool: Tool, state: GameState): string {
  return isMonumentTool(tool) ? `${TOOL_LABELS[tool]} (${monumentsWaiting(state, MONUMENT_TOOLS[tool])})` : TOOL_LABELS[tool];
}

export function toolEnabled(tool: Tool, state: GameState): boolean {
  return !isMonumentTool(tool) || monumentsWaiting(state, MONUMENT_TOOLS[tool]) > 0;
}

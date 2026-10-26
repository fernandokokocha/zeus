import { appealMap } from './appeal';
import { BUILDING_SPECS } from './buildings';
import { footprint } from './commands';
import { culturePoints } from './culture';
import { monthlyUse } from './food';
import { guildSiteTiles, placeableGuildSites, siteSurroundings } from './guild';
import { HOUSE_LEVELS, houseLevel, isResidence, type HouseLevel } from './housing';
import { isUnderConstruction } from './sanctuaries';
import { serviceLeft } from './roamers';
import { canBurn, canCollapse, riskShare } from './safety';
import { tileIndex, type Building, type GameState } from './state';

export type Overlay = 'water' | 'food' | 'supply' | 'culture' | 'appeal' | 'fireRisk' | 'collapseRisk' | 'tax' | 'houseLevel' | 'staffing' | 'guildSites';

export type Reading = number | null;

type BuildingReader = (state: GameState, building: Building) => Reading;

const LEVEL_ORDER = Object.keys(HOUSE_LEVELS) as HouseLevel[];

function occupiedHouse(read: (state: GameState, house: Building, level: HouseLevel) => number): BuildingReader {
  return (state, building) => {
    const level = building.type === 'house' ? houseLevel(building) : null;
    return level ? read(state, building, level) : null;
  };
}

function occupiedResidence(read: (state: GameState, residence: Building) => number): BuildingReader {
  return (state, building) => (isResidence(building) && building.residents > 0 ? read(state, building) : null);
}

function monthsOfFood(house: Building): number {
  const use = monthlyUse(house, 'food');
  return use > 0 ? house.food / use : 0;
}

const BUILDING_READERS: Record<Exclude<Overlay, 'appeal' | 'guildSites'>, BuildingReader> = {
  water: occupiedResidence((state, residence) => serviceLeft(state, residence, 'water')),
  tax: occupiedHouse((state, house) => serviceLeft(state, house, 'tax')),
  food: occupiedResidence((_, residence) => monthsOfFood(residence)),
  supply: occupiedResidence((_, residence) => Number(residence.fleece > 0) + Number(residence.oil > 0)),
  culture: occupiedResidence((state, residence) => culturePoints(state, residence)),
  houseLevel: occupiedHouse((_, __, level) => LEVEL_ORDER.indexOf(level)),
  fireRisk: (_, building) => (canBurn(building) ? riskShare(building.fireRisk) : null),
  collapseRisk: (_, building) => (canCollapse(building) ? riskShare(building.collapseRisk) : null),
  staffing: (_, building) => {
    const { workers } = BUILDING_SPECS[building.type];
    return workers > 0 && !isUnderConstruction(building) ? building.workers / workers : null;
  },
};

export function overlayReadings(state: GameState, overlay: Overlay): Reading[] {
  if (overlay === 'appeal') return appealMap(state).map((appeal) => (appeal === 0 ? null : appeal));
  if (overlay === 'guildSites') return guildSiteReadings(state);
  const readings = new Array<Reading>(state.size * state.size).fill(null);
  const read = BUILDING_READERS[overlay];
  for (const building of state.buildings) {
    const reading = read(state, building);
    if (reading === null) continue;
    for (const tile of footprint(building)) readings[tileIndex(state, tile.x, tile.y)] = reading;
  }
  return readings;
}

export const GUILD_SITE_READINGS = { inRange: 0, placeable: 1 };

function guildSiteReadings(state: GameState): Reading[] {
  const around = siteSurroundings(state);
  const readings = around.inRange.map((inRange, i) => (inRange && !state.mainRoad[i] ? GUILD_SITE_READINGS.inRange : null));
  for (const site of placeableGuildSites(state, around)) {
    for (const tile of guildSiteTiles(site)) readings[tileIndex(state, tile.x, tile.y)] = GUILD_SITE_READINGS.placeable;
  }
  return readings;
}

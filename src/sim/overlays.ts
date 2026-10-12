import { appealMap } from './appeal';
import { BUILDING_SPECS } from './buildings';
import { footprint } from './commands';
import { culturePoints } from './culture';
import { monthlyUse } from './food';
import { HOUSE_LEVELS, houseLevel, type HouseLevel } from './housing';
import { isUnderConstruction } from './sanctuaries';
import { serviceLeft } from './roamers';
import { canBurn, canCollapse, riskShare } from './safety';
import { tileIndex, type Building, type GameState } from './state';

export type Overlay = 'water' | 'food' | 'supply' | 'culture' | 'appeal' | 'fireRisk' | 'collapseRisk' | 'tax' | 'houseLevel' | 'staffing';

export type Reading = number | null;

type BuildingReader = (state: GameState, building: Building) => Reading;

const LEVEL_ORDER = Object.keys(HOUSE_LEVELS) as HouseLevel[];

function occupiedHouse(read: (state: GameState, house: Building, level: HouseLevel) => number): BuildingReader {
  return (state, building) => {
    const level = building.type === 'house' ? houseLevel(building) : null;
    return level ? read(state, building, level) : null;
  };
}

function monthsOfFood(house: Building): number {
  const use = monthlyUse(house, 'food');
  return use > 0 ? house.food / use : 0;
}

const BUILDING_READERS: Record<Exclude<Overlay, 'appeal'>, BuildingReader> = {
  water: occupiedHouse((state, house) => serviceLeft(state, house, 'water')),
  tax: occupiedHouse((state, house) => serviceLeft(state, house, 'tax')),
  food: occupiedHouse((_, house) => monthsOfFood(house)),
  supply: occupiedHouse((_, house) => Number(house.fleece > 0) + Number(house.oil > 0)),
  culture: occupiedHouse((state, house) => culturePoints(state, house)),
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
  const readings = new Array<Reading>(state.size * state.size).fill(null);
  const read = BUILDING_READERS[overlay];
  for (const building of state.buildings) {
    const reading = read(state, building);
    if (reading === null) continue;
    for (const tile of footprint(building)) readings[tileIndex(state, tile.x, tile.y)] = reading;
  }
  return readings;
}

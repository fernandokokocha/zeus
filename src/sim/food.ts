import { BUILDING_SPECS } from './buildings';
import { TICKS_PER_YEAR, monthOfYear } from './clock';
import { HOUSE_LEVELS, houseLevel } from './housing';
import type { Building, GameState, HouseGood } from './state';

export const UNITS_PER_LOAD = 100;
export const WHEAT_LOADS_PER_YEAR = 8;
export const HARVEST_MONTH = 6;
export const CROP_STAGES = 4;
export const GRANARY_CAPACITY = 32 * UNITS_PER_LOAD;
export const CART_LOAD = 4 * UNITS_PER_LOAD;
export const BUYER_LOAD = 4 * UNITS_PER_LOAD;
export const VENDOR_CAPACITY = 8 * UNITS_PER_LOAD;
export const FOOD_PER_RESIDENT_PER_MONTH = 0.25;
export const FLEECE_PER_HOUSE_PER_MONTH = 2;
export const OIL_PER_HOUSE_PER_MONTH = 2;
export const HOUSE_STOCK_MONTHS = 3;

export function wholeLoads(units: number): number {
  return Math.floor(units / UNITS_PER_LOAD) * UNITS_PER_LOAD;
}

export function cropStage(farm: Building): number {
  return Math.floor(farm.growth * CROP_STAGES);
}

export function growCrops(state: GameState): void {
  for (const farm of state.buildings.filter((b) => b.type === 'wheatFarm')) {
    const stage = cropStage(farm);
    farm.growth += farm.workers / BUILDING_SPECS.wheatFarm.workers / TICKS_PER_YEAR;
    if (cropStage(farm) !== stage) state.version++;
  }
}

export function harvestIfDue(state: GameState): void {
  if (monthOfYear(state.tick) !== HARVEST_MONTH) return;
  for (const farm of state.buildings.filter((b) => b.type === 'wheatFarm')) {
    farm.food += Math.round(farm.growth * WHEAT_LOADS_PER_YEAR) * UNITS_PER_LOAD;
    farm.growth = 0;
  }
  state.version++;
}

const MONTHLY_NEED: Record<HouseGood, (house: Building) => number> = {
  food: (house) => house.residents * FOOD_PER_RESIDENT_PER_MONTH,
  fleece: () => FLEECE_PER_HOUSE_PER_MONTH,
  oil: () => OIL_PER_HOUSE_PER_MONTH,
};

const HOUSE_GOODS = Object.keys(MONTHLY_NEED) as HouseGood[];

export function monthlyUse(house: Building, good: HouseGood): number {
  const level = houseLevel(house);
  return level && HOUSE_LEVELS[level].needs.includes(good) ? MONTHLY_NEED[good](house) : 0;
}

export function eat(state: GameState): void {
  for (const house of state.buildings.filter((b) => b.type === 'house')) {
    for (const good of HOUSE_GOODS) house[good] = Math.max(0, house[good] - monthlyUse(house, good));
  }
}

export function houseStockTarget(house: Building, good: HouseGood): number {
  return MONTHLY_NEED[good](house) * HOUSE_STOCK_MONTHS;
}

export function stockHouse(stall: Building, house: Building, good: HouseGood): void {
  const given = Math.min(Math.max(0, houseStockTarget(house, good) - house[good]), stall[good]);
  house[good] += given;
  stall[good] -= given;
}

import { BUILDING_SPECS } from './buildings';
import { TICKS_PER_YEAR, monthOfYear } from './clock';
import { HOUSE_LEVELS, houseLevel } from './housing';
import type { Building, GameState } from './state';

export const UNITS_PER_LOAD = 100;
export const WHEAT_LOADS_PER_YEAR = 8;
export const HARVEST_MONTH = 6;
export const CROP_STAGES = 4;
export const GRANARY_CAPACITY = 32 * UNITS_PER_LOAD;
export const CART_LOAD = 4 * UNITS_PER_LOAD;
export const BUYER_LOAD = 4 * UNITS_PER_LOAD;
export const VENDOR_CAPACITY = 8 * UNITS_PER_LOAD;
export const FOOD_PER_RESIDENT_PER_MONTH = 0.25;
export const HOUSE_FOOD_MONTHS = 3;

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

export function monthlyFood(house: Building): number {
  const level = houseLevel(house);
  return level && HOUSE_LEVELS[level].needs.includes('food') ? house.residents * FOOD_PER_RESIDENT_PER_MONTH : 0;
}

export function eat(state: GameState): void {
  for (const house of state.buildings.filter((b) => b.type === 'house')) {
    house.food = Math.max(0, house.food - monthlyFood(house));
  }
}

export function houseFoodTarget(house: Building): number {
  return house.residents * FOOD_PER_RESIDENT_PER_MONTH * HOUSE_FOOD_MONTHS;
}

export function stockHouse(stall: Building, house: Building): void {
  const given = Math.min(Math.max(0, houseFoodTarget(house) - house.food), stall.food);
  house.food += given;
  stall.food -= given;
}

import { BUILDING_SPECS } from './buildings';
import { TICKS_PER_YEAR, monthOfYear } from './clock';
import { recordFlow } from './flows';
import { ELITE_HOUSING, isElite, residentNeeds, isResidence, type EliteType } from './housing';
import type { Building, GameState, PeddledGood } from './state';

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
export const CLOTH_PER_GUILD_PER_MONTH = 8;

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
    const harvest = Math.round(farm.growth * WHEAT_LOADS_PER_YEAR) * UNITS_PER_LOAD;
    farm.food += harvest;
    recordFlow(state, 'made', 'food', harvest);
    farm.growth = 0;
  }
  state.version++;
}

function housesIn(residence: Building): number {
  return isElite(residence) ? ELITE_HOUSING[residence.type as EliteType].houses : 1;
}

const MONTHLY_NEED: Record<PeddledGood, (residence: Building) => number> = {
  food: (house) => house.residents * FOOD_PER_RESIDENT_PER_MONTH,
  fleece: (residence) => housesIn(residence) * FLEECE_PER_HOUSE_PER_MONTH,
  oil: (residence) => housesIn(residence) * OIL_PER_HOUSE_PER_MONTH,
  cloth: (residence) => (residence.type === 'tradersGuild' ? CLOTH_PER_GUILD_PER_MONTH : 0),
};

const HOUSE_STOCK_MONTHS: Record<PeddledGood, number> = { food: 5, fleece: 5, oil: 5, cloth: 3 };

const PEDDLED_GOODS = Object.keys(MONTHLY_NEED) as PeddledGood[];

export function monthlyUse(residence: Building, good: PeddledGood): number {
  return residentNeeds(residence).includes(good) ? MONTHLY_NEED[good](residence) : 0;
}

export function eat(state: GameState): void {
  for (const house of state.buildings.filter(isResidence)) {
    for (const good of PEDDLED_GOODS) {
      const wanted = monthlyUse(house, good);
      const used = Math.min(house[good], wanted);
      house[good] -= used;
      recordFlow(state, 'wanted', good, wanted);
      recordFlow(state, 'used', good, used);
    }
  }
}

export function houseStockTarget(house: Building, good: PeddledGood): number {
  return MONTHLY_NEED[good](house) * HOUSE_STOCK_MONTHS[good];
}

export function stockHouse(stall: Building, house: Building, good: PeddledGood): void {
  const given = Math.min(Math.max(0, houseStockTarget(house, good) - house[good]), stall[good]);
  house[good] += given;
  stall[good] -= given;
}

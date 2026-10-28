import { MONTHS_PER_YEAR, monthOfYear } from './clock';
import { adjacentRoadTiles } from './commands';
import { HOUSE_LEVELS, houseLevel } from './housing';
import { laborSummary } from './labor';
import { hasService } from './roamers';
import type { Building, GameState } from './state';
import { TAX_RATE, WAGE_PER_WORKER_PER_YEAR, closeYear, collect, spend } from './treasury';

export const TAX_PAID_MONTHS = MONTHS_PER_YEAR;
const JANUARY = 0;

export function houseTax(house: Building): number {
  const level = houseLevel(house);
  return level ? HOUSE_LEVELS[level].taxMultiplier * house.residents * TAX_RATE : 0;
}

export function hasWorkingPalace(state: GameState): boolean {
  return state.buildings.some((b) => b.type === 'palace' && adjacentRoadTiles(state, b).length > 0);
}

export function taxPaidLastYear(house: Building): number {
  return house.taxPaid.reduce((sum, paid) => sum + paid, 0);
}

function collectTaxes(state: GameState): number {
  const collecting = hasWorkingPalace(state);
  let taxes = 0;
  for (const house of state.buildings.filter((b) => b.type === 'house')) {
    const paid = collecting && hasService(state, house, 'tax') ? houseTax(house) : 0;
    house.taxPaid = [...house.taxPaid, paid].slice(-TAX_PAID_MONTHS);
    taxes += paid;
  }
  return taxes;
}

export function settleMonth(state: GameState): void {
  if (monthOfYear(state.tick) === JANUARY) closeYear(state);
  const wages = (laborSummary(state).employed * WAGE_PER_WORKER_PER_YEAR) / MONTHS_PER_YEAR;
  const taxes = collectTaxes(state);
  spend(state, 'wages', wages);
  collect(state, 'taxes', taxes);
  state.lastMonth = { taxes, wages };
}

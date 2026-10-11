import { adjacentRoadTiles } from './commands';
import { HOUSE_LEVELS, houseLevel } from './housing';
import { laborSummary } from './labor';
import { hasService } from './roamers';
import type { Building, GameState } from './state';
import { TAX_RATE, WAGE_PER_WORKER_PER_YEAR } from './treasury';

const MONTHS_PER_YEAR = 12;

export function houseTax(house: Building): number {
  const level = houseLevel(house);
  return level ? HOUSE_LEVELS[level].taxMultiplier * house.residents * TAX_RATE : 0;
}

export function hasWorkingPalace(state: GameState): boolean {
  return state.buildings.some((b) => b.type === 'palace' && adjacentRoadTiles(state, b).length > 0);
}

export function settleMonth(state: GameState): void {
  const wages = (laborSummary(state).employed * WAGE_PER_WORKER_PER_YEAR) / MONTHS_PER_YEAR;
  const taxes = hasWorkingPalace(state)
    ? state.buildings
        .filter((b) => b.type === 'house' && hasService(state, b, 'tax'))
        .reduce((sum, house) => sum + houseTax(house), 0)
    : 0;
  state.treasury += taxes - wages;
  state.lastMonth = { taxes, wages };
}

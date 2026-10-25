import { monthlyUse } from './food';
import { buildingName, isResidence } from './housing';
import { postNotice } from './notices';
import type { Building, GameState } from './state';

export const WELL_FED_MONTHS = 24;
const WELL_FED_COMPLETE = "Charter complete: Well fed. A Traders' Guild permit is granted";

export interface WellFed {
  months: number;
  reset: { tick: number; house: string } | null;
}

export function tallyWellFed(state: GameState): void {
  const eaters = state.buildings.filter((b) => isResidence(b) && monthlyUse(b, 'food') > 0);
  if (eaters.length === 0) return;
  const hungry = eaters.find(mealEmptiesStock);
  if (hungry) {
    state.wellFed = { months: 0, reset: { tick: state.tick, house: `${buildingName(hungry)} at ${hungry.x},${hungry.y}` } };
    return;
  }
  state.wellFed.months++;
  if (state.wellFed.months < WELL_FED_MONTHS) return;
  state.wellFed = { months: 0, reset: null };
  state.guildPermits++;
  postNotice(state, WELL_FED_COMPLETE, null);
}

function mealEmptiesStock(house: Building): boolean {
  return house.food <= monthlyUse(house, 'food');
}

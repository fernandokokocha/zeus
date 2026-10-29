import { monthlyUse } from './food';
import { buildingName, houseLevel } from './housing';
import { postNotice } from './notices';
import type { Building, GameState, PeddledGood } from './state';

export const WELL_DRESSED_MONTHS = 24;
const WELL_DRESSED_COMPLETE = "Charter complete: Well dressed. A Traders' Guild permit is granted";
const NO_TOWNHOUSE = 'no Townhouse in the city';
const DRESS_GOODS: PeddledGood[] = ['fleece', 'oil'];

export interface WellDressed {
  months: number;
  reset: { tick: number; cause: string } | null;
}

export function tallyWellDressed(state: GameState): void {
  const townhouses = state.buildings.filter(countsAsTownhouse);
  if (townhouses.length === 0) {
    if (state.wellDressed.months > 0) resetWellDressed(state, NO_TOWNHOUSE);
    return;
  }
  const cause = shortage(townhouses);
  if (cause !== null) {
    resetWellDressed(state, cause);
    return;
  }
  state.wellDressed.months++;
  if (state.wellDressed.months < WELL_DRESSED_MONTHS) return;
  state.wellDressed = { months: 0, reset: null };
  state.permits.tradersGuild++;
  postNotice(state, WELL_DRESSED_COMPLETE, null);
}

function resetWellDressed(state: GameState, cause: string): void {
  state.wellDressed = { months: 0, reset: { tick: state.tick, cause } };
}

function countsAsTownhouse(building: Building): boolean {
  return building.type === 'tradersGuild' || (building.type === 'house' && houseLevel(building) === 'townhouse');
}

function shortage(townhouses: Building[]): string | null {
  for (const house of townhouses) {
    const good = DRESS_GOODS.find((g) => monthEmptiesStock(house, g));
    if (good) return `${buildingName(house)} at ${house.x},${house.y} ran out of ${good}`;
  }
  return null;
}

function monthEmptiesStock(house: Building, good: PeddledGood): boolean {
  return house[good] <= monthlyUse(house, good);
}

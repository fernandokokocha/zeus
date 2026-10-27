import { BUILDING_SPECS } from './buildings';
import { TICKS_PER_YEAR } from './clock';
import { BUYER_LOAD, CART_LOAD, UNITS_PER_LOAD } from './food';
import { recordFlow } from './flows';
import type { Building, GameState } from './state';

export const CLOTH_LOADS_PER_YEAR = 6;
export const WEAVING_TICKS = TICKS_PER_YEAR / CLOTH_LOADS_PER_YEAR;
export const WEAVER_FLEECE_CAPACITY = CART_LOAD;
export const WEAVER_CLOTH_CAPACITY = CART_LOAD;
export const FLEECE_KEPT_FOR_VENDORS = BUYER_LOAD;

export function tickCloth(state: GameState): void {
  for (const weaver of state.buildings) weave(state, weaver);
}

export function canWeave(weaver: Building): boolean {
  return weaver.fleece >= UNITS_PER_LOAD && weaver.cloth + UNITS_PER_LOAD <= WEAVER_CLOTH_CAPACITY;
}

function weave(state: GameState, weaver: Building): void {
  if (weaver.type !== 'weaver' || weaver.workers === 0 || !canWeave(weaver)) return;
  weaver.production += weaver.workers / BUILDING_SPECS.weaver.workers;
  if (weaver.production < WEAVING_TICKS) return;
  weaver.production = 0;
  weaver.fleece -= UNITS_PER_LOAD;
  weaver.cloth += UNITS_PER_LOAD;
  recordFlow(state, 'used', 'fleece', UNITS_PER_LOAD);
  recordFlow(state, 'made', 'cloth', UNITS_PER_LOAD);
  state.version++;
}

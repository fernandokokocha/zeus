import { BUILDING_SPECS } from './buildings';
import { TICKS_PER_YEAR } from './clock';
import { CART_LOAD, UNITS_PER_LOAD } from './food';
import { recordFlow } from './flows';
import type { Building, GameState } from './state';

export const ARMOR_LOADS_PER_YEAR = 6;
export const ARMOR_TICKS = TICKS_PER_YEAR / ARMOR_LOADS_PER_YEAR;
export const ARMORY_BRONZE_CAPACITY = CART_LOAD;
export const ARMORY_ARMOR_CAPACITY = CART_LOAD;

export function tickArmor(state: GameState): void {
  for (const armory of state.buildings) forge(state, armory);
}

export function canForge(armory: Building): boolean {
  return armory.bronze >= UNITS_PER_LOAD && armory.armor + UNITS_PER_LOAD <= ARMORY_ARMOR_CAPACITY;
}

function forge(state: GameState, armory: Building): void {
  if (armory.type !== 'armory' || armory.workers === 0 || !canForge(armory)) return;
  armory.production += armory.workers / BUILDING_SPECS.armory.workers;
  if (armory.production < ARMOR_TICKS) return;
  armory.production = 0;
  armory.bronze -= UNITS_PER_LOAD;
  armory.armor += UNITS_PER_LOAD;
  recordFlow(state, 'used', 'bronze', UNITS_PER_LOAD);
  recordFlow(state, 'made', 'armor', UNITS_PER_LOAD);
  state.version++;
}

import { UNITS_PER_LOAD } from './food';
import type { Building } from './state';

export const STOREHOUSE_SLOTS = 8;
export const SLOT_SIZE = 4 * UNITS_PER_LOAD;
export const STOREHOUSE_CAPACITY = STOREHOUSE_SLOTS * SLOT_SIZE;

export function slotsUsed(storehouse: Building): number {
  return Math.ceil(storehouse.fleece / SLOT_SIZE);
}

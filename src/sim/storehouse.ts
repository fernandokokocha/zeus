import { UNITS_PER_LOAD } from './food';
import type { Good } from './state';

export const STOREHOUSE_SLOTS = 8;
export const LOADS_PER_SLOT = 4;
export const SLOT_SIZE = LOADS_PER_SLOT * UNITS_PER_LOAD;
export const STOREHOUSE_CAPACITY = STOREHOUSE_SLOTS * SLOT_SIZE;
export const STOREHOUSE_GOODS = ['fleece', 'olives', 'oil', 'wood', 'marble', 'bronze', 'sculptures', 'cloth'] as const;
export type StoredGood = (typeof STOREHOUSE_GOODS)[number];

export interface Bay {
  good: StoredGood;
  loads: number;
}

export function slotsUsed(stock: Record<Good, number>): number {
  return STOREHOUSE_GOODS.reduce((sum, good) => sum + slotsOf(stock, good), 0);
}

export function slotsOf(stock: Record<Good, number>, good: Good): number {
  return Math.ceil(stock[good] / SLOT_SIZE);
}

export function baysOf(stock: Record<Good, number>): Bay[] {
  return STOREHOUSE_GOODS.flatMap((good) => {
    const loads = Math.floor(stock[good] / UNITS_PER_LOAD);
    return Array.from({ length: slotsOf(stock, good) }, (_, slot) => ({ good, loads: Math.min(LOADS_PER_SLOT, loads - slot * LOADS_PER_SLOT) }));
  });
}

export function storehouseSpace(stock: Record<Good, number>, good: Good): number {
  const freeSlots = STOREHOUSE_SLOTS - slotsUsed(stock);
  return freeSlots * SLOT_SIZE + slotsOf(stock, good) * SLOT_SIZE - stock[good];
}

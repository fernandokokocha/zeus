import { UNITS_PER_LOAD } from './food';
import type { Building, GameState, Good } from './state';
import { hasUpgrade } from './upgrades';

export const STOREHOUSE_SLOTS = 8;
export const LOADS_PER_SLOT = 4;
export const SLOT_SIZE = LOADS_PER_SLOT * UNITS_PER_LOAD;
export const STOREHOUSE_CAPACITY = STOREHOUSE_SLOTS * SLOT_SIZE;
export const AMPHORA_GOODS: readonly Good[] = ['oil', 'olives'];
export const AMPHORA_LOADS_PER_SLOT = 6;
export const STOREHOUSE_GOODS = ['fleece', 'olives', 'oil', 'wood', 'marble', 'bronze', 'sculptures', 'cloth', 'papyrus', 'scrolls'] as const;
export type StoredGood = (typeof STOREHOUSE_GOODS)[number];

export interface Bay {
  good: StoredGood;
  loads: number;
  capacity: number;
}

export function loadsPerSlot(state: GameState, good: Good): number {
  return hasUpgrade(state, 'amphoras') && AMPHORA_GOODS.includes(good) ? AMPHORA_LOADS_PER_SLOT : LOADS_PER_SLOT;
}

function slotSize(state: GameState, good: Good): number {
  return loadsPerSlot(state, good) * UNITS_PER_LOAD;
}

export function slotsUsed(state: GameState, stock: Record<Good, number>): number {
  return STOREHOUSE_GOODS.reduce((sum, good) => sum + slotsOf(state, stock, good), 0);
}

export function slotsOf(state: GameState, stock: Record<Good, number>, good: Good): number {
  return Math.ceil(stock[good] / slotSize(state, good));
}

export function baysOf(state: GameState, stock: Record<Good, number>): Bay[] {
  return STOREHOUSE_GOODS.flatMap((good) => {
    const loads = Math.floor(stock[good] / UNITS_PER_LOAD);
    const capacity = loadsPerSlot(state, good);
    return Array.from({ length: slotsOf(state, stock, good) }, (_, slot) => ({ good, loads: Math.min(capacity, loads - slot * capacity), capacity }));
  });
}

export function storehouseCapacity(state: GameState, stock: Record<Good, number>): number {
  const freeSlots = STOREHOUSE_SLOTS - slotsUsed(state, stock);
  return freeSlots * SLOT_SIZE + STOREHOUSE_GOODS.reduce((sum, good) => sum + slotsOf(state, stock, good) * slotSize(state, good), 0);
}

export function storehouseSpace(state: GameState, stock: Record<Good, number>, good: Good): number {
  const freeSlots = STOREHOUSE_SLOTS - slotsUsed(state, stock);
  return freeSlots * slotSize(state, good) + slotsOf(state, stock, good) * slotSize(state, good) - stock[good];
}
export function acceptsGood(store: Building, good: Good): boolean {
  return !store.refused.includes(good);
}

export function setGoodAccepted(storehouse: Building, good: StoredGood, accepted: boolean): void {
  const others = storehouse.refused.filter((g) => g !== good);
  storehouse.refused = accepted ? others : [...others, good];
}

export function setAllAccepted(storehouse: Building, accepted: boolean): void {
  storehouse.refused = accepted ? [] : [...STOREHOUSE_GOODS];
}

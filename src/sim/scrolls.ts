import { BUILDING_SPECS } from './buildings';
import { TICKS_PER_YEAR } from './clock';
import { CART_LOAD, UNITS_PER_LOAD } from './food';
import { recordFlow } from './flows';
import type { Building, GameState } from './state';

export const SCROLLS_PER_YEAR = 6;
export const PAGES_PER_SCROLL = 40;
export const SCROLL_INPUTS = ['papyrus', 'fleece'] as const;
export type ScrollInput = (typeof SCROLL_INPUTS)[number];
export const PAGES_PER_LOAD: Record<ScrollInput, number> = { papyrus: 10, fleece: 1 };
export const SCRIPTORIUM_INPUT_CAPACITY = CART_LOAD;
export const SCRIPTORIUM_SCROLL_CAPACITY = CART_LOAD;

const PAGE_TICKS = TICKS_PER_YEAR / SCROLLS_PER_YEAR / PAGES_PER_SCROLL;

export function copyingTicks(good: ScrollInput): number {
  return PAGES_PER_LOAD[good] * PAGE_TICKS;
}

export function inputCapacity(scriptorium: Building, good: ScrollInput): number {
  const held = SCROLL_INPUTS.reduce((sum, input) => sum + scriptorium[input], 0);
  return SCRIPTORIUM_INPUT_CAPACITY - held + scriptorium[good];
}

export function inputInUse(scriptorium: Building): ScrollInput | null {
  return SCROLL_INPUTS.find((good) => scriptorium[good] >= UNITS_PER_LOAD) ?? null;
}

export function hasScrollRoom(scriptorium: Building): boolean {
  return scriptorium.scrolls + UNITS_PER_LOAD <= SCRIPTORIUM_SCROLL_CAPACITY;
}

export function tickScrolls(state: GameState): void {
  for (const scriptorium of state.buildings) copy(state, scriptorium);
}

function copy(state: GameState, scriptorium: Building): void {
  if (scriptorium.type !== 'scriptorium' || scriptorium.workers === 0 || !hasScrollRoom(scriptorium)) return;
  const good = inputInUse(scriptorium);
  if (good === null) return;
  scriptorium.production += scriptorium.workers / BUILDING_SPECS.scriptorium.workers;
  if (scriptorium.production < copyingTicks(good)) return;
  scriptorium.production = 0;
  scriptorium[good] -= UNITS_PER_LOAD;
  recordFlow(state, 'used', good, UNITS_PER_LOAD);
  scriptorium.pages += PAGES_PER_LOAD[good];
  if (scriptorium.pages >= PAGES_PER_SCROLL) {
    scriptorium.pages -= PAGES_PER_SCROLL;
    scriptorium.scrolls += UNITS_PER_LOAD;
    recordFlow(state, 'made', 'scrolls', UNITS_PER_LOAD);
  }
  state.version++;
}

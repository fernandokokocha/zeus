import { TICKS_PER_YEAR } from './clock';
import { annexOf } from './elites';
import { CART_LOAD, UNITS_PER_LOAD } from './food';
import { recordFlow } from './flows';
import { postNotice } from './notices';
import type { Building, GameState } from './state';

export const LIBRARY_SCROLL_CAPACITY = CART_LOAD;
export const SCROLLS_READ_PER_YEAR = 1;
export const READING_TICKS_PER_UNIT = TICKS_PER_YEAR / SCROLLS_READ_PER_YEAR / UNITS_PER_LOAD;

export function hasScrollToRead(library: Building): boolean {
  return library.scrolls >= 1;
}

export function tickReading(state: GameState): void {
  for (const scholars of state.buildings.filter((b) => b.type === 'scholarsHouse')) read(state, scholars, annexOf(state, scholars));
}

function read(state: GameState, scholars: Building, library: Building): void {
  if (!hasScrollToRead(library)) return;
  scholars.production++;
  if (scholars.production < READING_TICKS_PER_UNIT) return;
  scholars.production = 0;
  library.scrolls--;
  recordFlow(state, 'used', 'scrolls', 1);
  scholars.pages++;
  if (scholars.pages < UNITS_PER_LOAD) return;
  scholars.pages = 0;
  state.worksOfArt++;
  postNotice(state, `The scholars at ${scholars.x},${scholars.y} completed a Work of Art`, scholars);
  state.version++;
}

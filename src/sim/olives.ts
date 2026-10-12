import { TICKS_PER_YEAR } from './clock';
import type { Building, GameState } from './state';

export const RIPE_CROP = 1;
export const OLIVE_RIPENING_TICKS = TICKS_PER_YEAR;

export function isRipe(tree: Building): boolean {
  return tree.growth >= RIPE_CROP;
}

export function ripenOlives(state: GameState): void {
  for (const tree of state.buildings.filter((b) => b.type === 'oliveTree')) {
    if (isRipe(tree)) continue;
    tree.growth = Math.min(RIPE_CROP, tree.growth + RIPE_CROP / OLIVE_RIPENING_TICKS);
    if (isRipe(tree)) state.version++;
  }
}

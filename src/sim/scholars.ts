import { BUILDING_SPECS } from './buildings';
import { annexOf } from './elites';
import { UNITS_PER_LOAD, monthlyUse } from './food';
import { postNotice } from './notices';
import type { Building, GameState } from './state';
import { upgraded } from './upgrades';

export const PAGES_PER_WORK_OF_ART = UNITS_PER_LOAD;
export const LYCEUM_PAGES_PER_WORK_OF_ART = 75;

export function pagesPerWorkOfArt(state: GameState): number {
  return upgraded(state, 'lyceum', PAGES_PER_WORK_OF_ART, LYCEUM_PAGES_PER_WORK_OF_ART);
}

export function readScrolls(state: GameState): void {
  for (const scholars of state.buildings.filter((b) => b.type === 'scholarsHouse')) read(state, scholars, annexOf(state, scholars));
}

function read(state: GameState, scholars: Building, library: Building): void {
  const unitsRead = Math.min(scholars.scrolls, monthlyUse(scholars, 'scrolls'));
  scholars.pages += (unitsRead * library.workers) / BUILDING_SPECS.library.workers;
  if (scholars.pages < pagesPerWorkOfArt(state)) return;
  scholars.pages -= pagesPerWorkOfArt(state);
  state.worksOfArt++;
  postNotice(state, `The scholars at ${scholars.x},${scholars.y} completed a Work of Art`, scholars);
  state.version++;
}

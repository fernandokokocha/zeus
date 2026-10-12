import { TICKS_PER_MONTH } from './clock';
import { tickCarriers } from './carriers';
import { settleMonth } from './economy';
import { eat, growCrops, harvestIfDue } from './food';
import { evolveHouses } from './housing';
import { assignWorkers } from './labor';
import { tickOlives } from './olives';
import { tickRoamers } from './roamers';
import { tickSchools } from './schools';
import { tickSettlers } from './settlers';
import { tickSheep } from './sheep';
import type { GameState } from './state';

export function tick(state: GameState): void {
  state.tick++;
  assignWorkers(state);
  growCrops(state);
  if (state.tick % TICKS_PER_MONTH === 0) {
    settleMonth(state);
    harvestIfDue(state);
    eat(state);
  }
  tickSettlers(state);
  tickRoamers(state);
  tickCarriers(state);
  tickSchools(state);
  tickSheep(state);
  tickOlives(state);
  evolveHouses(state);
}

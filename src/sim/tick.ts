import { tallyWellFed } from './charters';
import { TICKS_PER_MONTH } from './clock';
import { tickCarriers } from './carriers';
import { tickCloth } from './cloth';
import { settleMonth } from './economy';
import { eat, growCrops, harvestIfDue } from './food';
import { announceGuildSites, tickGuilds } from './guild';
import { evolveHouses } from './housing';
import { assignWorkers } from './labor';
import { earnMonuments } from './monuments';
import { tickMaterials } from './materials';
import { tickOlives } from './olives';
import { recordPopulation } from './population';
import { closeProductionMonth } from './production';
import { tickSanctuaries } from './sanctuaries';
import { tickSafety } from './safety';
import { tickRoamers } from './roamers';
import { tickSchools } from './schools';
import { tickSettlers } from './settlers';
import { tickSheep } from './sheep';
import type { GameState } from './state';

export function tick(state: GameState): void {
  state.tick++;
  earnMonuments(state);
  const monthEnds = state.tick % TICKS_PER_MONTH === 0;
  assignWorkers(state);
  growCrops(state);
  if (monthEnds) {
    settleMonth(state);
    recordPopulation(state);
    harvestIfDue(state);
    tallyWellFed(state);
    eat(state);
  }
  tickSettlers(state);
  tickRoamers(state);
  tickCarriers(state);
  tickSchools(state);
  tickSheep(state);
  tickOlives(state);
  tickCloth(state);
  tickMaterials(state);
  tickSanctuaries(state);
  evolveHouses(state);
  tickGuilds(state);
  announceGuildSites(state);
  tickSafety(state);
  if (monthEnds) closeProductionMonth(state);
}

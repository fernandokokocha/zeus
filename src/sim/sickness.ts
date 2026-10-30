import { footprintDistance } from './buildings';
import { TICKS_PER_MONTH } from './clock';
import { footprint } from './commands';
import { isElite, isResidence, type HouseLevel } from './housing';
import { postNotice } from './notices';
import { nextRandom } from './rng';
import { RISK_LIMIT } from './safety';
import type { Building, GameState } from './state';

export const DISEASE_RISK_INCREMENTS: Record<HouseLevel, number> = {
  hut: 20,
  shack: 15,
  hovel: 15,
  homestead: 10,
  tenement: 10,
  apartment: 5,
  townhouse: 5,
};
export const ELITE_DISEASE_RISK_INCREMENT = DISEASE_RISK_INCREMENTS.townhouse;
export const PLAGUE_SPREAD_PER_MONTH = 60;
export const PLAGUE_REACH = 1;
export const PLAGUE_DEATH_SHARE = 1 / 4;
export const ONSET_CHANCE_PER_TICK = 1 / TICKS_PER_MONTH;

const FULL_RISK = RISK_LIMIT * TICKS_PER_MONTH;

export function canFallSick(building: Building): boolean {
  return isResidence(building) && building.residents > 0;
}

function diseaseIncrement(residence: Building): number {
  return isElite(residence) ? ELITE_DISEASE_RISK_INCREMENT : DISEASE_RISK_INCREMENTS[residence.level];
}

function atMost(risk: number): number {
  return Math.min(risk, FULL_RISK);
}

export function tickSickness(state: GameState): void {
  const residences = state.buildings.filter(isResidence);
  for (const residence of residences) {
    if (canFallSick(residence)) residence.diseaseRisk = atMost(residence.diseaseRisk + diseaseIncrement(residence));
    else heal(residence);
  }
  const exposed = spreadPlague(residences);
  for (const residence of residences) {
    if (!canFallSick(residence) || residence.sick || residence.diseaseRisk < FULL_RISK) continue;
    if (exposed.has(residence) || nextRandom(state) < ONSET_CHANCE_PER_TICK) fallSick(state, residence);
  }
}

function spreadPlague(residences: Building[]): Set<Building> {
  const exposed = new Set<Building>();
  for (const sick of residences.filter((r) => r.sick)) {
    for (const neighbour of residences.filter((r) => r !== sick && canFallSick(r) && isWithin(sick, r, PLAGUE_REACH))) {
      neighbour.diseaseRisk = atMost(neighbour.diseaseRisk + PLAGUE_SPREAD_PER_MONTH);
      exposed.add(neighbour);
    }
  }
  return exposed;
}

function isWithin(a: Building, b: Building, reach: number): boolean {
  return footprint(b).some((tile) => footprintDistance(a, tile) <= reach);
}

export function fallSick(state: GameState, residence: Building): void {
  residence.sick = true;
  postNotice(state, `Plague at ${residence.x},${residence.y}`, residence);
}

export function plagueMonth(state: GameState): void {
  for (const sick of state.buildings.filter((b) => b.sick)) {
    const deaths = Math.ceil(sick.residents * PLAGUE_DEATH_SHARE);
    sick.residents -= deaths;
    state.plagueDeaths.thisYear += deaths;
    if (sick.residents === 0) {
      heal(sick);
      state.version++;
    }
  }
}

export function heal(residence: Building): void {
  residence.diseaseRisk = 0;
  residence.sick = false;
}

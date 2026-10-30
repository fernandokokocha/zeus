import { appealMap, houseAppeal } from './appeal';
import { BUILDING_SPECS } from './buildings';
import { ELITE_TYPES, HOUSE_LEVELS, NEXT_LEVEL, evolutionBlockers, houseLevel, type EvolutionBlocker, type HouseLevel } from './housing';
import { population } from './settlers';
import type { GameState } from './state';
import { yearLabels } from './treasury';

export interface PopulationReport {
  history: number[];
  levels: { name: string; houses: number; people: number }[];
  blockers: { reason: string; houses: number }[];
  plagueDeaths: { thisYear: YearDeaths; lastYear: YearDeaths | null };
}

export interface YearDeaths {
  label: string;
  deaths: number;
}

export function recordPopulation(state: GameState): void {
  state.populationHistory.push(population(state));
}

function housingLevels(state: GameState): PopulationReport['levels'] {
  const houses = state.buildings.filter((b) => b.type === 'house');
  const levels = (Object.keys(HOUSE_LEVELS) as HouseLevel[]).map((level) => {
    const atLevel = houses.filter((house) => houseLevel(house) === level);
    return { name: HOUSE_LEVELS[level].name, houses: atLevel.length, people: atLevel.reduce((sum, house) => sum + house.residents, 0) };
  });
  const elites = ELITE_TYPES.map((type) => {
    const elitesOfType = state.buildings.filter((b) => b.type === type);
    return { name: BUILDING_SPECS[type].name, houses: elitesOfType.length, people: elitesOfType.reduce((sum, elite) => sum + elite.residents, 0) };
  });
  return [...levels, ...elites];
}

function blockerReason(blocker: EvolutionBlocker): string {
  return `needs: ${blocker.kind === 'need' ? blocker.need : `${blocker.kind} ${blocker.needs}`}`;
}

function heldBack(state: GameState): PopulationReport['blockers'] {
  const map = appealMap(state);
  const counts = new Map<string, number>();
  for (const house of state.buildings.filter((b) => b.type === 'house')) {
    const level = houseLevel(house);
    if (!level) continue;
    const next = NEXT_LEVEL[level];
    if (!next) continue;
    for (const blocker of evolutionBlockers(state, house, level, next, houseAppeal(state, house, map))) {
      const reason = blockerReason(blocker);
      counts.set(reason, (counts.get(reason) ?? 0) + 1);
    }
  }
  return [...counts].map(([reason, houses]) => ({ reason, houses })).sort((a, b) => b.houses - a.houses);
}

function plagueDeaths(state: GameState): PopulationReport['plagueDeaths'] {
  const labels = yearLabels(state);
  const { thisYear, lastYear } = state.plagueDeaths;
  return {
    thisYear: { label: labels.thisYear, deaths: thisYear },
    lastYear: labels.lastYear === null ? null : { label: labels.lastYear, deaths: lastYear },
  };
}

export function populationReport(state: GameState): PopulationReport {
  return { history: state.populationHistory, levels: housingLevels(state), blockers: heldBack(state), plagueDeaths: plagueDeaths(state) };
}

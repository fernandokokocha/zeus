import { appealMap, houseAppeal } from './appeal';
import { BUILDING_SPECS } from './buildings';
import { HOUSE_LEVELS, NEXT_LEVEL, evolutionBlockers, houseLevel, type EvolutionBlocker, type HouseLevel } from './housing';
import { population } from './settlers';
import type { GameState } from './state';

export interface PopulationReport {
  history: number[];
  levels: { name: string; houses: number; people: number }[];
  blockers: { reason: string; houses: number }[];
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
  const guilds = state.buildings.filter((b) => b.type === 'tradersGuild');
  const guildPeople = guilds.reduce((sum, guild) => sum + guild.residents, 0);
  return [...levels, { name: BUILDING_SPECS.tradersGuild.name, houses: guilds.length, people: guildPeople }];
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

export function populationReport(state: GameState): PopulationReport {
  return { history: state.populationHistory, levels: housingLevels(state), blockers: heldBack(state) };
}

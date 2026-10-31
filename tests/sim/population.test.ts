import { describe, expect, it } from 'vitest';
import { TICKS_PER_MONTH } from '../../src/sim/clock';
import { placeBuilding } from '../../src/sim/commands';
import { HOUSE_LEVELS, type HouseLevel } from '../../src/sim/housing';
import { populationReport } from '../../src/sim/population';
import { population } from '../../src/sim/settlers';
import { createGame, type GameState } from '../../src/sim/state';
import { grassGame, placeHouse, placedGuild, runTicks } from './helpers';

function settle(game: GameState, x: number, y: number, level: HouseLevel, residents: number, food = 0): void {
  placeHouse(game, x, y);
  Object.assign(game.buildings[game.buildings.length - 1], { level, residents, food });
}

describe('population history', () => {
  it('starts at the founding with nobody', () => {
    expect(populationReport(createGame()).history).toEqual([0]);
  });

  it('gains a point each month with the population then', () => {
    const game = grassGame();
    placeHouse(game, 2, 8);
    runTicks(game, TICKS_PER_MONTH);
    const first = population(game);
    runTicks(game, TICKS_PER_MONTH - 1);
    expect(populationReport(game).history).toEqual([0, first]);
    runTicks(game, 1);
    expect(populationReport(game).history).toEqual([0, first, population(game)]);
    expect(first).toBeGreaterThan(0);
  });
});

describe('housing by level', () => {
  it('counts houses and people per level, empty levels as 0, and leaves out vacant lots', () => {
    const game = grassGame();
    settle(game, 2, 2, 'hut', 5);
    settle(game, 4, 2, 'hut', 8);
    settle(game, 6, 2, 'hovel', 20);
    placeHouse(game, 8, 2);
    const levels = populationReport(game).levels;
    expect(levels.map(({ name }) => name)).toEqual([...Object.values(HOUSE_LEVELS).map(({ name }) => name), "Traders' Guild", "Scholars' House", "Warriors' House"]);
    expect(levels[0]).toEqual({ name: 'Hut', houses: 2, people: 13 });
    expect(levels[1]).toEqual({ name: 'Shack', houses: 0, people: 0 });
    expect(levels[2]).toEqual({ name: 'Hovel', houses: 1, people: 20 });
  });

  it("counts a Traders' Guild and its merchants", () => {
    const { game, guild } = placedGuild();
    expect(populationReport(game).levels.find((l) => l.name === "Traders' Guild")).toEqual({ name: "Traders' Guild", houses: 1, people: guild.residents });
  });
});

describe('what holds houses back', () => {
  it('counts each house under every reason it is not evolving, most common first', () => {
    const game = grassGame();
    settle(game, 2, 2, 'hut', 8);
    settle(game, 4, 2, 'hut', 8);
    settle(game, 6, 2, 'shack', 16, 5);
    expect(populationReport(game).blockers).toEqual([
      { reason: 'needs: food', houses: 2 },
      { reason: 'needs: water', houses: 1 },
      { reason: 'needs: culture 15', houses: 1 },
    ]);
  });

  it('names the appeal a house needs, not the appeal it has', () => {
    const game = grassGame();
    settle(game, 2, 13, 'hut', 8, 5);
    placeBuilding(game, 'granary', 4, 11);
    expect(populationReport(game).blockers).toEqual([{ reason: 'needs: appeal -10', houses: 1 }]);
  });

  it('leaves out houses that are ready and townhouses, which have nowhere to go', () => {
    const game = grassGame();
    settle(game, 2, 2, 'hut', 8, 5);
    settle(game, 4, 2, 'townhouse', 60);
    expect(populationReport(game).blockers).toEqual([]);
  });
});

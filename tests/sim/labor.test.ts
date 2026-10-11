import { describe, expect, it } from 'vitest';
import { placeBuilding, placeRoad } from '../../src/sim/commands';
import { assignWorkers, laborSummary, workforce } from '../../src/sim/labor';
import type { GameState } from '../../src/sim/state';
import { grassGame, placeHouse } from './helpers';

function gameWithPopulation(people: number): GameState {
  const game = grassGame();
  placeRoad(game, { x: 0, y: 10 }, { x: 19, y: 10 });
  placeHouse(game, 0, 18);
  game.buildings[0].residents = people;
  return game;
}

describe('workforce', () => {
  it('is 52% of the population, rounded down', () => {
    expect(workforce(gameWithPopulation(8))).toBe(4);
    expect(workforce(gameWithPopulation(25))).toBe(13);
  });
});

describe('assignWorkers', () => {
  it('staffs buildings in placement order until the workforce runs out', () => {
    const game = gameWithPopulation(12);
    placeBuilding(game, 'taxOffice', 2, 11);
    placeBuilding(game, 'fountain', 5, 11);
    assignWorkers(game);
    expect(game.buildings.map((b) => b.workers)).toEqual([0, 6, 0]);
  });

  it('fills an earlier building first and gives the rest to later ones', () => {
    const game = gameWithPopulation(20);
    placeBuilding(game, 'fountain', 2, 11);
    placeBuilding(game, 'taxOffice', 5, 11);
    assignWorkers(game);
    expect(game.buildings.map((b) => b.workers)).toEqual([0, 4, 6]);
  });

  it('hires nobody for a building without road access', () => {
    const game = gameWithPopulation(20);
    placeBuilding(game, 'fountain', 2, 14);
    placeBuilding(game, 'taxOffice', 5, 11);
    assignWorkers(game);
    expect(game.buildings.map((b) => b.workers)).toEqual([0, 0, 8]);
  });
});

describe('laborSummary', () => {
  it('reports the workforce, the jobs on offer and how many are filled', () => {
    const game = gameWithPopulation(20);
    placeBuilding(game, 'fountain', 2, 11);
    placeBuilding(game, 'taxOffice', 5, 11);
    placeBuilding(game, 'fountain', 8, 14);
    assignWorkers(game);
    expect(laborSummary(game)).toEqual({ workforce: 10, jobs: 12, employed: 10 });
  });
});

describe('assignWorkers and the picture', () => {
  it('bumps the version when a building starts or stops working, and only then', () => {
    const game = gameWithPopulation(0);
    placeBuilding(game, 'fountain', 2, 11);
    assignWorkers(game);
    const idle = game.version;
    game.buildings[0].residents = 4;
    assignWorkers(game);
    expect(game.version).toBe(idle + 1);
    game.buildings[0].residents = 8;
    assignWorkers(game);
    expect(game.version).toBe(idle + 1);
    game.buildings[0].residents = 0;
    assignWorkers(game);
    expect(game.version).toBe(idle + 2);
  });
});

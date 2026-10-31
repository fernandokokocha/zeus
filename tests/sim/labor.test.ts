import { describe, expect, it } from 'vitest';
import { placeBuilding, placeRoad } from '../../src/sim/commands';
import { assignWorkers, laborSummary, prioritiesReport, setIndustryOpen, setIndustryPriority, workforce } from '../../src/sim/labor';
import { runTicks } from './helpers';
import { PRESS_OLIVE_CAPACITY } from '../../src/sim/olives';
import { UNITS_PER_LOAD } from '../../src/sim/food';
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

  it('staffs a vendor whose agora touches the road', () => {
    const game = gameWithPopulation(20);
    placeBuilding(game, 'agora', 2, 11);
    placeBuilding(game, 'foodVendor', 2, 13);
    assignWorkers(game);
    expect(game.buildings.map((b) => b.workers)).toEqual([0, 0, 4]);
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

function cityWith(people: number, ...types: Parameters<typeof placeBuilding>[1][]): GameState {
  const game = gameWithPopulation(people);
  types.forEach((type, i) => expect(placeBuilding(game, type, 2 + 3 * i, 11)).toEqual({ ok: true }));
  assignWorkers(game);
  return game;
}

const staffing = (game: GameState) => game.buildings.slice(1).map((b) => b.workers);

describe('industry priorities', () => {
  it('staffs priority 1 industries before everything else', () => {
    const game = cityWith(40, 'fountain', 'olivePress', 'weaver');
    setIndustryPriority(game, 'weaver', 1);
    expect(staffing(game)).toEqual([4, 4, 12]);
  });

  it('staffs priority 1, then 2, then 3, then the rest in placement order', () => {
    const game = cityWith(80, 'taxOffice', 'masonryShop', 'olivePress', 'weaver', 'timberMill');
    setIndustryPriority(game, 'timberMill', 3);
    setIndustryPriority(game, 'olivePress', 2);
    setIndustryPriority(game, 'weaver', 1);
    expect(staffing(game)).toEqual([5, 0, 12, 12, 12]);
  });

  it('keeps services and houses in placement order with industries that have no priority', () => {
    const game = cityWith(40, 'olivePress', 'fountain', 'taxOffice');
    expect(staffing(game)).toEqual([12, 4, 4]);
    setIndustryPriority(game, 'olivePress', 0);
    expect(staffing(game)).toEqual([12, 4, 4]);
  });

  it('gives a closed industry no workers, and opening it restores them', () => {
    const game = cityWith(40, 'olivePress', 'fountain');
    setIndustryOpen(game, 'olivePress', false);
    expect(staffing(game)).toEqual([0, 4]);
    expect(laborSummary(game).jobs).toBe(4);
    setIndustryOpen(game, 'olivePress', true);
    expect(staffing(game)).toEqual([12, 4]);
  });

  it('applies to industry buildings placed later', () => {
    const game = cityWith(40, 'fountain');
    setIndustryOpen(game, 'weaver', false);
    placeBuilding(game, 'weaver', 8, 11);
    runTicks(game, 1);
    expect(staffing(game)).toEqual([4, 0]);
  });

  it('lets a closed press take no olives', () => {
    const game = cityWith(80, 'olivePress', 'growersLodge');
    const [, press, lodge] = game.buildings;
    lodge.olives = 4 * UNITS_PER_LOAD;
    setIndustryOpen(game, 'olivePress', false);
    runTicks(game, 200);
    expect(press.olives).toBe(0);
    setIndustryOpen(game, 'olivePress', true);
    runTicks(game, 200);
    expect(press.olives + press.oil).toBeGreaterThan(0);
    expect(press.olives).toBeLessThanOrEqual(PRESS_OLIVE_CAPACITY);
  });
});

describe('prioritiesReport', () => {
  it('lists every industry with its buildings, workers, full staff and settings', () => {
    const game = cityWith(30, 'olivePress', 'olivePress', 'fountain');
    setIndustryPriority(game, 'olivePress', 2);
    setIndustryOpen(game, 'weaver', false);
    const report = prioritiesReport(game);
    expect(report.workers).toBe(15);
    expect(report.jobs).toBe(28);
    expect(report.industries.map((row) => row.industry)).toEqual([
      'wheatFarm', 'carrotFarm', 'cardingShed', 'growersLodge', 'olivePress', 'weaver', 'scriptorium', 'timberMill', 'masonryShop', 'foundry', 'sculptureStudio', 'armory',
    ]);
    expect(report.industries[4]).toEqual({ industry: 'olivePress', name: 'Olive Press', buildings: 2, workers: 15, jobs: 24, priority: 2, open: true });
    expect(report.industries[5]).toEqual({ industry: 'weaver', name: 'Weaver', buildings: 0, workers: 0, jobs: 0, priority: 0, open: false });
  });

  it('counts the full staff of a closed industry, so the player sees what opening it takes', () => {
    const game = cityWith(30, 'olivePress');
    setIndustryOpen(game, 'olivePress', false);
    expect(prioritiesReport(game).industries[4]).toMatchObject({ workers: 0, jobs: 12 });
  });
});

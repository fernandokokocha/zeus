import { describe, expect, it } from 'vitest';
import { placeBuilding, placeRoad } from '../../src/sim/commands';
import { assignWorkers, laborSummary, prioritiesReport, setPriority, workforce } from '../../src/sim/labor';
import { BUILDING_SPECS, type BuildingType } from '../../src/sim/buildings';
import { CLOSED, DEFAULT_PRIORITY, SERVICES, SERVICE_SPECS, branchOf } from '../../src/sim/branches';
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
  it('splits a short workforce across buildings in proportion to their posts', () => {
    const game = gameWithPopulation(12);
    placeBuilding(game, 'taxOffice', 2, 11);
    placeBuilding(game, 'fountain', 5, 11);
    assignWorkers(game);
    expect(game.buildings.map((b) => b.workers)).toEqual([0, 4, 2]);
  });

  it('gives the workers left after rounding to the largest shares, not to the oldest building', () => {
    const game = gameWithPopulation(20);
    placeBuilding(game, 'fountain', 2, 11);
    placeBuilding(game, 'taxOffice', 5, 11);
    assignWorkers(game);
    expect(game.buildings.map((b) => b.workers)).toEqual([0, 3, 7]);
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

describe('priorities', () => {
  it('puts every branch at priority 2 until the player changes it', () => {
    const report = prioritiesReport(grassGame());
    expect([...report.industries, ...report.services].every((row) => row.priority === DEFAULT_PRIORITY)).toBe(true);
    expect(DEFAULT_PRIORITY).toBe(2);
  });

  it('staffs priority 1 first and splits the rest across priority 2', () => {
    const game = cityWith(40, 'fountain', 'olivePress', 'weaver');
    setPriority(game, 'weaver', 1);
    expect(staffing(game)).toEqual([2, 6, 12]);
  });

  it('staffs priority 1, then 2, then 3', () => {
    const game = cityWith(80, 'taxOffice', 'masonryShop', 'olivePress', 'weaver', 'timberMill');
    setPriority(game, 'weaver', 1);
    setPriority(game, 'masonryShop', 3);
    setPriority(game, 'timberMill', 3);
    expect(staffing(game)).toEqual([8, 5, 12, 12, 4]);
  });

  it('sets a service branch for all its buildings at once', () => {
    const game = cityWith(20, 'olivePress', 'fountain', 'maintenanceOffice');
    setPriority(game, 'hygiene', 1);
    expect(staffing(game)).toEqual([1, 4, 5]);
  });

  it('gives a closed industry no workers, and reopening it restores them', () => {
    const game = cityWith(40, 'olivePress', 'fountain');
    setPriority(game, 'olivePress', CLOSED);
    expect(staffing(game)).toEqual([0, 4]);
    expect(laborSummary(game).jobs).toBe(4);
    setPriority(game, 'olivePress', 2);
    expect(staffing(game)).toEqual([12, 4]);
  });

  it('gives a closed service branch no workers', () => {
    const game = cityWith(40, 'olivePress', 'fountain', 'taxOffice');
    setPriority(game, 'hygiene', CLOSED);
    expect(staffing(game)).toEqual([12, 0, 8]);
  });

  it('applies to buildings placed later', () => {
    const game = cityWith(40, 'fountain');
    setPriority(game, 'weaver', CLOSED);
    placeBuilding(game, 'weaver', 8, 11);
    runTicks(game, 1);
    expect(staffing(game)).toEqual([4, 0]);
  });

  it('lets a closed press take no olives', () => {
    const game = cityWith(80, 'olivePress', 'growersLodge');
    const [, press, lodge] = game.buildings;
    lodge.olives = 4 * UNITS_PER_LOAD;
    setPriority(game, 'olivePress', CLOSED);
    runTicks(game, 200);
    expect(press.olives).toBe(0);
    setPriority(game, 'olivePress', 2);
    runTicks(game, 200);
    expect(press.olives + press.oil).toBeGreaterThan(0);
    expect(press.olives).toBeLessThanOrEqual(PRESS_OLIVE_CAPACITY);
  });
});

describe('branches', () => {
  const types = Object.keys(BUILDING_SPECS) as BuildingType[];

  it('give every building with posts a branch', () => {
    for (const type of types.filter((t) => BUILDING_SPECS[t].workers > 0)) expect(() => branchOf(type)).not.toThrow();
  });

  it('never share a building', () => {
    const members = SERVICES.flatMap((service) => SERVICE_SPECS[service].buildings);
    expect(new Set(members).size).toBe(members.length);
  });

  it('refuse a building that employs nobody', () => {
    expect(() => branchOf('house')).toThrow();
  });
});

describe('prioritiesReport', () => {
  it('lists every industry together, then every service branch, with buildings, workers, full staff and priority', () => {
    const game = cityWith(30, 'olivePress', 'olivePress', 'fountain');
    setPriority(game, 'olivePress', 1);
    setPriority(game, 'weaver', CLOSED);
    const report = prioritiesReport(game);
    expect(report.workers).toBe(15);
    expect(report.jobs).toBe(28);
    expect(report.industries.map((row) => row.branch)).toEqual([
      'wheatFarm', 'carrotFarm', 'cardingShed', 'growersLodge', 'olivePress', 'weaver', 'scriptorium', 'timberMill', 'masonryShop', 'foundry', 'sculptureStudio', 'armory',
    ]);
    expect(report.services.map((row) => row.name)).toEqual(['Distribution', 'Hygiene & Safety', 'Administration', 'Culture', 'Military', 'Sanctuaries']);
    expect(report.industries[4]).toEqual({ branch: 'olivePress', name: 'Olive Press', buildings: 2, workers: 15, jobs: 24, priority: 1 });
    expect(report.industries[5]).toEqual({ branch: 'weaver', name: 'Weaver', buildings: 0, workers: 0, jobs: 0, priority: CLOSED });
    expect(report.services[1]).toEqual({ branch: 'hygiene', name: 'Hygiene & Safety', buildings: 1, workers: 0, jobs: 4, priority: 2 });
  });

  it('counts the full staff of a closed branch, so the player sees what opening it takes', () => {
    const game = cityWith(30, 'olivePress');
    setPriority(game, 'olivePress', CLOSED);
    expect(prioritiesReport(game).industries[4]).toMatchObject({ workers: 0, jobs: 12 });
  });
});

import { describe, expect, it } from 'vitest';
import { BUILDING_SPECS } from '../../src/sim/buildings';
import { TICKS_PER_MONTH, TICKS_PER_YEAR } from '../../src/sim/clock';
import { placeBuilding, placeRoad, placeRoadblock, placeSheep } from '../../src/sim/commands';
import { createGame, type GameState } from '../../src/sim/state';
import { ROADBLOCK_COST, ROAD_TILE_COST, SHEEP_COST, STARTING_TREASURY, treasuryReport } from '../../src/sim/treasury';
import { grassGame, meadowGame, placeHouse, runTicks, setTerrain } from './helpers';

describe('treasury', () => {
  it('starts at 5,000 dr', () => {
    expect(STARTING_TREASURY).toBe(5000);
    expect(createGame().treasury).toBe(STARTING_TREASURY);
  });

  it('charges each new road tile', () => {
    const game = grassGame();
    placeRoad(game, { x: 1, y: 1 }, { x: 4, y: 1 });
    expect(game.treasury).toBe(STARTING_TREASURY - 4 * ROAD_TILE_COST);
  });

  it('does not charge for tiles that are already road', () => {
    const game = grassGame();
    placeRoad(game, { x: 3, y: 0 }, { x: 3, y: 2 });
    const before = game.treasury;
    placeRoad(game, { x: 2, y: 1 }, { x: 4, y: 1 });
    expect(game.treasury).toBe(before - 2 * ROAD_TILE_COST);
  });

  it('spends nothing on a rejected road', () => {
    const game = grassGame();
    setTerrain(game, 3, 1, 'water');
    placeRoad(game, { x: 1, y: 1 }, { x: 5, y: 1 });
    expect(game.treasury).toBe(STARTING_TREASURY);
  });

  it('may go negative and building still works', () => {
    const game = grassGame();
    game.treasury = 1;
    expect(placeRoad(game, { x: 1, y: 1 }, { x: 3, y: 1 })).toEqual({ ok: true });
    expect(game.treasury).toBe(1 - 3 * ROAD_TILE_COST);
  });
});

function workingTown(): GameState {
  const game = grassGame();
  placeRoad(game, { x: 0, y: 10 }, { x: 19, y: 10 });
  placeHouse(game, 2, 8);
  game.buildings[0].residents = 8;
  placeBuilding(game, 'fountain', 6, 11);
  return game;
}

describe('the books', () => {
  it('book roads, roadblocks and buildings as construction', () => {
    const game = grassGame();
    placeRoad(game, { x: 1, y: 1 }, { x: 4, y: 1 });
    placeRoadblock(game, { x: 2, y: 1 });
    placeBuilding(game, 'fountain', 6, 2);
    expect(game.accounts.thisYear).toEqual({
      taxes: 0,
      trade: 0,
      wages: 0,
      construction: 4 * ROAD_TILE_COST + ROADBLOCK_COST + BUILDING_SPECS.fountain.cost,
      sheep: 0,
      imports: 0,
    });
  });

  it('book sheep as sheep', () => {
    const game = meadowGame();
    placeSheep(game, { x: 3, y: 3 });
    expect(game.accounts.thisYear.sheep).toBe(SHEEP_COST);
    expect(game.accounts.thisYear.construction).toBe(0);
  });

  it('book each month’s wages and taxes', () => {
    const game = workingTown();
    placeBuilding(game, 'palace', 6, 4);
    game.buildings[0].coveredUntil.tax = 3 * TICKS_PER_MONTH;
    runTicks(game, 2 * TICKS_PER_MONTH);
    expect(game.accounts.thisYear.wages).toBeCloseTo(2 * game.lastMonth.wages);
    expect(game.accounts.thisYear.taxes).toBeCloseTo(2 * game.lastMonth.taxes);
    expect(game.lastMonth.wages).toBeGreaterThan(0);
    expect(game.lastMonth.taxes).toBeGreaterThan(0);
  });

  it('roll over in January, before that month is settled', () => {
    const game = workingTown();
    runTicks(game, TICKS_PER_YEAR - 1);
    const year1 = { ...game.accounts.thisYear };
    runTicks(game, 1);
    expect(game.accounts.lastYear).toEqual(year1);
    expect(game.accounts.thisYear).toEqual({ taxes: 0, trade: 0, wages: game.lastMonth.wages, construction: 0, sheep: 0, imports: 0 });
  });
});

describe('treasuryReport', () => {
  it('has no last year in year 1', () => {
    const game = grassGame();
    game.treasury = 1234;
    expect(treasuryReport(game)).toEqual({
      treasury: 1234,
      worksOfArt: 0,
      thisYear: { label: 'Year 1, so far', accounts: game.accounts.thisYear },
      lastYear: null,
    });
  });

  it('labels this year and last year', () => {
    const game = grassGame();
    game.tick = 3 * TICKS_PER_YEAR + 5;
    const report = treasuryReport(game);
    expect(report.thisYear.label).toBe('Year 4, so far');
    expect(report.lastYear).toEqual({ label: 'Year 3', accounts: game.accounts.lastYear });
  });
});

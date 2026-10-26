import { describe, expect, it } from 'vitest';
import { TICKS_PER_MONTH } from '../../src/sim/clock';
import { demolish, placeBuilding, placeRoad } from '../../src/sim/commands';
import { houseTax, settleMonth } from '../../src/sim/economy';
import type { Building, GameState } from '../../src/sim/state';
import { tick } from '../../src/sim/tick';
import { grassGame, placeHouse, runTicks } from './helpers';

function town(): { game: GameState; house: Building } {
  const game = grassGame();
  placeRoad(game, { x: 0, y: 10 }, { x: 19, y: 10 });
  placeHouse(game, 2, 8);
  const house = game.buildings[0];
  house.residents = 8;
  return { game, house };
}

function runToMonthStart(game: GameState): number {
  runTicks(game, TICKS_PER_MONTH - 1 - (game.tick % TICKS_PER_MONTH));
  const before = game.treasury;
  tick(game);
  return game.treasury - before;
}

describe('houseTax', () => {
  it('is the tax multiplier × residents × 0.09 a month', () => {
    const { house } = town();
    expect(houseTax(house)).toBeCloseTo(8 * 0.09);
  });
});

describe('wages', () => {
  it('are paid at the start of each month for employed workers only', () => {
    const { game } = town();
    placeBuilding(game, 'fountain', 6, 11);
    placeBuilding(game, 'taxOffice', 9, 11);
    expect(runToMonthStart(game)).toBeCloseTo(-4 * 3 / 12);
    expect(game.lastMonth.wages).toBeCloseTo(1);
  });

  it('cost nothing when nobody works', () => {
    const { game } = town();
    expect(runToMonthStart(game)).toBe(0);
  });
});

describe('taxes', () => {
  it('are paid monthly by houses a tax collector passed, with a Palace on a road', () => {
    const { game, house } = town();
    placeBuilding(game, 'palace', 6, 4);
    house.coveredUntil.tax = 2 * TICKS_PER_MONTH;
    expect(runToMonthStart(game)).toBeCloseTo(houseTax(house));
    expect(game.lastMonth.taxes).toBeCloseTo(houseTax(house));
  });

  it('are not paid by a house no collector has passed recently', () => {
    const { game } = town();
    placeBuilding(game, 'palace', 6, 4);
    expect(runToMonthStart(game)).toBe(0);
  });

  it('need a Palace', () => {
    const { game, house } = town();
    house.coveredUntil.tax = 2 * TICKS_PER_MONTH;
    expect(runToMonthStart(game)).toBe(0);
  });

  it('need the Palace to touch a road', () => {
    const { game, house } = town();
    placeBuilding(game, 'palace', 6, 0);
    house.coveredUntil.tax = 2 * TICKS_PER_MONTH;
    expect(runToMonthStart(game)).toBe(0);
  });

  it('stop when the Palace is demolished', () => {
    const { game, house } = town();
    placeBuilding(game, 'palace', 6, 4);
    house.coveredUntil.tax = 3 * TICKS_PER_MONTH;
    runToMonthStart(game);
    demolish(game, { x: 6, y: 4 }, { x: 6, y: 4 });
    expect(runToMonthStart(game)).toBe(0);
  });
});

describe('tax paid', () => {
  it('is recorded on the house each month, 0 when it paid nothing', () => {
    const { game, house } = town();
    placeBuilding(game, 'palace', 6, 4);
    runToMonthStart(game);
    house.coveredUntil.tax = game.tick + 2 * TICKS_PER_MONTH;
    runToMonthStart(game);
    expect(house.taxPaid).toEqual([0, houseTax(house)]);
  });

  it('keeps only the last 12 months', () => {
    const { game, house } = town();
    placeBuilding(game, 'palace', 6, 4);
    house.coveredUntil.tax = 20 * TICKS_PER_MONTH;
    for (let month = 0; month < 13; month++) settleMonth(game);
    house.coveredUntil.tax = 0;
    settleMonth(game);
    expect(house.taxPaid).toEqual([...new Array(11).fill(houseTax(house)), 0]);
  });
});

describe('a tax collector', () => {
  it('registers the houses it passes for tax', () => {
    const { game, house } = town();
    placeBuilding(game, 'palace', 6, 4);
    placeBuilding(game, 'taxOffice', 2, 11);
    runTicks(game, TICKS_PER_MONTH / 2);
    expect(game.roamers.map((r) => r.kind)).toEqual(['taxCollector']);
    expect(house.coveredUntil.tax).toBeGreaterThan(game.tick);
  });
});

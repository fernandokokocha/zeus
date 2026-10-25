import { describe, expect, it } from 'vitest';
import { WELL_FED_MONTHS } from '../../src/sim/charters';
import { TICKS_PER_MONTH } from '../../src/sim/clock';
import { FOOD_PER_RESIDENT_PER_MONTH, UNITS_PER_LOAD } from '../../src/sim/food';
import type { GameState } from '../../src/sim/state';
import { grassGame, placeHouse, runTicks } from './helpers';

const SHACK_RESIDENTS = 16;
const SHACK_MEAL = SHACK_RESIDENTS * FOOD_PER_RESIDENT_PER_MONTH;

function cityWithShack(food = UNITS_PER_LOAD): GameState {
  const game = grassGame();
  placeHouse(game, 4, 4);
  Object.assign(game.buildings[0], { level: 'shack', residents: SHACK_RESIDENTS, food });
  return game;
}

function runMonths(game: GameState, months: number): void {
  runTicks(game, months * TICKS_PER_MONTH);
}

describe('the Well fed charter', () => {
  it('starts at zero months, with no reset and no permit', () => {
    const game = grassGame();
    expect(game.wellFed).toEqual({ months: 0, reset: null });
    expect(game.guildPermits).toBe(0);
  });

  it('counts a month at every meal no house goes hungry', () => {
    const game = cityWithShack();
    runMonths(game, 3);
    expect(game.wellFed.months).toBe(3);
  });

  it(`grants a Traders' Guild permit after ${WELL_FED_MONTHS} fed months and starts again`, () => {
    const game = cityWithShack();
    game.wellFed.months = WELL_FED_MONTHS - 1;
    runMonths(game, 1);
    expect(game.guildPermits).toBe(1);
    expect(game.wellFed).toEqual({ months: 0, reset: null });
    expect(game.notices).toEqual([
      { id: 1, tick: TICKS_PER_MONTH, text: "Charter complete: Well fed. A Traders' Guild permit is granted", at: null },
    ]);
  });

  it('grants another permit for every further streak', () => {
    const game = cityWithShack();
    game.guildPermits = 1;
    game.wellFed.months = WELL_FED_MONTHS - 1;
    runMonths(game, 1);
    expect(game.guildPermits).toBe(2);
  });

  it('resets when a meal empties a house, naming it and the month', () => {
    const game = cityWithShack(SHACK_MEAL);
    game.wellFed.months = 10;
    runMonths(game, 1);
    expect(game.wellFed).toEqual({ months: 0, reset: { tick: TICKS_PER_MONTH, house: 'Shack at 4,4' } });
    expect(game.guildPermits).toBe(0);
  });

  it('resets when a house has nothing left to eat', () => {
    const game = cityWithShack(0);
    game.wellFed.months = 10;
    runMonths(game, 1);
    expect(game.wellFed.reset).toEqual({ tick: TICKS_PER_MONTH, house: 'Shack at 4,4' });
  });

  it('keeps counting while a meal leaves food in the stock', () => {
    const game = cityWithShack(SHACK_MEAL + 1);
    runMonths(game, 1);
    expect(game.wellFed).toEqual({ months: 1, reset: null });
  });

  it('does not count months in which no house eats', () => {
    const game = grassGame();
    placeHouse(game, 4, 4);
    Object.assign(game.buildings[0], { level: 'hut', residents: 8 });
    placeHouse(game, 8, 4);
    runMonths(game, 3);
    expect(game.wellFed).toEqual({ months: 0, reset: null });
  });

  it('is not reset by Huts or vacant lots without food', () => {
    const game = cityWithShack();
    placeHouse(game, 8, 4);
    placeHouse(game, 12, 4);
    Object.assign(game.buildings[2], { level: 'hut', residents: 8 });
    runMonths(game, 2);
    expect(game.wellFed).toEqual({ months: 2, reset: null });
  });
});

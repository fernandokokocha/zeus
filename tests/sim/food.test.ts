import { describe, expect, it } from 'vitest';
import { TICKS_PER_MONTH } from '../../src/sim/clock';
import { placeBuilding, placeRoad } from '../../src/sim/commands';
import { eat } from '../../src/sim/food';
import type { GameState } from '../../src/sim/state';
import { tick } from '../../src/sim/tick';
import { grassGame, placeHouse, runTicks, setMeadow } from './helpers';

function farmGame(people: number): GameState {
  const game = grassGame(30);
  placeRoad(game, { x: 0, y: 15 }, { x: 29, y: 15 });
  placeHouse(game, 0, 28);
  game.buildings[0].residents = people;
  setMeadow(game, 2, 12, 3, 3);
  placeBuilding(game, 'wheatFarm', 2, 12);
  return game;
}

describe('a wheat farm', () => {
  it('grows a quarter of its crop in three months at full staff', () => {
    const game = farmGame(20);
    runTicks(game, 3 * TICKS_PER_MONTH - 1);
    expect(game.buildings[1].growth).toBeCloseTo(0.25, 3);
  });

  it('grows half as fast at half staff', () => {
    const game = farmGame(10);
    runTicks(game, 3 * TICKS_PER_MONTH - 1);
    expect(game.buildings[1].growth).toBeCloseTo(0.125, 3);
  });

  it('grows nothing without workers', () => {
    const game = farmGame(0);
    runTicks(game, 3 * TICKS_PER_MONTH);
    expect(game.buildings[1].growth).toBe(0);
  });

  it('harvests on the first of July: half of 8 loads after half a year', () => {
    const game = farmGame(20);
    const farm = game.buildings[1];
    runTicks(game, 6 * TICKS_PER_MONTH - 1);
    expect(farm.food).toBe(0);
    tick(game);
    expect(farm.food).toBeCloseTo(400);
    expect(farm.growth).toBe(0);
  });
});

describe('the harvest', () => {
  it('comes in whole loads, rounded to the nearest', () => {
    const game = farmGame(20);
    const farm = game.buildings[1];
    runTicks(game, 6 * TICKS_PER_MONTH - 1);
    farm.growth = 0.55;
    tick(game);
    expect(farm.food).toBe(400);
  });
});

describe('eat', () => {
  function houseWith(game: GameState, level: 'hut' | 'shack', residents: number, food: number) {
    placeHouse(game, 4 * game.buildings.length, 0);
    const house = game.buildings[game.buildings.length - 1];
    Object.assign(house, { level, residents, food });
    return house;
  }

  it('feeds a Shack 0.25 units per resident', () => {
    const game = grassGame();
    const shack = houseWith(game, 'shack', 16, 10);
    eat(game);
    expect(shack.food).toBe(6);
  });

  it('never takes a house below zero', () => {
    const game = grassGame();
    const shack = houseWith(game, 'shack', 16, 3);
    eat(game);
    expect(shack.food).toBe(0);
  });

  it('leaves a Hut its food', () => {
    const game = grassGame();
    const hut = houseWith(game, 'hut', 8, 10);
    eat(game);
    expect(hut.food).toBe(10);
  });

  it('happens at the start of each month', () => {
    const game = grassGame();
    const shack = houseWith(game, 'shack', 16, 10);
    runTicks(game, TICKS_PER_MONTH - 1);
    expect(shack.food).toBe(10);
    tick(game);
    expect(shack.food).toBe(6);
  });
});

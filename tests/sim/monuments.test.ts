import { describe, expect, it } from 'vitest';
import { demolish, placeMonument } from '../../src/sim/commands';
import { MONUMENT_POPULATION, MONUMENT_EARNED_NOTICE } from '../../src/sim/monuments';
import { canBurn, canCollapse } from '../../src/sim/safety';
import type { GameState } from '../../src/sim/state';
import { grassGame, placeHouse, runTicks } from './helpers';

function cityOf(residents: number): GameState {
  const game = grassGame();
  placeHouse(game, 4, 4);
  game.buildings[0].residents = residents;
  return game;
}

function monumentOf(game: GameState) {
  const monument = game.buildings.find((b) => b.type === 'monument');
  if (!monument) throw new Error('No monument');
  return monument;
}

describe('earning a monument', () => {
  it('starts with none to place', () => {
    expect(grassGame().monumentsToPlace).toEqual([]);
  });

  it(`earns one, with a notice, when the population reaches ${MONUMENT_POPULATION}`, () => {
    const game = cityOf(MONUMENT_POPULATION);
    runTicks(game, 1);
    expect(game.monumentsToPlace).toEqual(['crowdedCity']);
    expect(game.notices.map((n) => n.text)).toEqual([MONUMENT_EARNED_NOTICE]);
  });

  it('earns nothing below that', () => {
    const game = cityOf(MONUMENT_POPULATION - 1);
    runTicks(game, 1);
    expect(game.monumentsToPlace).toEqual([]);
  });

  it('earns it once, even when the population drops and climbs back', () => {
    const game = cityOf(MONUMENT_POPULATION);
    runTicks(game, 1);
    game.buildings[0].residents = 0;
    runTicks(game, 1);
    game.buildings[0].residents = MONUMENT_POPULATION;
    runTicks(game, 1);
    expect(game.monumentsToPlace).toEqual(['crowdedCity']);
    expect(game.notices).toHaveLength(1);
  });
});

describe('placing a monument', () => {
  it('needs an earned monument', () => {
    const game = grassGame();
    expect(placeMonument(game, 'crowdedCity', 10, 10)).toEqual({ ok: false, reason: 'No 1,000 citizens monument is waiting' });
  });

  it('is free, needs no road, and uses up the earned monument', () => {
    const game = grassGame();
    game.monumentsToPlace = ['crowdedCity'];
    const treasury = game.treasury;
    expect(placeMonument(game, 'crowdedCity', 10, 10)).toEqual({ ok: true });
    expect(game.treasury).toBe(treasury);
    expect(game.monumentsToPlace).toEqual([]);
  });

  it('is lost when demolished', () => {
    const game = grassGame();
    game.monumentsToPlace = ['crowdedCity'];
    placeMonument(game, 'crowdedCity', 10, 10);
    demolish(game, { x: 10, y: 10 }, { x: 10, y: 10 });
    expect(game.buildings).toEqual([]);
    expect(game.monumentsToPlace).toEqual([]);
  });

  it('places the kind the player picks', () => {
    const game = grassGame();
    game.monumentsToPlace = ['crowdedCity', 'tradeRoute', 'tradeRoute'];
    placeMonument(game, 'tradeRoute', 10, 10);
    expect(monumentOf(game).monument).toBe('tradeRoute');
    expect(game.monumentsToPlace).toEqual(['crowdedCity', 'tradeRoute']);
  });

  it('needs one of the picked kind waiting', () => {
    const game = grassGame();
    game.monumentsToPlace = ['crowdedCity'];
    expect(placeMonument(game, 'tradeRoute', 10, 10)).toEqual({ ok: false, reason: 'No trade route monument is waiting' });
    expect(game.buildings).toEqual([]);
  });

  it('needs clear ground', () => {
    const game = grassGame();
    game.monumentsToPlace = ['crowdedCity'];
    placeMonument(game, 'crowdedCity', 10, 10);
    game.monumentsToPlace = ['crowdedCity'];
    expect(placeMonument(game, 'crowdedCity', 11, 11)).toEqual({ ok: false, reason: 'A building is in the way' });
  });

  it('never burns or collapses', () => {
    const game = grassGame();
    game.monumentsToPlace = ['crowdedCity'];
    placeMonument(game, 'crowdedCity', 10, 10);
    expect(canBurn(monumentOf(game))).toBe(false);
    expect(canCollapse(monumentOf(game))).toBe(false);
  });
});

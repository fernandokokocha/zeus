import { describe, expect, it } from 'vitest';
import { demolish, placeBuilding } from '../../src/sim/commands';
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
    expect(grassGame().monumentsToPlace).toBe(0);
  });

  it(`earns one, with a notice, when the population reaches ${MONUMENT_POPULATION}`, () => {
    const game = cityOf(MONUMENT_POPULATION);
    runTicks(game, 1);
    expect(game.monumentsToPlace).toBe(1);
    expect(game.notices.map((n) => n.text)).toEqual([MONUMENT_EARNED_NOTICE]);
  });

  it('earns nothing below that', () => {
    const game = cityOf(MONUMENT_POPULATION - 1);
    runTicks(game, 1);
    expect(game.monumentsToPlace).toBe(0);
  });

  it('earns it once, even when the population drops and climbs back', () => {
    const game = cityOf(MONUMENT_POPULATION);
    runTicks(game, 1);
    game.buildings[0].residents = 0;
    runTicks(game, 1);
    game.buildings[0].residents = MONUMENT_POPULATION;
    runTicks(game, 1);
    expect(game.monumentsToPlace).toBe(1);
    expect(game.notices).toHaveLength(1);
  });
});

describe('placing a monument', () => {
  it('needs an earned monument', () => {
    const game = grassGame();
    expect(placeBuilding(game, 'monument', 10, 10)).toEqual({ ok: false, reason: 'No monument has been earned yet' });
  });

  it('is free, needs no road, and uses up the earned monument', () => {
    const game = grassGame();
    game.monumentsToPlace = 1;
    const treasury = game.treasury;
    expect(placeBuilding(game, 'monument', 10, 10)).toEqual({ ok: true });
    expect(game.treasury).toBe(treasury);
    expect(game.monumentsToPlace).toBe(0);
  });

  it('is lost when demolished', () => {
    const game = grassGame();
    game.monumentsToPlace = 1;
    placeBuilding(game, 'monument', 10, 10);
    demolish(game, { x: 10, y: 10 }, { x: 10, y: 10 });
    expect(game.buildings).toEqual([]);
    expect(game.monumentsToPlace).toBe(0);
  });

  it('never burns or collapses', () => {
    const game = grassGame();
    game.monumentsToPlace = 1;
    placeBuilding(game, 'monument', 10, 10);
    expect(canBurn(monumentOf(game))).toBe(false);
    expect(canCollapse(monumentOf(game))).toBe(false);
  });
});

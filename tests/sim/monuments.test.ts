import { describe, expect, it } from 'vitest';
import { demolish, placeMonument } from '../../src/sim/commands';
import { TICKS_PER_MONTH } from '../../src/sim/clock';
import { describeTile } from '../../src/sim/inspect';
import type { EarnedMonument } from '../../src/sim/monuments';
import { canBurn, canCollapse } from '../../src/sim/safety';
import type { GameState } from '../../src/sim/state';
import { grassGame, placeHouse, runTicks } from './helpers';

function cityOf(residents: number): GameState {
  const game = grassGame();
  placeHouse(game, 4, 4);
  game.buildings[0].residents = residents;
  return game;
}

const CROWD: EarnedMonument = { kind: 'crowdedCity', honours: 'the city reaching 1,000 citizens' };
const GREAT: EarnedMonument = { kind: 'greatCity', honours: 'the city reaching 2,000 citizens' };
const ROUTE: EarnedMonument = { kind: 'tradeRoute', honours: 'the first trade route to Corinth' };
const GROWN_TO_1000 = 'The city has grown to 1,000 citizens. A monument can be raised.';

function monumentOf(game: GameState) {
  const monument = game.buildings.find((b) => b.type === 'monument');
  if (!monument) throw new Error('No monument');
  return monument;
}

describe('earning a monument', () => {
  it('starts with none to place', () => {
    expect(grassGame().monumentsToPlace).toEqual([]);
  });

  it('earns one, with a notice, when the population reaches 1,000', () => {
    const game = cityOf(1000);
    runTicks(game, 1);
    expect(game.monumentsToPlace).toEqual([CROWD]);
    expect(game.notices.map((n) => n.text)).toEqual([GROWN_TO_1000]);
  });

  it('earns nothing below that', () => {
    const game = cityOf(999);
    runTicks(game, 1);
    expect(game.monumentsToPlace).toEqual([]);
  });

  it('earns it once, even when the population drops and climbs back', () => {
    const game = cityOf(1000);
    runTicks(game, 1);
    game.buildings[0].residents = 0;
    runTicks(game, 1);
    game.buildings[0].residents = 1000;
    runTicks(game, 1);
    expect(game.monumentsToPlace).toEqual([CROWD]);
    expect(game.notices).toHaveLength(1);
  });

  it('earns a second one, for 2,000 citizens, at 2,000', () => {
    const game = cityOf(1000);
    runTicks(game, 1);
    game.buildings[0].residents = 2000;
    runTicks(game, 1);
    expect(game.monumentsToPlace).toEqual([CROWD, GREAT]);
    expect(game.notices.at(-1)?.text).toBe('The city has grown to 2,000 citizens. A monument can be raised.');
  });

  it('earns both at once in a city that jumps past 2,000', () => {
    const game = cityOf(2000);
    runTicks(game, 1);
    expect(game.monumentsToPlace).toEqual([CROWD, GREAT]);
  });
});

describe('placing a monument', () => {
  it('needs an earned monument', () => {
    const game = grassGame();
    expect(placeMonument(game, 'crowdedCity', 10, 10)).toEqual({ ok: false, reason: 'No 1,000 citizens monument is waiting' });
  });

  it('is free, needs no road, and uses up the earned monument', () => {
    const game = grassGame();
    game.monumentsToPlace = [CROWD];
    const treasury = game.treasury;
    expect(placeMonument(game, 'crowdedCity', 10, 10)).toEqual({ ok: true });
    expect(game.treasury).toBe(treasury);
    expect(game.monumentsToPlace).toEqual([]);
  });

  it('is lost when demolished', () => {
    const game = grassGame();
    game.monumentsToPlace = [CROWD];
    placeMonument(game, 'crowdedCity', 10, 10);
    demolish(game, { x: 10, y: 10 }, { x: 10, y: 10 });
    expect(game.buildings).toEqual([]);
    expect(game.monumentsToPlace).toEqual([]);
  });

  it('places the kind the player picks', () => {
    const game = grassGame();
    game.monumentsToPlace = [CROWD, ROUTE, ROUTE];
    placeMonument(game, 'tradeRoute', 10, 10);
    expect(monumentOf(game).monument?.kind).toBe('tradeRoute');
    expect(game.monumentsToPlace).toEqual([CROWD, ROUTE]);
  });

  it('needs one of the picked kind waiting', () => {
    const game = grassGame();
    game.monumentsToPlace = [CROWD];
    expect(placeMonument(game, 'tradeRoute', 10, 10)).toEqual({ ok: false, reason: 'No trade route monument is waiting' });
    expect(game.buildings).toEqual([]);
  });

  it('needs clear ground', () => {
    const game = grassGame();
    game.monumentsToPlace = [CROWD];
    placeMonument(game, 'crowdedCity', 10, 10);
    game.monumentsToPlace = [CROWD];
    expect(placeMonument(game, 'crowdedCity', 11, 11)).toEqual({ ok: false, reason: 'A building is in the way' });
  });

  it('remembers when it was raised and what it honours', () => {
    const game = grassGame();
    game.monumentsToPlace = [ROUTE];
    game.tick = 14 * TICKS_PER_MONTH;
    placeMonument(game, 'tradeRoute', 10, 10);
    expect(monumentOf(game).monument).toEqual({ ...ROUTE, raisedAt: 14 * TICKS_PER_MONTH });
    expect(describeTile(game, 10, 10)).toEqual({
      title: 'Monument',
      meters: [],
      lines: ['Tile 10, 10', 'Appeal 20, 20, 18, 16, 14, 12 by distance', 'Raised in March, Year 2', 'Honours the first trade route to Corinth'],
    });
  });

  it('never burns or collapses', () => {
    const game = grassGame();
    game.monumentsToPlace = [CROWD];
    placeMonument(game, 'crowdedCity', 10, 10);
    expect(canBurn(monumentOf(game))).toBe(false);
    expect(canCollapse(monumentOf(game))).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';
import { placeRoad } from '../../src/sim/commands';
import { createGame } from '../../src/sim/state';
import { ROAD_TILE_COST, STARTING_TREASURY } from '../../src/sim/treasury';
import { grassGame, setTerrain } from './helpers';

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

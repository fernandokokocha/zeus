import { describe, expect, it } from 'vitest';
import { placeRoad } from '../../src/sim/commands';
import { describeTile } from '../../src/sim/inspect';
import { SETTLER_SPAWN_INTERVAL_TICKS } from '../../src/sim/settlers';
import { grassGame, placeHouse, runTicks, setTerrain } from './helpers';

describe('describeTile', () => {
  it('describes buildable terrain', () => {
    expect(describeTile(grassGame(), 4, 4)).toEqual({ title: 'Grass', lines: ['Tile 4, 4', 'Buildable'] });
  });

  it('describes unbuildable terrain', () => {
    const game = grassGame();
    setTerrain(game, 4, 4, 'marble');
    expect(describeTile(game, 4, 4)).toEqual({ title: 'Marble', lines: ['Tile 4, 4', 'Not buildable'] });
  });

  it('describes a road', () => {
    const game = grassGame();
    placeRoad(game, { x: 4, y: 4 }, { x: 4, y: 4 });
    expect(describeTile(game, 4, 4)).toEqual({ title: 'Road', lines: ['Tile 4, 4'] });
  });

  it('describes a vacant lot from any of its tiles', () => {
    const game = grassGame();
    placeHouse(game, 2, 2);
    expect(describeTile(game, 3, 3)).toEqual({
      title: 'Vacant Lot',
      lines: ['Tile 2, 2', 'Residents 0/8', 'No road access: settlers cannot reach it'],
    });
  });

  it("says when a lot's road does not lead to the entry", () => {
    const game = grassGame();
    placeHouse(game, 2, 2);
    placeRoad(game, { x: 2, y: 1 }, { x: 2, y: 1 });
    expect(describeTile(game, 2, 2).lines).toContain('Its road does not connect to the entry');
  });

  it('says when a lot is waiting for settlers, and when they are on the way', () => {
    const game = grassGame();
    placeHouse(game, 2, 8);
    expect(describeTile(game, 2, 8).lines).toContain('Waiting for settlers');
    runTicks(game, SETTLER_SPAWN_INTERVAL_TICKS);
    expect(describeTile(game, 2, 8).lines).toContain('Settlers on the way');
  });

  it('describes a Hut and what its next level needs', () => {
    const game = grassGame();
    placeHouse(game, 2, 8);
    runTicks(game, 2 * SETTLER_SPAWN_INTERVAL_TICKS);
    expect(describeTile(game, 2, 8)).toEqual({
      title: 'Hut',
      lines: ['Tile 2, 8', 'Residents 8/8', 'Needs for Shack: food'],
    });
  });

  it('describes a settler on the road tile it stands on', () => {
    const game = grassGame();
    placeHouse(game, 2, 8);
    runTicks(game, SETTLER_SPAWN_INTERVAL_TICKS);
    expect(describeTile(game, 0, 10)).toEqual({
      title: 'Settler',
      lines: ['Carrying 8 people', 'Heading to Vacant Lot at 2, 8'],
    });
  });
});

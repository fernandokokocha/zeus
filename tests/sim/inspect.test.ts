import { describe, expect, it } from 'vitest';
import { placeBuilding, placeRoad } from '../../src/sim/commands';
import { describeTile } from '../../src/sim/inspect';
import { grassGame, setTerrain } from './helpers';

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

  it('describes a building from any of its tiles, including missing road access', () => {
    const game = grassGame();
    placeBuilding(game, 'testBuilding', 2, 2);
    expect(describeTile(game, 3, 3)).toEqual({
      title: 'Test Building',
      lines: ['Tile 2, 2', 'Size 2×2', 'No road access: it will not work'],
    });
  });

  it('describes a building with road access', () => {
    const game = grassGame();
    placeBuilding(game, 'testBuilding', 2, 2);
    placeRoad(game, { x: 2, y: 1 }, { x: 2, y: 1 });
    expect(describeTile(game, 2, 2).lines).toContain('Has road access');
  });
});

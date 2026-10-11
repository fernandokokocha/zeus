import { describe, expect, it } from 'vitest';
import { demolish, placeRoad } from '../../src/sim/commands';
import { findRoadPath } from '../../src/sim/pathfinding';
import { tileIndex } from '../../src/sim/state';
import { grassGame } from './helpers';

describe('findRoadPath', () => {
  it('follows the road to the target', () => {
    const game = grassGame();
    placeRoad(game, { x: 1, y: 1 }, { x: 4, y: 1 });
    expect(findRoadPath(game, { x: 1, y: 1 }, [{ x: 4, y: 1 }])).toEqual([
      { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }, { x: 4, y: 1 },
    ]);
  });

  it('is just the start when the start is a target', () => {
    const game = grassGame();
    placeRoad(game, { x: 1, y: 1 }, { x: 1, y: 1 });
    expect(findRoadPath(game, { x: 1, y: 1 }, [{ x: 1, y: 1 }])).toEqual([{ x: 1, y: 1 }]);
  });

  it('takes the shortest of two routes', () => {
    const game = grassGame();
    placeRoad(game, { x: 1, y: 1 }, { x: 1, y: 8 });
    placeRoad(game, { x: 1, y: 8 }, { x: 8, y: 8 });
    placeRoad(game, { x: 1, y: 1 }, { x: 8, y: 1 });
    placeRoad(game, { x: 8, y: 1 }, { x: 8, y: 6 });
    const path = findRoadPath(game, { x: 1, y: 1 }, [{ x: 8, y: 6 }, { x: 8, y: 8 }]);
    expect(path).toHaveLength(13);
    expect(path!.at(-1)).toEqual({ x: 8, y: 6 });
  });

  it('never leaves the road', () => {
    const game = grassGame();
    placeRoad(game, { x: 1, y: 1 }, { x: 6, y: 6 });
    const path = findRoadPath(game, { x: 1, y: 1 }, [{ x: 6, y: 6 }]);
    expect(path!.every((p) => game.roads[tileIndex(game, p.x, p.y)])).toBe(true);
  });

  it('is null when no road connects to a target', () => {
    const game = grassGame();
    placeRoad(game, { x: 1, y: 1 }, { x: 6, y: 1 });
    demolish(game, { x: 3, y: 1 }, { x: 3, y: 1 });
    expect(findRoadPath(game, { x: 1, y: 1 }, [{ x: 6, y: 1 }])).toBeNull();
  });
});

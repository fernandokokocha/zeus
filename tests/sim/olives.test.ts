import { describe, expect, it } from 'vitest';
import { appealMap } from '../../src/sim/appeal';
import { TICKS_PER_YEAR } from '../../src/sim/clock';
import { placeOliveTrees } from '../../src/sim/commands';
import { isRipe } from '../../src/sim/olives';
import { tileIndex } from '../../src/sim/state';
import { STARTING_TREASURY } from '../../src/sim/treasury';
import { meadowGame, runTicks, setTerrain } from './helpers';

const trees = (game: ReturnType<typeof meadowGame>) => game.buildings.filter((b) => b.type === 'oliveTree');

describe('placeOliveTrees', () => {
  it('plants a tree on every tile of the dragged area for 3 dr each', () => {
    const game = meadowGame();
    expect(placeOliveTrees(game, { x: 2, y: 2 }, { x: 4, y: 3 })).toEqual({ ok: true });
    expect(trees(game).map((t) => [t.x, t.y])).toEqual([[2, 2], [3, 2], [4, 2], [2, 3], [3, 3], [4, 3]]);
    expect(game.treasury).toBe(STARTING_TREASURY - 6 * 3);
  });

  it('skips tiles that are taken or not meadow', () => {
    const game = meadowGame();
    setTerrain(game, 3, 2, 'grass');
    placeOliveTrees(game, { x: 2, y: 2 }, { x: 2, y: 2 });
    placeOliveTrees(game, { x: 2, y: 2 }, { x: 4, y: 2 });
    expect(trees(game).map((t) => [t.x, t.y])).toEqual([[2, 2], [4, 2]]);
  });

  it('refuses grass', () => {
    const game = meadowGame();
    setTerrain(game, 5, 5, 'grass');
    expect(placeOliveTrees(game, { x: 5, y: 5 }, { x: 5, y: 5 })).toEqual({ ok: false, reason: 'An olive tree needs meadow' });
    expect(trees(game)).toEqual([]);
  });
});

describe('an olive tree', () => {
  it('is planted bearing ripe olives', () => {
    const game = meadowGame();
    placeOliveTrees(game, { x: 5, y: 5 }, { x: 5, y: 5 });
    expect(isRipe(game.buildings[0])).toBe(true);
  });

  it('ripens a new crop in a year once picked', () => {
    const game = meadowGame();
    placeOliveTrees(game, { x: 5, y: 5 }, { x: 5, y: 5 });
    const tree = game.buildings[0];
    tree.growth = 0;
    runTicks(game, TICKS_PER_YEAR / 2);
    expect(tree.growth).toBeCloseTo(0.5, 3);
    expect(isRipe(tree)).toBe(false);
    runTicks(game, TICKS_PER_YEAR / 2);
    expect(isRipe(tree)).toBe(true);
    runTicks(game, 10);
    expect(tree.growth).toBe(1);
  });

  it('raises the appeal of the tiles next to it by 1', () => {
    const game = meadowGame();
    placeOliveTrees(game, { x: 5, y: 5 }, { x: 5, y: 5 });
    const map = appealMap(game);
    expect(map[tileIndex(game, 6, 6)]).toBe(1);
    expect(map[tileIndex(game, 7, 5)]).toBe(0);
  });
});

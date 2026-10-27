import { describe, expect, it } from 'vitest';
import { placeBuilding, placeRoad } from '../../src/sim/commands';
import { UNITS_PER_LOAD } from '../../src/sim/food';
import { previewTiles } from '../../src/ui/preview';
import { GUILD_BLOCK, grassGame, guildBlock, setTerrain } from '../sim/helpers';

describe('previewTiles', () => {
  it('shows nothing without a tool or hover tile', () => {
    expect(previewTiles(grassGame(), null, null, { x: 1, y: 1 })).toEqual([]);
    expect(previewTiles(grassGame(), 'road', null, null)).toEqual([]);
  });

  it('marks each road tile valid or invalid', () => {
    const game = grassGame();
    setTerrain(game, 2, 1, 'water');
    expect(previewTiles(game, 'road', { x: 1, y: 1 }, { x: 3, y: 1 })).toEqual([
      { x: 1, y: 1, kind: 'valid' },
      { x: 2, y: 1, kind: 'invalid' },
      { x: 3, y: 1, kind: 'valid' },
    ]);
  });

  it('marks the sheep tile valid on open meadow and invalid on grass or a road', () => {
    const game = grassGame();
    setTerrain(game, 3, 1, 'meadow');
    setTerrain(game, 2, 1, 'meadow');
    placeRoad(game, { x: 2, y: 1 }, { x: 2, y: 1 });
    expect(previewTiles(game, 'sheep', null, { x: 3, y: 1 })).toEqual([{ x: 3, y: 1, kind: 'valid' }]);
    expect(previewTiles(game, 'sheep', null, { x: 2, y: 1 })).toEqual([{ x: 2, y: 1, kind: 'invalid' }]);
    expect(previewTiles(game, 'sheep', null, { x: 4, y: 1 })).toEqual([{ x: 4, y: 1, kind: 'invalid' }]);
  });

it('marks each tile of an olive grove valid on meadow and invalid elsewhere, with no road needed', () => {
  const game = grassGame();
  setTerrain(game, 1, 1, 'meadow');
  setTerrain(game, 2, 1, 'meadow');
  expect(previewTiles(game, 'oliveTree', { x: 1, y: 1 }, { x: 3, y: 1 })).toEqual([
    { x: 1, y: 1, kind: 'valid' },
    { x: 2, y: 1, kind: 'valid' },
    { x: 3, y: 1, kind: 'invalid' },
  ]);
});

it('warns about a building without road access', () => {
    const tiles = previewTiles(grassGame(), 'house', null, { x: 2, y: 2 });
    expect(tiles).toHaveLength(4);
    expect(tiles.every((t) => t.kind === 'warning')).toBe(true);
  });

  it('shows a building with road access as valid', () => {
    const game = grassGame();
    placeRoad(game, { x: 2, y: 1 }, { x: 2, y: 1 });
    expect(previewTiles(game, 'house', null, { x: 2, y: 2 }).every((t) => t.kind === 'valid')).toBe(true);
  });

  it('drops off-map tiles of a building footprint and marks the rest invalid', () => {
    const tiles = previewTiles(grassGame(), 'house', null, { x: 19, y: 19 });
    expect(tiles).toEqual([{ x: 19, y: 19, kind: 'invalid' }]);
  });

  it('covers the dragged demolish rectangle, clamped to the map', () => {
    const tiles = previewTiles(grassGame(), 'demolish', { x: 18, y: 18 }, { x: 22, y: 19 });
    expect(tiles).toEqual([
      { x: 18, y: 18, kind: 'invalid' },
      { x: 19, y: 18, kind: 'invalid' },
      { x: 18, y: 19, kind: 'invalid' },
      { x: 19, y: 19, kind: 'invalid' },
    ]);
  });
});

describe('previewTiles for a lot drag', () => {
  it('marks each lot by its own placement check', () => {
    const game = grassGame();
    placeRoad(game, { x: 1, y: 0 }, { x: 2, y: 0 });
    setTerrain(game, 5, 2, 'water');
    const tiles = previewTiles(game, 'house', { x: 1, y: 1 }, { x: 6, y: 2 });
    const kindAt = (x: number, y: number) => tiles.find((t) => t.x === x && t.y === y)?.kind;
    expect(tiles).toHaveLength(12);
    expect(kindAt(1, 1)).toBe('valid');
    expect(kindAt(3, 1)).toBe('warning');
    expect(kindAt(6, 2)).toBe('invalid');
  });
});

describe('previewTiles for a single building', () => {
  it('centres the Palace footprint on the cursor', () => {
    const tiles = previewTiles(grassGame(), 'palace', null, { x: 10, y: 4 });
    expect(tiles).toHaveLength(54);
    expect(Math.min(...tiles.map((t) => t.x))).toBe(6);
    expect(Math.max(...tiles.map((t) => t.x))).toBe(14);
    expect(Math.min(...tiles.map((t) => t.y))).toBe(2);
    expect(Math.max(...tiles.map((t) => t.y))).toBe(7);
  });

  it('anchors a 2×2 building at the cursor', () => {
    const game = grassGame();
    placeRoad(game, { x: 2, y: 1 }, { x: 2, y: 1 });
    expect(previewTiles(game, 'fountain', null, { x: 2, y: 2 })).toEqual([
      { x: 2, y: 2, kind: 'valid' },
      { x: 3, y: 2, kind: 'valid' },
      { x: 2, y: 3, kind: 'valid' },
      { x: 3, y: 3, kind: 'valid' },
    ]);
  });

  it('marks a second Palace invalid', () => {
    const game = grassGame();
    placeBuilding(game, 'palace', 0, 0);
    expect(previewTiles(game, 'palace', null, { x: 10, y: 14 }).every((t) => t.kind === 'invalid')).toBe(true);
  });
});

describe('previewTiles for a roadblock', () => {
  it('is valid on a free road tile and invalid elsewhere', () => {
    const game = grassGame();
    expect(previewTiles(game, 'roadblock', null, { x: 3, y: 10 })).toEqual([{ x: 3, y: 10, kind: 'valid' }]);
    expect(previewTiles(game, 'roadblock', null, { x: 3, y: 3 })).toEqual([{ x: 3, y: 3, kind: 'invalid' }]);
  });
});

describe('previewTiles for an agora vendor', () => {
  it('covers the whole spot under the cursor', () => {
    const game = grassGame();
    placeRoad(game, { x: 7, y: 2 }, { x: 7, y: 12 });
    placeBuilding(game, 'agora', 5, 4);
    expect(previewTiles(game, 'foodVendor', null, { x: 6, y: 7 })).toEqual([
      { x: 5, y: 6, kind: 'valid' },
      { x: 6, y: 6, kind: 'valid' },
      { x: 5, y: 7, kind: 'valid' },
      { x: 6, y: 7, kind: 'valid' },
    ]);
  });

  it('is invalid off an agora', () => {
    expect(previewTiles(grassGame(), 'foodVendor', null, { x: 3, y: 3 }).every((t) => t.kind === 'invalid')).toBe(true);
  });
});

describe('previewTiles for a decoration', () => {
  it('is valid without a road', () => {
    expect(previewTiles(grassGame(), 'park', null, { x: 3, y: 3 })).toEqual([{ x: 3, y: 3, kind: 'valid' }]);
  });
});

describe('previewTiles for a rotated building', () => {
  it('centres the turned Palace footprint on the cursor', () => {
    const tiles = previewTiles(grassGame(), 'palace', null, { x: 10, y: 4 }, 1);
    expect(tiles).toHaveLength(54);
    expect(Math.min(...tiles.map((t) => t.x))).toBe(8);
    expect(Math.max(...tiles.map((t) => t.x))).toBe(13);
    expect(Math.min(...tiles.map((t) => t.y))).toBe(0);
    expect(Math.max(...tiles.map((t) => t.y))).toBe(8);
  });
});

describe('previewTiles for a road upgrade', () => {
  it('marks the tiles that take it valid and the rest invalid', () => {
    const game = grassGame();
    placeRoad(game, { x: 1, y: 1 }, { x: 3, y: 1 });
    placeBuilding(game, 'storehouse', 10, 10);
    game.buildings[0].marble = 2 * UNITS_PER_LOAD;
    expect(previewTiles(game, 'fastRoad', { x: 0, y: 1 }, { x: 3, y: 1 })).toEqual([
      { x: 0, y: 1, kind: 'invalid' },
      { x: 1, y: 1, kind: 'valid' },
      { x: 2, y: 1, kind: 'valid' },
      { x: 3, y: 1, kind: 'invalid' },
    ]);
  });
  it("draws a Traders' Guild with the Main Road along its front and the yard across it", () => {
    const { game } = guildBlock();
    const tiles = previewTiles(game, 'tradersGuild', null, { x: GUILD_BLOCK.x + 1, y: GUILD_BLOCK.y + 1 }, 0);
    expect(tiles).toHaveLength(16 + 4 + 8);
    expect(tiles.every((t) => t.kind === 'valid')).toBe(true);
    expect(tiles).toContainEqual({ x: 3, y: 16, kind: 'valid' });
    expect(tiles).toContainEqual({ x: 6, y: 18, kind: 'valid' });
  });
});

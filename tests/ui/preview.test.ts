import { describe, expect, it } from 'vitest';
import { placeRoad } from '../../src/sim/commands';
import { previewTiles } from '../../src/ui/preview';
import { grassGame, setTerrain } from '../sim/helpers';

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

  it('warns about a building without road access', () => {
    const tiles = previewTiles(grassGame(), 'testBuilding', null, { x: 2, y: 2 });
    expect(tiles).toHaveLength(4);
    expect(tiles.every((t) => t.kind === 'warning')).toBe(true);
  });

  it('shows a building with road access as valid', () => {
    const game = grassGame();
    placeRoad(game, { x: 2, y: 1 }, { x: 2, y: 1 });
    expect(previewTiles(game, 'testBuilding', null, { x: 2, y: 2 }).every((t) => t.kind === 'valid')).toBe(true);
  });

  it('drops off-map tiles of a building footprint and marks the rest invalid', () => {
    const tiles = previewTiles(grassGame(), 'testBuilding', null, { x: 19, y: 19 });
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

import { describe, expect, it } from 'vitest';
import { appealMap, houseAppeal } from '../../src/sim/appeal';
import { placeBuilding } from '../../src/sim/commands';
import { tileIndex, type GameState } from '../../src/sim/state';
import { grassGame, placeHouse } from './helpers';

const appealAt = (game: GameState, x: number, y: number) => appealMap(game)[tileIndex(game, x, y)];

describe('appealMap', () => {
  it('is zero on an empty map', () => {
    expect(appealMap(grassGame()).every((a) => a === 0)).toBe(true);
  });

  it('falls off ring by ring from the footprint', () => {
    const game = grassGame();
    placeBuilding(game, 'park', 10, 10);
    expect(appealAt(game, 10, 10)).toBe(3);
    expect(appealAt(game, 11, 11)).toBe(3);
    expect(appealAt(game, 12, 10)).toBe(2);
    expect(appealAt(game, 10, 13)).toBe(1);
    expect(appealAt(game, 14, 10)).toBe(0);
  });

  it('measures from every side of a larger footprint', () => {
    const game = grassGame();
    placeBuilding(game, 'granary', 5, 5);
    expect(appealAt(game, 6, 6)).toBe(-12);
    expect(appealAt(game, 9, 5)).toBe(-12);
    expect(appealAt(game, 5, 2)).toBe(-8);
    expect(appealAt(game, 1, 1)).toBe(-6);
    expect(appealAt(game, 0, 0)).toBe(0);
  });

  it('adds up the appeal of every building', () => {
    const game = grassGame();
    placeBuilding(game, 'park', 10, 10);
    placeBuilding(game, 'column', 12, 10);
    expect(appealAt(game, 11, 10)).toBe(3 + 4);
  });

  it('stops at the map edge', () => {
    const game = grassGame();
    placeBuilding(game, 'agora', 0, 0);
    expect(appealAt(game, 0, 0)).toBe(12);
  });
});

describe('houseAppeal', () => {
  it('is the average over the house tiles, rounded down', () => {
    const game = grassGame();
    placeHouse(game, 10, 10);
    placeBuilding(game, 'park', 9, 10);
    expect(houseAppeal(game, game.buildings[0])).toBe(Math.floor((3 + 2 + 3 + 2) / 4));
    placeBuilding(game, 'taxOffice', 13, 12);
    expect(houseAppeal(game, game.buildings[0])).toBe(Math.floor((3 + 2 - 3 + 3 + 2 - 3) / 4));
  });
});

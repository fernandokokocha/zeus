import { describe, expect, it } from 'vitest';
import { appealMap, houseAppeal } from '../../src/sim/appeal';
import { placeBuilding, placeMonument, placeRoad } from '../../src/sim/commands';
import { HOUSE_LEVELS } from '../../src/sim/housing';
import { canBeOrnate } from '../../src/sim/road-upgrades';
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
    placeBuilding(game, 'flowerGarden', 0, 0);
    expect(appealAt(game, 0, 0)).toBe(8);
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

describe('a Monument in the middle of a 7×7 block', () => {
  const MAP_SIZE = 30;
  const INTERIOR = 12;
  const FAR = INTERIOR + 6;
  const CORNER_HOUSES = [
    { x: INTERIOR, y: INTERIOR },
    { x: FAR - 1, y: INTERIOR },
    { x: INTERIOR, y: FAR - 1 },
    { x: FAR - 1, y: FAR - 1 },
  ];
  const SIDE_PARKS = [
    { x: INTERIOR + 3, y: INTERIOR },
    { x: INTERIOR, y: INTERIOR + 3 },
    { x: FAR, y: INTERIOR + 3 },
    { x: INTERIOR + 3, y: FAR },
  ];

  function monumentBlock(): GameState {
    const game = grassGame(MAP_SIZE);
    const near = INTERIOR - 1;
    const far = FAR + 1;
    placeRoad(game, { x: near, y: near }, { x: far, y: near });
    placeRoad(game, { x: far, y: near }, { x: far, y: far });
    placeRoad(game, { x: far, y: far }, { x: near, y: far });
    placeRoad(game, { x: near, y: far }, { x: near, y: near });
    game.monumentsToPlace = [{ kind: 'crowdedCity', honours: 'a crowd' }];
    placeMonument(game, 'crowdedCity', INTERIOR + 2, INTERIOR + 2);
    for (const lot of CORNER_HOUSES) placeHouse(game, lot.x, lot.y);
    return game;
  }

  function cornerHouseAppeals(game: GameState): number[] {
    return game.buildings.filter((b) => b.type === 'house').map((house) => houseAppeal(game, house));
  }

  function ornateReadyRoads(game: GameState): number {
    const appeal = appealMap(game);
    return game.roads.filter((road, i) => road && canBeOrnate(game, { x: i % game.size, y: Math.floor(i / game.size) }, appeal)).length;
  }

  it('alone keeps its corner houses Townhouses, but cannot raise an Apartment to one', () => {
    for (const appeal of cornerHouseAppeals(monumentBlock())) {
      expect(appeal).toBeGreaterThan(HOUSE_LEVELS.townhouse.appeal.devolve);
      expect(appeal).toBeLessThan(HOUSE_LEVELS.apartment.appeal.evolve);
    }
  });

  it('alone leaves the road around the block short of Ornate', () => {
    expect(ornateReadyRoads(monumentBlock())).toBe(0);
  });

  it('with a Park on each side raises Townhouses and readies most of the road around it for Ornate', () => {
    const game = monumentBlock();
    for (const park of SIDE_PARKS) placeBuilding(game, 'park', park.x, park.y);
    for (const appeal of cornerHouseAppeals(game)) expect(appeal).toBeGreaterThanOrEqual(HOUSE_LEVELS.apartment.appeal.evolve);
    expect(ornateReadyRoads(game)).toBeGreaterThan(game.roads.filter(Boolean).length / 2);
  });
});

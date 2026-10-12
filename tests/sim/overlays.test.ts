import { describe, expect, it } from 'vitest';
import { appealMap } from '../../src/sim/appeal';
import { TICKS_PER_MONTH } from '../../src/sim/clock';
import { placeBuilding } from '../../src/sim/commands';
import { monthlyUse } from '../../src/sim/food';
import { overlayReadings } from '../../src/sim/overlays';
import { COVERAGE_MONTHS } from '../../src/sim/roamers';
import { RISK_LIMIT } from '../../src/sim/safety';
import type { Building, GameState } from '../../src/sim/state';
import { grassGame, placeHouse } from './helpers';

function lastBuilding(game: GameState): Building {
  return game.buildings[game.buildings.length - 1];
}

function occupiedHouse(game: GameState, x: number, y: number): Building {
  placeHouse(game, x, y);
  const house = lastBuilding(game);
  house.residents = 8;
  return house;
}

function readingAt(game: GameState, overlay: Parameters<typeof overlayReadings>[1], x: number, y: number): number | null {
  return overlayReadings(game, overlay)[y * game.size + x];
}

describe('map overlays', () => {
  it('appeal reads the appeal of every tile that has any', () => {
    const game = grassGame();
    placeBuilding(game, 'park', 5, 5);
    const appeal = appealMap(game);
    expect(readingAt(game, 'appeal', 7, 7)).toBe(appeal[7 * game.size + 7]);
    expect(readingAt(game, 'appeal', 7, 7)).not.toBe(0);
    expect(readingAt(game, 'appeal', 15, 15)).toBeNull();
  });

  it('water reads the share of coverage left across an occupied house', () => {
    const game = grassGame();
    const house = occupiedHouse(game, 4, 4);
    house.coveredUntil.water = COVERAGE_MONTHS.water * TICKS_PER_MONTH;
    game.tick = (COVERAGE_MONTHS.water * TICKS_PER_MONTH) / 4;
    for (const [x, y] of [[4, 4], [5, 4], [4, 5], [5, 5]]) expect(readingAt(game, 'water', x, y)).toBe(0.75);
    expect(readingAt(game, 'water', 6, 4)).toBeNull();
  });

  it('says nothing about vacant lots', () => {
    const game = grassGame();
    placeHouse(game, 4, 4);
    for (const overlay of ['water', 'tax', 'food', 'supply', 'culture', 'houseLevel', 'fireRisk'] as const) {
      expect(readingAt(game, overlay, 4, 4)).toBeNull();
    }
  });

  it('tax reads 0 on a house the collector has not reached', () => {
    const game = grassGame();
    occupiedHouse(game, 4, 4);
    expect(readingAt(game, 'tax', 4, 4)).toBe(0);
  });

  it('food reads months of food in the house', () => {
    const game = grassGame();
    const house = occupiedHouse(game, 4, 4);
    house.level = 'shack';
    house.food = 2 * monthlyUse(house, 'food');
    expect(readingAt(game, 'food', 4, 4)).toBe(2);
  });

  it('food reads 0 for a house that does not eat yet', () => {
    const game = grassGame();
    occupiedHouse(game, 4, 4);
    expect(readingAt(game, 'food', 4, 4)).toBe(0);
  });

  it('supply counts fleece and oil held', () => {
    const game = grassGame();
    const house = occupiedHouse(game, 4, 4);
    expect(readingAt(game, 'supply', 4, 4)).toBe(0);
    house.fleece = 1;
    expect(readingAt(game, 'supply', 4, 4)).toBe(1);
    house.oil = 1;
    expect(readingAt(game, 'supply', 4, 4)).toBe(2);
  });

  it('culture reads culture points', () => {
    const game = grassGame();
    const house = occupiedHouse(game, 4, 4);
    house.coveredUntil.philosophy = 1;
    house.coveredUntil.drama = 1;
    expect(readingAt(game, 'culture', 4, 4)).toBe(40);
  });

  it('fire risk reads the share of the limit on buildings that can burn', () => {
    const game = grassGame();
    placeBuilding(game, 'taxOffice', 4, 4);
    lastBuilding(game).fireRisk = (RISK_LIMIT / 2) * TICKS_PER_MONTH;
    placeBuilding(game, 'park', 8, 8);
    expect(readingAt(game, 'fireRisk', 5, 5)).toBe(0.5);
    expect(readingAt(game, 'fireRisk', 8, 8)).toBeNull();
  });

  it('collapse risk reads the share of the limit on buildings that can collapse', () => {
    const game = grassGame();
    placeBuilding(game, 'fountain', 4, 4);
    lastBuilding(game).collapseRisk = (RISK_LIMIT / 4) * TICKS_PER_MONTH;
    placeBuilding(game, 'taxOffice', 8, 8);
    expect(readingAt(game, 'collapseRisk', 4, 4)).toBe(0.25);
    expect(readingAt(game, 'collapseRisk', 8, 8)).toBeNull();
  });

  it('house level reads the level from Hut up', () => {
    const game = grassGame();
    const house = occupiedHouse(game, 4, 4);
    expect(readingAt(game, 'houseLevel', 4, 4)).toBe(0);
    house.level = 'tenement';
    expect(readingAt(game, 'houseLevel', 4, 4)).toBe(4);
  });

  it('staffing reads the share of staff on buildings that employ workers', () => {
    const game = grassGame();
    placeBuilding(game, 'taxOffice', 4, 4);
    lastBuilding(game).workers = 2;
    placeBuilding(game, 'park', 8, 8);
    occupiedHouse(game, 10, 10);
    expect(readingAt(game, 'staffing', 4, 4)).toBe(0.25);
    expect(readingAt(game, 'staffing', 8, 8)).toBeNull();
    expect(readingAt(game, 'staffing', 10, 10)).toBeNull();
  });
});

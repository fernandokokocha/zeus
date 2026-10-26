import { describe, expect, it } from 'vitest';
import { appealMap } from '../../src/sim/appeal';
import { TICKS_PER_MONTH } from '../../src/sim/clock';
import { placeBuilding } from '../../src/sim/commands';
import { monthlyUse } from '../../src/sim/food';
import { OVERLAYS, buildingLook, overlayColumns, overlayReadings, overlayReport, type ColumnOverlay } from '../../src/sim/overlays';
import { COVERAGE_MONTHS } from '../../src/sim/roamers';
import { RISK_LIMIT } from '../../src/sim/safety';
import type { Building, GameState } from '../../src/sim/state';
import { guildBlock, grassGame, placeHouse, placedGuild, supplyGuild } from './helpers';

function lastBuilding(game: GameState): Building {
  return game.buildings[game.buildings.length - 1];
}

function occupiedHouse(game: GameState, x: number, y: number): Building {
  placeHouse(game, x, y);
  const house = lastBuilding(game);
  house.residents = 8;
  return house;
}

function columnOf(game: GameState, overlay: ColumnOverlay, building: Building) {
  return overlayColumns(game, overlay).find((column) => column.building === building) ?? null;
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


  it('says nothing about vacant lots', () => {
    const game = grassGame();
    placeHouse(game, 4, 4);
    for (const overlay of ['tax', 'food', 'supply'] as const) expect(readingAt(game, overlay, 4, 4)).toBeNull();
    for (const overlay of ['water', 'culture', 'risk'] as const) expect(columnOf(game, overlay, lastBuilding(game))).toBeNull();
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





});

describe('map modes', () => {
  it('are nine: Fire and Collapse are merged into Risk, and Houses is gone', () => {
    expect(OVERLAYS).toEqual(['water', 'food', 'supply', 'culture', 'appeal', 'risk', 'tax', 'staffing', 'guildSites']);
  });
});

describe('columns', () => {
  it('water stands the share of the water memory left on an occupied house', () => {
    const game = grassGame();
    const house = occupiedHouse(game, 4, 4);
    house.coveredUntil.water = COVERAGE_MONTHS.water * TICKS_PER_MONTH;
    game.tick = (COVERAGE_MONTHS.water * TICKS_PER_MONTH) / 4;
    const column = columnOf(game, 'water', house)!;
    expect(column.parts).toEqual([{ kind: 'water', share: 0.75 }]);
    expect(column.details).toEqual(['Water: 3.0 months left']);
  });

  it('water stands an empty column on a house that has none, and none on a vacant lot', () => {
    const game = grassGame();
    const house = occupiedHouse(game, 4, 4);
    placeHouse(game, 8, 4);
    expect(columnOf(game, 'water', house)!.parts).toEqual([{ kind: 'water', share: 0 }]);
    expect(columnOf(game, 'water', house)!.details).toEqual(['No water']);
    expect(columnOf(game, 'water', lastBuilding(game))).toBeNull();
  });

  it('culture stacks the cultures a house has, scaled so the Townhouse need is full height', () => {
    const game = grassGame();
    const house = occupiedHouse(game, 4, 4);
    house.coveredUntil.philosophy = 1;
    house.coveredUntil.drama = 1;
    const column = columnOf(game, 'culture', house)!;
    expect(column.parts).toEqual([
      { kind: 'philosophy', share: 15 / 45 },
      { kind: 'drama', share: 25 / 45 },
    ]);
    expect(column.details).toEqual(['Culture: 40 points', 'Philosophy 15 · Athletics 0 · Drama 25']);
  });

  it('risk stands the higher of fire and collapse risk, and names both', () => {
    const game = grassGame();
    placeBuilding(game, 'granary', 4, 4);
    const granary = lastBuilding(game);
    granary.fireRisk = (RISK_LIMIT / 2) * TICKS_PER_MONTH;
    granary.collapseRisk = (RISK_LIMIT / 4) * TICKS_PER_MONTH;
    expect(columnOf(game, 'risk', granary)).toEqual({ building: granary, parts: [{ kind: 'fire', share: 0.5 }], details: ['Fire risk 50%', 'Collapse risk 25%'] });
    granary.collapseRisk = RISK_LIMIT * 0.75 * TICKS_PER_MONTH;
    expect(columnOf(game, 'risk', granary)!.parts).toEqual([{ kind: 'collapse', share: 0.75 }]);
  });

  it('risk leaves out what can neither burn nor collapse, and names only the risk a building has', () => {
    const game = grassGame();
    placeBuilding(game, 'park', 8, 8);
    expect(columnOf(game, 'risk', lastBuilding(game))).toBeNull();
    placeBuilding(game, 'fountain', 4, 4);
    expect(columnOf(game, 'risk', lastBuilding(game))!.details).toEqual(['Collapse risk 0%']);
  });

  it('staff stands the share of jobs filled on workplaces', () => {
    const game = grassGame();
    placeBuilding(game, 'taxOffice', 4, 4);
    const office = lastBuilding(game);
    office.workers = 2;
    placeBuilding(game, 'park', 8, 8);
    occupiedHouse(game, 10, 10);
    expect(columnOf(game, 'staffing', office)).toEqual({ building: office, parts: [{ kind: 'staff', share: 0.25 }], details: ['Workers 2 / 8'] });
    expect(overlayColumns(game, 'staffing')).toHaveLength(1);
  });
});

describe('the Zeus view', () => {
  it('flattens what a mode reports on, keeps what serves it, and fades the rest', () => {
    const game = grassGame();
    const house = occupiedHouse(game, 4, 4);
    placeBuilding(game, 'fountain', 8, 4);
    const fountain = lastBuilding(game);
    placeBuilding(game, 'taxOffice', 12, 4);
    const office = lastBuilding(game);
    expect([house, fountain, office].map((b) => buildingLook(game, 'water', b))).toEqual(['reported', 'serving', 'faded']);
    expect([house, fountain, office].map((b) => buildingLook(game, 'tax', b))).toEqual(['reported', 'faded', 'serving']);
    expect([house, fountain, office].map((b) => buildingLook(game, 'staffing', b))).toEqual(['faded', 'reported', 'reported']);
  });

  it('fades every building in a tile mode', () => {
    const game = grassGame();
    const house = occupiedHouse(game, 4, 4);
    placeBuilding(game, 'fountain', 8, 4);
    for (const overlay of ['appeal', 'guildSites'] as const) {
      expect([house, lastBuilding(game)].map((b) => buildingLook(game, overlay, b))).toEqual(['faded', 'faded']);
    }
  });

  it('keeps the distribution buildings for the supplies modes', () => {
    const game = grassGame();
    placeBuilding(game, 'granary', 4, 4);
    expect(buildingLook(game, 'food', lastBuilding(game))).toBe('serving');
    expect(buildingLook(game, 'supply', lastBuilding(game))).toBe('serving');
  });

  it('reports the value behind a tint, for the hover', () => {
    const game = grassGame();
    const house = occupiedHouse(game, 4, 4);
    house.level = 'shack';
    house.food = 2 * monthlyUse(house, 'food');
    house.oil = 1;
    expect(overlayReport(game, 'food', house)).toEqual({ name: 'Shack', details: ['Food: 2.0 months'] });
    expect(overlayReport(game, 'supply', house)).toEqual({ name: 'Shack', details: ['Fleece: none · Oil: some'] });
    expect(overlayReport(game, 'tax', house)).toEqual({ name: 'Shack', details: ['Tax: not collected'] });
    expect(overlayReport(game, 'appeal', house)).toBeNull();
  });
});

describe("map overlays on a Traders' Guild", () => {
  it('read its food and supply across all 16 tiles, and stand its water and culture columns', () => {
    const { game, guild } = placedGuild();
    supplyGuild(guild);
    guild.coveredUntil.water = COVERAGE_MONTHS.water * TICKS_PER_MONTH;
    game.tick = (COVERAGE_MONTHS.water * TICKS_PER_MONTH) / 4;
    for (const [x, y] of [[3, 12], [6, 12], [3, 15], [6, 15]]) expect(readingAt(game, 'food', x, y)).toBe(3);
    expect(readingAt(game, 'supply', 4, 13)).toBe(2);
    expect(columnOf(game, 'water', guild)!.parts).toEqual([{ kind: 'water', share: 0.75 }]);
    expect(columnOf(game, 'culture', guild)!.parts.reduce((sum, part) => sum + part.share, 0)).toBe(1);
  });

  it('leave out tax: it pays none', () => {
    const { game, guild } = placedGuild();
    guild.coveredUntil.tax = game.tick + TICKS_PER_MONTH;
    expect(readingAt(game, 'tax', 4, 13)).toBeNull();
      });
});

describe('the guild sites overlay', () => {
  it('shades tiles within 4 of the Main Road, but not the road itself', () => {
    const { game } = guildBlock();
    expect(readingAt(game, 'guildSites', 10, 13)).toBe(0);
    expect(readingAt(game, 'guildSites', 10, 21)).toBe(0);
    expect(readingAt(game, 'guildSites', 10, 12)).toBeNull();
    expect(readingAt(game, 'guildSites', 10, 22)).toBeNull();
    expect(readingAt(game, 'guildSites', 10, 17)).toBeNull();
  });

  it('highlights every tile of a block a guild can be placed on now', () => {
    const { game } = guildBlock();
    for (const [x, y] of [[3, 12], [6, 12], [3, 15], [6, 15]]) expect(readingAt(game, 'guildSites', x, y)).toBe(1);
    expect(readingAt(game, 'guildSites', 7, 15)).toBe(0);
  });

  it('does not highlight a block that lacks a permit', () => {
    const { game } = guildBlock();
    game.guildPermits = 0;
    expect(readingAt(game, 'guildSites', 3, 15)).toBe(0);
    expect(readingAt(game, 'guildSites', 3, 12)).toBeNull();
  });
});

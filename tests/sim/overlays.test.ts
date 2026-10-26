import { describe, expect, it } from 'vitest';
import { appealMap } from '../../src/sim/appeal';
import { TICKS_PER_MONTH } from '../../src/sim/clock';
import { placeBuilding, placeRoad } from '../../src/sim/commands';
import { VENDOR_CAPACITY, houseStockTarget } from '../../src/sim/food';
import { OVERLAYS, buildingLook, overlayColumns, overlayReadings, overlayReport, overlayReportAt, type ColumnOverlay } from '../../src/sim/overlays';
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
    for (const overlay of ['water', 'supplies', 'culture', 'risk', 'tax'] as const) expect(columnOf(game, overlay, lastBuilding(game))).toBeNull();
  });

  it('says nothing about a building in a tile mode', () => {
    const game = grassGame();
    const house = occupiedHouse(game, 4, 4);
    expect(overlayReport(game, 'appeal', house)).toBeNull();
    expect(overlayReport(game, 'guildSites', house)).toBeNull();
  });
});

describe('hovering a tile', () => {
  it('in Appeal names the exact appeal of any tile, signed', () => {
    const game = grassGame();
    placeBuilding(game, 'park', 5, 5);
    const appeal = appealMap(game)[7 * game.size + 7];
    expect(appeal).toBeGreaterThan(0);
    expect(overlayReportAt(game, 'appeal', { x: 7, y: 7 })).toEqual({ name: `Appeal +${appeal}`, details: [] });
    expect(overlayReportAt(game, 'appeal', { x: 15, y: 15 })).toEqual({ name: 'Appeal 0', details: [] });
    placeBuilding(game, 'granary', 15, 4);
    expect(overlayReportAt(game, 'appeal', { x: 14, y: 5 })!.name).toMatch(/^Appeal −\d+$/);
  });

  it('in a building mode reports the building on it, and nothing off the map', () => {
    const game = grassGame();
    const house = occupiedHouse(game, 4, 4);
    expect(overlayReportAt(game, 'water', { x: 5, y: 5 })).toEqual(overlayReport(game, 'water', house));
    expect(overlayReportAt(game, 'water', { x: 9, y: 9 })).toBeNull();
    expect(overlayReportAt(game, 'appeal', { x: -1, y: 0 })).toBeNull();
    expect(overlayReportAt(game, 'guildSites', { x: 5, y: 5 })).toBeNull();
  });
});

describe('map modes', () => {
  it('are eight: Supplies merges Food and Supply, Risk merges Fire and Collapse, and Houses is gone', () => {
    expect(OVERLAYS).toEqual(['water', 'supplies', 'culture', 'appeal', 'risk', 'tax', 'staffing', 'guildSites']);
  });
});

describe('columns', () => {
  it('water stands the share of the water memory left on an occupied house', () => {
    const game = grassGame();
    const house = occupiedHouse(game, 4, 4);
    house.coveredUntil.water = COVERAGE_MONTHS.water * TICKS_PER_MONTH;
    game.tick = (COVERAGE_MONTHS.water * TICKS_PER_MONTH) / 4;
    const column = columnOf(game, 'water', house)!;
    expect(column.bars).toEqual([[{ kind: 'water', share: 0.75 }]]);
    expect(column.details).toEqual(['Water: 3.0 months left']);
  });

  it('water stands an empty column on a house that has none, and none on a vacant lot', () => {
    const game = grassGame();
    const house = occupiedHouse(game, 4, 4);
    placeHouse(game, 8, 4);
    expect(columnOf(game, 'water', house)!.bars).toEqual([[{ kind: 'water', share: 0 }]]);
    expect(columnOf(game, 'water', house)!.details).toEqual(['No water']);
    expect(columnOf(game, 'water', lastBuilding(game))).toBeNull();
  });

  it('culture stands a bar per culture, each the share of its memory left', () => {
    const game = grassGame();
    const house = occupiedHouse(game, 4, 4);
    house.coveredUntil.philosophy = COVERAGE_MONTHS.philosophy * TICKS_PER_MONTH;
    house.coveredUntil.drama = (COVERAGE_MONTHS.drama * TICKS_PER_MONTH) / 4;
    const column = columnOf(game, 'culture', house)!;
    expect(column.bars).toEqual([
      [{ kind: 'philosophy', share: 1 }],
      [{ kind: 'athletics', share: 0 }],
      [{ kind: 'drama', share: 0.25 }],
    ]);
    expect(column.details).toEqual([
      'Culture: 40 points',
      'Philosophy 15: 2.0 months left',
      'Athletics: none',
      'Drama 25: 0.5 months left',
    ]);
  });

  it('risk stands the higher of fire and collapse risk, and names both', () => {
    const game = grassGame();
    placeBuilding(game, 'granary', 4, 4);
    const granary = lastBuilding(game);
    granary.fireRisk = (RISK_LIMIT / 2) * TICKS_PER_MONTH;
    granary.collapseRisk = (RISK_LIMIT / 4) * TICKS_PER_MONTH;
    expect(columnOf(game, 'risk', granary)).toEqual({ building: granary, bars: [[{ kind: 'fire', share: 0.5 }]], details: ['Fire risk 50%', 'Collapse risk 25%'] });
    granary.collapseRisk = RISK_LIMIT * 0.75 * TICKS_PER_MONTH;
    expect(columnOf(game, 'risk', granary)!.bars).toEqual([[{ kind: 'collapse', share: 0.75 }]]);
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
    expect(columnOf(game, 'staffing', office)).toEqual({ building: office, bars: [[{ kind: 'staff', share: 0.25 }]], details: ['Workers 2 / 8'] });
    expect(overlayColumns(game, 'staffing')).toHaveLength(1);
  });
});

describe('the supplies column', () => {
  it('stands a bar for food, fleece and oil on a house, each against the most the house holds', () => {
    const game = grassGame();
    const house = occupiedHouse(game, 4, 4);
    house.food = houseStockTarget(house, 'food') / 2;
    house.oil = houseStockTarget(house, 'oil');
    expect(columnOf(game, 'supplies', house)!.bars).toEqual([
      [{ kind: 'food', share: 0.5 }],
      [{ kind: 'fleece', share: 0 }],
      [{ kind: 'oil', share: 1 }],
    ]);
    expect(columnOf(game, 'supplies', house)!.details).toEqual(['Food 5 / 10', 'Fleece 0 / 6', 'Oil 6 / 6']);
  });

  it('never stands a bar above full', () => {
    const game = grassGame();
    const house = occupiedHouse(game, 4, 4);
    house.fleece = 2 * houseStockTarget(house, 'fleece');
    expect(columnOf(game, 'supplies', house)!.bars[1]).toEqual([{ kind: 'fleece', share: 1 }]);
  });
});

describe('the supplies column on an agora', () => {
  it('stands a bar on each vendor, its stock against what a vendor holds, and keeps the agora floor', () => {
    const game = grassGame(30);
    placeRoad(game, { x: 0, y: 15 }, { x: 29, y: 15 });
    placeBuilding(game, 'agora', 10, 16);
    const agora = lastBuilding(game);
    placeBuilding(game, 'foodVendor', 10, 16);
    const food = lastBuilding(game);
    placeBuilding(game, 'clothVendor', 10, 18);
    const cloth = lastBuilding(game);
    food.food = VENDOR_CAPACITY / 4;
    expect(columnOf(game, 'supplies', food)).toEqual({ building: food, bars: [[{ kind: 'food', share: 0.25 }]], details: ['Food 2 / 8 loads'] });
    expect(columnOf(game, 'supplies', cloth)!.bars).toEqual([[{ kind: 'cloth', share: 0 }]]);
    expect(buildingLook(game, 'supplies', agora)).toBe('serving');
  });
});

describe('the tax column', () => {
  it('stands what each house paid in the last 12 months, scaled to the biggest payer', () => {
    const game = grassGame();
    const small = occupiedHouse(game, 4, 4);
    const big = occupiedHouse(game, 8, 4);
    const unreached = occupiedHouse(game, 12, 4);
    small.taxPaid = [1, 2];
    big.taxPaid = [4, 2];
    expect([small, big, unreached].map((house) => columnOf(game, 'tax', house)!.bars)).toEqual([
      [[{ kind: 'tax', share: 0.5 }]],
      [[{ kind: 'tax', share: 1 }]],
      [[{ kind: 'tax', share: 0 }]],
    ]);
  });

  it('stands every house at zero when nobody has paid', () => {
    const game = grassGame();
    const house = occupiedHouse(game, 4, 4);
    expect(columnOf(game, 'tax', house)!.bars).toEqual([[{ kind: 'tax', share: 0 }]]);
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

  it('keeps the distribution buildings for Supplies', () => {
    const game = grassGame();
    for (const [type, x] of [['granary', 4], ['storehouse', 8]] as const) {
      placeBuilding(game, type, x, 4);
      expect(buildingLook(game, 'supplies', lastBuilding(game))).toBe('serving');
    }
  });

  it('reports the values behind the marks, for the hover', () => {
    const game = grassGame();
    const house = occupiedHouse(game, 4, 4);
    house.level = 'shack';
    house.taxPaid = [0.5, 0.25];
    expect(overlayReport(game, 'tax', house)).toEqual({ name: 'Shack', details: ['Tax paid, last 12 months: 0.75 dr'] });
  });
});

describe("map overlays on a Traders' Guild", () => {
  it('stand its supplies, cloth included, and its water and culture columns', () => {
    const { game, guild } = placedGuild();
    supplyGuild(guild);
    guild.coveredUntil.water = COVERAGE_MONTHS.water * TICKS_PER_MONTH;
    game.tick = (COVERAGE_MONTHS.water * TICKS_PER_MONTH) / 4;
    expect(columnOf(game, 'supplies', guild)!.bars.map(([part]) => part.kind)).toEqual(['food', 'fleece', 'oil', 'cloth']);
    expect(columnOf(game, 'water', guild)!.bars).toEqual([[{ kind: 'water', share: 0.75 }]]);
    expect(columnOf(game, 'culture', guild)!.bars.map(([part]) => part.kind)).toEqual(['philosophy', 'athletics', 'drama']);
  });

  it('leave out tax: it pays none', () => {
    const { game, guild } = placedGuild();
    guild.taxPaid = [1];
    expect(columnOf(game, 'tax', guild)).toBeNull();
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

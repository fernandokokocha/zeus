import { describe, expect, it } from 'vitest';
import { appealMap } from '../../src/sim/appeal';
import type { BuildingType } from '../../src/sim/buildings';
import { TICKS_PER_MONTH, TICKS_PER_YEAR } from '../../src/sim/clock';
import { demolish, placeBuilding, placeRoad } from '../../src/sim/commands';
import { UNITS_PER_LOAD } from '../../src/sim/food';
import { FOREST_REGROWTH_TICKS, WORKSHOP_CAPACITY, gatheringRestTicks, isResource, type Workshop } from '../../src/sim/materials';
import { isOpenGround } from '../../src/sim/pathfinding';
import { riskShare } from '../../src/sim/safety';
import { tileIndex, type Building, type GameState } from '../../src/sim/state';
import type { Terrain } from '../../src/sim/terrain';
import { tick } from '../../src/sim/tick';
import { STARTING_TREASURY } from '../../src/sim/treasury';
import { grassGame, placeHouse, runTicks, setTerrain } from './helpers';

describe('the material buildings', () => {
  it.each<[BuildingType, number, number[]]>([
    ['timberMill', 35, [-5, -4, -3, -2]],
    ['masonryShop', 75, [-6, -5, -4, -3]],
    ['foundry', 60, [-10, -9, -8, -7, -6, -5]],
    ['sculptureStudio', 100, [-2, -1]],
    ['artisansGuild', 35, [-6, -6, -5]],
  ])('a %s costs %i dr and radiates %j', (type, cost, appeal) => {
    const game = grassGame(30);
    expect(placeBuilding(game, type, 10, 10)).toEqual({ ok: true });
    expect(game.treasury).toBe(STARTING_TREASURY - cost);
    const map = appealMap(game);
    appeal.forEach((value, ring) => expect(map[tileIndex(game, 12 + ring, 11)]).toBe(value));
  });

  it.each<[BuildingType, 'fireRisk' | 'collapseRisk', number]>([
    ['timberMill', 'fireRisk', 10],
    ['masonryShop', 'collapseRisk', 10],
    ['foundry', 'collapseRisk', 10],
    ['sculptureStudio', 'collapseRisk', 10],
    ['artisansGuild', 'fireRisk', 5],
  ])('a %s builds up %s by %i a month', (type, risk, increment) => {
    const game = grassGame();
    placeBuilding(game, type, 4, 4);
    runTicks(game, TICKS_PER_MONTH);
    expect(riskShare(game.buildings[0][risk])).toBeCloseTo(increment / 60);
  });
});

const ROAD_Y = 25;

function workshop(type: Workshop, people = 100): { game: GameState; shop: Building } {
  const game = grassGame(50);
  placeRoad(game, { x: 0, y: ROAD_Y }, { x: 49, y: ROAD_Y });
  placeHouse(game, 0, 48);
  game.buildings[0].residents = people;
  placeBuilding(game, type, 2, ROAD_Y - 2);
  return { game, shop: game.buildings[1] };
}

function fill(game: GameState, terrain: Terrain, x: number, y: number, width = 1, height = 1): void {
  for (let dy = 0; dy < height; dy++) for (let dx = 0; dx < width; dx++) setTerrain(game, x + dx, y + dy, terrain);
}

function untilHome(game: GameState): void {
  for (let i = 0; i < 2 * TICKS_PER_MONTH && game.gatherers.length > 0; i++) tick(game);
}

function untilWorked(game: GameState): void {
  const gatherer = game.gatherers[0];
  for (let i = 0; i < 2 * TICKS_PER_MONTH && !gatherer.returning; i++) tick(game);
}

describe('a timber mill', () => {
  it('sends its lumberjack once staffed and rested', () => {
    const { game, shop } = workshop('timberMill');
    fill(game, 'forest', 10, 10);
    expect(gatheringRestTicks('timberMill')).toBeCloseTo(TICKS_PER_YEAR / 13);
    runTicks(game, Math.ceil(gatheringRestTicks('timberMill')) - 1);
    expect(game.gatherers).toEqual([]);
    tick(game);
    expect(game.gatherers).toHaveLength(1);
    expect(game.gatherers[0]).toMatchObject({ homeId: shop.id, good: 'wood', site: { x: 10, y: 10 }, load: 0, returning: false });
  });

  it('takes twice as long at half staff', () => {
    const { game } = workshop('timberMill', 12);
    fill(game, 'forest', 10, 10);
    runTicks(game, Math.ceil(2 * gatheringRestTicks('timberMill')) - 1);
    expect(game.gatherers).toEqual([]);
    tick(game);
    expect(game.gatherers).toHaveLength(1);
  });

  it('does nothing without workers', () => {
    const { game } = workshop('timberMill', 0);
    fill(game, 'forest', 10, 10);
    runTicks(game, 3 * gatheringRestTicks('timberMill'));
    expect(game.gatherers).toEqual([]);
  });

  it('fells a tree and brings a load of wood home', () => {
    const { game, shop } = workshop('timberMill');
    fill(game, 'forest', 10, 10);
    runTicks(game, gatheringRestTicks('timberMill'));
    const lumberjack = game.gatherers[0];
    const end = lumberjack.path.at(-1)!;
    expect(Math.abs(end.x - 10) + Math.abs(end.y - 10)).toBe(1);
    untilWorked(game);
    expect(lumberjack.load).toBe(UNITS_PER_LOAD);
    expect(isResource(game, 'timberMill', { x: 10, y: 10 })).toBe(false);
    expect(game.terrain[tileIndex(game, 10, 10)]).toBe('forest');
    expect(isOpenGround(game, { x: 10, y: 10 })).toBe(true);
    untilHome(game);
    expect(shop.wood).toBe(UNITS_PER_LOAD);
  });

  it('lets a felled tree grow back in 4 years', () => {
    const { game } = workshop('timberMill');
    fill(game, 'forest', 10, 10);
    runTicks(game, gatheringRestTicks('timberMill'));
    untilWorked(game);
    const regrowsAt = game.felledUntil[tileIndex(game, 10, 10)];
    expect(regrowsAt - game.tick).toBe(FOREST_REGROWTH_TICKS);
    expect(FOREST_REGROWTH_TICKS).toBe(4 * TICKS_PER_YEAR);
    runTicks(game, regrowsAt - game.tick - 1);
    expect(isResource(game, 'timberMill', { x: 10, y: 10 })).toBe(false);
    const version = game.version;
    tick(game);
    expect(isResource(game, 'timberMill', { x: 10, y: 10 })).toBe(true);
    expect(game.version).toBeGreaterThan(version);
  });

  it('goes to the nearest forest within 20 tiles', () => {
    const { game } = workshop('timberMill');
    fill(game, 'forest', 30, 10);
    fill(game, 'forest', 12, 8);
    fill(game, 'forest', 20, 20);
    runTicks(game, gatheringRestTicks('timberMill'));
    expect(game.gatherers[0].site).toEqual({ x: 20, y: 20 });
  });

  it('ignores forest farther than 20 tiles', () => {
    const { game, shop } = workshop('timberMill');
    fill(game, 'forest', 25, 10);
    runTicks(game, 2 * gatheringRestTicks('timberMill'));
    expect(game.gatherers).toEqual([]);
    expect(shop.walkerRest).toBeGreaterThan(0);
  });

  it('sends two mills to different trees', () => {
    const { game } = workshop('timberMill');
    placeBuilding(game, 'timberMill', 6, ROAD_Y - 2);
    fill(game, 'forest', 10, 10);
    fill(game, 'forest', 12, 10);
    runTicks(game, gatheringRestTicks('timberMill'));
    expect(game.gatherers.map((g) => g.site).sort((a, b) => a.x - b.x)).toEqual([{ x: 10, y: 10 }, { x: 12, y: 10 }]);
  });

  it('keeps its lumberjack home while it holds 4 loads', () => {
    const { game, shop } = workshop('timberMill');
    fill(game, 'forest', 10, 10);
    shop.wood = WORKSHOP_CAPACITY;
    runTicks(game, 2 * gatheringRestTicks('timberMill'));
    expect(game.gatherers).toEqual([]);
  });

  it('sends its lumberjack home empty when his tree is cleared', () => {
    const { game, shop } = workshop('timberMill');
    fill(game, 'forest', 10, 10);
    runTicks(game, gatheringRestTicks('timberMill') + TICKS_PER_MONTH / 4);
    demolish(game, { x: 10, y: 10 }, { x: 10, y: 10 });
    tick(game);
    expect(game.gatherers[0].returning).toBe(true);
    untilHome(game);
    expect(shop.wood).toBe(0);
  });

  it('takes its lumberjack with it when demolished', () => {
    const { game, shop } = workshop('timberMill');
    fill(game, 'forest', 10, 10);
    runTicks(game, gatheringRestTicks('timberMill'));
    demolish(game, shop, shop);
    expect(game.gatherers).toEqual([]);
  });

  it.each([
    [4, 11, 13],
    [13, 9, 10],
    [23, 7, 8],
  ])('makes about the Zeus output from forest starting %i tiles east', (fromX, least, most) => {
    const { game, shop } = workshop('timberMill');
    fill(game, 'forest', fromX, 5, 8, ROAD_Y - 5);
    let loads = 0;
    for (let i = 0; i < TICKS_PER_YEAR + TICKS_PER_MONTH; i++) {
      game.buildings[0].residents = 100;
      shop.fireRisk = 0;
      tick(game);
      if (i >= TICKS_PER_MONTH) loads += shop.wood / UNITS_PER_LOAD;
      shop.wood = 0;
    }
    expect(loads).toBeGreaterThanOrEqual(least);
    expect(loads).toBeLessThanOrEqual(most);
  });
});

describe('a masonry shop', () => {
  it('cuts marble that never runs out', () => {
    const { game, shop } = workshop('masonryShop');
    fill(game, 'marble', 10, 10);
    expect(gatheringRestTicks('masonryShop')).toBeCloseTo(TICKS_PER_MONTH);
    for (let trip = 0; trip < 2; trip++) {
      runTicks(game, gatheringRestTicks('masonryShop'));
      expect(game.gatherers[0]).toMatchObject({ good: 'marble', site: { x: 10, y: 10 } });
      untilHome(game);
    }
    expect(shop.marble).toBe(2 * UNITS_PER_LOAD);
    expect(isResource(game, 'masonryShop', { x: 10, y: 10 })).toBe(true);
  });
});

describe('a foundry', () => {
  it('digs copper ore that never runs out and casts it into bronze', () => {
    const { game, shop } = workshop('foundry');
    fill(game, 'copper', 10, 10);
    fill(game, 'forest', 8, 10);
    for (let trip = 0; trip < 2; trip++) {
      runTicks(game, gatheringRestTicks('foundry'));
      expect(game.gatherers[0]).toMatchObject({ good: 'bronze', site: { x: 10, y: 10 } });
      untilHome(game);
    }
    expect(shop.bronze).toBe(2 * UNITS_PER_LOAD);
  });
});

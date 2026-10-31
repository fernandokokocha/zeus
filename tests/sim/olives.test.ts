import { describe, expect, it } from 'vitest';
import { appealMap } from '../../src/sim/appeal';
import { TICKS_PER_MONTH, TICKS_PER_YEAR } from '../../src/sim/clock';
import { demolish, placeBuilding, placeOliveTrees, placeRoad } from '../../src/sim/commands';
import { CART_LOAD, UNITS_PER_LOAD } from '../../src/sim/food';
import { PICKING_REST_TICKS, PRESSING_TICKS, PRESS_OIL_CAPACITY, PRESS_OLIVE_CAPACITY, isRipe } from '../../src/sim/olives';
import { tileIndex, type Building, type GameState } from '../../src/sim/state';
import { tick } from '../../src/sim/tick';
import { STARTING_TREASURY } from '../../src/sim/treasury';
import { WALKER_TILES_PER_TICK } from '../../src/sim/walking';
import { meadowGame, placeHouse, runTicks, setTerrain } from './helpers';

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

function grove(people = 100, size = 30): { game: GameState; lodge: Building } {
  const game = meadowGame(size);
  placeRoad(game, { x: 0, y: 15 }, { x: size - 1, y: 15 });
  placeHouse(game, 0, size - 2);
  game.buildings[0].residents = people;
  placeBuilding(game, 'growersLodge', 2, 13);
  return { game, lodge: game.buildings[1] };
}

function plant(game: GameState, x: number, y: number): Building {
  placeOliveTrees(game, { x, y }, { x, y });
  return game.buildings[game.buildings.length - 1];
}

function untilGrowersGone(game: GameState): void {
  for (let i = 0; i < 2 * TICKS_PER_MONTH && game.growers.length > 0; i++) tick(game);
}

describe("a growers' lodge", () => {
  it('sends its grower 0.6 months after it is staffed', () => {
    const { game, lodge } = grove();
    const tree = plant(game, 10, 10);
    expect(PICKING_REST_TICKS).toBe(0.6 * TICKS_PER_MONTH);
    runTicks(game, PICKING_REST_TICKS - 1);
    expect(game.growers).toEqual([]);
    tick(game);
    expect(game.growers).toHaveLength(1);
    expect(game.growers[0]).toMatchObject({ homeId: lodge.id, treeId: tree.id, returning: false, olives: 0 });
    expect(game.growers[0].path[0]).toEqual({ x: 3, y: 15 });
  });

  it('takes twice as long at half staff', () => {
    const { game } = grove(12);
    plant(game, 10, 10);
    runTicks(game, 2 * PICKING_REST_TICKS - 1);
    expect(game.growers).toEqual([]);
    tick(game);
    expect(game.growers).toHaveLength(1);
  });

  it('does nothing without workers', () => {
    const { game } = grove(0);
    plant(game, 10, 10);
    runTicks(game, 3 * PICKING_REST_TICKS);
    expect(game.growers).toEqual([]);
  });

  it('picks a ripe tree inside a grove and brings a load of olives home', () => {
    const { game, lodge } = grove();
    placeOliveTrees(game, { x: 9, y: 9 }, { x: 11, y: 11 });
    const trees = game.buildings.filter((b) => b.type === 'oliveTree');
    for (const tree of trees) tree.growth = 0;
    const middle = trees[4];
    middle.growth = 1;
    runTicks(game, PICKING_REST_TICKS);
    const grower = game.growers[0];
    expect(grower.path.at(-1)).toEqual({ x: 10, y: 10 });
    expect(grower.path.some((p) => !game.roads[tileIndex(game, p.x, p.y)])).toBe(true);
    for (let i = 0; i < TICKS_PER_MONTH && !grower.returning; i++) tick(game);
    expect(middle.growth).toBe(0);
    expect(grower.olives).toBe(UNITS_PER_LOAD);
    untilGrowersGone(game);
    expect(lodge.olives).toBe(UNITS_PER_LOAD);
  });

  it('goes to the nearest ripe tree', () => {
    const { game } = grove();
    plant(game, 20, 10);
    const near = plant(game, 8, 10);
    plant(game, 4, 10).growth = 0.5;
    runTicks(game, PICKING_REST_TICKS);
    expect(game.growers[0].treeId).toBe(near.id);
  });

  it('leaves a tree alone while another grower is after it', () => {
    const { game } = grove();
    placeBuilding(game, 'growersLodge', 20, 13);
    plant(game, 10, 10);
    runTicks(game, PICKING_REST_TICKS);
    expect(game.growers).toHaveLength(1);
  });

  it('does not reach for trees more than 20 tiles away', () => {
    const { game } = grove(100, 60);
    plant(game, 25, 10);
    runTicks(game, 2 * PICKING_REST_TICKS);
    expect(game.growers).toEqual([]);
    plant(game, 23, 10);
    tick(game);
    expect(game.growers).toHaveLength(1);
  });

  it('keeps its grower home while it holds 4 loads', () => {
    const { game, lodge } = grove();
    plant(game, 10, 10);
    lodge.olives = CART_LOAD;
    runTicks(game, 2 * PICKING_REST_TICKS);
    expect(game.growers).toEqual([]);
  });

  it('calls its grower home empty-handed when his tree is demolished', () => {
    const { game, lodge } = grove();
    plant(game, 10, 10);
    runTicks(game, PICKING_REST_TICKS + 5);
    demolish(game, { x: 10, y: 10 }, { x: 10, y: 10 });
    tick(game);
    expect(game.growers[0].returning).toBe(true);
    untilGrowersGone(game);
    expect(lodge.olives).toBe(0);
  });

  it('takes its grower with it when demolished', () => {
    const { game } = grove();
    plant(game, 10, 10);
    runTicks(game, PICKING_REST_TICKS + 5);
    demolish(game, { x: 2, y: 13 }, { x: 2, y: 13 });
    expect(game.growers).toEqual([]);
  });

  it('turns its grower around a building put in his way', () => {
    const { game, lodge } = grove();
    plant(game, 10, 10);
    runTicks(game, PICKING_REST_TICKS);
    const grower = game.growers[0];
    const ahead = grower.path[grower.path.length - 3];
    expect(placeBuilding(game, 'park', ahead.x, ahead.y).ok).toBe(true);
    untilGrowersGone(game);
    expect(lodge.olives).toBe(UNITS_PER_LOAD);
  });
});

function oilTown(people = 100): { game: GameState; lodge: Building; press: Building } {
  const { game, lodge } = grove(people);
  game.priorities.olivePress = 3;
  placeBuilding(game, 'olivePress', 10, 13);
  return { game, lodge, press: game.buildings[2] };
}

describe("a growers' lodge's cart pusher", () => {
  it('takes the olives to the nearest olive press', () => {
    const { game, lodge, press } = oilTown();
    lodge.olives = 200;
    tick(game);
    expect(game.carriers).toHaveLength(1);
    expect(game.carriers[0]).toMatchObject({ kind: 'oliveCart', homeId: lodge.id, destinationId: press.id, olives: 200 });
    runTicks(game, Math.ceil(8 / WALKER_TILES_PER_TICK));
    expect(press.olives).toBe(200);
  });

it('stays home without a staffed press', () => {
  const { game, lodge, press } = oilTown(24);
  lodge.olives = 100;
  runTicks(game, 10);
  expect(press.workers).toBe(0);
  expect(game.carriers).toEqual([]);
});

  it('brings only what fits, counting carts already on the way', () => {
    const { game, lodge, press } = oilTown();
    press.olives = PRESS_OLIVE_CAPACITY - 100;
    lodge.olives = 400;
    tick(game);
    expect(game.carriers[0].olives).toBe(100);
    placeBuilding(game, 'growersLodge', 20, 13);
    game.buildings[game.buildings.length - 1].olives = 400;
    tick(game);
    expect(game.carriers).toHaveLength(1);
  });
});

describe('an olive press', () => {
  it('turns a load of olives into a load of oil in 2 months at full staff', () => {
    const { game, press } = oilTown();
    press.olives = 200;
    expect(PRESSING_TICKS).toBe(2 * TICKS_PER_MONTH);
    runTicks(game, PRESSING_TICKS - 1);
    expect(press.oil).toBe(0);
    tick(game);
    expect(press).toMatchObject({ olives: 100, oil: 100 });
  });

  it('takes twice as long at half staff', () => {
    const { game, press } = oilTown(35);
    press.olives = 100;
    tick(game);
    expect(press.workers).toBe(6);
    runTicks(game, 2 * PRESSING_TICKS - 2);
    expect(press.oil).toBe(0);
    tick(game);
    expect(press.oil).toBe(100);
  });

  it('waits for olives', () => {
    const { game, press } = oilTown();
    runTicks(game, PRESSING_TICKS);
    expect(press).toMatchObject({ oil: 0, production: 0 });
  });

  it('stops while 4 loads of oil wait for a cart', () => {
    const { game, press } = oilTown();
    press.olives = 100;
    press.oil = PRESS_OIL_CAPACITY;
    runTicks(game, PRESSING_TICKS);
    expect(press).toMatchObject({ olives: 100, oil: PRESS_OIL_CAPACITY });
  });
});

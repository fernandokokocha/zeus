import { describe, expect, it } from 'vitest';
import { demolish, placeBuilding, placeRoad } from '../../src/sim/commands';
import { BUYER_LOAD, VENDOR_CAPACITY } from '../../src/sim/food';
import type { Building, GameState } from '../../src/sim/state';
import { STOREHOUSE_CAPACITY, STOREHOUSE_SLOTS, SLOT_SIZE, slotsUsed } from '../../src/sim/storehouse';
import { tick } from '../../src/sim/tick';
import { WALKER_TILES_PER_TICK } from '../../src/sim/walking';
import { grassGame, placeHouse, runTicks } from './helpers';

function ticksToWalk(tiles: number): number {
  return Math.ceil(tiles / WALKER_TILES_PER_TICK);
}

function woolTown(people = 100): { game: GameState; shed: Building; storehouse: Building } {
  const game = grassGame(30);
  placeRoad(game, { x: 0, y: 15 }, { x: 29, y: 15 });
  placeHouse(game, 0, 28);
  game.buildings[0].residents = people;
  placeBuilding(game, 'cardingShed', 2, 13);
  placeBuilding(game, 'storehouse', 10, 12);
  const [, shed, storehouse] = game.buildings;
  return { game, shed, storehouse };
}

describe('a storehouse', () => {
  it('holds 32 loads in 8 slots of 4 loads', () => {
    expect(STOREHOUSE_SLOTS).toBe(8);
    expect(SLOT_SIZE).toBe(400);
    expect(STOREHOUSE_CAPACITY).toBe(3200);
  });

  it('fills a slot before starting the next', () => {
    const { storehouse } = woolTown();
    expect(slotsUsed(storehouse)).toBe(0);
    storehouse.fleece = 100;
    expect(slotsUsed(storehouse)).toBe(1);
    storehouse.fleece = 400;
    expect(slotsUsed(storehouse)).toBe(1);
    storehouse.fleece = 500;
    expect(slotsUsed(storehouse)).toBe(2);
    storehouse.fleece = STOREHOUSE_CAPACITY;
    expect(slotsUsed(storehouse)).toBe(8);
  });
});

describe("a carding shed's cart pusher", () => {
  it('takes the fleece to the nearest storehouse', () => {
    const { game, shed, storehouse } = woolTown();
    shed.fleece = 100;
    tick(game);
    expect(game.carriers).toHaveLength(1);
    expect(game.carriers[0]).toMatchObject({ kind: 'fleeceCart', homeId: shed.id, destinationId: storehouse.id, fleece: 100 });
    expect(shed.fleece).toBe(0);
    runTicks(game, ticksToWalk(8));
    expect(storehouse.fleece).toBe(100);
    expect(game.carriers[0]).toMatchObject({ returning: true, fleece: 0 });
  });

  it('stays home without a staffed storehouse', () => {
    const { game, shed, storehouse } = woolTown(10);
    shed.fleece = 100;
    tick(game);
    expect(storehouse.workers).toBe(0);
    expect(game.carriers).toEqual([]);
    demolish(game, storehouse, storehouse);
    game.buildings[0].residents = 100;
    tick(game);
    expect(game.carriers).toEqual([]);
    expect(shed.fleece).toBe(100);
  });

  it('brings only what fits, counting carts already on the way', () => {
    const { game, shed, storehouse } = woolTown();
    storehouse.fleece = STOREHOUSE_CAPACITY - 100;
    shed.fleece = 400;
    tick(game);
    expect(game.carriers[0].fleece).toBe(100);
    placeBuilding(game, 'cardingShed', 20, 13);
    game.buildings[game.buildings.length - 1].fleece = 400;
    tick(game);
    expect(game.carriers).toHaveLength(1);
  });
});

describe('a fleece vendor', () => {
  function market(): { game: GameState; storehouse: Building; vendor: Building } {
    const { game, storehouse } = woolTown();
    placeBuilding(game, 'agora', 0, 16);
    placeBuilding(game, 'foodVendor', 0, 16);
    placeBuilding(game, 'fleeceVendor', 0, 18);
    return { game, storehouse, vendor: game.buildings[game.buildings.length - 1] };
  }

  it('takes a free spot on an agora and goes with it', () => {
    const { game, vendor } = market();
    expect(vendor).toMatchObject({ type: 'fleeceVendor', x: 0, y: 18 });
    expect(placeBuilding(game, 'fleeceVendor', 0, 16)).toEqual({ ok: false, reason: 'A vendor goes on a free spot of an agora' });
    demolish(game, { x: 2, y: 16 }, { x: 2, y: 16 });
    expect(game.buildings.some((b) => b.type === 'fleeceVendor')).toBe(false);
  });

  it('sends a buyer to fetch 4 loads of fleece from the storehouse', () => {
    const { game, storehouse, vendor } = market();
    storehouse.fleece = 1000;
    tick(game);
    const buyer = game.carriers.find((c) => c.kind === 'fleeceBuyer');
    expect(buyer).toMatchObject({ homeId: vendor.id, destinationId: storehouse.id, fleece: 0 });
    for (let i = 0; i < 300 && vendor.fleece === 0; i++) tick(game);
    expect(vendor.fleece).toBe(BUYER_LOAD);
    expect(storehouse.fleece).toBe(1000 - BUYER_LOAD);
  });

  it('stops buying once the stall is full', () => {
    const { game, storehouse, vendor } = market();
    storehouse.fleece = 1000;
    vendor.fleece = VENDOR_CAPACITY;
    runTicks(game, 10);
    expect(game.carriers.filter((c) => c.kind === 'fleeceBuyer')).toEqual([]);
  });

  it('waits for a storehouse with fleece', () => {
    const { game } = market();
    runTicks(game, 10);
    expect(game.carriers.filter((c) => c.kind === 'fleeceBuyer')).toEqual([]);
  });
});

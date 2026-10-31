import { describe, expect, it } from 'vitest';
import { BUILDING_SPECS } from '../../src/sim/buildings';
import { TICKS_PER_MONTH } from '../../src/sim/clock';
import { demolish, placeBuilding, placeRoad } from '../../src/sim/commands';
import { ARMORY_ARMOR_CAPACITY, ARMORY_BRONZE_CAPACITY, ARMOR_TICKS } from '../../src/sim/armor';
import { BUYER_LOAD, VENDOR_CAPACITY } from '../../src/sim/food';
import { isIndustry } from '../../src/sim/industries';
import { productionReport } from '../../src/sim/production';
import { COLLAPSE_RISK_INCREMENTS, FIRE_RISK_INCREMENTS } from '../../src/sim/safety';
import type { Building, GameState } from '../../src/sim/state';
import { STOREHOUSE_CAPACITY, slotsUsed } from '../../src/sim/storehouse';
import { tick } from '../../src/sim/tick';
import { WALKER_TILES_PER_TICK } from '../../src/sim/walking';
import { grassGame, placeHouse, runTicks } from './helpers';

function armorTown(people = 100): { game: GameState; storehouse: Building; armory: Building } {
  const game = grassGame(30);
  placeRoad(game, { x: 0, y: 15 }, { x: 29, y: 15 });
  placeHouse(game, 0, 28);
  game.buildings[0].residents = people;
  placeBuilding(game, 'storehouse', 10, 12);
  placeBuilding(game, 'armory', 20, 13);
  const [, storehouse, armory] = game.buildings;
  return { game, storehouse, armory };
}

function untilCarriersGone(game: GameState): void {
  for (let i = 0; i < 1000 && game.carriers.length > 0; i++) tick(game);
}

describe('an armory', () => {
  it('is a 2×2 workshop of 18 workers for 40 dr, ugly out to 4 tiles', () => {
    const { game } = armorTown();
    const before = game.treasury;
    expect(placeBuilding(game, 'armory', 24, 13)).toEqual({ ok: true });
    expect(game.treasury).toBe(before - 40);
    expect(BUILDING_SPECS.armory).toMatchObject({ width: 2, height: 2, workers: 18, appeal: [-8, -7, -6, -5] });
  });

  it('turns a load of bronze into a load of armor in 2 months at full staff', () => {
    const { game, armory } = armorTown();
    armory.bronze = 200;
    expect(ARMOR_TICKS).toBe(2 * TICKS_PER_MONTH);
    runTicks(game, ARMOR_TICKS - 1);
    expect(armory.armor).toBe(0);
    tick(game);
    expect(armory).toMatchObject({ bronze: 100, armor: 100 });
  });

  it('takes twice as long at half staff', () => {
    const { game, armory } = armorTown(42);
    armory.bronze = 100;
    tick(game);
    expect(armory.workers).toBe(9);
    runTicks(game, 2 * ARMOR_TICKS - 2);
    expect(armory.armor).toBe(0);
    tick(game);
    expect(armory.armor).toBe(100);
  });

  it('does nothing without workers', () => {
    const { game, armory } = armorTown(20);
    armory.bronze = 100;
    runTicks(game, ARMOR_TICKS);
    expect(armory).toMatchObject({ workers: 0, bronze: 100, armor: 0 });
  });

  it('waits for bronze', () => {
    const { game, armory } = armorTown();
    runTicks(game, ARMOR_TICKS);
    expect(armory).toMatchObject({ armor: 0, production: 0 });
  });

  it('stops while 4 loads of armor wait for a cart', () => {
    const { game, armory } = armorTown();
    demolish(game, { x: 10, y: 12 }, { x: 10, y: 12 });
    armory.bronze = 100;
    armory.armor = ARMORY_ARMOR_CAPACITY;
    runTicks(game, ARMOR_TICKS);
    expect(armory).toMatchObject({ bronze: 100, armor: ARMORY_ARMOR_CAPACITY, production: 0 });
  });

  it('catches fire like a Granary and never collapses', () => {
    expect(FIRE_RISK_INCREMENTS.armory).toBe(8);
    expect(COLLAPSE_RISK_INCREMENTS.armory).toBeUndefined();
  });

  it('is an industry that makes 6 loads of armor a year from 6 of bronze', () => {
    const { game } = armorTown(0);
    expect(isIndustry('armory')).toBe(true);
    runTicks(game, 3 * TICKS_PER_MONTH);
    const armor = productionReport(game).goods.find((g) => g.good === 'armor');
    const bronze = productionReport(game).goods.find((g) => g.good === 'bronze');
    expect(armor?.possible).toBeCloseTo(600 / 4);
    expect(bronze?.wanted).toBeCloseTo(600 / 4);
  });
});

describe("an armory's buyer", () => {
  it('fetches 4 loads of bronze from the storehouse', () => {
    const { game, storehouse, armory } = armorTown();
    storehouse.bronze = 1000;
    tick(game);
    expect(game.carriers.find((c) => c.kind === 'armoryBuyer')).toMatchObject({ homeId: armory.id, destinationId: storehouse.id, bronze: 0 });
    for (let i = 0; i < 600 && armory.bronze === 0; i++) tick(game);
    expect(armory.bronze).toBe(ARMORY_BRONZE_CAPACITY);
    expect(storehouse.bronze).toBe(1000 - ARMORY_BRONZE_CAPACITY);
  });

  it('fetches only what fits', () => {
    const { game, storehouse, armory } = armorTown();
    storehouse.bronze = 1000;
    armory.bronze = 100;
    tick(game);
    untilCarriersGone(game);
    expect(armory.bronze).toBe(ARMORY_BRONZE_CAPACITY);
    expect(storehouse.bronze).toBe(700);
  });

  it('stays home while the armory is full of bronze', () => {
    const { game, storehouse, armory } = armorTown();
    storehouse.bronze = 1000;
    armory.bronze = ARMORY_BRONZE_CAPACITY;
    runTicks(game, 10);
    expect(game.carriers.filter((c) => c.kind === 'armoryBuyer')).toEqual([]);
  });

  it('never fetches from a Foundry', () => {
    const { game } = armorTown();
    game.buildings[1].refused = ['bronze'];
    placeBuilding(game, 'foundry', 24, 13);
    game.buildings[game.buildings.length - 1].bronze = 400;
    runTicks(game, 10);
    expect(game.carriers.filter((c) => c.kind === 'armoryBuyer')).toEqual([]);
  });
});

describe("an armory's cart pusher", () => {
  it('takes the armor to the nearest storehouse', () => {
    const { game, storehouse, armory } = armorTown();
    armory.armor = 400;
    tick(game);
    expect(game.carriers[0]).toMatchObject({ kind: 'armorCart', homeId: armory.id, destinationId: storehouse.id, armor: 400 });
    runTicks(game, Math.ceil(12 / WALKER_TILES_PER_TICK));
    expect(storehouse.armor).toBe(400);
  });

  it('stays home while no storehouse has room', () => {
    const { game, storehouse, armory } = armorTown();
    storehouse.marble = STOREHOUSE_CAPACITY;
    armory.armor = 100;
    runTicks(game, 10);
    expect(game.carriers).toEqual([]);
  });
});

describe('armor in the storehouse', () => {
  it('takes its own slots, shared with every other good', () => {
    const { game, storehouse } = armorTown();
    Object.assign(storehouse, { bronze: 100, armor: 500 });
    expect(slotsUsed(game, storehouse)).toBe(3);
  });
});

describe('an arms vendor', () => {
  function market(): { game: GameState; storehouse: Building; vendor: Building } {
    const { game, storehouse } = armorTown();
    placeBuilding(game, 'agora', 0, 16);
    placeBuilding(game, 'armsVendor', 0, 18);
    return { game, storehouse, vendor: game.buildings[game.buildings.length - 1] };
  }

  it('takes a free spot on an agora for 10 dr', () => {
    const { game } = armorTown();
    placeBuilding(game, 'agora', 0, 16);
    const before = game.treasury;
    expect(placeBuilding(game, 'armsVendor', 0, 20)).toEqual({ ok: true });
    expect(game.treasury).toBe(before - 10);
    expect(BUILDING_SPECS.armsVendor).toMatchObject({ width: 2, height: 2, workers: 4 });
  });

  it('sends a buyer to fetch 4 loads of armor from the storehouse', () => {
    const { game, storehouse, vendor } = market();
    storehouse.armor = 1000;
    tick(game);
    expect(game.carriers.find((c) => c.kind === 'armorBuyer')).toMatchObject({ homeId: vendor.id, destinationId: storehouse.id, armor: 0 });
    for (let i = 0; i < 300 && vendor.armor === 0; i++) tick(game);
    expect(vendor.armor).toBe(BUYER_LOAD);
    expect(storehouse.armor).toBe(1000 - BUYER_LOAD);
  });

  it('stops buying once the stall holds 8 loads', () => {
    const { game, storehouse, vendor } = market();
    storehouse.armor = 1000;
    vendor.armor = VENDOR_CAPACITY;
    runTicks(game, 10);
    expect(game.carriers.filter((c) => c.kind === 'armorBuyer')).toEqual([]);
  });

  it('sends out a peddler, who gives no armor to ordinary houses', () => {
    const { game, vendor } = market();
    placeHouse(game, 4, 13);
    const townhouse = game.buildings[game.buildings.length - 1];
    Object.assign(townhouse, { level: 'townhouse', residents: 60 });
    vendor.armor = 400;
    for (let i = 0; i < 200 && !game.roamers.some((r) => r.kind === 'peddler'); i++) tick(game);
    runTicks(game, 100);
    expect(game.roamers.map((r) => r.kind)).toContain('peddler');
    expect(townhouse.armor).toBe(0);
    expect(vendor.armor).toBe(400);
  });
});

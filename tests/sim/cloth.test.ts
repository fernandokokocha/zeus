import { describe, expect, it } from 'vitest';
import { BUILDING_SPECS } from '../../src/sim/buildings';
import { TICKS_PER_MONTH, TICKS_PER_YEAR } from '../../src/sim/clock';
import { demolish, placeBuilding, placeRoad, placeSheep } from '../../src/sim/commands';
import { FLEECE_KEPT_FOR_VENDORS, WEAVER_CLOTH_CAPACITY, WEAVER_FLEECE_CAPACITY, WEAVING_TICKS } from '../../src/sim/cloth';
import { BUYER_LOAD, UNITS_PER_LOAD, VENDOR_CAPACITY } from '../../src/sim/food';
import type { Building, GameState } from '../../src/sim/state';
import { STOREHOUSE_CAPACITY, slotsUsed } from '../../src/sim/storehouse';
import { tick } from '../../src/sim/tick';
import { WALKER_TILES_PER_TICK } from '../../src/sim/walking';
import { grassGame, placeHouse, runTicks, setMeadow } from './helpers';

function clothTown(people = 100): { game: GameState; storehouse: Building; weaver: Building } {
  const game = grassGame(30);
  placeRoad(game, { x: 0, y: 15 }, { x: 29, y: 15 });
  placeHouse(game, 0, 28);
  game.buildings[0].residents = people;
  game.priorities.weaver = 3;
  placeBuilding(game, 'storehouse', 10, 12);
  placeBuilding(game, 'weaver', 20, 13);
  const [, storehouse, weaver] = game.buildings;
  return { game, storehouse, weaver };
}

function untilCarriersGone(game: GameState): void {
  for (let i = 0; i < 1000 && game.carriers.length > 0; i++) tick(game);
}

describe('a weaver', () => {
  it('is a 2×2 workshop of 12 workers for 40 dr', () => {
    const { game } = clothTown();
    const before = game.treasury;
    expect(placeBuilding(game, 'weaver', 24, 13)).toEqual({ ok: true });
    expect(game.treasury).toBe(before - 40);
    expect(BUILDING_SPECS.weaver).toMatchObject({ width: 2, height: 2, workers: 12 });
  });

  it('weaves a load of fleece into a load of cloth in 2 months at full staff', () => {
    const { game, weaver } = clothTown();
    weaver.fleece = 200;
    expect(WEAVING_TICKS).toBe(2 * TICKS_PER_MONTH);
    runTicks(game, WEAVING_TICKS - 1);
    expect(weaver.cloth).toBe(0);
    tick(game);
    expect(weaver).toMatchObject({ fleece: 100, cloth: 100 });
  });

  it('takes twice as long at half staff', () => {
    const { game, weaver } = clothTown(35);
    weaver.fleece = 100;
    tick(game);
    expect(weaver.workers).toBe(6);
    runTicks(game, 2 * WEAVING_TICKS - 2);
    expect(weaver.cloth).toBe(0);
    tick(game);
    expect(weaver.cloth).toBe(100);
  });

  it('does nothing without workers', () => {
    const { game, weaver } = clothTown(20);
    weaver.fleece = 100;
    runTicks(game, WEAVING_TICKS);
    expect(weaver).toMatchObject({ workers: 0, fleece: 100, cloth: 0 });
  });

  it('waits for fleece', () => {
    const { game, weaver } = clothTown();
    runTicks(game, WEAVING_TICKS);
    expect(weaver).toMatchObject({ cloth: 0, production: 0 });
  });

  it('stops while 4 loads of cloth wait for a cart', () => {
    const { game, weaver } = clothTown();
    demolish(game, { x: 10, y: 12 }, { x: 10, y: 12 });
    weaver.fleece = 100;
    weaver.cloth = WEAVER_CLOTH_CAPACITY;
    runTicks(game, WEAVING_TICKS);
    expect(weaver).toMatchObject({ fleece: 100, cloth: WEAVER_CLOTH_CAPACITY, production: 0 });
  });
});

describe("a weaver's buyer", () => {
  it('fetches 4 loads of fleece from the storehouse', () => {
    const { game, storehouse, weaver } = clothTown();
    storehouse.fleece = 1000;
    tick(game);
    const buyer = game.carriers.find((c) => c.kind === 'weaverBuyer');
    expect(buyer).toMatchObject({ homeId: weaver.id, destinationId: storehouse.id, fleece: 0 });
    for (let i = 0; i < 600 && weaver.fleece === 0; i++) tick(game);
    expect(weaver.fleece).toBe(WEAVER_FLEECE_CAPACITY);
    expect(storehouse.fleece).toBe(1000 - WEAVER_FLEECE_CAPACITY);
  });

  it('fetches only what fits', () => {
    const { game, storehouse, weaver } = clothTown();
    storehouse.fleece = 1000;
    weaver.fleece = 100;
    tick(game);
    untilCarriersGone(game);
    expect(weaver.fleece).toBe(WEAVER_FLEECE_CAPACITY);
    expect(storehouse.fleece).toBe(700);
  });

  it('stays home while the weaver is full of fleece', () => {
    const { game, storehouse, weaver } = clothTown();
    storehouse.fleece = 1000;
    weaver.fleece = WEAVER_FLEECE_CAPACITY;
    runTicks(game, 10);
    expect(game.carriers.filter((c) => c.kind === 'weaverBuyer')).toEqual([]);
  });

  it('waits for a storehouse with fleece', () => {
    const { game } = clothTown();
    runTicks(game, 10);
    expect(game.carriers).toEqual([]);
  });
});

describe("a weaver's cart pusher", () => {
  it('takes the cloth to the nearest storehouse', () => {
    const { game, storehouse, weaver } = clothTown();
    weaver.cloth = 400;
    tick(game);
    expect(game.carriers[0]).toMatchObject({ kind: 'clothCart', homeId: weaver.id, destinationId: storehouse.id, cloth: 400 });
    runTicks(game, Math.ceil(12 / WALKER_TILES_PER_TICK));
    expect(storehouse.cloth).toBe(400);
  });

  it('stays home while no storehouse has room', () => {
    const { game, storehouse, weaver } = clothTown();
    storehouse.marble = STOREHOUSE_CAPACITY;
    weaver.cloth = 100;
    runTicks(game, 10);
    expect(game.carriers).toEqual([]);
  });

  it('brings only what fits, counting carts already on the way', () => {
    const { game, storehouse, weaver } = clothTown();
    Object.assign(storehouse, { fleece: 2800, cloth: 300 });
    weaver.cloth = 400;
    tick(game);
    expect(game.carriers.find((c) => c.kind === 'clothCart')?.cloth).toBe(100);
    placeBuilding(game, 'weaver', 24, 13);
    game.buildings[game.buildings.length - 1].cloth = 400;
    tick(game);
    expect(game.carriers.filter((c) => c.kind === 'clothCart')).toHaveLength(1);
  });

  it('goes out with the buyer at once', () => {
    const { game, storehouse, weaver } = clothTown();
    storehouse.fleece = 1000;
    weaver.cloth = 400;
    tick(game);
    expect(game.carriers.map((c) => c.kind).sort()).toEqual(['clothCart', 'weaverBuyer']);
  });
});

describe('cloth in the storehouse', () => {
  it('takes its own slots, shared with every other good', () => {
    const { game, storehouse } = clothTown();
    Object.assign(storehouse, { fleece: 100, oil: 100, cloth: 500 });
    expect(slotsUsed(game, storehouse)).toBe(4);
  });
});

describe('fleece wanted by a weaver and a fleece vendor', () => {
  function market(): { game: GameState; storehouse: Building; weaver: Building; vendor: Building } {
    const { game, storehouse, weaver } = clothTown();
    placeBuilding(game, 'agora', 0, 16);
    placeBuilding(game, 'fleeceVendor', 0, 16);
    return { game, storehouse, weaver, vendor: game.buildings[game.buildings.length - 1] };
  }

  it('leaves 4 loads in the storehouse for fleece vendors', () => {
    const { game, storehouse, weaver } = clothTown();
    expect(FLEECE_KEPT_FOR_VENDORS).toBe(BUYER_LOAD);
    storehouse.fleece = FLEECE_KEPT_FOR_VENDORS;
    runTicks(game, 10);
    expect(game.carriers).toEqual([]);
    storehouse.fleece = FLEECE_KEPT_FOR_VENDORS + 200;
    tick(game);
    untilCarriersGone(game);
    expect(weaver.fleece).toBe(200);
    expect(storehouse.fleece).toBe(FLEECE_KEPT_FOR_VENDORS);
  });

  it('goes to both from one storehouse', () => {
    const { game, storehouse, weaver, vendor } = market();
    storehouse.fleece = 1600;
    tick(game);
    expect(game.carriers.map((c) => c.kind).sort()).toEqual(['fleeceBuyer', 'weaverBuyer']);
    untilCarriersGone(game);
    expect(vendor.fleece).toBe(BUYER_LOAD);
    expect(weaver.fleece).toBe(WEAVER_FLEECE_CAPACITY);
    expect(storehouse.fleece).toBe(1600 - BUYER_LOAD - WEAVER_FLEECE_CAPACITY);
  });

  it("sends the weaver's buyer home empty when the spare fleece is gone before he arrives", () => {
    const { game, storehouse, weaver } = clothTown();
    storehouse.fleece = FLEECE_KEPT_FOR_VENDORS + UNITS_PER_LOAD;
    tick(game);
    expect(game.carriers.map((c) => c.kind)).toEqual(['weaverBuyer']);
    storehouse.fleece = FLEECE_KEPT_FOR_VENDORS;
    untilCarriersGone(game);
    expect(weaver.fleece).toBe(0);
    expect(storehouse.fleece).toBe(FLEECE_KEPT_FOR_VENDORS);
  });

  it('takes nothing when the storehouse holds less than the kept fleece by the time he arrives', () => {
    const { game, storehouse, weaver } = clothTown();
    storehouse.fleece = FLEECE_KEPT_FOR_VENDORS + UNITS_PER_LOAD;
    tick(game);
    storehouse.fleece = 200;
    untilCarriersGone(game);
    expect(weaver.fleece).toBe(0);
    expect(storehouse.fleece).toBe(200);
  });

  it('goes to the stall first while fleece is scarce', () => {
    const { game, storehouse, weaver, vendor } = market();
    storehouse.fleece = 200;
    tick(game);
    expect(game.carriers.map((c) => c.kind)).toEqual(['fleeceBuyer']);
    untilCarriersGone(game);
    expect(vendor.fleece).toBe(200);
    expect(weaver.fleece).toBe(0);
  });

  it('keeps the stall stocked while a weaver turns sheared fleece into stored cloth', () => {
    const { game, storehouse, vendor } = market();
    setMeadow(game, 2, 0, 12, 10);
    placeBuilding(game, 'cardingShed', 2, 13);
    placeBuilding(game, 'maintenanceOffice', 24, 13);
    for (const [x, y] of [[3, 3], [6, 3], [9, 3], [12, 3], [3, 7], [6, 7], [9, 7], [12, 7]]) placeSheep(game, { x, y });
    const house = game.buildings[0];
    let stallStocked = false;
    for (let i = 0; i < 3 * TICKS_PER_YEAR && storehouse.cloth === 0; i++) {
      house.fireRisk = 0;
      house.diseaseRisk = 0;
      tick(game);
      if (vendor.fleece > 0) stallStocked = true;
    }
    expect(stallStocked).toBe(true);
    expect(storehouse.cloth).toBeGreaterThan(0);
  });
});

describe('a cloth vendor', () => {
  function market(): { game: GameState; storehouse: Building; vendor: Building } {
    const { game, storehouse } = clothTown();
    placeBuilding(game, 'agora', 0, 16);
    placeBuilding(game, 'clothVendor', 0, 18);
    return { game, storehouse, vendor: game.buildings[game.buildings.length - 1] };
  }

  it('takes a free spot on an agora for 10 dr', () => {
    const { game } = clothTown();
    placeBuilding(game, 'agora', 0, 16);
    const before = game.treasury;
    expect(placeBuilding(game, 'clothVendor', 0, 20)).toEqual({ ok: true });
    expect(game.treasury).toBe(before - 10);
    expect(BUILDING_SPECS.clothVendor).toMatchObject({ width: 2, height: 2, workers: 4 });
    expect(placeBuilding(game, 'clothVendor', 0, 20)).toEqual({ ok: false, reason: 'A vendor goes on a free spot of an agora' });
  });

  it('sends a buyer to fetch 4 loads of cloth from the storehouse', () => {
    const { game, storehouse, vendor } = market();
    storehouse.cloth = 1000;
    tick(game);
    expect(game.carriers.find((c) => c.kind === 'clothBuyer')).toMatchObject({ homeId: vendor.id, destinationId: storehouse.id, cloth: 0 });
    for (let i = 0; i < 300 && vendor.cloth === 0; i++) tick(game);
    expect(vendor.cloth).toBe(BUYER_LOAD);
    expect(storehouse.cloth).toBe(1000 - BUYER_LOAD);
  });

  it('stops buying once the stall holds 8 loads', () => {
    const { game, storehouse, vendor } = market();
    storehouse.cloth = 1000;
    vendor.cloth = VENDOR_CAPACITY;
    runTicks(game, 10);
    expect(game.carriers.filter((c) => c.kind === 'clothBuyer')).toEqual([]);
  });

  it('sends out a peddler, who gives no cloth to ordinary houses', () => {
    const { game, vendor } = market();
    placeHouse(game, 4, 13);
    const townhouse = game.buildings[game.buildings.length - 1];
    Object.assign(townhouse, { level: 'townhouse', residents: 60 });
    vendor.cloth = 400;
    for (let i = 0; i < 200 && !game.roamers.some((r) => r.kind === 'peddler'); i++) tick(game);
    runTicks(game, 100);
    expect(game.roamers.map((r) => r.kind)).toContain('peddler');
    expect(townhouse.cloth).toBe(0);
    expect(vendor.cloth).toBe(400);
  });
});

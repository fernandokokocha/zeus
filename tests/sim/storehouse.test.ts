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
    demolish(game, { x: 1, y: 20 }, { x: 1, y: 20 });
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

describe("an olive press's cart pusher", () => {
  function oilWorks(): { game: GameState; shed: Building; storehouse: Building; press: Building } {
    const { game, shed, storehouse } = woolTown();
    placeBuilding(game, 'olivePress', 20, 13);
    return { game, shed, storehouse, press: game.buildings[3] };
  }

  it('takes the oil to the nearest storehouse', () => {
    const { game, storehouse, press } = oilWorks();
    press.oil = 200;
    tick(game);
    expect(game.carriers[0]).toMatchObject({ kind: 'oilCart', homeId: press.id, destinationId: storehouse.id, oil: 200 });
    runTicks(game, ticksToWalk(12));
    expect(storehouse.oil).toBe(200);
  });

  it('shares the 8 slots with fleece, a slot to a good', () => {
    const { storehouse } = oilWorks();
    storehouse.fleece = 500;
    storehouse.oil = 100;
    expect(slotsUsed(storehouse)).toBe(3);
  });

  it('waits while every slot holds another good', () => {
    const { game, storehouse, press } = oilWorks();
    storehouse.fleece = STOREHOUSE_CAPACITY - 300;
    press.oil = 100;
    runTicks(game, 10);
    expect(game.carriers).toEqual([]);
    storehouse.fleece -= 100;
    tick(game);
    expect(game.carriers[0].oil).toBe(100);
  });

  it('fills the free slot only once, counting carts already on the way', () => {
    const { game, shed, storehouse, press } = oilWorks();
    storehouse.fleece = STOREHOUSE_CAPACITY - SLOT_SIZE;
    shed.fleece = 100;
    press.oil = 100;
    tick(game);
    expect(game.carriers.map((c) => c.kind)).toEqual(['fleeceCart']);
  });
});

describe('an oil vendor', () => {
  it('sends a buyer to fetch 4 loads of oil from the storehouse', () => {
    const { game, storehouse } = woolTown();
    placeBuilding(game, 'agora', 0, 16);
    placeBuilding(game, 'oilVendor', 0, 20);
    const vendor = game.buildings[game.buildings.length - 1];
    storehouse.oil = 1000;
    tick(game);
    expect(game.carriers[0]).toMatchObject({ kind: 'oilBuyer', homeId: vendor.id, destinationId: storehouse.id, oil: 0 });
    for (let i = 0; i < 300 && vendor.oil === 0; i++) tick(game);
    expect(vendor.oil).toBe(BUYER_LOAD);
    expect(storehouse.oil).toBe(1000 - BUYER_LOAD);
  });
});

describe('olives in the storehouse', () => {
  function oliveWorks(): { game: GameState; storehouse: Building; lodge: Building } {
    const { game, storehouse } = woolTown();
    placeBuilding(game, 'growersLodge', 20, 13);
    return { game, storehouse, lodge: game.buildings[3] };
  }

  function addPress(game: GameState): Building {
    placeBuilding(game, 'olivePress', 25, 13);
    return game.buildings[game.buildings.length - 1];
  }

  it('go to the storehouse when no press has room', () => {
    const { game, storehouse, lodge } = oliveWorks();
    lodge.olives = 400;
    tick(game);
    expect(game.carriers[0]).toMatchObject({ kind: 'oliveCart', destinationId: storehouse.id, olives: 400 });
    runTicks(game, ticksToWalk(12));
    expect(storehouse.olives).toBe(400);
  });

  it('go to a press with room before a nearer storehouse', () => {
    const { game, lodge } = oliveWorks();
    const press = addPress(game);
    lodge.olives = 400;
    tick(game);
    expect(game.carriers[0]).toMatchObject({ kind: 'oliveCart', destinationId: press.id });
  });

  it('share the 8 slots with fleece and oil', () => {
    const { storehouse } = oliveWorks();
    Object.assign(storehouse, { fleece: 100, olives: 500, oil: 100 });
    expect(slotsUsed(storehouse)).toBe(4);
  });

  it('are fetched by a press with room', () => {
    const { game, storehouse } = oliveWorks();
    const press = addPress(game);
    storehouse.olives = 1000;
    press.olives = 100;
    tick(game);
    const buyer = game.carriers.find((c) => c.kind === 'oliveBuyer');
    expect(buyer).toMatchObject({ homeId: press.id, destinationId: storehouse.id, olives: 0 });
    for (let i = 0; i < 600 && press.olives < 400; i++) tick(game);
    expect(press.olives).toBe(400);
    expect(storehouse.olives).toBe(700);
  });

  it('are not fetched while the press is full or a cart brings its olives', () => {
    const { game, storehouse, lodge } = oliveWorks();
    const press = addPress(game);
    storehouse.olives = 1000;
    press.olives = 400;
    runTicks(game, 10);
    expect(game.carriers.filter((c) => c.kind === 'oliveBuyer')).toEqual([]);
    press.olives = 0;
    lodge.olives = 400;
    tick(game);
    expect(game.carriers.map((c) => c.kind)).toEqual(['oliveCart']);
  });

  it('let the press send its oil cart and its buyer at once', () => {
    const { game, storehouse } = oliveWorks();
    const press = addPress(game);
    storehouse.olives = 1000;
    press.oil = 400;
    tick(game);
    expect(game.carriers.map((c) => c.kind).sort()).toEqual(['oilCart', 'oliveBuyer']);
  });
});

describe('materials in the storehouse', () => {
  function works(): { game: GameState; storehouse: Building; mill: Building; quarry: Building; foundry: Building } {
    const { game, storehouse } = woolTown(200);
    placeBuilding(game, 'timberMill', 16, 13);
    placeBuilding(game, 'masonryShop', 20, 13);
    placeBuilding(game, 'foundry', 24, 13);
    const [, , , mill, quarry, foundry] = game.buildings;
    return { game, storehouse, mill, quarry, foundry };
  }

  function addStudio(game: GameState): Building {
    placeBuilding(game, 'sculptureStudio', 27, 13);
    return game.buildings[game.buildings.length - 1];
  }

  it('arrive by cart from the mill, the masonry shop and the foundry', () => {
    const { game, storehouse, mill, quarry, foundry } = works();
    Object.assign(mill, { wood: 400 });
    Object.assign(quarry, { marble: 300 });
    Object.assign(foundry, { bronze: 200 });
    tick(game);
    expect(game.carriers.map((c) => [c.kind, c.destinationId])).toEqual([
      ['woodCart', storehouse.id],
      ['marbleCart', storehouse.id],
      ['bronzeCart', storehouse.id],
    ]);
    runTicks(game, ticksToWalk(20));
    expect([storehouse.wood, storehouse.marble, storehouse.bronze]).toEqual([400, 300, 200]);
  });

  it('share the 8 slots with every other good', () => {
    const { storehouse } = works();
    Object.assign(storehouse, { fleece: 100, oil: 100, wood: 500, marble: 100, bronze: 100, sculptures: 100 });
    expect(slotsUsed(storehouse)).toBe(7);
  });

  it('send bronze to a studio with room before a nearer storehouse', () => {
    const { game, foundry } = works();
    const studio = addStudio(game);
    foundry.bronze = 400;
    tick(game);
    expect(game.carriers[0]).toMatchObject({ kind: 'bronzeCart', destinationId: studio.id });
  });

  it("send a studio's buyer for bronze from the storehouse", () => {
    const { game, storehouse } = works();
    const studio = addStudio(game);
    storehouse.bronze = 1000;
    tick(game);
    expect(game.carriers.find((c) => c.kind === 'bronzeBuyer')).toMatchObject({ homeId: studio.id, destinationId: storehouse.id });
    for (let i = 0; i < 900 && studio.bronze < 400; i++) tick(game);
    expect(studio.bronze).toBe(400);
    expect(storehouse.bronze).toBe(600);
  });

  it("take a studio's sculptures to the storehouse", () => {
    const { game, storehouse } = works();
    const studio = addStudio(game);
    studio.sculptures = 100;
    tick(game);
    expect(game.carriers[0]).toMatchObject({ kind: 'sculptureCart', destinationId: storehouse.id, sculptures: 100 });
    for (let i = 0; i < 900 && storehouse.sculptures === 0; i++) tick(game);
    expect(storehouse.sculptures).toBe(100);
  });
});

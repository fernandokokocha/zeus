import { describe, expect, it } from 'vitest';
import { TICKS_PER_MONTH } from '../../src/sim/clock';
import { demolish } from '../../src/sim/commands';
import { setExportSlot, slotHoldings } from '../../src/sim/exports';
import { yardOf } from '../../src/sim/guild';
import { setImportSlot, tickImports } from '../../src/sim/imports';
import { describeTile, type TradeYardView } from '../../src/sim/inspect';
import type { ForeignCaravan, GameState, Good } from '../../src/sim/state';
import { PARTNER_CARAVANS, roundTripMonths, worldReport } from '../../src/sim/trade';
import { emptyCity, placedGuild, runTicks, tradingTown, withStore, type Town } from './helpers';

const STOREHOUSE = { x: 11, y: 8 };
const GRANARY = { x: 11, y: 11 };
const WALK_LIMIT = 2 * TICKS_PER_MONTH;
const HALF_TRIP = (roundTripMonths('thebes') * TICKS_PER_MONTH) / 2;
const SIX_WOOD = 6 * 22;

function importing(town: Town, slot: number, good: Good, loads: number): void {
  const set = setImportSlot(town.game, town.yard.id, slot, good, loads);
  if (!set.ok) throw new Error(set.reason);
}

function advance(game: GameState, ticks: number): void {
  for (let i = 0; i < ticks; i++) {
    game.tick++;
    tickImports(game);
  }
}

function advanceUntil(game: GameState, done: () => boolean): void {
  for (let i = 0; i < WALK_LIMIT && !done(); i++) advance(game, 1);
  if (!done()) throw new Error('Never happened');
}

function onlyCaravan(game: GameState): ForeignCaravan {
  expect(game.foreignCaravans).toHaveLength(1);
  return game.foreignCaravans[0];
}

function caravanLines(game: GameState, caravan: ForeignCaravan): string[] {
  const at = caravan.path[caravan.step];
  return describeTile(game, at.x, at.y).lines;
}

function arrivedCaravan(town: Town): ForeignCaravan {
  importing(town, 0, 'wood', 6);
  advance(town.game, 1);
  const caravan = onlyCaravan(town.game);
  advance(town.game, HALF_TRIP);
  expect(caravan.trip).toBe('in');
  return caravan;
}

function yardView(town: Town): TradeYardView {
  const view = describeTile(town.game, town.yard.x, town.yard.y).tradeYard;
  if (view === undefined) throw new Error('No slots');
  return view;
}

function thebes(game: GameState) {
  const view = worldReport(game).find((v) => v.partner === 'thebes');
  if (view === undefined) throw new Error('No Thebes');
  return view;
}

describe('an import slot', () => {
  it('takes a good the partner sells and an amount up to a caravan load', () => {
    const town = tradingTown('thebes');
    importing(town, 1, 'wood', 4);
    importing(town, 2, 'food', 8);
    expect(town.yard.tradeSlots).toEqual([null, { trade: 'import', good: 'wood', loads: 4 }, { trade: 'import', good: 'food', loads: 8 }, null]);
  });

  it("refuses a good the partner doesn't sell", () => {
    const town = tradingTown('thebes');
    expect(setImportSlot(town.game, town.yard.id, 0, 'fleece', 6)).toEqual({ ok: false, reason: "Thebes doesn't sell fleece" });
  });

  it('waits for a route', () => {
    const { game, guild } = placedGuild();
    expect(setImportSlot(game, yardOf(game, guild).id, 0, 'wood', 6)).toEqual({ ok: false, reason: 'Open a trade route first' });
  });

  it('takes no amount beyond a caravan load, and at least one load', () => {
    const town = tradingTown('thebes');
    expect(() => setImportSlot(town.game, town.yard.id, 0, 'wood', 7)).toThrow();
    expect(() => setImportSlot(town.game, town.yard.id, 0, 'wood', 0)).toThrow();
  });

  it('holds up to its amount from the yard', () => {
    const town = tradingTown('thebes');
    importing(town, 1, 'wood', 4);
    town.yard.wood = 500;
    expect(slotHoldings(town.yard)[1]).toEqual({ good: 'wood', units: 400, capacity: 400 });
  });

  it('can be switched to export and back off', () => {
    const town = tradingTown('thebes');
    importing(town, 0, 'wood', 4);
    setExportSlot(town.game, town.yard.id, 0, 'fleece');
    expect(town.yard.tradeSlots[0]).toEqual({ trade: 'export', good: 'fleece' });
    setExportSlot(town.game, town.yard.id, 0, null);
    expect(town.yard.tradeSlots[0]).toBeNull();
  });
});

describe("the yard's cart pushers", () => {
  it('store imported goods in the storehouses', () => {
    const town = tradingTown('thebes');
    const store = withStore(town, 'storehouse', STOREHOUSE);
    importing(town, 0, 'wood', 4);
    town.yard.wood = 400;
    runTicks(town.game, TICKS_PER_MONTH);
    expect(town.yard.wood).toBe(0);
    expect(store.wood).toBe(400);
  });

  it('store imported food in the granaries', () => {
    const town = tradingTown('thebes');
    const granary = withStore(town, 'granary', GRANARY);
    importing(town, 0, 'food', 8);
    town.yard.food = 800;
    runTicks(town.game, TICKS_PER_MONTH);
    expect(town.yard.food).toBe(0);
    expect(granary.food).toBe(800);
  });

  it('keep what the export slots hold', () => {
    const town = tradingTown('thebes');
    const store = withStore(town, 'storehouse', STOREHOUSE);
    setExportSlot(town.game, town.yard.id, 0, 'fleece');
    town.yard.fleece = 300;
    runTicks(town.game, TICKS_PER_MONTH);
    expect(town.yard.fleece).toBe(300);
    expect(store.fleece).toBe(0);
  });

  it("carry back what a switched-off export slot held", () => {
    const town = tradingTown('thebes');
    const store = withStore(town, 'storehouse', STOREHOUSE);
    setExportSlot(town.game, town.yard.id, 0, 'fleece');
    town.yard.fleece = 300;
    setExportSlot(town.game, town.yard.id, 0, null);
    runTicks(town.game, TICKS_PER_MONTH);
    expect(town.yard.fleece).toBe(0);
    expect(store.fleece).toBe(300);
  });

  it('move nothing without workers', () => {
    const town = tradingTown('thebes');
    const store = withStore(town, 'storehouse', STOREHOUSE);
    emptyCity(town.game);
    importing(town, 0, 'wood', 4);
    town.yard.wood = 400;
    runTicks(town.game, TICKS_PER_MONTH);
    expect(store.wood).toBe(0);
  });
});

describe('a foreign caravan setting off', () => {
  it('sets off from the partner for an empty import slot', () => {
    const town = tradingTown('thebes');
    const treasury = town.game.treasury;
    importing(town, 0, 'wood', 6);
    advance(town.game, 1);
    expect(onlyCaravan(town.game)).toMatchObject({ partner: 'thebes', yardId: town.yard.id, slot: 0, good: 'wood', loads: 6, cost: SIX_WOOD, trip: 'coming' });
    expect(town.game.treasury).toBe(treasury);
    expect(thebes(town.game).caravansHome).toBe(PARTNER_CARAVANS - 1);
  });

  it('brings the amount the slot asks for', () => {
    const town = tradingTown('thebes');
    importing(town, 0, 'wood', 2);
    advance(town.game, 1);
    expect(onlyCaravan(town.game)).toMatchObject({ loads: 2, cost: 44 });
  });

  it('is the only one on its way to a slot', () => {
    const town = tradingTown('thebes');
    importing(town, 0, 'wood', 6);
    advance(town.game, 10);
    onlyCaravan(town.game);
  });

  it('waits while the slot holds goods', () => {
    const town = tradingTown('thebes');
    importing(town, 0, 'wood', 6);
    town.yard.wood = 100;
    advance(town.game, 1);
    expect(town.game.foreignCaravans).toEqual([]);
  });

  it('needs one of the partner caravans at home', () => {
    const town = tradingTown('thebes');
    for (const slot of [0, 1, 2]) importing(town, slot, 'wood', 6);
    advance(town.game, 3);
    expect(town.game.foreignCaravans.map((c) => c.slot)).toEqual([0, 1]);
    expect(thebes(town.game).caravansHome).toBe(0);
  });

  it('needs a treasury that can pay for it', () => {
    const town = tradingTown('thebes');
    town.game.treasury = SIX_WOOD - 1;
    importing(town, 0, 'wood', 6);
    advance(town.game, 1);
    expect(town.game.foreignCaravans).toEqual([]);
    expect(describeTile(town.game, town.yard.x, town.yard.y).lines).toContain("Waiting: the treasury can't pay for 6 wood (132 dr)");
  });
});

describe("a foreign caravan's trip", () => {
  it('enters at the west edge after half the round trip', () => {
    const town = tradingTown('thebes');
    importing(town, 0, 'wood', 6);
    advance(town.game, 1);
    const caravan = onlyCaravan(town.game);
    advance(town.game, HALF_TRIP - 1);
    expect(caravan.trip).toBe('coming');
    advance(town.game, 1);
    expect(caravan).toMatchObject({ trip: 'in', path: expect.arrayContaining([town.game.entry]) });
    expect(caravan.path[caravan.step]).toEqual(town.game.entry);
  });

  it('walks to the yard, unloads into the slot and is paid only then', () => {
    const town = tradingTown('thebes');
    const caravan = arrivedCaravan(town);
    const treasury = town.game.treasury;
    advanceUntil(town.game, () => caravan.trip === 'back');
    expect(town.yard.wood).toBe(600);
    expect(town.game.treasury).toBe(treasury - SIX_WOOD);
    expect(town.game.accounts.thisYear.imports).toBe(SIX_WOOD);
  });

  it('is paid even when the treasury ran low meanwhile', () => {
    const town = tradingTown('thebes');
    const caravan = arrivedCaravan(town);
    town.game.treasury = 0;
    advanceUntil(town.game, () => caravan.trip === 'back');
    expect(town.game.treasury).toBe(-SIX_WOOD);
  });

  it('walks back west and is home after the other half', () => {
    const town = tradingTown('thebes');
    const caravan = arrivedCaravan(town);
    advanceUntil(town.game, () => caravan.trip === 'going');
    expect(caravan.dueAt).toBe(town.game.tick + HALF_TRIP);
    expect(thebes(town.game).caravansHome).toBe(PARTNER_CARAVANS - 1);
    advance(town.game, HALF_TRIP);
    expect(town.game.foreignCaravans).toEqual([]);
    expect(thebes(town.game).caravansHome).toBe(PARTNER_CARAVANS);
  });

  it('lets the next one set off once the slot is empty again', () => {
    const town = tradingTown('thebes');
    const caravan = arrivedCaravan(town);
    advanceUntil(town.game, () => caravan.trip === 'back');
    advance(town.game, 1);
    expect(town.game.foreignCaravans).toHaveLength(1);
    town.yard.wood = 0;
    advance(town.game, 1);
    expect(town.game.foreignCaravans.map((c) => c.trip)).toEqual(['back', 'coming']);
  });

  it('delivers its order though the slot was switched off meanwhile', () => {
    const town = tradingTown('thebes');
    const caravan = arrivedCaravan(town);
    setExportSlot(town.game, town.yard.id, 0, null);
    advanceUntil(town.game, () => caravan.trip === 'back');
    expect(town.yard.wood).toBe(600);
    expect(town.game.accounts.thisYear.imports).toBe(SIX_WOOD);
  });

  it('turns back off the map, charging nothing, when the yard is gone', () => {
    const town = tradingTown('thebes');
    importing(town, 0, 'wood', 6);
    advance(town.game, 1);
    const caravan = onlyCaravan(town.game);
    const setOff = town.game.tick;
    advance(town.game, 100);
    demolish(town.game, town.guild, town.guild);
    advance(town.game, 1);
    const travelled = town.game.tick - setOff;
    expect(caravan).toMatchObject({ trip: 'going', dueAt: town.game.tick + travelled });
    advance(town.game, travelled);
    expect(town.game.foreignCaravans).toEqual([]);
    expect(town.game.accounts.thisYear.imports).toBe(0);
  });

  it('walks back west, charging nothing, when the yard goes while it walks in', () => {
    const town = tradingTown('thebes');
    const caravan = arrivedCaravan(town);
    advanceUntil(town.game, () => caravan.step > 0);
    demolish(town.game, town.guild, town.guild);
    advance(town.game, 1);
    expect(caravan.trip).toBe('back');
    advanceUntil(town.game, () => caravan.trip === 'going');
    expect(town.game.accounts.thisYear.imports).toBe(0);
  });
});

describe("the foreign caravan's inspector", () => {
  it('says where it is from, what it brings and what it costs', () => {
    const town = tradingTown('thebes');
    const caravan = arrivedCaravan(town);
    expect(describeTile(town.game, caravan.path[caravan.step].x, caravan.path[caravan.step].y)).toEqual({
      title: 'Trade Caravan',
      meters: [],
      lines: ['From Thebes', 'Bringing 6 loads of wood to the Trade Yard', 'We pay 132 dr when it unloads'],
    });
  });

  it('says it is heading home', () => {
    const town = tradingTown('thebes');
    const caravan = arrivedCaravan(town);
    advanceUntil(town.game, () => caravan.trip === 'back');
    advance(town.game, 1);
    expect(caravanLines(town.game, caravan)).toEqual(['From Thebes', 'Heading home to Thebes']);
  });
});

describe("the yard's inspector", () => {
  it('lists the caravans coming', () => {
    const town = tradingTown('thebes');
    importing(town, 0, 'wood', 6);
    advance(town.game, 1);
    expect(describeTile(town.game, town.yard.x, town.yard.y).lines).toContain('Caravan from Thebes with 6 loads of wood: here in about 2 months');
  });

  it('offers what the partner buys and sells, and shows import slots', () => {
    const town = tradingTown('thebes');
    importing(town, 2, 'wood', 4);
    town.yard.wood = 100;
    const view = yardView(town);
    expect(view.imports).toEqual([
      { good: 'food', name: 'Food', load: 8 },
      { good: 'wood', name: 'Wood', load: 6 },
    ]);
    expect(view.slots[2]).toEqual({ good: 'wood', loads: 1, capacity: 4 });
  });
});

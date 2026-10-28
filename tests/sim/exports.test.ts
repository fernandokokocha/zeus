import { describe, expect, it } from 'vitest';
import { TICKS_PER_MONTH } from '../../src/sim/clock';
import { demolish, placeBuilding, placeRoad } from '../../src/sim/commands';
import { CARAVAN_MERCHANTS, YARD_SLOTS, setExportSlot, slotHoldings, tickCaravans } from '../../src/sim/exports';
import { yardOf } from '../../src/sim/guild';
import { describeTile } from '../../src/sim/inspect';
import type { Building, Caravan, GameState } from '../../src/sim/state';
import { openRoute, roundTripMonths, type Partner } from '../../src/sim/trade';
import { placedGuild, runTicks, supplyGuild } from './helpers';

const STOREHOUSE = { x: 11, y: 8 };
const GRANARY = { x: 11, y: 11 };
const PALACE_ROAD = { from: { x: 10, y: 6 }, to: { x: 10, y: 15 } };
const WEST_EDGE = { x: 0, y: 16 };
const WALK_LIMIT = 2 * TICKS_PER_MONTH;

interface Town {
  game: GameState;
  guild: Building;
  yard: Building;
}

function tradingTown(partner: Partner = 'thebes'): Town {
  const { game, guild } = placedGuild();
  placeRoad(game, PALACE_ROAD.from, PALACE_ROAD.to);
  const opened = openRoute(game, guild.id, partner);
  if (!opened.ok) throw new Error(opened.reason);
  return { game, guild, yard: yardOf(game, guild) };
}

function withStore(town: Town, type: 'storehouse' | 'granary', at: { x: number; y: number }): Building {
  const placed = placeBuilding(town.game, type, at.x, at.y);
  if (!placed.ok) throw new Error(placed.reason);
  const store = town.game.buildings[town.game.buildings.length - 1];
  for (const house of town.game.buildings.filter((b) => b.type === 'house')) house.residents = 200;
  supplyGuild(town.guild);
  return store;
}

function exporting(town: Town, slot: number, good: Parameters<typeof setExportSlot>[3]): void {
  const set = setExportSlot(town.game, town.yard.id, slot, good);
  if (!set.ok) throw new Error(set.reason);
}

function advance(game: GameState, ticks: number): void {
  for (let i = 0; i < ticks; i++) {
    game.tick++;
    tickCaravans(game);
  }
}

function advanceUntil(game: GameState, done: () => boolean): void {
  for (let i = 0; i < WALK_LIMIT && !done(); i++) advance(game, 1);
  if (!done()) throw new Error('Never happened');
}

function onlyCaravan(game: GameState): Caravan {
  expect(game.caravans).toHaveLength(1);
  return game.caravans[0];
}

function fullFleeceSlot(town: Town): void {
  exporting(town, 0, 'fleece');
  town.yard.fleece = 600;
}

function caravanLines(game: GameState, caravan: Caravan): string[] {
  const at = caravan.path[caravan.step];
  return describeTile(game, at.x, at.y).lines;
}

describe("the yard's slots", () => {
  it('are four, all off', () => {
    const { yard } = tradingTown();
    expect(YARD_SLOTS).toBe(4);
    expect(yard.tradeSlots).toEqual([null, null, null, null]);
  });

  it('take a good the partner buys, in any mix', () => {
    const fleece = { trade: 'export', good: 'fleece' };
    const olives = { trade: 'export', good: 'olives' };
    const town = tradingTown('thebes');
    exporting(town, 0, 'fleece');
    exporting(town, 1, 'olives');
    exporting(town, 3, 'fleece');
    expect(town.yard.tradeSlots).toEqual([fleece, olives, null, fleece]);
    exporting(town, 0, null);
    expect(town.yard.tradeSlots).toEqual([null, olives, null, fleece]);
  });

  it("refuse a good the partner doesn't buy", () => {
    const town = tradingTown('thebes');
    expect(setExportSlot(town.game, town.yard.id, 0, 'wood')).toEqual({ ok: false, reason: "Thebes doesn't buy wood" });
  });

  it('wait for a route', () => {
    const { game, guild } = placedGuild();
    expect(setExportSlot(game, yardOf(game, guild).id, 0, 'fleece')).toEqual({ ok: false, reason: 'Open a trade route first' });
  });

  it('hold the pool of a good in slot order, a caravan load each', () => {
    const town = tradingTown('thebes');
    exporting(town, 0, 'fleece');
    exporting(town, 2, 'fleece');
    town.yard.fleece = 900;
    expect(slotHoldings(town.yard)).toEqual([
      { good: 'fleece', units: 600, capacity: 600 },
      { good: null, units: 0, capacity: 0 },
      { good: 'fleece', units: 300, capacity: 600 },
      { good: null, units: 0, capacity: 0 },
    ]);
  });
});

describe("the yard's cart pushers", () => {
  it('fill an export slot from the storehouses up to a caravan load', () => {
    const town = tradingTown('thebes');
    const store = withStore(town, 'storehouse', STOREHOUSE);
    store.fleece = 600;
    exporting(town, 0, 'fleece');
    runTicks(town.game, TICKS_PER_MONTH);
    expect(town.yard.workers).toBe(8);
    expect(store.fleece).toBe(0);
    expect(onlyCaravan(town.game)).toMatchObject({ good: 'fleece', loads: 6 });
  });

  it('fetch food from the granaries', () => {
    const town = tradingTown('argos');
    const granary = withStore(town, 'granary', GRANARY);
    granary.food = 800;
    exporting(town, 0, 'food');
    runTicks(town.game, TICKS_PER_MONTH);
    expect(granary.food).toBe(0);
    expect(onlyCaravan(town.game)).toMatchObject({ good: 'food', loads: 8 });
  });

  it('move nothing without workers', () => {
    const town = tradingTown('thebes');
    const store = withStore(town, 'storehouse', STOREHOUSE);
    store.fleece = 1600;
    for (const house of town.game.buildings.filter((b) => b.type === 'house')) house.residents = 0;
    exporting(town, 0, 'fleece');
    runTicks(town.game, TICKS_PER_MONTH);
    expect(town.yard.fleece).toBe(0);
  });

  it('bring nothing home for a slot switched off on the way', () => {
    const town = tradingTown('thebes');
    const store = withStore(town, 'storehouse', STOREHOUSE);
    store.fleece = 1600;
    exporting(town, 0, 'fleece');
    runTicks(town.game, 2);
    expect(town.game.carriers.map((c) => c.kind)).toEqual(['fleeceExport']);
    exporting(town, 0, null);
    runTicks(town.game, TICKS_PER_MONTH);
    expect(town.yard.fleece + store.fleece).toBe(1600);
    expect(town.yard.fleece).toBe(0);
  });
});

describe('a caravan setting off', () => {
  it('forms when a slot is full and five merchants are home, taking one caravan load', () => {
    const town = tradingTown('thebes');
    fullFleeceSlot(town);
    town.yard.fleece = 700;
    advance(town.game, 1);
    expect(onlyCaravan(town.game)).toMatchObject({ partner: 'thebes', good: 'fleece', loads: 6, drachmas: 120, trip: 'out', guildId: town.guild.id });
    expect(town.yard.fleece).toBe(100);
  });

  it('waits for a full slot', () => {
    const town = tradingTown('thebes');
    exporting(town, 0, 'fleece');
    town.yard.fleece = 500;
    advance(town.game, 1);
    expect(town.game.caravans).toEqual([]);
  });

  it('needs five merchants home, so twenty send four at most', () => {
    const town = tradingTown('thebes');
    for (let slot = 0; slot < YARD_SLOTS; slot++) exporting(town, slot, 'fleece');
    town.yard.fleece = 6000;
    advance(town.game, 10);
    expect(town.guild.residents).toBe(4 * CARAVAN_MERCHANTS);
    expect(town.game.caravans).toHaveLength(4);
    expect(town.yard.fleece).toBe(3600);
  });

  it('counts only the merchants the guild has', () => {
    const town = tradingTown('thebes');
    fullFleeceSlot(town);
    town.guild.residents = CARAVAN_MERCHANTS - 1;
    advance(town.game, 1);
    expect(town.game.caravans).toEqual([]);
  });
});

describe("a caravan's trip", () => {
  it('walks the Main Road to the west edge and leaves the map for the round trip', () => {
    const town = tradingTown('thebes');
    fullFleeceSlot(town);
    advance(town.game, 1);
    const caravan = onlyCaravan(town.game);
    expect(caravanLines(town.game, caravan)).toContain('Heading out to Thebes');
    advanceUntil(town.game, () => caravan.trip === 'away');
    expect(caravan.backAt).toBe(town.game.tick + roundTripMonths('thebes') * TICKS_PER_MONTH);
    expect(describeTile(town.game, WEST_EDGE.x, WEST_EDGE.y).title).toBe('Main Road');
  });

  it('comes back, pays at the Palace and its merchants walk home', () => {
    const town = tradingTown('thebes');
    fullFleeceSlot(town);
    advance(town.game, 1);
    const caravan = onlyCaravan(town.game);
    advanceUntil(town.game, () => caravan.trip === 'away');
    const treasury = town.game.treasury;
    advance(town.game, caravan.backAt - town.game.tick);
    expect(caravan.trip).toBe('home');
    expect(caravanLines(town.game, caravan)).toContain('Taking 120 dr to the Palace');
    advanceUntil(town.game, () => caravan.trip === 'merchants');
    expect(town.game.treasury).toBe(treasury + 120);
    expect(town.game.accounts.thisYear.trade).toBe(120);
    expect(town.game.notices.at(-1)).toMatchObject({ text: 'Caravan back from Thebes: +120 dr', at: { x: 1, y: 6 } });
    advanceUntil(town.game, () => town.game.caravans.length === 0);
  });

  it('waits at the west edge while no road reaches the Palace, then carries on', () => {
    const town = tradingTown('thebes');
    fullFleeceSlot(town);
    advance(town.game, 1);
    const caravan = onlyCaravan(town.game);
    advanceUntil(town.game, () => caravan.trip === 'away');
    demolish(town.game, { x: 10, y: 13 }, { x: 10, y: 13 });
    advance(town.game, caravan.backAt - town.game.tick + 10);
    expect(caravan).toMatchObject({ trip: 'home', waiting: true });
    expect(caravan.path[caravan.step]).toEqual(WEST_EDGE);
    expect(caravanLines(town.game, caravan)).toContain('Waiting: no road to the Palace');
    placeRoad(town.game, { x: 10, y: 13 }, { x: 10, y: 13 });
    advanceUntil(town.game, () => caravan.trip === 'merchants');
    expect(town.game.accounts.thisYear.trade).toBe(120);
  });

  it('still pays once its guild is gone', () => {
    const town = tradingTown('thebes');
    fullFleeceSlot(town);
    advance(town.game, 1);
    const caravan = onlyCaravan(town.game);
    demolish(town.game, town.guild, town.guild);
    advanceUntil(town.game, () => caravan.trip === 'away');
    advance(town.game, caravan.backAt - town.game.tick);
    advanceUntil(town.game, () => town.game.caravans.length === 0);
    expect(town.game.accounts.thisYear.trade).toBe(120);
  });
});

describe("the caravan's inspector", () => {
  it('names its partner, goods, value and where it is', () => {
    const town = tradingTown('thebes');
    fullFleeceSlot(town);
    advance(town.game, 1);
    const caravan = onlyCaravan(town.game);
    const at = caravan.path[caravan.step];
    expect(describeTile(town.game, at.x, at.y)).toEqual({
      title: 'Trade Caravan',
      meters: [],
      lines: ['From the Traders\' Guild at 3, 12', 'Heading out to Thebes', 'Carrying 6 loads of fleece, worth 120 dr'],
    });
  });

  it('says when the merchants are walking home', () => {
    const town = tradingTown('thebes');
    fullFleeceSlot(town);
    advance(town.game, 1);
    const caravan = onlyCaravan(town.game);
    advanceUntil(town.game, () => caravan.trip === 'away');
    advance(town.game, caravan.backAt - town.game.tick);
    advanceUntil(town.game, () => caravan.trip === 'merchants');
    advance(town.game, 1);
    expect(caravanLines(town.game, caravan)).toEqual(["From the Traders' Guild at 3, 12", 'Merchants walking home to the guild']);
  });
});

describe("the yard's inspector", () => {
  it('shows each slot and the caravans off the map', () => {
    const town = tradingTown('thebes');
    fullFleeceSlot(town);
    exporting(town, 1, 'olives');
    town.yard.olives = 300;
    advance(town.game, 1);
    advanceUntil(town.game, () => town.game.caravans[0].trip === 'away');
    advance(town.game, TICKS_PER_MONTH);
    const description = describeTile(town.game, town.yard.x, town.yard.y);
    expect(description.lines).toContain('Caravan to Thebes with 6 loads of fleece: back in about 2 months');
    expect(description.tradeYard).toEqual({
      id: town.yard.id,
      exports: [
        { good: 'fleece', name: 'Fleece' },
        { good: 'olives', name: 'Olives' },
      ],
      imports: [
        { good: 'food', name: 'Food', load: 8 },
        { good: 'wood', name: 'Wood', load: 6 },
      ],
      slots: [
        { good: 'fleece', loads: 0, capacity: 6 },
        { good: 'olives', loads: 3, capacity: 8 },
        { good: null, loads: 0, capacity: 0 },
        { good: null, loads: 0, capacity: 0 },
      ],
    });
  });

  it('has no slots to set before a route opens', () => {
    const { game, guild } = placedGuild();
    const yard = yardOf(game, guild);
    expect(describeTile(game, yard.x, yard.y).tradeYard).toBeUndefined();
  });
});

describe("the guild's inspector", () => {
  it('counts its caravans out', () => {
    const town = tradingTown('thebes');
    supplyGuild(town.guild);
    fullFleeceSlot(town);
    advance(town.game, 1);
    expect(describeTile(town.game, town.guild.x, town.guild.y).lines).toContain('Caravans out 1 of 4');
  });
});

import { describe, expect, it } from 'vitest';
import { TICKS_PER_MONTH, TICKS_PER_YEAR } from '../../src/sim/clock';
import { setExportSlot, tickCaravans } from '../../src/sim/exports';
import { setImportSlot, tickImports } from '../../src/sim/imports';
import type { Caravan, ForeignCaravan, GameState } from '../../src/sim/state';
import { roundTripMonths } from '../../src/sim/trade';
import { emptyTradeYear } from '../../src/sim/trade-books';
import { tradeReport } from '../../src/sim/trade-ledger';
import { closeYear } from '../../src/sim/treasury';
import { tradingTown, type Town } from './helpers';

const WALK_LIMIT = 2 * TICKS_PER_MONTH;
const THEBES_TRIP = roundTripMonths('thebes');
const SIX_FLEECE = { loads: 6, drachmas: 6 * 20 };
const SIX_WOOD = { loads: 6, drachmas: 6 * 22 };
const NOTHING = { loads: 0, drachmas: 0 };

function advance(game: GameState, ticks: number): void {
  for (let i = 0; i < ticks; i++) {
    game.tick++;
    tickCaravans(game);
    tickImports(game);
  }
}

function advanceUntil(game: GameState, done: () => boolean): void {
  for (let i = 0; i < WALK_LIMIT && !done(); i++) advance(game, 1);
  if (!done()) throw new Error('Never happened');
}

function sendingFleece(town: Town): Caravan {
  const set = setExportSlot(town.game, town.yard.id, 0, 'fleece');
  if (!set.ok) throw new Error(set.reason);
  town.yard.fleece = 600;
  advance(town.game, 1);
  return town.game.caravans[0];
}

function orderingWood(town: Town): ForeignCaravan {
  const set = setImportSlot(town.game, town.yard.id, 0, 'wood', 6);
  if (!set.ok) throw new Error(set.reason);
  advance(town.game, 1);
  return town.game.foreignCaravans[0];
}

function soldFleece(town: Town): void {
  const caravan = sendingFleece(town);
  advanceUntil(town.game, () => caravan.trip === 'away');
  advance(town.game, caravan.backAt - town.game.tick);
  advanceUntil(town.game, () => caravan.trip === 'merchants');
}

function boughtWood(town: Town): void {
  const caravan = orderingWood(town);
  advance(town.game, caravan.dueAt - town.game.tick);
  advanceUntil(town.game, () => caravan.trip === 'back');
}

function caravanWhere(town: Town): string[] {
  return tradeReport(town.game).caravans.map((c) => c.where);
}

describe('the trade books', () => {
  it('book an export by good when its money reaches the Palace', () => {
    const town = tradingTown('thebes');
    const caravan = sendingFleece(town);
    advanceUntil(town.game, () => caravan.trip === 'away');
    advance(town.game, caravan.backAt - town.game.tick);
    expect(town.game.tradeBooks.thisYear.exports.fleece).toEqual(NOTHING);
    advanceUntil(town.game, () => caravan.trip === 'merchants');
    expect(town.game.tradeBooks.thisYear.exports.fleece).toEqual(SIX_FLEECE);
  });

  it('book an import by good when it unloads', () => {
    const town = tradingTown('thebes');
    const caravan = orderingWood(town);
    advance(town.game, caravan.dueAt - town.game.tick);
    expect(town.game.tradeBooks.thisYear.imports.wood).toEqual(NOTHING);
    advanceUntil(town.game, () => caravan.trip === 'back');
    expect(town.game.tradeBooks.thisYear.imports.wood).toEqual(SIX_WOOD);
  });

  it('roll over with the year', () => {
    const town = tradingTown('thebes');
    soldFleece(town);
    const year1 = town.game.tradeBooks.thisYear;
    closeYear(town.game);
    expect(town.game.tradeBooks).toEqual({ thisYear: emptyTradeYear(), lastYear: year1 });
  });
});

describe('tradeReport', () => {
  it('lists the routes open', () => {
    const town = tradingTown('thebes');
    expect(tradeReport(town.game).routes).toEqual([{ guild: "Traders' Guild at 3, 12", partner: 'Thebes', roundTripMonths: THEBES_TRIP }]);
  });

  it('follows our caravan through its trip', () => {
    const town = tradingTown('thebes');
    const caravan = sendingFleece(town);
    expect(tradeReport(town.game).caravans).toEqual([
      { partner: 'Thebes', trade: 'Export', goods: '6 loads of fleece', value: 120, where: 'Heading out to Thebes' },
    ]);
    advanceUntil(town.game, () => caravan.trip === 'away');
    expect(caravanWhere(town)).toEqual([`Away: back in about ${THEBES_TRIP} months`]);
    advance(town.game, caravan.backAt - town.game.tick);
    expect(caravanWhere(town)).toEqual(['Taking 120 dr to the Palace']);
    advanceUntil(town.game, () => caravan.trip === 'merchants');
    expect(tradeReport(town.game).caravans).toEqual([
      { partner: 'Thebes', trade: 'Export', goods: null, value: null, where: 'Merchants walking home to the guild' },
    ]);
  });

  it("follows a partner's caravan through its trip", () => {
    const town = tradingTown('thebes');
    const caravan = orderingWood(town);
    expect(tradeReport(town.game).caravans).toEqual([
      { partner: 'Thebes', trade: 'Import', goods: '6 loads of wood', value: 132, where: `Coming: here in about ${Math.ceil(THEBES_TRIP / 2)} months` },
    ]);
    advance(town.game, caravan.dueAt - town.game.tick);
    expect(caravanWhere(town)).toEqual(['Walking to the Trade Yard']);
    advanceUntil(town.game, () => caravan.trip === 'back');
    expect(tradeReport(town.game).caravans).toEqual([
      { partner: 'Thebes', trade: 'Import', goods: null, value: null, where: 'Heading home to Thebes' },
    ]);
    advanceUntil(town.game, () => caravan.trip === 'going');
    expect(caravanWhere(town)).toEqual([`Going home: there in about ${Math.ceil(THEBES_TRIP / 2)} months`]);
  });

  it('has no last year in year 1', () => {
    const town = tradingTown('thebes');
    soldFleece(town);
    const report = tradeReport(town.game);
    expect(report.years).toEqual({ thisYear: 'Year 1, so far', lastYear: null });
    expect(report.exports).toEqual([{ name: 'Fleece', thisYear: SIX_FLEECE, lastYear: null }]);
    expect(report.imports).toEqual([]);
  });

  it('lists the goods traded this year or last', () => {
    const town = tradingTown('thebes');
    soldFleece(town);
    closeYear(town.game);
    town.game.tick += TICKS_PER_YEAR;
    boughtWood(town);
    const report = tradeReport(town.game);
    expect(report.years).toEqual({ thisYear: 'Year 2, so far', lastYear: 'Year 1' });
    expect(report.exports).toEqual([{ name: 'Fleece', thisYear: NOTHING, lastYear: SIX_FLEECE }]);
    expect(report.imports).toEqual([{ name: 'Wood', thisYear: SIX_WOOD, lastYear: NOTHING }]);
  });
});

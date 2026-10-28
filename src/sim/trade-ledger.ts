import { BUILDING_SPECS } from './buildings';
import { GOODS } from './flows';
import { PLACES } from './greece';
import { caravanCargo, drachmas, months } from './inspect';
import { GOOD_TITLES } from './production';
import { buildingById, type Caravan, type CaravanTrip, type ForeignCaravan, type ForeignTrip, type GameState, type Good } from './state';
import { roundTripMonths } from './trade';
import type { Tally, TradeDirection } from './trade-books';
import { yearLabels, type YearLabels } from './treasury';

export interface RouteRow {
  guild: string;
  partner: string;
  roundTripMonths: number;
}

export interface CaravanRow {
  partner: string;
  trade: 'Export' | 'Import';
  goods: string | null;
  value: number | null;
  where: string;
}

export interface GoodRow {
  name: string;
  thisYear: Tally;
  lastYear: Tally | null;
}

export interface TradeReport {
  routes: RouteRow[];
  caravans: CaravanRow[];
  years: YearLabels;
  exports: GoodRow[];
  imports: GoodRow[];
}

function routeRows(state: GameState): RouteRow[] {
  return state.routes.map(({ partner, guildId }) => {
    const guild = buildingById(state, guildId);
    if (guild === undefined) throw new Error(`The route to ${partner} has no guild`);
    return { guild: `${BUILDING_SPECS.tradersGuild.name} at ${guild.x}, ${guild.y}`, partner: PLACES[partner].name, roundTripMonths: roundTripMonths(partner) };
  });
}

function ourCaravanWhere(state: GameState, caravan: Caravan): string {
  const where: Record<CaravanTrip, () => string> = {
    out: () => (caravan.waiting ? 'Waiting: no road west' : `Heading out to ${PLACES[caravan.partner].name}`),
    away: () => `Away: back in about ${months(caravan.backAt - state.tick)}`,
    home: () => (caravan.waiting ? 'Waiting: no road to the Palace' : `Taking ${drachmas(caravan.drachmas)} to the Palace`),
    merchants: () => 'Merchants walking home to the guild',
  };
  return where[caravan.trip]();
}

function ourCaravanRow(state: GameState, caravan: Caravan): CaravanRow {
  const delivered = caravan.trip === 'merchants';
  return {
    partner: PLACES[caravan.partner].name,
    trade: 'Export',
    goods: delivered ? null : caravanCargo(caravan),
    value: delivered ? null : caravan.drachmas,
    where: ourCaravanWhere(state, caravan),
  };
}

function foreignCaravanWhere(state: GameState, caravan: ForeignCaravan): string {
  const where: Record<ForeignTrip, () => string> = {
    coming: () => `Coming: here in about ${months(caravan.dueAt - state.tick)}`,
    in: () => `Walking to the ${BUILDING_SPECS.tradeYard.name}`,
    back: () => `Heading home to ${PLACES[caravan.partner].name}`,
    going: () => `Going home: there in about ${months(caravan.dueAt - state.tick)}`,
  };
  return where[caravan.trip]();
}

function foreignCaravanRow(state: GameState, caravan: ForeignCaravan): CaravanRow {
  const unloaded = caravan.trip === 'back' || caravan.trip === 'going';
  return {
    partner: PLACES[caravan.partner].name,
    trade: 'Import',
    goods: unloaded ? null : caravanCargo(caravan),
    value: unloaded ? null : caravan.cost,
    where: foreignCaravanWhere(state, caravan),
  };
}

function goodRows(state: GameState, direction: TradeDirection, hasLastYear: boolean): GoodRow[] {
  const { thisYear, lastYear } = state.tradeBooks;
  const traded = (tally: Tally) => tally.loads > 0;
  return GOODS.filter((good) => traded(thisYear[direction][good]) || (hasLastYear && traded(lastYear[direction][good]))).map((good) => ({
    name: GOOD_TITLES[good],
    thisYear: thisYear[direction][good],
    lastYear: hasLastYear ? lastYear[direction][good] : null,
  }));
}

export function tradeReport(state: GameState): TradeReport {
  const years = yearLabels(state);
  const hasLastYear = years.lastYear !== null;
  return {
    routes: routeRows(state),
    caravans: [...state.caravans.map((c) => ourCaravanRow(state, c)), ...state.foreignCaravans.map((c) => foreignCaravanRow(state, c))],
    years,
    exports: goodRows(state, 'exports', hasLastYear),
    imports: goodRows(state, 'imports', hasLastYear),
  };
}

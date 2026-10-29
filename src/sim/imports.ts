import { TICKS_PER_MONTH } from './clock';
import { adjacentRoadTiles, type Result } from './commands';
import { NO_ROUTE, slotHoldings, tradeYardById } from './exports';
import { UNITS_PER_LOAD } from './food';
import { PLACES } from './greece';
import { guildOfYard } from './guild';
import { findRoadPath } from './pathfinding';
import type { Point } from './point';
import { buildingById, type Building, type ForeignCaravan, type GameState, type TradeGood } from './state';
import { PARTNERS, TRADE_GOODS, partnerCaravansHome, roundTripMonths, routeOf, type Partner } from './trade';
import { bookTrade } from './trade-books';
import { spend } from './treasury';
import { walkPath } from './walking';

export interface ImportOrder {
  slot: number;
  good: TradeGood;
  loads: number;
  cost: number;
}

export function setImportSlot(state: GameState, yardId: number, slot: number, good: TradeGood, loads: number): Result {
  const yard = tradeYardById(state, yardId);
  const route = routeOf(state, guildOfYard(state, yard));
  if (route === null) return { ok: false, reason: NO_ROUTE };
  if (!PARTNERS[route.partner].sells.includes(good)) return { ok: false, reason: `${PLACES[route.partner].name} doesn't sell ${good}` };
  const { caravanLoad } = TRADE_GOODS[good];
  if (!Number.isInteger(loads) || loads < 1 || loads > caravanLoad) {
    throw new Error(`An import of ${good} is 1 to ${caravanLoad} loads, not ${loads}`);
  }
  yard.tradeSlots[slot] = { trade: 'import', good, loads };
  state.version++;
  return { ok: true };
}

function importCost(good: TradeGood, loads: number): number {
  const { wePay } = TRADE_GOODS[good];
  if (wePay === null) throw new Error(`${good} can't be bought`);
  return loads * wePay;
}

function halfTrip(partner: Partner): number {
  return (roundTripMonths(partner) * TICKS_PER_MONTH) / 2;
}

function isOnItsWay(caravan: ForeignCaravan): boolean {
  return caravan.trip === 'coming' || caravan.trip === 'in';
}

export function caravansComing(state: GameState, yard: Building): ForeignCaravan[] {
  return state.foreignCaravans.filter((c) => c.yardId === yard.id && c.trip === 'coming');
}

export function pendingOrders(state: GameState, yard: Building): ImportOrder[] {
  const holdings = slotHoldings(yard);
  const served = new Set(state.foreignCaravans.filter((c) => c.yardId === yard.id && isOnItsWay(c)).map((c) => c.slot));
  return yard.tradeSlots.flatMap((slot, i) => {
    if (slot === null || slot.trade !== 'import' || holdings[i].units > 0 || served.has(i)) return [];
    return [{ slot: i, good: slot.good, loads: slot.loads, cost: importCost(slot.good, slot.loads) }];
  });
}

export function ordersWaitingForMoney(state: GameState, yard: Building): ImportOrder[] {
  const route = routeOf(state, guildOfYard(state, yard));
  if (route === null || partnerCaravansHome(state, route.partner) === 0) return [];
  return pendingOrders(state, yard).filter((order) => order.cost > state.treasury);
}

export function tickImports(state: GameState): void {
  for (const yard of state.buildings.filter((b) => b.type === 'tradeYard')) sendCaravan(state, yard);
  for (const caravan of [...state.foreignCaravans]) moveCaravan(state, caravan);
}

function sendCaravan(state: GameState, yard: Building): void {
  const route = routeOf(state, guildOfYard(state, yard));
  if (route === null || partnerCaravansHome(state, route.partner) === 0) return;
  const order = pendingOrders(state, yard).find((o) => o.cost <= state.treasury);
  if (order === undefined) return;
  state.foreignCaravans.push({
    id: state.nextForeignCaravanId++,
    partner: route.partner,
    yardId: yard.id,
    ...order,
    trip: 'coming',
    dueAt: state.tick + halfTrip(route.partner),
    path: [state.entry],
    step: 0,
    progress: 0,
  });
  state.version++;
}

function moveCaravan(state: GameState, caravan: ForeignCaravan): void {
  const yard = buildingById(state, caravan.yardId);
  if (caravan.trip === 'coming') {
    if (yard === undefined) turnBack(state, caravan);
    else if (state.tick >= caravan.dueAt) enter(state, caravan, yard);
    return;
  }
  if (caravan.trip === 'going') {
    if (state.tick >= caravan.dueAt) state.foreignCaravans = state.foreignCaravans.filter((c) => c !== caravan);
    return;
  }
  if (caravan.trip === 'in' && yard === undefined) headWest(state, caravan);
  walkPath(state, caravan, () => replan(state, caravan), () => arrive(state, caravan));
}

function turnBack(state: GameState, caravan: ForeignCaravan): void {
  const travelled = state.tick - (caravan.dueAt - halfTrip(caravan.partner));
  caravan.trip = 'going';
  caravan.dueAt = state.tick + travelled;
  state.version++;
}

function enter(state: GameState, caravan: ForeignCaravan, yard: Building): void {
  caravan.trip = 'in';
  caravan.path = [state.entry];
  caravan.step = 0;
  caravan.progress = 0;
  walkTo(state, caravan, adjacentRoadTiles(state, yard));
  state.version++;
}

function headWest(state: GameState, caravan: ForeignCaravan): void {
  caravan.trip = 'back';
  walkTo(state, caravan, [state.entry]);
  state.version++;
}

function replan(state: GameState, caravan: ForeignCaravan): boolean {
  walkTo(state, caravan, caravan.trip === 'in' ? adjacentRoadTiles(state, yardOf(state, caravan)) : [state.entry]);
  return true;
}

function walkTo(state: GameState, caravan: ForeignCaravan, targets: Point[]): void {
  const path = findRoadPath(state, caravan.path[caravan.step], targets);
  if (path === null) throw new Error(`Caravan from ${caravan.partner} has no road: the Main Road joins the west edge and the yard`);
  caravan.path = path;
  caravan.step = 0;
}

function yardOf(state: GameState, caravan: ForeignCaravan): Building {
  return tradeYardById(state, caravan.yardId);
}

function arrive(state: GameState, caravan: ForeignCaravan): void {
  if (caravan.trip === 'in') {
    const yard = yardOf(state, caravan);
    yard[caravan.good] += caravan.loads * UNITS_PER_LOAD;
    spend(state, 'imports', caravan.cost);
    bookTrade(state, 'imports', caravan.good, caravan.loads, caravan.cost);
    headWest(state, caravan);
  } else {
    caravan.trip = 'going';
    caravan.dueAt = state.tick + halfTrip(caravan.partner);
    state.version++;
  }
}

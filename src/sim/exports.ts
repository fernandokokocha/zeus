import { TICKS_PER_MONTH } from './clock';
import { adjacentRoadTiles, type Result } from './commands';
import { UNITS_PER_LOAD } from './food';
import { PLACES } from './greece';
import { eliteOfAnnex, annexOf } from './elites';
import { postNotice } from './notices';
import { findRoadPath } from './pathfinding';
import type { Point } from './point';
import { buildingById, type Building, type Caravan, type GameState, type Good, type TradeGood, type TradeSlot } from './state';
import { PARTNERS, TRADE_GOODS, roundTripMonths, routeOf } from './trade';
import { bookTrade } from './trade-books';
import { collect } from './treasury';
import { walkPath } from './walking';

export const YARD_SLOTS = 4;
export const CARAVAN_MERCHANTS = 5;
export const YARD_CART_PUSHERS = 8;

export interface SlotHolding {
  good: TradeGood | null;
  units: number;
  capacity: number;
}

export function emptyTradeSlots(): TradeSlot[] {
  return new Array<TradeSlot>(YARD_SLOTS).fill(null);
}

export function caravanUnits(good: TradeGood): number {
  return TRADE_GOODS[good].caravanLoad * UNITS_PER_LOAD;
}

export const NO_ROUTE = 'Open a trade route first';

export function tradeYardById(state: GameState, yardId: number): Building {
  const yard = buildingById(state, yardId);
  if (yard === undefined || yard.type !== 'tradeYard') throw new Error(`Building ${yardId} is not a Trade Yard`);
  return yard;
}

export function setExportSlot(state: GameState, yardId: number, slot: number, good: TradeGood | null): Result {
  const yard = tradeYardById(state, yardId);
  const route = routeOf(state, eliteOfAnnex(state, yard));
  if (route === null) return { ok: false, reason: NO_ROUTE };
  if (good !== null && !PARTNERS[route.partner].buys.includes(good)) {
    return { ok: false, reason: `${PLACES[route.partner].name} doesn't buy ${good}` };
  }
  yard.tradeSlots[slot] = good === null ? null : { trade: 'export', good };
  state.version++;
  return { ok: true };
}

export function exportCapacity(yard: Building, good: TradeGood): number {
  const slots = yard.tradeSlots.filter((s) => s !== null && s.trade === 'export' && s.good === good).length;
  return slots * caravanUnits(good);
}

function slotCapacity(slot: NonNullable<TradeSlot>): number {
  return slot.trade === 'export' ? caravanUnits(slot.good) : slot.loads * UNITS_PER_LOAD;
}

export function slotHoldings(yard: Building): SlotHolding[] {
  const left = { ...yard };
  return yard.tradeSlots.map((slot) => {
    if (slot === null) return { good: null, units: 0, capacity: 0 };
    const capacity = slotCapacity(slot);
    const units = Math.min(capacity, left[slot.good]);
    left[slot.good] -= units;
    return { good: slot.good, units, capacity };
  });
}

export function caravansOf(state: GameState, guild: Building): Caravan[] {
  return state.caravans.filter((c) => c.guildId === guild.id);
}

export function yardMerchants(yard: Building): number {
  return Math.max(0, yard.workers - YARD_CART_PUSHERS);
}

export function caravanLimit(yard: Building): number {
  return Math.floor(yardMerchants(yard) / CARAVAN_MERCHANTS);
}

function merchantsHome(state: GameState, guild: Building): number {
  return yardMerchants(annexOf(state, guild)) - CARAVAN_MERCHANTS * caravansOf(state, guild).length;
}

export function tickCaravans(state: GameState): void {
  for (const guild of state.buildings.filter((b) => b.type === 'tradersGuild')) formCaravan(state, guild);
  for (const caravan of [...state.caravans]) moveCaravan(state, caravan);
}

function formCaravan(state: GameState, guild: Building): void {
  const route = routeOf(state, guild);
  if (route === null || merchantsHome(state, guild) < CARAVAN_MERCHANTS) return;
  const yard = annexOf(state, guild);
  const good = fullSlotGood(yard);
  if (good === null) return;
  const toYard = findRoadPath(state, state.entry, adjacentRoadTiles(state, yard));
  if (toYard === null) throw new Error(`Trade Yard ${yard.id} has no road to the west edge`);
  yard[good] -= caravanUnits(good);
  const { caravanLoad } = TRADE_GOODS[good];
  state.caravans.push({
    id: state.nextCaravanId++,
    guildId: guild.id,
    partner: route.partner,
    good,
    loads: caravanLoad,
    drachmas: caravanLoad * exportPrice(good),
    trip: 'out',
    backAt: 0,
    waiting: false,
    path: toYard.reverse(),
    step: 0,
    progress: 0,
  });
  state.version++;
}

function exportPrice(good: TradeGood): number {
  const { theyPay } = TRADE_GOODS[good];
  if (theyPay === null) throw new Error(`Nobody buys ${good}`);
  return theyPay;
}

function fullSlotGood(yard: Building): TradeGood | null {
  const holdings = slotHoldings(yard);
  for (const [i, slot] of yard.tradeSlots.entries()) {
    if (slot !== null && slot.trade === 'export' && holdings[i].units === holdings[i].capacity) return slot.good;
  }
  return null;
}

function destination(state: GameState, caravan: Caravan): Point[] | null {
  if (caravan.trip === 'out') return [state.entry];
  if (caravan.trip === 'home') {
    const palace = state.buildings.find((b) => b.type === 'palace');
    return palace === undefined ? [] : adjacentRoadTiles(state, palace);
  }
  const guild = buildingById(state, caravan.guildId);
  return guild === undefined ? null : adjacentRoadTiles(state, guild);
}

function moveCaravan(state: GameState, caravan: Caravan): void {
  if (caravan.trip === 'away') {
    if (state.tick >= caravan.backAt) comeBack(state, caravan);
    return;
  }
  if ((caravan.waiting || !headedFor(state, caravan)) && !replan(state, caravan)) return;
  walkPath(state, caravan, () => replan(state, caravan), () => arrive(state, caravan));
}

function headedFor(state: GameState, caravan: Caravan): boolean {
  const end = caravan.path[caravan.path.length - 1];
  const targets = destination(state, caravan);
  return targets !== null && targets.some((p) => p.x === end.x && p.y === end.y);
}

function replan(state: GameState, caravan: Caravan): boolean {
  const here = caravan.path[caravan.step];
  const targets = destination(state, caravan);
  const path = targets === null ? null : findRoadPath(state, here, targets);
  if (path === null && caravan.trip === 'merchants') {
    dismiss(state, caravan);
    return false;
  }
  caravan.waiting = path === null;
  caravan.path = path ?? [here];
  caravan.step = 0;
  return !caravan.waiting;
}

function comeBack(state: GameState, caravan: Caravan): void {
  caravan.trip = 'home';
  caravan.path = [state.entry];
  caravan.step = 0;
  caravan.progress = 0;
  replan(state, caravan);
  state.version++;
}

function arrive(state: GameState, caravan: Caravan): void {
  if (caravan.trip === 'out') {
    caravan.trip = 'away';
    caravan.backAt = state.tick + roundTripMonths(state, caravan.partner) * TICKS_PER_MONTH;
  } else if (caravan.trip === 'home') {
    collect(state, 'trade', caravan.drachmas);
    bookTrade(state, 'exports', caravan.good, caravan.loads, caravan.drachmas);
    const palace = state.buildings.find((b) => b.type === 'palace');
    if (palace === undefined) throw new Error(`Caravan ${caravan.id} reached a Palace that is gone`);
    postNotice(state, `Caravan back from ${PLACES[caravan.partner].name}: +${caravan.drachmas} dr`, palace);
    caravan.trip = 'merchants';
    replan(state, caravan);
  } else {
    dismiss(state, caravan);
  }
  state.version++;
}

function dismiss(state: GameState, caravan: Caravan): void {
  state.caravans = state.caravans.filter((c) => c !== caravan);
}

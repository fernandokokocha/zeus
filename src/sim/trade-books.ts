import { GOODS } from './flows';
import type { GameState, Good } from './state';

export interface Tally {
  loads: number;
  drachmas: number;
}

export type TradeDirection = 'exports' | 'imports';
export type TradeYear = Record<TradeDirection, Record<Good, Tally>>;

export interface TradeBooks {
  thisYear: TradeYear;
  lastYear: TradeYear;
}

function emptyTallies(): Record<Good, Tally> {
  return Object.fromEntries(GOODS.map((good) => [good, { loads: 0, drachmas: 0 }])) as Record<Good, Tally>;
}

export function emptyTradeYear(): TradeYear {
  return { exports: emptyTallies(), imports: emptyTallies() };
}

export function bookTrade(state: GameState, direction: TradeDirection, good: Good, loads: number, drachmas: number): void {
  const tally = state.tradeBooks.thisYear[direction][good];
  tally.loads += loads;
  tally.drachmas += drachmas;
}

export function closeTradeYear(state: GameState): void {
  state.tradeBooks = { thisYear: emptyTradeYear(), lastYear: state.tradeBooks.thisYear };
}

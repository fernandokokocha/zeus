import { gameDate } from './clock';
import type { GameState } from './state';
import { closeTradeYear } from './trade-books';

export const STARTING_TREASURY = 5000;
export const ROAD_TILE_COST = 2;
export const ROADBLOCK_COST = 6;
export const SHEEP_COST = 4;
export const WAGE_PER_WORKER_PER_YEAR = 3;
export const TAX_RATE = 0.09;

export interface Accounts {
  taxes: number;
  trade: number;
  wages: number;
  construction: number;
  sheep: number;
  imports: number;
}

export type Income = 'taxes' | 'trade';
export type Spending = 'wages' | 'construction' | 'sheep' | 'imports';

export interface Books {
  thisYear: Accounts;
  lastYear: Accounts;
}

export interface YearLabels {
  thisYear: string;
  lastYear: string | null;
}

export interface YearAccounts {
  label: string;
  accounts: Accounts;
}

export interface TreasuryReport {
  treasury: number;
  thisYear: YearAccounts;
  lastYear: YearAccounts | null;
}

const FOUNDING_YEAR = 1;

export function emptyAccounts(): Accounts {
  return { taxes: 0, trade: 0, wages: 0, construction: 0, sheep: 0, imports: 0 };
}

export function spend(state: GameState, category: Spending, amount: number): void {
  state.treasury -= amount;
  state.accounts.thisYear[category] += amount;
}

export function collect(state: GameState, category: Income, amount: number): void {
  state.treasury += amount;
  state.accounts.thisYear[category] += amount;
}

export function closeYear(state: GameState): void {
  state.accounts = { thisYear: emptyAccounts(), lastYear: state.accounts.thisYear };
  closeTradeYear(state);
}

export function yearLabels(state: GameState): YearLabels {
  const { year } = gameDate(state.tick);
  return { thisYear: `Year ${year}, so far`, lastYear: year === FOUNDING_YEAR ? null : `Year ${year - 1}` };
}

export function treasuryReport(state: GameState): TreasuryReport {
  const labels = yearLabels(state);
  return {
    treasury: state.treasury,
    thisYear: { label: labels.thisYear, accounts: state.accounts.thisYear },
    lastYear: labels.lastYear === null ? null : { label: labels.lastYear, accounts: state.accounts.lastYear },
  };
}

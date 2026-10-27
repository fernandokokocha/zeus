import { gameDate } from './clock';
import type { GameState } from './state';

export const STARTING_TREASURY = 5000;
export const ROAD_TILE_COST = 2;
export const ROADBLOCK_COST = 6;
export const SHEEP_COST = 4;
export const WAGE_PER_WORKER_PER_YEAR = 3;
export const TAX_RATE = 0.09;

export interface Accounts {
  taxes: number;
  wages: number;
  construction: number;
  sheep: number;
}

export type Spending = 'wages' | 'construction' | 'sheep';

export interface Books {
  thisYear: Accounts;
  lastYear: Accounts;
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
  return { taxes: 0, wages: 0, construction: 0, sheep: 0 };
}

export function spend(state: GameState, category: Spending, amount: number): void {
  state.treasury -= amount;
  state.accounts.thisYear[category] += amount;
}

export function collect(state: GameState, taxes: number): void {
  state.treasury += taxes;
  state.accounts.thisYear.taxes += taxes;
}

export function closeYear(state: GameState): void {
  state.accounts = { thisYear: emptyAccounts(), lastYear: state.accounts.thisYear };
}

export function treasuryReport(state: GameState): TreasuryReport {
  const { year } = gameDate(state.tick);
  return {
    treasury: state.treasury,
    thisYear: { label: `Year ${year}, so far`, accounts: state.accounts.thisYear },
    lastYear: year === FOUNDING_YEAR ? null : { label: `Year ${year - 1}`, accounts: state.accounts.lastYear },
  };
}

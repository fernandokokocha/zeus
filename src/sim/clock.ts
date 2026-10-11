import type { GameState, Speed } from './state';

export const TICKS_PER_SECOND = 10;
export const SECONDS_PER_MONTH = 30;
export const TICKS_PER_MONTH = TICKS_PER_SECOND * SECONDS_PER_MONTH;

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function gameDate(tick: number): { month: string; year: number } {
  const months = Math.floor(tick / TICKS_PER_MONTH);
  return { month: MONTH_NAMES[months % 12], year: Math.floor(months / 12) + 1 };
}

export function setSpeed(state: GameState, speed: Speed): void {
  state.speed = speed;
  state.speedBeforeInspection = null;
}

export function pauseForInspection(state: GameState): void {
  if (state.speedBeforeInspection !== null || state.speed === 0) {
    state.speed = 0;
    return;
  }
  state.speedBeforeInspection = state.speed;
  state.speed = 0;
}

export function resumeAfterInspection(state: GameState): void {
  if (state.speedBeforeInspection === null) return;
  state.speed = state.speedBeforeInspection;
  state.speedBeforeInspection = null;
}

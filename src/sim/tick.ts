import { TICKS_PER_MONTH } from './clock';
import { settleMonth } from './economy';
import { assignWorkers } from './labor';
import { tickRoamers } from './roamers';
import { tickSettlers } from './settlers';
import type { GameState } from './state';

export function tick(state: GameState): void {
  state.tick++;
  assignWorkers(state);
  if (state.tick % TICKS_PER_MONTH === 0) settleMonth(state);
  tickSettlers(state);
  tickRoamers(state);
}

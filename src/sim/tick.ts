import { assignWorkers } from './labor';
import { tickRoamers } from './roamers';
import { tickSettlers } from './settlers';
import type { GameState } from './state';

export function tick(state: GameState): void {
  state.tick++;
  assignWorkers(state);
  tickSettlers(state);
  tickRoamers(state);
}

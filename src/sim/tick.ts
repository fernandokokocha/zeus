import { assignWorkers } from './labor';
import { tickSettlers } from './settlers';
import type { GameState } from './state';

export function tick(state: GameState): void {
  state.tick++;
  assignWorkers(state);
  tickSettlers(state);
}

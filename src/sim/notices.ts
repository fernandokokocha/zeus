import type { Point } from './point';
import type { GameState } from './state';

export const NOTICE_LOG_LIMIT = 50;

export function postNotice(state: GameState, text: string, at: Point): void {
  state.notices.push({ id: state.nextNoticeId++, tick: state.tick, text, at: { x: at.x, y: at.y } });
  if (state.notices.length > NOTICE_LOG_LIMIT) state.notices.shift();
}

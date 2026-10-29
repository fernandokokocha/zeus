import type { GameState, Good } from './state';

export interface GoodFlow {
  made: number;
  possible: number;
  used: number;
  wanted: number;
}

export type Flows = Record<Good, GoodFlow>;
export type FlowKind = keyof GoodFlow;

export interface FlowBook {
  thisMonth: Flows;
  months: Flows[];
}

export const GOODS: Good[] = ['food', 'fleece', 'olives', 'oil', 'cloth', 'papyrus', 'scrolls', 'wood', 'marble', 'bronze', 'sculptures'];

export function emptyFlows(): Flows {
  return Object.fromEntries(GOODS.map((good) => [good, { made: 0, possible: 0, used: 0, wanted: 0 }])) as Flows;
}

export function recordFlow(state: GameState, kind: FlowKind, good: Good, units: number): void {
  state.flows.thisMonth[good][kind] += units;
}

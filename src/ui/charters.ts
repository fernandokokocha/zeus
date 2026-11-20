import { TICKS_PER_MONTH } from '../sim/clock';
import { CHARTERS, type Charter, type CharterCount } from '../sim/charters';
import { ELITE_NAMES, type EliteType } from '../sim/housing';
import type { GameState } from '../sim/state';
import { element } from './dom';
import { ledgerBar } from './ledger-chapters';

export interface CharterReport {
  name: string;
  grants: string;
  months: number;
  total: number;
  conditions: { label: string; met: boolean }[];
  reset: CharterCount['reset'];
}

export function charterReport(state: GameState, charter: Charter): CharterReport {
  const { months, reset } = state[charter.progress];
  return {
    name: charter.name,
    grants: ELITE_NAMES[charter.grants],
    months,
    total: charter.months,
    conditions: [...charter.requires, ...charter.keeps].map((c) => ({ label: c.label, met: c.unmet(state) === null })),
    reset,
  };
}

export function monthsText(months: number, total: number): string {
  return `${months} / ${total} months`;
}

export function resetText(reset: NonNullable<CharterCount['reset']>, tick: number): string {
  return `Reset ${monthsAgo(tick - reset.tick)}: ${reset.cause}`;
}

function monthsAgo(ticks: number): string {
  const months = Math.floor(ticks / TICKS_PER_MONTH);
  if (months === 0) return 'this month';
  return `${months} ${months === 1 ? 'month' : 'months'} ago`;
}

export function permitLines(permits: Record<EliteType, number>): string[] {
  return (Object.keys(permits) as EliteType[]).map((type) => `${ELITE_NAMES[type]} permits: ${permits[type]}`);
}

function charterSection(report: CharterReport, tick: number): HTMLElement {
  const head = element('div', 'charter-head', element('strong', '', report.name), element('span', 'charter-grant', `Grants a ${report.grants} permit`));
  const conditions = element(
    'ul',
    'charter-conditions',
    ...report.conditions.map(({ label, met }) => element('li', met ? 'met' : '', element('span', 'charter-check', met ? '✓' : ''), label)),
  );
  const section = element('section', 'charter', head, ledgerBar(report.months / report.total, monthsText(report.months, report.total)), conditions);
  if (report.reset) section.append(element('p', 'charter-reset', resetText(report.reset, tick)));
  return section;
}

export function createCharterChapter(state: GameState): { body: HTMLElement; update(): void } {
  const body = element('div', 'charter-chapter');
  return {
    body,
    update() {
      body.replaceChildren(
        ...CHARTERS.map((charter) => charterSection(charterReport(state, charter), state.tick)),
        element('div', 'charter-permits', ...permitLines(state.permits).map((line) => element('p', '', line))),
      );
    },
  };
}

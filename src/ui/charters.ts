import { CHARTERS, LEARNED_CITY_MONTHS, WELL_DRESSED_MONTHS, type Charter, type CharterCount } from '../sim/charters';
import { TICKS_PER_MONTH } from '../sim/clock';
import { ELITE_NAMES, type EliteType } from '../sim/housing';
import type { GameState } from '../sim/state';

const GOALS: Record<Charter['progress'], string> = {
  wellDressed: `The city has a Townhouse, and no Townhouse runs out of fleece or oil, for ${WELL_DRESSED_MONTHS} months in a row. Elite houses count as Townhouses. Grants a Traders' Guild permit.`,
  learnedCity: `The city has a Townhouse, and every Townhouse has philosophy, athletics and drama, for ${LEARNED_CITY_MONTHS} months in a row. Elite houses count as Townhouses. Grants a Scholars' House permit.`,
};

export function charterText(charter: Charter, { months, reset }: CharterCount, tick: number): string {
  const progress = `${charter.name}: ${months} / ${charter.months} months`;
  if (reset === null) return progress;
  return `${progress}, reset ${monthsAgo(tick - reset.tick)} (${reset.cause})`;
}

function monthsAgo(ticks: number): string {
  const months = Math.floor(ticks / TICKS_PER_MONTH);
  if (months === 0) return 'this month';
  return `${months} ${months === 1 ? 'month' : 'months'} ago`;
}

export function permitLines(permits: Record<EliteType, number>): string[] {
  return (Object.keys(permits) as EliteType[]).map((type) => `${ELITE_NAMES[type]} permits: ${permits[type]}`);
}

export function createCharterChapter(state: GameState): { body: HTMLElement; update(): void } {
  const body = document.createElement('div');
  body.className = 'charter-chapter';
  const progressLines = CHARTERS.map((charter) => {
    const progress = document.createElement('strong');
    const goal = document.createElement('p');
    goal.textContent = GOALS[charter.progress];
    body.append(progress, goal);
    return { charter, progress };
  });
  const permits = document.createElement('div');
  permits.className = 'charter-permits';
  body.append(permits);

  return {
    body,
    update() {
      for (const { charter, progress } of progressLines) {
        progress.textContent = charterText(charter, state[charter.progress], state.tick);
      }
      permits.replaceChildren(
        ...permitLines(state.permits).map((line) => {
          const p = document.createElement('p');
          p.textContent = line;
          return p;
        }),
      );
    },
  };
}

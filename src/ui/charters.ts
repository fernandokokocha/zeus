import { BUILDING_SPECS } from '../sim/buildings';
import { WELL_DRESSED_MONTHS, type WellDressed } from '../sim/charters';
import { TICKS_PER_MONTH } from '../sim/clock';
import type { EliteType } from '../sim/housing';
import type { GameState } from '../sim/state';

const WELL_DRESSED_GOAL = `The city has a Townhouse, and no Townhouse runs out of fleece or oil, for ${WELL_DRESSED_MONTHS} months in a row. Elite houses count as Townhouses. Grants a Traders' Guild permit.`;

export function wellDressedText({ months, reset }: WellDressed, tick: number): string {
  const progress = `Well dressed: ${months} / ${WELL_DRESSED_MONTHS} months`;
  if (reset === null) return progress;
  return `${progress}, reset ${monthsAgo(tick - reset.tick)} (${reset.cause})`;
}

function monthsAgo(ticks: number): string {
  const months = Math.floor(ticks / TICKS_PER_MONTH);
  if (months === 0) return 'this month';
  return `${months} ${months === 1 ? 'month' : 'months'} ago`;
}

export function permitLines(permits: Record<EliteType, number>): string[] {
  return (Object.keys(permits) as EliteType[]).map((type) => `${BUILDING_SPECS[type].name} permits: ${permits[type]}`);
}

export function createCharterChapter(state: GameState): { body: HTMLElement; update(): void } {
  const body = document.createElement('div');
  body.className = 'charter-chapter';
  const wellDressed = document.createElement('strong');
  const goal = document.createElement('p');
  goal.textContent = WELL_DRESSED_GOAL;
  const permits = document.createElement('div');
  permits.className = 'charter-permits';
  body.append(wellDressed, goal, permits);

  return {
    body,
    update() {
      wellDressed.textContent = wellDressedText(state.wellDressed, state.tick);
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

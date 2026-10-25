import { WELL_FED_MONTHS, type WellFed } from '../sim/charters';
import { TICKS_PER_MONTH } from '../sim/clock';
import type { GameState } from '../sim/state';
import { byId } from './dom';

const WELL_FED_GOAL = `No house that eats (Shack and up) goes without food for ${WELL_FED_MONTHS} months in a row. Grants a Traders' Guild permit.`;

export function wellFedText({ months, reset }: WellFed, tick: number): string {
  const progress = `Well fed: ${months} / ${WELL_FED_MONTHS} months`;
  if (reset === null) return progress;
  return `${progress}, reset ${monthsAgo(tick - reset.tick)} (${reset.house} went hungry)`;
}

function monthsAgo(ticks: number): string {
  const months = Math.floor(ticks / TICKS_PER_MONTH);
  if (months === 0) return 'this month';
  return `${months} ${months === 1 ? 'month' : 'months'} ago`;
}

export function permitsText(permits: number): string {
  return `Traders' Guild permits: ${permits}`;
}

export function createCharters(state: GameState): { update(): void } {
  const panel = byId('charters-panel');
  const wellFed = byId('charter-well-fed');
  const permits = byId('charter-permits');
  byId('charter-well-fed-goal').textContent = WELL_FED_GOAL;

  function toggle(): void {
    panel.hidden = !panel.hidden;
  }

  byId('charters-button').addEventListener('click', toggle);
  byId('charters-close').addEventListener('click', toggle);
  window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'c' && !e.repeat) toggle();
  });

  return {
    update() {
      if (panel.hidden) return;
      wellFed.textContent = wellFedText(state.wellFed, state.tick);
      permits.textContent = permitsText(state.guildPermits);
    },
  };
}

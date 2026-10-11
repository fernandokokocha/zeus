import { gameDate, setSpeed, togglePause } from '../sim/clock';
import { population } from '../sim/settlers';
import type { GameState, Speed } from '../sim/state';
import { byId } from './dom';

const SPEEDS: [string, Speed][] = [
  ['❚❚', 0],
  ['1×', 1],
  ['2×', 2],
  ['4×', 4],
];
const STATUS_SECONDS = 3;

export function createTopbar(state: GameState): { update(): void; showStatus(text: string): void } {
  const populationLabel = byId('population');
  const treasury = byId('treasury');
  const date = byId('date');
  const status = byId('status');
  const speedBox = byId('speed');
  let statusTimer = 0;

  const buttons = SPEEDS.map(([label, speed]) => {
    const button = document.createElement('button');
    button.textContent = label;
    button.addEventListener('click', () => setSpeed(state, speed));
    speedBox.append(button);
    return { button, speed };
  });

  window.addEventListener('keydown', (e) => {
    if (e.code !== 'Space') return;
    e.preventDefault();
    if (!e.repeat) togglePause(state);
  });
  window.addEventListener('keyup', (e) => {
    if (e.code === 'Space') e.preventDefault();
  });

  return {
    update() {
      const { month, year } = gameDate(state.tick);
      populationLabel.textContent = `Population ${population(state).toLocaleString('en-US')}`;
      treasury.textContent = `${state.treasury.toLocaleString('en-US')} dr`;
      treasury.classList.toggle('negative', state.treasury < 0);
      date.textContent = `${month}, Year ${year}`;
      for (const { button, speed } of buttons) button.classList.toggle('active', speed === state.speed);
    },
    showStatus(text) {
      status.textContent = text;
      window.clearTimeout(statusTimer);
      statusTimer = window.setTimeout(() => (status.textContent = ''), STATUS_SECONDS * 1000);
    },
  };
}

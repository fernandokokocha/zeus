import { gameDate, setSpeed } from '../sim/clock';
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

  return {
    update() {
      const { month, year } = gameDate(state.tick);
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

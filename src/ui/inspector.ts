import { pauseForInspection, resumeAfterInspection } from '../sim/clock';
import type { Description } from '../sim/inspect';
import type { GameState } from '../sim/state';
import { byId } from './dom';

export function createInspector(state: GameState): {
  open(description: Description): void;
  close(): void;
  isOpen(): boolean;
} {
  const panel = byId('inspector');
  const title = byId('inspector-title');
  const lines = byId('inspector-lines');

  function close(): void {
    if (panel.hidden) return;
    panel.hidden = true;
    resumeAfterInspection(state);
  }

  byId('inspector-close').addEventListener('click', close);

  return {
    open(description) {
      pauseForInspection(state);
      title.textContent = description.title;
      lines.replaceChildren(
        ...description.lines.map((line) => {
          const item = document.createElement('li');
          item.textContent = line;
          return item;
        }),
      );
      panel.hidden = false;
    },
    close,
    isOpen: () => !panel.hidden,
  };
}

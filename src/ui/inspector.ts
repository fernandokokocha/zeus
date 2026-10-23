import { pauseForInspection, resumeAfterInspection } from '../sim/clock';
import type { Description, Meter } from '../sim/inspect';
import type { GameState } from '../sim/state';
import { byId } from './dom';

export interface Inspector {
  open(look: () => Description): void;
  refresh(): void;
  close(): void;
  isOpen(): boolean;
}

export function createInspector(state: GameState): Inspector {
  const panel = byId('inspector');
  const title = byId('inspector-title');
  const lines = byId('inspector-lines');
  const meters = byId('inspector-meters');
  let look: (() => Description) | null = null;
  let shown = '';

  function render(description: Description): void {
    const serialized = JSON.stringify(description);
    if (serialized === shown) return;
    shown = serialized;
    title.textContent = description.title;
    lines.replaceChildren(...description.lines.map(lineItem));
    meters.replaceChildren(...description.meters.map(meterRow));
    meters.hidden = description.meters.length === 0;
  }

  function close(): void {
    if (panel.hidden) return;
    panel.hidden = true;
    look = null;
    resumeAfterInspection(state);
  }

  byId('inspector-close').addEventListener('click', close);

  return {
    open(next) {
      pauseForInspection(state);
      look = next;
      render(look());
      panel.hidden = false;
    },
    refresh() {
      if (look) render(look());
    },
    close,
    isOpen: () => !panel.hidden,
  };
}

function lineItem(line: string): HTMLLIElement {
  const item = document.createElement('li');
  item.textContent = line;
  return item;
}

function meterRow(meter: Meter): HTMLDivElement {
  const row = document.createElement('div');
  row.className = `meter${meter.need ? ` meter-${meter.need}` : ''}`;
  const label = document.createElement('span');
  label.className = 'meter-label';
  label.textContent = meter.label;
  const value = document.createElement('span');
  value.className = 'meter-value';
  value.textContent = meter.value;
  const bar = document.createElement('div');
  bar.className = 'meter-bar';
  const fill = document.createElement('div');
  fill.className = 'meter-fill';
  fill.style.width = `${Math.round(meter.fill * 100)}%`;
  bar.append(fill);
  row.append(label, value, bar);
  return row;
}

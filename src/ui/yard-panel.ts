import type { ExportSlotView, TradeYardView } from '../sim/inspect';
import type { Good } from '../sim/state';

const OFF = '';

export function yardPanel(view: TradeYardView, setSlot: (slot: number, good: Good | null) => void): HTMLElement[] {
  const head = document.createElement('b');
  head.textContent = 'Export slots';
  return [head, ...view.slots.map((slot, i) => slotRow(view, slot, i, setSlot))];
}

function slotRow(view: TradeYardView, slot: ExportSlotView, index: number, setSlot: (slot: number, good: Good | null) => void): HTMLDivElement {
  const row = document.createElement('div');
  row.className = 'yard-slot';
  const choice = document.createElement('select');
  choice.setAttribute('aria-label', `Slot ${index + 1}`);
  choice.append(option(OFF, 'Off'), ...view.choices.map(({ good, name }) => option(good, `Export ${name.toLowerCase()}`)));
  choice.value = slot.good ?? OFF;
  choice.addEventListener('change', () => setSlot(index, choice.value === OFF ? null : (choice.value as Good)));
  const fill = document.createElement('span');
  fill.className = 'yard-slot-fill';
  fill.textContent = slot.good === null ? '' : `${slot.loads}/${slot.capacity} loads`;
  const bar = document.createElement('div');
  bar.className = 'meter-bar';
  const level = document.createElement('div');
  level.className = 'meter-fill';
  level.style.width = slot.capacity === 0 ? '0%' : `${Math.round((slot.loads / slot.capacity) * 100)}%`;
  bar.append(level);
  row.append(choice, fill, bar);
  return row;
}

function option(value: string, label: string): HTMLOptionElement {
  const item = document.createElement('option');
  item.value = value;
  item.textContent = label;
  return item;
}

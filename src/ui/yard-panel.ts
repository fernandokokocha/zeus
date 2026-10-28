import type { SlotView, TradeYardView } from '../sim/inspect';
import type { Good } from '../sim/state';

const OFF = '';
const EXPORT = 'export:';
const IMPORT = 'import:';

export interface SlotActions {
  setExport(slot: number, good: Good | null): void;
  setImport(slot: number, good: Good, loads: number): void;
}

export function yardPanel(view: TradeYardView, actions: SlotActions): HTMLElement[] {
  const head = document.createElement('b');
  head.textContent = 'Trade slots';
  return [head, ...view.slots.map((slot, i) => slotRow(view, slot, i, actions))];
}

function importLoad(view: TradeYardView, good: Good): number | null {
  return view.imports.find((offer) => offer.good === good)?.load ?? null;
}

function slotRow(view: TradeYardView, slot: SlotView, index: number, actions: SlotActions): HTMLDivElement {
  const row = document.createElement('div');
  row.className = 'yard-slot';
  const imported = slot.good === null ? null : importLoad(view, slot.good);
  const choice = document.createElement('select');
  choice.setAttribute('aria-label', `Slot ${index + 1}`);
  choice.append(
    option(OFF, 'Off'),
    ...view.exports.map(({ good, name }) => option(EXPORT + good, `Export ${name.toLowerCase()}`)),
    ...view.imports.map(({ good, name }) => option(IMPORT + good, `Import ${name.toLowerCase()}`)),
  );
  choice.value = slot.good === null ? OFF : (imported === null ? EXPORT : IMPORT) + slot.good;
  choice.addEventListener('change', () => choose(view, choice.value, index, actions));
  const controls = document.createElement('div');
  controls.className = 'yard-slot-controls';
  controls.append(choice);
  if (slot.good !== null && imported !== null) controls.append(amountChoice(slot.good, imported, slot.capacity, index, actions));
  const fill = document.createElement('span');
  fill.className = 'yard-slot-fill';
  fill.textContent = slot.good === null ? '' : `${slot.loads}/${slot.capacity} loads`;
  const bar = document.createElement('div');
  bar.className = 'meter-bar';
  const level = document.createElement('div');
  level.className = 'meter-fill';
  level.style.width = slot.capacity === 0 ? '0%' : `${Math.round((slot.loads / slot.capacity) * 100)}%`;
  bar.append(level);
  row.append(controls, fill, bar);
  return row;
}

function choose(view: TradeYardView, value: string, index: number, actions: SlotActions): void {
  if (value === OFF) return actions.setExport(index, null);
  if (value.startsWith(EXPORT)) return actions.setExport(index, value.slice(EXPORT.length) as Good);
  const good = value.slice(IMPORT.length) as Good;
  const load = importLoad(view, good);
  if (load === null) throw new Error(`${good} is not on offer`);
  actions.setImport(index, good, load);
}

function amountChoice(good: Good, load: number, amount: number, index: number, actions: SlotActions): HTMLSelectElement {
  const choice = document.createElement('select');
  choice.setAttribute('aria-label', `Slot ${index + 1} amount`);
  choice.append(...Array.from({ length: load }, (_, i) => option(String(i + 1), `${i + 1} ${i === 0 ? 'load' : 'loads'}`)));
  choice.value = String(amount);
  choice.addEventListener('change', () => actions.setImport(index, good, Number(choice.value)));
  return choice;
}

function option(value: string, label: string): HTMLOptionElement {
  const item = document.createElement('option');
  item.value = value;
  item.textContent = label;
  return item;
}

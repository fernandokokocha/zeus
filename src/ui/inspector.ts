import { pauseForInspection, resumeAfterInspection } from '../sim/clock';
import type { Description, Inspection, Meter } from '../sim/inspect';
import type { Point } from '../sim/point';
import { buildingById, type GameState, type TradeGood } from '../sim/state';
import { setAllAccepted, setGoodAccepted } from '../sim/storehouse';
import { byId } from './dom';
import { setExportSlot } from '../sim/exports';
import { setImportSlot } from '../sim/imports';
import { storehousePanel, type StorehouseOrders } from './storehouse-panel';
import { yardPanel } from './yard-panel';

export interface Inspector {
  open(look: () => Inspection): void;
  refresh(): void;
  close(): void;
  isOpen(): boolean;
}

export function createInspector(state: GameState, highlight: { show(tiles: Point[]): void }, openRouteFor: (guildId: number) => void): Inspector {
  const panel = byId('inspector');
  const title = byId('inspector-title');
  const lines = byId('inspector-lines');
  const meters = byId('inspector-meters');
  const storehouse = byId('inspector-storehouse');
  const yard = byId('inspector-yard');
  const actions = byId('inspector-actions');
  let look: (() => Inspection) | null = null;
  let shown = '';

  function show(inspection: Inspection): void {
    highlight.show(inspection.tiles);
    render(inspection.description);
  }

  function render(description: Description): void {
    const serialized = JSON.stringify(description);
    if (serialized === shown) return;
    shown = serialized;
    title.textContent = description.title;
    lines.replaceChildren(...description.lines.map(lineItem));
    meters.replaceChildren(...description.meters.map(meterRow));
    meters.hidden = description.meters.length === 0;
    storehouse.replaceChildren(...(description.storehouse ? storehousePanel(description.storehouse, ordersOf(state, description.storehouse.id)) : []));
    storehouse.hidden = !description.storehouse;
    const tradeYard = description.tradeYard;
    const slotActions = (id: number) => ({
      setExport: (slot: number, good: TradeGood | null) => setExportSlot(state, id, slot, good),
      setImport: (slot: number, good: TradeGood, loads: number) => setImportSlot(state, id, slot, good, loads),
    });
    yard.replaceChildren(...(tradeYard ? yardPanel(tradeYard, slotActions(tradeYard.id)) : []));
    yard.hidden = !tradeYard;
    actions.replaceChildren(...(description.openRoute === undefined ? [] : [openRouteButton(description.openRoute)]));
    actions.hidden = description.openRoute === undefined;
  }

function openRouteButton(guildId: number): HTMLButtonElement {
  const button = document.createElement('button');
  button.textContent = 'Open route';
  button.addEventListener('click', () => openRouteFor(guildId));
  return button;
}

  function close(): void {
    if (panel.hidden) return;
    panel.hidden = true;
    look = null;
    highlight.show([]);
    resumeAfterInspection(state);
  }

  byId('inspector-close').addEventListener('click', close);

  return {
    open(next) {
      pauseForInspection(state);
      look = next;
      show(look());
      panel.hidden = false;
    },
    refresh() {
      if (look) show(look());
    },
    close,
    isOpen: () => !panel.hidden,
  };
}

function ordersOf(state: GameState, id: number): StorehouseOrders {
  const storehouse = () => {
    const found = buildingById(state, id);
    if (!found) throw new Error(`Storehouse ${id} is gone`);
    return found;
  };
  return {
    accept: (good, accepted) => setGoodAccepted(storehouse(), good, accepted),
    acceptAll: (accepted) => setAllAccepted(storehouse(), accepted),
  };
}

function lineItem(
line: string): HTMLLIElement {
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

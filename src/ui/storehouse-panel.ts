import { element } from './dom';
import type { StorehouseBay, StorehouseOrder, StorehouseView } from '../sim/inspect';
import type { StoredGood } from '../sim/storehouse';
import { GOOD_COLORS, GOOD_ICONS } from './good-icons';

export interface StorehouseOrders {
  accept(good: StoredGood, accepted: boolean): void;
  acceptAll(accepted: boolean): void;
}

export function storehousePanel(view: StorehouseView, orders: StorehouseOrders): HTMLElement[] {
  return [shelf(view.bays), summary(view), ordersHead(orders), ...view.orders.map((order) => orderRow(order, orders))];
}

function goodIcon(good: StoredGood | null): HTMLSpanElement {
  const span = element('span', 'good-icon');
  if (good) span.innerHTML = GOOD_ICONS[good];
  return span;
}

function shelf(bays: StorehouseBay[]): HTMLDivElement {
  return element(
    'div',
    'shelf',
    element('div', 'shelf-bays', ...bays.map(bay)),
    element('div', 'shelf-plank'),
    element('div', 'shelf-icons', ...bays.map((b) => goodIcon(b.good))),
  );
}

function bay({ good, loads, refused }: StorehouseBay): HTMLDivElement {
  if (!good) {
    const empty = element('div', 'shelf-bay shelf-bay-empty');
    empty.title = 'Empty slot';
    return empty;
  }
  const cell = element('div', `shelf-bay${refused ? ' shelf-bay-refused' : ''}`);
  cell.title = `${good}: ${loads} ${loads === 1 ? 'load' : 'loads'}${refused ? ', refused' : ''}`;
  for (let i = 0; i < loads; i++) {
    const crate = element('span', 'shelf-crate');
    crate.style.background = GOOD_COLORS[good];
    cell.append(crate);
  }
  return cell;
}

function summary(view: StorehouseView): HTMLDivElement {
  return element('div', 'store-summary', element('span', '', view.loads), element('span', '', view.free));
}

function button(label: string, onClick: () => void, className = ''): HTMLButtonElement {
  const b = element('button', className, label);
  b.type = 'button';
  b.addEventListener('click', onClick);
  return b;
}

function ordersHead(orders: StorehouseOrders): HTMLDivElement {
  return element(
    'div',
    'orders-head',
    element('b', '', 'Orders'),
    button('Accept all', () => orders.acceptAll(true)),
    button('Refuse all', () => orders.acceptAll(false)),
  );
}

function orderRow({ good, name, accepted }: StorehouseOrder, orders: StorehouseOrders): HTMLDivElement {
  const accept = button('Accept', () => orders.accept(good, true), accepted ? 'order-accepted' : '');
  const refuse = button('Refuse', () => orders.accept(good, false), accepted ? '' : 'order-refused');
  accept.setAttribute('aria-pressed', String(accepted));
  refuse.setAttribute('aria-pressed', String(!accepted));
  return element('div', 'order', goodIcon(good), element('span', '', name), element('span', 'order-switch', accept, refuse));
}

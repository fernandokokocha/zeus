import { buildingById, type GameState } from '../sim/state';
import { PARTNER_CARAVANS, openRoute, worldReport, type Partner, type PartnerView, type TradeOffer } from '../sim/trade';
import { byId } from './dom';

const SVG = 'http://www.w3.org/2000/svg';
const OUR_COLOR = '#2f5d9b';
const PARTNER_COLORS: Record<Partner, string> = {
  melanthos: '#4f8a3c',
  kerynthos: '#c9962e',
  argyra: '#a8322d',
  halikeia: '#6d3f8f',
};
const MAP = { width: 600, height: 280 };
const OUR_CITY = { x: 540, y: 140 };
const CROSSROADS = { x: 450, y: 140 };
const PIXELS_PER_MONTH = 42;
const PARTNER_ROWS: Record<Partner, number> = { melanthos: 40, kerynthos: 105, argyra: 175, halikeia: 240 };
const CITY_RADIUS = 16;

export interface World {
  update(): void;
  chooseFor(guildId: number): void;
}

function svg<K extends keyof SVGElementTagNameMap>(tag: K, attributes: Record<string, string | number>, text = ''): SVGElementTagNameMap[K] {
  const node = document.createElementNS(SVG, tag);
  for (const [name, value] of Object.entries(attributes)) node.setAttribute(name, String(value));
  node.textContent = text;
  return node;
}

function element<K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text = ''): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.className = className;
  node.textContent = text;
  return node;
}

function partnerAt(view: PartnerView): { x: number; y: number } {
  return { x: CROSSROADS.x - view.roundTripMonths * PIXELS_PER_MONTH, y: PARTNER_ROWS[view.partner] };
}

function months(count: number): string {
  return `${count} ${count === 1 ? 'month' : 'months'}`;
}

export function createWorld(state: GameState, topbar: { showStatus(text: string): void }): World {
  const panel = byId('world');
  const prompt = byId('world-prompt');
  const map = byId<HTMLElement>('world-map');
  const details = byId('world-details');
  let selected: Partner | null = null;
  let choosingFor: number | null = null;
  let shown = '';

  function open(): void {
    panel.hidden = false;
    update();
  }

  function close(): void {
    panel.hidden = true;
    choosingFor = null;
  }

  function choose(view: PartnerView): void {
    selected = view.partner;
    if (choosingFor !== null && view.available) {
      const result = openRoute(state, choosingFor, view.partner);
      if (result.ok) choosingFor = null;
      else topbar.showStatus(result.reason);
    }
    update();
  }

  function drawMap(report: PartnerView[]): SVGSVGElement {
    const drawing = svg('svg', { viewBox: `0 0 ${MAP.width} ${MAP.height}`, class: 'world-drawing' });
    drawing.append(svg('rect', { x: 0, y: 0, width: MAP.width, height: MAP.height, class: 'world-land' }));
    drawing.append(svg('line', { x1: CROSSROADS.x, y1: CROSSROADS.y, x2: OUR_CITY.x, y2: OUR_CITY.y, class: 'world-road' }));
    for (const view of report) {
      const at = partnerAt(view);
      const bend = { x: CROSSROADS.x - 30, y: at.y };
      drawing.append(svg('polyline', { points: `${CROSSROADS.x},${CROSSROADS.y} ${bend.x},${bend.y} ${at.x},${at.y}`, class: 'world-road' }));
      drawing.append(svg('text', { x: (bend.x + at.x) / 2, y: at.y - 6, class: 'world-trip' }, months(view.roundTripMonths)));
    }
    for (const view of report) {
      const at = partnerAt(view);
      const city = svg('g', { class: cityClass(view) });
      city.append(svg('circle', { cx: at.x, cy: at.y, r: CITY_RADIUS, fill: PARTNER_COLORS[view.partner] }));
      city.append(svg('text', { x: at.x, y: at.y + CITY_RADIUS + 13, class: 'world-name' }, view.name));
      city.addEventListener('click', () => choose(view));
      drawing.append(city);
    }
    drawing.append(svg('circle', { cx: OUR_CITY.x, cy: OUR_CITY.y, r: CITY_RADIUS, fill: OUR_COLOR, class: 'world-ours' }));
    drawing.append(svg('text', { x: OUR_CITY.x, y: OUR_CITY.y + CITY_RADIUS + 13, class: 'world-name' }, 'Our city'));
    return drawing;
  }

  function cityClass(view: PartnerView): string {
    const classes = ['world-city'];
    if (view.partner === selected) classes.push('world-selected');
    if (choosingFor !== null) classes.push(view.available ? 'world-choosable' : 'world-taken');
    return classes.join(' ');
  }

  function offerTable(heading: string, priceHeading: string, offers: TradeOffer[]): HTMLElement {
    const section = element('div', 'ledger-section');
    section.append(element('h3', '', heading));
    const table = element('table', 'ledger-table');
    const head = element('tr');
    head.append(element('th', '', 'Good'), element('th', '', priceHeading), element('th', '', 'Caravan load'));
    table.append(head);
    for (const offer of offers) {
      const row = element('tr');
      row.append(element('td', '', offer.name), element('td', '', `${offer.price} dr`), element('td', '', `${offer.load} loads`));
      table.append(row);
    }
    section.append(table);
    return section;
  }

  function drawDetails(view: PartnerView | undefined): HTMLElement[] {
    if (view === undefined) return [element('p', 'world-hint', 'Click a city to see what it trades.')];
    const title = element('h3', 'world-partner', view.name);
    title.style.borderColor = PARTNER_COLORS[view.partner];
    return [
      title,
      element('p', '', `Round trip: ${months(view.roundTripMonths)}`),
      element('p', '', `Route: ${view.route}`),
      element('p', '', `Caravans: ${view.caravansHome} of ${PARTNER_CARAVANS} at home`),
      offerTable('Buys from us', 'They pay', view.buys),
      offerTable('Sells to us', 'We pay', view.sells),
    ];
  }

  function promptText(guildId: number): string {
    const guild = buildingById(state, guildId);
    if (guild === undefined) throw new Error(`Building ${guildId} is gone`);
    return `Choose a partner for the Traders' Guild at ${guild.x},${guild.y}`;
  }

  function update(): void {
    if (panel.hidden) return;
    if (choosingFor !== null && buildingById(state, choosingFor) === undefined) choosingFor = null;
    const report = worldReport(state);
    const key = JSON.stringify({ report, selected, choosingFor });
    if (key === shown) return;
    shown = key;
    prompt.textContent = choosingFor === null ? '' : promptText(choosingFor);
    prompt.hidden = choosingFor === null;
    map.replaceChildren(drawMap(report));
    details.replaceChildren(...drawDetails(report.find((view) => view.partner === selected)));
  }

  byId('world-button').addEventListener('click', () => (panel.hidden ? open() : close()));
  byId('world-close').addEventListener('click', close);
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });

  return {
    update,
    chooseFor(guildId) {
      choosingFor = guildId;
      shown = '';
      open();
    },
  };
}

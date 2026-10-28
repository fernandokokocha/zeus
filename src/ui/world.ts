import { PLACES, type Place } from '../sim/greece';
import { buildingById, type GameState } from '../sim/state';
import { PARTNERS, PARTNER_CARAVANS, openRoute, worldReport, type Partner, type PartnerView, type TradeOffer } from '../sim/trade';
import { byId } from './dom';
import { GREECE_BOUNDS, GREECE_LAND } from './greece-land';

const SVG = 'http://www.w3.org/2000/svg';
const OUR_COLOR = '#2f5d9b';
const PARTNER_COLORS: Record<Partner, string> = {
  thebes: '#4f8a3c',
  corinth: '#a8322d',
  argos: '#c9962e',
  sparta: '#6d3f8f',
};
const MAP_WIDTH = 600;
const MID_LATITUDE_COS = Math.cos((((GREECE_BOUNDS.south + GREECE_BOUNDS.north) / 2) * Math.PI) / 180);
const PIXELS_PER_DEGREE = MAP_WIDTH / ((GREECE_BOUNDS.east - GREECE_BOUNDS.west) * MID_LATITUDE_COS);
const MAP_HEIGHT = (GREECE_BOUNDS.north - GREECE_BOUNDS.south) * PIXELS_PER_DEGREE;
const OUR_CITY: Place = 'athens';
const CITY_RADIUS = 9;
const STOP_RADIUS = 3;
const LINE_HEIGHT = 12;
type Side = 'above' | 'below' | 'left' | 'right';
const LABEL_SIDES: Record<Place, Side> = {
  athens: 'right',
  eleusis: 'below',
  eleutherae: 'right',
  thebes: 'above',
  megara: 'below',
  isthmus: 'above',
  corinth: 'left',
  mycenae: 'right',
  argos: 'right',
  tegea: 'left',
  sparta: 'below',
};

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

function project(place: Place): { x: number; y: number } {
  const { lon, lat } = PLACES[place];
  return { x: (lon - GREECE_BOUNDS.west) * MID_LATITUDE_COS * PIXELS_PER_DEGREE, y: (GREECE_BOUNDS.north - lat) * PIXELS_PER_DEGREE };
}

function label(place: Place, radius: number, lines: { text: string; className: string }[]): SVGTextElement[] {
  const at = project(place);
  const gap = radius + 4;
  const stack = (lines.length - 1) * LINE_HEIGHT;
  const anchors: Record<Side, { x: number; y: number; anchor: string }> = {
    above: { x: at.x, y: at.y - gap - stack, anchor: 'middle' },
    below: { x: at.x, y: at.y + gap + 9, anchor: 'middle' },
    left: { x: at.x - gap, y: at.y + 4 - stack / 2, anchor: 'end' },
    right: { x: at.x + gap, y: at.y + 4 - stack / 2, anchor: 'start' },
  };
  const { x, y, anchor } = anchors[LABEL_SIDES[place]];
  return lines.map((line, i) => svg('text', { x, y: y + i * LINE_HEIGHT, 'text-anchor': anchor, class: line.className }, line.text));
}

function roadPoints(partner: Partner): string {
  return PARTNERS[partner].road.map((place) => `${project(place).x},${project(place).y}`).join(' ');
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
    const drawing = svg('svg', { viewBox: `0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`, class: 'world-drawing' });
    drawing.append(svg('rect', { x: 0, y: 0, width: MAP_WIDTH, height: MAP_HEIGHT, class: 'world-sea' }));
    drawing.append(svg('path', { d: GREECE_LAND, class: 'world-land' }));
    for (const view of report) drawing.append(svg('polyline', { points: roadPoints(view.partner), class: 'world-road' }));
    const partners: Place[] = report.map((view) => view.partner);
    const stops = new Set(report.flatMap((view) => PARTNERS[view.partner].road).filter((place) => place !== OUR_CITY && !partners.includes(place)));
    for (const stop of stops) {
      const at = project(stop);
      drawing.append(svg('circle', { cx: at.x, cy: at.y, r: STOP_RADIUS, class: 'world-stop' }));
      drawing.append(...label(stop, STOP_RADIUS, [{ text: PLACES[stop].name, className: 'world-stop-name' }]));
    }
    for (const view of report) {
      const at = project(view.partner);
      const city = svg('g', { class: cityClass(view) });
      city.append(svg('circle', { cx: at.x, cy: at.y, r: CITY_RADIUS, fill: PARTNER_COLORS[view.partner] }));
      city.append(
        ...label(view.partner, CITY_RADIUS, [
          { text: view.name, className: 'world-name' },
          { text: months(view.roundTripMonths), className: 'world-trip' },
        ]),
      );
      city.addEventListener('click', () => choose(view));
      drawing.append(city);
    }
    const home = project(OUR_CITY);
    drawing.append(svg('circle', { cx: home.x, cy: home.y, r: CITY_RADIUS, fill: OUR_COLOR, class: 'world-ours' }));
    drawing.append(...label(OUR_CITY, CITY_RADIUS, [{ text: PLACES[OUR_CITY].name, className: 'world-name' }]));
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

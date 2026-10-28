import type { Accounts, TreasuryReport } from '../sim/treasury';
import { UNITS_PER_LOAD } from '../sim/food';
import type { PopulationReport } from '../sim/population';
import type { ProductionReport } from '../sim/production';
import { NO_PRIORITY, type Industry, type Priority } from '../sim/industries';
import type { PrioritiesReport } from '../sim/labor';
import type { Tally } from '../sim/trade-books';
import type { GoodRow, TradeReport } from '../sim/trade-ledger';

const MIN_AXIS_TOP = 10;
const AXIS_STEPS = [1, 2, 5];
const MONTHS_PER_YEAR = 12;
const NO_YEAR = '–';
const NO_CARGO = '–';
const PRIORITIES: Priority[] = [NO_PRIORITY, 1, 2, 3];
const INCOME: (keyof Accounts)[] = ['taxes', 'trade'];
const SPENDING: (keyof Accounts)[] = ['wages', 'construction', 'sheep', 'imports'];
const ACCOUNT_NAMES: Record<keyof Accounts, string> = { taxes: 'Taxes', trade: 'Trade', wages: 'Wages', construction: 'Construction', sheep: 'Sheep', imports: 'Imports' };

const GRAPH = { width: 560, height: 170, left: 44, bottom: 22, top: 8 };

export function axisTop(max: number): number {
  for (let power = MIN_AXIS_TOP; ; power *= 10) {
    for (const step of AXIS_STEPS) if (step * power >= max) return step * power;
  }
}

export function graphPoints(values: number[], width: number, height: number, top: number): { x: number; y: number }[] {
  const spacing = values.length > 1 ? width / (values.length - 1) : 0;
  return values.map((value, month) => ({ x: month * spacing, y: height - (value / top) * height }));
}

export function madeShare(made: number, possible: number): number {
  if (possible === 0) return 0;
  return made / possible;
}

export function net(accounts: Accounts): number {
  const sum = (keys: (keyof Accounts)[]) => keys.reduce((total, key) => total + accounts[key], 0);
  return sum(INCOME) - sum(SPENDING);
}

function element<K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text = ''): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function count(value: number): string {
  return value.toLocaleString('en-US');
}

export function loads(units: number): string {
  return (units / UNITS_PER_LOAD).toLocaleString('en-US', { maximumFractionDigits: 1 });
}

export function drachmas(value: number): string {
  const whole = Math.round(value);
  return `${count(whole === 0 ? 0 : whole)} dr`;
}

function table(headings: string[], rows: (string | HTMLElement)[][]): HTMLTableElement {
  const result = element('table', 'ledger-table');
  const head = result.createTHead().insertRow();
  for (const heading of headings) head.append(element('th', '', heading));
  const body = result.createTBody();
  for (const cells of rows) {
    const row = body.insertRow();
    for (const cell of cells) row.insertCell().append(cell);
  }
  return result;
}

function section(title: string, ...content: Element[]): HTMLElement {
  const result = element('section', 'ledger-section');
  result.append(element('h3', '', title), ...content);
  return result;
}

const SVG = 'http://www.w3.org/2000/svg';

function svg<K extends keyof SVGElementTagNameMap>(tag: K, attributes: Record<string, string | number>, text = ''): SVGElementTagNameMap[K] {
  const node = document.createElementNS(SVG, tag);
  for (const [name, value] of Object.entries(attributes)) node.setAttribute(name, String(value));
  if (text) node.textContent = text;
  return node;
}

function populationGraph(history: number[]): SVGSVGElement {
  const plotWidth = GRAPH.width - GRAPH.left;
  const plotHeight = GRAPH.height - GRAPH.bottom - GRAPH.top;
  const top = axisTop(Math.max(...history));
  const graph = svg('svg', { class: 'ledger-graph', viewBox: `0 0 ${GRAPH.width} ${GRAPH.height}` });
  const plot = svg('g', { transform: `translate(${GRAPH.left} ${GRAPH.top})` });
  graph.append(plot);

  for (const value of [0, top / 2, top]) {
    const y = plotHeight - (value / top) * plotHeight;
    plot.append(svg('line', { class: 'grid', x1: 0, x2: plotWidth, y1: y, y2: y }));
    plot.append(svg('text', { class: 'axis', x: -6, y: y + 4, 'text-anchor': 'end' }, count(value)));
  }
  const points = graphPoints(history, plotWidth, plotHeight, top);
  for (let month = 0; month < history.length; month += MONTHS_PER_YEAR) {
    const x = points[month].x;
    plot.append(svg('line', { class: 'grid', x1: x, x2: x, y1: 0, y2: plotHeight }));
    plot.append(svg('text', { class: 'axis', x: x + 3, y: plotHeight + 15 }, `Year ${month / MONTHS_PER_YEAR + 1}`));
  }
  const line = points.map(({ x, y }) => `${x},${y}`).join(' ');
  const last = points[points.length - 1];
  plot.append(svg('polygon', { class: 'area', points: `0,${plotHeight} ${line} ${last.x},${plotHeight}` }));
  plot.append(svg('polyline', { class: 'line', points: line }));
  return graph;
}

export function populationChapter(report: PopulationReport): HTMLElement {
  const body = element('div');
  const housing = table(
    ['Level', 'Houses', 'People'],
    report.levels.map(({ name, houses, people }) => [name, count(houses), count(people)]),
  );
  const blockers = table(
    ['Not evolving because', 'Houses'],
    report.blockers.map(({ reason, houses }) => [reason, count(houses)]),
  );
  body.append(
    section('Population by month', populationGraph(report.history)),
    section('Housing', housing),
    section('What holds houses back', blockers),
  );
  return body;
}

function productionBar(made: number, possible: number): HTMLElement {
  const bar = element('div', 'production-bar');
  const track = element('div', 'possible');
  const solid = element('div', 'made');
  solid.style.width = `${madeShare(made, possible) * 100}%`;
  track.append(solid);
  bar.append(track, element('span', '', possible === 0 ? 'no buildings' : `${loads(made)} / ${loads(possible)}`));
  return bar;
}

export function productionChapter(report: ProductionReport): HTMLElement {
  const rows = report.goods.map(({ name, made, possible, used, wanted, stock, status }) => [
    name,
    productionBar(made, possible),
    `${loads(used)} / ${loads(wanted)}`,
    loads(stock),
    element('span', `status ${status}`, status),
  ]);
  return section(
    'Last 12 months, in loads',
    table(['Good', 'Made / could make', 'Used / wanted', 'In stock', 'Status'], rows),
  );
}

export interface PriorityControls {
  setPriority(industry: Industry, priority: Priority): void;
  setOpen(industry: Industry, open: boolean): void;
}

function priorityPicker(industry: Industry, current: Priority, controls: PriorityControls): HTMLElement {
  const picker = element('div', 'priority-picker');
  for (const priority of PRIORITIES) {
    const button = element('button', priority === current ? 'active' : '', priority === NO_PRIORITY ? '–' : String(priority));
    button.title = priority === NO_PRIORITY ? 'No priority' : `Priority ${priority}`;
    button.addEventListener('click', () => controls.setPriority(industry, priority));
    picker.append(button);
  }
  return picker;
}

function openSwitch(industry: Industry, open: boolean, controls: PriorityControls): HTMLElement {
  const button = element('button', open ? 'open-switch' : 'open-switch closed', open ? 'Open' : 'Closed');
  button.addEventListener('click', () => controls.setOpen(industry, !open));
  return button;
}

export function prioritiesChapter(report: PrioritiesReport, controls: PriorityControls): HTMLElement {
  const body = element('div');
  const summary = element('p', 'ledger-summary', `Workers ${count(report.workers)} for ${count(report.jobs)} jobs`);
  const rows = report.industries.map(({ industry, name, buildings, workers, jobs, priority, open }) => [
    name,
    count(buildings),
    `${count(workers)} / ${count(jobs)}`,
    priorityPicker(industry, priority, controls),
    openSwitch(industry, open, controls),
  ]);
  body.append(summary, section('Industries', table(['Industry', 'Buildings', 'Workers', 'Priority', ''], rows)));
  return body;
}

function signed(value: number): HTMLElement {
  return element('span', Math.round(value) < 0 ? 'negative' : '', drachmas(value));
}

export function treasuryChapter(report: TreasuryReport): HTMLElement {
  const body = element('div');
  const { thisYear, lastYear } = report;
  const lastYearCell = (cell: (accounts: Accounts) => string | HTMLElement) => (lastYear ? cell(lastYear.accounts) : NO_YEAR);
  const accountRow = (key: keyof Accounts) => [ACCOUNT_NAMES[key], drachmas(thisYear.accounts[key]), lastYearCell((accounts) => drachmas(accounts[key]))];
  const group = (title: string) => [element('strong', '', title), '', ''];
  const rows = [
    group('Income'),
    ...INCOME.map(accountRow),
    group('Spending'),
    ...SPENDING.map(accountRow),
    [element('strong', '', 'Net'), signed(net(thisYear.accounts)), lastYearCell((accounts) => signed(net(accounts)))],
  ];
  body.append(
    element('p', 'ledger-summary', `Treasury now: ${drachmas(report.treasury)}`),
    section('Income and spending', table(['', thisYear.label, lastYear ? lastYear.label : 'Last year'], rows)),
  );
  return body;
}

function note(text: string): HTMLElement {
  return element('p', 'ledger-summary', text);
}

function tableOrNote(headings: string[], rows: (string | HTMLElement)[][], empty: string): HTMLElement {
  return rows.length === 0 ? note(empty) : table(headings, rows);
}

function tally({ loads, drachmas: value }: Tally): string {
  return `${count(loads)} ${loads === 1 ? 'load' : 'loads'}, ${drachmas(value)}`;
}

function goodsTable(rows: GoodRow[], years: TradeReport['years'], empty: string): HTMLElement {
  const cells = rows.map(({ name, thisYear, lastYear }) => [name, tally(thisYear), lastYear ? tally(lastYear) : NO_YEAR]);
  return tableOrNote(['Good', years.thisYear, years.lastYear ?? 'Last year'], cells, empty);
}

export function tradeChapter(report: TradeReport): HTMLElement {
  const body = element('div');
  const routes = report.routes.map(({ guild, partner, roundTripMonths }) => [partner, guild, `${roundTripMonths} months`]);
  const caravans = report.caravans.map(({ partner, trade, goods, value, where }) => [partner, trade, goods ?? NO_CARGO, value === null ? NO_CARGO : drachmas(value), where]);
  body.append(
    section('Routes', tableOrNote(['Partner', 'Guild', 'Round trip'], routes, "No routes open. A Traders' Guild opens one from its inspector.")),
    section('Caravans', tableOrNote(['Partner', 'Trade', 'Goods', 'Value', 'Where'], caravans, 'No caravans out')),
    section('Exports', goodsTable(report.exports, report.years, 'No exports yet')),
    section('Imports', goodsTable(report.imports, report.years, 'No imports yet')),
  );
  return body;
}

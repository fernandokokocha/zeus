import { appealMap } from './appeal';
import { BUILDING_SPECS, isAgoraVendor, vendorGood, type BuildingType } from './buildings';
import { CULTURES, CULTURE_POINTS, culturePoints } from './culture';
import { taxPaidLastYear } from './economy';
import { VENDOR_CAPACITY, houseStockTarget } from './food';
import { eliteSiteTiles, guildRange, placeableEliteSites } from './elite-sites';
import { ELITE_HOUSING, buildingName, houseLevel, isResidence, type EliteType } from './housing';
import { isEliteType } from './elites';
import { SICK_LINE, amount, drachmas } from './inspect';
import { isUnderConstruction } from './sanctuaries';
import { COVERAGE_MONTHS, serviceLeft } from './roamers';
import { canBurn, canCollapse, riskShare } from './safety';
import type { Point } from './point';
import { NO_BUILDING, buildingById, inBounds, tileIndex, type Building, type CarrierKind, type Culture, type GameState, type PeddledGood, type RoamerKind, type TraineeKind } from './state';

export const OVERLAYS = ['water', 'supplies', 'culture', 'appeal', 'risk', 'disease', 'tax', 'staffing', 'eliteSites'] as const;

export type Overlay = (typeof OVERLAYS)[number];
export type TintOverlay = 'appeal' | 'eliteSites';
export type ColumnOverlay = Exclude<Overlay, TintOverlay>;

export type Reading = number | null;

export type ColumnKind = 'water' | PeddledGood | Culture | 'fire' | 'collapse' | 'disease' | 'plague' | 'tax' | 'staff';

export interface ColumnPart {
  kind: ColumnKind;
  share: number;
}

export interface Column {
  building: Building;
  bars: ColumnPart[][];
  details: string[];
}

export interface Report {
  name: string;
  details: string[];
}

export type Look = 'reported' | 'serving' | 'faded';

const SERVERS: Record<Overlay, BuildingType[]> = {
  water: ['fountain'],
  supplies: ['granary', 'storehouse', 'agora'],
  culture: ['college', 'podium', 'gymnasium', 'dramaSchool', 'theater'],
  appeal: [],
  risk: ['maintenanceOffice'],
  disease: ['infirmary'],
  tax: ['taxOffice', 'palace'],
  staffing: [],
  eliteSites: [],
};

export type WalkerKind = RoamerKind | CarrierKind | TraineeKind;

export const SERVING_WALKERS: Record<Overlay, WalkerKind[]> = {
  water: ['waterCarrier'],
  supplies: ['peddler', 'cartPusher', 'carrotCart', 'buyer', 'fleeceCart', 'fleeceBuyer', 'oilCart', 'oilBuyer', 'clothCart', 'clothBuyer', 'scrollBuyer'],
  culture: ['philosopher', 'athlete', 'actor', 'philosopherTrainee', 'actorTrainee'],
  appeal: [],
  risk: ['superintendent'],
  disease: ['healer'],
  tax: ['taxCollector'],
  staffing: [],
  eliteSites: [],
};

type ColumnReader = (state: GameState, building: Building) => Omit<Column, 'building'> | null;

function occupiedResidence<T>(read: (state: GameState, residence: Building) => T): (state: GameState, building: Building) => T | null {
  return (state, building) => (isResidence(building) && building.residents > 0 ? read(state, building) : null);
}

function months(count: number): string {
  return count.toFixed(1);
}

function percent(share: number): string {
  return `${Math.round(share * 100)}%`;
}

function cultureLine(state: GameState, residence: Building, culture: Culture): string {
  const share = serviceLeft(state, residence, culture);
  if (share === 0) return `${capitalized(culture)}: none`;
  return `${capitalized(culture)} ${CULTURE_POINTS[culture]}: ${months(share * COVERAGE_MONTHS[culture])} months left`;
}

function cultureColumn(state: GameState, residence: Building): Omit<Column, 'building'> {
  return {
    bars: CULTURES.map((culture) => [{ kind: culture, share: serviceLeft(state, residence, culture) }]),
    details: [`Culture: ${culturePoints(state, residence)} points`, ...CULTURES.map((culture) => cultureLine(state, residence, culture))],
  };
}

function capitalized(word: string): string {
  return word[0].toUpperCase() + word.slice(1);
}

function riskColumn(building: Building): Omit<Column, 'building'> | null {
  const risks = [
    { kind: 'fire' as const, name: 'Fire risk', present: canBurn(building), share: riskShare(building.fireRisk) },
    { kind: 'collapse' as const, name: 'Collapse risk', present: canCollapse(building), share: riskShare(building.collapseRisk) },
  ].filter((risk) => risk.present);
  if (risks.length === 0) return null;
  const higher = risks.reduce((high, risk) => (risk.share > high.share ? risk : high));
  return { bars: [[{ kind: higher.kind, share: higher.share }]], details: risks.map((risk) => `${risk.name} ${percent(risk.share)}`) };
}

function diseaseColumn(residence: Building): Omit<Column, 'building'> {
  const share = riskShare(residence.diseaseRisk);
  const risk = `Disease risk ${percent(share)}`;
  if (residence.sick) return { bars: [[{ kind: 'plague', share: 1 }]], details: [risk, SICK_LINE] };
  return { bars: [[{ kind: 'disease', share }]], details: [risk] };
}

function staffColumn(building: Building): Omit<Column, 'building'> | null {
  const { workers } = BUILDING_SPECS[building.type];
  if (workers === 0 || isUnderConstruction(building)) return null;
  return { bars: [[{ kind: 'staff', share: building.workers / workers }]], details: [`Workers ${building.workers} / ${workers}`] };
}

const HOUSE_SUPPLIES: PeddledGood[] = ['food', 'fleece', 'oil'];

function suppliesColumn(residence: Building): Omit<Column, 'building'> {
  const goods = isEliteType(residence.type) ? [...HOUSE_SUPPLIES, ELITE_HOUSING[residence.type].good] : HOUSE_SUPPLIES;
  return {
    bars: goods.map((good) => [{ kind: good, share: Math.min(1, residence[good] / houseStockTarget(residence, good)) }]),
    details: goods.map((good) => `${capitalized(good)} ${amount(residence[good])} / ${amount(houseStockTarget(residence, good))}`),
  };
}

function vendorColumn(vendor: Building): Omit<Column, 'building'> {
  const good = vendorGood(vendor);
  return {
    bars: [[{ kind: good, share: vendor[good] / VENDOR_CAPACITY }]],
    details: [`${capitalized(good)} ${amount(vendor[good])} / ${amount(VENDOR_CAPACITY)}`],
  };
}

function biggestTaxPaid(state: GameState): number {
  return Math.max(0, ...state.buildings.filter((b) => isResidence(b) && houseLevel(b)).map(taxPaidLastYear));
}

function taxColumn(state: GameState, house: Building): Omit<Column, 'building'> {
  const paid = taxPaidLastYear(house);
  const biggest = biggestTaxPaid(state);
  return {
    bars: [[{ kind: 'tax', share: biggest > 0 ? paid / biggest : 0 }]],
    details: [`Tax paid, last 12 months: ${drachmas(paid)}`],
  };
}

const residenceSupplies = occupiedResidence((_, residence) => suppliesColumn(residence));

const COLUMN_READERS: Record<ColumnOverlay, ColumnReader> = {
  water: occupiedResidence((state, residence) => {
    const share = serviceLeft(state, residence, 'water');
    return {
      bars: [[{ kind: 'water', share }]],
      details: [share > 0 ? `Water: ${months(share * COVERAGE_MONTHS.water)} months left` : 'No water'],
    };
  }),
  supplies: (state, building) => (isAgoraVendor(building.type) ? vendorColumn(building) : residenceSupplies(state, building)),
  culture: occupiedResidence(cultureColumn),
  risk: (_, building) => riskColumn(building),
  disease: occupiedResidence((_, residence) => diseaseColumn(residence)),
  tax: occupiedResidence(taxColumn),
  staffing: (_, building) => staffColumn(building),
};

export function isColumnOverlay(overlay: Overlay): overlay is ColumnOverlay {
  return overlay in COLUMN_READERS;
}

export function overlayColumns(state: GameState, overlay: ColumnOverlay): Column[] {
  const read = COLUMN_READERS[overlay];
  return state.buildings.flatMap((building) => {
    const column = read(state, building);
    return column ? [{ building, ...column }] : [];
  });
}

export function overlayReport(state: GameState, overlay: Overlay, building: Building): Report | null {
  if (!isColumnOverlay(overlay)) return null;
  const reported = COLUMN_READERS[overlay](state, building);
  return reported ? { name: buildingName(building), details: reported.details } : null;
}

function signed(value: number): string {
  if (value > 0) return `+${value}`;
  return value < 0 ? `−${-value}` : '0';
}

export function overlayReportAt(state: GameState, overlay: Overlay, tile: Point): Report | null {
  if (!inBounds(state, tile.x, tile.y)) return null;
  const i = tileIndex(state, tile.x, tile.y);
  if (overlay === 'appeal') return { name: `Appeal ${signed(appealMap(state)[i])}`, details: [] };
  const id = state.buildingIdAt[i];
  if (id === NO_BUILDING) return null;
  const building = buildingById(state, id);
  if (!building) throw new Error(`Tile ${tile.x}, ${tile.y} names building ${id}, which does not exist`);
  return overlayReport(state, overlay, building);
}

export function buildingLook(state: GameState, overlay: Overlay, building: Building): Look {
  if (overlayReport(state, overlay, building)) return 'reported';
  return SERVERS[overlay].includes(building.type) ? 'serving' : 'faded';
}

export function overlayReadings(state: GameState, overlay: TintOverlay): Reading[] {
  if (overlay === 'appeal') return appealMap(state).map((appeal) => (appeal === 0 ? null : appeal));
  return eliteSiteReadings(state);
}

export const ELITE_SITE_READINGS = { guildRange: 0, tradersGuild: 1, scholarsHouse: 2 } satisfies Record<EliteType | 'guildRange', number>;

const PAINTED_LAST_WINS: EliteType[] = ['scholarsHouse', 'tradersGuild'];

function eliteSiteReadings(state: GameState): Reading[] {
  const readings: Reading[] = guildRange(state).map((inRange, i) => (inRange && !state.mainRoad[i] ? ELITE_SITE_READINGS.guildRange : null));
  const appeal = appealMap(state);
  for (const type of PAINTED_LAST_WINS) {
    for (const site of placeableEliteSites(state, type, appeal)) {
      for (const tile of eliteSiteTiles(site)) readings[tileIndex(state, tile.x, tile.y)] = ELITE_SITE_READINGS[type];
    }
  }
  return readings;
}

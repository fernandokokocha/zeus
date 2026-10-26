import { appealMap } from './appeal';
import { BUILDING_SPECS, type BuildingType } from './buildings';
import { CULTURE_POINTS, culturesPassed } from './culture';
import { taxPaidLastYear } from './economy';
import { houseStockTarget } from './food';
import { guildSiteTiles, placeableGuildSites, siteSurroundings } from './guild';
import { HOUSE_LEVELS, buildingName, houseLevel, isResidence } from './housing';
import { amount, drachmas } from './inspect';
import { isUnderConstruction } from './sanctuaries';
import { COVERAGE_MONTHS, serviceLeft } from './roamers';
import { canBurn, canCollapse, riskShare } from './safety';
import { tileIndex, type Building, type Culture, type GameState, type PeddledGood } from './state';

export const OVERLAYS = ['water', 'supplies', 'culture', 'appeal', 'risk', 'tax', 'staffing', 'guildSites'] as const;

export type Overlay = (typeof OVERLAYS)[number];
export type TintOverlay = 'appeal' | 'guildSites';
export type ColumnOverlay = Exclude<Overlay, TintOverlay>;

export type Reading = number | null;

export type ColumnKind = 'water' | PeddledGood | Culture | 'fire' | 'collapse' | 'tax' | 'staff';

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

const CULTURE_FULL_HEIGHT = HOUSE_LEVELS.townhouse.culture;

const DISTRIBUTION: BuildingType[] = ['granary', 'storehouse', 'agora', 'foodVendor', 'fleeceVendor', 'oilVendor', 'clothVendor'];

const SERVERS: Record<Overlay, BuildingType[]> = {
  water: ['fountain'],
  supplies: DISTRIBUTION,
  culture: ['college', 'podium', 'gymnasium', 'dramaSchool', 'theater'],
  appeal: [],
  risk: ['maintenanceOffice'],
  tax: ['taxOffice', 'palace'],
  staffing: [],
  guildSites: [],
};

type ColumnReader = (state: GameState, building: Building) => Omit<Column, 'building'> | null;

function occupiedResidence<T>(read: (state: GameState, residence: Building) => T): (state: GameState, building: Building) => T | null {
  return (state, building) => (isResidence(building) && building.residents > 0 ? read(state, building) : null);
}

function occupiedHouse<T>(read: (state: GameState, house: Building) => T): (state: GameState, building: Building) => T | null {
  return (state, building) => (building.type === 'house' && houseLevel(building) ? read(state, building) : null);
}

function months(count: number): string {
  return count.toFixed(1);
}

function percent(share: number): string {
  return `${Math.round(share * 100)}%`;
}

function cultureColumn(state: GameState, residence: Building): Omit<Column, 'building'> {
  const passed = culturesPassed(state, residence);
  const points = (culture: Culture) => (passed.includes(culture) ? CULTURE_POINTS[culture] : 0);
  const cultures = Object.keys(CULTURE_POINTS) as Culture[];
  const total = cultures.reduce((sum, culture) => sum + points(culture), 0);
  return {
    bars: [passed.map((culture) => ({ kind: culture, share: CULTURE_POINTS[culture] / CULTURE_FULL_HEIGHT }))],
    details: [`Culture: ${total} points`, cultures.map((culture) => `${capitalized(culture)} ${points(culture)}`).join(' · ')],
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

function staffColumn(building: Building): Omit<Column, 'building'> | null {
  const { workers } = BUILDING_SPECS[building.type];
  if (workers === 0 || isUnderConstruction(building)) return null;
  return { bars: [[{ kind: 'staff', share: building.workers / workers }]], details: [`Workers ${building.workers} / ${workers}`] };
}

const HOUSE_SUPPLIES: PeddledGood[] = ['food', 'fleece', 'oil'];
const GUILD_SUPPLIES: PeddledGood[] = [...HOUSE_SUPPLIES, 'cloth'];

function suppliesColumn(residence: Building): Omit<Column, 'building'> {
  const goods = residence.type === 'tradersGuild' ? GUILD_SUPPLIES : HOUSE_SUPPLIES;
  return {
    bars: goods.map((good) => [{ kind: good, share: Math.min(1, residence[good] / houseStockTarget(residence, good)) }]),
    details: goods.map((good) => `${capitalized(good)} ${amount(residence[good])} / ${amount(houseStockTarget(residence, good))}`),
  };
}

function biggestTaxPaid(state: GameState): number {
  return Math.max(0, ...state.buildings.filter((b) => b.type === 'house' && houseLevel(b)).map(taxPaidLastYear));
}

function taxColumn(state: GameState, house: Building): Omit<Column, 'building'> {
  const paid = taxPaidLastYear(house);
  const biggest = biggestTaxPaid(state);
  return {
    bars: [[{ kind: 'tax', share: biggest > 0 ? paid / biggest : 0 }]],
    details: [`Tax paid, last 12 months: ${drachmas(paid)}`],
  };
}

const COLUMN_READERS: Record<ColumnOverlay, ColumnReader> = {
  water: occupiedResidence((state, residence) => {
    const share = serviceLeft(state, residence, 'water');
    return {
      bars: [[{ kind: 'water', share }]],
      details: [share > 0 ? `Water: ${months(share * COVERAGE_MONTHS.water)} months left` : 'No water'],
    };
  }),
  supplies: occupiedResidence((_, residence) => suppliesColumn(residence)),
  culture: occupiedResidence(cultureColumn),
  risk: (_, building) => riskColumn(building),
  tax: occupiedHouse(taxColumn),
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

export function buildingLook(state: GameState, overlay: Overlay, building: Building): Look {
  if (overlayReport(state, overlay, building)) return 'reported';
  return SERVERS[overlay].includes(building.type) ? 'serving' : 'faded';
}

export function overlayReadings(state: GameState, overlay: TintOverlay): Reading[] {
  if (overlay === 'appeal') return appealMap(state).map((appeal) => (appeal === 0 ? null : appeal));
  return guildSiteReadings(state);
}

export const GUILD_SITE_READINGS = { inRange: 0, placeable: 1 };

function guildSiteReadings(state: GameState): Reading[] {
  const around = siteSurroundings(state);
  const readings = around.inRange.map((inRange, i) => (inRange && !state.mainRoad[i] ? GUILD_SITE_READINGS.inRange : null));
  for (const site of placeableGuildSites(state, around)) {
    for (const tile of guildSiteTiles(site)) readings[tileIndex(state, tile.x, tile.y)] = GUILD_SITE_READINGS.placeable;
  }
  return readings;
}

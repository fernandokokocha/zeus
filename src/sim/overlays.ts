import { appealMap } from './appeal';
import { BUILDING_SPECS, type BuildingType } from './buildings';
import { footprint } from './commands';
import { CULTURE_POINTS, culturesPassed } from './culture';
import { monthlyUse } from './food';
import { guildSiteTiles, placeableGuildSites, siteSurroundings } from './guild';
import { HOUSE_LEVELS, buildingName, houseLevel, isResidence } from './housing';
import { isUnderConstruction } from './sanctuaries';
import { COVERAGE_MONTHS, serviceLeft } from './roamers';
import { canBurn, canCollapse, riskShare } from './safety';
import { tileIndex, type Building, type Culture, type GameState } from './state';

export const OVERLAYS = ['water', 'food', 'supply', 'culture', 'appeal', 'risk', 'tax', 'staffing', 'guildSites'] as const;

export type Overlay = (typeof OVERLAYS)[number];
export type ColumnOverlay = 'water' | 'culture' | 'risk' | 'staffing';
type BuildingTintOverlay = 'food' | 'supply' | 'tax';
type TileOverlay = 'appeal' | 'guildSites';
export type TintOverlay = BuildingTintOverlay | TileOverlay;

export type Reading = number | null;

export type ColumnKind = 'water' | Culture | 'fire' | 'collapse' | 'staff';

export interface ColumnPart {
  kind: ColumnKind;
  share: number;
}

export interface Column {
  building: Building;
  parts: ColumnPart[];
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
  food: DISTRIBUTION,
  supply: DISTRIBUTION,
  culture: ['college', 'podium', 'gymnasium', 'dramaSchool', 'theater'],
  appeal: [],
  risk: ['maintenanceOffice'],
  tax: ['taxOffice', 'palace'],
  staffing: [],
  guildSites: [],
};

interface Tint {
  reading: number;
  details: string[];
}

type ColumnReader = (state: GameState, building: Building) => Omit<Column, 'building'> | null;
type TintReader = (state: GameState, building: Building) => Tint | null;

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
    parts: passed.map((culture) => ({ kind: culture, share: CULTURE_POINTS[culture] / CULTURE_FULL_HEIGHT })),
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
  return { parts: [{ kind: higher.kind, share: higher.share }], details: risks.map((risk) => `${risk.name} ${percent(risk.share)}`) };
}

function staffColumn(building: Building): Omit<Column, 'building'> | null {
  const { workers } = BUILDING_SPECS[building.type];
  if (workers === 0 || isUnderConstruction(building)) return null;
  return { parts: [{ kind: 'staff', share: building.workers / workers }], details: [`Workers ${building.workers} / ${workers}`] };
}

const COLUMN_READERS: Record<ColumnOverlay, ColumnReader> = {
  water: occupiedResidence((state, residence) => {
    const share = serviceLeft(state, residence, 'water');
    return {
      parts: [{ kind: 'water', share }],
      details: [share > 0 ? `Water: ${months(share * COVERAGE_MONTHS.water)} months left` : 'No water'],
    };
  }),
  culture: occupiedResidence(cultureColumn),
  risk: (_, building) => riskColumn(building),
  staffing: (_, building) => staffColumn(building),
};

function monthsOfFood(house: Building): number {
  const use = monthlyUse(house, 'food');
  return use > 0 ? house.food / use : 0;
}

function held(amount: number): string {
  return amount > 0 ? 'some' : 'none';
}

const TINT_READERS: Record<BuildingTintOverlay, TintReader> = {
  food: occupiedResidence((_, residence) => {
    const reading = monthsOfFood(residence);
    return { reading, details: [`Food: ${months(reading)} months`] };
  }),
  supply: occupiedResidence((_, residence) => ({
    reading: Number(residence.fleece > 0) + Number(residence.oil > 0),
    details: [`Fleece: ${held(residence.fleece)} · Oil: ${held(residence.oil)}`],
  })),
  tax: occupiedHouse((state, house) => {
    const reading = serviceLeft(state, house, 'tax');
    return { reading, details: [reading > 0 ? `Tax: collected, due again in ${months(reading * COVERAGE_MONTHS.tax)} months` : 'Tax: not collected'] };
  }),
};

export function isColumnOverlay(overlay: Overlay): overlay is ColumnOverlay {
  return overlay in COLUMN_READERS;
}

function isTileOverlay(overlay: Overlay): overlay is TileOverlay {
  return overlay === 'appeal' || overlay === 'guildSites';
}

export function overlayColumns(state: GameState, overlay: ColumnOverlay): Column[] {
  const read = COLUMN_READERS[overlay];
  return state.buildings.flatMap((building) => {
    const column = read(state, building);
    return column ? [{ building, ...column }] : [];
  });
}

export function overlayReport(state: GameState, overlay: Overlay, building: Building): Report | null {
  if (isTileOverlay(overlay)) return null;
  const read = isColumnOverlay(overlay) ? COLUMN_READERS[overlay] : TINT_READERS[overlay];
  const reported = read(state, building);
  return reported ? { name: buildingName(building), details: reported.details } : null;
}

export function buildingLook(state: GameState, overlay: Overlay, building: Building): Look {
  if (overlayReport(state, overlay, building)) return 'reported';
  return SERVERS[overlay].includes(building.type) ? 'serving' : 'faded';
}

export function overlayReadings(state: GameState, overlay: TintOverlay): Reading[] {
  if (overlay === 'appeal') return appealMap(state).map((appeal) => (appeal === 0 ? null : appeal));
  if (overlay === 'guildSites') return guildSiteReadings(state);
  const readings = new Array<Reading>(state.size * state.size).fill(null);
  const read = TINT_READERS[overlay];
  for (const building of state.buildings) {
    const tint = read(state, building);
    if (tint === null) continue;
    for (const tile of footprint(building)) readings[tileIndex(state, tile.x, tile.y)] = tint.reading;
  }
  return readings;
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

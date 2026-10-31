import { appealMap, houseAppeal } from './appeal';
import { BUILDING_SPECS, footprintDistance, localToWorld, type BuildingType, type Placement } from './buildings';
import { CHARTERS } from './charters';
import { addBuilding, build, footprint, footprintObstacle, lotOrigins, removeBuildings } from './commands';
import { culturePoints } from './culture';
import { PLACES } from './greece';
import { ELITE_HOUSING, ELITE_NAMES, ELITE_TYPES, LEVEL_CHANGE_TICKS, hasNeed, houseLevel, withArticle, type EliteType } from './housing';
import { postNotice } from './notices';
import { rectBetween, tilesIn, type Point } from './point';
import { routeOf } from './trade';
import { buildingById, inBounds, tileIndex, type Building, type Coverage, type GameState, type PeddledGood } from './state';

export type AnnexType = 'tradeYard' | 'library' | 'drillGround';
type RoadKind = 'mainRoad' | 'roads';

interface EliteSiteRule {
  annex: AnnexType;
  road: RoadKind;
  neighbours: BuildingType[];
}

export const ELITE_SITES: Record<EliteType, EliteSiteRule> = {
  tradersGuild: { annex: 'tradeYard', road: 'mainRoad', neighbours: [] },
  scholarsHouse: { annex: 'library', road: 'roads', neighbours: ['theater', 'gymnasium', 'podium'] },
  warriorsHouse: { annex: 'drillGround', road: 'roads', neighbours: ['infirmary'] },
};

const NEIGHBOURHOOD_RANGE = 6;

const ANNEX_TYPES = Object.values(ELITE_SITES).map((site) => site.annex);
const ROAD_NAMES: Record<RoadKind, string> = { mainRoad: 'Main Road', roads: 'road' };
const ANNEX_CALLED: Record<AnnexType, string> = { tradeYard: 'yard', library: 'Library', drillGround: 'Drill Ground' };
const CARRIED_GOODS: PeddledGood[] = ['food', 'fleece', 'oil', 'cloth'];
const BLOCK_SIDE = BUILDING_SPECS.tradersGuild.width;
const ROAD_ROW = BLOCK_SIDE;
const ANNEX_ROWS = { first: ROAD_ROW + 1, last: ROAD_ROW + BUILDING_SPECS.tradeYard.height };

export const BLOCK_QUARTERS: Point[] = [
  { x: 0, y: 0 },
  { x: 2, y: 0 },
  { x: 0, y: 2 },
  { x: 2, y: 2 },
];

export function isEliteType(type: BuildingType): type is EliteType {
  return (ELITE_TYPES as BuildingType[]).includes(type);
}

export function isAnnexType(type: BuildingType): type is AnnexType {
  return (ANNEX_TYPES as BuildingType[]).includes(type);
}

export function eliteType(building: Building): EliteType {
  if (!isEliteType(building.type)) throw new Error(`${building.type} ${building.id} is not an elite house`);
  return building.type;
}

export interface EliteBlueprint {
  road: Point[];
  annex: Placement;
}

export interface EliteSite {
  type: EliteType;
  townhouses: boolean;
  alongRoad: boolean;
  annexClear: boolean;
  missingNeighbours: BuildingType[];
  permit: boolean;
  appeal: number;
}

export function eliteBlueprint(elite: Placement): EliteBlueprint {
  const across = (row: number) => rectBetween(localToWorld(elite, { x: 0, y: row }), localToWorld(elite, { x: BLOCK_SIDE - 1, y: row }));
  const annex = rectBetween(localToWorld(elite, { x: 0, y: ANNEX_ROWS.first }), localToWorld(elite, { x: BLOCK_SIDE - 1, y: ANNEX_ROWS.last }));
  return {
    road: tilesIn(across(ROAD_ROW)),
    annex: { type: ELITE_SITES[elite.type as EliteType].annex, x: annex.minX, y: annex.minY, rotation: elite.rotation },
  };
}

export function blueprintTiles(elite: Placement): Point[] {
  const { road, annex } = eliteBlueprint(elite);
  return [...footprint(elite), ...road, ...footprint(annex)];
}

export function eliteObstacle(state: GameState, placement: Placement): string | null {
  if (!blueprintTiles(placement).every((p) => inBounds(state, p.x, p.y))) return 'Outside the map';
  return siteObstacle(surveyEliteSite(state, placement));
}

export type SiteShortfall = 'townhouses' | 'road' | 'annex' | 'neighbours' | 'permit' | 'appeal';

const SHORTFALL_REASONS: Record<SiteShortfall, (site: EliteSite) => string> = {
  townhouses: (site) => `A ${ELITE_NAMES[site.type]} goes over four Townhouses forming a 4×4 block`,
  road: (site) => `A ${ELITE_NAMES[site.type]} must line a straight 4-tile stretch of ${ROAD_NAMES[ELITE_SITES[site.type].road]}`,
  annex: (site) => `The ${annexGround(site.type)} isn't clear`,
  neighbours: (site) => `Needs ${listed(site.missingNeighbours.map((type) => withArticle(BUILDING_SPECS[type].name)))} within ${NEIGHBOURHOOD_RANGE} tiles`,
  permit: (site) => `No ${ELITE_NAMES[site.type]} permit: complete the ${charterFor(site.type)} charter`,
  appeal: (site) => `Needs appeal ${ELITE_HOUSING[site.type].appeal} here (has ${site.appeal})`,
};

function annexGround(type: EliteType): string {
  const { annex, road } = ELITE_SITES[type];
  return `${ANNEX_CALLED[annex]}'s ground across the ${ROAD_NAMES[road]}`;
}

function listed(items: string[]): string {
  return items.length === 1 ? items[0] : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

function charterFor(type: EliteType): string {
  const charter = CHARTERS.find((c) => c.grants === type);
  if (!charter) throw new Error(`No charter grants a ${type} permit`);
  return charter.name;
}

function siteShortfalls(site: EliteSite): SiteShortfall[] {
  const shortfalls: SiteShortfall[] = [];
  if (!site.townhouses) shortfalls.push('townhouses');
  if (!site.alongRoad) shortfalls.push('road');
  else if (!site.annexClear) shortfalls.push('annex');
  if (site.missingNeighbours.length > 0) shortfalls.push('neighbours');
  if (!site.permit) shortfalls.push('permit');
  if (lacksAppeal(site.type, site.appeal)) shortfalls.push('appeal');
  return shortfalls;
}

export function lacksAppeal(type: EliteType, appeal: number): boolean {
  const needed = ELITE_HOUSING[type].appeal;
  return needed !== null && appeal < needed;
}

export function siteObstacle(site: EliteSite): string | null {
  const [first] = siteShortfalls(site);
  return first ? SHORTFALL_REASONS[first](site) : null;
}

export function alongRoad(state: GameState, elite: Placement): boolean {
  const paved = state[ELITE_SITES[elite.type as EliteType].road];
  return eliteBlueprint(elite).road.every((p) => inBounds(state, p.x, p.y) && paved[tileIndex(state, p.x, p.y)]);
}

export function surveyEliteSite(state: GameState, elite: Placement, appeal = appealMap(state)): EliteSite {
  const type = elite.type as EliteType;
  const along = alongRoad(state, elite);
  return {
    type,
    townhouses: BLOCK_QUARTERS.every((q) => {
      const house = houseAt(state, { x: elite.x + q.x, y: elite.y + q.y });
      return house !== null && houseLevel(house) === 'townhouse';
    }),
    alongRoad: along,
    annexClear: along && footprintObstacle(state, eliteBlueprint(elite).annex) === null,
    missingNeighbours: ELITE_SITES[type].neighbours.filter((neighbour) => !standsNear(state, elite, neighbour)),
    permit: state.permits[type] > 0,
    appeal: houseAppeal(state, elite, appeal),
  };
}

function standsNear(state: GameState, elite: Placement, type: BuildingType): boolean {
  const block = footprint(elite);
  return state.buildings.some((b) => b.type === type && block.some((tile) => footprintDistance(b, tile) <= NEIGHBOURHOOD_RANGE));
}

function houseAt(state: GameState, at: Point): Building | null {
  const building = buildingById(state, state.buildingIdAt[tileIndex(state, at.x, at.y)]);
  return building !== undefined && building.type === 'house' && building.x === at.x && building.y === at.y ? building : null;
}

function buildingsUnder(state: GameState, placement: Placement): Building[] {
  const ids = new Set(footprint(placement).map((p) => state.buildingIdAt[tileIndex(state, p.x, p.y)]));
  return state.buildings.filter((b) => ids.has(b.id));
}

export function annexOf(state: GameState, elite: Building): Building {
  const { annex } = eliteBlueprint(elite);
  const found = buildingById(state, state.buildingIdAt[tileIndex(state, annex.x, annex.y)]);
  if (found === undefined || found.type !== annex.type) throw new Error(`${BUILDING_SPECS[elite.type].name} ${elite.id} has no ${BUILDING_SPECS[annex.type].name}`);
  return found;
}

export function eliteOfAnnex(state: GameState, annex: Building): Building {
  const elite = state.buildings.find((b) => isEliteType(b.type) && annexOf(state, b) === annex);
  if (elite === undefined) throw new Error(`${BUILDING_SPECS[annex.type].name} ${annex.id} has no elite house`);
  return elite;
}

export function raiseElite(state: GameState, placement: Placement): Building {
  const type = placement.type as EliteType;
  const houses = buildingsUnder(state, placement);
  removeBuildings(state, new Set(houses.map((h) => h.id)));
  const elite = build(state, placement);
  addBuilding(state, eliteBlueprint(placement).annex);
  elite.residents = Math.min(ELITE_HOUSING[type].capacity, sum(houses, (h) => h.residents));
  for (const good of CARRIED_GOODS) elite[good] = sum(houses, (h) => h[good]);
  for (const service of Object.keys(elite.coveredUntil) as Coverage[]) {
    elite.coveredUntil[service] = Math.max(...houses.map((h) => h.coveredUntil[service]));
  }
  state.permits[type]--;
  return elite;
}

function sum(houses: Building[], of: (house: Building) => number): number {
  return houses.reduce((total, house) => total + of(house), 0);
}

export function eliteShortfalls(state: GameState, elite: Building, map = appealMap(state)): string[] {
  const housing = ELITE_HOUSING[eliteType(elite)];
  const missing: string[] = housing.needs.filter((need) => !hasNeed(state, elite, need));
  const culture = culturePoints(state, elite);
  if (culture < housing.culture) missing.push(`culture ${housing.culture} (has ${culture})`);
  const appeal = houseAppeal(state, elite, map);
  if (lacksAppeal(eliteType(elite), appeal)) missing.push(`appeal ${housing.appeal} (has ${appeal})`);
  return missing;
}

export function isMissingNeed(elite: Building): boolean {
  return elite.pendingTicks > 0;
}

export function tickElites(state: GameState): void {
  const elites = state.buildings.filter((b) => isEliteType(b.type));
  if (elites.length === 0) return;
  const map = appealMap(state);
  for (const elite of elites.filter((e) => startIfSupplied(state, e))) {
    const missing = eliteShortfalls(state, elite, map);
    if (missing.length === 0) {
      if (elite.pendingTicks > 0) state.version++;
      elite.pendingTicks = 0;
      continue;
    }
    if (elite.pendingTicks === 0) state.version++;
    elite.pendingTicks++;
    if (elite.pendingTicks >= LEVEL_CHANGE_TICKS) breakUp(state, elite, missing);
  }
}

function startIfSupplied(state: GameState, elite: Building): boolean {
  if (elite.started) return true;
  const { good } = ELITE_HOUSING[eliteType(elite)];
  if (elite[good] <= 0) return false;
  elite.started = true;
  state.version++;
  return true;
}

function breakUp(state: GameState, elite: Building, missing: string[]): void {
  const route = routeOf(state, elite);
  const routeCloses = route ? ` and its route to ${PLACES[route.partner].name} closes` : '';
  const name = BUILDING_SPECS[elite.type].name;
  postNotice(state, `The ${name} at ${elite.x},${elite.y} broke up: it lacked ${missing.join(', ')}. Its permit is lost${routeCloses}`, elite);
  removeBuildings(state, new Set([elite.id]));
  const { width, height } = BUILDING_SPECS[elite.type];
  const corner = { x: elite.x + width - 1, y: elite.y + height - 1 };
  for (const lot of lotOrigins(elite, corner)) addBuilding(state, { type: 'house', ...lot, rotation: elite.rotation });
  state.version++;
}

import { appealMap, houseAppeal } from './appeal';
import { BUILDING_SPECS, localToWorld, type Placement, type Rotation } from './buildings';
import { addBuilding, build, footprint, footprintObstacle, lotOrigins, removeBuildings } from './commands';
import { culturePoints } from './culture';
import { LEVEL_CHANGE_TICKS, TRADERS_GUILD, hasNeed, houseLevel } from './housing';
import { postNotice } from './notices';
import { rectBetween, tilesIn, type Point } from './point';
import { PLACES } from './greece';
import { routeOf } from './trade';
import { buildingById, inBounds, tileIndex, type Building, type Coverage, type GameState, type PeddledGood } from './state';

const CARRIED_GOODS: PeddledGood[] = ['food', 'fleece', 'oil', 'cloth'];
const ROTATIONS: Rotation[] = [0, 1, 2, 3];
const BLOCK_SIDE = BUILDING_SPECS.tradersGuild.width;
const ROAD_ROW = BLOCK_SIDE;
const YARD_ROWS = { first: ROAD_ROW + 1, last: ROAD_ROW + BUILDING_SPECS.tradeYard.height };

export interface GuildBlueprint {
  road: Point[];
  yard: Placement;
}

export interface GuildSite {
  origin: Point;
  rotation: Rotation;
  quarters: { at: Point; house: boolean; townhouse: boolean }[];
  alongMainRoad: boolean;
  yardClear: boolean;
  permit: boolean;
  appeal: number;
}

export interface SiteSurroundings {
  appeal: number[];
  inRange: boolean[];
}

const BLOCK_QUARTERS: Point[] = [
  { x: 0, y: 0 },
  { x: 2, y: 0 },
  { x: 0, y: 2 },
  { x: 2, y: 2 },
];

export function guildBlueprint(guild: Placement): GuildBlueprint {
  const across = (row: number) => rectBetween(localToWorld(guild, { x: 0, y: row }), localToWorld(guild, { x: BLOCK_SIDE - 1, y: row }));
  const yard = rectBetween(localToWorld(guild, { x: 0, y: YARD_ROWS.first }), localToWorld(guild, { x: BLOCK_SIDE - 1, y: YARD_ROWS.last }));
  return {
    road: tilesIn(across(ROAD_ROW)),
    yard: { type: 'tradeYard', x: yard.minX, y: yard.minY, rotation: guild.rotation },
  };
}

export function blueprintTiles(guild: Placement): Point[] {
  const { road, yard } = guildBlueprint(guild);
  return [...footprint(guild), ...road, ...footprint(yard)];
}

export function guildObstacle(state: GameState, placement: Placement): string | null {
  if (!blueprintTiles(placement).every((p) => inBounds(state, p.x, p.y))) return 'Outside the map';
  return siteObstacle(surveyGuildSite(state, placement));
}

export type SiteShortfall = 'townhouses' | 'mainRoad' | 'yard' | 'permit' | 'appeal';

const SHORTFALL_REASONS: Record<SiteShortfall, (site: GuildSite) => string> = {
  townhouses: () => "A Traders' Guild goes over four Townhouses forming a 4×4 block",
  mainRoad: () => "A Traders' Guild must line a straight 4-tile stretch of Main Road",
  yard: () => "The yard's ground across the Main Road isn't clear",
  permit: () => "No Traders' Guild permit: complete the Well fed charter",
  appeal: (site) => `Needs appeal ${TRADERS_GUILD.appeal} here (has ${site.appeal})`,
};

export function siteShortfalls(site: GuildSite): SiteShortfall[] {
  const shortfalls: SiteShortfall[] = [];
  if (!site.quarters.every((q) => q.townhouse)) shortfalls.push('townhouses');
  if (!site.alongMainRoad) shortfalls.push('mainRoad');
  else if (!site.yardClear) shortfalls.push('yard');
  if (!site.permit) shortfalls.push('permit');
  if (site.appeal < TRADERS_GUILD.appeal) shortfalls.push('appeal');
  return shortfalls;
}

export function siteObstacle(site: GuildSite): string | null {
  const [first] = siteShortfalls(site);
  return first ? SHORTFALL_REASONS[first](site) : null;
}

export function guildSiteOf(state: GameState, house: Building): GuildSite | null {
  const around = siteSurroundings(state);
  const sites = BLOCK_QUARTERS.map((q) => ({ x: house.x - q.x, y: house.y - q.y }))
    .filter((origin) => blockInMap(state, origin))
    .flatMap((origin) => rotationsAlongMainRoad(state, origin).map((rotation) => surveyGuildSite(state, guildAt(origin, rotation), around)));
  return sites.reduce<GuildSite | null>((best, site) => (best === null || closerToPlaceable(site, best) ? site : best), null);
}

export function placeableGuildSites(state: GameState, around = siteSurroundings(state)): Placement[] {
  return state.buildings
    .filter((b) => b.type === 'house' && houseLevel(b) === 'townhouse' && blockInMap(state, b))
    .flatMap((b) => rotationsAlongMainRoad(state, b).map((rotation) => guildAt(b, rotation)))
    .filter((guild) => siteObstacle(surveyGuildSite(state, guild, around)) === null);
}

export function announceGuildSites(state: GameState): void {
  if (state.guildPermits === 0) return;
  for (const site of placeableGuildSites(state)) {
    const corner = tileIndex(state, site.x, site.y);
    if (state.announcedGuildSites.includes(corner)) continue;
    state.announcedGuildSites.push(corner);
    postNotice(state, `A Traders' Guild can now be placed at ${site.x},${site.y}`, site);
  }
}

export function guildSiteTiles(guild: Placement): Point[] {
  return [...footprint(guild), ...footprint(guildBlueprint(guild).yard)];
}

function closerToPlaceable(site: GuildSite, than: GuildSite): boolean {
  const distance = distanceFromPlaceable(site) - distanceFromPlaceable(than);
  return distance < 0 || (distance === 0 && quartersWithoutHouse(site) < quartersWithoutHouse(than));
}

function quartersWithoutHouse(site: GuildSite): number {
  return site.quarters.filter((q) => !q.house).length;
}

function distanceFromPlaceable(site: GuildSite): number {
  const missingTownhouses = site.quarters.filter((q) => !q.townhouse).length;
  return siteShortfalls(site).filter((s) => s !== 'townhouses').length + missingTownhouses;
}

function blockInMap(state: GameState, origin: Point): boolean {
  return footprint(guildAt(origin, 0)).every((p) => inBounds(state, p.x, p.y));
}

function guildAt(origin: Point, rotation: Rotation): Placement {
  return { type: 'tradersGuild', x: origin.x, y: origin.y, rotation };
}

function alongMainRoad(state: GameState, guild: Placement): boolean {
  return guildBlueprint(guild).road.every((p) => inBounds(state, p.x, p.y) && state.mainRoad[tileIndex(state, p.x, p.y)]);
}

function rotationsAlongMainRoad(state: GameState, origin: Point): Rotation[] {
  return ROTATIONS.filter((rotation) => alongMainRoad(state, guildAt(origin, rotation)));
}

export function siteSurroundings(state: GameState): SiteSurroundings {
  return { appeal: appealMap(state), inRange: guildRange(state) };
}

function roadCornerOffset(rotation: Rotation): Point {
  const [first] = guildBlueprint(guildAt({ x: 0, y: 0 }, rotation)).road;
  return first;
}

function guildsAlongMainRoad(state: GameState): Placement[] {
  const guilds: Placement[] = [];
  state.mainRoad.forEach((paved, i) => {
    if (!paved) return;
    const corner = { x: i % state.size, y: Math.floor(i / state.size) };
    for (const rotation of ROTATIONS) {
      const offset = roadCornerOffset(rotation);
      const guild = guildAt({ x: corner.x - offset.x, y: corner.y - offset.y }, rotation);
      if (blockInMap(state, guild) && alongMainRoad(state, guild)) guilds.push(guild);
    }
  });
  return guilds;
}

export function guildRange(state: GameState): boolean[] {
  const range = new Array<boolean>(state.size * state.size).fill(false);
  for (const guild of guildsAlongMainRoad(state)) for (const p of footprint(guild)) range[tileIndex(state, p.x, p.y)] = true;
  return range;
}

export function surveyGuildSite(state: GameState, guild: Placement, around = siteSurroundings(state)): GuildSite {
  const along = alongMainRoad(state, guild);
  return {
    origin: { x: guild.x, y: guild.y },
    rotation: guild.rotation,
    quarters: BLOCK_QUARTERS.map((q) => {
      const at = { x: guild.x + q.x, y: guild.y + q.y };
      const house = houseAt(state, at);
      return { at, house: house !== null, townhouse: house !== null && houseLevel(house) === 'townhouse' };
    }),
    alongMainRoad: along,
    yardClear: along && footprintObstacle(state, guildBlueprint(guild).yard) === null,
    permit: state.guildPermits > 0,
    appeal: houseAppeal(state, guild, around.appeal),
  };
}

function houseAt(state: GameState, at: Point): Building | null {
  const building = buildingById(state, state.buildingIdAt[tileIndex(state, at.x, at.y)]);
  return building !== undefined && building.type === 'house' && building.x === at.x && building.y === at.y ? building : null;
}

function buildingsUnder(state: GameState, placement: Placement): Building[] {
  const ids = new Set(footprint(placement).map((p) => state.buildingIdAt[tileIndex(state, p.x, p.y)]));
  return state.buildings.filter((b) => ids.has(b.id));
}

export function yardOf(state: GameState, guild: Building): Building {
  const { yard } = guildBlueprint(guild);
  const found = buildingById(state, state.buildingIdAt[tileIndex(state, yard.x, yard.y)]);
  if (found === undefined || found.type !== 'tradeYard') throw new Error(`Traders' Guild ${guild.id} has no yard`);
  return found;
}

export function guildOfYard(state: GameState, yard: Building): Building {
  const guild = state.buildings.find((b) => b.type === 'tradersGuild' && yardOf(state, b) === yard);
  if (guild === undefined) throw new Error(`Trade Yard ${yard.id} has no guild`);
  return guild;
}

export function raiseGuild(state: GameState, placement: Placement): Building {
  const houses = buildingsUnder(state, placement);
  removeBuildings(state, new Set(houses.map((h) => h.id)));
  const guild = build(state, placement);
  addBuilding(state, guildBlueprint(placement).yard);
  guild.residents = Math.min(TRADERS_GUILD.capacity, sum(houses, (h) => h.residents));
  for (const good of CARRIED_GOODS) guild[good] = sum(houses, (h) => h[good]);
  for (const service of Object.keys(guild.coveredUntil) as Coverage[]) {
    guild.coveredUntil[service] = Math.max(...houses.map((h) => h.coveredUntil[service]));
  }
  state.guildPermits--;
  return guild;
}

function sum(houses: Building[], of: (house: Building) => number): number {
  return houses.reduce((total, house) => total + of(house), 0);
}

export function guildShortfalls(state: GameState, guild: Building, map = appealMap(state)): string[] {
  const missing: string[] = TRADERS_GUILD.needs.filter((need) => !hasNeed(state, guild, need));
  const culture = culturePoints(state, guild);
  if (culture < TRADERS_GUILD.culture) missing.push(`culture ${TRADERS_GUILD.culture} (has ${culture})`);
  const appeal = houseAppeal(state, guild, map);
  if (appeal < TRADERS_GUILD.appeal) missing.push(`appeal ${TRADERS_GUILD.appeal} (has ${appeal})`);
  return missing;
}

export function isMissingNeed(guild: Building): boolean {
  return guild.pendingTicks > 0;
}

export function tickGuilds(state: GameState): void {
  const guilds = state.buildings.filter((b) => b.type === 'tradersGuild');
  if (guilds.length === 0) return;
  const map = appealMap(state);
  for (const guild of guilds) {
    const missing = guildShortfalls(state, guild, map);
    if (missing.length === 0) {
      if (guild.pendingTicks > 0) state.version++;
      guild.pendingTicks = 0;
      continue;
    }
    if (guild.pendingTicks === 0) state.version++;
    guild.pendingTicks++;
    if (guild.pendingTicks >= LEVEL_CHANGE_TICKS) breakUp(state, guild, missing);
  }
}

function breakUp(state: GameState, guild: Building, missing: string[]): void {
  const route = routeOf(state, guild);
  const routeCloses = route ? ` and its route to ${PLACES[route.partner].name} closes` : '';
  postNotice(state, `The Traders' Guild at ${guild.x},${guild.y} broke up: it lacked ${missing.join(', ')}. Its permit is lost${routeCloses}`, guild);
  removeBuildings(state, new Set([guild.id]));
  const { width, height } = BUILDING_SPECS.tradersGuild;
  const corner = { x: guild.x + width - 1, y: guild.y + height - 1 };
  for (const lot of lotOrigins(guild, corner)) addBuilding(state, { type: 'house', ...lot, rotation: guild.rotation });
  state.version++;
}

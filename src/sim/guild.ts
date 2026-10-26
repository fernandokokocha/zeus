import { appealMap, houseAppeal } from './appeal';
import { BUILDING_SPECS, type Placement } from './buildings';
import { addBuilding, build, footprint, lotOrigins, removeBuildings } from './commands';
import { culturePoints } from './culture';
import { LEVEL_CHANGE_TICKS, TRADERS_GUILD, hasNeed, houseLevel } from './housing';
import { postNotice } from './notices';
import type { Point } from './point';
import { buildingById, inBounds, tileIndex, type Building, type Coverage, type GameState, type PeddledGood } from './state';

const CARRIED_GOODS: PeddledGood[] = ['food', 'fleece', 'oil', 'cloth'];

export interface GuildSite {
  origin: Point;
  quarters: { at: Point; house: boolean; townhouse: boolean }[];
  nearMainRoad: boolean;
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

export function guildObstacle(state: GameState, placement: Placement): string | null {
  if (!blockInMap(state, placement)) return 'Outside the map';
  return siteObstacle(surveyGuildSite(state, placement));
}

export type SiteShortfall = 'townhouses' | 'mainRoad' | 'permit' | 'appeal';

const SHORTFALL_REASONS: Record<SiteShortfall, (site: GuildSite) => string> = {
  townhouses: () => "A Traders' Guild goes over four Townhouses forming a 4×4 block",
  mainRoad: () => `A Traders' Guild must be within ${TRADERS_GUILD.mainRoadRange} tiles of the Main Road`,
  permit: () => "No Traders' Guild permit: complete the Well fed charter",
  appeal: (site) => `Needs appeal ${TRADERS_GUILD.appeal} here (has ${site.appeal})`,
};

export function siteShortfalls(site: GuildSite): SiteShortfall[] {
  const shortfalls: SiteShortfall[] = [];
  if (!site.quarters.every((q) => q.townhouse)) shortfalls.push('townhouses');
  if (!site.nearMainRoad) shortfalls.push('mainRoad');
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
    .map((origin) => surveyGuildSite(state, origin, around))
    .filter((site) => site.nearMainRoad);
  return sites.reduce<GuildSite | null>((best, site) => (best === null || closerToPlaceable(site, best) ? site : best), null);
}

export function placeableGuildSites(state: GameState, around = siteSurroundings(state)): Point[] {
  return state.buildings
    .filter((b) => b.type === 'house' && houseLevel(b) === 'townhouse')
    .map(({ x, y }) => ({ x, y }))
    .filter((origin) => blockInMap(state, origin) && siteObstacle(surveyGuildSite(state, origin, around)) === null);
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

export function guildSiteTiles(origin: Point): Point[] {
  return footprint(guildAt(origin));
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
  return guildSiteTiles(origin).every((p) => inBounds(state, p.x, p.y));
}

function guildAt(origin: Point): Placement {
  return { type: 'tradersGuild', x: origin.x, y: origin.y, rotation: 0 };
}

export function siteSurroundings(state: GameState): SiteSurroundings {
  return { appeal: appealMap(state), inRange: guildRange(state) };
}

export function guildRange(state: GameState): boolean[] {
  const range = new Array<boolean>(state.size * state.size).fill(false);
  const reach = TRADERS_GUILD.mainRoadRange;
  state.mainRoad.forEach((paved, i) => {
    if (!paved) return;
    const x = i % state.size;
    const y = Math.floor(i / state.size);
    for (let ny = y - reach; ny <= y + reach; ny++) {
      for (let nx = x - reach; nx <= x + reach; nx++) if (inBounds(state, nx, ny)) range[tileIndex(state, nx, ny)] = true;
    }
  });
  return range;
}

export function surveyGuildSite(state: GameState, origin: Point, around = siteSurroundings(state)): GuildSite {
  const placement = guildAt(origin);
  return {
    origin: { x: origin.x, y: origin.y },
    quarters: BLOCK_QUARTERS.map((q) => {
      const at = { x: origin.x + q.x, y: origin.y + q.y };
      const house = houseAt(state, at);
return { at, house: house !== null, townhouse: house !== null && houseLevel(house) === 'townhouse' };
    }),
    nearMainRoad: footprint(placement).some((p) => around.inRange[tileIndex(state, p.x, p.y)]),
    permit: state.guildPermits > 0,
    appeal: houseAppeal(state, placement, around.appeal),
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

export function raiseGuild(state: GameState, placement: Placement): Building {
  const houses = buildingsUnder(state, placement);
  removeBuildings(state, new Set(houses.map((h) => h.id)));
  const guild = build(state, placement);
  guild.residents = Math.min(TRADERS_GUILD.merchants, sum(houses, (h) => h.residents));
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
  postNotice(state, `The Traders' Guild at ${guild.x},${guild.y} broke up: it lacked ${missing.join(', ')}. Its permit is lost`, guild);
  removeBuildings(state, new Set([guild.id]));
  const { width, height } = BUILDING_SPECS.tradersGuild;
  const corner = { x: guild.x + width - 1, y: guild.y + height - 1 };
  for (const lot of lotOrigins(guild, corner)) addBuilding(state, { type: 'house', ...lot, rotation: guild.rotation });
  state.version++;
}

import { appealMap } from './appeal';
import type { Placement, Rotation } from './buildings';
import { footprint } from './commands';
import { BLOCK_QUARTERS, alongRoad, eliteBlueprint, siteObstacle, siteShortfalls, surveyEliteSite, type EliteSite } from './elites';
import { houseLevel } from './housing';
import { postNotice } from './notices';
import type { Point } from './point';
import { inBounds, tileIndex, type Building, type GameState } from './state';

const ROTATIONS: Rotation[] = [0, 1, 2, 3];

export interface SiteSurroundings {
  appeal: number[];
  inRange: boolean[];
}

export function guildSiteOf(state: GameState, house: Building): EliteSite | null {
  const { appeal } = siteSurroundings(state);
  const sites = BLOCK_QUARTERS.map((q) => ({ x: house.x - q.x, y: house.y - q.y }))
    .filter((origin) => blockInMap(state, origin))
    .flatMap((origin) => rotationsAlongMainRoad(state, origin).map((rotation) => surveyEliteSite(state, guildAt(origin, rotation), appeal)));
  return sites.reduce<EliteSite | null>((best, site) => (best === null || closerToPlaceable(site, best) ? site : best), null);
}

export function placeableGuildSites(state: GameState, around = siteSurroundings(state)): Placement[] {
  return state.buildings
    .filter((b) => b.type === 'house' && houseLevel(b) === 'townhouse' && blockInMap(state, b))
    .flatMap((b) => rotationsAlongMainRoad(state, b).map((rotation) => guildAt(b, rotation)))
    .filter((guild) => siteObstacle(surveyEliteSite(state, guild, around.appeal)) === null);
}

export function announceGuildSites(state: GameState): void {
  if (state.permits.tradersGuild === 0) return;
  for (const site of placeableGuildSites(state)) {
    const corner = tileIndex(state, site.x, site.y);
    if (state.announcedGuildSites.includes(corner)) continue;
    state.announcedGuildSites.push(corner);
    postNotice(state, `A Traders' Guild can now be placed at ${site.x},${site.y}`, site);
  }
}

export function guildSiteTiles(guild: Placement): Point[] {
  return [...footprint(guild), ...footprint(eliteBlueprint(guild).annex)];
}

function closerToPlaceable(site: EliteSite, than: EliteSite): boolean {
  const distance = distanceFromPlaceable(site) - distanceFromPlaceable(than);
  return distance < 0 || (distance === 0 && quartersWithoutHouse(site) < quartersWithoutHouse(than));
}

function quartersWithoutHouse(site: EliteSite): number {
  return site.quarters.filter((q) => !q.house).length;
}

function distanceFromPlaceable(site: EliteSite): number {
  const missingTownhouses = site.quarters.filter((q) => !q.townhouse).length;
  return siteShortfalls(site).filter((s) => s !== 'townhouses').length + missingTownhouses;
}

function blockInMap(state: GameState, origin: Point): boolean {
  return footprint(guildAt(origin, 0)).every((p) => inBounds(state, p.x, p.y));
}

function guildAt(origin: Point, rotation: Rotation): Placement {
  return { type: 'tradersGuild', x: origin.x, y: origin.y, rotation };
}

function rotationsAlongMainRoad(state: GameState, origin: Point): Rotation[] {
  return ROTATIONS.filter((rotation) => alongRoad(state, guildAt(origin, rotation)));
}

export function siteSurroundings(state: GameState): SiteSurroundings {
  return { appeal: appealMap(state), inRange: guildRange(state) };
}

function roadCornerOffset(rotation: Rotation): Point {
  const [first] = eliteBlueprint(guildAt({ x: 0, y: 0 }, rotation)).road;
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
      if (blockInMap(state, guild) && alongRoad(state, guild)) guilds.push(guild);
    }
  });
  return guilds;
}

export function guildRange(state: GameState): boolean[] {
  const range = new Array<boolean>(state.size * state.size).fill(false);
  for (const guild of guildsAlongMainRoad(state)) for (const p of footprint(guild)) range[tileIndex(state, p.x, p.y)] = true;
  return range;
}

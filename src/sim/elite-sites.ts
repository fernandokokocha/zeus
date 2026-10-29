import { appealMap } from './appeal';
import type { Placement, Rotation } from './buildings';
import { footprint } from './commands';
import { BLOCK_QUARTERS, ELITE_SITES, alongRoad, eliteBlueprint, siteObstacle, siteShortfalls, surveyEliteSite, type EliteSite } from './elites';
import { ELITE_NAMES, ELITE_TYPES, houseLevel, type EliteType } from './housing';
import { postNotice } from './notices';
import type { Point } from './point';
import { inBounds, tileIndex, type Building, type GameState } from './state';

const ROTATIONS: Rotation[] = [0, 1, 2, 3];

export function eliteSiteOf(state: GameState, house: Building, type: EliteType, appeal = appealMap(state)): EliteSite | null {
  const sites = BLOCK_QUARTERS.map((q) => ({ x: house.x - q.x, y: house.y - q.y }))
    .filter((origin) => blockInMap(state, origin))
    .flatMap((origin) => rotationsAlongRoad(state, type, origin).map((rotation) => surveyEliteSite(state, eliteAt(type, origin, rotation), appeal)))
    .filter(inNeighbourhood);
  return sites.reduce<EliteSite | null>((best, site) => (best === null || closerToPlaceable(site, best) ? site : best), null);
}

export function placeableEliteSites(state: GameState, type: EliteType, appeal = appealMap(state)): Placement[] {
  return state.buildings
    .filter((b) => b.type === 'house' && houseLevel(b) === 'townhouse' && blockInMap(state, b))
    .flatMap((b) => rotationsAlongRoad(state, type, b).map((rotation) => eliteAt(type, b, rotation)))
    .filter((elite) => siteObstacle(surveyEliteSite(state, elite, appeal)) === null);
}

export function announceEliteSites(state: GameState): void {
  for (const type of ELITE_TYPES.filter((t) => state.permits[t] > 0)) announceSites(state, type);
}

function announceSites(state: GameState, type: EliteType): void {
  const announced = state.announcedEliteSites[type];
  for (const site of placeableEliteSites(state, type)) {
    const corner = tileIndex(state, site.x, site.y);
    if (announced.includes(corner)) continue;
    announced.push(corner);
    postNotice(state, `A ${ELITE_NAMES[type]} can now be placed at ${site.x},${site.y}`, site);
  }
}

export function eliteSiteTiles(elite: Placement): Point[] {
  return [...footprint(elite), ...footprint(eliteBlueprint(elite).annex)];
}

function inNeighbourhood(site: EliteSite): boolean {
  const { neighbours } = ELITE_SITES[site.type];
  return neighbours.length === 0 || site.missingNeighbours.length < neighbours.length;
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
  const otherShortfalls = siteShortfalls(site).filter((s) => s !== 'townhouses' && s !== 'neighbours').length;
  return otherShortfalls + missingTownhouses + site.missingNeighbours.length;
}

function blockInMap(state: GameState, origin: Point): boolean {
  return footprint(eliteAt('tradersGuild', origin, 0)).every((p) => inBounds(state, p.x, p.y));
}

function eliteAt(type: EliteType, origin: Point, rotation: Rotation): Placement {
  return { type, x: origin.x, y: origin.y, rotation };
}

function rotationsAlongRoad(state: GameState, type: EliteType, origin: Point): Rotation[] {
  return ROTATIONS.filter((rotation) => alongRoad(state, eliteAt(type, origin, rotation)));
}

function roadCornerOffset(rotation: Rotation): Point {
  const [first] = eliteBlueprint(eliteAt('tradersGuild', { x: 0, y: 0 }, rotation)).road;
  return first;
}

function guildsAlongMainRoad(state: GameState): Placement[] {
  const guilds: Placement[] = [];
  state.mainRoad.forEach((paved, i) => {
    if (!paved) return;
    const corner = { x: i % state.size, y: Math.floor(i / state.size) };
    for (const rotation of ROTATIONS) {
      const offset = roadCornerOffset(rotation);
      const guild = eliteAt('tradersGuild', { x: corner.x - offset.x, y: corner.y - offset.y }, rotation);
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

import { appealMap, houseAppeal } from './appeal';
import { BUILDING_SPECS, footprintDistance, type Placement } from './buildings';
import { addBuilding, build, footprint, lotOrigins, removeBuildings } from './commands';
import { culturePoints } from './culture';
import { LEVEL_CHANGE_TICKS, TRADERS_GUILD, hasNeed, houseLevel } from './housing';
import { postNotice } from './notices';
import { NO_BUILDING, inBounds, tileIndex, type Building, type Coverage, type GameState, type PeddledGood } from './state';

const CARRIED_GOODS: PeddledGood[] = ['food', 'fleece', 'oil', 'cloth'];

export function guildObstacle(state: GameState, placement: Placement): string | null {
  const tiles = footprint(placement);
  if (tiles.some((p) => !inBounds(state, p.x, p.y))) return 'Outside the map';
  if (!townhouseBlockUnder(state, placement)) return "A Traders' Guild goes over four Townhouses forming a 4×4 block";
  if (!nearMainRoad(state, placement)) return `A Traders' Guild must be within ${TRADERS_GUILD.mainRoadRange} tiles of the Main Road`;
  if (state.guildPermits === 0) return "No Traders' Guild permit: complete the Well fed charter";
  const appeal = houseAppeal(state, placement);
  if (appeal < TRADERS_GUILD.appeal) return `Needs appeal ${TRADERS_GUILD.appeal} here (has ${appeal})`;
  return null;
}

function buildingsUnder(state: GameState, placement: Placement): Building[] {
  const ids = new Set(footprint(placement).map((p) => state.buildingIdAt[tileIndex(state, p.x, p.y)]));
  return state.buildings.filter((b) => ids.has(b.id));
}

function townhouseBlockUnder(state: GameState, placement: Placement): boolean {
  const covered = footprint(placement).every((p) => state.buildingIdAt[tileIndex(state, p.x, p.y)] !== NO_BUILDING);
  const under = buildingsUnder(state, placement);
  return covered && under.length === 4 && under.every((b) => b.type === 'house' && houseLevel(b) === 'townhouse');
}

function nearMainRoad(state: GameState, placement: Placement): boolean {
  return state.mainRoad.some(
    (paved, i) => paved && footprintDistance(placement, { x: i % state.size, y: Math.floor(i / state.size) }) <= TRADERS_GUILD.mainRoadRange,
  );
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

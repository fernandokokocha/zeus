import { placeBuilding, placeHouses, placeRoad, type Result } from '../../src/sim/commands';
import { annexOf } from '../../src/sim/elites';
import { HOUSE_LEVELS } from '../../src/sim/housing';
import { assignWorkers } from '../../src/sim/labor';
import type { Point } from '../../src/sim/point';
import { tick } from '../../src/sim/tick';
import { newGameState, tileIndex, type Building, type GameState } from '../../src/sim/state';
import type { Terrain } from '../../src/sim/terrain';
import { openRoute, type Partner } from '../../src/sim/trade';

const ENTRY_ROAD_LENGTH = 8;

export function mainRoadGame(size = 20): GameState {
  const entryRoad = Array.from({ length: ENTRY_ROAD_LENGTH }, (_, x) => ({ x, y: size / 2 }));
  return newGameState(size, new Array<Terrain>(size * size).fill('grass'), entryRoad);
}

export function grassGame(size = 20): GameState {
  const game = mainRoadGame(size);
  game.mainRoad.fill(false);
  return game;
}

export function setTerrain(state: GameState, x: number, y: number, terrain: Terrain): void {
  state.terrain[y * state.size + x] = terrain;
}

export function placeHouse(state: GameState, x: number, y: number): Result {
  return placeHouses(state, { x, y }, { x, y });
}

export function runTicks(state: GameState, count: number): void {
  for (let i = 0; i < count; i++) tick(state);
}

export function setMeadow(state: GameState, x: number, y: number, width: number, height: number): void {
  for (let dy = 0; dy < height; dy++) for (let dx = 0; dx < width; dx++) setTerrain(state, x + dx, y + dy, 'meadow');
}

export function meadowGame(size = 20): GameState {
  const game = grassGame(size);
  setMeadow(game, 0, 0, size, size);
  return game;
}

const GUILD_TOWN_SIZE = 30;
export const GUILD_BLOCK = { x: 3, y: 12 };
export const GUILD_LOTS = [
  { x: 3, y: 12 },
  { x: 5, y: 12 },
  { x: 3, y: 14 },
  { x: 5, y: 14 },
];
const FOREVER = 1_000_000;

function townhouse(state: GameState, at: Point): Building {
  placeHouse(state, at.x, at.y);
  const house = state.buildings[state.buildings.length - 1];
  Object.assign(house, { level: 'townhouse', residents: HOUSE_LEVELS.townhouse.capacity });
  return house;
}

export function guildBlock(mainRoadY = 16): { game: GameState; houses: Building[] } {
  const mainRoad = Array.from({ length: GUILD_TOWN_SIZE }, (_, x) => ({ x, y: mainRoadY }));
  const game = newGameState(GUILD_TOWN_SIZE, new Array<Terrain>(GUILD_TOWN_SIZE * GUILD_TOWN_SIZE).fill('grass'), mainRoad);
  placeBuilding(game, 'palace', 1, 6);
  placeBuilding(game, 'flowerGarden', 1, 13);
  placeBuilding(game, 'flowerGarden', 7, 13);
  const houses = GUILD_LOTS.map((lot) => townhouse(game, lot));
  placeHouse(game, 20, 26);
  game.buildings[game.buildings.length - 1].residents = 40;
  game.permits.tradersGuild = 1;
  return { game, houses };
}

export function guildOf(state: GameState): Building {
  const guild = state.buildings.find((b) => b.type === 'tradersGuild');
  if (!guild) throw new Error('No guild');
  return guild;
}

export function placedGuild(): { game: GameState; guild: Building } {
  const { game } = guildBlock();
  const placed = placeBuilding(game, 'tradersGuild', GUILD_BLOCK.x, GUILD_BLOCK.y);
  if (!placed.ok) throw new Error(placed.reason);
  return { game, guild: guildOf(game) };
}

export function supplyGuild(guild: Building): void {
  Object.assign(guild, { food: 300, fleece: 24, oil: 24, cloth: 24, started: true });
  Object.assign(guild.coveredUntil, { water: FOREVER, athletics: FOREVER, drama: FOREVER });
}

const PALACE_ROAD = { from: { x: 10, y: 6 }, to: { x: 10, y: 15 } };

export interface Town {
  game: GameState;
  guild: Building;
  yard: Building;
}

export function tradingTown(partner: Partner = 'thebes'): Town {
  const { game, guild } = placedGuild();
  placeRoad(game, PALACE_ROAD.from, PALACE_ROAD.to);
  const opened = openRoute(game, guild.id, partner);
  if (!opened.ok) throw new Error(opened.reason);
  assignWorkers(game);
  return { game, guild, yard: annexOf(game, guild) };
}

export function withStore(town: Town, type: 'storehouse' | 'granary', at: { x: number; y: number }): Building {
  const placed = placeBuilding(town.game, type, at.x, at.y);
  if (!placed.ok) throw new Error(placed.reason);
  const store = town.game.buildings[town.game.buildings.length - 1];
  for (const house of town.game.buildings.filter((b) => b.type === 'house')) house.residents = 200;
  supplyGuild(town.guild);
  return store;
}

export function emptyCity(state: GameState): void {
  for (const residence of state.buildings) residence.residents = 0;
  state.roads[tileIndex(state, state.entry.x, state.entry.y)] = false;
}

export const SCHOLARS_ROAD_Y = 16;
export const SCHOLARS_NEIGHBOURS = [
  { type: 'theater', x: 10, y: 10 },
  { type: 'gymnasium', x: 10, y: 17 },
  { type: 'podium', x: 7, y: 17 },
] as const;

export function scholarsBlock(neighbours = SCHOLARS_NEIGHBOURS.map((n) => n.type)): { game: GameState; houses: Building[] } {
  const { game, houses } = guildBlock(25);
  game.permits.tradersGuild = 0;
  game.permits.scholarsHouse = 1;
  placeRoad(game, { x: 0, y: SCHOLARS_ROAD_Y }, { x: 12, y: SCHOLARS_ROAD_Y });
  for (const n of SCHOLARS_NEIGHBOURS.filter((n) => neighbours.includes(n.type))) {
    const placed = placeBuilding(game, n.type, n.x, n.y);
    if (!placed.ok) throw new Error(placed.reason);
  }
  return { game, houses };
}

export function scholarsOf(state: GameState): Building {
  const scholars = state.buildings.find((b) => b.type === 'scholarsHouse');
  if (!scholars) throw new Error("No Scholars' House");
  return scholars;
}

export function placedScholars(): { game: GameState; scholars: Building; library: Building } {
  const { game } = scholarsBlock();
  const placed = placeBuilding(game, 'scholarsHouse', GUILD_BLOCK.x, GUILD_BLOCK.y);
  if (!placed.ok) throw new Error(placed.reason);
  const scholars = scholarsOf(game);
  return { game, scholars, library: annexOf(game, scholars) };
}

export function supplyScholars(scholars: Building): void {
  Object.assign(scholars, { food: 300, fleece: 24, oil: 24, scrolls: 24, started: true });
  Object.assign(scholars.coveredUntil, { water: FOREVER, athletics: FOREVER, drama: FOREVER });
}

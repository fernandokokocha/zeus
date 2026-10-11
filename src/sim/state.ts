import type { BuildingType } from './buildings';
import { DEFAULT_SEED, ENTRY_ROAD_LENGTH, MAP_SIZE, generateTerrain } from './map';
import { clampPoint, type Point } from './point';
import type { Terrain } from './terrain';
import { STARTING_TREASURY } from './treasury';

export type Speed = 0 | 1 | 2 | 4;
export type PlayingSpeed = Exclude<Speed, 0>;

export type Service = 'water' | 'tax';

export interface Building {
  id: number;
  type: BuildingType;
  x: number;
  y: number;
  residents: number;
  workers: number;
  walkerRest: number;
  coveredUntil: Record<Service, number>;
}

export interface Walk {
  path: Point[];
  step: number;
  progress: number;
}

export interface Settler extends Walk {
  id: number;
  destinationId: number;
  people: number;
}

export interface GameState {
  size: number;
  terrain: Terrain[];
  roads: boolean[];
  buildings: Building[];
  buildingIdAt: number[];
  nextBuildingId: number;
  settlers: Settler[];
  nextSettlerId: number;
  entry: Point;
  treasury: number;
  tick: number;
  speed: Speed;
  lastPlayedSpeed: PlayingSpeed;
  speedBeforeInspection: Speed | null;
  version: number;
}

export const NO_BUILDING = 0;

export function newGameState(size: number, terrain: Terrain[], entry: Point): GameState {
  const roads = new Array<boolean>(size * size).fill(false);
  for (let x = entry.x; x < entry.x + ENTRY_ROAD_LENGTH; x++) roads[entry.y * size + x] = true;
  return {
    size,
    terrain,
    roads,
    buildings: [],
    buildingIdAt: new Array<number>(size * size).fill(NO_BUILDING),
    nextBuildingId: 1,
    settlers: [],
    nextSettlerId: 1,
    entry,
    treasury: STARTING_TREASURY,
    tick: 0,
    speed: 1,
    lastPlayedSpeed: 1,
    speedBeforeInspection: null,
    version: 0,
  };
}

export function createGame(seed = DEFAULT_SEED): GameState {
  const { terrain, entry } = generateTerrain(seed);
  return newGameState(MAP_SIZE, terrain, entry);
}

export function tileIndex(state: GameState, x: number, y: number): number {
  return y * state.size + x;
}

export function inBounds(state: GameState, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < state.size && y < state.size;
}

export function clampToMap(state: GameState, p: Point): Point {
  return clampPoint(p, state.size);
}

export function buildingById(state: GameState, id: number): Building | undefined {
  return state.buildings.find((b) => b.id === id);
}

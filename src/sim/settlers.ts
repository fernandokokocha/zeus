import { TICKS_PER_MONTH } from './clock';
import { adjacentRoadTiles } from './commands';
import { houseCapacity, houseLevel, isResidence } from './housing';
import { findRoadPath, nearestByRoad } from './pathfinding';
import type { Point } from './point';
import { buildingById, type Building, type GameState, type Settler } from './state';
import { isRoad, walkPath } from './walking';

export const SETTLERS_PER_MONTH = 10;
export const SETTLER_SPAWN_INTERVAL_TICKS = TICKS_PER_MONTH / SETTLERS_PER_MONTH;

export function population(state: GameState): number {
  return state.buildings.reduce((sum, b) => sum + b.residents, 0);
}

export function roomFor(state: GameState, house: Building): number {
  if (house.sick) return 0;
  const incoming = state.settlers
    .filter((s) => s.destinationId === house.id)
    .reduce((sum, s) => sum + s.people, 0);
  return houseCapacity(house) - house.residents - incoming;
}

export function closestLotWithRoom(state: GameState, from: Point): { house: Building; path: Point[] } | null {
  const lots = state.buildings.filter((b) => isResidence(b) && roomFor(state, b) > 0);
  const nearest = nearestByRoad(state, from, lots);
  return nearest && { house: nearest.building, path: nearest.path };
}

export function tickSettlers(state: GameState): void {
  if (state.tick % SETTLER_SPAWN_INTERVAL_TICKS === 0) spawnSettler(state);
  for (const settler of [...state.settlers]) walk(state, settler);
}

function spawnSettler(state: GameState): void {
  if (!isRoad(state, state.entry)) return;
  const target = closestLotWithRoom(state, state.entry);
  if (!target) return;
  state.settlers.push({
    id: state.nextSettlerId++,
    path: target.path,
    step: 0,
    progress: 0,
    destinationId: target.house.id,
    people: roomFor(state, target.house),
  });
}

function walk(state: GameState, settler: Settler): void {
  if (!isRoad(state, settler.path[settler.step])) return leave(state, settler);
  if (!buildingById(state, settler.destinationId) && !replan(state, settler)) return;

  walkPath(state, settler, () => replan(state, settler), () => arrive(state, settler));
}

function replan(state: GameState, settler: Settler): boolean {
  const here = settler.path[settler.step];
  const destination = buildingById(state, settler.destinationId);
  const pathHome = destination ? findRoadPath(state, here, adjacentRoadTiles(state, destination)) : null;
  if (pathHome) {
    restartOn(settler, pathHome);
    return true;
  }
  settler.destinationId = 0;
  const target = closestLotWithRoom(state, here);
  if (!target) {
    leave(state, settler);
    return false;
  }
  settler.destinationId = target.house.id;
  restartOn(settler, target.path);
  return true;
}

function restartOn(settler: Settler, path: Point[]): void {
  settler.path = path;
  settler.step = 0;
}

function arrive(state: GameState, settler: Settler): void {
  const house = buildingById(state, settler.destinationId);
  if (!house) throw new Error(`Settler ${settler.id} arrived at missing building ${settler.destinationId}`);
  const wasVacant = houseLevel(house) === null;
  house.residents = Math.min(houseCapacity(house), house.residents + settler.people);
  if (wasVacant) state.version++;
  leave(state, settler);
}

function leave(state: GameState, settler: Settler): void {
  state.settlers = state.settlers.filter((s) => s !== settler);
}

export function canSettlersReach(state: GameState, house: Building): boolean {
  return isRoad(state, state.entry) && findRoadPath(state, state.entry, adjacentRoadTiles(state, house)) !== null;
}

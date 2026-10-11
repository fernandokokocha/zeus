import { TICKS_PER_MONTH } from './clock';
import { adjacentRoadTiles } from './commands';
import { houseCapacity, houseLevel } from './housing';
import { findRoadPath } from './pathfinding';
import type { Point } from './point';
import { buildingById, tileIndex, type Building, type GameState, type Settler } from './state';

export const SETTLER_SPAWN_INTERVAL_TICKS = 20;
export const WALKER_TILES_PER_MONTH = 54.4;
export const WALKER_TILES_PER_TICK = WALKER_TILES_PER_MONTH / TICKS_PER_MONTH;

export function population(state: GameState): number {
  return state.buildings.reduce((sum, b) => sum + b.residents, 0);
}

export function roomFor(state: GameState, house: Building): number {
  const incoming = state.settlers
    .filter((s) => s.destinationId === house.id)
    .reduce((sum, s) => sum + s.people, 0);
  return houseCapacity(house) - house.residents - incoming;
}

export function closestLotWithRoom(state: GameState, from: Point): { house: Building; path: Point[] } | null {
  const lots = state.buildings.filter((b) => b.type === 'house' && roomFor(state, b) > 0);
  const path = findRoadPath(state, from, lots.flatMap((lot) => adjacentRoadTiles(state, lot)));
  if (!path) return null;
  const end = path[path.length - 1];
  const house = lots.find((lot) => adjacentRoadTiles(state, lot).some((p) => p.x === end.x && p.y === end.y));
  if (!house) throw new Error(`Path ends at ${end.x}, ${end.y}, which touches no lot`);
  return { house, path };
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

  settler.progress += WALKER_TILES_PER_TICK;
  while (settler.progress >= 1 && settler.step < settler.path.length - 1) {
    if (!isRoad(state, settler.path[settler.step + 1]) && !replan(state, settler)) return;
    if (settler.step === settler.path.length - 1) break;
    settler.step++;
    settler.progress--;
  }
  if (settler.step === settler.path.length - 1) arrive(state, settler);
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

function isRoad(state: GameState, p: Point): boolean {
  return state.roads[tileIndex(state, p.x, p.y)];
}

export function settlerTile(settler: Settler): Point {
  const ahead = settler.progress >= 0.5 && settler.step < settler.path.length - 1;
  return settler.path[ahead ? settler.step + 1 : settler.step];
}

export function canSettlersReach(state: GameState, house: Building): boolean {
  return isRoad(state, state.entry) && findRoadPath(state, state.entry, adjacentRoadTiles(state, house)) !== null;
}

export function settlerPosition(settler: Settler, lookAhead: number): Point & { facing: Point } {
  const lastStep = settler.path.length - 1;
  const travelled = Math.min(settler.step + settler.progress + lookAhead, lastStep);
  const step = Math.min(Math.floor(travelled), lastStep - 1);
  const from = settler.path[step];
  const to = settler.path[step + 1];
  const t = travelled - step;
  return {
    x: from.x + (to.x - from.x) * t,
    y: from.y + (to.y - from.y) * t,
    facing: { x: to.x - from.x, y: to.y - from.y },
  };
}

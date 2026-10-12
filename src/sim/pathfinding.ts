import { adjacentRoadTiles } from './commands';
import { samePoint, type Point } from './point';
import { NO_BUILDING, inBounds, tileIndex, type Building, type GameState } from './state';
import { BUILDABLE } from './terrain';

export const NEIGHBOUR_STEPS: Point[] = [{ x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }];
const UNVISITED = -1;

function isOpenTile(state: GameState, i: number): boolean {
  return state.roads[i] || (BUILDABLE.has(state.terrain[i]) && state.buildingIdAt[i] === NO_BUILDING) || isClearing(state, i);
}

function isClearing(state: GameState, i: number): boolean {
  return state.terrain[i] === 'forest' && state.tick < state.felledUntil[i];
}

export function isOpenGround(state: GameState, p: Point): boolean {
  return isOpenTile(state, tileIndex(state, p.x, p.y));
}

export function findRoadPath(state: GameState, from: Point, targets: Point[]): Point[] | null {
  return findPath(state, from, targets, (i) => state.roads[i]);
}

export function findOpenPath(state: GameState, from: Point, targets: Point[]): Point[] | null {
  return findPath(state, from, targets, (i) => isOpenTile(state, i));
}

export function findGrovePath(state: GameState, from: Point, targets: Point[]): Point[] | null {
  const groves = new Set(state.buildings.filter((b) => b.type === 'oliveTree').map((b) => tileIndex(state, b.x, b.y)));
  return findPath(state, from, targets, (i) => isOpenTile(state, i) || groves.has(i));
}

function findPath(state: GameState, from: Point, targets: Point[], passable: (tile: number) => boolean): Point[] | null {
  const targetSet = new Set(targets.map((p) => tileIndex(state, p.x, p.y)));
  const cameFrom = new Int32Array(state.size * state.size).fill(UNVISITED);
  const start = tileIndex(state, from.x, from.y);
  cameFrom[start] = start;
  const queue = [start];

  for (let head = 0; head < queue.length; head++) {
    const current = queue[head];
    if (targetSet.has(current)) return pathTo(state, cameFrom, current);
    const x = current % state.size;
    const y = Math.floor(current / state.size);
    for (const step of NEIGHBOUR_STEPS) {
      const nx = x + step.x;
      const ny = y + step.y;
      if (!inBounds(state, nx, ny)) continue;
      const next = tileIndex(state, nx, ny);
      if (cameFrom[next] !== UNVISITED || !passable(next)) continue;
      cameFrom[next] = current;
      queue.push(next);
    }
  }
  return null;
}

export function nearestByRoad(state: GameState, from: Point, buildings: Building[]): { building: Building; path: Point[] } | null {
  const path = findRoadPath(state, from, buildings.flatMap((b) => adjacentRoadTiles(state, b)));
  if (!path) return null;
  const end = path[path.length - 1];
  const building = buildings.find((b) => adjacentRoadTiles(state, b).some((p) => samePoint(p, end)));
  if (!building) throw new Error(`Path ends at ${end.x}, ${end.y}, which touches none of the buildings`);
  return { building, path };
}

function pathTo(state: GameState, cameFrom: Int32Array, end: number): Point[] {
  const path: Point[] = [];
  for (let i = end; ; i = cameFrom[i]) {
    path.push({ x: i % state.size, y: Math.floor(i / state.size) });
    if (cameFrom[i] === i) break;
  }
  return path.reverse();
}

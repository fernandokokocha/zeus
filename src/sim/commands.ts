import { BUILDING_SPECS, type BuildingType } from './buildings';
import { rectBetween, tilesIn, type Point } from './point';
import { NO_BUILDING, clampToMap, inBounds, tileIndex, type GameState } from './state';
import { BUILDABLE, TERRAIN_NAMES } from './terrain';

export type Result = { ok: true } | { ok: false; reason: string };

const OK: Result = { ok: true };

function fail(reason: string): Result {
  return { ok: false, reason };
}

export function roadPath(from: Point, to: Point): Point[] {
  const path: Point[] = [];
  const stepX = Math.sign(to.x - from.x);
  const stepY = Math.sign(to.y - from.y);
  for (let x = from.x; x !== to.x; x += stepX) path.push({ x, y: from.y });
  for (let y = from.y; y !== to.y; y += stepY) path.push({ x: to.x, y });
  path.push({ x: to.x, y: to.y });
  return path;
}

function terrainObstacle(state: GameState, x: number, y: number): string | null {
  const terrain = state.terrain[tileIndex(state, x, y)];
  return BUILDABLE.has(terrain) ? null : `Cannot build on ${TERRAIN_NAMES[terrain].toLowerCase()}`;
}

export function roadObstacle(state: GameState, x: number, y: number): string | null {
  if (!inBounds(state, x, y)) return 'Outside the map';
  if (state.buildingIdAt[tileIndex(state, x, y)] !== NO_BUILDING) return 'A building is in the way';
  return terrainObstacle(state, x, y);
}

export function placeRoad(state: GameState, from: Point, to: Point): Result {
  const path = roadPath(from, to);
  for (const p of path) {
    const obstacle = roadObstacle(state, p.x, p.y);
    if (obstacle) return fail(obstacle);
  }
  for (const p of path) state.roads[tileIndex(state, p.x, p.y)] = true;
  state.version++;
  return OK;
}

export function footprint(type: BuildingType, x: number, y: number): Point[] {
  const { width, height } = BUILDING_SPECS[type];
  return tilesIn({ minX: x, minY: y, maxX: x + width - 1, maxY: y + height - 1 });
}

function footprintObstacle(state: GameState, type: BuildingType, x: number, y: number): string | null {
  for (const p of footprint(type, x, y)) {
    if (!inBounds(state, p.x, p.y)) return 'Outside the map';
    if (state.roads[tileIndex(state, p.x, p.y)]) return 'A road is in the way';
    if (state.buildingIdAt[tileIndex(state, p.x, p.y)] !== NO_BUILDING) return 'A building is in the way';
    const obstacle = terrainObstacle(state, p.x, p.y);
    if (obstacle) return obstacle;
  }
  return null;
}

export function hasRoadAccess(state: GameState, type: BuildingType, x: number, y: number): boolean {
  const { width, height } = BUILDING_SPECS[type];
  const neighbours: Point[] = [];
  for (let dx = 0; dx < width; dx++) neighbours.push({ x: x + dx, y: y - 1 }, { x: x + dx, y: y + height });
  for (let dy = 0; dy < height; dy++) neighbours.push({ x: x - 1, y: y + dy }, { x: x + width, y: y + dy });
  return neighbours.some((p) => inBounds(state, p.x, p.y) && state.roads[tileIndex(state, p.x, p.y)]);
}

export function checkBuildingPlacement(
  state: GameState,
  type: BuildingType,
  x: number,
  y: number,
): { obstacle: string | null; roadAccess: boolean } {
  return { obstacle: footprintObstacle(state, type, x, y), roadAccess: hasRoadAccess(state, type, x, y) };
}

export function placeBuilding(state: GameState, type: BuildingType, x: number, y: number): Result {
  const obstacle = footprintObstacle(state, type, x, y);
  if (obstacle) return fail(obstacle);
  const building = { id: state.nextBuildingId++, type, x, y };
  state.buildings.push(building);
  for (const p of footprint(type, x, y)) state.buildingIdAt[tileIndex(state, p.x, p.y)] = building.id;
  state.version++;
  return OK;
}

export function demolish(state: GameState, from: Point, to: Point): void {
  const doomed = new Set<number>();
  for (const p of tilesIn(rectBetween(clampToMap(state, from), clampToMap(state, to)))) {
    const i = tileIndex(state, p.x, p.y);
    state.roads[i] = false;
    if (state.buildingIdAt[i] !== NO_BUILDING) doomed.add(state.buildingIdAt[i]);
  }
  state.buildings = state.buildings.filter((b) => !doomed.has(b.id));
  state.buildingIdAt = state.buildingIdAt.map((id) => (doomed.has(id) ? NO_BUILDING : id));
  state.version++;
}

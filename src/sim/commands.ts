import { BUILDING_SPECS, type BuildingType } from './buildings';
import { rectBetween, tilesIn, type Point } from './point';
import { NO_BUILDING, clampToMap, inBounds, tileIndex, type Building, type GameState } from './state';
import { BUILDABLE, TERRAIN_NAMES } from './terrain';
import { ROAD_TILE_COST } from './treasury';

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
  for (const p of path) {
    const i = tileIndex(state, p.x, p.y);
    if (!state.roads[i]) state.treasury -= ROAD_TILE_COST;
    state.roads[i] = true;
  }
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

function adjacentRoadTilesOf(state: GameState, type: BuildingType, x: number, y: number): Point[] {
  const { width, height } = BUILDING_SPECS[type];
  const neighbours: Point[] = [];
  for (let dx = 0; dx < width; dx++) neighbours.push({ x: x + dx, y: y - 1 }, { x: x + dx, y: y + height });
  for (let dy = 0; dy < height; dy++) neighbours.push({ x: x - 1, y: y + dy }, { x: x + width, y: y + dy });
  return neighbours.filter((p) => inBounds(state, p.x, p.y) && state.roads[tileIndex(state, p.x, p.y)]);
}

export function adjacentRoadTiles(state: GameState, building: Building): Point[] {
  return adjacentRoadTilesOf(state, building.type, building.x, building.y);
}

export function hasRoadAccess(state: GameState, type: BuildingType, x: number, y: number): boolean {
  return adjacentRoadTilesOf(state, type, x, y).length > 0;
}

export function checkBuildingPlacement(
  state: GameState,
  type: BuildingType,
  x: number,
  y: number,
): { obstacle: string | null; roadAccess: boolean } {
  return { obstacle: placementObstacle(state, type, x, y), roadAccess: hasRoadAccess(state, type, x, y) };
}

function placementObstacle(state: GameState, type: BuildingType, x: number, y: number): string | null {
  if (type === 'palace' && state.buildings.some((b) => b.type === 'palace')) return 'Only one palace is allowed';
  return footprintObstacle(state, type, x, y);
}

export function placeBuilding(state: GameState, type: BuildingType, x: number, y: number): Result {
  const obstacle = placementObstacle(state, type, x, y);
  if (obstacle) return fail(obstacle);
  build(state, type, x, y);
  state.version++;
  return OK;
}

function build(state: GameState, type: BuildingType, x: number, y: number): void {
  const building = {
    id: state.nextBuildingId++,
    type,
    x,
    y,
    residents: 0,
    workers: 0,
    walkerRest: 0,
    coveredUntil: { water: 0, tax: 0 },
  };
  state.buildings.push(building);
  for (const p of footprint(type, x, y)) state.buildingIdAt[tileIndex(state, p.x, p.y)] = building.id;
  state.treasury -= BUILDING_SPECS[type].cost;
}

function lotStarts(from: number, to: number, size: number): number[] {
  const count = Math.max(1, Math.floor((Math.abs(to - from) + 1) / size));
  return Array.from({ length: count }, (_, k) => (to >= from ? from + k * size : from - k * size - (size - 1)));
}

export function lotOrigins(from: Point, to: Point): Point[] {
  const { width, height } = BUILDING_SPECS.house;
  const xs = lotStarts(from.x, to.x, width);
  return lotStarts(from.y, to.y, height).flatMap((y) => xs.map((x) => ({ x, y })));
}

export function placeHouses(state: GameState, from: Point, to: Point): Result {
  const obstacles: string[] = [];
  let placed = 0;
  for (const lot of lotOrigins(from, to)) {
    const obstacle = footprintObstacle(state, 'house', lot.x, lot.y);
    if (obstacle) {
      obstacles.push(obstacle);
      continue;
    }
    build(state, 'house', lot.x, lot.y);
    placed++;
  }
  if (placed === 0) return fail(obstacles[0]);
  state.version++;
  return OK;
}

export function demolish(state: GameState, from: Point, to: Point): void {
  const doomed = new Set<number>();
  for (const p of tilesIn(rectBetween(clampToMap(state, from), clampToMap(state, to)))) {
    const i = tileIndex(state, p.x, p.y);
    state.roads[i] = false;
    if (state.terrain[i] === 'forest') state.terrain[i] = 'grass';
    if (state.buildingIdAt[i] !== NO_BUILDING) doomed.add(state.buildingIdAt[i]);
  }
  state.buildings = state.buildings.filter((b) => !doomed.has(b.id));
  state.roamers = state.roamers.filter((r) => !doomed.has(r.homeId));
  state.buildingIdAt = state.buildingIdAt.map((id) => (doomed.has(id) ? NO_BUILDING : id));
  state.version++;
}

import { AGORA_VENDOR_SPOTS, BUILDING_SPECS, footprintDistance, type BuildingType } from './buildings';
import { rectBetween, tilesIn, type Point } from './point';
import { NO_BUILDING, clampToMap, inBounds, tileIndex, type Building, type GameState } from './state';
import { BUILDABLE, TERRAIN_NAMES } from './terrain';
import { ROADBLOCK_COST, ROAD_TILE_COST } from './treasury';

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

export function roadblockObstacle(state: GameState, at: Point): string | null {
  const i = tileIndex(state, at.x, at.y);
  if (!state.roads[i]) return 'A roadblock goes on a road';
  if (state.roadblocks[i]) return 'A roadblock is already there';
  return null;
}

export function placeRoadblock(state: GameState, at: Point): Result {
  const obstacle = roadblockObstacle(state, at);
  if (obstacle) return fail(obstacle);
  state.roadblocks[tileIndex(state, at.x, at.y)] = true;
  state.treasury -= ROADBLOCK_COST;
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

export function agoraAt(state: GameState, p: Point): Building | null {
  return state.buildings.find((b) => b.type === 'agora' && footprintDistance(b, p) === 0) ?? null;
}

export function vendorSpotAt(state: GameState, p: Point): Point | null {
  const agora = agoraAt(state, p);
  if (!agora) return null;
  const spots = AGORA_VENDOR_SPOTS.map((offset) => ({ x: agora.x + offset.x, y: agora.y + offset.y }));
  return spots.find((spot) => p.y >= spot.y && p.y < spot.y + BUILDING_SPECS.foodVendor.height) ?? null;
}

export function roadSite(state: GameState, building: Building): Building {
  if (building.type !== 'foodVendor') return building;
  const agora = agoraAt(state, building);
  if (!agora) throw new Error(`Vendor ${building.id} stands on no agora`);
  return agora;
}

export function adjacentRoadTiles(state: GameState, building: Building): Point[] {
  const site = roadSite(state, building);
  return adjacentRoadTilesOf(state, site.type, site.x, site.y);
}

export function hasRoadAccess(state: GameState, type: BuildingType, x: number, y: number): boolean {
  if (type !== 'foodVendor') return adjacentRoadTilesOf(state, type, x, y).length > 0;
  const agora = agoraAt(state, { x, y });
  return agora !== null && adjacentRoadTiles(state, agora).length > 0;
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
  if (type === 'foodVendor') return vendorObstacle(state, x, y);
  const obstacle = footprintObstacle(state, type, x, y);
  if (obstacle || type !== 'wheatFarm') return obstacle;
  const onMeadow = footprint(type, x, y).every((p) => state.terrain[tileIndex(state, p.x, p.y)] === 'meadow');
  return onMeadow ? null : 'A wheat farm needs meadow';
}

function vendorObstacle(state: GameState, x: number, y: number): string | null {
  const spot = vendorSpotAt(state, { x, y });
  const taken = state.buildings.some((b) => b.type === 'foodVendor' && b.x === x && b.y === y);
  const free = spot !== null && spot.x === x && spot.y === y && !taken;
  return free ? null : 'A vendor goes on a free spot of an agora';
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
    level: 'hut' as const,
    food: 0,
    growth: 0,
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
    state.roadblocks[i] = false;
    if (state.terrain[i] === 'forest') state.terrain[i] = 'grass';
    if (state.buildingIdAt[i] !== NO_BUILDING) doomed.add(state.buildingIdAt[i]);
  }
  const agoraOfVendor = new Map<number, number>();
  for (const vendor of state.buildings.filter((b) => b.type === 'foodVendor')) {
    const agoraId = roadSite(state, vendor).id;
    if (doomed.has(agoraId)) doomed.add(vendor.id);
    else agoraOfVendor.set(vendor.id, agoraId);
  }
  state.buildings = state.buildings.filter((b) => !doomed.has(b.id));
  state.roamers = state.roamers.filter((r) => !doomed.has(r.homeId));
  state.carriers = state.carriers.filter((c) => !doomed.has(c.homeId));
  state.buildingIdAt = state.buildingIdAt.map((id) => (doomed.has(id) ? (agoraOfVendor.get(id) ?? NO_BUILDING) : id));
  state.version++;
}

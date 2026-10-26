import {
  AGORA_VENDOR_SPOTS,
  BUILDING_SPECS,
  buildingSize,
  footprintDistance,
  isAgoraVendor,
  localToWorld,
  worldToLocal,
  type BuildingType,
  type Placement,
  type Rotation,
} from './buildings';
import { rectBetween, tilesIn, type Point } from './point';
import { guildObstacle, raiseGuild } from './guild';
import { RIPE_CROP } from './olives';
import { isSanctuary, sanctuaryObstacle, takeInitialMarble } from './sanctuaries';
import { GRAZE_PAUSE_TICKS, isPasture } from './sheep';
import { NO_BUILDING, clampToMap, inBounds, tileIndex, type Building, type GameState } from './state';
import { BUILDABLE, TERRAIN_NAMES } from './terrain';
import { ROADBLOCK_COST, ROAD_TILE_COST, SHEEP_COST } from './treasury';
import { walkerTile } from './walking';

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

export function sheepObstacle(state: GameState, at: Point): string | null {
  if (!inBounds(state, at.x, at.y)) return 'Outside the map';
  return isPasture(state, at) ? null : 'Sheep graze on open meadow';
}

export function placeSheep(state: GameState, at: Point): Result {
  const obstacle = sheepObstacle(state, at);
  if (obstacle) return fail(obstacle);
  state.sheep.push({ id: state.nextSheepId++, home: at, path: [at], step: 0, progress: 0, fleece: 1, grazeRest: GRAZE_PAUSE_TICKS });
  state.treasury -= SHEEP_COST;
  state.version++;
  return OK;
}

export function footprint({ type, x, y, rotation }: Placement): Point[] {
  const { width, height } = buildingSize(type, rotation);
  return tilesIn({ minX: x, minY: y, maxX: x + width - 1, maxY: y + height - 1 });
}

function footprintObstacle(state: GameState, placement: Placement): string | null {
  for (const p of footprint(placement)) {
    if (!inBounds(state, p.x, p.y)) return 'Outside the map';
    if (state.roads[tileIndex(state, p.x, p.y)]) return 'A road is in the way';
    if (state.buildingIdAt[tileIndex(state, p.x, p.y)] !== NO_BUILDING) return 'A building is in the way';
    const obstacle = terrainObstacle(state, p.x, p.y);
    if (obstacle) return obstacle;
  }
  return null;
}

function adjacentRoadTilesOf(state: GameState, { type, x, y, rotation }: Placement): Point[] {
  const { width, height } = buildingSize(type, rotation);
  const neighbours: Point[] = [];
  for (let dx = 0; dx < width; dx++) neighbours.push({ x: x + dx, y: y - 1 }, { x: x + dx, y: y + height });
  for (let dy = 0; dy < height; dy++) neighbours.push({ x: x - 1, y: y + dy }, { x: x + width, y: y + dy });
  return neighbours.filter((p) => inBounds(state, p.x, p.y) && state.roads[tileIndex(state, p.x, p.y)]);
}

export function agoraAt(state: GameState, p: Point): Building | null {
  return state.buildings.find((b) => b.type === 'agora' && footprintDistance(b, p) === 0) ?? null;
}

export function agoraVendors(state: GameState, agora: Building): Building[] {
  return state.buildings.filter((b) => isAgoraVendor(b.type) && agoraAt(state, b) === agora);
}

export function vendorSpotAt(state: GameState, p: Point): Point | null {
  const agora = agoraAt(state, p);
  if (!agora) return null;
  const { width, height } = BUILDING_SPECS.foodVendor;
  const local = worldToLocal(agora, p);
  const spot = AGORA_VENDOR_SPOTS.find((s) => local.y >= s.y && local.y < s.y + height);
  if (!spot) return null;
  const corners = [spot, { x: spot.x + width - 1, y: spot.y + height - 1 }].map((c) => localToWorld(agora, c));
  return { x: Math.min(...corners.map((c) => c.x)), y: Math.min(...corners.map((c) => c.y)) };
}

export function roadSite(state: GameState, building: Building): Building {
  if (!isAgoraVendor(building.type)) return building;
  const agora = agoraAt(state, building);
  if (!agora) throw new Error(`Vendor ${building.id} stands on no agora`);
  return agora;
}

export function adjacentRoadTiles(state: GameState, building: Building): Point[] {
  return adjacentRoadTilesOf(state, roadSite(state, building));
}

export function hasRoadAccess(state: GameState, placement: Placement): boolean {
  if (!isAgoraVendor(placement.type)) return adjacentRoadTilesOf(state, placement).length > 0;
  const agora = agoraAt(state, placement);
  return agora !== null && adjacentRoadTiles(state, agora).length > 0;
}

export function checkBuildingPlacement(
  state: GameState,
  type: BuildingType,
  x: number,
  y: number,
  rotation: Rotation = 0,
): { obstacle: string | null; roadAccess: boolean } {
  const placement = { type, x, y, rotation };
  return { obstacle: placementObstacle(state, placement), roadAccess: hasRoadAccess(state, placement) };
}

const MEADOW_REASONS: Partial<Record<BuildingType, string>> = {
  wheatFarm: 'A wheat farm needs meadow',
  oliveTree: 'An olive tree needs meadow',
};

function placementObstacle(state: GameState, placement: Placement): string | null {
  const { type, x, y } = placement;
  if (type === 'palace' && state.buildings.some((b) => b.type === 'palace')) return 'Only one palace is allowed';
  if (isAgoraVendor(type)) return vendorObstacle(state, x, y);
  if (type === 'tradersGuild') return guildObstacle(state, placement);
  if (isSanctuary(type)) return footprintObstacle(state, placement) ?? sanctuaryObstacle(state, type);
  const obstacle = footprintObstacle(state, placement);
  const meadowReason = MEADOW_REASONS[type];
  if (obstacle || !meadowReason) return obstacle;
  const onMeadow = footprint(placement).every((p) => state.terrain[tileIndex(state, p.x, p.y)] === 'meadow');
  return onMeadow ? null : meadowReason;
}

function vendorObstacle(state: GameState, x: number, y: number): string | null {
  const spot = vendorSpotAt(state, { x, y });
  const taken = state.buildings.some((b) => isAgoraVendor(b.type) && b.x === x && b.y === y);
  const free = spot !== null && spot.x === x && spot.y === y && !taken;
  return free ? null : 'A vendor goes on a free spot of an agora';
}

export function placeBuilding(state: GameState, type: BuildingType, x: number, y: number, rotation: Rotation = 0): Result {
  const placement = { type, x, y, rotation };
  const obstacle = placementObstacle(state, placement);
  if (obstacle) return fail(obstacle);
  const agora = isAgoraVendor(type) ? agoraAt(state, placement) : null;
  const building = type === 'tradersGuild' ? raiseGuild(state, placement) : build(state, agora ? { ...placement, rotation: agora.rotation } : placement);
  if (isSanctuary(type)) takeInitialMarble(state, building);
  state.version++;
  return OK;
}

export function build(state: GameState, placement: Placement): Building {
  state.treasury -= BUILDING_SPECS[placement.type].cost;
  return addBuilding(state, placement);
}

export function addBuilding(state: GameState, placement: Placement): Building {
  const building = {
    id: state.nextBuildingId++,
    ...placement,
    residents: 0,
    workers: 0,
    walkerRest: 0,
    coveredUntil: { water: 0, tax: 0, philosophy: 0, athletics: 0, drama: 0 },
    level: 'hut' as const,
    pendingLevel: null,
    pendingTicks: 0,
    food: 0,
    fleece: 0,
    olives: 0,
    oil: 0,
    wood: 0,
    marble: 0,
    bronze: 0,
    sculptures: 0,
    cloth: 0,
    refused: [],
    growth: placement.type === 'oliveTree' ? RIPE_CROP : 0,
    production: 0,
    performingUntil: 0,
    fireRisk: 0,
    collapseRisk: 0,
    burningUntil: 0,
  };
  state.buildings.push(building);
  for (const p of footprint(placement)) state.buildingIdAt[tileIndex(state, p.x, p.y)] = building.id;
  return building;
}

function lotStarts(from: number, to: number, size: number): number[] {
  const count = Math.max(1, Math.floor((Math.abs(to - from) + 1) / size));
  return Array.from({ length: count }, (_, k) => (to >= from ? from + k * size : from - k * size - (size - 1)));
}

export function lotOrigins(from: Point, to: Point, type: BuildingType = 'house'): Point[] {
  const { width, height } = BUILDING_SPECS[type];
  const xs = lotStarts(from.x, to.x, width);
  return lotStarts(from.y, to.y, height).flatMap((y) => xs.map((x) => ({ x, y })));
}

export function placeHouses(state: GameState, from: Point, to: Point, rotation: Rotation = 0): Result {
  return placeLots(state, 'house', from, to, rotation);
}

export function placeOliveTrees(state: GameState, from: Point, to: Point): Result {
  return placeLots(state, 'oliveTree', from, to, 0);
}

function placeLots(state: GameState, type: BuildingType, from: Point, to: Point, rotation: Rotation): Result {
  const obstacles: string[] = [];
  let placed = 0;
  for (const lot of lotOrigins(from, to, type)) {
    const placement = { type, ...lot, rotation };
    const obstacle = placementObstacle(state, placement);
    if (obstacle) {
      obstacles.push(obstacle);
      continue;
    }
    build(state, placement);
    placed++;
  }
  if (placed === 0) return fail(obstacles[0]);
  state.version++;
  return OK;
}

export function demolish(state: GameState, from: Point, to: Point): void {
  const doomed = new Set<number>();
  const area = rectBetween(clampToMap(state, from), clampToMap(state, to));
  state.sheep = state.sheep.filter((sheep) => {
    const at = walkerTile(sheep);
    return at.x < area.minX || at.x > area.maxX || at.y < area.minY || at.y > area.maxY;
  });
  for (const p of tilesIn(area)) {
    const i = tileIndex(state, p.x, p.y);
    if (!state.mainRoad[i]) state.roads[i] = false;
    state.roadblocks[i] = false;
    if (state.terrain[i] === 'forest') state.terrain[i] = 'grass';
    if (state.buildingIdAt[i] !== NO_BUILDING) doomed.add(state.buildingIdAt[i]);
  }
  removeBuildings(state, doomed);
  state.version++;
}

export function removeBuildings(state: GameState, doomed: Set<number>): void {
  const agoraOfVendor = new Map<number, number>();
  for (const vendor of state.buildings.filter((b) => isAgoraVendor(b.type))) {
    const agoraId = roadSite(state, vendor).id;
    if (doomed.has(agoraId)) doomed.add(vendor.id);
    else agoraOfVendor.set(vendor.id, agoraId);
  }
  state.buildings = state.buildings.filter((b) => !doomed.has(b.id));
  state.roamers = state.roamers.filter((r) => !doomed.has(r.homeId));
  state.carriers = state.carriers.filter((c) => !doomed.has(c.homeId));
  state.trainees = state.trainees.filter((t) => !doomed.has(t.homeId));
  state.shepherds = state.shepherds.filter((s) => !doomed.has(s.homeId));
  state.growers = state.growers.filter((g) => !doomed.has(g.homeId));
  state.gatherers = state.gatherers.filter((g) => !doomed.has(g.homeId));
  state.artisans = state.artisans.filter((a) => !doomed.has(a.homeId));
  state.buildingIdAt = state.buildingIdAt.map((id) => (doomed.has(id) ? (agoraOfVendor.get(id) ?? NO_BUILDING) : id));
}

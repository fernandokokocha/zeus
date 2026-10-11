import { BUILDING_SPECS, type BuildingType } from './buildings';
import { TICKS_PER_MONTH } from './clock';
import { adjacentRoadTiles } from './commands';
import { NEIGHBOUR_STEPS, findRoadPath } from './pathfinding';
import type { Point } from './point';
import { nextRandom } from './rng';
import { buildingById, inBounds, type Building, type GameState, type Roamer, type RoamerKind, type Service } from './state';
import { WALKER_TILES_PER_TICK, isRoad } from './walking';

export interface RoamerSpec {
  name: string;
  home: BuildingType;
  range: number;
  service: Service;
}

export const ROAMER_SPECS: Record<RoamerKind, RoamerSpec> = {
  waterCarrier: { name: 'Water Carrier', home: 'fountain', range: 27, service: 'water' },
  taxCollector: { name: 'Tax Collector', home: 'taxOffice', range: 35, service: 'tax' },
};

export const SERVICE_REACH = 2;
export const SERVICE_MONTHS = 2;
export const ROAMER_REST_TICKS = TICKS_PER_MONTH / 4;

export function roamerKindSentBy(type: BuildingType): RoamerKind | null {
  const kinds = Object.keys(ROAMER_SPECS) as RoamerKind[];
  return kinds.find((kind) => ROAMER_SPECS[kind].home === type) ?? null;
}

export function hasService(state: GameState, house: Building, service: Service): boolean {
  return state.tick < house.coveredUntil[service];
}

export function exitTile(state: GameState, building: Building): Point | null {
  const { width, height } = BUILDING_SPECS[building.type];
  const { x, y } = building;
  const along = (count: number, at: (i: number) => Point) => Array.from({ length: count }, (_, i) => at(i));
  const clockwiseFromNorth = [
    ...along(width, (i) => ({ x: x + i, y: y - 1 })),
    ...along(height, (i) => ({ x: x + width, y: y + i })),
    ...along(width, (i) => ({ x: x + width - 1 - i, y: y + height })),
    ...along(height, (i) => ({ x: x - 1, y: y + height - 1 - i })),
  ];
  return clockwiseFromNorth.find((p) => inBounds(state, p.x, p.y) && isRoad(state, p)) ?? null;
}

const samePoint = (a: Point, b: Point) => a.x === b.x && a.y === b.y;

export function nextRoamTile(state: GameState, walked: Point[]): Point | null {
  const here = walked[walked.length - 1];
  const previous = walked.length > 1 ? walked[walked.length - 2] : null;
  const roads = NEIGHBOUR_STEPS.map((s) => ({ x: here.x + s.x, y: here.y + s.y })).filter(
    (p) => inBounds(state, p.x, p.y) && isRoad(state, p),
  );
  const fresh = roads.filter((p) => !walked.some((w) => samePoint(w, p)));
  const onward = roads.filter((p) => !previous || !samePoint(p, previous));
  const choices = fresh.length > 0 ? fresh : onward.length > 0 ? onward : roads;
  if (choices.length === 0) return null;
  return choices[Math.floor(nextRandom(state) * choices.length)];
}

export function tickRoamers(state: GameState): void {
  for (const building of state.buildings) sendRoamer(state, building);
  for (const roamer of [...state.roamers]) moveRoamer(state, roamer);
}

function sendRoamer(state: GameState, building: Building): void {
  const kind = roamerKindSentBy(building.type);
  if (!kind || building.workers === 0 || state.roamers.some((r) => r.homeId === building.id)) return;
  building.walkerRest += building.workers / BUILDING_SPECS[building.type].workers;
  if (building.walkerRest < ROAMER_REST_TICKS) return;

  const exit = exitTile(state, building);
  if (!exit) throw new Error(`Building ${building.id} has workers but no road to leave by`);
  building.walkerRest = 0;
  const roamer: Roamer = {
    id: state.nextRoamerId++,
    kind,
    homeId: building.id,
    path: [exit],
    step: 0,
    progress: 0,
    returning: false,
  };
  state.roamers.push(roamer);
  serveAround(state, roamer);
  carryOn(state, roamer, building);
}

function moveRoamer(state: GameState, roamer: Roamer): void {
  const home = buildingById(state, roamer.homeId);
  if (!home || !isRoad(state, roamer.path[roamer.step])) return dismiss(state, roamer);

  roamer.progress += WALKER_TILES_PER_TICK;
  while (roamer.progress >= 1) {
    if (!isRoad(state, roamer.path[roamer.step + 1])) {
      roamer.path.splice(roamer.step + 1);
      if (!carryOn(state, roamer, home)) return;
      continue;
    }
    roamer.step++;
    roamer.progress--;
    serveAround(state, roamer);
    if (roamer.step === roamer.path.length - 1 && !carryOn(state, roamer, home)) return;
  }
}

function carryOn(state: GameState, roamer: Roamer, home: Building): boolean {
  if (!roamer.returning && roamer.step < ROAMER_SPECS[roamer.kind].range) {
    const next = nextRoamTile(state, roamer.path);
    if (next) {
      roamer.path.push(next);
      return true;
    }
  }
  return headHome(state, roamer, home);
}

function headHome(state: GameState, roamer: Roamer, home: Building): boolean {
  const path = findRoadPath(state, roamer.path[roamer.step], adjacentRoadTiles(state, home));
  if (!path || path.length === 1) {
    dismiss(state, roamer);
    return false;
  }
  roamer.returning = true;
  roamer.path = path;
  roamer.step = 0;
  return true;
}

function dismiss(state: GameState, roamer: Roamer): void {
  state.roamers = state.roamers.filter((r) => r !== roamer);
}

function serveAround(state: GameState, roamer: Roamer): void {
  const tile = roamer.path[roamer.step];
  const until = state.tick + SERVICE_MONTHS * TICKS_PER_MONTH;
  const service = ROAMER_SPECS[roamer.kind].service;
  for (const house of state.buildings) {
    if (house.type === 'house' && distanceToBuilding(house, tile) <= SERVICE_REACH) house.coveredUntil[service] = until;
  }
}

function distanceToBuilding(building: Building, p: Point): number {
  const { width, height } = BUILDING_SPECS[building.type];
  const dx = Math.max(building.x - p.x, 0, p.x - (building.x + width - 1));
  const dy = Math.max(building.y - p.y, 0, p.y - (building.y + height - 1));
  return Math.max(dx, dy);
}

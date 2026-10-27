import { BUILDING_SPECS, buildingSize, footprintDistance, vendorGood, type BuildingType } from './buildings';
import { TICKS_PER_MONTH } from './clock';
import { adjacentRoadTiles, agoraVendors, roadSite } from './commands';
import { stockHouse } from './food';
import { isResidence } from './housing';
import { NEIGHBOUR_STEPS, findRoadPath } from './pathfinding';
import { samePoint, type Point } from './point';
import { nextRandom } from './rng';
import { isPerforming, traineeKindFor } from './schools';
import { maintain } from './safety';
import { buildingById, inBounds, tileIndex, type Building, type GameState, type Roamer, type Coverage, type RoamerKind, type Service } from './state';
import { isRoad, walkerSpeed } from './walking';

export interface RoamerSpec {
  name: string;
  home: BuildingType;
  range: number;
  service: Service;
}

export const ROAMER_SPECS: Record<RoamerKind, RoamerSpec> = {
  waterCarrier: { name: 'Water Carrier', home: 'fountain', range: 27, service: 'water' },
  taxCollector: { name: 'Tax Collector', home: 'taxOffice', range: 35, service: 'tax' },
  peddler: { name: 'Peddler', home: 'agora', range: 44, service: 'goods' },
  philosopher: { name: 'Philosopher', home: 'podium', range: 35, service: 'philosophy' },
  athlete: { name: 'Athlete', home: 'gymnasium', range: 35, service: 'athletics' },
  actor: { name: 'Actor', home: 'theater', range: 35, service: 'drama' },
  superintendent: { name: 'Superintendent', home: 'maintenanceOffice', range: 44, service: 'maintenance' },
};

export const SERVICE_REACH = 2;
export const COVERAGE_MONTHS: Record<Coverage, number> = { water: 4, tax: 2, philosophy: 2, athletics: 2, drama: 2 };
export const ROAMER_REST_TICKS = TICKS_PER_MONTH / 4;

export function hasGoodsToSell(state: GameState, agora: Building): boolean {
  return agoraVendors(state, agora).some((stall) => stall[vendorGood(stall)] > 0);
}

function staffing(state: GameState, building: Building): number {
  const staff = building.type === 'agora' ? agoraVendors(state, building) : [building];
  const workers = staff.reduce((sum, b) => sum + b.workers, 0);
  const posts = staff.reduce((sum, b) => sum + BUILDING_SPECS[b.type].workers, 0);
  return posts === 0 ? 0 : workers / posts;
}

export function roamerKindSentBy(type: BuildingType): RoamerKind | null {
  const kinds = Object.keys(ROAMER_SPECS) as RoamerKind[];
  return kinds.find((kind) => ROAMER_SPECS[kind].home === type) ?? null;
}

export function hasService(state: GameState, house: Building, service: Coverage): boolean {
  return state.tick < house.coveredUntil[service];
}

export function serviceLeft(state: GameState, house: Building, service: Coverage): number {
  return Math.max(0, house.coveredUntil[service] - state.tick) / (COVERAGE_MONTHS[service] * TICKS_PER_MONTH);
}

export function exitTile(state: GameState, building: Building): Point | null {
  const site = roadSite(state, building);
  const { width, height } = buildingSize(site.type, site.rotation);
  const { x, y } = site;
  const along = (count: number, at: (i: number) => Point) => Array.from({ length: count }, (_, i) => at(i));
  const clockwiseFromNorth = [
    ...along(width, (i) => ({ x: x + i, y: y - 1 })),
    ...along(height, (i) => ({ x: x + width, y: y + i })),
    ...along(width, (i) => ({ x: x + width - 1 - i, y: y + height })),
    ...along(height, (i) => ({ x: x - 1, y: y + height - 1 - i })),
  ];
  return clockwiseFromNorth.find((p) => inBounds(state, p.x, p.y) && isRoad(state, p)) ?? null;
}

export function nextRoamTile(state: GameState, walked: Point[]): Point | null {
  const here = walked[walked.length - 1];
  const previous = walked.length > 1 ? walked[walked.length - 2] : null;
  const roads = NEIGHBOUR_STEPS.map((s) => ({ x: here.x + s.x, y: here.y + s.y })).filter(
    (p) => inBounds(state, p.x, p.y) && isRoad(state, p) && !state.roadblocks[tileIndex(state, p.x, p.y)],
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
  if (!kind || state.roamers.some((r) => r.homeId === building.id)) return;
  const staffed = staffing(state, building);
  if (staffed === 0) return;
  if (ROAMER_SPECS[kind].service === 'goods' && !hasGoodsToSell(state, building)) return;
  if (traineeKindFor(building.type) && !isPerforming(state, building)) return;
  building.walkerRest += staffed;
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
  if (!home) throw new Error(`Roamer ${roamer.id} outlived its home ${roamer.homeId}`);
  if (!isRoad(state, roamer.path[roamer.step])) return dismiss(state, roamer);

  roamer.progress += walkerSpeed(state, roamer);
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
  const service = ROAMER_SPECS[roamer.kind].service;
  if (service === 'maintenance') {
    for (const building of state.buildings.filter((b) => footprintDistance(b, tile) <= SERVICE_REACH)) maintain(state, building);
    return;
  }
  const houses = state.buildings.filter((b) => isResidence(b) && footprintDistance(b, tile) <= SERVICE_REACH);
  if (service === 'goods') {
    const agora = buildingById(state, roamer.homeId);
    if (!agora) throw new Error(`Peddler ${roamer.id} sells for missing agora ${roamer.homeId}`);
    const stalls = agoraVendors(state, agora);
    for (const house of houses) for (const stall of stalls) stockHouse(stall, house, vendorGood(stall));
    return;
  }
  const until = state.tick + COVERAGE_MONTHS[service] * TICKS_PER_MONTH;
  for (const house of houses) house.coveredUntil[service] = until;
}

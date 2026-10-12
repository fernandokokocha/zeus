import { BUILDING_SPECS, footprintDistance, type BuildingType } from './buildings';
import { TICKS_PER_YEAR } from './clock';
import { adjacentRoadTiles } from './commands';
import { CART_LOAD, UNITS_PER_LOAD } from './food';
import { NEIGHBOUR_STEPS, findOpenPath, isOpenGround } from './pathfinding';
import { samePoint, type Point } from './point';
import { exitTile } from './roamers';
import { buildingById, inBounds, tileIndex, type Building, type GameState, type Gatherer, type Material } from './state';
import type { Terrain } from './terrain';
import { walkPath } from './walking';

export type Workshop = 'timberMill' | 'masonryShop' | 'foundry';

export interface WorkshopSpec {
  good: Material;
  resource: Terrain;
  loadsPerYear: number;
  gatherer: string;
  work: string;
}

export const WORKSHOP_SPECS: Record<Workshop, WorkshopSpec> = {
  timberMill: { good: 'wood', resource: 'forest', loadsPerYear: 13, gatherer: 'Lumberjack', work: 'fell' },
  masonryShop: { good: 'marble', resource: 'marble', loadsPerYear: 12, gatherer: 'Quarryman', work: 'cut' },
  foundry: { good: 'bronze', resource: 'copper', loadsPerYear: 13, gatherer: 'Miner', work: 'dig' },
};

export const RESOURCE_RANGE = 20;
export const WORKSHOP_CAPACITY = CART_LOAD;
export const FOREST_REGROWTH_TICKS = 4 * TICKS_PER_YEAR;

export function isWorkshop(type: BuildingType): type is Workshop {
  return type in WORKSHOP_SPECS;
}

export function gatheringRestTicks(type: Workshop): number {
  return TICKS_PER_YEAR / WORKSHOP_SPECS[type].loadsPerYear;
}

export function isFelled(state: GameState, p: Point): boolean {
  return state.tick < state.felledUntil[tileIndex(state, p.x, p.y)];
}

export function isResource(state: GameState, type: Workshop, p: Point): boolean {
  return state.terrain[tileIndex(state, p.x, p.y)] === WORKSHOP_SPECS[type].resource && !isFelled(state, p);
}

function isTaken(state: GameState, site: Point): boolean {
  return state.gatherers.some((g) => !g.returning && samePoint(g.site, site));
}

export function sitesToWork(state: GameState, shop: Building, type: Workshop): Point[] {
  const sites: Point[] = [];
  for (let y = shop.y - RESOURCE_RANGE; y <= shop.y + RESOURCE_RANGE + 1; y++) {
    for (let x = shop.x - RESOURCE_RANGE; x <= shop.x + RESOURCE_RANGE + 1; x++) {
      const p = { x, y };
      if (!inBounds(state, x, y) || footprintDistance(shop, p) > RESOURCE_RANGE) continue;
      if (isResource(state, type, p) && !isTaken(state, p)) sites.push(p);
    }
  }
  return sites;
}

function neighbours(p: Point): Point[] {
  return NEIGHBOUR_STEPS.map((s) => ({ x: p.x + s.x, y: p.y + s.y }));
}

function standingTiles(state: GameState, sites: Point[]): Point[] {
  return sites.flatMap(neighbours).filter((p) => inBounds(state, p.x, p.y) && isOpenGround(state, p));
}

function isNextTo(a: Point, b: Point): boolean {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1;
}

export function tickMaterials(state: GameState): void {
  if (state.felledUntil.includes(state.tick)) state.version++;
  for (const shop of state.buildings) sendGatherer(state, shop);
  for (const gatherer of [...state.gatherers]) moveGatherer(state, gatherer);
}

function sendGatherer(state: GameState, shop: Building): void {
  const type = shop.type;
  if (!isWorkshop(type) || shop.workers === 0) return;
  const { good, resource } = WORKSHOP_SPECS[type];
  if (shop[good] >= WORKSHOP_CAPACITY || state.gatherers.some((g) => g.homeId === shop.id)) return;
  shop.walkerRest += shop.workers / BUILDING_SPECS[type].workers;
  if (shop.walkerRest < gatheringRestTicks(type)) return;

  const exit = exitTile(state, shop);
  if (!exit) throw new Error(`Workshop ${shop.id} has workers but no road to leave by`);
  const sites = sitesToWork(state, shop, type);
  const path = findOpenPath(state, exit, standingTiles(state, sites));
  if (!path) return;
  const end = path[path.length - 1];
  const site = sites.find((s) => isNextTo(s, end));
  if (!site) throw new Error(`Path ends at ${end.x}, ${end.y}, next to no ${resource}`);
  shop.walkerRest = 0;
  state.gatherers.push({ id: state.nextGathererId++, homeId: shop.id, good, site, load: 0, returning: false, path, step: 0, progress: 0 });
}

function moveGatherer(state: GameState, gatherer: Gatherer): void {
  const shop = buildingById(state, gatherer.homeId);
  if (!shop || !isWorkshop(shop.type)) throw new Error(`Gatherer ${gatherer.id} outlived his workshop ${gatherer.homeId}`);
  const type = shop.type;
  if (!isOpenGround(state, gatherer.path[gatherer.step])) return dismiss(state, gatherer);
  if (!gatherer.returning && !isResource(state, type, gatherer.site) && !headHome(state, gatherer, shop)) return;
  walkPath(
    state,
    gatherer,
    () => replan(state, gatherer, shop, type),
    () => arrive(state, gatherer, shop),
    isOpenGround,
  );
}

function replan(state: GameState, gatherer: Gatherer, shop: Building, type: Workshop): boolean {
  const reachable = !gatherer.returning && isResource(state, type, gatherer.site);
  const path = reachable ? findOpenPath(state, gatherer.path[gatherer.step], standingTiles(state, [gatherer.site])) : null;
  if (!path) return headHome(state, gatherer, shop);
  restartOn(gatherer, path);
  return true;
}

function headHome(state: GameState, gatherer: Gatherer, shop: Building): boolean {
  const path = findOpenPath(state, gatherer.path[gatherer.step], adjacentRoadTiles(state, shop));
  if (!path) {
    dismiss(state, gatherer);
    return false;
  }
  gatherer.returning = true;
  restartOn(gatherer, path);
  return true;
}

function restartOn(gatherer: Gatherer, path: Point[]): void {
  gatherer.path = path;
  gatherer.step = 0;
}

function arrive(state: GameState, gatherer: Gatherer, shop: Building): void {
  if (gatherer.returning) {
    shop[gatherer.good] += gatherer.load;
    state.version++;
    return dismiss(state, gatherer);
  }
  if (gatherer.good === 'wood') {
    state.felledUntil[tileIndex(state, gatherer.site.x, gatherer.site.y)] = state.tick + FOREST_REGROWTH_TICKS;
    state.version++;
  }
  gatherer.load = UNITS_PER_LOAD;
  headHome(state, gatherer, shop);
}

function dismiss(state: GameState, gatherer: Gatherer): void {
  state.gatherers = state.gatherers.filter((g) => g !== gatherer);
}

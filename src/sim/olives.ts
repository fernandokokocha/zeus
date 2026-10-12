import { BUILDING_SPECS, footprintDistance } from './buildings';
import { TICKS_PER_YEAR } from './clock';
import { adjacentRoadTiles } from './commands';
import { CART_LOAD, UNITS_PER_LOAD } from './food';
import { findGrovePath, isOpenGround } from './pathfinding';
import { samePoint, type Point } from './point';
import { exitTile } from './roamers';
import { NO_BUILDING, buildingById, tileIndex, type Building, type GameState, type Grower } from './state';
import { walkPath } from './walking';

export const RIPE_CROP = 1;
export const OLIVE_RIPENING_TICKS = TICKS_PER_YEAR;
export const GROVE_RANGE = 20;
export const PICKINGS_PER_YEAR = 20;
export const PICKING_REST_TICKS = TICKS_PER_YEAR / PICKINGS_PER_YEAR;
export const OLIVES_PER_PICKING = UNITS_PER_LOAD;
export const LODGE_CAPACITY = CART_LOAD;

export function isRipe(tree: Building): boolean {
  return tree.growth >= RIPE_CROP;
}

function treeAt(state: GameState, p: Point): Building | null {
  const id = state.buildingIdAt[tileIndex(state, p.x, p.y)];
  const building = id === NO_BUILDING ? undefined : buildingById(state, id);
  return building && building.type === 'oliveTree' ? building : null;
}

function isGroveGround(state: GameState, p: Point): boolean {
  return isOpenGround(state, p) || treeAt(state, p) !== null;
}

export function growerAfter(state: GameState, tree: Building): Grower | null {
  return state.growers.find((g) => !g.returning && g.treeId === tree.id) ?? null;
}

export function treesToPick(state: GameState, lodge: Building): Building[] {
  return state.buildings.filter(
    (b) => b.type === 'oliveTree' && isRipe(b) && !growerAfter(state, b) && footprintDistance(lodge, b) <= GROVE_RANGE,
  );
}

export function tickOlives(state: GameState): void {
  for (const tree of state.buildings.filter((b) => b.type === 'oliveTree')) ripen(state, tree);
  for (const lodge of state.buildings) sendGrower(state, lodge);
  for (const grower of [...state.growers]) moveGrower(state, grower);
}

function ripen(state: GameState, tree: Building): void {
  if (isRipe(tree)) return;
  tree.growth = Math.min(RIPE_CROP, tree.growth + RIPE_CROP / OLIVE_RIPENING_TICKS);
  if (isRipe(tree)) state.version++;
}

function sendGrower(state: GameState, lodge: Building): void {
  if (lodge.type !== 'growersLodge' || lodge.workers === 0 || lodge.olives >= LODGE_CAPACITY) return;
  if (state.growers.some((g) => g.homeId === lodge.id)) return;
  lodge.walkerRest += lodge.workers / BUILDING_SPECS.growersLodge.workers;
  if (lodge.walkerRest < PICKING_REST_TICKS) return;

  const exit = exitTile(state, lodge);
  if (!exit) throw new Error(`Lodge ${lodge.id} has workers but no road to leave by`);
  const trees = treesToPick(state, lodge);
  const path = findGrovePath(state, exit, trees);
  if (!path) return;
  const end = path[path.length - 1];
  const tree = trees.find((t) => samePoint(t, end));
  if (!tree) throw new Error(`Path ends at ${end.x}, ${end.y}, where no olive tree stands`);
  lodge.walkerRest = 0;
  state.growers.push({ id: state.nextGrowerId++, homeId: lodge.id, treeId: tree.id, olives: 0, returning: false, path, step: 0, progress: 0 });
}

function moveGrower(state: GameState, grower: Grower): void {
  const lodge = buildingById(state, grower.homeId);
  if (!lodge) throw new Error(`Grower ${grower.id} outlived his lodge ${grower.homeId}`);
  if (!isGroveGround(state, grower.path[grower.step])) return dismiss(state, grower);
  if (!grower.returning && !buildingById(state, grower.treeId) && !headHome(state, grower, lodge)) return;
  walkPath(
    state,
    grower,
    () => replan(state, grower, lodge),
    () => arrive(state, grower, lodge),
    isGroveGround,
  );
}

function replan(state: GameState, grower: Grower, lodge: Building): boolean {
  const tree = buildingById(state, grower.treeId);
  const path = !grower.returning && tree ? findGrovePath(state, grower.path[grower.step], [tree]) : null;
  if (!path) return headHome(state, grower, lodge);
  restartOn(grower, path);
  return true;
}

function headHome(state: GameState, grower: Grower, lodge: Building): boolean {
  const path = findGrovePath(state, grower.path[grower.step], adjacentRoadTiles(state, lodge));
  if (!path) {
    dismiss(state, grower);
    return false;
  }
  grower.returning = true;
  restartOn(grower, path);
  return true;
}

function restartOn(grower: Grower, path: Point[]): void {
  grower.path = path;
  grower.step = 0;
}

function arrive(state: GameState, grower: Grower, lodge: Building): void {
  if (grower.returning) {
    lodge.olives += grower.olives;
    state.version++;
    return dismiss(state, grower);
  }
  const tree = buildingById(state, grower.treeId);
  if (!tree) throw new Error(`Grower ${grower.id} reached missing tree ${grower.treeId}`);
  tree.growth = 0;
  grower.olives = OLIVES_PER_PICKING;
  state.version++;
  headHome(state, grower, lodge);
}

function dismiss(state: GameState, grower: Grower): void {
  state.growers = state.growers.filter((g) => g !== grower);
}

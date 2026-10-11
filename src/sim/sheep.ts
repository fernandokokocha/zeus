import { BUILDING_SPECS, footprintDistance } from './buildings';
import { TICKS_PER_MONTH, TICKS_PER_YEAR } from './clock';
import { adjacentRoadTiles } from './commands';
import { CART_LOAD, UNITS_PER_LOAD } from './food';
import { NEIGHBOUR_STEPS, findOpenPath, isOpenGround } from './pathfinding';
import type { Point } from './point';
import { nextRandom } from './rng';
import { exitTile } from './roamers';
import { buildingById, inBounds, type Building, type GameState, type Sheep, type Shepherd } from './state';
import { WALKER_TILES_PER_TICK, isRoad, walkPath } from './walking';

export const GRAZE_RADIUS = 3;
export const GRAZE_PAUSE_TICKS = TICKS_PER_MONTH / 6;
export const FLEECE_GROWTH_TICKS = TICKS_PER_YEAR;
export const SHEARING_RANGE = 40;
export const SHEARINGS_PER_YEAR = 8;
export const SHEARING_REST_TICKS = TICKS_PER_YEAR / SHEARINGS_PER_YEAR;
export const FLEECE_PER_SHEARING = UNITS_PER_LOAD;
export const SHED_CAPACITY = CART_LOAD;

const samePoint = (a: Point, b: Point) => a.x === b.x && a.y === b.y;

export function isPasture(state: GameState, p: Point): boolean {
  return inBounds(state, p.x, p.y) && isOpenGround(state, p) && !isRoad(state, p);
}

export function sheepTile(sheep: Sheep): Point {
  return sheep.path[sheep.path.length - 1];
}

export function hasFullFleece(sheep: Sheep): boolean {
  return sheep.fleece >= 1;
}

export function shepherdAfter(state: GameState, sheep: Sheep): Shepherd | null {
  return state.shepherds.find((s) => !s.returning && s.sheepId === sheep.id) ?? null;
}

export function sheepToShear(state: GameState, shed: Building): Sheep[] {
  return state.sheep.filter(
    (s) => hasFullFleece(s) && !shepherdAfter(state, s) && footprintDistance(shed, sheepTile(s)) <= SHEARING_RANGE,
  );
}

export function tickSheep(state: GameState): void {
  for (const sheep of [...state.sheep]) graze(state, sheep);
  for (const shed of state.buildings) sendShepherd(state, shed);
  for (const shepherd of [...state.shepherds]) moveShepherd(state, shepherd);
}

function graze(state: GameState, sheep: Sheep): void {
  sheep.fleece = Math.min(1, sheep.fleece + 1 / FLEECE_GROWTH_TICKS);
  if (sheep.step < sheep.path.length - 1) {
    sheep.progress += WALKER_TILES_PER_TICK;
    if (sheep.progress >= 1) {
      sheep.step++;
      sheep.progress = 0;
    }
    return;
  }
  const here = sheepTile(sheep);
  const neighbours = NEIGHBOUR_STEPS.map((s) => ({ x: here.x + s.x, y: here.y + s.y })).filter((p) => isPasture(state, p));
  if (!isPasture(state, here)) {
    if (neighbours.length === 0) return lose(state, sheep);
    return stepTo(state, sheep, here, neighbours);
  }
  if (shepherdAfter(state, sheep)) return;
  sheep.grazeRest--;
  if (sheep.grazeRest > 0) return;
  const nearHome = neighbours.filter((p) => Math.max(Math.abs(p.x - sheep.home.x), Math.abs(p.y - sheep.home.y)) <= GRAZE_RADIUS);
  if (nearHome.length > 0) stepTo(state, sheep, here, nearHome);
}

function stepTo(state: GameState, sheep: Sheep, here: Point, choices: Point[]): void {
  sheep.path = [here, choices[Math.floor(nextRandom(state) * choices.length)]];
  sheep.step = 0;
  sheep.progress = 0;
  sheep.grazeRest = GRAZE_PAUSE_TICKS * (0.5 + nextRandom(state));
}

function lose(state: GameState, sheep: Sheep): void {
  state.sheep = state.sheep.filter((s) => s !== sheep);
}

function sendShepherd(state: GameState, shed: Building): void {
  if (shed.type !== 'cardingShed' || shed.workers === 0 || shed.fleece >= SHED_CAPACITY) return;
  if (state.shepherds.some((s) => s.homeId === shed.id)) return;
  shed.walkerRest += shed.workers / BUILDING_SPECS.cardingShed.workers;
  if (shed.walkerRest < SHEARING_REST_TICKS) return;

  const exit = exitTile(state, shed);
  if (!exit) throw new Error(`Shed ${shed.id} has workers but no road to leave by`);
  const flock = sheepToShear(state, shed);
  const path = findOpenPath(state, exit, flock.map(sheepTile));
  if (!path) return;
  const sheep = flock.find((s) => samePoint(sheepTile(s), path[path.length - 1]));
  if (!sheep) throw new Error(`Path ends at ${path[path.length - 1].x}, ${path[path.length - 1].y}, where no sheep stands`);
  shed.walkerRest = 0;
  state.shepherds.push({ id: state.nextShepherdId++, homeId: shed.id, sheepId: sheep.id, fleece: 0, returning: false, path, step: 0, progress: 0 });
}

function moveShepherd(state: GameState, shepherd: Shepherd): void {
  const shed = buildingById(state, shepherd.homeId);
  if (!shed) throw new Error(`Shepherd ${shepherd.id} outlived his shed ${shepherd.homeId}`);
  if (!isOpenGround(state, shepherd.path[shepherd.step])) return dismiss(state, shepherd);
  if (!shepherd.returning) {
    const sheep = state.sheep.find((s) => s.id === shepherd.sheepId);
    if (!sheep && !headHome(state, shepherd, shed)) return;
    if (sheep && !samePoint(sheepTile(sheep), shepherd.path[shepherd.path.length - 1]) && !replan(state, shepherd, shed)) return;
  }
  walkPath(
    state,
    shepherd,
    () => replan(state, shepherd, shed),
    () => arrive(state, shepherd, shed),
    isOpenGround,
  );
}

function replan(state: GameState, shepherd: Shepherd, shed: Building): boolean {
  const sheep = state.sheep.find((s) => s.id === shepherd.sheepId);
  const path = !shepherd.returning && sheep ? findOpenPath(state, shepherd.path[shepherd.step], [sheepTile(sheep)]) : null;
  if (!path) return headHome(state, shepherd, shed);
  restartOn(shepherd, path);
  return true;
}

function headHome(state: GameState, shepherd: Shepherd, shed: Building): boolean {
  const path = findOpenPath(state, shepherd.path[shepherd.step], adjacentRoadTiles(state, shed));
  if (!path) {
    dismiss(state, shepherd);
    return false;
  }
  shepherd.returning = true;
  restartOn(shepherd, path);
  return true;
}

function restartOn(shepherd: Shepherd, path: Point[]): void {
  shepherd.path = path;
  shepherd.step = 0;
}

function arrive(state: GameState, shepherd: Shepherd, shed: Building): void {
  if (shepherd.returning) {
    shed.fleece += shepherd.fleece;
    state.version++;
    return dismiss(state, shepherd);
  }
  const sheep = state.sheep.find((s) => s.id === shepherd.sheepId);
  if (!sheep) throw new Error(`Shepherd ${shepherd.id} reached missing sheep ${shepherd.sheepId}`);
  sheep.fleece = 0;
  shepherd.fleece = FLEECE_PER_SHEARING;
  headHome(state, shepherd, shed);
}

function dismiss(state: GameState, shepherd: Shepherd): void {
  state.shepherds = state.shepherds.filter((s) => s !== shepherd);
}

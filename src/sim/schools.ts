import { BUILDING_SPECS, type BuildingType } from './buildings';
import { TICKS_PER_MONTH } from './clock';
import { adjacentRoadTiles } from './commands';
import { findRoadPath, nearestByRoad } from './pathfinding';
import type { Point } from './point';
import { ROAMER_REST_TICKS, exitTile } from './roamers';
import { NO_BUILDING, buildingById, type Building, type GameState, type Trainee, type TraineeKind } from './state';
import { isRoad, walkPath } from './walking';

export interface TraineeSpec {
  name: string;
  school: BuildingType;
  venue: BuildingType;
}

export const TRAINEE_SPECS: Record<TraineeKind, TraineeSpec> = {
  philosopherTrainee: { name: 'Philosopher', school: 'college', venue: 'podium' },
  actorTrainee: { name: 'Actor', school: 'dramaSchool', venue: 'theater' },
};

export const PERFORMANCE_MONTHS = 2;
export const PERFORMANCE_TICKS = PERFORMANCE_MONTHS * TICKS_PER_MONTH;

const TRAINEE_KINDS = Object.keys(TRAINEE_SPECS) as TraineeKind[];

export function traineeKindSentBy(type: BuildingType): TraineeKind | null {
  return TRAINEE_KINDS.find((kind) => TRAINEE_SPECS[kind].school === type) ?? null;
}

export function traineeKindFor(venue: BuildingType): TraineeKind | null {
  return TRAINEE_KINDS.find((kind) => TRAINEE_SPECS[kind].venue === venue) ?? null;
}

export function isPerforming(state: GameState, venue: Building): boolean {
  return state.tick < venue.performingUntil;
}

export function staffedVenues(state: GameState, kind: TraineeKind): Building[] {
  return state.buildings.filter((b) => b.type === TRAINEE_SPECS[kind].venue && b.workers > 0);
}

function venueSoonestOver(state: GameState, from: Point, kind: TraineeKind): { building: Building; path: Point[] } | null {
  const venues = staffedVenues(state, kind);
  const over = (venue: Building) => Math.max(venue.performingUntil, state.tick);
  const endings = [...new Set(venues.map(over))].sort((a, b) => a - b);
  for (const ending of endings) {
    const target = nearestByRoad(state, from, venues.filter((v) => over(v) === ending));
    if (target) return target;
  }
  return null;
}

export function tickSchools(state: GameState): void {
  if (state.buildings.some((b) => b.performingUntil === state.tick)) state.version++;
  for (const building of state.buildings) sendTrainee(state, building);
  for (const trainee of [...state.trainees]) moveTrainee(state, trainee);
}

function sendTrainee(state: GameState, school: Building): void {
  const kind = traineeKindSentBy(school.type);
  if (!kind || school.workers === 0 || state.trainees.some((t) => t.homeId === school.id)) return;
  school.walkerRest += school.workers / BUILDING_SPECS[school.type].workers;
  if (school.walkerRest < ROAMER_REST_TICKS) return;

  const exit = exitTile(state, school);
  if (!exit) throw new Error(`School ${school.id} has workers but no road to leave by`);
  const target = venueSoonestOver(state, exit, kind);
  if (!target) return;
  school.walkerRest = 0;
  state.trainees.push({
    id: state.nextTraineeId++,
    kind,
    homeId: school.id,
    destinationId: target.building.id,
    path: target.path,
    step: 0,
    progress: 0,
  });
}

function moveTrainee(state: GameState, trainee: Trainee): void {
  if (!buildingById(state, trainee.homeId)) throw new Error(`Trainee ${trainee.id} outlived his school ${trainee.homeId}`);
  if (!isRoad(state, trainee.path[trainee.step])) return dismiss(state, trainee);
  if (!buildingById(state, trainee.destinationId) && !replan(state, trainee)) return;
  walkPath(state, trainee, () => replan(state, trainee), () => arrive(state, trainee));
}

function replan(state: GameState, trainee: Trainee): boolean {
  const here = trainee.path[trainee.step];
  const venue = buildingById(state, trainee.destinationId);
  const path = venue ? findRoadPath(state, here, adjacentRoadTiles(state, venue)) : null;
  if (path) {
    restartOn(trainee, path);
    return true;
  }
  trainee.destinationId = NO_BUILDING;
  const target = venueSoonestOver(state, here, trainee.kind);
  if (!target) {
    dismiss(state, trainee);
    return false;
  }
  trainee.destinationId = target.building.id;
  restartOn(trainee, target.path);
  return true;
}

function restartOn(trainee: Trainee, path: Point[]): void {
  trainee.path = path;
  trainee.step = 0;
}

function arrive(state: GameState, trainee: Trainee): void {
  const venue = buildingById(state, trainee.destinationId);
  if (!venue) throw new Error(`Trainee ${trainee.id} arrived at missing building ${trainee.destinationId}`);
  venue.performingUntil = state.tick + PERFORMANCE_TICKS;
  state.version++;
  dismiss(state, trainee);
}

function dismiss(state: GameState, trainee: Trainee): void {
  state.trainees = state.trainees.filter((t) => t !== trainee);
}

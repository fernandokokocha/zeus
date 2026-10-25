import { BUILDING_SPECS } from './buildings';
import { adjacentRoadTiles } from './commands';
import { isUnderConstruction } from './sanctuaries';
import type { Building, GameState } from './state';

export const WORKING_SHARE = 0.52;

export function workforce(state: GameState): number {
  const commoners = state.buildings.filter((b) => b.type === 'house').reduce((sum, house) => sum + house.residents, 0);
  return Math.floor(commoners * WORKING_SHARE);
}

function jobsOffered(state: GameState, building: Building): number {
  if (isUnderConstruction(building) || adjacentRoadTiles(state, building).length === 0) return 0;
  return BUILDING_SPECS[building.type].workers;
}

export function assignWorkers(state: GameState): void {
  let available = workforce(state);
  for (const building of state.buildings) {
    const wasWorking = building.workers > 0;
    building.workers = Math.min(jobsOffered(state, building), available);
    if (building.workers > 0 !== wasWorking) state.version++;
    available -= building.workers;
  }
}

export function laborSummary(state: GameState): { workforce: number; jobs: number; employed: number } {
  return {
    workforce: workforce(state),
    jobs: state.buildings.reduce((sum, b) => sum + jobsOffered(state, b), 0),
    employed: state.buildings.reduce((sum, b) => sum + b.workers, 0),
  };
}

import { BUILDING_SPECS } from './buildings';
import { adjacentRoadTiles } from './commands';
import { population } from './settlers';
import type { Building, GameState } from './state';

export const WORKING_SHARE = 0.52;

export function workforce(state: GameState): number {
  return Math.floor(population(state) * WORKING_SHARE);
}

function jobsOffered(state: GameState, building: Building): number {
  return adjacentRoadTiles(state, building).length > 0 ? BUILDING_SPECS[building.type].workers : 0;
}

export function assignWorkers(state: GameState): void {
  let available = workforce(state);
  for (const building of state.buildings) {
    building.workers = Math.min(jobsOffered(state, building), available);
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

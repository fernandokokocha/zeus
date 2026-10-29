import { BUILDING_SPECS } from './buildings';
import { adjacentRoadTiles } from './commands';
import { isResidence } from './housing';
import { INDUSTRIES, NO_PRIORITY, isClosed, isIndustry, type Industry, type Priority } from './industries';
import { isUnderConstruction } from './sanctuaries';
import type { Building, GameState } from './state';
import { upgraded } from './upgrades';

export const WORKING_SHARE = 0.52;
export const DEMOCRATIC_WORKING_SHARE = 0.6;
const UNPRIORITIZED_RANK = 4;

export function workforce(state: GameState): number {
  const residents = state.buildings.filter(isResidence).reduce((sum, residence) => sum + residence.residents, 0);
  return Math.floor(residents * upgraded(state, 'democracy', WORKING_SHARE, DEMOCRATIC_WORKING_SHARE));
}

function canWork(state: GameState, building: Building): boolean {
  return !isUnderConstruction(building) && adjacentRoadTiles(state, building).length > 0;
}

function jobsOffered(state: GameState, building: Building): number {
  if (isClosed(state, building) || !canWork(state, building)) return 0;
  return BUILDING_SPECS[building.type].workers;
}

function staffingRank(state: GameState, building: Building): number {
  if (!isIndustry(building.type)) return UNPRIORITIZED_RANK;
  const { priority } = state.industries[building.type];
  return priority === NO_PRIORITY ? UNPRIORITIZED_RANK : priority;
}

export function assignWorkers(state: GameState): void {
  let available = workforce(state);
  const staffingOrder = [...state.buildings].sort((a, b) => staffingRank(state, a) - staffingRank(state, b));
  for (const building of staffingOrder) {
    const wasWorking = building.workers > 0;
    building.workers = Math.min(jobsOffered(state, building), available);
    if (building.workers > 0 !== wasWorking) state.version++;
    available -= building.workers;
  }
}

export function setIndustryPriority(state: GameState, industry: Industry, priority: Priority): void {
  state.industries[industry].priority = priority;
  assignWorkers(state);
}

export function setIndustryOpen(state: GameState, industry: Industry, open: boolean): void {
  state.industries[industry].open = open;
  assignWorkers(state);
}

export function laborSummary(state: GameState): { workforce: number; jobs: number; employed: number } {
  return {
    workforce: workforce(state),
    jobs: state.buildings.reduce((sum, b) => sum + jobsOffered(state, b), 0),
    employed: state.buildings.reduce((sum, b) => sum + b.workers, 0),
  };
}

export interface IndustryRow {
  industry: Industry;
  name: string;
  buildings: number;
  workers: number;
  jobs: number;
  priority: Priority;
  open: boolean;
}

export interface PrioritiesReport {
  workers: number;
  jobs: number;
  industries: IndustryRow[];
}

export function prioritiesReport(state: GameState): PrioritiesReport {
  const { workforce, jobs } = laborSummary(state);
  return {
    workers: workforce,
    jobs,
    industries: INDUSTRIES.map((industry) => {
      const buildings = state.buildings.filter((b) => b.type === industry);
      return {
        industry,
        name: BUILDING_SPECS[industry].name,
        buildings: buildings.length,
        workers: buildings.reduce((sum, b) => sum + b.workers, 0),
        jobs: buildings.filter((b) => canWork(state, b)).length * BUILDING_SPECS[industry].workers,
        ...state.industries[industry],
      };
    }),
  };
}

import { CLOSED, SERVICES, SERVICE_SPECS, branchMembers, branchOf, isClosed, type Branch, type Priority, type Service } from './branches';
import { BUILDING_SPECS } from './buildings';
import { adjacentRoadTiles } from './commands';
import { isResidence } from './housing';
import { INDUSTRIES, type Industry } from './industries';
import { isUnderConstruction } from './sanctuaries';
import type { Building, GameState } from './state';
import { upgraded } from './upgrades';

export const WORKING_SHARE = 0.52;
export const DEMOCRATIC_WORKING_SHARE = 0.6;
const STAFFING_ORDER: Priority[] = [1, 2, 3];

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

function employers(state: GameState): Building[] {
  return state.buildings.filter((b) => BUILDING_SPECS[b.type].workers > 0);
}

const total = (values: number[]) => values.reduce((sum, value) => sum + value, 0);

function shareOut(jobs: number[], available: number): number[] {
  const wanted = total(jobs);
  if (wanted <= available) return jobs;
  const exact = jobs.map((posts) => (posts * available) / wanted);
  const shares = exact.map(Math.floor);
  const largestRemaindersFirst = exact.map((_, i) => i).sort((a, b) => exact[b] - shares[b] - (exact[a] - shares[a]));
  for (const i of largestRemaindersFirst.slice(0, available - total(shares))) shares[i]++;
  return shares;
}

function hire(state: GameState, building: Building, workers: number): void {
  if (workers > 0 !== building.workers > 0) state.version++;
  building.workers = workers;
}

export function assignWorkers(state: GameState): void {
  let available = workforce(state);
  const staffed = employers(state);
  for (const building of staffed.filter((b) => isClosed(state, b))) hire(state, building, 0);
  for (const priority of STAFFING_ORDER) {
    const group = staffed.filter((b) => state.priorities[branchOf(b.type)] === priority);
    const hired = shareOut(group.map((b) => jobsOffered(state, b)), available);
    group.forEach((building, i) => hire(state, building, hired[i]));
    available -= total(hired);
  }
}

export function setPriority(state: GameState, branch: Branch, priority: Priority): void {
  state.priorities[branch] = priority;
  assignWorkers(state);
}

export function laborSummary(state: GameState): { workforce: number; jobs: number; employed: number } {
  return {
    workforce: workforce(state),
    jobs: total(employers(state).map((b) => jobsOffered(state, b))),
    employed: state.buildings.reduce((sum, b) => sum + b.workers, 0),
  };
}

export interface BranchRow<B extends Branch = Branch> {
  branch: B;
  name: string;
  buildings: number;
  workers: number;
  jobs: number;
  priority: Priority;
}

export interface PrioritiesReport {
  workers: number;
  jobs: number;
  industries: BranchRow<Industry>[];
  services: BranchRow<Service>[];
}

function branchRow<B extends Branch>(state: GameState, branch: B, name: string): BranchRow<B> {
  const members = branchMembers(branch);
  const buildings = state.buildings.filter((b) => members.includes(b.type));
  return {
    branch,
    name,
    buildings: buildings.length,
    workers: total(buildings.map((b) => b.workers)),
    jobs: total(buildings.filter((b) => canWork(state, b)).map((b) => BUILDING_SPECS[b.type].workers)),
    priority: state.priorities[branch],
  };
}

export function prioritiesReport(state: GameState): PrioritiesReport {
  const { workforce, jobs } = laborSummary(state);
  return {
    workers: workforce,
    jobs,
    industries: INDUSTRIES.map((industry) => branchRow(state, industry, BUILDING_SPECS[industry].name)),
    services: SERVICES.map((service) => branchRow(state, service, SERVICE_SPECS[service].name)),
  };
}

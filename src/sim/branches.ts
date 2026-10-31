import type { BuildingType } from './buildings';
import { INDUSTRIES, isIndustry, type Industry } from './industries';
import type { Building, GameState } from './state';

export const SERVICES = ['distribution', 'hygiene', 'administration', 'culture', 'military', 'sanctuaries'] as const;

export type Service = (typeof SERVICES)[number];
export type Branch = Industry | Service;

export const SERVICE_SPECS: Record<Service, { name: string; buildings: BuildingType[] }> = {
  distribution: {
    name: 'Distribution',
    buildings: ['granary', 'storehouse', 'tradeYard', 'foodVendor', 'fleeceVendor', 'oilVendor', 'clothVendor', 'scrollVendor', 'armsVendor'],
  },
  hygiene: { name: 'Hygiene & Safety', buildings: ['fountain', 'maintenanceOffice', 'infirmary'] },
  administration: { name: 'Administration', buildings: ['taxOffice'] },
  culture: { name: 'Culture', buildings: ['college', 'podium', 'gymnasium', 'dramaSchool', 'theater', 'library'] },
  military: { name: 'Military', buildings: ['drillGround'] },
  sanctuaries: { name: 'Sanctuaries', buildings: ['artisansGuild', 'demeterSanctuary', 'athenaSanctuary', 'hephaestusSanctuary'] },
};

export const CLOSED = 0;
export type Priority = typeof CLOSED | 1 | 2 | 3;
export const DEFAULT_PRIORITY: Priority = 2;

export type Priorities = Record<Branch, Priority>;

export function defaultPriorities(): Priorities {
  return Object.fromEntries([...INDUSTRIES, ...SERVICES].map((branch) => [branch, DEFAULT_PRIORITY])) as Priorities;
}

export function branchOf(type: BuildingType): Branch {
  if (isIndustry(type)) return type;
  const service = SERVICES.find((s) => SERVICE_SPECS[s].buildings.includes(type));
  if (!service) throw new Error(`${type} belongs to no branch`);
  return service;
}

const isService = (branch: Branch): branch is Service => (SERVICES as readonly Branch[]).includes(branch);

export function branchMembers(branch: Branch): BuildingType[] {
  return isService(branch) ? SERVICE_SPECS[branch].buildings : [branch];
}

export function isClosed(state: GameState, building: Building): boolean {
  return state.priorities[branchOf(building.type)] === CLOSED;
}

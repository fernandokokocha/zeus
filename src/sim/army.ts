import { BUILDING_SPECS } from './buildings';
import { TICKS_PER_MONTH } from './clock';
import { annexOf } from './elites';
import { postNotice } from './notices';
import type { Building, GameState } from './state';

export const HOPLITE_TICKS = 2 * TICKS_PER_MONTH;
export const COMPANY_SIZE = 8;

export type DrillStatus = 'training' | 'full' | 'unstarted' | 'unarmed' | 'idle';

export interface ArmyReport {
  companies: { name: string; hoplites: number; of: number }[];
  hoplites: number;
}

function warriorsHouses(state: GameState): Building[] {
  return state.buildings.filter((b) => b.type === 'warriorsHouse');
}

export function drillStatus(warriors: Building, drillGround: Building): DrillStatus {
  if (drillGround.workers === 0) return 'idle';
  if (!warriors.started) return 'unstarted';
  if (warriors.hoplites >= COMPANY_SIZE) return 'full';
  if (warriors.armor <= 0) return 'unarmed';
  return 'training';
}

export function tickArmy(state: GameState): void {
  for (const warriors of warriorsHouses(state)) drill(state, warriors, annexOf(state, warriors));
}

function drill(state: GameState, warriors: Building, drillGround: Building): void {
  if (drillStatus(warriors, drillGround) !== 'training') return;
  drillGround.production += drillGround.workers / BUILDING_SPECS.drillGround.workers;
  if (drillGround.production < HOPLITE_TICKS) return;
  drillGround.production = 0;
  warriors.hoplites++;
  state.version++;
  if (warriors.hoplites === COMPANY_SIZE) postNotice(state, `The ${BUILDING_SPECS.warriorsHouse.name} at ${warriors.x},${warriors.y} has a full company`, warriors);
}

export function armyReport(state: GameState): ArmyReport {
  const companies = warriorsHouses(state).map((warriors) => ({
    name: `${BUILDING_SPECS.warriorsHouse.name} at ${warriors.x},${warriors.y}`,
    hoplites: warriors.hoplites,
    of: COMPANY_SIZE,
  }));
  return { companies, hoplites: companies.reduce((total, company) => total + company.hoplites, 0) };
}

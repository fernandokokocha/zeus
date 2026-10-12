import type { BuildingType } from './buildings';
import { TICKS_PER_MONTH } from './clock';
import { build, footprint, removeBuildings } from './commands';
import { NEIGHBOUR_STEPS } from './pathfinding';
import { NO_BUILDING, inBounds, tileIndex, type Building, type GameState } from './state';

export const FIRE_RISK_INCREMENTS: Partial<Record<BuildingType, number>> = {
  house: 8,
  taxOffice: 5,
  wheatFarm: 5,
  granary: 8,
  storehouse: 5,
  cardingShed: 5,
  growersLodge: 5,
};

export const COLLAPSE_RISK_INCREMENTS: Partial<Record<BuildingType, number>> = {
  fountain: 8,
  granary: 8,
  agora: 6,
  olivePress: 8,
  college: 6,
};

export const RISK_LIMIT = 60;
export const FIRE_SPREAD_PER_MONTH = 60;
export const FIRE_BURN_TICKS = 2 * TICKS_PER_MONTH;

const RISK_LIMIT_TICKS = RISK_LIMIT * TICKS_PER_MONTH;

export function riskShare(risk: number): number {
  return risk / RISK_LIMIT_TICKS;
}

export function isBurning(state: GameState, ruins: Building): boolean {
  return state.tick < ruins.burningUntil;
}

function fireIncrement(building: Building): number {
  return FIRE_RISK_INCREMENTS[building.type] ?? 0;
}

function collapseIncrement(building: Building): number {
  return COLLAPSE_RISK_INCREMENTS[building.type] ?? 0;
}

export function canBurn(building: Building): boolean {
  return fireIncrement(building) > 0 && (building.type !== 'house' || building.residents > 0);
}

export function canCollapse(building: Building): boolean {
  return collapseIncrement(building) > 0;
}

export function tickSafety(state: GameState): void {
  for (const building of state.buildings) {
    if (canBurn(building)) building.fireRisk += fireIncrement(building);
    if (canCollapse(building)) building.collapseRisk += collapseIncrement(building);
  }
  spreadFire(state);
  for (const building of [...state.buildings]) {
    if (building.fireRisk >= RISK_LIMIT_TICKS) ruin(state, building, true);
    else if (building.collapseRisk >= RISK_LIMIT_TICKS) ruin(state, building, false);
  }
}

function spreadFire(state: GameState): void {
  const fires = state.buildings.filter((b) => b.type === 'ruins' && isBurning(state, b));
  for (const fire of fires) {
    for (const neighbour of buildingsAround(state, fire)) {
      if (canBurn(neighbour)) neighbour.fireRisk += FIRE_SPREAD_PER_MONTH;
    }
  }
}

const SURROUNDING_STEPS = [...NEIGHBOUR_STEPS, { x: 1, y: 1 }, { x: 1, y: -1 }, { x: -1, y: 1 }, { x: -1, y: -1 }];

function buildingsAround(state: GameState, tile: Building): Building[] {
  const ids = new Set<number>();
  for (const step of SURROUNDING_STEPS) {
    const x = tile.x + step.x;
    const y = tile.y + step.y;
    if (inBounds(state, x, y)) ids.add(state.buildingIdAt[tileIndex(state, x, y)]);
  }
  ids.delete(NO_BUILDING);
  return state.buildings.filter((b) => ids.has(b.id));
}

function ruin(state: GameState, building: Building, burning: boolean): void {
  const tiles = footprint(building);
  removeBuildings(state, new Set([building.id]));
  for (const tile of tiles) {
    const ruins = build(state, { type: 'ruins', ...tile, rotation: 0 });
    if (burning) ruins.burningUntil = state.tick + FIRE_BURN_TICKS;
  }
  state.version++;
}

export function maintain(state: GameState, building: Building): void {
  building.fireRisk = 0;
  building.collapseRisk = 0;
  if (isBurning(state, building)) {
    building.burningUntil = state.tick;
    state.version++;
  }
}

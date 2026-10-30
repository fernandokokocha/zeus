import { TICKS_PER_MONTH } from './clock';
import type { BuildingType } from './buildings';
import { build, footprint, removeBuildings } from './commands';
import { buildingName } from './housing';
import { postNotice } from './notices';
import { NEIGHBOUR_STEPS } from './pathfinding';
import { nextRandom } from './rng';
import { NO_BUILDING, inBounds, tileIndex, type Building, type GameState } from './state';

export const FIRE_RISK_INCREMENTS: Partial<Record<BuildingType, number>> = {
  house: 8,
  tradersGuild: 8,
  scholarsHouse: 8,
  taxOffice: 5,
  wheatFarm: 5,
  carrotFarm: 5,
  granary: 8,
  storehouse: 5,
  cardingShed: 5,
  growersLodge: 5,
  weaver: 5,
  scriptorium: 5,
  timberMill: 10,
  artisansGuild: 5,
  infirmary: 5,
};

export const COLLAPSE_RISK_INCREMENTS: Partial<Record<BuildingType, number>> = {
  fountain: 8,
  granary: 8,
  agora: 6,
  olivePress: 8,
  college: 6,
  masonryShop: 10,
  foundry: 10,
  sculptureStudio: 10,
  infirmary: 5,
};

export const RISK_LIMIT = 60;
export const FIRE_SPREAD_PER_MONTH = 60;
export const FIRE_BURN_TICKS = 2 * TICKS_PER_MONTH;
export const IGNITION_CHANCE_PER_TICK = 1 / TICKS_PER_MONTH;

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
  burnOut(state);
  for (const building of state.buildings) {
    if (canBurn(building)) building.fireRisk = atMost(building.fireRisk + fireIncrement(building));
    if (canCollapse(building)) building.collapseRisk += collapseIncrement(building);
  }
  const exposed = spreadFire(state);
  for (const building of [...state.buildings]) {
    if (building.fireRisk >= RISK_LIMIT_TICKS && (exposed.has(building) || nextRandom(state) < IGNITION_CHANCE_PER_TICK)) {
      catchFire(state, building);
    } else if (building.collapseRisk >= RISK_LIMIT_TICKS) {
      collapse(state, building);
    }
  }
}

function atMost(risk: number): number {
  return Math.min(risk, RISK_LIMIT_TICKS);
}

function burnOut(state: GameState): void {
  if (state.buildings.some((b) => b.type === 'ruins' && b.burningUntil === state.tick)) state.version++;
}

function spreadFire(state: GameState): Set<Building> {
  const exposed = new Set<Building>();
  const fires = state.buildings.filter((b) => b.type === 'ruins' && isBurning(state, b));
  for (const fire of fires) {
    for (const neighbour of buildingsAround(state, fire)) {
      if (!canBurn(neighbour)) continue;
      neighbour.fireRisk = atMost(neighbour.fireRisk + FIRE_SPREAD_PER_MONTH);
      exposed.add(neighbour);
    }
  }
  return exposed;
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

export function catchFire(state: GameState, building: Building): void {
  postNotice(state, `Fire! The ${buildingName(building)} at ${building.x},${building.y} is burning`, building);
  ruin(state, building, true);
}

function collapse(state: GameState, building: Building): void {
  postNotice(state, `The ${buildingName(building)} at ${building.x},${building.y} collapsed`, building);
  ruin(state, building, false);
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

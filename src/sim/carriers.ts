import type { BuildingType } from './buildings';
import { adjacentRoadTiles } from './commands';
import { BUYER_LOAD, CART_LOAD, GRANARY_CAPACITY, VENDOR_CAPACITY } from './food';
import { findRoadPath, nearestByRoad } from './pathfinding';
import type { Point } from './point';
import { exitTile } from './roamers';
import { NO_BUILDING, buildingById, type Building, type Carrier, type CarrierKind, type GameState } from './state';
import { WALKER_TILES_PER_TICK, isRoad } from './walking';

export interface CarrierSpec {
  name: string;
  home: BuildingType;
}

export const CARRIER_SPECS: Record<CarrierKind, CarrierSpec> = {
  cartPusher: { name: 'Cart Pusher', home: 'wheatFarm' },
  buyer: { name: 'Buyer', home: 'foodVendor' },
};

export function carrierKindSentBy(type: BuildingType): CarrierKind | null {
  const kinds = Object.keys(CARRIER_SPECS) as CarrierKind[];
  return kinds.find((kind) => CARRIER_SPECS[kind].home === type) ?? null;
}

export function granaryRoom(state: GameState, granary: Building): number {
  const incoming = state.carriers
    .filter((c) => c.kind === 'cartPusher' && !c.returning && c.destinationId === granary.id)
    .reduce((sum, c) => sum + c.food, 0);
  return GRANARY_CAPACITY - granary.food - incoming;
}

export function carrierDestinations(state: GameState, kind: CarrierKind): Building[] {
  const granaries = state.buildings.filter((b) => b.type === 'granary' && b.workers > 0);
  return kind === 'cartPusher' ? granaries.filter((g) => granaryRoom(state, g) > 0) : granaries.filter((g) => g.food > 0);
}

function wantsTrip(kind: CarrierKind, home: Building): boolean {
  return kind === 'cartPusher' ? home.food > 0 : home.food < VENDOR_CAPACITY;
}

export function tickCarriers(state: GameState): void {
  for (const building of state.buildings) sendCarrier(state, building);
  for (const carrier of [...state.carriers]) moveCarrier(state, carrier);
}

function sendCarrier(state: GameState, building: Building): void {
  const kind = carrierKindSentBy(building.type);
  if (!kind || building.workers === 0 || !wantsTrip(kind, building)) return;
  if (state.carriers.some((c) => c.homeId === building.id)) return;
  const exit = exitTile(state, building);
  if (!exit) throw new Error(`Building ${building.id} has workers but no road to leave by`);
  const target = nearestByRoad(state, exit, carrierDestinations(state, kind));
  if (!target) return;
  const food = kind === 'cartPusher' ? Math.min(CART_LOAD, building.food, granaryRoom(state, target.building)) : 0;
  building.food -= food;
  state.carriers.push({
    id: state.nextCarrierId++,
    kind,
    homeId: building.id,
    destinationId: target.building.id,
    food,
    returning: false,
    path: target.path,
    step: 0,
    progress: 0,
  });
}

function moveCarrier(state: GameState, carrier: Carrier): void {
  const home = buildingById(state, carrier.homeId);
  if (!home) throw new Error(`Carrier ${carrier.id} outlived its home ${carrier.homeId}`);
  if (!isRoad(state, carrier.path[carrier.step])) return dismiss(state, carrier);
  if (!carrier.returning && !buildingById(state, carrier.destinationId) && !replan(state, carrier, home)) return;

  carrier.progress += WALKER_TILES_PER_TICK;
  while (carrier.progress >= 1 && carrier.step < carrier.path.length - 1) {
    if (!isRoad(state, carrier.path[carrier.step + 1]) && !replan(state, carrier, home)) return;
    if (carrier.step === carrier.path.length - 1) break;
    carrier.step++;
    carrier.progress--;
  }
  if (carrier.step === carrier.path.length - 1) arrive(state, carrier, home);
}

function replan(state: GameState, carrier: Carrier, home: Building): boolean {
  if (!carrier.returning) {
    carrier.destinationId = NO_BUILDING;
    const target = nearestByRoad(state, carrier.path[carrier.step], carrierDestinations(state, carrier.kind));
    if (target) {
      carrier.destinationId = target.building.id;
      restartOn(carrier, target.path);
      return true;
    }
  }
  return headHome(state, carrier, home);
}

function headHome(state: GameState, carrier: Carrier, home: Building): boolean {
  const path = findRoadPath(state, carrier.path[carrier.step], adjacentRoadTiles(state, home));
  if (!path) {
    dismiss(state, carrier);
    return false;
  }
  carrier.returning = true;
  restartOn(carrier, path);
  return true;
}

function restartOn(carrier: Carrier, path: Point[]): void {
  carrier.path = path;
  carrier.step = 0;
}

function arrive(state: GameState, carrier: Carrier, home: Building): void {
  if (carrier.returning) {
    home.food += carrier.food;
    state.version++;
    return dismiss(state, carrier);
  }
  const granary = buildingById(state, carrier.destinationId);
  if (!granary) throw new Error(`Carrier ${carrier.id} reached missing building ${carrier.destinationId}`);
  const moved =
    carrier.kind === 'cartPusher'
      ? Math.min(carrier.food, GRANARY_CAPACITY - granary.food)
      : -Math.min(BUYER_LOAD, granary.food, VENDOR_CAPACITY - home.food);
  granary.food += moved;
  carrier.food -= moved;
  state.version++;
  headHome(state, carrier, home);
}

function dismiss(state: GameState, carrier: Carrier): void {
  state.carriers = state.carriers.filter((c) => c !== carrier);
}

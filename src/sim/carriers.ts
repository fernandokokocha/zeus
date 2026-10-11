import type { BuildingType } from './buildings';
import { adjacentRoadTiles } from './commands';
import { BUYER_LOAD, CART_LOAD, GRANARY_CAPACITY, UNITS_PER_LOAD, VENDOR_CAPACITY, wholeLoads } from './food';
import { findRoadPath, nearestByRoad } from './pathfinding';
import type { Point } from './point';
import { exitTile } from './roamers';
import { NO_BUILDING, buildingById, type Building, type Carrier, type CarrierKind, type GameState, type Good } from './state';
import { isRoad, walkPath } from './walking';

type Store = 'granary';

export interface CarrierSpec {
  name: string;
  home: BuildingType;
  good: Good;
  store: Store;
  delivers: boolean;
}

export const CARRIER_SPECS: Record<CarrierKind, CarrierSpec> = {
  cartPusher: { name: 'Cart Pusher', home: 'wheatFarm', good: 'food', store: 'granary', delivers: true },
  buyer: { name: 'Buyer', home: 'foodVendor', good: 'food', store: 'granary', delivers: false },
};

const STORE_CAPACITY: Record<Store, number> = { granary: GRANARY_CAPACITY };

export function carrierKindSentBy(type: BuildingType): CarrierKind | null {
  const kinds = Object.keys(CARRIER_SPECS) as CarrierKind[];
  return kinds.find((kind) => CARRIER_SPECS[kind].home === type) ?? null;
}

function storeSpace(store: Building, good: Good): number {
  return STORE_CAPACITY[store.type as Store] - store[good];
}

export function storeRoom(state: GameState, store: Building, good: Good): number {
  const incoming = state.carriers
    .filter((c) => CARRIER_SPECS[c.kind].delivers && !c.returning && c.destinationId === store.id)
    .reduce((sum, c) => sum + c[good], 0);
  return storeSpace(store, good) - incoming;
}

export function carrierDestinations(state: GameState, kind: CarrierKind): Building[] {
  const { store, good, delivers } = CARRIER_SPECS[kind];
  const stores = state.buildings.filter((b) => b.type === store && b.workers > 0);
  return delivers ? stores.filter((s) => storeRoom(state, s, good) > 0) : stores.filter((s) => s[good] >= UNITS_PER_LOAD);
}

function wantsTrip(kind: CarrierKind, home: Building): boolean {
  const { good, delivers } = CARRIER_SPECS[kind];
  return delivers ? home[good] > 0 : VENDOR_CAPACITY - home[good] >= UNITS_PER_LOAD;
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
  const { good, delivers } = CARRIER_SPECS[kind];
  const load = delivers ? Math.min(CART_LOAD, building[good], storeRoom(state, target.building, good)) : 0;
  building[good] -= load;
  state.carriers.push({
    id: state.nextCarrierId++,
    kind,
    homeId: building.id,
    destinationId: target.building.id,
    [good]: load,
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

  walkPath(state, carrier, () => replan(state, carrier, home), () => arrive(state, carrier, home));
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
  const { good, delivers } = CARRIER_SPECS[carrier.kind];
  if (carrier.returning) {
    home[good] += carrier[good];
    state.version++;
    return dismiss(state, carrier);
  }
  const store = buildingById(state, carrier.destinationId);
  if (!store) throw new Error(`Carrier ${carrier.id} reached missing building ${carrier.destinationId}`);
  const moved = delivers
    ? Math.min(carrier[good], storeSpace(store, good))
    : -wholeLoads(Math.min(BUYER_LOAD, store[good], VENDOR_CAPACITY - home[good]));
  store[good] += moved;
  carrier[good] -= moved;
  state.version++;
  headHome(state, carrier, home);
}

function dismiss(state: GameState, carrier: Carrier): void {
  state.carriers = state.carriers.filter((c) => c !== carrier);
}

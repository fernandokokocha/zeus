import type { BuildingType } from './buildings';
import { adjacentRoadTiles } from './commands';
import { BUYER_LOAD, CART_LOAD, GRANARY_CAPACITY, UNITS_PER_LOAD, VENDOR_CAPACITY, wholeLoads } from './food';
import { findRoadPath, nearestByRoad } from './pathfinding';
import type { Point } from './point';
import { exitTile } from './roamers';
import { STUDIO_BRONZE_CAPACITY } from './materials';
import { FLEECE_KEPT_FOR_VENDORS, WEAVER_FLEECE_CAPACITY } from './cloth';
import { exportCapacity } from './exports';
import { GOODS } from './flows';
import { PRESS_OLIVE_CAPACITY } from './olives';
import { inputCapacity } from './scrolls';
import { SANCTUARIES, isSanctuary, recordConstruction, stillNeeded, type Sanctuary } from './sanctuaries';
import { acceptsGood, storehouseSpace } from './storehouse';
import { NO_BUILDING, buildingById, type Building, type Carrier, type CarrierKind, type GameState, type Good, type TradeGood } from './state';
import { isRoad, walkPath } from './walking';

type Store = 'granary' | 'storehouse' | 'olivePress' | 'sculptureStudio' | Sanctuary;

export interface CarrierSpec {
  name: string;
  home: BuildingType;
  good: Good;
  stores: Store[];
  delivers: boolean;
  capacity: (home: Building) => number;
}

const nothing = () => 0;

function exportCart(good: TradeGood, stores: Store[]): CarrierSpec {
  return { name: 'Cart Pusher', home: 'tradeYard', good, stores, delivers: false, capacity: (yard) => exportCapacity(yard, good) };
}

function unloadCart(good: TradeGood, stores: Store[]): CarrierSpec {
  return { name: 'Cart Pusher', home: 'tradeYard', good, stores, delivers: true, capacity: (yard) => exportCapacity(yard, good) };
}

export const CARRIER_SPECS: Record<CarrierKind, CarrierSpec> = {
  cartPusher: { name: 'Cart Pusher', home: 'wheatFarm', good: 'food', stores: ['granary'], delivers: true, capacity: nothing },
  buyer: { name: 'Buyer', home: 'foodVendor', good: 'food', stores: ['granary'], delivers: false, capacity: () => VENDOR_CAPACITY },
  fleeceCart: { name: 'Cart Pusher', home: 'cardingShed', good: 'fleece', stores: ['storehouse'], delivers: true, capacity: nothing },
  fleeceBuyer: { name: 'Buyer', home: 'fleeceVendor', good: 'fleece', stores: ['storehouse'], delivers: false, capacity: () => VENDOR_CAPACITY },
  oliveCart: { name: 'Cart Pusher', home: 'growersLodge', good: 'olives', stores: ['olivePress', 'storehouse'], delivers: true, capacity: nothing },
  oilCart: { name: 'Cart Pusher', home: 'olivePress', good: 'oil', stores: ['storehouse'], delivers: true, capacity: nothing },
  oliveBuyer: { name: 'Buyer', home: 'olivePress', good: 'olives', stores: ['storehouse'], delivers: false, capacity: () => PRESS_OLIVE_CAPACITY },
  oilBuyer: { name: 'Buyer', home: 'oilVendor', good: 'oil', stores: ['storehouse'], delivers: false, capacity: () => VENDOR_CAPACITY },
  woodCart: { name: 'Cart Pusher', home: 'timberMill', good: 'wood', stores: ['storehouse'], delivers: true, capacity: nothing },
  marbleCart: { name: 'Cart Pusher', home: 'masonryShop', good: 'marble', stores: ['storehouse'], delivers: true, capacity: nothing },
  bronzeCart: { name: 'Cart Pusher', home: 'foundry', good: 'bronze', stores: ['sculptureStudio', 'storehouse'], delivers: true, capacity: nothing },
  sculptureCart: { name: 'Cart Pusher', home: 'sculptureStudio', good: 'sculptures', stores: ['storehouse'], delivers: true, capacity: nothing },
  bronzeBuyer: { name: 'Buyer', home: 'sculptureStudio', good: 'bronze', stores: ['storehouse'], delivers: false, capacity: () => STUDIO_BRONZE_CAPACITY },
  weaverBuyer: { name: 'Buyer', home: 'weaver', good: 'fleece', stores: ['storehouse'], delivers: false, capacity: () => WEAVER_FLEECE_CAPACITY },
  clothCart: { name: 'Cart Pusher', home: 'weaver', good: 'cloth', stores: ['storehouse'], delivers: true, capacity: nothing },
  clothBuyer: { name: 'Buyer', home: 'clothVendor', good: 'cloth', stores: ['storehouse'], delivers: false, capacity: () => VENDOR_CAPACITY },
  papyrusBuyer: { name: 'Buyer', home: 'scriptorium', good: 'papyrus', stores: ['storehouse'], delivers: false, capacity: (home) => inputCapacity(home, 'papyrus') },
  scriptoriumFleeceBuyer: { name: 'Buyer', home: 'scriptorium', good: 'fleece', stores: ['storehouse'], delivers: false, capacity: (home) => inputCapacity(home, 'fleece') },
  scrollCart: { name: 'Cart Pusher', home: 'scriptorium', good: 'scrolls', stores: ['storehouse'], delivers: true, capacity: nothing },
  scrollBuyer: { name: 'Buyer', home: 'scrollVendor', good: 'scrolls', stores: ['storehouse'], delivers: false, capacity: () => VENDOR_CAPACITY },
  marbleSupply: { name: 'Cart Pusher', home: 'storehouse', good: 'marble', stores: SANCTUARIES, delivers: true, capacity: nothing },
  woodSupply: { name: 'Cart Pusher', home: 'storehouse', good: 'wood', stores: SANCTUARIES, delivers: true, capacity: nothing },
  sculptureSupply: { name: 'Cart Pusher', home: 'storehouse', good: 'sculptures', stores: SANCTUARIES, delivers: true, capacity: nothing },
  foodExport: exportCart('food', ['granary']),
  fleeceExport: exportCart('fleece', ['storehouse']),
  oliveExport: exportCart('olives', ['storehouse']),
  oilExport: exportCart('oil', ['storehouse']),
  woodExport: exportCart('wood', ['storehouse']),
  marbleExport: exportCart('marble', ['storehouse']),
  bronzeExport: exportCart('bronze', ['storehouse']),
  sculptureExport: exportCart('sculptures', ['storehouse']),
  clothExport: exportCart('cloth', ['storehouse']),
  foodUnload: unloadCart('food', ['granary']),
  fleeceUnload: unloadCart('fleece', ['storehouse']),
  oliveUnload: unloadCart('olives', ['storehouse']),
  oilUnload: unloadCart('oil', ['storehouse']),
  woodUnload: unloadCart('wood', ['storehouse']),
  marbleUnload: unloadCart('marble', ['storehouse']),
  bronzeUnload: unloadCart('bronze', ['storehouse']),
  sculptureUnload: unloadCart('sculptures', ['storehouse']),
  clothUnload: unloadCart('cloth', ['storehouse']),
  papyrusUnload: unloadCart('papyrus', ['storehouse']),
};

const KEPT_BACK: Partial<Record<CarrierKind, number>> = { weaverBuyer: FLEECE_KEPT_FOR_VENDORS, scriptoriumFleeceBuyer: FLEECE_KEPT_FOR_VENDORS };

const GIVES_WAY_TO: Partial<Record<CarrierKind, CarrierKind>> = { scriptoriumFleeceBuyer: 'papyrusBuyer' };

function sharesTrip(a: CarrierKind, b: CarrierKind): boolean {
  return a === b || GIVES_WAY_TO[a] === b || GIVES_WAY_TO[b] === a;
}

export function givesWayToAnother(kind: CarrierKind): boolean {
  return GIVES_WAY_TO[kind] !== undefined;
}

export function tripSharers(kind: CarrierKind): CarrierKind[] {
  return (Object.keys(CARRIER_SPECS) as CarrierKind[]).filter((other) => sharesTrip(kind, other));
}

function givesWay(state: GameState, kind: CarrierKind): boolean {
  const preferred = GIVES_WAY_TO[kind];
  return preferred !== undefined && carrierDestinations(state, preferred).length > 0;
}

export function keptBack(kind: CarrierKind): number {
  return KEPT_BACK[kind] ?? 0;
}

function spareStock(kind: CarrierKind, store: Building): number {
  return Math.max(0, store[CARRIER_SPECS[kind].good] - keptBack(kind));
}

const STORE_SPACE: Record<Store, (stock: Record<Good, number>, good: Good) => number> = {
  granary: (stock) => GRANARY_CAPACITY - stock.food,
  storehouse: storehouseSpace,
  olivePress: (stock) => PRESS_OLIVE_CAPACITY - stock.olives,
  sculptureStudio: (stock) => STUDIO_BRONZE_CAPACITY - stock.bronze,
  demeterSanctuary: (stock, good) => stillNeeded('demeterSanctuary', stock, good),
  athenaSanctuary: (stock, good) => stillNeeded('athenaSanctuary', stock, good),
  hephaestusSanctuary: (stock, good) => stillNeeded('hephaestusSanctuary', stock, good),
};

export function carrierKindsSentBy(type: BuildingType): CarrierKind[] {
  return (Object.keys(CARRIER_SPECS) as CarrierKind[]).filter((kind) => CARRIER_SPECS[kind].home === type);
}

function storeSpace(store: Building, stock: Record<Good, number>, good: Good): number {
  if (!acceptsGood(store, good)) return 0;
  return STORE_SPACE[store.type as Store](stock, good);
}

export function storeRoom(state: GameState, store: Building, good: Good): number {
  const incoming = state.carriers.filter((c) => isBringing(c, store));
  const stock = Object.fromEntries(GOODS.map((g) => [g, incoming.reduce((sum, c) => sum + c[g], store[g])])) as Record<Good, number>;
  return storeSpace(store, stock, good);
}

function isBringing(carrier: Carrier, store: Building): boolean {
  const { delivers } = CARRIER_SPECS[carrier.kind];
  return delivers ? !carrier.returning && carrier.destinationId === store.id : carrier.returning && carrier.homeId === store.id;
}

export function carrierDestinations(state: GameState, kind: CarrierKind): Building[] {
  const { stores, good, delivers } = CARRIER_SPECS[kind];
  for (const store of stores) {
    const open = state.buildings.filter((b) => b.type === store && (b.workers > 0 || isSanctuary(b.type)));
    const usable = delivers ? open.filter((s) => storeRoom(state, s, good) > 0) : open.filter((s) => spareStock(kind, s) >= UNITS_PER_LOAD);
    if (usable.length > 0) return usable;
  }
  return [];
}

function fetchRoom(state: GameState, kind: CarrierKind, home: Building): number {
  const { good, capacity } = CARRIER_SPECS[kind];
  const incoming = state.carriers.filter((c) => c.homeId !== home.id && isBringing(c, home));
  return capacity(home) - incoming.reduce((sum, c) => sum + c[good], home[good]);
}

function surplus(kind: CarrierKind, home: Building): number {
  const { good, capacity } = CARRIER_SPECS[kind];
  return Math.max(0, home[good] - capacity(home));
}

function wantsTrip(state: GameState, kind: CarrierKind, home: Building): boolean {
  return CARRIER_SPECS[kind].delivers ? surplus(kind, home) > 0 : fetchRoom(state, kind, home) >= UNITS_PER_LOAD;
}

export function tickCarriers(state: GameState): void {
  for (const building of state.buildings) {
    for (const kind of carrierKindsSentBy(building.type)) sendCarrier(state, building, kind);
  }
  for (const carrier of [...state.carriers]) moveCarrier(state, carrier);
}

function sendCarrier(state: GameState, building: Building, kind: CarrierKind): void {
  if (building.workers === 0 || !wantsTrip(state, kind, building)) return;
  if (state.carriers.some((c) => c.homeId === building.id && sharesTrip(c.kind, kind)) || givesWay(state, kind)) return;
  const exit = exitTile(state, building);
  if (!exit) throw new Error(`Building ${building.id} has workers but no road to leave by`);
  const target = nearestByRoad(state, exit, carrierDestinations(state, kind));
  if (!target) return;
  const { good, delivers } = CARRIER_SPECS[kind];
  const load = delivers ? Math.min(CART_LOAD, surplus(kind, building), storeRoom(state, target.building, good)) : 0;
  building[good] -= load;
  state.carriers.push({
    id: state.nextCarrierId++,
    kind,
    homeId: building.id,
    destinationId: target.building.id,
    food: 0,
    fleece: 0,
    olives: 0,
    oil: 0,
    wood: 0,
    marble: 0,
    bronze: 0,
    sculptures: 0,
    cloth: 0,
    papyrus: 0,
    scrolls: 0,
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
    ? Math.min(carrier[good], storeSpace(store, store, good))
    : -wholeLoads(Math.min(BUYER_LOAD, spareStock(carrier.kind, store), Math.max(0, fetchRoom(state, carrier.kind, home))));
  store[good] += moved;
  carrier[good] -= moved;
  if (isSanctuary(store.type)) recordConstruction(state, good, moved);
  state.version++;
  headHome(state, carrier, home);
}

function dismiss(state: GameState, carrier: Carrier): void {
  state.carriers = state.carriers.filter((c) => c !== carrier);
}

import { appealMap, houseAppeal } from './appeal';
import { BUILDING_SPECS, vendorGood } from './buildings';
import { MONTH_NAMES, TICKS_PER_MONTH } from './clock';
import { MAX_CULTURE_POINTS, culturePoints, culturesPassed } from './culture';
import { CARRIER_SPECS, carrierDestinations, carrierKindsSentBy, keptBack } from './carriers';
import { WEAVER_FLEECE_CAPACITY, WEAVING_TICKS, canWeave } from './cloth';
import { adjacentRoadTiles, agoraVendors, footprint } from './commands';
import { hasWorkingPalace, houseTax } from './economy';
import { GRANARY_CAPACITY, HARVEST_MONTH, UNITS_PER_LOAD, VENDOR_CAPACITY, houseStockTarget, monthlyUse } from './food';
import { isClosed } from './industries';
import { PLACES } from './greece';
import { CARAVAN_MERCHANTS, caravansOf, slotHoldings } from './exports';
import { PARTNERS, TRADE_GOODS, routeOf, routeStatus } from './trade';
import { GOOD_TITLES } from './production';
import { caravansComing, ordersWaitingForMoney } from './imports';
import { guildOfYard, guildShortfalls, guildSiteOf, siteShortfalls, type GuildSite } from './guild';
import { type HouseLevel, type HouseNeed, type ResidentNeed, HOUSE_LEVELS, LEVEL_CHANGE_TICKS, TRADERS_GUILD, NEXT_LEVEL, PREVIOUS_LEVEL, houseCapacity, houseLevel, evolutionBlockers, houseName, lacksCulture, missingNeeds } from './housing';
import { ROAMER_SPECS, hasGoodsToSell, hasService, type RoamerSpec, roamerKindSentBy, serviceLeft } from './roamers';
import { TRAINEE_SPECS, isPerforming, staffedVenues, traineeKindFor, traineeKindSentBy } from './schools';
import {
  BRONZE_PER_SCULPTURE,
  CASTING_TICKS,
  RESOURCE_RANGE,
  STUDIO_BRONZE_CAPACITY,
  WORKSHOP_CAPACITY,
  WORKSHOP_SPECS,
  canCast,
  isFelled,
  isWorkshop,
  sitesToWork,
  type Workshop,
} from './materials';
import { GROVE_RANGE, LODGE_CAPACITY, PRESSING_TICKS, PRESS_OLIVE_CAPACITY, canPress, growerAfter, isRipe, treesToPick } from './olives';
import {
  SANCTUARY_MATERIALS,
  SANCTUARY_SPECS,
  SANCTUARY_STAGES,
  VISITS_PER_STAGE,
  builtStages,
  isSanctuary,
  isUnderConstruction,
  materialNeeded,
  sitesToBuild,
  suppliedStages,
  type Sanctuary,
} from './sanctuaries';
import type { Point } from './point';
import { ROAD_UPGRADE_SPECS, upgradeObstacle } from './road-upgrades';
import { canBurn, canCollapse, isBurning, riskShare } from './safety';
import { canSettlersReach } from './settlers';
import { SHEARING_RANGE, SHED_CAPACITY, hasFullFleece, sheepTile, sheepToShear, shepherdAfter } from './sheep';
import { STOREHOUSE_CAPACITY, STOREHOUSE_GOODS, STOREHOUSE_SLOTS, acceptsGood, baysOf, slotsUsed, type StoredGood } from './storehouse';
import {
  NO_BUILDING,
  buildingById,
  tileIndex,
  type Artisan,
  type Building,
  type Caravan,
  type ForeignCaravan,
  type CaravanTrip,
  type Carrier,
  type Gatherer,
  type GameState,
  type Good,
  type Grower,
  type PeddledGood,
  type Roamer,
  type Settler,
  type Sheep,
  type Shepherd,
  type Trainee,
  type Walk,
} from './state';
import { BUILDABLE, TERRAIN_NAMES } from './terrain';
import { walkerTile } from './walking';

export type Need = 'met' | 'missing';

export interface Meter {
  label: string;
  fill: number;
  value: string;
  need: Need | null;
}

export interface StorehouseBay {
  good: StoredGood | null;
  loads: number;
  refused: boolean;
}

export interface StorehouseOrder {
  good: StoredGood;
  name: string;
  accepted: boolean;
}

export interface SlotView {
  good: Good | null;
  loads: number;
  capacity: number;
}

export interface TradeYardView {
  id: number;
  exports: { good: Good; name: string }[];
  imports: { good: Good; name: string; load: number }[];
  slots: SlotView[];
}

export interface StorehouseView {
  id: number;
  bays: StorehouseBay[];
  loads: string;
  free: string;
  orders: StorehouseOrder[];
}

export interface Description {
  title: string;
  meters: Meter[];
  lines: string[];
  storehouse?: StorehouseView;
  tradeYard?: TradeYardView;
  openRoute?: number;
}

export interface Inspection {
  description: Description;
  tiles: Point[];
}

type Look = () => Inspection;

export function describeTile(state: GameState, x: number, y: number): Description {
  return inspectTile(state, x, y)().description;
}

export function inspectTile(state: GameState, x: number, y: number): Look {
  const buildingId = state.buildingIdAt[tileIndex(state, x, y)];
  if (buildingId !== NO_BUILDING) {
    return () => {
      const building = buildingById(state, buildingId);
      return building ? { description: describeBuilding(state, building), tiles: footprint(building) } : inspectTile(state, x, y)();
    };
  }
  const follow = <W extends Walk>(walkers: (s: GameState) => W[], describe: (s: GameState, walker: W) => Description): Look | null => {
    const walker = walkers(state).find((w) => {
      const tile = walkerTile(w);
      return tile.x === x && tile.y === y;
    });
    if (!walker) return null;
    return () =>
      walkers(state).includes(walker) ? { description: describe(state, walker), tiles: [walkerTile(walker)] } : inspectTile(state, x, y)();
  };
  return (
    follow((s) => s.settlers, describeSettler) ??
    follow((s) => s.roamers, describeRoamer) ??
    follow((s) => s.carriers, describeCarrier) ??
    follow((s) => s.caravans.filter((c) => c.trip !== 'away'), describeCaravan) ??
    follow((s) => s.foreignCaravans.filter((c) => c.trip === 'in' || c.trip === 'back'), describeForeignCaravan) ??
    follow((s) => s.trainees, describeTrainee) ??
    follow((s) => s.shepherds, describeShepherd) ??
    follow((s) => s.growers, describeGrower) ??
    follow((s) => s.gatherers, describeGatherer) ??
    follow((s) => s.artisans, describeArtisan) ??
    follow((s) => s.sheep, describeSheep) ??
    (() => ({ description: describeGround(state, x, y), tiles: [{ x, y }] }))
  );
}

function describeBuilding(state: GameState, building: Building): Description {
  if (building.type === 'ruins') return describeRuins(state, building);
  if (isUnderConstruction(building)) return describeSite(state, building);
  const description = describeBuildingKind(state, building);
  description.lines.push(...riskLines(building));
  return description;
}

function describeBuildingKind(state: GameState, building: Building): Description {
  if (building.type === 'house') return describeHouse(state, building);
  if (building.type === 'tradersGuild') return describeGuild(state, building);
  if (building.type === 'tradeYard') return describeYard(state, building);
  return describeWorkplace(state, building);
}

const UPGRADE_LINES = {
  ornate: ['Radiates appeal'],
  fast: [`Walkers move ${ROAD_UPGRADE_SPECS.fast.speed}× faster`, 'Lowers appeal nearby'],
};

function describeRoad(state: GameState, x: number, y: number): Description {
  const tile = `Tile ${x}, ${y}`;
  const upgrade = state.roadUpgrades[tileIndex(state, x, y)];
  if (upgrade) return { title: ROAD_UPGRADE_SPECS[upgrade].name, meters: [], lines: [tile, ...UPGRADE_LINES[upgrade]] };
  const appeal = appealMap(state);
  const obstacle = upgradeObstacle(state, 'ornate', { x, y }, appeal);
  return { title: 'Road', meters: [], lines: [tile, `Appeal ${appeal[tileIndex(state, x, y)]}`, obstacle ?? 'Can be made an Ornate Road'] };
}

function describeGround(state: GameState, x: number, y: number): Description {
  const i = tileIndex(state, x, y);
  if (state.roadblocks[i]) return { title: 'Roadblock', meters: [], lines: [`Tile ${x}, ${y}`, 'Stops roaming walkers; settlers pass'] };
  if (state.mainRoad[i]) return { title: 'Main Road', meters: [], lines: [`Tile ${x}, ${y}`, 'Paved; cannot be demolished'] };
  if (state.roads[i]) return describeRoad(state, x, y);

  const terrain = state.terrain[i];
  const lines = [`Tile ${x}, ${y}`, BUILDABLE.has(terrain) ? 'Buildable' : 'Not buildable'];
  if (isFelled(state, { x, y })) lines.push(`Felled: grows back in ${Math.ceil((state.felledUntil[i] - state.tick) / TICKS_PER_MONTH)} months`);
  return { title: TERRAIN_NAMES[terrain], meters: [], lines };
}

export function amount(value: number): string {
  return value.toLocaleString('en-US', { maximumFractionDigits: 1 });
}

export function drachmas(value: number): string {
  return `${value.toLocaleString('en-US', { maximumFractionDigits: 2 })} dr`;
}

function loads(units: number): string {
  const count = units / UNITS_PER_LOAD;
  return `${amount(count)} ${count === 1 ? 'load' : 'loads'}`;
}

const GOOD_NAMES: Record<Good, string> = {
  food: 'wheat',
  fleece: 'fleece',
  olives: 'olives',
  oil: 'oil',
  wood: 'wood',
  marble: 'marble',
  bronze: 'bronze',
  sculptures: 'sculptures',
  cloth: 'cloth',
};

const CARRIER_HOMES: Record<Carrier['kind'], string> = {
  cartPusher: 'farm',
  buyer: 'stall',
  fleeceCart: 'shed',
  fleeceBuyer: 'stall',
  oliveCart: 'lodge',
  oilCart: 'press',
  oliveBuyer: 'press',
  oilBuyer: 'stall',
  woodCart: 'mill',
  marbleCart: 'shop',
  bronzeCart: 'foundry',
  sculptureCart: 'studio',
  bronzeBuyer: 'studio',
  weaverBuyer: 'weaver',
  clothCart: 'weaver',
  clothBuyer: 'stall',
  marbleSupply: 'storehouse',
  woodSupply: 'storehouse',
  sculptureSupply: 'storehouse',
  foodExport: 'yard',
  fleeceExport: 'yard',
  oliveExport: 'yard',
  oilExport: 'yard',
  woodExport: 'yard',
  marbleExport: 'yard',
  bronzeExport: 'yard',
  sculptureExport: 'yard',
  clothExport: 'yard',
  foodUnload: 'yard',
  fleeceUnload: 'yard',
  oliveUnload: 'yard',
  oilUnload: 'yard',
  woodUnload: 'yard',
  marbleUnload: 'yard',
  bronzeUnload: 'yard',
  sculptureUnload: 'yard',
  clothUnload: 'yard',
};

function describeHouse(state: GameState, house: Building): Description {
  const lines = [`Tile ${house.x}, ${house.y}`, `Residents ${house.residents}/${houseCapacity(house)}`];
  const site = guildSiteOf(state, house);
  const level = houseLevel(house);
  if (!level) {
    lines.push(settlementStatus(state, house));
    if (site) lines.push(guildSiteStatus(site, house));
    return { title: houseName(house), meters: [], lines };
  }
  const appeal = houseAppeal(state, house);
  const next = NEXT_LEVEL[level];
  lines.push(`Appeal ${appeal}`, taxStatus(state, house));
  if (next) lines.push(nextLevelStatus(state, house, level, next, appeal));
  if (house.pendingLevel) lines.push(levelChangeStatus(house, level, house.pendingLevel));
  if (site) lines.push(guildSiteStatus(site, house));
  return { title: houseName(house), meters: supplyMeters(state, house, next ?? level), lines };
}

function guildSiteStatus(site: GuildSite, house: Building): string {
  const at = `${site.origin.x}, ${site.origin.y}`;
  const shortfalls = siteShortfalls(site);
  if (shortfalls.length === 0) return `Guild site at ${at}: a Traders' Guild can be placed now`;
  const others = site.quarters.filter((q) => !(q.at.x === house.x && q.at.y === house.y) && !q.townhouse).length;
  const missing: string[] = [];
  if (houseLevel(house) !== 'townhouse') missing.push('not a Townhouse yet');
  if (others > 0) missing.push(`${others === 3 ? 'the other' : `${others} of the other`} 3 houses not Townhouses`);
  if (shortfalls.includes('yard')) missing.push("the yard's ground across the Main Road isn't clear");
  if (shortfalls.includes('permit')) missing.push('no permit');
  if (shortfalls.includes('appeal')) missing.push(`appeal ${TRADERS_GUILD.appeal} (has ${site.appeal})`);
  return `Possible guild site at ${at}: ${missing.join(', ')}`;
}

function describeYard(state: GameState, yard: Building): Description {
  const guild = guildOfYard(state, yard);
  const route = routeOf(state, guild);
  const lines = [`Tile ${yard.x}, ${yard.y}`, `Workers ${yard.workers}/${BUILDING_SPECS.tradeYard.workers}`];
  const title = BUILDING_SPECS.tradeYard.name;
  if (route === null) return { title, meters: [], lines: [...lines, 'Trade Yard: trade opens with a route'] };
  lines.push(`Trade Yard: trading with ${PLACES[route.partner].name}`);
  if (yard.workers === 0) lines.push('No workers: no goods are fetched');
  lines.push(...caravansOf(state, guild).filter((c) => c.trip === 'away').map((c) => caravanAwayLine(state, c)));
  lines.push(...caravansComing(state, yard).map((c) => caravanComingLine(state, c)));
  lines.push(...ordersWaitingForMoney(state, yard).map(({ good, loads, cost }) => `Waiting: the treasury can't pay for ${loads} ${GOOD_NAMES[good]} (${drachmas(cost)})`));
  const { buys, sells } = PARTNERS[route.partner];
  const tradeYard = {
    id: yard.id,
    exports: buys.map((good) => ({ good, name: GOOD_TITLES[good] })),
    imports: sells.map((good) => ({ good, name: GOOD_TITLES[good], load: TRADE_GOODS[good].caravanLoad })),
    slots: slotHoldings(yard).map(({ good, units, capacity }) => ({ good, loads: units / UNITS_PER_LOAD, capacity: capacity / UNITS_PER_LOAD })),
  };
  return { title, meters: [], lines, tradeYard };
}

function caravanAwayLine(state: GameState, caravan: Caravan): string {
  return `Caravan to ${PLACES[caravan.partner].name} with ${caravanCargo(caravan)}: back in about ${months(caravan.backAt - state.tick)}`;
}

export function months(ticks: number): string {
  const count = Math.ceil(ticks / TICKS_PER_MONTH);
  return `${count} ${count === 1 ? 'month' : 'months'}`;
}

function caravanComingLine(state: GameState, caravan: ForeignCaravan): string {
  return `Caravan from ${PLACES[caravan.partner].name} with ${caravanCargo(caravan)}: here in about ${months(caravan.dueAt - state.tick)}`;
}

export function caravanCargo(caravan: Caravan | ForeignCaravan): string {
  return `${caravan.loads} loads of ${GOOD_NAMES[caravan.good]}`;
}

function describeGuild(state: GameState, guild: Building): Description {
  const missing = guildShortfalls(state, guild);
  const route = routeStatus(state, guild);
  const lines = [
    `Tile ${guild.x}, ${guild.y}`,
    `Merchants ${guild.residents}/${TRADERS_GUILD.merchants}`,
    `Appeal ${houseAppeal(state, guild)}`,
    'Pays no tax: earns through trade',
    route.line,
    ...(routeOf(state, guild) ? [`Caravans out ${caravansOf(state, guild).length} of ${TRADERS_GUILD.merchants / CARAVAN_MERCHANTS}`] : []),
    missing.length === 0 ? 'Fully supplied' : `Missing ${missing.join(', ')}: breaks up in ${amount((LEVEL_CHANGE_TICKS - guild.pendingTicks) / TICKS_PER_MONTH)} months`,
  ];
  const needFor = (need: ResidentNeed): Need => (missing.includes(need) ? 'missing' : 'met');
  const meters = [
    stockMeter(guild, 'food', needFor('food')),
    waterMeter(state, guild, needFor('water')),
    stockMeter(guild, 'fleece', needFor('fleece')),
    stockMeter(guild, 'oil', needFor('oil')),
    cultureMeter(state, guild, culturePoints(state, guild) < TRADERS_GUILD.culture ? 'missing' : 'met'),
    stockMeter(guild, 'cloth', needFor('cloth')),
  ];
  return { title: BUILDING_SPECS.tradersGuild.name, meters, lines, ...(route.canOpen ? { openRoute: guild.id } : {}) };
}

function supplyMeters(state: GameState, house: Building, target: HouseLevel): Meter[] {
  const { needs, culture } = HOUSE_LEVELS[target];
  const missing = missingNeeds(state, house, target);
  const needFor = (need: HouseNeed): Need | null => (needs.includes(need) ? (missing.includes(need) ? 'missing' : 'met') : null);
  return [
    stockMeter(house, 'food', needFor('food')),
    waterMeter(state, house, needFor('water')),
    stockMeter(house, 'fleece', needFor('fleece')),
    stockMeter(house, 'oil', needFor('oil')),
    cultureMeter(state, house, culture > 0 ? (lacksCulture(state, house, target) ? 'missing' : 'met') : null),
  ];
}

function stockMeter(house: Building, good: PeddledGood, need: Need | null): Meter {
  const label = capitalized(good);
  const stock = house[good];
  if (stock <= 0) return { label, fill: 0, value: 'None', need };
  const used = monthlyUse(house, good);
  const lasts = used > 0 ? ` (${amount(stock / used)} months)` : '';
  return { label, fill: Math.min(1, stock / houseStockTarget(house, good)), value: `${amount(stock)} units${lasts}`, need };
}

function nextLevelStatus(state: GameState, house: Building, level: HouseLevel, next: HouseLevel, appeal: number): string {
  const { name } = HOUSE_LEVELS[next];
  const blockers = evolutionBlockers(state, house, level, next, appeal).map((blocker) =>
    blocker.kind === 'need' ? blocker.need : `${blocker.kind} ${blocker.needs} (has ${blocker.has})`,
  );
  return blockers.length > 0 ? `Needs for ${name}: ${blockers.join(', ')}` : `Ready to become a ${name}`;
}

function levelChangeStatus(house: Building, level: HouseLevel, pending: HouseLevel): string {
  const months = amount((LEVEL_CHANGE_TICKS - house.pendingTicks) / TICKS_PER_MONTH);
  const change = pending === PREVIOUS_LEVEL[level] ? 'Falling back to' : 'Becoming';
  return `${change} a ${HOUSE_LEVELS[pending].name} in ${months} months`;
}

function waterMeter(state: GameState, house: Building, need: Need | null): Meter {
  if (!hasService(state, house, 'water')) return { label: 'Water', fill: 0, value: 'None', need };
  const left = serviceLeft(state, house, 'water');
  return { label: 'Water', fill: left, value: `${Math.ceil(left * 100)}% left`, need };
}

function cultureMeter(state: GameState, house: Building, need: Need | null): Meter {
  const passed = culturesPassed(state, house);
  if (passed.length === 0) return { label: 'Culture', fill: 0, value: 'None', need };
  const points = culturePoints(state, house);
  return { label: 'Culture', fill: points / MAX_CULTURE_POINTS, value: `${points}: ${passed.join(', ')}`, need };
}

function taxStatus(state: GameState, house: Building): string {
  if (!hasService(state, house, 'tax')) return 'No tax collector has passed';
  if (!hasWorkingPalace(state)) return 'No palace to collect its tax';
  return `Pays ${drachmas(houseTax(house))} tax a month`;
}

function settlementStatus(state: GameState, lot: Building): string {
  if (adjacentRoadTiles(state, lot).length === 0) return 'No road access: settlers cannot reach it';
  if (!canSettlersReach(state, lot)) return 'Its road does not connect to the entry';
  if (state.settlers.some((s) => s.destinationId === lot.id)) return 'Settlers on the way';
  return 'Waiting for settlers';
}

function describeWorkplace(state: GameState, building: Building): Description {
  const spec = BUILDING_SPECS[building.type];
  const lines = [`Tile ${building.x}, ${building.y}`];
  const description: Description = { title: spec.name, meters: storageMeters(state, building), lines };
  if (building.type === 'storehouse') description.storehouse = storehouseView(building);
  if (!spec.needsRoad) {
    lines.push(`Appeal ${spec.appeal.join(', ')} by distance`, ...stockLines(state, building));
    return description;
  }
  if (adjacentRoadTiles(state, building).length === 0) {
    lines.push('No road access: does not work');
    return description;
  }
  if (spec.workers > 0) {
    lines.push(`Workers ${building.workers}/${spec.workers}`);
    if (building.workers === 0) {
      lines.push(isClosed(state, building) ? 'Closed in the Ledger: does not work' : 'No workers: does not work', ...stockLines(state, building));
      return description;
    }
  }
  lines.push(...stockLines(state, building), ...walkerLines(state, building));
  if (building.type === 'palace') {
    lines.push(`Taxes last month: ${drachmas(state.lastMonth.taxes)}`, `Wages last month: ${drachmas(state.lastMonth.wages)}`);
  }
  return description;
}

function storageMeters(state: GameState, building: Building): Meter[] {
  switch (building.type) {
    case 'foodVendor':
    case 'fleeceVendor':
    case 'oilVendor':
    case 'clothVendor':
      return [vendorMeter(building, capitalized(vendorGood(building)))];
    case 'agora':
      return agoraVendors(state, building).map((vendor) => vendorMeter(vendor, BUILDING_SPECS[vendor.type].name));
    case 'granary':
      return [{ label: 'Wheat', fill: building.food / GRANARY_CAPACITY, value: `${amount(building.food / UNITS_PER_LOAD)} of ${GRANARY_CAPACITY / UNITS_PER_LOAD} loads`, need: null }];
    default:
      return [];
  }
}

function vendorMeter(vendor: Building, label: string): Meter {
  const stock = vendor[vendorGood(vendor)];
  return { label, fill: stock / VENDOR_CAPACITY, value: `${amount(stock / UNITS_PER_LOAD)} of ${VENDOR_CAPACITY / UNITS_PER_LOAD} loads`, need: null };
}

const EMPTY_BAY: StorehouseBay = { good: null, loads: 0, refused: false };

function storehouseView(storehouse: Building): StorehouseView {
  const filled = baysOf(storehouse).map(({ good, loads }) => ({ good, loads, refused: !acceptsGood(storehouse, good) }));
  const stored = STOREHOUSE_GOODS.reduce((sum, good) => sum + storehouse[good], 0);
  return {
    id: storehouse.id,
    bays: [...filled, ...Array<StorehouseBay>(STOREHOUSE_SLOTS - filled.length).fill(EMPTY_BAY)],
    loads: `${amount(stored / UNITS_PER_LOAD)} of ${STOREHOUSE_CAPACITY / UNITS_PER_LOAD} loads`,
    free: freeSlots(STOREHOUSE_SLOTS - slotsUsed(storehouse)),
    orders: STOREHOUSE_GOODS.map((good) => ({ good, name: capitalized(GOOD_NAMES[good]), accepted: acceptsGood(storehouse, good) })),
  };
}

function freeSlots(count: number): string {
  if (count === 0) return 'Full';
  return `${count} ${count === 1 ? 'slot' : 'slots'} free`;
}

function stockLines(state: GameState, building: Building): string[] {
  switch (building.type) {
    case 'wheatFarm': {
      const crop = `Crop ${Math.round(building.growth * 100)}% grown, harvest in ${MONTH_NAMES[HARVEST_MONTH]}`;
      return building.food > 0 ? [crop, `Harvest waiting: ${loads(building.food)}`] : [crop];
    }
    case 'granary':
    case 'storehouse':
      return [];
    case 'oliveTree':
      if (!isRipe(building)) return [`Olives ${Math.round(building.growth * 100)}% grown`];
      return growerAfter(state, building) ? ['Ripe: ready to pick', 'A grower is on the way'] : ['Ripe: ready to pick'];
    case 'growersLodge':
      return building.olives > 0 ? [`Olives waiting: ${loads(building.olives)}`] : [];
    case 'olivePress':
      return [
        `Olives: ${amount(building.olives / UNITS_PER_LOAD)} of ${PRESS_OLIVE_CAPACITY / UNITS_PER_LOAD} loads`,
        ...(building.oil > 0 ? [`Oil waiting: ${loads(building.oil)}`] : []),
        pressStatus(building),
      ];
    case 'weaver':
      return [
        `Fleece: ${amount(building.fleece / UNITS_PER_LOAD)} of ${WEAVER_FLEECE_CAPACITY / UNITS_PER_LOAD} loads`,
        ...(building.cloth > 0 ? [`Cloth waiting: ${loads(building.cloth)}`] : []),
        weavingStatus(building),
      ];
    case 'cardingShed':
      return building.fleece > 0 ? [`Fleece waiting: ${loads(building.fleece)}`] : [];
    case 'timberMill':
    case 'masonryShop':
    case 'foundry': {
      const { good } = WORKSHOP_SPECS[building.type];
      return building[good] > 0 ? [`${capitalized(GOOD_NAMES[good])} waiting: ${loads(building[good])}`] : [];
    }
    case 'sculptureStudio':
      return [
        `Bronze: ${amount(building.bronze / UNITS_PER_LOAD)} of ${STUDIO_BRONZE_CAPACITY / UNITS_PER_LOAD} loads`,
        ...(building.sculptures > 0 ? [`Sculptures waiting: ${amount(building.sculptures / UNITS_PER_LOAD)}`] : []),
        castingStatus(building),
      ];
    case 'foodVendor':
    case 'fleeceVendor':
    case 'oilVendor':
    case 'clothVendor':
      return [];
    case 'agora':
      return agoraVendors(state, building).length > 0 ? [] : ['No vendors yet: place one on a free spot'];
    case 'demeterSanctuary':
    case 'athenaSanctuary':
    case 'hephaestusSanctuary':
      return [`Finished: honors ${SANCTUARY_SPECS[building.type].god}`];
    default:
      return venueLines(state, building);
  }
}

function capitalized(text: string): string {
  return `${text[0].toUpperCase()}${text.slice(1)}`;
}

function castingStatus(studio: Building): string {
  if (canCast(studio)) return `Casting: ${Math.round((studio.production / CASTING_TICKS) * 100)}% of a sculpture`;
  if (studio.bronze < BRONZE_PER_SCULPTURE) return `Waits for ${loads(BRONZE_PER_SCULPTURE)} of bronze`;
  return 'Full of sculptures: waits for its cart';
}

function pressStatus(press: Building): string {
  if (canPress(press)) return `Pressing: ${Math.round((press.production / PRESSING_TICKS) * 100)}% of a load`;
  return press.olives < UNITS_PER_LOAD ? 'Waits for olives' : 'Full of oil: waits for its cart';
}

function weavingStatus(weaver: Building): string {
  if (canWeave(weaver)) return `Weaving: ${Math.round((weaver.production / WEAVING_TICKS) * 100)}% of a load`;
  return weaver.fleece < UNITS_PER_LOAD ? 'Waits for fleece' : 'Full of cloth: waits for its cart';
}

function venueLines(state: GameState, venue: Building): string[] {
  const kind = traineeKindFor(venue.type);
  if (!kind) return [];
  const { name, school } = TRAINEE_SPECS[kind];
  if (!isPerforming(state, venue)) return [`No ${name.toLowerCase()}s here: a ${BUILDING_SPECS[school].name} sends them`];
  const months = (venue.performingUntil - state.tick) / TICKS_PER_MONTH;
  return [`${name}s here for ${amount(months)} more months`];
}

function walkerLines(state: GameState, building: Building): string[] {
  const lines: string[] = [];
  const roamerKind = roamerKindSentBy(building.type);
  if (roamerKind) {
    const spec = ROAMER_SPECS[roamerKind];
    const out = state.roamers.some((r) => r.homeId === building.id);
    lines.push(`${spec.name} ${out ? 'out in the streets' : (roamerWaitsFor(state, building, spec) ?? 'getting ready')}`);
  }
  if (building.type === 'cardingShed') lines.push(shepherdStatus(state, building));
  if (building.type === 'growersLodge') lines.push(growerStatus(state, building));
  if (isWorkshop(building.type)) lines.push(gathererStatus(state, building, building.type));
  if (building.type === 'artisansGuild') lines.push(artisanStatus(state, building));
  for (const kind of carrierKindsSentBy(building.type)) {
    if (supplies(kind) && !state.carriers.some((c) => c.homeId === building.id && c.kind === kind)) continue;
    lines.push(carrierStatus(state, building, kind));
  }
  const traineeKind = traineeKindSentBy(building.type);
  if (traineeKind) lines.push(traineeStatus(state, building, traineeKind));
  return lines;
}

function supplies(kind: Carrier['kind']): boolean {
  return CARRIER_SPECS[kind].stores.every(isSanctuary);
}

function artisanStatus(state: GameState, guild: Building): string {
  const artisan = state.artisans.find((a) => a.homeId === guild.id);
  const site = artisan && buildingById(state, artisan.destinationId);
  if (site) return `Artisan on the way to the ${BUILDING_SPECS[site.type].name} at ${site.x}, ${site.y}`;
  if (sitesToBuild(state).length > 0) return 'Artisan getting ready';
  if (state.buildings.some(isUnderConstruction)) return 'Artisans wait for materials at a sanctuary';
  return 'Artisans wait for a sanctuary to build';
}

function roamerWaitsFor(state: GameState, building: Building, spec: RoamerSpec): string | null {
  if (spec.service === 'goods' && !hasGoodsToSell(state, building)) return 'waits for goods';
  if (traineeKindFor(building.type) && !isPerforming(state, building)) return 'waits for one to arrive';
  return null;
}

function traineeStatus(state: GameState, school: Building, kind: Trainee['kind']): string {
  const { name, venue } = TRAINEE_SPECS[kind];
  const trainee = state.trainees.find((t) => t.homeId === school.id);
  const destination = trainee && buildingById(state, trainee.destinationId);
  if (destination) return `${name} on the way to the ${BUILDING_SPECS[venue].name} at ${destination.x}, ${destination.y}`;
  if (staffedVenues(state, kind).length === 0) return `${name} waits for a staffed ${BUILDING_SPECS[venue].name}`;
  return `${name} in training`;
}

function shepherdStatus(state: GameState, shed: Building): string {
  const shepherd = state.shepherds.find((s) => s.homeId === shed.id);
  const sheep = shepherd && state.sheep.find((s) => s.id === shepherd.sheepId);
  if (shepherd && !shepherd.returning && sheep) {
    const at = sheepTile(sheep);
    return `Shepherd out to shear the sheep at ${at.x}, ${at.y}`;
  }
  if (shepherd) return `Shepherd ${shepherd.fleece > 0 ? 'bringing fleece home' : 'returning home'}`;
  if (shed.fleece >= SHED_CAPACITY) return 'Shepherd waits: the shed is full';
  if (sheepToShear(state, shed).length === 0) return `Shepherd waits for a sheep with a full fleece within ${SHEARING_RANGE} tiles`;
  return 'Shepherd resting';
}

function growerStatus(state: GameState, lodge: Building): string {
  const grower = state.growers.find((g) => g.homeId === lodge.id);
  const tree = grower && buildingById(state, grower.treeId);
  if (grower && !grower.returning && tree) return `Grower out to pick the olive tree at ${tree.x}, ${tree.y}`;
  if (grower) return `Grower ${grower.olives > 0 ? 'bringing olives home' : 'returning home'}`;
  if (lodge.olives >= LODGE_CAPACITY) return 'Grower waits: the lodge is full';
  if (treesToPick(state, lodge).length === 0) return `Grower waits for a ripe olive tree within ${GROVE_RANGE} tiles`;
  return 'Grower resting';
}

function gathererStatus(state: GameState, shop: Building, type: Workshop): string {
  const { gatherer: name, work, site, home, good, resource } = WORKSHOP_SPECS[type];
  const gatherer = state.gatherers.find((g) => g.homeId === shop.id);
  if (gatherer && !gatherer.returning) return `${name} out to ${work} the ${site} at ${gatherer.site.x}, ${gatherer.site.y}`;
  if (gatherer) return `${name} ${gatherer.load > 0 ? `bringing ${GOOD_NAMES[good]} home` : 'returning home'}`;
  if (shop[good] >= WORKSHOP_CAPACITY) return `${name} waits: the ${home} is full`;
  if (sitesToWork(state, shop, type).length === 0) return `${name} waits for ${TERRAIN_NAMES[resource].toLowerCase()} within ${RESOURCE_RANGE} tiles`;
  return `${name} resting`;
}

function withArticle(noun: string): string {
  return `${/^[aeiou]/.test(noun) ? 'an' : 'a'} ${noun}`;
}

function carrierStatus(state: GameState, building: Building, kind: Carrier['kind']): string {
  const { name, good, stores, delivers } = CARRIER_SPECS[kind];
  const goodName = GOOD_NAMES[good];
  const storeName = withArticle(stores.map((store) => BUILDING_SPECS[store].name.toLowerCase()).join(' or '));
  const carrier = state.carriers.find((c) => c.homeId === building.id && c.kind === kind);
  const atHome = `${name} at the ${CARRIER_HOMES[kind]}`;
  if (delivers) {
    if (carrier) return `${name} out with a load`;
    if (building[good] > 0 && carrierDestinations(state, kind).length === 0) return `${name} waits for ${storeName} with room`;
    return atHome;
  }
  if (carrier) return `${name} ${carrier.returning ? `bringing ${goodName} home` : `out fetching ${goodName}`}`;
  const kept = keptBack(kind);
  const enough = kept > 0 ? `more than ${loads(kept)} of ${goodName}` : goodName;
  if (carrierDestinations(state, kind).length === 0) return `${name} waits for ${storeName} with ${enough}`;
  return atHome;
}

function riskLines(building: Building): string[] {
  const percent = (risk: number) => `${Math.round(riskShare(risk) * 100)}%`;
  const lines: string[] = [];
  if (canBurn(building)) lines.push(`Fire risk ${percent(building.fireRisk)}`);
  if (canCollapse(building)) lines.push(`Collapse risk ${percent(building.collapseRisk)}`);
  return lines;
}

function describeSite(state: GameState, site: Building): Description {
  const type = site.type as Sanctuary;
  const lines = [`Tile ${site.x}, ${site.y}`, `Under construction: ${builtStages(site)} of ${SANCTUARY_STAGES} stages built`];
  lines.push(`Marble: ${amount(site.marble / UNITS_PER_LOAD)} of ${loads(materialNeeded(type, 'marble'))}`);
  lines.push(`Wood: ${amount(site.wood / UNITS_PER_LOAD)} of ${loads(materialNeeded(type, 'wood'))}`);
  lines.push(`Sculptures: ${amount(site.sculptures / UNITS_PER_LOAD)} of ${SANCTUARY_SPECS[type].loads.sculptures}`);
  if (adjacentRoadTiles(state, site).length === 0) {
    lines.push('No road access: carts and artisans cannot reach it');
  } else if (suppliedStages(site) > builtStages(site)) {
    lines.push(`Artisans at work: ${site.production % VISITS_PER_STAGE} of ${VISITS_PER_STAGE} visits for the next stage`);
  } else {
    const next = builtStages(site) + 1;
    const short = SANCTUARY_MATERIALS.filter((m) => site[m] * SANCTUARY_STAGES < materialNeeded(type, m) * next);
    lines.push(`Waits for ${short.join(', ')} to start the next stage`);
  }
  return { title: BUILDING_SPECS[type].name, meters: [], lines };
}

function describeRuins(state: GameState, ruins: Building): Description {
  const status = isBurning(state, ruins) ? 'On fire: a superintendent puts it out' : 'Clear it with the demolish tool';
  return { title: BUILDING_SPECS.ruins.name, meters: [], lines: [`Tile ${ruins.x}, ${ruins.y}`, status] };
}

function describeSettler(state: GameState, settler: Settler): Description {
  const destination = buildingById(state, settler.destinationId);
  const heading = destination
    ? `Heading to ${houseName(destination)} at ${destination.x}, ${destination.y}`
    : 'Looking for another lot';
  return { title: 'Settler', meters: [], lines: [`Carrying ${settler.people} people`, heading] };
}

function homeLine(state: GameState, homeId: number): string {
  const home = buildingById(state, homeId);
  if (!home) throw new Error(`Walker comes from missing building ${homeId}`);
  return `From the ${BUILDING_SPECS[home.type].name} at ${home.x}, ${home.y}`;
}

function describeRoamer(state: GameState, roamer: Roamer): Description {
  const spec = ROAMER_SPECS[roamer.kind];
  return {
    title: spec.name,
    meters: [],
    lines: [homeLine(state, roamer.homeId), roamer.returning ? 'Returning home' : `Walked ${roamer.step} of ${spec.range} tiles`],
  };
}

function describeCarrier(state: GameState, carrier: Carrier): Description {
  const { name, good, stores, delivers } = CARRIER_SPECS[carrier.kind];
  const lines = [homeLine(state, carrier.homeId)];
  const destination = buildingById(state, carrier.destinationId);
  const storeNames = stores.map((store) => BUILDING_SPECS[store].name.toLowerCase()).join(' or ');
  if (carrier.returning) {
    lines.push(delivers ? 'Returning home' : `Bringing home ${amount(carrier[good])} units`);
  } else if (destination) {
    const at = `the ${BUILDING_SPECS[destination.type].name} at ${destination.x}, ${destination.y}`;
    lines.push(delivers ? `Carrying ${loads(carrier[good])} to ${at}` : `Fetching ${GOOD_NAMES[good]} from ${at}`);
  } else {
    lines.push(`Looking for another ${storeNames}`);
  }
  return { title: name, meters: [], lines };
}

function describeCaravan(state: GameState, caravan: Caravan): Description {
  if (caravan.trip === 'away') throw new Error(`Caravan ${caravan.id} is off the map`);
  const guild = buildingById(state, caravan.guildId);
  const from = guild ? homeLine(state, guild.id) : "Its Traders' Guild is gone";
  const partner = PLACES[caravan.partner].name;
  const worth = drachmas(caravan.drachmas);
  const trip: Record<Exclude<CaravanTrip, 'away'>, string[]> = {
    out: [caravan.waiting ? 'Waiting: no road west' : `Heading out to ${partner}`, `Carrying ${caravanCargo(caravan)}, worth ${worth}`],
    home: [caravan.waiting ? 'Waiting: no road to the Palace' : `Taking ${worth} to the Palace`, `Sold ${caravanCargo(caravan)} in ${partner}`],
    merchants: ['Merchants walking home to the guild'],
  };
  return { title: 'Trade Caravan', meters: [], lines: [from, ...trip[caravan.trip]] };
}

function describeForeignCaravan(state: GameState, caravan: ForeignCaravan): Description {
  const partner = PLACES[caravan.partner].name;
  const trip: Record<'in' | 'back', string[]> = {
    in: [`Bringing ${caravanCargo(caravan)} to the ${BUILDING_SPECS.tradeYard.name}`, `We pay ${drachmas(caravan.cost)} when it unloads`],
    back: [`Heading home to ${partner}`],
  };
  if (caravan.trip !== 'in' && caravan.trip !== 'back') throw new Error(`Caravan from ${partner} is off the map`);
  return { title: 'Trade Caravan', meters: [], lines: [`From ${partner}`, ...trip[caravan.trip]] };
}

function describeTrainee(state: GameState, trainee: Trainee): Description {
  const { name, venue } = TRAINEE_SPECS[trainee.kind];
  const destination = buildingById(state, trainee.destinationId);
  const venueName = BUILDING_SPECS[venue].name;
  const heading = destination ? `Heading to the ${venueName} at ${destination.x}, ${destination.y}` : `Looking for another ${venueName}`;
  return { title: name, meters: [], lines: [homeLine(state, trainee.homeId), heading] };
}

function describeShepherd(state: GameState, shepherd: Shepherd): Description {
  return { title: 'Shepherd', meters: [], lines: [homeLine(state, shepherd.homeId), shepherdErrand(state, shepherd)] };
}

function shepherdErrand(state: GameState, shepherd: Shepherd): string {
  const sheep = state.sheep.find((s) => s.id === shepherd.sheepId);
  if (!shepherd.returning && sheep) return `Going to shear the sheep at ${sheepTile(sheep).x}, ${sheepTile(sheep).y}`;
  return shepherd.fleece > 0 ? `Bringing ${loads(shepherd.fleece)} of fleece home` : 'Returning home';
}

function describeGrower(state: GameState, grower: Grower): Description {
  return { title: 'Grower', meters: [], lines: [homeLine(state, grower.homeId), growerErrand(state, grower)] };
}

function growerErrand(state: GameState, grower: Grower): string {
  const tree = buildingById(state, grower.treeId);
  if (!grower.returning && tree) return `Going to pick the olive tree at ${tree.x}, ${tree.y}`;
  return grower.olives > 0 ? `Bringing ${loads(grower.olives)} of olives home` : 'Returning home';
}

function describeGatherer(state: GameState, gatherer: Gatherer): Description {
  const shop = buildingById(state, gatherer.homeId);
  if (!shop || !isWorkshop(shop.type)) throw new Error(`Gatherer ${gatherer.id} comes from no workshop`);
  const { gatherer: name, work, site } = WORKSHOP_SPECS[shop.type];
  const errand = gatherer.returning
    ? gatherer.load > 0
      ? `Bringing ${loads(gatherer.load)} of ${GOOD_NAMES[gatherer.good]} home`
      : 'Returning home'
    : `Going to ${work} the ${site} at ${gatherer.site.x}, ${gatherer.site.y}`;
  return { title: name, meters: [], lines: [homeLine(state, gatherer.homeId), errand] };
}

function describeArtisan(state: GameState, artisan: Artisan): Description {
  const site = buildingById(state, artisan.destinationId);
  const errand = site ? `Going to build the ${BUILDING_SPECS[site.type].name} at ${site.x}, ${site.y}` : 'Looking for another sanctuary';
  return { title: 'Artisan', meters: [], lines: [homeLine(state, artisan.homeId), errand] };
}

function describeSheep(state: GameState, sheep: Sheep): Description {
  const lines = [`Grazing near ${sheep.home.x}, ${sheep.home.y}`];
  lines.push(hasFullFleece(sheep) ? 'Full fleece: ready to shear' : `Fleece ${Math.round(sheep.fleece * 100)}% grown`);
  if (shepherdAfter(state, sheep)) lines.push('A shepherd is on the way');
  return { title: 'Sheep', meters: [], lines };
}

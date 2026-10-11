import { houseAppeal } from './appeal';
import { BUILDING_SPECS } from './buildings';
import { MONTH_NAMES } from './clock';
import { CARRIER_SPECS, carrierDestinations, carrierKindSentBy } from './carriers';
import { adjacentRoadTiles, agoraAt } from './commands';
import { hasWorkingPalace, houseTax } from './economy';
import { GRANARY_CAPACITY, HARVEST_MONTH, UNITS_PER_LOAD, VENDOR_CAPACITY, monthlyFood } from './food';
import { HOUSE_LEVELS, NEXT_LEVEL, houseCapacity, houseLevel, houseName, missingNeeds } from './housing';
import { ROAMER_SPECS, hasService, roamerKindSentBy, serviceLeft } from './roamers';
import { canSettlersReach } from './settlers';
import {
  NO_BUILDING,
  buildingById,
  tileIndex,
  type Building,
  type Carrier,
  type GameState,
  type Roamer,
  type Settler,
  type Walk,
} from './state';
import { BUILDABLE, TERRAIN_NAMES } from './terrain';
import { walkerTile } from './walking';

export interface Description {
  title: string;
  lines: string[];
}

export function describeTile(state: GameState, x: number, y: number): Description {
  const i = tileIndex(state, x, y);
  const buildingId = state.buildingIdAt[i];

  if (buildingId !== NO_BUILDING) {
    const building = buildingById(state, buildingId);
    if (!building) throw new Error(`Tile ${x}, ${y} points at missing building ${buildingId}`);
    return building.type === 'house' ? describeHouse(state, building) : describeWorkplace(state, building);
  }

  const standsHere = (walker: Walk) => {
    const tile = walkerTile(walker);
    return tile.x === x && tile.y === y;
  };
  const settler = state.settlers.find(standsHere);
  if (settler) return describeSettler(state, settler);
  const roamer = state.roamers.find(standsHere);
  if (roamer) return describeRoamer(state, roamer);
  const carrier = state.carriers.find(standsHere);
  if (carrier) return describeCarrier(state, carrier);

  if (state.roadblocks[i]) return { title: 'Roadblock', lines: [`Tile ${x}, ${y}`, 'Stops roaming walkers; settlers pass'] };
  if (state.roads[i]) return { title: 'Road', lines: [`Tile ${x}, ${y}`] };

  const terrain = state.terrain[i];
  return {
    title: TERRAIN_NAMES[terrain],
    lines: [`Tile ${x}, ${y}`, BUILDABLE.has(terrain) ? 'Buildable' : 'Not buildable'],
  };
}

function amount(value: number): string {
  return value.toLocaleString('en-US', { maximumFractionDigits: 1 });
}

function drachmas(value: number): string {
  return `${value.toLocaleString('en-US', { maximumFractionDigits: 2 })} dr`;
}

function loads(units: number): string {
  return `${amount(units / UNITS_PER_LOAD)} loads`;
}

function describeHouse(state: GameState, house: Building): Description {
  const lines = [`Tile ${house.x}, ${house.y}`, `Residents ${house.residents}/${houseCapacity(house)}`];
  const level = houseLevel(house);
  if (!level) {
    lines.push(settlementStatus(state, house));
    return { title: houseName(house), lines };
  }
  const appeal = houseAppeal(state, house);
  lines.push(`Appeal ${appeal}`, foodStatus(house), waterStatus(state, house), taxStatus(state, house));
  const next = NEXT_LEVEL[level];
  if (next) lines.push(nextLevelStatus(house, next, appeal));
  return { title: houseName(house), lines };
}

function foodStatus(house: Building): string {
  if (house.food <= 0) return 'No food';
  const eaten = monthlyFood(house);
  const lasts = eaten > 0 ? ` (${amount(house.food / eaten)} months)` : '';
  return `Food: ${amount(house.food)} units${lasts}`;
}

function nextLevelStatus(house: Building, next: keyof typeof HOUSE_LEVELS, appeal: number): string {
  const { name, appeal: thresholds } = HOUSE_LEVELS[next];
  const blockers: string[] = missingNeeds(house, next);
  if (appeal < thresholds.evolve) blockers.push(`appeal ${thresholds.evolve} (has ${appeal})`);
  return blockers.length > 0 ? `Needs for ${name}: ${blockers.join(', ')}` : `Ready to become a ${name}`;
}

function waterStatus(state: GameState, house: Building): string {
  if (!hasService(state, house, 'water')) return 'No water carrier has passed';
  return `Water: ${Math.ceil(serviceLeft(state, house, 'water') * 100)}% left`;
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
  if (!spec.needsRoad) {
    lines.push(`Appeal ${spec.appeal.join(', ')} by distance`);
    return { title: spec.name, lines };
  }
  if (adjacentRoadTiles(state, building).length === 0) {
    lines.push('No road access: does not work');
    return { title: spec.name, lines };
  }
  if (spec.workers > 0) {
    lines.push(`Workers ${building.workers}/${spec.workers}`);
    if (building.workers === 0) {
      lines.push('No workers: does not work', ...stockLines(state, building));
      return { title: spec.name, lines };
    }
  }
  lines.push(...stockLines(state, building), ...walkerLines(state, building));
  if (building.type === 'palace') {
    lines.push(`Taxes last month: ${drachmas(state.lastMonth.taxes)}`, `Wages last month: ${drachmas(state.lastMonth.wages)}`);
  }
  return { title: spec.name, lines };
}

function stockLines(state: GameState, building: Building): string[] {
  switch (building.type) {
    case 'wheatFarm': {
      const crop = `Crop ${Math.round(building.growth * 100)}% grown, harvest in ${MONTH_NAMES[HARVEST_MONTH]}`;
      return building.food > 0 ? [crop, `Harvest waiting: ${loads(building.food)}`] : [crop];
    }
    case 'granary':
      return [`Wheat: ${amount(building.food / UNITS_PER_LOAD)} of ${GRANARY_CAPACITY / UNITS_PER_LOAD} loads`];
    case 'foodVendor':
      return [`Stock: ${amount(building.food)} of ${VENDOR_CAPACITY} units`];
    case 'agora': {
      const vendors = state.buildings.filter((b) => b.type === 'foodVendor' && agoraAt(state, b) === building);
      return vendors.length > 0
        ? [`Vendors: ${vendors.map((v) => BUILDING_SPECS[v.type].name).join(', ')}`]
        : ['No vendors yet: place one on a free spot'];
    }
    default:
      return [];
  }
}

function walkerLines(state: GameState, building: Building): string[] {
  const lines: string[] = [];
  const roamerKind = roamerKindSentBy(building.type);
  if (roamerKind) {
    const spec = ROAMER_SPECS[roamerKind];
    const out = state.roamers.some((r) => r.homeId === building.id);
    const waits = spec.service === 'food' && building.food === 0;
    lines.push(`${spec.name} ${out ? 'out in the streets' : waits ? 'waits for food' : 'getting ready'}`);
  }
  const carrierKind = carrierKindSentBy(building.type);
  if (carrierKind) lines.push(carrierStatus(state, building, carrierKind));
  return lines;
}

function carrierStatus(state: GameState, building: Building, kind: Carrier['kind']): string {
  const { name } = CARRIER_SPECS[kind];
  const carrier = state.carriers.find((c) => c.homeId === building.id);
  if (kind === 'cartPusher') return `${name} ${carrier ? 'out with a load' : 'at the farm'}`;
  if (carrier) return `${name} ${carrier.returning ? 'bringing wheat home' : 'out fetching wheat'}`;
  if (carrierDestinations(state, kind).length === 0) return `${name} waits for a granary with wheat`;
  return `${name} at the stall`;
}

function describeSettler(state: GameState, settler: Settler): Description {
  const destination = buildingById(state, settler.destinationId);
  const heading = destination
    ? `Heading to ${houseName(destination)} at ${destination.x}, ${destination.y}`
    : 'Looking for another lot';
  return { title: 'Settler', lines: [`Carrying ${settler.people} people`, heading] };
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
    lines: [homeLine(state, roamer.homeId), roamer.returning ? 'Returning home' : `Walked ${roamer.step} of ${spec.range} tiles`],
  };
}

function describeCarrier(state: GameState, carrier: Carrier): Description {
  const lines = [homeLine(state, carrier.homeId)];
  const granary = buildingById(state, carrier.destinationId);
  if (carrier.returning) {
    lines.push(carrier.kind === 'buyer' ? `Bringing home ${amount(carrier.food)} units` : 'Returning home');
  } else if (granary) {
    const at = `the Granary at ${granary.x}, ${granary.y}`;
    lines.push(carrier.kind === 'buyer' ? `Fetching wheat from ${at}` : `Carrying ${loads(carrier.food)} to ${at}`);
  } else {
    lines.push('Looking for another granary');
  }
  return { title: CARRIER_SPECS[carrier.kind].name, lines };
}

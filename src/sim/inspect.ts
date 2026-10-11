import { houseAppeal } from './appeal';
import { BUILDING_SPECS, isAgoraVendor } from './buildings';
import { MONTH_NAMES, TICKS_PER_MONTH } from './clock';
import { culturePoints, culturesPassed } from './culture';
import { CARRIER_SPECS, carrierDestinations, carrierKindSentBy } from './carriers';
import { adjacentRoadTiles, agoraAt } from './commands';
import { hasWorkingPalace, houseTax } from './economy';
import { GRANARY_CAPACITY, HARVEST_MONTH, UNITS_PER_LOAD, VENDOR_CAPACITY, monthlyFood } from './food';
import { HOUSE_LEVELS, NEXT_LEVEL, houseCapacity, houseLevel, houseName, lacksCulture, missingNeeds } from './housing';
import { ROAMER_SPECS, hasService, isGood, type RoamerSpec, roamerKindSentBy, serviceLeft } from './roamers';
import { TRAINEE_SPECS, isPerforming, staffedVenues, traineeKindFor, traineeKindSentBy } from './schools';
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
  type Trainee,
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
  const trainee = state.trainees.find(standsHere);
  if (trainee) return describeTrainee(state, trainee);

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
  lines.push(`Appeal ${appeal}`, foodStatus(house), waterStatus(state, house), cultureStatus(state, house), taxStatus(state, house));
  const next = NEXT_LEVEL[level];
  if (next) lines.push(nextLevelStatus(state, house, next, appeal));
  return { title: houseName(house), lines };
}

function foodStatus(house: Building): string {
  if (house.food <= 0) return 'No food';
  const eaten = monthlyFood(house);
  const lasts = eaten > 0 ? ` (${amount(house.food / eaten)} months)` : '';
  return `Food: ${amount(house.food)} units${lasts}`;
}

function nextLevelStatus(state: GameState, house: Building, next: keyof typeof HOUSE_LEVELS, appeal: number): string {
  const { name, appeal: thresholds } = HOUSE_LEVELS[next];
  const blockers: string[] = missingNeeds(state, house, next);
  if (lacksCulture(state, house, next)) blockers.push(`culture ${HOUSE_LEVELS[next].culture} (has ${culturePoints(state, house)})`);
  if (appeal < thresholds.evolve) blockers.push(`appeal ${thresholds.evolve} (has ${appeal})`);
  return blockers.length > 0 ? `Needs for ${name}: ${blockers.join(', ')}` : `Ready to become a ${name}`;
}

function waterStatus(state: GameState, house: Building): string {
  if (!hasService(state, house, 'water')) return 'No water carrier has passed';
  return `Water: ${Math.ceil(serviceLeft(state, house, 'water') * 100)}% left`;
}

function cultureStatus(state: GameState, house: Building): string {
  const passed = culturesPassed(state, house);
  return passed.length > 0 ? `Culture ${culturePoints(state, house)}: ${passed.join(', ')}` : 'No culture has passed';
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
      const vendors = state.buildings.filter((b) => isAgoraVendor(b.type) && agoraAt(state, b) === building);
      return vendors.length > 0
        ? [`Vendors: ${vendors.map((v) => BUILDING_SPECS[v.type].name).join(', ')}`]
        : ['No vendors yet: place one on a free spot'];
    }
    default:
      return venueLines(state, building);
  }
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
  const carrierKind = carrierKindSentBy(building.type);
  if (carrierKind) lines.push(carrierStatus(state, building, carrierKind));
  const traineeKind = traineeKindSentBy(building.type);
  if (traineeKind) lines.push(traineeStatus(state, building, traineeKind));
  return lines;
}

function roamerWaitsFor(state: GameState, building: Building, spec: RoamerSpec): string | null {
  if (isGood(spec.service) && building[spec.service] === 0) return `waits for ${spec.service}`;
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

function describeTrainee(state: GameState, trainee: Trainee): Description {
  const { name, venue } = TRAINEE_SPECS[trainee.kind];
  const destination = buildingById(state, trainee.destinationId);
  const venueName = BUILDING_SPECS[venue].name;
  const heading = destination ? `Heading to the ${venueName} at ${destination.x}, ${destination.y}` : `Looking for another ${venueName}`;
  return { title: name, lines: [homeLine(state, trainee.homeId), heading] };
}

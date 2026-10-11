import { houseAppeal } from './appeal';
import { BUILDING_SPECS, isAgoraVendor } from './buildings';
import { MONTH_NAMES, TICKS_PER_MONTH } from './clock';
import { culturePoints, culturesPassed } from './culture';
import { CARRIER_SPECS, carrierDestinations, carrierKindSentBy } from './carriers';
import { adjacentRoadTiles, agoraAt } from './commands';
import { hasWorkingPalace, houseTax } from './economy';
import { GRANARY_CAPACITY, HARVEST_MONTH, UNITS_PER_LOAD, VENDOR_CAPACITY, monthlyFleece, monthlyFood } from './food';
import { HOUSE_LEVELS, NEXT_LEVEL, houseCapacity, houseLevel, houseName, lacksCulture, missingNeeds } from './housing';
import { ROAMER_SPECS, hasService, isGood, type RoamerSpec, roamerKindSentBy, serviceLeft } from './roamers';
import { TRAINEE_SPECS, isPerforming, staffedVenues, traineeKindFor, traineeKindSentBy } from './schools';
import { canSettlersReach } from './settlers';
import { SHEARING_RANGE, SHED_CAPACITY, hasFullFleece, sheepTile, sheepToShear, shepherdAfter } from './sheep';
import { STOREHOUSE_SLOTS, SLOT_SIZE, slotsUsed } from './storehouse';
import {
  NO_BUILDING,
  buildingById,
  tileIndex,
  type Building,
  type Carrier,
  type GameState,
  type Good,
  type Roamer,
  type Settler,
  type Sheep,
  type Shepherd,
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
  const shepherd = state.shepherds.find(standsHere);
  if (shepherd) return describeShepherd(state, shepherd);
  const sheep = state.sheep.find(standsHere);
  if (sheep) return describeSheep(state, sheep);

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
  const count = units / UNITS_PER_LOAD;
  return `${amount(count)} ${count === 1 ? 'load' : 'loads'}`;
}

const GOOD_NAMES: Record<Good, string> = { food: 'wheat', fleece: 'fleece' };

const CARRIER_HOMES: Record<Carrier['kind'], string> = { cartPusher: 'farm', buyer: 'stall', fleeceCart: 'shed', fleeceBuyer: 'stall' };

function describeHouse(state: GameState, house: Building): Description {
  const lines = [`Tile ${house.x}, ${house.y}`, `Residents ${house.residents}/${houseCapacity(house)}`];
  const level = houseLevel(house);
  if (!level) {
    lines.push(settlementStatus(state, house));
    return { title: houseName(house), lines };
  }
  const appeal = houseAppeal(state, house);
  const next = NEXT_LEVEL[level];
  lines.push(`Appeal ${appeal}`, foodStatus(house));
  if ([level, next].some((l) => l && HOUSE_LEVELS[l].needs.includes('fleece'))) lines.push(fleeceStatus(house));
  lines.push(waterStatus(state, house), cultureStatus(state, house), taxStatus(state, house));
  if (next) lines.push(nextLevelStatus(state, house, next, appeal));
  return { title: houseName(house), lines };
}

function foodStatus(house: Building): string {
  if (house.food <= 0) return 'No food';
  const eaten = monthlyFood(house);
  const lasts = eaten > 0 ? ` (${amount(house.food / eaten)} months)` : '';
  return `Food: ${amount(house.food)} units${lasts}`;
}

function fleeceStatus(house: Building): string {
  if (house.fleece <= 0) return 'No fleece';
  const used = monthlyFleece(house);
  const lasts = used > 0 ? ` (${amount(house.fleece / used)} months)` : '';
  return `Fleece: ${amount(house.fleece)} units${lasts}`;
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
    case 'storehouse':
      return building.fleece > 0
        ? [`Fleece: ${loads(building.fleece)} in ${slotsUsed(building)} of ${STOREHOUSE_SLOTS} slots`]
        : [`Empty: ${STOREHOUSE_SLOTS} slots of ${loads(SLOT_SIZE)}`];
    case 'cardingShed':
      return building.fleece > 0 ? [`Fleece waiting: ${loads(building.fleece)}`] : [];
    case 'foodVendor':
    case 'fleeceVendor': {
      const kind = carrierKindSentBy(building.type);
      if (!kind) throw new Error(`Vendor ${building.id} sends no buyer`);
      return [`Stock: ${amount(building[CARRIER_SPECS[kind].good])} of ${VENDOR_CAPACITY} units`];
    }
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
  if (building.type === 'cardingShed') lines.push(shepherdStatus(state, building));
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

function carrierStatus(state: GameState, building: Building, kind: Carrier['kind']): string {
  const { name, good, store, delivers } = CARRIER_SPECS[kind];
  const goodName = GOOD_NAMES[good];
  const storeName = BUILDING_SPECS[store].name.toLowerCase();
  const carrier = state.carriers.find((c) => c.homeId === building.id);
  const atHome = `${name} at the ${CARRIER_HOMES[kind]}`;
  if (delivers) {
    if (carrier) return `${name} out with a load`;
    if (building[good] > 0 && carrierDestinations(state, kind).length === 0) return `${name} waits for a ${storeName} with room`;
    return atHome;
  }
  if (carrier) return `${name} ${carrier.returning ? `bringing ${goodName} home` : `out fetching ${goodName}`}`;
  if (carrierDestinations(state, kind).length === 0) return `${name} waits for a ${storeName} with ${goodName}`;
  return atHome;
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
  const { name, good, store, delivers } = CARRIER_SPECS[carrier.kind];
  const lines = [homeLine(state, carrier.homeId)];
  const destination = buildingById(state, carrier.destinationId);
  if (carrier.returning) {
    lines.push(delivers ? 'Returning home' : `Bringing home ${amount(carrier[good])} units`);
  } else if (destination) {
    const at = `the ${BUILDING_SPECS[store].name} at ${destination.x}, ${destination.y}`;
    lines.push(delivers ? `Carrying ${loads(carrier[good])} to ${at}` : `Fetching ${GOOD_NAMES[good]} from ${at}`);
  } else {
    lines.push(`Looking for another ${BUILDING_SPECS[store].name.toLowerCase()}`);
  }
  return { title: name, lines };
}

function describeTrainee(state: GameState, trainee: Trainee): Description {
  const { name, venue } = TRAINEE_SPECS[trainee.kind];
  const destination = buildingById(state, trainee.destinationId);
  const venueName = BUILDING_SPECS[venue].name;
  const heading = destination ? `Heading to the ${venueName} at ${destination.x}, ${destination.y}` : `Looking for another ${venueName}`;
  return { title: name, lines: [homeLine(state, trainee.homeId), heading] };
}

function describeShepherd(state: GameState, shepherd: Shepherd): Description {
  return { title: 'Shepherd', lines: [homeLine(state, shepherd.homeId), shepherdErrand(state, shepherd)] };
}

function shepherdErrand(state: GameState, shepherd: Shepherd): string {
  const sheep = state.sheep.find((s) => s.id === shepherd.sheepId);
  if (!shepherd.returning && sheep) return `Going to shear the sheep at ${sheepTile(sheep).x}, ${sheepTile(sheep).y}`;
  return shepherd.fleece > 0 ? `Bringing ${loads(shepherd.fleece)} of fleece home` : 'Returning home';
}

function describeSheep(state: GameState, sheep: Sheep): Description {
  const lines = [`Grazing near ${sheep.home.x}, ${sheep.home.y}`];
  lines.push(hasFullFleece(sheep) ? 'Full fleece: ready to shear' : `Fleece ${Math.round(sheep.fleece * 100)}% grown`);
  if (shepherdAfter(state, sheep)) lines.push('A shepherd is on the way');
  return { title: 'Sheep', lines };
}

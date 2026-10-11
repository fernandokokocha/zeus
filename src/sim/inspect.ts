import { BUILDING_SPECS } from './buildings';
import { adjacentRoadTiles } from './commands';
import { hasWorkingPalace, houseTax } from './economy';
import { HOUSE_LEVELS, NEXT_LEVEL, houseCapacity, houseLevel, houseName } from './housing';
import { ROAMER_SPECS, hasService, roamerKindSentBy, serviceLeft } from './roamers';
import { canSettlersReach } from './settlers';
import { NO_BUILDING, buildingById, tileIndex, type Building, type GameState, type Roamer, type Settler } from './state';
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

  const standsHere = (walker: Settler | Roamer) => {
    const tile = walkerTile(walker);
    return tile.x === x && tile.y === y;
  };
  const settler = state.settlers.find(standsHere);
  if (settler) return describeSettler(state, settler);
  const roamer = state.roamers.find(standsHere);
  if (roamer) return describeRoamer(state, roamer);

  if (state.roads[i]) return { title: 'Road', lines: [`Tile ${x}, ${y}`] };

  const terrain = state.terrain[i];
  return {
    title: TERRAIN_NAMES[terrain],
    lines: [`Tile ${x}, ${y}`, BUILDABLE.has(terrain) ? 'Buildable' : 'Not buildable'],
  };
}

function drachmas(amount: number): string {
  return `${amount.toLocaleString('en-US', { maximumFractionDigits: 2 })} dr`;
}

function describeHouse(state: GameState, house: Building): Description {
  const lines = [`Tile ${house.x}, ${house.y}`, `Residents ${house.residents}/${houseCapacity(house)}`];
  const level = houseLevel(house);
  if (level) {
    lines.push(waterStatus(state, house), taxStatus(state, house));
    const next = NEXT_LEVEL[level];
    if (next) lines.push(`Needs for ${HOUSE_LEVELS[next].name}: ${HOUSE_LEVELS[next].needs.join(', ')}`);
  } else {
    lines.push(settlementStatus(state, house));
  }
  return { title: houseName(house), lines };
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
  if (adjacentRoadTiles(state, building).length === 0) {
    lines.push('No road access: does not work');
    return { title: spec.name, lines };
  }
  if (spec.workers > 0) {
    lines.push(`Workers ${building.workers}/${spec.workers}`);
    if (building.workers === 0) {
      lines.push('No workers: does not work');
      return { title: spec.name, lines };
    }
  }
  const kind = roamerKindSentBy(building.type);
  if (kind) {
    const out = state.roamers.some((r) => r.homeId === building.id);
    lines.push(`${ROAMER_SPECS[kind].name} ${out ? 'out in the streets' : 'getting ready'}`);
  }
  if (building.type === 'palace') {
    lines.push(`Taxes last month: ${drachmas(state.lastMonth.taxes)}`, `Wages last month: ${drachmas(state.lastMonth.wages)}`);
  }
  return { title: spec.name, lines };
}

function describeSettler(state: GameState, settler: Settler): Description {
  const destination = buildingById(state, settler.destinationId);
  const heading = destination
    ? `Heading to ${houseName(destination)} at ${destination.x}, ${destination.y}`
    : 'Looking for another lot';
  return { title: 'Settler', lines: [`Carrying ${settler.people} people`, heading] };
}

function describeRoamer(state: GameState, roamer: Roamer): Description {
  const home = buildingById(state, roamer.homeId);
  if (!home) throw new Error(`Roamer ${roamer.id} comes from missing building ${roamer.homeId}`);
  const spec = ROAMER_SPECS[roamer.kind];
  return {
    title: spec.name,
    lines: [
      `From the ${BUILDING_SPECS[home.type].name} at ${home.x}, ${home.y}`,
      roamer.returning ? 'Returning home' : `Walked ${roamer.step} of ${spec.range} tiles`,
    ],
  };
}

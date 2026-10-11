import { adjacentRoadTiles } from './commands';
import { HOUSE_LEVELS, NEXT_LEVEL, houseCapacity, houseLevel, houseName } from './housing';
import { canSettlersReach, settlerTile } from './settlers';
import { NO_BUILDING, buildingById, tileIndex, type Building, type GameState, type Settler } from './state';
import { BUILDABLE, TERRAIN_NAMES } from './terrain';

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
    return describeHouse(state, building);
  }

  const settler = state.settlers.find((s) => {
    const tile = settlerTile(s);
    return tile.x === x && tile.y === y;
  });
  if (settler) return describeSettler(state, settler);

  if (state.roads[i]) return { title: 'Road', lines: [`Tile ${x}, ${y}`] };

  const terrain = state.terrain[i];
  return {
    title: TERRAIN_NAMES[terrain],
    lines: [`Tile ${x}, ${y}`, BUILDABLE.has(terrain) ? 'Buildable' : 'Not buildable'],
  };
}

function describeHouse(state: GameState, house: Building): Description {
  const lines = [`Tile ${house.x}, ${house.y}`, `Residents ${house.residents}/${houseCapacity(house)}`];
  const level = houseLevel(house);
  if (level) {
    const next = NEXT_LEVEL[level];
    if (next) lines.push(`Needs for ${HOUSE_LEVELS[next].name}: ${HOUSE_LEVELS[next].needs.join(', ')}`);
  } else {
    lines.push(settlementStatus(state, house));
  }
  return { title: houseName(house), lines };
}

function settlementStatus(state: GameState, lot: Building): string {
  if (adjacentRoadTiles(state, lot).length === 0) return 'No road access: settlers cannot reach it';
  if (!canSettlersReach(state, lot)) return 'Its road does not connect to the entry';
  if (state.settlers.some((s) => s.destinationId === lot.id)) return 'Settlers on the way';
  return 'Waiting for settlers';
}

function describeSettler(state: GameState, settler: Settler): Description {
  const destination = buildingById(state, settler.destinationId);
  if (!destination) throw new Error(`Settler ${settler.id} heads for missing building ${settler.destinationId}`);
  return {
    title: 'Settler',
    lines: [
      `Carrying ${settler.people} people`,
      `Heading to ${houseName(destination)} at ${destination.x}, ${destination.y}`,
    ],
  };
}

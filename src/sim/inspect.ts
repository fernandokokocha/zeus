import { BUILDING_SPECS } from './buildings';
import { hasRoadAccess } from './commands';
import { NO_BUILDING, tileIndex, type GameState } from './state';
import { BUILDABLE, TERRAIN_NAMES } from './terrain';

export interface Description {
  title: string;
  lines: string[];
}

export function describeTile(state: GameState, x: number, y: number): Description {
  const i = tileIndex(state, x, y);
  const buildingId = state.buildingIdAt[i];

  if (buildingId !== NO_BUILDING) {
    const building = state.buildings.find((b) => b.id === buildingId);
    if (!building) throw new Error(`Tile ${x}, ${y} points at missing building ${buildingId}`);
    const spec = BUILDING_SPECS[building.type];
    return {
      title: spec.name,
      lines: [
        `Tile ${building.x}, ${building.y}`,
        `Size ${spec.width}×${spec.height}`,
        hasRoadAccess(state, building.type, building.x, building.y)
          ? 'Has road access'
          : 'No road access: it will not work',
      ],
    };
  }

  if (state.roads[i]) return { title: 'Road', lines: [`Tile ${x}, ${y}`] };

  const terrain = state.terrain[i];
  return {
    title: TERRAIN_NAMES[terrain],
    lines: [`Tile ${x}, ${y}`, BUILDABLE.has(terrain) ? 'Buildable' : 'Not buildable'],
  };
}

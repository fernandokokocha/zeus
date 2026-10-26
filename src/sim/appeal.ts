import { BUILDING_SPECS, buildingSize, footprintDistance, type Placement } from './buildings';
import { footprint } from './commands';
import { isUnderConstruction } from './sanctuaries';
import { tileIndex, type GameState } from './state';

export function appealMap(state: GameState): number[] {
  const map = new Array<number>(state.size * state.size).fill(0);
  for (const building of state.buildings) {
    if (isUnderConstruction(building)) continue;
    const { appeal } = BUILDING_SPECS[building.type];
    const { width, height } = buildingSize(building.type, building.rotation);
    const reach = appeal.length;
    for (let y = Math.max(0, building.y - reach); y <= Math.min(state.size - 1, building.y + height - 1 + reach); y++) {
      for (let x = Math.max(0, building.x - reach); x <= Math.min(state.size - 1, building.x + width - 1 + reach); x++) {
        const ring = Math.max(footprintDistance(building, { x, y }), 1);
        if (ring <= reach) map[tileIndex(state, x, y)] += appeal[ring - 1];
      }
    }
  }
  return map;
}

export function houseAppeal(state: GameState, house: Placement, map = appealMap(state)): number {
  const tiles = footprint(house);
  const total = tiles.reduce((sum, p) => sum + map[tileIndex(state, p.x, p.y)], 0);
  return Math.floor(total / tiles.length);
}

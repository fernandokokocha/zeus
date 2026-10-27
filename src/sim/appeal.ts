import { BUILDING_SPECS, buildingSize, type Placement } from './buildings';
import { footprint } from './commands';
import { ROAD_UPGRADE_SPECS } from './road-upgrades';
import { isUnderConstruction } from './sanctuaries';
import { tileIndex, type GameState } from './state';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function addRingAppeal(state: GameState, map: number[], rect: Rect, appeal: number[]): void {
  const reach = appeal.length;
  for (let y = Math.max(0, rect.y - reach); y <= Math.min(state.size - 1, rect.y + rect.height - 1 + reach); y++) {
    for (let x = Math.max(0, rect.x - reach); x <= Math.min(state.size - 1, rect.x + rect.width - 1 + reach); x++) {
      const dx = Math.max(rect.x - x, 0, x - (rect.x + rect.width - 1));
      const dy = Math.max(rect.y - y, 0, y - (rect.y + rect.height - 1));
      const ring = Math.max(dx, dy, 1);
      if (ring <= reach) map[tileIndex(state, x, y)] += appeal[ring - 1];
    }
  }
}

export function appealMap(state: GameState): number[] {
  const map = new Array<number>(state.size * state.size).fill(0);
  for (const building of state.buildings) {
    if (isUnderConstruction(building)) continue;
    const size = buildingSize(building.type, building.rotation);
    addRingAppeal(state, map, { x: building.x, y: building.y, ...size }, BUILDING_SPECS[building.type].appeal);
  }
  state.roadUpgrades.forEach((upgrade, i) => {
    if (upgrade) addRingAppeal(state, map, { x: i % state.size, y: Math.floor(i / state.size), width: 1, height: 1 }, ROAD_UPGRADE_SPECS[upgrade].appeal);
  });
  return map;
}

export function houseAppeal(state: GameState, house: Placement, map = appealMap(state)): number {
  const tiles = footprint(house);
  const total = tiles.reduce((sum, p) => sum + map[tileIndex(state, p.x, p.y)], 0);
  return Math.floor(total / tiles.length);
}

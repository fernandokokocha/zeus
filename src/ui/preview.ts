import { BUILDING_SPECS, buildingSize, isAgoraVendor, type BuildingType, type Rotation } from '../sim/buildings';
import { checkBuildingPlacement, footprint, vendorSpotAt, lotOrigins, roadObstacle, roadPath, roadblockObstacle } from '../sim/commands';
import { rectBetween, tilesIn, type Point } from '../sim/point';
import { clampToMap, inBounds, type GameState } from '../sim/state';
import type { Tool } from './tools';

export type PreviewKind = 'valid' | 'warning' | 'invalid';

export interface PreviewTile extends Point {
  kind: PreviewKind;
}

export function buildingOrigin(type: BuildingType, cursor: Point, rotation: Rotation): Point {
  const { width, height } = buildingSize(type, rotation);
  return { x: cursor.x - Math.floor((width - 1) / 2), y: cursor.y - Math.floor((height - 1) / 2) };
}

export function placementOrigin(state: GameState, type: BuildingType, cursor: Point, rotation: Rotation): Point {
  return (isAgoraVendor(type) && vendorSpotAt(state, cursor)) || buildingOrigin(type, cursor, rotation);
}

function buildingPreview(state: GameState, type: BuildingType, origin: Point, rotation: Rotation): PreviewTile[] {
  const check = checkBuildingPlacement(state, type, origin.x, origin.y, rotation);
  const lacksRoad = BUILDING_SPECS[type].needsRoad && !check.roadAccess;
  const kind: PreviewKind = check.obstacle ? 'invalid' : lacksRoad ? 'warning' : 'valid';
  return footprint({ type, ...origin, rotation })
    .filter((p) => inBounds(state, p.x, p.y))
    .map((p) => ({ ...p, kind }));
}

export function previewTiles(
  state: GameState,
  tool: Tool | null,
  dragStart: Point | null,
  hover: Point | null,
  rotation: Rotation = 0,
): PreviewTile[] {
  if (!tool || !hover) return [];
  const start = dragStart ?? hover;

  switch (tool) {
    case 'road':
      return roadPath(start, hover)
        .filter((p) => inBounds(state, p.x, p.y))
        .map((p) => ({ ...p, kind: roadObstacle(state, p.x, p.y) ? 'invalid' : 'valid' }));
    case 'roadblock':
      return [{ ...hover, kind: roadblockObstacle(state, hover) ? 'invalid' : 'valid' }];
    case 'demolish':
      return tilesIn(rectBetween(clampToMap(state, start), clampToMap(state, hover))).map((p) => ({
        ...p,
        kind: 'invalid',
      }));
    case 'house':
      return lotOrigins(start, hover).flatMap((lot) => buildingPreview(state, tool, lot, rotation));
    default:
      return buildingPreview(state, tool, placementOrigin(state, tool, hover, rotation), rotation);
  }
}

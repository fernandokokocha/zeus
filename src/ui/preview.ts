import { BUILDING_SPECS, type BuildingType } from '../sim/buildings';
import { checkBuildingPlacement, footprint, lotOrigins, roadObstacle, roadPath } from '../sim/commands';
import { rectBetween, tilesIn, type Point } from '../sim/point';
import { clampToMap, inBounds, type GameState } from '../sim/state';
import type { Tool } from './tools';

export type PreviewKind = 'valid' | 'warning' | 'invalid';

export interface PreviewTile extends Point {
  kind: PreviewKind;
}

export function buildingOrigin(type: BuildingType, cursor: Point): Point {
  const { width, height } = BUILDING_SPECS[type];
  return { x: cursor.x - Math.floor((width - 1) / 2), y: cursor.y - Math.floor((height - 1) / 2) };
}

function buildingPreview(state: GameState, type: BuildingType, origin: Point): PreviewTile[] {
  const check = checkBuildingPlacement(state, type, origin.x, origin.y);
  const kind: PreviewKind = check.obstacle ? 'invalid' : check.roadAccess ? 'valid' : 'warning';
  return footprint(type, origin.x, origin.y)
    .filter((p) => inBounds(state, p.x, p.y))
    .map((p) => ({ ...p, kind }));
}

export function previewTiles(
  state: GameState,
  tool: Tool | null,
  dragStart: Point | null,
  hover: Point | null,
): PreviewTile[] {
  if (!tool || !hover) return [];
  const start = dragStart ?? hover;

  switch (tool) {
    case 'road':
      return roadPath(start, hover)
        .filter((p) => inBounds(state, p.x, p.y))
        .map((p) => ({ ...p, kind: roadObstacle(state, p.x, p.y) ? 'invalid' : 'valid' }));
    case 'demolish':
      return tilesIn(rectBetween(clampToMap(state, start), clampToMap(state, hover))).map((p) => ({
        ...p,
        kind: 'invalid',
      }));
    case 'house':
      return lotOrigins(start, hover).flatMap((lot) => buildingPreview(state, tool, lot));
    case 'fountain':
    case 'taxOffice':
    case 'palace':
      return buildingPreview(state, tool, buildingOrigin(tool, hover));
  }
}

import { checkBuildingPlacement, footprint, roadObstacle, roadPath } from '../sim/commands';
import { rectBetween, tilesIn, type Point } from '../sim/point';
import { clampToMap, inBounds, type GameState } from '../sim/state';
import type { Tool } from './tools';

export type PreviewKind = 'valid' | 'warning' | 'invalid';

export interface PreviewTile extends Point {
  kind: PreviewKind;
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
    case 'testBuilding': {
      const check = checkBuildingPlacement(state, tool, hover.x, hover.y);
      const kind: PreviewKind = check.obstacle ? 'invalid' : check.roadAccess ? 'valid' : 'warning';
      return footprint(tool, hover.x, hover.y)
        .filter((p) => inBounds(state, p.x, p.y))
        .map((p) => ({ ...p, kind }));
    }
  }
}

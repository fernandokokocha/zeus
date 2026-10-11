import type { View } from '../render/view';
import { demolish, placeBuilding, placeHouses, placeRoad, placeRoadblock, type Result } from '../sim/commands';
import { describeTile, type Description } from '../sim/inspect';
import type { Point } from '../sim/point';
import { clampToMap, inBounds, type GameState } from '../sim/state';
import { tileUnderPointer } from '../render/picking';
import { buildingOrigin, previewTiles, type PreviewTile } from './preview';
import type { Tool } from './tools';

const LEFT_BUTTON = 0;
const RIGHT_BUTTON = 2;

export interface ToolInputDeps {
  view: View;
  state: GameState;
  toolbar: { current(): Tool | null; clear(): void };
  ghost: { show(tiles: PreviewTile[]): void };
  inspector: { open(d: Description): void; close(): void; isOpen(): boolean };
  topbar: { showStatus(text: string): void };
}

export function attachToolInput({ view, state, toolbar, ghost, inspector, topbar }: ToolInputDeps): {
  refreshGhost(): void;
} {
  let dragStart: Point | null = null;
  let hover: Point | null = null;

  function refreshGhost(): void {
    ghost.show(previewTiles(state, toolbar.current(), dragStart, hover));
  }

  function apply(tool: Tool, from: Point, to: Point): void {
    const result = applyTool(tool, from, to);
    if (!result.ok) topbar.showStatus(result.reason);
  }
  
  function applyTool(tool: Tool, from: Point, to: Point): Result {
    switch (tool) {
      case 'road':
        return placeRoad(state, from, to);
    case 'roadblock':
      return placeRoadblock(state, to);
      case 'house':
        return placeHouses(state, from, to);
      case 'demolish':
        demolish(state, from, to);
        return { ok: true };
      case 'fountain':
      case 'taxOffice':
      case 'palace': {
        const origin = buildingOrigin(tool, to);
        return placeBuilding(state, tool, origin.x, origin.y);
      }
    }
  }

  view.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  view.canvas.addEventListener('mousedown', (e) => {
    const tile = tileUnderPointer(view, e.clientX, e.clientY);
    if (e.button === RIGHT_BUTTON) {
      if (inBounds(state, tile.x, tile.y)) inspector.open(describeTile(state, tile.x, tile.y));
      return;
    }
    if (e.button === LEFT_BUTTON && toolbar.current()) {
      dragStart = clampToMap(state, tile);
      refreshGhost();
    }
  });

  window.addEventListener('mousemove', (e) => {
    hover = clampToMap(state, tileUnderPointer(view, e.clientX, e.clientY));
    refreshGhost();
  });

  window.addEventListener('mouseup', (e) => {
    const tool = toolbar.current();
    if (e.button !== LEFT_BUTTON || !dragStart || !tool || !hover) return;
    apply(tool, dragStart, hover);
    dragStart = null;
    refreshGhost();
  });

  window.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (inspector.isOpen()) inspector.close();
    else toolbar.clear();
    dragStart = null;
    refreshGhost();
  });

  return { refreshGhost };
}

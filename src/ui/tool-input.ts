import type { View } from '../render/view';
import type { Rotation } from '../sim/buildings';
import { demolish, placeBuilding, placeHouses, placeOliveTrees, placeRoad, placeRoadblock, placeSheep, type Result } from '../sim/commands';
import { UNITS_PER_LOAD } from '../sim/food';
import { inspectTile } from '../sim/inspect';
import { ROAD_UPGRADE_SPECS, upgradePlan, upgradeRoads } from '../sim/road-upgrades';
import { storedMarble } from '../sim/sanctuaries';
import type { Point } from '../sim/point';
import { clampToMap, inBounds, type GameState } from '../sim/state';
import { tileUnderPointer } from '../render/picking';
import { placementOrigin, previewTiles, type PreviewTile } from './preview';
import type { Inspector } from './inspector';
import { UPGRADE_TOOLS, isUpgradeTool, type Tool, type UpgradeTool } from './tools';

const LEFT_BUTTON = 0;
const RIGHT_BUTTON = 2;
const QUARTER_TURNS = 4;

export interface ToolInputDeps {
  view: View;
  state: GameState;
  toolbar: { current(): Tool | null; clear(): void };
  ghost: { show(tiles: PreviewTile[]): void };
  inspector: Inspector;
  topbar: { showStatus(text: string): void };
}

export function attachToolInput({ view, state, toolbar, ghost, inspector, topbar }: ToolInputDeps): {
  toolChanged(): void;
} {
  let dragStart: Point | null = null;
  let hover: Point | null = null;
  let rotation: Rotation = 0;

  function refreshGhost(): void {
    const tool = toolbar.current();
    ghost.show(previewTiles(state, tool, dragStart, hover, rotation));
    if (hover && tool && isUpgradeTool(tool)) topbar.showStatus(upgradeCost(tool, dragStart ?? hover, hover));
  }

  function upgradeCost(tool: UpgradeTool, from: Point, to: Point): string {
    const kind = UPGRADE_TOOLS[tool];
    const { name, marbleLoads } = ROAD_UPGRADE_SPECS[kind];
    const tiles = upgradePlan(state, kind, from, to).taken.length;
    const stored = Math.floor(storedMarble(state) / UNITS_PER_LOAD);
    return `${name}: ${tiles} ${tiles === 1 ? 'tile' : 'tiles'}, ${tiles * marbleLoads} marble (${stored} in storehouses)`;
  }

  function applyTool(tool: Tool, from: Point, to: Point): Result {
    switch (tool) {
      case 'road':
        return placeRoad(state, from, to);
      case 'ornateRoad':
      case 'fastRoad':
        return upgradeRoads(state, UPGRADE_TOOLS[tool], from, to);
      case 'roadblock':
        return placeRoadblock(state, to);
      case 'sheep':
        return placeSheep(state, to);
      case 'house':
        return placeHouses(state, from, to, rotation);
      case 'oliveTree':
        return placeOliveTrees(state, from, to);
      case 'demolish':
        return demolish(state, from, to);
      default: {
        const origin = placementOrigin(state, tool, to, rotation);
        return placeBuilding(state, tool, origin.x, origin.y, rotation);
      }
    }
  }

  view.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  view.canvas.addEventListener('mousedown', (e) => {
    const tile = tileUnderPointer(view, e.clientX, e.clientY);
    if (e.button === RIGHT_BUTTON) {
      if (inBounds(state, tile.x, tile.y)) inspector.open(inspectTile(state, tile.x, tile.y));
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
    const result = applyTool(tool, dragStart, hover);
    dragStart = null;
    refreshGhost();
    if (!result.ok) topbar.showStatus(result.reason);
  });

  window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() !== 'r' || e.repeat) return;
    rotation = ((rotation + QUARTER_TURNS - 1) % QUARTER_TURNS) as Rotation;
    topbar.showStatus(`Rotated ${((QUARTER_TURNS - rotation) % QUARTER_TURNS) * 90}° counterclockwise`);
    refreshGhost();
  });

  window.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (inspector.isOpen()) inspector.close();
    else toolbar.clear();
    dragStart = null;
    refreshGhost();
  });

  function toolChanged(): void {
    rotation = 0;
    refreshGhost();
  }

  return { toolChanged };
}

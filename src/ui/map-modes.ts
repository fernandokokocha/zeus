import type { View } from '../render/view';
import { TINT_SCALES, overlayColor } from '../render/overlay-layer';
import { tileUnderPointer } from '../render/picking';
import { OVERLAYS, isColumnOverlay, overlayReport, type Overlay, type Report } from '../sim/overlays';
import type { Point } from '../sim/point';
import { NO_BUILDING, buildingById, inBounds, tileIndex, type GameState } from '../sim/state';
import { byId } from './dom';

export const OVERLAY_NAMES: Record<Overlay, string> = {
  water: 'Water',
  food: 'Food',
  supply: 'Supply',
  culture: 'Culture',
  appeal: 'Appeal',
  risk: 'Risk',
  tax: 'Tax',
  staffing: 'Staff',
  guildSites: 'Guilds',
};

const TOOLTIP_OFFSET = 16;

export function createMapModes(state: GameState, view: View): { shown(): Overlay | null; update(): void } {
  const button = byId('map-button');
  const menu = byId('map-menu');
  const ramp = byId('map-ramp');
  const tooltip = byId('map-tooltip');
  let shown: Overlay | null = null;
  let lastShown: Overlay = 'appeal';
  let pointer: { client: Point; tile: Point } | null = null;

  const choices = [null, ...OVERLAYS].map((overlay) => {
    const choice = document.createElement('button');
    choice.textContent = overlay ? OVERLAY_NAMES[overlay] : 'Off';
    choice.addEventListener('click', () => {
      show(overlay);
      menu.hidden = true;
    });
    menu.append(choice);
    return { choice, overlay };
  });

  function show(overlay: Overlay | null): void {
    shown = overlay;
    if (overlay) lastShown = overlay;
    button.textContent = `Map: ${overlay ? OVERLAY_NAMES[overlay] : 'Off'} ▾`;
    for (const { choice, overlay: own } of choices) choice.classList.toggle('active', own === overlay);
    showRamp(overlay);
    updateTooltip();
  }

  function showRamp(overlay: Overlay | null): void {
    ramp.replaceChildren();
    ramp.hidden = overlay === null || isColumnOverlay(overlay);
    if (overlay === null || isColumnOverlay(overlay)) return;
    for (const stop of TINT_SCALES[overlay].stops) {
      const swatch = document.createElement('span');
      swatch.className = 'ramp-swatch';
      swatch.style.background = overlayColor(overlay, stop.at).getStyle();
      const label = document.createElement('span');
      label.textContent = stop.label;
      ramp.append(swatch, label);
    }
  }

  function updateTooltip(): void {
    const report = shown && pointer && reportAt(shown, pointer.tile);
    tooltip.hidden = !report;
    if (!report || !pointer) return;
    const name = document.createElement('strong');
    name.textContent = report.name;
    const lines = report.details.map((detail) => {
      const line = document.createElement('div');
      line.textContent = detail;
      return line;
    });
    tooltip.replaceChildren(name, ...lines);
    tooltip.style.left = `${pointer.client.x + TOOLTIP_OFFSET}px`;
    tooltip.style.top = `${pointer.client.y + TOOLTIP_OFFSET}px`;
  }

  function reportAt(overlay: Overlay, tile: Point): Report | null {
    if (!inBounds(state, tile.x, tile.y)) return null;
    const id = state.buildingIdAt[tileIndex(state, tile.x, tile.y)];
    if (id === NO_BUILDING) return null;
    const building = buildingById(state, id);
    if (!building) throw new Error(`Tile ${tile.x}, ${tile.y} names building ${id}, which does not exist`);
    return overlayReport(state, overlay, building);
  }

  button.addEventListener('click', () => (menu.hidden = !menu.hidden));
  view.canvas.addEventListener('mousemove', (e) => {
    pointer = { client: { x: e.clientX, y: e.clientY }, tile: tileUnderPointer(view, e.clientX, e.clientY) };
    updateTooltip();
  });
  view.canvas.addEventListener('mouseleave', () => {
    pointer = null;
    updateTooltip();
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') menu.hidden = true;
    if (e.key.toLowerCase() === 'o' && !e.repeat) show(shown ? null : lastShown);
  });
  show(null);
  return { shown: () => shown, update: updateTooltip };
}

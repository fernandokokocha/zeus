import type { View } from '../render/view';
import { overlayColor } from '../render/overlay-layer';
import { tileUnderPointer } from '../render/picking';
import { GUILD_SITE_READINGS, OVERLAYS, overlayReportAt, type Overlay } from '../sim/overlays';
import type { Point } from '../sim/point';
import type { GameState } from '../sim/state';
import { byId } from './dom';

export const OVERLAY_NAMES: Record<Overlay, string> = {
  water: 'Water',
  supplies: 'Supplies',
  culture: 'Culture',
  appeal: 'Appeal',
  risk: 'Risk',
  tax: 'Tax',
  staffing: 'Staff',
  guildSites: 'Guilds',
};

const TOOLTIP_OFFSET = 16;

const GUILD_SITES_KEY = [
  { at: GUILD_SITE_READINGS.inRange, label: 'Along a straight stretch of the Main Road' },
  { at: GUILD_SITE_READINGS.placeable, label: "A Traders' Guild can be placed now" },
];

function mapLabel(overlay: Overlay | null): string {
  return `Map: ${overlay ? OVERLAY_NAMES[overlay] : 'Off'} ▾`;
}

function widestLabel(button: HTMLElement, overlays: (Overlay | null)[]): number {
  return Math.max(
    ...overlays.map((overlay) => {
      button.textContent = mapLabel(overlay);
      return button.getBoundingClientRect().width;
    }),
  );
}

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
    button.textContent = mapLabel(overlay);
    for (const { choice, overlay: own } of choices) choice.classList.toggle('active', own === overlay);
    showRamp(overlay);
    updateTooltip();
  }

  function showRamp(overlay: Overlay | null): void {
    ramp.replaceChildren();
    ramp.hidden = overlay !== 'guildSites';
    if (ramp.hidden) return;
    for (const { at, label: text } of GUILD_SITES_KEY) {
      const swatch = document.createElement('span');
      swatch.className = 'ramp-swatch';
      swatch.style.background = overlayColor('guildSites', at).getStyle();
      const label = document.createElement('span');
      label.textContent = text;
      ramp.append(swatch, label);
    }
  }

  function updateTooltip(): void {
    const report = shown && pointer && overlayReportAt(state, shown, pointer.tile);
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
  button.style.width = `${widestLabel(button, choices.map(({ overlay }) => overlay))}px`;
  show(null);
  return { shown: () => shown, update: updateTooltip };
}

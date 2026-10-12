import { OVERLAY_SCALES, overlayColor } from '../render/overlay-layer';
import type { Overlay } from '../sim/overlays';
import { byId } from './dom';

const OVERLAYS = Object.keys(OVERLAY_SCALES) as Overlay[];

export function createMapModes(): { shown(): Overlay | null } {
  const bar = byId('map-modes');
  const legend = byId('overlay-legend');
  let shown: Overlay | null = null;
  let lastShown: Overlay = 'appeal';

  const buttons = OVERLAYS.map((overlay) => {
    const button = document.createElement('button');
    button.textContent = OVERLAY_SCALES[overlay].name;
    button.title = OVERLAY_SCALES[overlay].title;
    button.addEventListener('click', () => show(shown === overlay ? null : overlay));
    bar.append(button);
    return { button, overlay };
  });

  function show(overlay: Overlay | null): void {
    shown = overlay;
    if (overlay) lastShown = overlay;
    for (const { button, overlay: own } of buttons) button.classList.toggle('active', own === overlay);
    legend.hidden = !overlay;
    legend.replaceChildren();
    if (!overlay) return;
    const title = document.createElement('strong');
    title.textContent = OVERLAY_SCALES[overlay].title;
    legend.append(title);
    for (const stop of OVERLAY_SCALES[overlay].stops) {
      const row = document.createElement('div');
      row.className = 'legend-row';
      const swatch = document.createElement('span');
      swatch.className = 'legend-swatch';
      swatch.style.background = overlayColor(overlay, stop.at).getStyle();
      row.append(swatch, stop.label);
      legend.append(row);
    }
  }

  window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'o' && !e.repeat) show(shown ? null : lastShown);
  });
  return { shown: () => shown };
}

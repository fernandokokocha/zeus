import { APPEAL_SCALE, appealColor } from '../render/appeal-layer';
import { byId } from './dom';

export function createAppealToggle(): { visible(): boolean } {
  const button = byId('appeal-toggle');
  const legend = byId('appeal-legend');
  byId('appeal-legend-bar').style.background = `linear-gradient(to right, ${[-APPEAL_SCALE, 0, APPEAL_SCALE]
    .map((appeal) => appealColor(appeal).getStyle())
    .join(', ')})`;
  byId('appeal-legend-low').textContent = `${-APPEAL_SCALE}`;
  byId('appeal-legend-high').textContent = `+${APPEAL_SCALE}`;
  let shown = false;

  function toggle(): void {
    shown = !shown;
    button.classList.toggle('active', shown);
    legend.hidden = !shown;
  }

  button.addEventListener('click', toggle);
  window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'o' && !e.repeat) toggle();
  });
  return { visible: () => shown };
}

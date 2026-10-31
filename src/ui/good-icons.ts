import type { StoredGood } from '../sim/storehouse';

const INK = '#3b2a1a';
const icon = (body: string) => `<svg viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`;

const LOG_RADIUS = 3.6;
const LOG_DEPTH = { x: 6, y: -3 };
const LOG_SIDE = { x: 0.447, y: 0.894 };

function log(cx: number, cy: number): string {
  const sx = LOG_RADIUS * LOG_SIDE.x;
  const sy = LOG_RADIUS * LOG_SIDE.y;
  const bark =
    `<path d="M${cx + sx} ${cy + sy}l${LOG_DEPTH.x} ${LOG_DEPTH.y}A${LOG_RADIUS} ${LOG_RADIUS} 0 0 0 ${cx - sx + LOG_DEPTH.x} ${cy - sy + LOG_DEPTH.y}` +
    `L${cx - sx} ${cy - sy}z" fill="#7a4a26" stroke="${INK}" stroke-width="1.1" stroke-linejoin="round"/>`;
  const end = `<circle cx="${cx}" cy="${cy}" r="${LOG_RADIUS}" fill="#d8ae78" stroke="${INK}" stroke-width="1.1"/>`;
  const rings = `<circle cx="${cx}" cy="${cy}" r="${LOG_RADIUS * 0.5}" fill="none" stroke="#a87a48" stroke-width=".8"/>`;
  return bark + end + rings;
}

export const GOOD_ICONS: Record<StoredGood, string> = {
  fleece: icon(
    `<g fill="#f6f1e2" stroke="${INK}" stroke-width="1.2"><circle cx="8" cy="14" r="4.6"/><circle cx="16.5" cy="14.5" r="4.4"/>` +
      '<circle cx="12" cy="9.5" r="4.8"/><circle cx="12" cy="16.5" r="4.2"/></g>',
  ),
  olives: icon(
    `<path d="M12 9C13 5 16 3 20 3c-1 4-4 6-8 6z" fill="#8fa35a" stroke="${INK}" stroke-width="1"/>` +
      `<ellipse cx="8.5" cy="15" rx="4.2" ry="5.2" fill="#55622a" stroke="${INK}" stroke-width="1.2"/>` +
      `<ellipse cx="15.5" cy="14.5" rx="4.2" ry="5.2" fill="#7a8a3a" stroke="${INK}" stroke-width="1.2"/>` +
      '<ellipse cx="14.2" cy="12.6" rx="1.2" ry="1.6" fill="#b8c47a"/>',
  ),
  oil: icon(
    `<path d="M8 9.5C5.5 9.5 5 6.5 7.5 6M16 9.5c2.5 0 3-3 .5-3.5" fill="none" stroke="${INK}" stroke-width="1.3"/>` +
      '<path d="M9.5 3h5v2.5l-.7 1c3 1.2 4.7 4 4.7 7.2 0 3.6-2.6 6.3-6.5 7.8-3.9-1.5-6.5-4.2-6.5-7.8 0-3.2 1.7-6 4.7-7.2l-.7-1z" ' +
      `fill="#d1a446" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"/>` +
      `<path d="M7.6 12.5h8.8" stroke="${INK}" stroke-width="1.1"/>`,
  ),
  wood: icon(log(8.6, 12.3) + log(12.2, 18.5) + log(5, 18.5)),
  marble: icon(
    `<g stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"><path d="M3 9 8 5h13l-5 4z" fill="#ffffff"/>` +
      '<path d="M3 9h13v11H3z" fill="#e6e4dc"/><path d="M16 9l5-4v11l-5 4z" fill="#c4c1b6"/></g>' +
      '<path d="M5 12c3 1 5 3 9 3M6 17c2-1 4 0 6-1" fill="none" stroke="#9e9a8c" stroke-width=".8"/>',
  ),
  bronze: icon(
    `<g stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"><path d="M2.5 18 5.5 10h13l3 8z" fill="#a8692f"/>` +
      '<path d="M5.5 10h13l-1.6 3.6H7.1z" fill="#d49856"/></g>' +
      '<path d="M8 12h4" stroke="#f1c78f" stroke-width="1" stroke-linecap="round"/>',
  ),
  sculptures: icon(
    `<g stroke="${INK}" stroke-width="1.2" stroke-linejoin="round" fill="#efebe0"><circle cx="12" cy="6.5" r="3.4"/>` +
      '<path d="M6 17.5c0-4 2.7-6.5 6-6.5s6 2.5 6 6.5z"/><path d="M4.5 17.5h15V21h-15z" fill="#c0643b"/></g>',
  ),
  cloth: icon(
    `<g stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"><path d="M3 8h15v11H3z" fill="#2f6ea5"/>` +
      '<ellipse cx="18" cy="13.5" rx="3" ry="5.5" fill="#4a8ac2"/></g>' +
      '<path d="M3 11.5h15M3 15.5h15" stroke="#f6f3ec" stroke-width="1.1"/>',
  ),
  papyrus: icon(
    `<g stroke="${INK}" stroke-width="1.1"><path d="M4 7l16 3v4L4 11z" fill="#c9b06a"/><path d="M4 13l16 3v4L4 17z" fill="#b9a05a"/></g>` +
      '<path d="M9 8v4M15 9v4M9 14v4M15 15v4" stroke="#6f5a2e" stroke-width="1.4"/>',
  ),
  scrolls: icon(
    `<g stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"><path d="M6 5h12v14H6z" fill="#eadfbf"/>` +
      '<rect x="3.5" y="3.5" width="17" height="3" rx="1.5" fill="#5a3a22"/><rect x="3.5" y="17.5" width="17" height="3" rx="1.5" fill="#5a3a22"/></g>' +
      '<path d="M8.5 9.5h7M8.5 12h7M8.5 14.5h5" stroke="#8a7a5a" stroke-width="1"/>',
  ),
  armor: icon(
    `<g stroke="${INK}" stroke-width="1.2"><circle cx="12" cy="12" r="8.5" fill="#b07a3a"/><circle cx="12" cy="12" r="6.3" fill="#a8322a"/></g>` +
      '<circle cx="12" cy="12" r="1.8" fill="#d49856"/>',
  ),
};

const WHEAT_STALKS = [-24, -12, 0, 12, 24];

function wheatStalk(turn: number): string {
  const grains = [5, 7.5, 10].map((y) => `<ellipse cx="10.6" cy="${y}" rx="1.4" ry="2"/><ellipse cx="13.4" cy="${y}" rx="1.4" ry="2"/>`).join('');
  return (
    `<g transform="rotate(${turn} 12 15)"><path d="M12 21V4" stroke="#b8902e" stroke-width="1.2"/>` +
    `<g fill="#e2b84c" stroke="${INK}" stroke-width=".7">${grains}<ellipse cx="12" cy="3.4" rx="1.3" ry="1.9"/></g></g>`
  );
}

export const FARM_ICONS = {
  wheatFarm: icon(WHEAT_STALKS.map(wheatStalk).join('') + `<path d="M8.6 15.5h6.8" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>`),
  carrotFarm: icon(
    `<path d="M12 8C9 5 8.5 3 9 1.8M12 8c0-3 1-5 2.4-6M12 8c2.4-2 4.6-2.5 6-2" fill="none" stroke="#4f8a2e" stroke-width="1.6" stroke-linecap="round"/>` +
      `<path d="M8.4 8.6c1.8-1.4 5.4-1.4 7.2 0L12.6 21.6c-.3.7-.9.7-1.2 0z" fill="#e07a24" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"/>` +
      `<path d="M10.2 12h2M11 15.5h2.2M11.4 18.5h1.4" stroke="#a8501a" stroke-width=".9" stroke-linecap="round"/>`,
  ),
};

export const GOOD_COLORS: Record<StoredGood, string> = {
  fleece: '#efe7cf',
  olives: '#6f7f34',
  oil: '#d1a446',
  wood: '#8a5a32',
  marble: '#d9d7cf',
  bronze: '#a8692f',
  sculptures: '#e7e0cf',
  cloth: '#2f6ea5',
  papyrus: '#b9a05a',
  scrolls: '#eadfbf',
  armor: '#b07a3a',
};

import type { GroupName, QuickTool } from './tools';

const INK = '#3b2a1a';
const svg = (body: string) => `<svg viewBox="0 0 32 32" width="34" height="34" aria-hidden="true">${body}</svg>`;

export const TOOL_ICONS: Record<QuickTool, string> = {
  road: svg(
    `<path d="M16 6 30 16 16 26 2 16z" fill="#b9a88a" stroke="${INK}" stroke-width="1.2"/>` +
      '<path d="M9 11 23 21" stroke="#f3ead8" stroke-width="1.6" stroke-dasharray="3 2.5"/>',
  ),
  prettyRoad: svg(
    '<path d="M16 6 30 16 16 26 2 16z" fill="#2f6fa8"/>' +
      `<path d="M16 8.6 26.4 16 16 23.4 5.6 16z" fill="#f8f6f0" stroke="${INK}" stroke-width=".6"/>` +
      '<path d="M11 12.4 21 19.6M21 12.4 11 19.6" stroke="#c9d3dc" stroke-width=".9"/>' +
      `<path d="M16 6 30 16 16 26 2 16z" fill="none" stroke="${INK}" stroke-width="1.2"/>`,
  ),
  fastRoad: svg(
    `<path d="M16 6 30 16 16 26 2 16z" fill="#8d8a85" stroke="${INK}" stroke-width="1.2"/>` +
      '<path d="M7.5 13.5 19.5 22.5M12.5 9.5 24.5 18.5" stroke="#4f4b46" stroke-width="1.8" stroke-linecap="round"/>',
  ),
  roadblock: svg(
    '<path d="M16 14 30 22 16 30 2 22z" fill="#b9a88a"/>' +
      `<rect x="6" y="9" width="4" height="14" fill="#f6f3ec" stroke="${INK}"/>` +
      `<rect x="22" y="9" width="4" height="14" fill="#f6f3ec" stroke="${INK}"/>` +
      '<rect x="5" y="7" width="6" height="3" fill="#c0643b"/><rect x="21" y="7" width="6" height="3" fill="#c0643b"/>' +
      `<rect x="8" y="13" width="16" height="3.5" fill="#6b4a2b" stroke="${INK}" stroke-width=".6"/>`,
  ),
  house: svg(
    `<path d="M4 15 16 5 28 15z" fill="#c0643b" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"/>` +
      `<rect x="7" y="15" width="18" height="12" fill="#f6f3ec" stroke="${INK}" stroke-width="1.2"/>` +
      '<rect x="14" y="19" width="4.5" height="8" fill="#6b4a2b"/>' +
      '<rect x="9.5" y="18" width="3" height="3" fill="#6b4a2b"/><rect x="20" y="18" width="3" height="3" fill="#6b4a2b"/>',
  ),
  demolish: svg(
    `<path d="M8 8 24 24M24 8 8 24" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>` +
      '<path d="M8 8 24 24M24 8 8 24" stroke="#c0392b" stroke-width="4.6" stroke-linecap="round"/>',
  ),
};

export const GROUP_ICONS: Record<GroupName, string> = {
  Husbandry: svg(
    '<path d="M16 29V11M16 29 9.5 14M16 29 22.5 14" stroke="#a07a2c" stroke-width="1.5"/>' +
      `<ellipse cx="16" cy="8" rx="2.8" ry="5.2" fill="#e8bf4f" stroke="${INK}"/>` +
      `<ellipse cx="9" cy="11" rx="2.6" ry="4.8" fill="#e8bf4f" stroke="${INK}" transform="rotate(-24 9 11)"/>` +
      `<ellipse cx="23" cy="11" rx="2.6" ry="4.8" fill="#e8bf4f" stroke="${INK}" transform="rotate(24 23 11)"/>` +
      `<rect x="12.5" y="21" width="7" height="2.6" fill="#c0643b" stroke="${INK}" stroke-width=".8"/>`,
  ),
  Industry: svg(
    '<path d="M10 8 8 4.5M15 7V3.5M20 8l2-3.5" stroke="#e8a93a" stroke-width="1.7" stroke-linecap="round"/>' +
      `<path d="M5 11h17c0 3 3 4 6 4v2h-8l-2 3v3h4v3H10v-3h4v-3l-3-4H8c-2 0-3-2-3-5z" fill="#6d7078" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"/>` +
      '<path d="M6.5 12.5h14" stroke="#9a9ea6" stroke-width="1.2"/>',
  ),
  Distribution: svg(
    `<path d="M13 9c-3.5 0-4.5 3.5-2 5.5M19 9c3.5 0 4.5 3.5 2 5.5" fill="none" stroke="${INK}" stroke-width="1.5"/>` +
      `<path d="M13 5h6v3c0 1 4 3 4 9s-3 9-7 10c-4-1-7-4-7-10s4-8 4-9z" fill="#c0643b" stroke="${INK}" stroke-width="1.2"/>` +
      `<rect x="12" y="3.5" width="8" height="2.4" fill="#c0643b" stroke="${INK}" stroke-width="1"/>` +
      `<path d="M9.6 17h12.8" stroke="${INK}" stroke-width="2"/>` +
      `<rect x="13" y="26.5" width="6" height="2.5" fill="#c0643b" stroke="${INK}" stroke-width="1"/>`,
  ),
  'Hygiene & Safety': svg(
    `<path d="M16 3.5c5 7 8.5 11 8.5 15.5a8.5 8.5 0 0 1-17 0C7.5 14.5 11 10.5 16 3.5z" fill="#4a90c2" stroke="${INK}" stroke-width="1.2"/>` +
      '<path d="M11.5 19.5q0 4 3.8 5.2" fill="none" stroke="#e6f2fb" stroke-width="1.8" stroke-linecap="round"/>',
  ),
  Administration: svg(
    `<circle cx="16" cy="16" r="12" fill="#e0b13f" stroke="${INK}" stroke-width="1.2"/>` +
      '<circle cx="16" cy="16" r="9" fill="none" stroke="#a07a2c" stroke-width="1"/>' +
      `<path d="M11 11.5h10M12.5 12.5v8M16 12.5v8M19.5 12.5v8M11 21h10" stroke="${INK}" stroke-width="1.4"/>`,
  ),
  Mythology: svg(
    `<path d="M18.5 2.5 8 18h7l-3 11.5L24.5 13h-7l3.5-10.5z" fill="#f2c94c" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"/>`,
  ),
  Culture: svg(
    `<path d="M6 6h20v9c0 6.5-4.5 12-10 12S6 21.5 6 15z" fill="#f6f3ec" stroke="${INK}" stroke-width="1.2"/>` +
      '<path d="M6 6h20" stroke="#c0643b" stroke-width="2.4"/>' +
      `<ellipse cx="11.5" cy="13.5" rx="2.4" ry="1.6" fill="${INK}"/><ellipse cx="20.5" cy="13.5" rx="2.4" ry="1.6" fill="${INK}"/>` +
      `<path d="M10.5 19q5.5 5 11 0" fill="none" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>`,
  ),
  Aesthetics: svg(
    '<path d="M16 18v11" stroke="#4f8a3a" stroke-width="2"/>' +
      `<path d="M16 25q5-4.5 8.5-2q-3.5 4.5-8.5 2z" fill="#5e9a44" stroke="${INK}" stroke-width=".8"/>` +
      `<g fill="#e48aa0" stroke="${INK}" stroke-width="1"><circle cx="16" cy="7.5" r="4.2"/><circle cx="21" cy="11.2" r="4.2"/>` +
      '<circle cx="19" cy="17" r="4.2"/><circle cx="13" cy="17" r="4.2"/><circle cx="11" cy="11.2" r="4.2"/></g>' +
      `<circle cx="16" cy="12.8" r="2.8" fill="#f2c94c" stroke="${INK}"/>`,
  ),
  Elite: svg(
    `<path d="M3 12 16 4 29 12z" fill="#2f6fb3" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"/>` +
      `<rect x="4" y="12" width="24" height="3" fill="#f6f3ec" stroke="${INK}" stroke-width="1"/>` +
      `<g fill="#f6f3ec" stroke="${INK}" stroke-width="1"><rect x="6" y="15" width="3" height="10"/><rect x="11.5" y="15" width="3" height="10"/>` +
      '<rect x="17.5" y="15" width="3" height="10"/><rect x="23" y="15" width="3" height="10"/></g>' +
      `<rect x="3" y="25" width="26" height="3" fill="#f6f3ec" stroke="${INK}" stroke-width="1"/>` +
      '<circle cx="16" cy="9" r="1.6" fill="#e0b13f"/>',
  ),
};

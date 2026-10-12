import type { QuickTool } from './tools';

const svg = (body: string) => `<svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true">${body}</svg>`;

export const TOOL_ICONS: Record<QuickTool, string> = {
  road: svg(
    '<path d="M16 6 30 16 16 26 2 16z" fill="#b9a88a" stroke="#3b2a1a" stroke-width="1.2"/>' +
      '<path d="M9 11 23 21" stroke="#f3ead8" stroke-width="1.6" stroke-dasharray="3 2.5"/>',
  ),
  roadblock: svg(
    '<path d="M16 14 30 22 16 30 2 22z" fill="#b9a88a"/>' +
      '<rect x="6" y="9" width="4" height="14" fill="#f6f3ec" stroke="#3b2a1a"/>' +
      '<rect x="22" y="9" width="4" height="14" fill="#f6f3ec" stroke="#3b2a1a"/>' +
      '<rect x="5" y="7" width="6" height="3" fill="#c0643b"/><rect x="21" y="7" width="6" height="3" fill="#c0643b"/>' +
      '<rect x="8" y="13" width="16" height="3.5" fill="#6b4a2b" stroke="#3b2a1a" stroke-width=".6"/>',
  ),
};

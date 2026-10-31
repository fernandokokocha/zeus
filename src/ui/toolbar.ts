import { byId } from './dom';
import { GROUP_ICONS, TOOL_ICONS } from './icons';
import type { GameState } from '../sim/state';
import { QUICK_TILE_LABELS, QUICK_TOOLS, TOOL_GROUPS, TOOL_LABELS, type Tool, type ToolGroup, toolEnabled, toolLabel } from './tools';

export function createToolbar(state: GameState, onChange: () => void): { current(): Tool | null; reset(): void; update(): void } {
  const box = byId('toolbar');
  let current: Tool | null = null;
  let openGroup: ToolGroup | null = null;
  let drawnLabels = '';

  const quickRow = document.createElement('div');
  quickRow.className = 'quick-tools';
  const quickButtons = QUICK_TOOLS.map((tool) => {
    const button = tileButton(TOOL_ICONS[tool], QUICK_TILE_LABELS[tool], TOOL_LABELS[tool]);
    button.addEventListener('click', () => select(current === tool ? null : tool));
    quickRow.append(button);
    return { button, tool };
  });

  const groupGrid = document.createElement('div');
  groupGrid.className = 'tool-groups';
  const groupButtons = TOOL_GROUPS.map((group) => {
    const button = tileButton(GROUP_ICONS[group.name], group.tileLabel, group.name);
    button.addEventListener('click', () => {
      openGroup = openGroup === group ? null : group;
      render();
    });
    groupGrid.append(button);
    return { button, group };
  });

  const drawer = document.createElement('div');
  drawer.className = 'tool-drawer';
  box.append(quickRow, groupGrid, drawer);

  function tileButton(icon: string, tileLabel: string, name: string): HTMLButtonElement {
    const button = document.createElement('button');
    button.innerHTML = `${icon}<span>${tileLabel}</span>`;
    button.title = name;
    button.setAttribute('aria-label', name);
    return button;
  }

  function renderDrawer(): void {
    drawer.replaceChildren();
    drawnLabels = drawerLabels();
    drawer.hidden = !openGroup;
    if (!openGroup) return;
    const heading = document.createElement('h3');
    heading.textContent = openGroup.name;
    drawer.append(heading);
    for (const tool of openGroup.tools) {
      const button = document.createElement('button');
      button.textContent = toolLabel(tool, state);
      button.disabled = !toolEnabled(tool, state);
      button.classList.toggle('active', tool === current);
      button.addEventListener('click', () => select(current === tool ? null : tool));
      drawer.append(button);
    }
  }

function drawerLabels(): string {
  return openGroup ? openGroup.tools.map((tool) => toolLabel(tool, state)).join() : '';
}

function update(): void {
  if (current !== null && !toolEnabled(current, state)) select(null);
  else if (drawerLabels() !== drawnLabels) render();
}

function render(): void {
    for (const { button, tool } of quickButtons) button.classList.toggle('active', tool === current);
    for (const { button, group } of groupButtons) {
      const holdsCurrent = current !== null && group.tools.includes(current);
      button.classList.toggle('active', group === openGroup || holdsCurrent);
    }
    renderDrawer();
  }

  function select(tool: Tool | null): void {
    current = tool;
    render();
    onChange();
  }

  render();

  function reset(): void {
    openGroup = null;
    select(null);
  }

  return { current: () => current, reset, update };
}

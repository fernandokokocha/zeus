import { byId } from './dom';
import { TOOL_GROUPS, TOOL_LABELS, type Tool, type ToolGroup } from './tools';

export function createToolbar(onChange: () => void): { current(): Tool | null; clear(): void } {
  const box = byId('toolbar');
  const menu = byId('tool-menu');
  let current: Tool | null = null;
  let openGroup: ToolGroup | null = null;

  const groupButtons = TOOL_GROUPS.map((group) => {
    const button = document.createElement('button');
    button.addEventListener('click', () => {
      if (group.tools.length === 1) select(current === group.tools[0] ? null : group.tools[0]);
      else showMenu(openGroup === group ? null : group, button);
    });
    box.append(button);
    return { button, group };
  });

  function showMenu(group: ToolGroup | null, anchor?: HTMLElement): void {
    openGroup = group;
    menu.replaceChildren();
    menu.hidden = !group || !anchor;
    if (!group || !anchor) return;
    menu.style.top = `${anchor.getBoundingClientRect().top}px`;
    menu.style.left = `${box.getBoundingClientRect().right + 4}px`;
    for (const tool of group.tools) {
      const button = document.createElement('button');
      button.textContent = TOOL_LABELS[tool];
      button.classList.toggle('active', tool === current);
      button.addEventListener('click', () => select(current === tool ? null : tool));
      menu.append(button);
    }
  }

  function render(): void {
    for (const { button, group } of groupButtons) {
      const single = group.tools.length === 1;
      const chosen = current !== null && group.tools.includes(current) ? current : null;
      button.classList.toggle('active', chosen !== null);
      button.textContent = single ? TOOL_LABELS[group.tools[0]] : `${group.name} ▸`;
      if (chosen && !single) {
        const detail = document.createElement('small');
        detail.textContent = TOOL_LABELS[chosen];
        button.append(detail);
      }
    }
  }

  function select(tool: Tool | null): void {
    current = tool;
    showMenu(null);
    render();
    onChange();
  }

  window.addEventListener('mousedown', (e) => {
    if (openGroup && !box.contains(e.target as Node) && !menu.contains(e.target as Node)) showMenu(null);
  });
  render();

  return { current: () => current, clear: () => select(null) };
}

import { byId } from './dom';
import { TOOL_LABELS, type Tool } from './tools';

export function createToolbar(onChange: () => void): { current(): Tool | null; clear(): void } {
  const box = byId('toolbar');
  let current: Tool | null = null;

  const buttons = (Object.keys(TOOL_LABELS) as Tool[]).map((tool) => {
    const button = document.createElement('button');
    button.textContent = TOOL_LABELS[tool];
    button.addEventListener('click', () => select(current === tool ? null : tool));
    box.append(button);
    return { button, tool };
  });

  function select(tool: Tool | null): void {
    current = tool;
    for (const b of buttons) b.button.classList.toggle('active', b.tool === tool);
    onChange();
  }

  return { current: () => current, clear: () => select(null) };
}

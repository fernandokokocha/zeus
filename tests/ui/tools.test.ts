import { describe, expect, it } from 'vitest';
import { QUICK_TOOLS, TOOL_GROUPS, TOOL_LABELS, type Tool } from '../../src/ui/tools';

describe('TOOL_GROUPS', () => {
  it('puts every tool in exactly one group or among the quick tools', () => {
    const grouped = [...QUICK_TOOLS, ...TOOL_GROUPS.flatMap((group) => group.tools)];
    expect([...grouped].sort()).toEqual((Object.keys(TOOL_LABELS) as Tool[]).sort());
  });
});

import { describe, expect, it } from 'vitest';
import { QUICK_TOOLS, TOOL_GROUPS, TOOL_LABELS, type Tool, toolEnabled, toolLabel } from '../../src/ui/tools';
import { grassGame } from '../sim/helpers';

describe('TOOL_GROUPS', () => {
  it('puts every tool in exactly one group or among the quick tools', () => {
    const grouped = [...QUICK_TOOLS, ...TOOL_GROUPS.flatMap((group) => group.tools)];
    expect([...grouped].sort()).toEqual((Object.keys(TOOL_LABELS) as Tool[]).sort());
  });
});

describe('the Monument tool', () => {
  it('shows how many monuments are waiting to be placed', () => {
    const game = grassGame();
    game.monumentsToPlace = ['crowdedCity'];
    expect(toolLabel('monument', game)).toBe('Monument (1)');
    expect(toolLabel('park', game)).toBe(TOOL_LABELS.park);
  });

  it('works only while a monument is waiting', () => {
    const game = grassGame();
    expect(toolEnabled('monument', game)).toBe(false);
    game.monumentsToPlace = ['crowdedCity'];
    expect(toolEnabled('monument', game)).toBe(true);
    expect(toolEnabled('park', grassGame())).toBe(true);
  });
});

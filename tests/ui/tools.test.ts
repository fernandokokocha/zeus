import { describe, expect, it } from 'vitest';
import { QUICK_TOOLS, TOOL_GROUPS, TOOL_LABELS, type Tool, toolEnabled, toolLabel } from '../../src/ui/tools';
import { grassGame } from '../sim/helpers';

describe('TOOL_GROUPS', () => {
  it('puts every tool in exactly one group or among the quick tools', () => {
    const grouped = [...QUICK_TOOLS, ...TOOL_GROUPS.flatMap((group) => group.tools)];
    expect([...grouped].sort()).toEqual((Object.keys(TOOL_LABELS) as Tool[]).sort());
  });
});

describe('the Monument tools', () => {
  it('list each kind with how many are waiting', () => {
    const game = grassGame();
    game.monumentsToPlace = ['crowdedCity', 'tradeRoute', 'tradeRoute'];
    expect(toolLabel('crowdedCityMonument', game)).toBe('Monument: 1,000 citizens (1)');
    expect(toolLabel('tradeRouteMonument', game)).toBe('Monument: trade route (2)');
    expect(toolLabel('park', game)).toBe(TOOL_LABELS.park);
  });

  it('work only while a monument of their kind is waiting', () => {
    const game = grassGame();
    game.monumentsToPlace = ['tradeRoute'];
    expect(toolEnabled('crowdedCityMonument', game)).toBe(false);
    expect(toolEnabled('tradeRouteMonument', game)).toBe(true);
    expect(toolEnabled('park', grassGame())).toBe(true);
  });
});

import { describe, expect, it } from 'vitest';
import { appealMap } from '../../src/sim/appeal';
import type { BuildingType } from '../../src/sim/buildings';
import { TICKS_PER_MONTH } from '../../src/sim/clock';
import { placeBuilding } from '../../src/sim/commands';
import { riskShare } from '../../src/sim/safety';
import { tileIndex } from '../../src/sim/state';
import { STARTING_TREASURY } from '../../src/sim/treasury';
import { grassGame, runTicks } from './helpers';

describe('the material buildings', () => {
  it.each<[BuildingType, number, number[]]>([
    ['timberMill', 35, [-5, -4, -3, -2]],
    ['masonryShop', 75, [-6, -5, -4, -3]],
    ['foundry', 60, [-10, -9, -8, -7, -6, -5]],
    ['sculptureStudio', 100, [-2, -1]],
    ['artisansGuild', 35, [-6, -6, -5]],
  ])('a %s costs %i dr and radiates %j', (type, cost, appeal) => {
    const game = grassGame(30);
    expect(placeBuilding(game, type, 10, 10)).toEqual({ ok: true });
    expect(game.treasury).toBe(STARTING_TREASURY - cost);
    const map = appealMap(game);
    appeal.forEach((value, ring) => expect(map[tileIndex(game, 12 + ring, 11)]).toBe(value));
  });

  it.each<[BuildingType, 'fireRisk' | 'collapseRisk', number]>([
    ['timberMill', 'fireRisk', 10],
    ['masonryShop', 'collapseRisk', 10],
    ['foundry', 'collapseRisk', 10],
    ['sculptureStudio', 'collapseRisk', 10],
    ['artisansGuild', 'fireRisk', 5],
  ])('a %s builds up %s by %i a month', (type, risk, increment) => {
    const game = grassGame();
    placeBuilding(game, type, 4, 4);
    runTicks(game, TICKS_PER_MONTH);
    expect(riskShare(game.buildings[0][risk])).toBeCloseTo(increment / 60);
  });
});

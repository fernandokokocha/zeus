import { describe, expect, it } from 'vitest';
import { TICKS_PER_MONTH, TICKS_PER_YEAR } from '../../src/sim/clock';
import { placeBuilding } from '../../src/sim/commands';
import { annexOf } from '../../src/sim/elites';
import { SCHOLARS_CITY, isStartCity, startCity } from '../../src/sim/start-cities';
import type { GameState } from '../../src/sim/state';
import { runTicks } from './helpers';

function townhouses(game: GameState): number {
  return game.buildings.filter((b) => b.type === 'house' && b.level === 'townhouse' && b.residents > 0).length;
}

function placeScholars(game: GameState) {
  const { x, y, rotation } = SCHOLARS_CITY.site;
  return placeBuilding(game, 'scholarsHouse', x, y, rotation);
}

describe('the scholars start city', () => {
  it('is known by name', () => {
    expect(isStartCity('scholars')).toBe(true);
    expect(isStartCity('atlantis')).toBe(false);
  });

  it('starts rich, with a Scholars’ House permit and scrolls in storage', () => {
    const game = startCity('scholars');
    expect(game.treasury).toBeGreaterThanOrEqual(45_000);
    expect(game.permits.scholarsHouse).toBe(1);
    expect(game.buildings.reduce((sum, b) => sum + (b.type === 'storehouse' ? b.scrolls : 0), 0)).toBe(800);
    expect(townhouses(game)).toBe(12);
  });

  it('keeps all twelve Townhouses for two years', () => {
    const game = startCity('scholars');
    runTicks(game, 2 * TICKS_PER_YEAR);
    expect(townhouses(game)).toBe(12);
  });

  it('can place a Scholars’ House at once, which lasts two years and makes a Work of Art each', () => {
    const game = startCity('scholars');
    expect(placeScholars(game)).toEqual({ ok: true });
    runTicks(game, 2 * TICKS_PER_YEAR + TICKS_PER_MONTH);
    const scholars = game.buildings.find((b) => b.type === 'scholarsHouse');
    expect(scholars).toBeDefined();
    expect(annexOf(game, scholars!).scrolls).toBeGreaterThan(0);
    expect(game.worksOfArt).toBe(2);
    expect(townhouses(game)).toBe(8);
  });
});

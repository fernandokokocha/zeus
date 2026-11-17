import { describe, expect, it } from 'vitest';
import { TICKS_PER_MONTH, TICKS_PER_YEAR } from '../../src/sim/clock';
import { appealMap } from '../../src/sim/appeal';
import { placeBuilding } from '../../src/sim/commands';
import { canBeOrnate } from '../../src/sim/road-upgrades';
import { storedMarble } from '../../src/sim/sanctuaries';
import { MONUMENT_BLOCK, SCHOLARS_CITY, isStartCity, startCity } from '../../src/sim/start-cities';
import { tileIndex, type GameState } from '../../src/sim/state';
import { runTicks } from './helpers';

const TWO_YEAR_RUN_TIMEOUT_MS = 20_000;

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
  }, TWO_YEAR_RUN_TIMEOUT_MS);

  it('can place a Scholars’ House at once, which lasts two years and makes a Work of Art each', () => {
    const game = startCity('scholars');
    expect(placeScholars(game)).toEqual({ ok: true });
    runTicks(game, 2 * TICKS_PER_YEAR + TICKS_PER_MONTH);
    const scholars = game.buildings.find((b) => b.type === 'scholarsHouse');
    expect(scholars).toBeDefined();
    expect(scholars!.scrolls).toBeGreaterThan(0);
    expect(game.worksOfArt).toBe(2);
    expect(townhouses(game)).toBe(8);
  }, TWO_YEAR_RUN_TIMEOUT_MS);
});

describe('the upgrades start city', () => {
  it('is the scholars city with a Work of Art for every upgrade', () => {
    const game = startCity('upgrades');
    expect(game.worksOfArt).toBe(8);
    expect(townhouses(game)).toBe(12);
    expect(game.permits.scholarsHouse).toBe(1);
  });
});

describe('the monument start city', () => {
  function blockTownhouses(game: GameState): number {
    return MONUMENT_BLOCK.houses.filter((lot) => {
      const house = game.buildings.find((b) => b.x === lot.x && b.y === lot.y);
      return house !== undefined && house.level === 'townhouse';
    }).length;
  }

  function ornateReadyRingTiles(game: GameState): number {
    const appeal = appealMap(game);
    return MONUMENT_BLOCK.ring.filter((p) => game.roads[tileIndex(game, p.x, p.y)] && canBeOrnate(game, p, appeal)).length;
  }

  it('is the scholars city with a Monument block of four Townhouses beside it', () => {
    const game = startCity('monument');
    expect(game.buildings.filter((b) => b.type === 'monument')).toHaveLength(1);
    expect(blockTownhouses(game)).toBe(4);
    expect(townhouses(game)).toBe(16);
  });

  it('keeps the Monument block’s four Townhouses for two years', () => {
    const game = startCity('monument');
    runTicks(game, 2 * TICKS_PER_YEAR);
    expect(blockTownhouses(game)).toBe(4);
  }, TWO_YEAR_RUN_TIMEOUT_MS);

  it('has road around the Monument block ready for Ornate, and marble to pay for it', () => {
    const game = startCity('monument');
    expect(ornateReadyRingTiles(game)).toBeGreaterThanOrEqual(MONUMENT_BLOCK.ring.length / 2);
    expect(storedMarble(game)).toBeGreaterThan(0);
  });
});

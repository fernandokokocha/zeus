import { describe, expect, it } from 'vitest';
import { TICKS_PER_MONTH } from '../../src/sim/clock';
import { culturePoints } from '../../src/sim/culture';
import { demolish, placeBuilding, placeRoad } from '../../src/sim/commands';
import { COVERAGE_MONTHS, ROAMER_REST_TICKS, ROAMER_SPECS } from '../../src/sim/roamers';
import type { Building, GameState } from '../../src/sim/state';
import { WALKER_TILES_PER_TICK } from '../../src/sim/walking';
import { grassGame, placeHouse, runTicks } from './helpers';

function ticksToWalk(tiles: number): number {
  return Math.ceil(tiles / WALKER_TILES_PER_TICK);
}

function street(): { game: GameState; house: Building } {
  const game = grassGame(30);
  placeRoad(game, { x: 0, y: 15 }, { x: 29, y: 15 });
  placeHouse(game, 8, 13);
  const house = game.buildings[0];
  house.residents = 100;
  return { game, house };
}

function lastBuilding(game: GameState): Building {
  return game.buildings[game.buildings.length - 1];
}

describe('a podium', () => {
  it('sends a philosopher roaming 35 tiles while lecturing', () => {
    const { game } = street();
    placeBuilding(game, 'podium', 2, 13);
    const podium = lastBuilding(game);
    podium.performingUntil = 10 * TICKS_PER_MONTH;
    runTicks(game, ROAMER_REST_TICKS);
    expect(game.roamers).toHaveLength(1);
    expect(game.roamers[0]).toMatchObject({ kind: 'philosopher', homeId: podium.id });
    expect(ROAMER_SPECS.philosopher.range).toBe(35);
  });

  it('sends nobody while no philosopher lectures there', () => {
    const { game } = street();
    placeBuilding(game, 'podium', 2, 13);
    runTicks(game, 3 * ROAMER_REST_TICKS);
    expect(game.roamers).toEqual([]);
  });
});

describe('a gymnasium', () => {
  it('sends athletes out with no school', () => {
    const { game } = street();
    placeBuilding(game, 'gymnasium', 2, 12);
    runTicks(game, ROAMER_REST_TICKS);
    expect(game.roamers.map((r) => r.kind)).toEqual(['athlete']);
    expect(ROAMER_SPECS.athlete.range).toBe(35);
  });
});

describe('a theater', () => {
  it('sends actors roaming 35 tiles while performing', () => {
    const { game } = street();
    placeBuilding(game, 'theater', 14, 16);
    lastBuilding(game).performingUntil = 10 * TICKS_PER_MONTH;
    runTicks(game, ROAMER_REST_TICKS);
    expect(game.roamers.map((r) => r.kind)).toEqual(['actor']);
    expect(ROAMER_SPECS.actor.range).toBe(35);
  });
});

describe('culture points', () => {
  it('are 15 for a philosopher, 20 for an athlete and 25 for an actor, summed', () => {
    const { game, house } = street();
    expect(culturePoints(game, house)).toBe(0);
    house.coveredUntil.philosophy = 1;
    expect(culturePoints(game, house)).toBe(15);
    house.coveredUntil.athletics = 1;
    expect(culturePoints(game, house)).toBe(35);
    house.coveredUntil.drama = 1;
    expect(culturePoints(game, house)).toBe(60);
  });

  it('come from a walker passing and last 2 months', () => {
    const { game, house } = street();
    placeBuilding(game, 'gymnasium', 2, 12);
    runTicks(game, ROAMER_REST_TICKS + ticksToWalk(15));
    expect(culturePoints(game, house)).toBe(20);
    demolish(game, { x: 2, y: 12 }, { x: 2, y: 12 });
    runTicks(game, COVERAGE_MONTHS.athletics * TICKS_PER_MONTH);
    expect(culturePoints(game, house)).toBe(0);
  });

  it('do not stack for two venues of one kind', () => {
    const { game, house } = street();
    placeBuilding(game, 'gymnasium', 2, 12);
    placeBuilding(game, 'gymnasium', 12, 12);
    runTicks(game, ROAMER_REST_TICKS + ticksToWalk(15));
    expect(game.roamers).toHaveLength(2);
    expect(culturePoints(game, house)).toBe(20);
  });
});

import { describe, expect, it } from 'vitest';
import { demolish, placeBuilding, placeRoad } from '../../src/sim/commands';
import { ROAMER_REST_TICKS } from '../../src/sim/roamers';
import { PERFORMANCE_TICKS, isPerforming } from '../../src/sim/schools';
import type { Building, GameState } from '../../src/sim/state';
import { tick } from '../../src/sim/tick';
import { WALKER_TILES_PER_TICK } from '../../src/sim/walking';
import { grassGame, placeHouse, runTicks } from './helpers';

function ticksToWalk(tiles: number): number {
  return Math.ceil(tiles / WALKER_TILES_PER_TICK);
}

function town(people = 100): GameState {
  const game = grassGame(30);
  placeRoad(game, { x: 0, y: 15 }, { x: 29, y: 15 });
  placeHouse(game, 0, 28);
  game.buildings[0].residents = people;
  return game;
}

function lastBuilding(game: GameState): Building {
  return game.buildings[game.buildings.length - 1];
}

function campus(): { game: GameState; college: Building; podium: Building } {
  const game = town();
  placeBuilding(game, 'college', 2, 12);
  const college = lastBuilding(game);
  placeBuilding(game, 'podium', 12, 13);
  return { game, college, podium: lastBuilding(game) };
}

describe('a college', () => {
  it('sends a philosopher to a staffed podium after a quarter month', () => {
    const { game, college, podium } = campus();
    runTicks(game, ROAMER_REST_TICKS - 1);
    expect(game.trainees).toEqual([]);
    tick(game);
    expect(game.trainees).toHaveLength(1);
    expect(game.trainees[0]).toMatchObject({ kind: 'philosopherTrainee', homeId: college.id, destinationId: podium.id });
    expect(game.trainees[0].path[0]).toEqual({ x: 4, y: 15 });
    expect(game.trainees[0].path.at(-1)).toEqual({ x: 12, y: 15 });
  });

  it('takes twice as long at half staff', () => {
    const game = town(20);
    placeBuilding(game, 'podium', 12, 13);
    placeBuilding(game, 'college', 2, 12);
    expect(lastBuilding(game).workers).toBe(0);
    runTicks(game, 2 * ROAMER_REST_TICKS - 1);
    expect(lastBuilding(game).workers).toBe(6);
    expect(game.trainees).toEqual([]);
    tick(game);
    expect(game.trainees).toHaveLength(1);
  });

  it('trains nobody without workers', () => {
    const game = town(0);
    placeBuilding(game, 'college', 2, 12);
    placeBuilding(game, 'podium', 12, 13);
    runTicks(game, 3 * ROAMER_REST_TICKS);
    expect(game.trainees).toEqual([]);
  });

  it('waits with a philosopher ready until a staffed podium stands', () => {
    const game = town();
    placeBuilding(game, 'college', 2, 12);
    runTicks(game, 2 * ROAMER_REST_TICKS);
    expect(game.trainees).toEqual([]);
    placeBuilding(game, 'podium', 12, 13);
    tick(game);
    expect(game.trainees).toHaveLength(1);
  });

  it('has one philosopher out at a time', () => {
    const game = town();
    placeBuilding(game, 'college', 2, 12);
    placeBuilding(game, 'podium', 26, 13);
    for (let i = 0; i < 4 * ROAMER_REST_TICKS; i++) {
      tick(game);
      expect(game.trainees.length).toBeLessThanOrEqual(1);
    }
  });

  it('sends the next philosopher to the podium whose lectures end soonest', () => {
    const { game, podium } = campus();
    placeBuilding(game, 'podium', 20, 13);
    const far = lastBuilding(game);
    podium.performingUntil = 10 * PERFORMANCE_TICKS;
    runTicks(game, ROAMER_REST_TICKS);
    expect(game.trainees[0].destinationId).toBe(far.id);
  });

  it('sends him to the nearest podium when none is lecturing', () => {
    const { game, podium } = campus();
    placeBuilding(game, 'podium', 20, 13);
    lastBuilding(game).performingUntil = -PERFORMANCE_TICKS;
    runTicks(game, ROAMER_REST_TICKS);
    expect(game.trainees[0].destinationId).toBe(podium.id);
  });
});

describe('a philosopher on his way', () => {
  it('vanishes at the podium and sets it lecturing for 2 months', () => {
    const { game, podium } = campus();
    runTicks(game, ROAMER_REST_TICKS);
    expect(isPerforming(game, podium)).toBe(false);
    while (game.trainees.length > 0) tick(game);
    expect(podium.performingUntil).toBe(game.tick + PERFORMANCE_TICKS);
    expect(isPerforming(game, podium)).toBe(true);
    demolish(game, { x: 2, y: 12 }, { x: 2, y: 12 });
    runTicks(game, PERFORMANCE_TICKS - 1);
    expect(isPerforming(game, podium)).toBe(true);
    tick(game);
    expect(isPerforming(game, podium)).toBe(false);
  });

  it('heads to another podium when his is demolished', () => {
    const { game, podium } = campus();
    placeBuilding(game, 'podium', 20, 13);
    const other = lastBuilding(game);
    runTicks(game, ROAMER_REST_TICKS + ticksToWalk(2));
    demolish(game, podium, podium);
    tick(game);
    expect(game.trainees[0].destinationId).toBe(other.id);
    runTicks(game, ticksToWalk(18));
    expect(game.trainees).toEqual([]);
    expect(isPerforming(game, other)).toBe(true);
  });

  it('gives up when no podium is left', () => {
    const { game, podium } = campus();
    runTicks(game, ROAMER_REST_TICKS + ticksToWalk(2));
    demolish(game, podium, podium);
    tick(game);
    expect(game.trainees).toEqual([]);
  });

  it('vanishes with his college', () => {
    const { game, college } = campus();
    runTicks(game, ROAMER_REST_TICKS + ticksToWalk(2));
    demolish(game, college, college);
    tick(game);
    expect(game.trainees).toEqual([]);
  });

  it('vanishes when the road under him is removed', () => {
    const { game } = campus();
    runTicks(game, ROAMER_REST_TICKS + ticksToWalk(2));
    const { x, y } = game.trainees[0].path[game.trainees[0].step];
    demolish(game, { x, y }, { x, y });
    tick(game);
    expect(game.trainees).toEqual([]);
  });
});

describe('a drama school', () => {
  it('sends actors to a theater, which then performs', () => {
    const game = town();
    placeBuilding(game, 'dramaSchool', 2, 12);
    const school = lastBuilding(game);
    placeBuilding(game, 'theater', 12, 10);
    const theater = lastBuilding(game);
    runTicks(game, ROAMER_REST_TICKS);
    expect(game.trainees[0]).toMatchObject({ kind: 'actorTrainee', homeId: school.id, destinationId: theater.id });
    runTicks(game, ticksToWalk(9));
    expect(game.trainees).toEqual([]);
    expect(isPerforming(game, theater)).toBe(true);
  });

  it('does not send actors to a podium', () => {
    const game = town();
    placeBuilding(game, 'dramaSchool', 2, 12);
    placeBuilding(game, 'podium', 12, 13);
    runTicks(game, 2 * ROAMER_REST_TICKS);
    expect(game.trainees).toEqual([]);
  });
});

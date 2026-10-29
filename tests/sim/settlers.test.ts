import { describe, expect, it } from 'vitest';
import { tick } from '../../src/sim/tick';
import { demolish, placeRoad, placeRoadblock } from '../../src/sim/commands';
import { houseName } from '../../src/sim/housing';
import { SETTLER_SPAWN_INTERVAL_TICKS, population } from '../../src/sim/settlers';
import { WALKER_TILES_PER_TICK } from '../../src/sim/walking';
import { generateTerrain } from '../../src/sim/map';
import { createGame, type GameState } from '../../src/sim/state';
import { grassGame, placeHouse, runTicks, setTerrain } from './helpers';

function ticksToWalk(tiles: number): number {
  return Math.ceil(tiles / WALKER_TILES_PER_TICK);
}

function gameWithLongRoad(): GameState {
  const game = grassGame();
  placeRoad(game, { x: 0, y: 10 }, { x: 19, y: 10 });
  return game;
}

describe('settlers', () => {
  it('stay away while no lot is reachable', () => {
    const game = grassGame();
    placeHouse(game, 2, 2);
    runTicks(game, 5 * SETTLER_SPAWN_INTERVAL_TICKS);
    expect(game.settlers).toEqual([]);
    expect(game.buildings[0].residents).toBe(0);
  });

  it('set off from the entry towards a lot on a connected road, carrying a full house', () => {
    const game = grassGame();
    placeHouse(game, 2, 8);
    runTicks(game, SETTLER_SPAWN_INTERVAL_TICKS);
    expect(game.settlers).toHaveLength(1);
    const [settler] = game.settlers;
    expect(settler.path[0]).toEqual(game.entry);
    expect(settler.destinationId).toBe(game.buildings[0].id);
    expect(settler.people).toBe(8);
  });

  it('walk in along the Main Road of a generated map', () => {
    const game = createGame(7);
    const { mainRoad } = generateTerrain(7);
    const stop = mainRoad[6];
    const along = { x: mainRoad[7].x - stop.x, y: mainRoad[7].y - stop.y };
    const beside = { x: -along.y, y: along.x };
    const lot = [1, 2].flatMap((out) => [0, 1].map((on) => ({ x: stop.x + out * beside.x + on * along.x, y: stop.y + out * beside.y + on * along.y })));
    for (const p of lot) setTerrain(game, p.x, p.y, 'grass');
    placeHouse(game, Math.min(...lot.map((p) => p.x)), Math.min(...lot.map((p) => p.y)));
    runTicks(game, SETTLER_SPAWN_INTERVAL_TICKS);
    const [settler] = game.settlers;
    expect(settler.path).toEqual(mainRoad.slice(0, 7));
    runTicks(game, ticksToWalk(7));
    expect(game.buildings[0].residents).toBe(8);
  });

  it('turn the lot into a Hut with 8 residents when they arrive', () => {
    const game = grassGame();
    placeHouse(game, 2, 8);
    runTicks(game, SETTLER_SPAWN_INTERVAL_TICKS + ticksToWalk(2));
    expect(game.settlers).toEqual([]);
    expect(game.buildings[0].residents).toBe(8);
    expect(houseName(game.buildings[0])).toBe('Hut');
    expect(population(game)).toBe(8);
  });

  it('come one per lot and never two for the same room', () => {
    const game = gameWithLongRoad();
    placeHouse(game, 16, 8);
    placeHouse(game, 16, 11);
    runTicks(game, 3 * SETTLER_SPAWN_INTERVAL_TICKS);
    expect(game.settlers.map((s) => s.destinationId).sort()).toEqual([1, 2]);
    runTicks(game, ticksToWalk(16));
    expect(game.settlers).toEqual([]);
    expect(population(game)).toBe(16);
  });

it('walk through roadblocks', () => {
    const game = gameWithLongRoad();
    placeRoadblock(game, { x: 8, y: 10 });
    placeHouse(game, 16, 8);
    runTicks(game, SETTLER_SPAWN_INTERVAL_TICKS + ticksToWalk(16));
    expect(game.buildings[0].residents).toBe(8);
  });

  it('fill the closest lot first', () => {
    const game = gameWithLongRoad();
    placeHouse(game, 16, 8);
    placeHouse(game, 4, 8);
    runTicks(game, SETTLER_SPAWN_INTERVAL_TICKS);
    expect(game.settlers[0].destinationId).toBe(game.buildings[1].id);
  });

  it('head for another lot when theirs is demolished', () => {
    const game = gameWithLongRoad();
    placeHouse(game, 16, 8);
    runTicks(game, SETTLER_SPAWN_INTERVAL_TICKS + 5);
    placeHouse(game, 12, 11);
    demolish(game, { x: 16, y: 8 }, { x: 16, y: 8 });
    tick(game);
    expect(game.settlers[0].destinationId).toBe(game.buildings[0].id);
    runTicks(game, ticksToWalk(12));
    expect(game.buildings[0].residents).toBe(8);
  });

  it('leave when their lot is demolished and no other has room', () => {
    const game = gameWithLongRoad();
    placeHouse(game, 16, 8);
    runTicks(game, SETTLER_SPAWN_INTERVAL_TICKS + 5);
    demolish(game, { x: 16, y: 8 }, { x: 16, y: 8 });
    tick(game);
    expect(game.settlers).toEqual([]);
  });

  it('take a detour when the road ahead is removed', () => {
    const game = gameWithLongRoad();
    placeRoad(game, { x: 5, y: 10 }, { x: 5, y: 13 });
    placeRoad(game, { x: 5, y: 13 }, { x: 15, y: 13 });
    placeRoad(game, { x: 15, y: 13 }, { x: 15, y: 10 });
    placeHouse(game, 16, 8);
    runTicks(game, SETTLER_SPAWN_INTERVAL_TICKS + ticksToWalk(6));
    demolish(game, { x: 10, y: 10 }, { x: 10, y: 10 });
    runTicks(game, ticksToWalk(25));
    expect(game.buildings[0].residents).toBe(8);
  });

  it('leave when the road ahead is cut with no detour', () => {
    const game = gameWithLongRoad();
    placeHouse(game, 16, 8);
    runTicks(game, SETTLER_SPAWN_INTERVAL_TICKS + ticksToWalk(3));
    demolish(game, { x: 10, y: 10 }, { x: 10, y: 10 });
    runTicks(game, ticksToWalk(10));
    expect(game.settlers).toEqual([]);
    expect(game.buildings[0].residents).toBe(0);
  });

  it('vanish when the road under them is removed', () => {
    const game = gameWithLongRoad();
    placeHouse(game, 16, 8);
    runTicks(game, SETTLER_SPAWN_INTERVAL_TICKS + ticksToWalk(3));
    const { x, y } = game.settlers[0].path[game.settlers[0].step];
    demolish(game, { x, y }, { x, y });
    tick(game);
    expect(game.settlers).toEqual([]);
  });

  it('are gone from the population when their house is demolished', () => {
    const game = grassGame();
    placeHouse(game, 2, 8);
    runTicks(game, SETTLER_SPAWN_INTERVAL_TICKS + ticksToWalk(2));
    demolish(game, { x: 2, y: 8 }, { x: 2, y: 8 });
    expect(population(game)).toBe(0);
  });
});

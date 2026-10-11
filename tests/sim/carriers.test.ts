import { describe, expect, it } from 'vitest';
import { demolish, placeBuilding, placeRoad } from '../../src/sim/commands';
import { CART_LOAD, GRANARY_CAPACITY } from '../../src/sim/food';
import type { Building, GameState } from '../../src/sim/state';
import { tick } from '../../src/sim/tick';
import { WALKER_TILES_PER_TICK } from '../../src/sim/walking';
import { grassGame, placeHouse, runTicks, setMeadow } from './helpers';

function ticksToWalk(tiles: number): number {
  return Math.ceil(tiles / WALKER_TILES_PER_TICK);
}

function farmTown(people = 100): { game: GameState; farm: Building; granary: Building } {
  const game = grassGame(30);
  placeRoad(game, { x: 0, y: 15 }, { x: 29, y: 15 });
  placeHouse(game, 0, 28);
  game.buildings[0].residents = people;
  setMeadow(game, 2, 12, 3, 3);
  placeBuilding(game, 'wheatFarm', 2, 12);
  placeBuilding(game, 'granary', 10, 11);
  const [, farm, granary] = game.buildings;
  return { game, farm, granary };
}

describe('a cart pusher', () => {
  it('takes 4 loads from the farm to the nearest granary', () => {
    const { game, farm, granary } = farmTown();
    farm.food = 600;
    tick(game);
    expect(game.carriers).toHaveLength(1);
    expect(game.carriers[0]).toMatchObject({ kind: 'cartPusher', homeId: farm.id, destinationId: granary.id, food: CART_LOAD });
    expect(game.carriers[0].path[0]).toEqual({ x: 4, y: 15 });
    expect(game.carriers[0].path.at(-1)).toEqual({ x: 10, y: 15 });
    expect(farm.food).toBe(200);
    runTicks(game, ticksToWalk(6));
    expect(granary.food).toBe(CART_LOAD);
    expect(game.carriers[0]).toMatchObject({ returning: true, food: 0 });
  });

  it('walks home and sends the next cart with the rest', () => {
    const { game, farm, granary } = farmTown();
    farm.food = 600;
    runTicks(game, ticksToWalk(6) + 1);
    runTicks(game, ticksToWalk(6) + 1);
    expect(game.carriers).toHaveLength(1);
    expect(game.carriers[0]).toMatchObject({ returning: false, food: 200 });
    runTicks(game, ticksToWalk(6));
    expect(granary.food).toBe(600);
  });

  it('does not go out without a granary to take the wheat', () => {
    const { game, farm, granary } = farmTown();
    demolish(game, granary, granary);
    farm.food = 400;
    tick(game);
    expect(game.carriers).toEqual([]);
    expect(farm.food).toBe(400);
  });

  it('skips a granary without workers', () => {
    const { game, farm } = farmTown(20);
    farm.food = 400;
    tick(game);
    expect(game.carriers).toEqual([]);
  });

  it('brings only what fits, counting carts already on the way', () => {
    const { game, farm, granary } = farmTown();
    granary.food = GRANARY_CAPACITY - 500;
    farm.food = 800;
    tick(game);
    expect(game.carriers[0].food).toBe(CART_LOAD);
    setMeadow(game, 20, 12, 3, 3);
    placeBuilding(game, 'wheatFarm', 20, 12);
    game.buildings[game.buildings.length - 1].food = 800;
    tick(game);
    expect(game.carriers[1].food).toBe(100);
  });

  it('turns to another granary when its own is demolished', () => {
    const { game, farm, granary } = farmTown();
    placeBuilding(game, 'granary', 20, 11);
    const other = game.buildings[3];
    farm.food = 400;
    runTicks(game, ticksToWalk(3));
    demolish(game, granary, granary);
    runTicks(game, ticksToWalk(20));
    expect(other.food).toBe(400);
  });

  it('brings its load home when no granary is left', () => {
    const { game, farm, granary } = farmTown();
    farm.food = 400;
    runTicks(game, ticksToWalk(3));
    demolish(game, granary, granary);
    runTicks(game, ticksToWalk(3) + 1);
    expect(game.carriers).toEqual([]);
    expect(farm.food).toBe(400);
  });

  it('vanishes with its farm', () => {
    const { game, farm } = farmTown();
    farm.food = 400;
    runTicks(game, ticksToWalk(3));
    demolish(game, farm, farm);
    tick(game);
    expect(game.carriers).toEqual([]);
  });

  it('vanishes when the road under it is removed', () => {
    const { game, farm } = farmTown();
    farm.food = 400;
    runTicks(game, ticksToWalk(3));
    const { x, y } = game.carriers[0].path[game.carriers[0].step];
    demolish(game, { x, y }, { x, y });
    tick(game);
    expect(game.carriers).toEqual([]);
  });
});

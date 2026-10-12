import { describe, expect, it } from 'vitest';
import { TICKS_PER_MONTH } from '../../src/sim/clock';
import { demolish, placeBuilding, placeRoad, placeRoadblock } from '../../src/sim/commands';
import {
  ROAMER_REST_TICKS,
  ROAMER_SPECS,
  SERVICE_MONTHS,
  exitTile,
  hasService,
  nextRoamTile,
} from '../../src/sim/roamers';
import type { Building, GameState } from '../../src/sim/state';
import { tick } from '../../src/sim/tick';
import { WALKER_TILES_PER_TICK } from '../../src/sim/walking';
import { grassGame, placeHouse, runTicks } from './helpers';

function ticksToWalk(tiles: number): number {
  return Math.ceil(tiles / WALKER_TILES_PER_TICK);
}

function cityOf(people: number): GameState {
  const game = grassGame();
  placeRoad(game, { x: 0, y: 10 }, { x: 19, y: 10 });
  placeHouse(game, 18, 18);
  game.buildings[0].residents = people;
  return game;
}

function fullHouse(game: GameState, x: number, y: number) {
  placeHouse(game, x, y);
  const house = game.buildings[game.buildings.length - 1];
  house.residents = 8;
  return house;
}

describe('exitTile', () => {
  it('is the first road tile touching the building, clockwise from north', () => {
    const game = grassGame();
    placeBuilding(game, 'fountain', 5, 5);
    const fountain = game.buildings[0];
    expect(exitTile(game, fountain)).toBeNull();
    placeRoad(game, { x: 4, y: 5 }, { x: 4, y: 6 });
    expect(exitTile(game, fountain)).toEqual({ x: 4, y: 6 });
    placeRoad(game, { x: 5, y: 7 }, { x: 6, y: 7 });
    expect(exitTile(game, fountain)).toEqual({ x: 6, y: 7 });
    placeRoad(game, { x: 7, y: 6 }, { x: 7, y: 6 });
    expect(exitTile(game, fountain)).toEqual({ x: 7, y: 6 });
    placeRoad(game, { x: 6, y: 4 }, { x: 6, y: 4 });
    expect(exitTile(game, fountain)).toEqual({ x: 6, y: 4 });
  });
});

describe('nextRoamTile', () => {
  it('prefers road it has not walked yet', () => {
    const game = grassGame();
    placeRoad(game, { x: 5, y: 4 }, { x: 6, y: 4 });
    placeRoad(game, { x: 5, y: 5 }, { x: 7, y: 5 });
    const walked = [{ x: 5, y: 5 }, { x: 5, y: 4 }, { x: 6, y: 4 }, { x: 6, y: 5 }];
    for (let i = 0; i < 10; i++) expect(nextRoamTile(game, walked)).toEqual({ x: 7, y: 5 });
  });

  it('avoids turning back when every way is walked', () => {
    const game = grassGame();
    placeRoad(game, { x: 5, y: 4 }, { x: 6, y: 4 });
    placeRoad(game, { x: 5, y: 5 }, { x: 6, y: 5 });
    const walked = [{ x: 5, y: 5 }, { x: 5, y: 4 }, { x: 6, y: 4 }, { x: 6, y: 5 }];
    expect(nextRoamTile(game, walked)).toEqual({ x: 5, y: 5 });
  });

  it('never walks through a roadblock', () => {
    const game = grassGame();
    placeRoad(game, { x: 2, y: 2 }, { x: 6, y: 2 });
    placeRoadblock(game, { x: 5, y: 2 });
    expect(nextRoamTile(game, [{ x: 3, y: 2 }, { x: 4, y: 2 }])).toEqual({ x: 3, y: 2 });
  });

  it('turns back at a dead end', () => {
    const game = grassGame();
    placeRoad(game, { x: 2, y: 2 }, { x: 4, y: 2 });
    expect(nextRoamTile(game, [{ x: 3, y: 2 }, { x: 4, y: 2 }])).toEqual({ x: 3, y: 2 });
  });

  it('has nowhere to go on a lone road tile', () => {
    const game = grassGame();
    placeRoad(game, { x: 2, y: 2 }, { x: 2, y: 2 });
    expect(nextRoamTile(game, [{ x: 2, y: 2 }])).toBeNull();
  });

  it('picks among fresh roads at random, but reproducibly', () => {
    const game = grassGame();
    placeRoad(game, { x: 2, y: 5 }, { x: 8, y: 5 });
    placeRoad(game, { x: 5, y: 2 }, { x: 5, y: 8 });
    const walked = [{ x: 4, y: 5 }, { x: 5, y: 5 }];
    const picks = Array.from({ length: 30 }, () => nextRoamTile(game, walked));
    expect(new Set(picks.map((p) => `${p!.x},${p!.y}`))).toEqual(new Set(['6,5', '5,4', '5,6']));
    const replay = grassGame();
    placeRoad(replay, { x: 2, y: 5 }, { x: 8, y: 5 });
    placeRoad(replay, { x: 5, y: 2 }, { x: 5, y: 8 });
    expect(Array.from({ length: 30 }, () => nextRoamTile(replay, walked))).toEqual(picks);
  });
});

describe('a fountain', () => {
  it('sends a water carrier from its exit tile once staffed and rested', () => {
    const game = cityOf(20);
    placeBuilding(game, 'fountain', 0, 11);
    runTicks(game, ROAMER_REST_TICKS - 1);
    expect(game.roamers).toEqual([]);
    tick(game);
    expect(game.roamers).toHaveLength(1);
    expect(game.roamers[0]).toMatchObject({ kind: 'waterCarrier', homeId: game.buildings[1].id, step: 0 });
    expect(game.roamers[0].path[0]).toEqual({ x: 0, y: 10 });
  });

  it('sends nobody without workers', () => {
    const game = cityOf(0);
    placeBuilding(game, 'fountain', 0, 11);
    runTicks(game, 3 * ROAMER_REST_TICKS);
    expect(game.roamers).toEqual([]);
  });

  it('takes twice as long at half staff', () => {
    const game = cityOf(4);
    placeBuilding(game, 'fountain', 0, 11);
    runTicks(game, 2 * ROAMER_REST_TICKS - 1);
    expect(game.roamers).toEqual([]);
    tick(game);
    expect(game.roamers).toHaveLength(1);
  });

  it('has one carrier out at a time', () => {
    const game = cityOf(20);
    placeBuilding(game, 'fountain', 0, 11);
    runTicks(game, 3 * ROAMER_REST_TICKS);
    expect(game.roamers).toHaveLength(1);
  });
});

describe('a water carrier', () => {
  function carrierGame(): GameState {
    const game = cityOf(20);
    placeBuilding(game, 'fountain', 0, 11);
    runTicks(game, ROAMER_REST_TICKS);
    return game;
  }

  it('walks out, turns home after its range and disappears on arrival', () => {
    const game = carrierGame();
    const range = ROAMER_SPECS.waterCarrier.range;
    runTicks(game, ticksToWalk(range));
    const [carrier] = game.roamers;
    expect(carrier.returning).toBe(true);
    const turnedAt = 19 - (range - 19);
    expect(carrier.path[0]).toEqual({ x: turnedAt, y: 10 });
    expect(carrier.path.at(-1)).toEqual({ x: 1, y: 10 });
    runTicks(game, ticksToWalk(turnedAt - 1));
    expect(game.roamers).toEqual([]);
  });

  it('turns back at the end of the road', () => {
    const game = carrierGame();
    runTicks(game, ticksToWalk(21));
    expect(game.roamers[0].path.slice(18, 22)).toEqual([
      { x: 18, y: 10 }, { x: 19, y: 10 }, { x: 18, y: 10 }, { x: 17, y: 10 },
    ]);
  });

  it('brings water to houses within 2 tiles of the road it walks', () => {
    const game = carrierGame();
    const beside = fullHouse(game, 4, 11);
    const twoAway = fullHouse(game, 8, 7);
    const threeAway = fullHouse(game, 12, 13);
    runTicks(game, ticksToWalk(15));
    expect(hasService(game, beside, 'water')).toBe(true);
    expect(hasService(game, twoAway, 'water')).toBe(true);
    expect(hasService(game, threeAway, 'water')).toBe(false);
    expect(hasService(game, beside, 'tax')).toBe(false);
  });

  it('leaves water for 2 months', () => {
    const game = cityOf(20);
    const house = fullHouse(game, 2, 11);
    placeBuilding(game, 'fountain', 0, 11);
    runTicks(game, ROAMER_REST_TICKS);
    expect(house.coveredUntil.water).toBe(game.tick + SERVICE_MONTHS * TICKS_PER_MONTH);
    demolish(game, { x: 0, y: 11 }, { x: 0, y: 11 });
    runTicks(game, SERVICE_MONTHS * TICKS_PER_MONTH - 1);
    expect(hasService(game, house, 'water')).toBe(true);
    tick(game);
    expect(hasService(game, house, 'water')).toBe(false);
  });

  it('vanishes when its fountain is demolished', () => {
    const game = carrierGame();
    runTicks(game, ticksToWalk(3));
    demolish(game, { x: 0, y: 11 }, { x: 0, y: 11 });
    tick(game);
    expect(game.roamers).toEqual([]);
  });

  it('vanishes when the road under it is removed', () => {
    const game = carrierGame();
    runTicks(game, ticksToWalk(3));
    const { x, y } = game.roamers[0].path[game.roamers[0].step];
    demolish(game, { x, y }, { x, y });
    tick(game);
    expect(game.roamers).toEqual([]);
  });

  it('takes another way home when the road ahead is cut', () => {
    const game = carrierGame();
    placeRoad(game, { x: 5, y: 10 }, { x: 5, y: 13 });
    placeRoad(game, { x: 5, y: 13 }, { x: 15, y: 13 });
    placeRoad(game, { x: 15, y: 13 }, { x: 15, y: 10 });
    const [carrier] = game.roamers;
    carrier.returning = true;
    carrier.path = Array.from({ length: 19 }, (_, i) => ({ x: 18 - i, y: 10 }));
    carrier.step = 0;
    demolish(game, { x: 10, y: 10 }, { x: 10, y: 10 });
    runTicks(game, ticksToWalk(9));
    expect(game.roamers).toHaveLength(1);
    expect(game.roamers[0].path).toContainEqual({ x: 10, y: 13 });
  });

  it('vanishes when the way home is cut with no detour', () => {
    const game = carrierGame();
    const [carrier] = game.roamers;
    carrier.returning = true;
    carrier.path = Array.from({ length: 19 }, (_, i) => ({ x: 18 - i, y: 10 }));
    carrier.step = 0;
    demolish(game, { x: 10, y: 10 }, { x: 10, y: 10 });
    runTicks(game, ticksToWalk(9));
    expect(game.roamers).toEqual([]);
  });
});

describe('a peddler', () => {
  function market(): { game: GameState; vendor: Building } {
    const game = cityOf(20);
    placeBuilding(game, 'agora', 0, 11);
    placeBuilding(game, 'foodVendor', 0, 11);
    return { game, vendor: game.buildings[2] };
  }

  it('only sets out when his stall has food', () => {
    const { game, vendor } = market();
    runTicks(game, 2 * ROAMER_REST_TICKS);
    expect(game.roamers).toEqual([]);
    vendor.food = 100;
    runTicks(game, ROAMER_REST_TICKS);
    expect(game.roamers.map((r) => r.kind)).toEqual(['peddler']);
  });

  it('fills the houses he passes with 3 months of food from his stall', () => {
    const { game, vendor } = market();
    const hut = fullHouse(game, 4, 8);
    const shack = fullHouse(game, 8, 8);
    shack.level = 'shack';
    shack.residents = 16;
    shack.food = 2;
    vendor.food = 100;
    runTicks(game, ROAMER_REST_TICKS + ticksToWalk(10));
    expect(hut.food).toBe(hut.residents * 0.25 * 3);
    expect(shack.food).toBe(16 * 0.25 * 3);
    expect(vendor.food).toBe(100 - hut.food - 10);
  });

  it('hands out no more than the stall holds', () => {
    const { game, vendor } = market();
    const hut = fullHouse(game, 4, 8);
    vendor.food = 1;
    runTicks(game, ROAMER_REST_TICKS + ticksToWalk(10));
    expect(hut.food).toBe(1);
    expect(vendor.food).toBe(0);
  });
});

describe('a fleece peddler', () => {
  function market(): { game: GameState; vendor: Building } {
    const game = cityOf(20);
    placeBuilding(game, 'agora', 0, 11);
    placeBuilding(game, 'fleeceVendor', 0, 11);
    return { game, vendor: game.buildings[2] };
  }

  it('only sets out when his stall has fleece, and roams 44 tiles', () => {
    const { game, vendor } = market();
    vendor.food = 100;
    runTicks(game, 2 * ROAMER_REST_TICKS);
    expect(game.roamers).toEqual([]);
    vendor.fleece = 100;
    runTicks(game, ROAMER_REST_TICKS);
    expect(game.roamers.map((r) => r.kind)).toEqual(['fleecePeddler']);
    expect(ROAMER_SPECS.fleecePeddler.range).toBe(44);
  });

  it('fills the houses he passes with 3 months of fleece, 6 units, from his stall', () => {
    const { game, vendor } = market();
    const hut = fullHouse(game, 4, 8);
    const hovel = fullHouse(game, 8, 8);
    Object.assign(hovel, { level: 'hovel', residents: 24, fleece: 2 });
    vendor.fleece = 100;
    runTicks(game, ROAMER_REST_TICKS + ticksToWalk(10));
    expect(hut.fleece).toBe(6);
    expect(hovel.fleece).toBe(6);
    expect(vendor.fleece).toBe(100 - 6 - 4);
    expect(hut.food).toBe(0);
  });
});

describe('an oil peddler', () => {
  function market(): { game: GameState; vendor: Building } {
    const game = cityOf(20);
    placeBuilding(game, 'agora', 0, 11);
    placeBuilding(game, 'oilVendor', 0, 11);
    return { game, vendor: game.buildings[2] };
  }

  it('only sets out when his stall has oil, and roams 44 tiles', () => {
    const { game, vendor } = market();
    vendor.fleece = 100;
    runTicks(game, 2 * ROAMER_REST_TICKS);
    expect(game.roamers).toEqual([]);
    vendor.oil = 100;
    runTicks(game, ROAMER_REST_TICKS);
    expect(game.roamers.map((r) => r.kind)).toEqual(['oilPeddler']);
    expect(ROAMER_SPECS.oilPeddler.range).toBe(44);
  });

  it('fills the houses he passes with 3 months of oil, 6 units, from his stall', () => {
    const { game, vendor } = market();
    const hut = fullHouse(game, 4, 8);
    const tenement = fullHouse(game, 8, 8);
    Object.assign(tenement, { level: 'tenement', residents: 40, oil: 2 });
    vendor.oil = 100;
    runTicks(game, ROAMER_REST_TICKS + ticksToWalk(10));
    expect(hut.oil).toBe(6);
    expect(tenement.oil).toBe(6);
    expect(vendor.oil).toBe(100 - 6 - 4);
    expect(hut.fleece).toBe(0);
  });
});

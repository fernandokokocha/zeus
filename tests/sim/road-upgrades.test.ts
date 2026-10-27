import { describe, expect, it } from 'vitest';
import { appealMap } from '../../src/sim/appeal';
import { demolish, placeBuilding, placeRoad } from '../../src/sim/commands';
import { UNITS_PER_LOAD } from '../../src/sim/food';
import { HOUSE_LEVELS } from '../../src/sim/housing';
import { ROAD_UPGRADE_SPECS, upgradePlan, upgradeRoads } from '../../src/sim/road-upgrades';
import { tileIndex, type Building, type GameState, type Walk } from '../../src/sim/state';
import { WALKER_TILES_PER_TICK, walkPath } from '../../src/sim/walking';
import { grassGame, mainRoadGame } from './helpers';

const ROAD_Y = 20;
const loads = (count: number) => count * UNITS_PER_LOAD;
const at = (x: number) => ({ x, y: ROAD_Y });

function street(marbleLoads = 20): { game: GameState; storehouse: Building } {
  const game = grassGame(30);
  placeRoad(game, at(0), at(29));
  placeBuilding(game, 'storehouse', 20, 2);
  const storehouse = game.buildings[0];
  storehouse.marble = loads(marbleLoads);
  return { game, storehouse };
}

function fineStreet(marbleLoads = 20): { game: GameState; storehouse: Building } {
  const city = street(marbleLoads);
  placeBuilding(city.game, 'palace', 2, ROAD_Y + 1);
  placeBuilding(city.game, 'flowerGarden', 5, ROAD_Y - 2);
  return city;
}

const appealAt = (game: GameState, x: number) => appealMap(game)[tileIndex(game, x, ROAD_Y)];
const upgradeAt = (game: GameState, x: number) => game.roadUpgrades[tileIndex(game, x, ROAD_Y)];

describe('road upgrade numbers', () => {
  it('cost a load of marble; Pretty needs the Townhouse devolve appeal and radiates [2, 1]; Fast is 1.5× quicker', () => {
    expect(ROAD_UPGRADE_SPECS.pretty).toEqual({ name: 'Pretty road', marbleLoads: 1, minAppeal: 25, appeal: [2, 1], speed: 1 });
    expect(ROAD_UPGRADE_SPECS.fast).toEqual({ name: 'Fast road', marbleLoads: 1, minAppeal: null, appeal: [], speed: 1.5 });
    expect(ROAD_UPGRADE_SPECS.pretty.minAppeal).toBe(HOUSE_LEVELS.townhouse.appeal.devolve);
  });
});

describe('upgrading roads', () => {
  it('makes a road Fast anywhere, for a load of marble a tile', () => {
    const { game, storehouse } = street();
    expect(upgradeRoads(game, 'fast', at(3), at(5))).toEqual({ ok: true });
    expect([2, 3, 4, 5, 6].map((x) => upgradeAt(game, x))).toEqual([null, 'fast', 'fast', 'fast', null]);
    expect(storehouse.marble).toBe(loads(17));
  });

  it('makes a road Pretty only where its own appeal is at least 25', () => {
    const { game } = fineStreet();
    expect(appealAt(game, 8)).toBe(25);
    expect(appealAt(game, 9)).toBe(24);
    expect(upgradeRoads(game, 'pretty', at(9), at(9))).toEqual({ ok: false, reason: 'Pretty road needs appeal 25 (has 24)' });
    expect(upgradeRoads(game, 'pretty', at(8), at(8))).toEqual({ ok: true });
    expect(upgradeAt(game, 8)).toBe('pretty');
  });

  it('counts Pretty tiles taken earlier in the same drag, so a street grows outward from its best end', () => {
    const { game, storehouse } = fineStreet();
    upgradeRoads(game, 'pretty', at(5), at(12));
    expect([5, 6, 7, 8, 9, 10].map((x) => upgradeAt(game, x))).toEqual(['pretty', 'pretty', 'pretty', 'pretty', 'pretty', null]);
    expect(storehouse.marble).toBe(loads(15));
  });

  it('skips the Main Road, tiles already upgraded and ground without road', () => {
    const game = mainRoadGame(30);
    placeRoad(game, { x: 8, y: 15 }, { x: 12, y: 15 });
    placeBuilding(game, 'storehouse', 20, 2);
    game.buildings[0].marble = loads(20);
    upgradeRoads(game, 'fast', { x: 10, y: 15 }, { x: 10, y: 15 });
    const plan = upgradePlan(game, 'fast', { x: 6, y: 15 }, { x: 14, y: 15 });
    expect(plan.taken.map((p) => p.x)).toEqual([8, 9, 11, 12]);
    expect(plan.skipped.map(({ at, reason }) => [at.x, reason])).toEqual([
      [6, 'The Main Road cannot be upgraded'],
      [7, 'The Main Road cannot be upgraded'],
      [10, 'Already a fast road'],
      [13, 'An upgrade goes on a road'],
      [14, 'An upgrade goes on a road'],
    ]);
    expect(upgradeRoads(game, 'fast', { x: 13, y: 15 }, { x: 14, y: 15 })).toEqual({ ok: false, reason: 'An upgrade goes on a road' });
    expect(upgradeRoads(game, 'fast', { x: 0, y: 15 }, { x: 3, y: 15 })).toEqual({ ok: false, reason: 'The Main Road cannot be upgraded' });
  });

  it('needs marble in a storehouse, and a drag stops taking tiles when it runs out', () => {
    const { game, storehouse } = street(2);
    expect(upgradeRoads(game, 'fast', at(3), at(8))).toEqual({ ok: true });
    expect([3, 4, 5].map((x) => upgradeAt(game, x))).toEqual(['fast', 'fast', null]);
    expect(storehouse.marble).toBe(0);
    expect(upgradeRoads(game, 'fast', at(5), at(5))).toEqual({ ok: false, reason: 'No marble in storehouses' });
  });

  it('takes marble from the fullest storehouse first', () => {
    const { game, storehouse } = street(1);
    placeBuilding(game, 'storehouse', 24, 2);
    const fuller = game.buildings[1];
    fuller.marble = loads(3);
    upgradeRoads(game, 'fast', at(3), at(5));
    expect([fuller.marble, storehouse.marble]).toEqual([loads(0), loads(1)]);
  });

  it('books the marble as used for construction', () => {
    const { game } = street();
    upgradeRoads(game, 'fast', at(3), at(4));
    expect(game.flows.thisMonth.marble.used).toBe(loads(2));
  });
});

describe('a Pretty road', () => {
  it('radiates appeal [2, 1] from its tile', () => {
    const { game } = fineStreet();
    const before = appealMap(game);
    upgradeRoads(game, 'pretty', at(6), at(6));
    const after = appealMap(game);
    const gain = (x: number, y: number) => after[tileIndex(game, x, y)] - before[tileIndex(game, x, y)];
    expect([gain(6, ROAD_Y), gain(7, ROAD_Y - 1), gain(8, ROAD_Y), gain(6, ROAD_Y - 2), gain(9, ROAD_Y)]).toEqual([2, 2, 1, 1, 0]);
  });

  it('stays Pretty when the appeal around it drops', () => {
    const { game } = fineStreet();
    upgradeRoads(game, 'pretty', at(6), at(6));
    demolish(game, { x: 5, y: ROAD_Y - 2 }, { x: 6, y: ROAD_Y - 1 });
    expect(upgradeAt(game, 6)).toBe('pretty');
  });

  it('is gone when demolished, and road laid there again is regular', () => {
    const { game, storehouse } = fineStreet();
    upgradeRoads(game, 'pretty', at(6), at(6));
    demolish(game, at(6), at(6));
    expect(game.roads[tileIndex(game, 6, ROAD_Y)]).toBe(false);
    placeRoad(game, at(6), at(6));
    expect(upgradeAt(game, 6)).toBeNull();
    expect(storehouse.marble).toBe(loads(19));
  });
});

describe('a Fast road', () => {
  function walked(upgrade: boolean, ticks: number): Walk {
    const { game } = street();
    if (upgrade) upgradeRoads(game, 'fast', at(0), at(29));
    const walk = { path: Array.from({ length: 30 }, (_, x) => at(x)), step: 0, progress: 0 };
    for (let i = 0; i < ticks; i++) walkPath(game, walk, () => true, () => {});
    return walk;
  }

  it('moves walkers 1.5× faster while they are on it', () => {
    const ticks = Math.ceil(8 / WALKER_TILES_PER_TICK);
    expect(walked(false, ticks).step).toBe(8);
    expect(walked(true, ticks).step).toBe(12);
  });
});

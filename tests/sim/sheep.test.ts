import { describe, expect, it } from 'vitest';
import { TICKS_PER_MONTH } from '../../src/sim/clock';
import { demolish, placeBuilding, placeRoad, placeSheep } from '../../src/sim/commands';
import { CART_LOAD, UNITS_PER_LOAD } from '../../src/sim/food';
import { GRAZE_RADIUS, SHEARING_REST_TICKS, isPasture, sheepTile } from '../../src/sim/sheep';
import type { Building, GameState } from '../../src/sim/state';
import { tick } from '../../src/sim/tick';
import { STARTING_TREASURY } from '../../src/sim/treasury';
import { walkerTile } from '../../src/sim/walking';
import { meadowGame, placeHouse, runTicks, setTerrain } from './helpers';

function pasture(people = 100, size = 30): { game: GameState; shed: Building } {
  const game = meadowGame(size);
  placeRoad(game, { x: 0, y: 15 }, { x: size - 1, y: 15 });
  placeHouse(game, 0, size - 2);
  game.buildings[0].residents = people;
  placeBuilding(game, 'cardingShed', 2, 13);
  return { game, shed: game.buildings[1] };
}

function untilShepherdsGone(game: GameState): void {
  for (let i = 0; i < 2 * TICKS_PER_MONTH && game.shepherds.length > 0; i++) tick(game);
}

describe('placeSheep', () => {
  it('puts a sheep with a full fleece on open meadow for 4 dr', () => {
    const game = meadowGame();
    expect(placeSheep(game, { x: 5, y: 5 })).toEqual({ ok: true });
    expect(game.sheep).toHaveLength(1);
    expect(game.sheep[0]).toMatchObject({ home: { x: 5, y: 5 }, fleece: 1 });
    expect(game.treasury).toBe(STARTING_TREASURY - 4);
  });

  it('refuses grass', () => {
    const game = meadowGame();
    setTerrain(game, 5, 5, 'grass');
    expect(placeSheep(game, { x: 5, y: 5 })).toEqual({ ok: false, reason: 'Sheep graze on open meadow' });
  });

  it('refuses roads, buildings, rock, water and the map edge', () => {
    const game = meadowGame();
    placeRoad(game, { x: 2, y: 2 }, { x: 2, y: 2 });
    placeBuilding(game, 'park', 4, 4);
    setTerrain(game, 6, 6, 'marble');
    setTerrain(game, 7, 7, 'water');
    const refused = { ok: false, reason: 'Sheep graze on open meadow' };
    expect(placeSheep(game, { x: 2, y: 2 })).toEqual(refused);
    expect(placeSheep(game, { x: 4, y: 4 })).toEqual(refused);
    expect(placeSheep(game, { x: 6, y: 6 })).toEqual(refused);
    expect(placeSheep(game, { x: 7, y: 7 })).toEqual(refused);
    expect(placeSheep(game, { x: -1, y: 7 })).toEqual({ ok: false, reason: 'Outside the map' });
    expect(game.sheep).toEqual([]);
  });
});

describe('a sheep', () => {
  it(`grazes about, never more than ${GRAZE_RADIUS} tiles from where it was placed, and off the road`, () => {
    const game = meadowGame();
    placeRoad(game, { x: 0, y: 11 }, { x: 19, y: 11 });
    placeSheep(game, { x: 10, y: 10 });
    const visited = new Set<string>();
    for (let i = 0; i < 6 * TICKS_PER_MONTH; i++) {
      tick(game);
      const at = walkerTile(game.sheep[0]);
      visited.add(`${at.x},${at.y}`);
      expect(Math.max(Math.abs(at.x - 10), Math.abs(at.y - 10))).toBeLessThanOrEqual(GRAZE_RADIUS);
      expect(isPasture(game, at)).toBe(true);
    }
    expect(visited.size).toBeGreaterThan(5);
  });

  it('stays on the meadow', () => {
    const game = meadowGame();
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) if (x > 10 || y > 10) setTerrain(game, x, y, 'grass');
    placeSheep(game, { x: 10, y: 10 });
    for (let i = 0; i < 6 * TICKS_PER_MONTH; i++) {
      tick(game);
      expect(isPasture(game, walkerTile(game.sheep[0]))).toBe(true);
    }
  });

  it('regrows its fleece in a year', () => {
    const game = meadowGame();
    placeSheep(game, { x: 10, y: 10 });
    game.sheep[0].fleece = 0;
    runTicks(game, 6 * TICKS_PER_MONTH);
    expect(game.sheep[0].fleece).toBeCloseTo(0.5, 3);
    runTicks(game, 8 * TICKS_PER_MONTH);
    expect(game.sheep[0].fleece).toBe(1);
  });

  it('walks off a tile that is built over', () => {
    const game = meadowGame();
    placeSheep(game, { x: 5, y: 5 });
    placeBuilding(game, 'fountain', 5, 5);
    runTicks(game, 20);
    expect(isPasture(game, walkerTile(game.sheep[0]))).toBe(true);
  });

  it('is lost when built over with nowhere to go', () => {
    const game = meadowGame();
    placeSheep(game, { x: 0, y: 0 });
    placeBuilding(game, 'flowerGarden', 0, 0);
    tick(game);
    expect(game.sheep).toEqual([]);
  });

  it('is removed by demolish', () => {
    const game = meadowGame();
    placeSheep(game, { x: 5, y: 5 });
    placeSheep(game, { x: 12, y: 12 });
    demolish(game, { x: 4, y: 4 }, { x: 6, y: 6 });
    expect(game.sheep.map((s) => s.home)).toEqual([{ x: 12, y: 12 }]);
  });
});

describe('a carding shed', () => {
  it('sends its shepherd 1.5 months after it is staffed', () => {
    const { game, shed } = pasture();
    placeSheep(game, { x: 10, y: 10 });
    expect(SHEARING_REST_TICKS).toBe(1.5 * TICKS_PER_MONTH);
    runTicks(game, SHEARING_REST_TICKS - 1);
    expect(game.shepherds).toEqual([]);
    tick(game);
    expect(game.shepherds).toHaveLength(1);
    expect(game.shepherds[0]).toMatchObject({ homeId: shed.id, sheepId: game.sheep[0].id, returning: false, fleece: 0 });
    expect(game.shepherds[0].path[0]).toEqual({ x: 3, y: 15 });
  });

  it('takes twice as long at half staff', () => {
    const { game } = pasture(8);
    placeSheep(game, { x: 10, y: 10 });
    runTicks(game, 2 * SHEARING_REST_TICKS - 1);
    expect(game.shepherds).toEqual([]);
    tick(game);
    expect(game.shepherds).toHaveLength(1);
  });

  it('does nothing without workers', () => {
    const { game } = pasture(0);
    placeSheep(game, { x: 10, y: 10 });
    runTicks(game, 3 * SHEARING_REST_TICKS);
    expect(game.shepherds).toEqual([]);
  });

  it('shears the sheep across open ground and brings a load of fleece home', () => {
    const { game, shed } = pasture();
    placeBuilding(game, 'flowerGarden', 6, 11);
    placeSheep(game, { x: 10, y: 10 });
    const sheep = game.sheep[0];
    runTicks(game, SHEARING_REST_TICKS);
    const shepherd = game.shepherds[0];
    expect(shepherd.path.some((p) => !game.roads[p.y * game.size + p.x])).toBe(true);
    expect(shepherd.path.every((p) => game.buildingIdAt[p.y * game.size + p.x] === 0)).toBe(true);
    expect(shepherd.path.at(-1)).toEqual(sheepTile(sheep));
    for (let i = 0; i < TICKS_PER_MONTH && !shepherd.returning; i++) tick(game);
    expect(sheep.fleece).toBe(0);
    expect(shepherd.fleece).toBe(UNITS_PER_LOAD);
    untilShepherdsGone(game);
    expect(shed.fleece).toBe(UNITS_PER_LOAD);
  });

  it('goes to the nearest sheep with a full fleece', () => {
    const { game } = pasture();
    placeSheep(game, { x: 20, y: 10 });
    placeSheep(game, { x: 8, y: 10 });
    placeSheep(game, { x: 4, y: 10 });
    game.sheep[2].fleece = 0.5;
    runTicks(game, SHEARING_REST_TICKS);
    expect(game.shepherds[0].sheepId).toBe(game.sheep[1].id);
  });

  it('leaves a sheep alone while another shepherd is after it', () => {
    const { game } = pasture();
    placeBuilding(game, 'cardingShed', 20, 13);
    placeSheep(game, { x: 10, y: 10 });
    runTicks(game, SHEARING_REST_TICKS);
    expect(game.shepherds).toHaveLength(1);
  });

  it('stands its sheep still while the shepherd comes', () => {
    const { game } = pasture();
    placeSheep(game, { x: 10, y: 10 });
    runTicks(game, SHEARING_REST_TICKS);
    const target = sheepTile(game.sheep[0]);
    runTicks(game, 30);
    expect(walkerTile(game.sheep[0])).toEqual(target);
  });

  it('does not reach for sheep more than 40 tiles away', () => {
    const { game } = pasture(100, 60);
    placeSheep(game, { x: 48, y: 10 });
    runTicks(game, 2 * SHEARING_REST_TICKS);
    expect(game.shepherds).toEqual([]);
    placeSheep(game, { x: 38, y: 10 });
    tick(game);
    expect(game.shepherds).toHaveLength(1);
  });

  it('keeps its shepherd home while it holds 4 loads', () => {
    const { game, shed } = pasture();
    placeSheep(game, { x: 10, y: 10 });
    shed.fleece = CART_LOAD;
    runTicks(game, 2 * SHEARING_REST_TICKS);
    expect(game.shepherds).toEqual([]);
  });

  it('calls its shepherd home empty-handed when his sheep is demolished', () => {
    const { game, shed } = pasture();
    placeSheep(game, { x: 10, y: 10 });
    runTicks(game, SHEARING_REST_TICKS + 5);
    demolish(game, { x: 7, y: 7 }, { x: 13, y: 13 });
    tick(game);
    expect(game.shepherds[0].returning).toBe(true);
    untilShepherdsGone(game);
    expect(shed.fleece).toBe(0);
  });

  it('takes its shepherd with it when demolished', () => {
    const { game } = pasture();
    placeSheep(game, { x: 10, y: 10 });
    runTicks(game, SHEARING_REST_TICKS + 5);
    demolish(game, { x: 2, y: 13 }, { x: 2, y: 13 });
    expect(game.shepherds).toEqual([]);
  });

  it('turns its shepherd around a building put in his way', () => {
    const { game, shed } = pasture();
    placeSheep(game, { x: 10, y: 10 });
    runTicks(game, SHEARING_REST_TICKS);
    const shepherd = game.shepherds[0];
    const ahead = shepherd.path[shepherd.path.length - 3];
    expect(placeBuilding(game, 'park', ahead.x, ahead.y).ok).toBe(true);
    untilShepherdsGone(game);
    expect(shed.fleece).toBe(UNITS_PER_LOAD);
  });
});

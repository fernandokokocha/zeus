import { describe, expect, it } from 'vitest';
import { TICKS_PER_MONTH } from '../../src/sim/clock';
import { checkBuildingPlacement, demolish, placeBuilding, placeRoad } from '../../src/sim/commands';
import { population } from '../../src/sim/settlers';
import { FIRE_BURN_TICKS, RISK_LIMIT, isBurning, riskShare } from '../../src/sim/safety';
import type { Building, GameState } from '../../src/sim/state';
import { ROAMER_REST_TICKS, ROAMER_SPECS } from '../../src/sim/roamers';
import { WALKER_TILES_PER_TICK } from '../../src/sim/walking';
import { tick } from '../../src/sim/tick';
import { grassGame, placeHouse, runTicks, setMeadow } from './helpers';

function buildingAt(game: GameState, x: number, y: number): Building {
  const building = game.buildings.find((b) => b.id === game.buildingIdAt[y * game.size + x]);
  if (!building) throw new Error(`No building at ${x}, ${y}`);
  return building;
}

function occupiedHouse(game: GameState, x: number, y: number, residents = 8): Building {
  placeHouse(game, x, y);
  const house = buildingAt(game, x, y);
  house.residents = residents;
  return house;
}

function ruinsIn(game: GameState): Building[] {
  return game.buildings.filter((b) => b.type === 'ruins');
}

function monthsOf(risk: number): number {
  return risk / TICKS_PER_MONTH;
}

function setOnFire(game: GameState, building: Building): void {
  building.fireRisk = RISK_LIMIT * TICKS_PER_MONTH;
  tick(game);
}

describe('fire risk', () => {
  it('builds up by its increment each month', () => {
    const game = grassGame();
    placeBuilding(game, 'taxOffice', 4, 4);
    runTicks(game, 2 * TICKS_PER_MONTH);
    expect(monthsOf(game.buildings[0].fireRisk)).toBe(10);
    expect(riskShare(game.buildings[0].fireRisk)).toBeCloseTo(10 / 60);
  });

  it('burns a Tax Office after 12 months, leaving burning ruins on each of its tiles', () => {
    const game = grassGame();
    placeBuilding(game, 'taxOffice', 4, 4);
    runTicks(game, 12 * TICKS_PER_MONTH - 1);
    expect(game.buildings.map((b) => b.type)).toEqual(['taxOffice']);
    tick(game);
    const ruins = ruinsIn(game);
    expect(ruins.map((r) => [r.x, r.y])).toEqual([[4, 4], [5, 4], [4, 5], [5, 5]]);
    expect(game.buildings).toHaveLength(4);
    expect(ruins.every((r) => isBurning(game, r))).toBe(true);
  });

  it('builds up nothing in a vacant lot', () => {
    const game = grassGame();
    placeHouse(game, 4, 4);
    runTicks(game, 10 * TICKS_PER_MONTH);
    expect(game.buildings[0]).toMatchObject({ type: 'house', fireRisk: 0 });
  });

  it('burns an occupied house after 7.5 months, and its residents are gone', () => {
    const game = grassGame();
    occupiedHouse(game, 4, 4);
    runTicks(game, 7.5 * TICKS_PER_MONTH - 1);
    expect(population(game)).toBe(8);
    tick(game);
    expect(ruinsIn(game)).toHaveLength(4);
    expect(population(game)).toBe(0);
  });

  it('never touches a Park', () => {
    const game = grassGame();
    placeBuilding(game, 'park', 4, 4);
    runTicks(game, 24 * TICKS_PER_MONTH);
    expect(game.buildings[0]).toMatchObject({ type: 'park', fireRisk: 0, collapseRisk: 0 });
  });

  it("takes a destroyed farm's cart pusher with it", () => {
    const game = grassGame();
    setMeadow(game, 4, 4, 3, 3);
    placeRoad(game, { x: 0, y: 10 }, { x: 19, y: 10 });
    placeRoad(game, { x: 3, y: 4 }, { x: 3, y: 9 });
    placeBuilding(game, 'wheatFarm', 4, 4);
    game.carriers.push({
      id: 1, kind: 'cartPusher', homeId: game.buildings[0].id, destinationId: 0,
      food: 400, fleece: 0, olives: 0, oil: 0, returning: false, path: [{ x: 3, y: 5 }], step: 0, progress: 0,
    });
    setOnFire(game, game.buildings[0]);
    expect(game.carriers).toEqual([]);
  });
});

describe('collapse risk', () => {
  it('brings a Fountain down after 7.5 months into rubble that does not burn', () => {
    const game = grassGame();
    placeBuilding(game, 'fountain', 4, 4);
    runTicks(game, 7.5 * TICKS_PER_MONTH - 1);
    expect(game.buildings[0].type).toBe('fountain');
    expect(game.buildings[0].fireRisk).toBe(0);
    tick(game);
    const ruins = ruinsIn(game);
    expect(ruins).toHaveLength(4);
    expect(ruins.some((r) => isBurning(game, r))).toBe(false);
  });

  it('takes the vendors of a collapsing agora with it', () => {
    const game = grassGame();
    placeBuilding(game, 'agora', 4, 4);
    placeBuilding(game, 'foodVendor', 4, 4);
    runTicks(game, 10 * TICKS_PER_MONTH);
    expect(game.buildings.map((b) => b.type)).toEqual(Array(18).fill('ruins'));
  });
});

describe('ruins', () => {
  it('block building until demolished', () => {
    const game = grassGame();
    placeBuilding(game, 'fountain', 4, 4);
    runTicks(game, 7.5 * TICKS_PER_MONTH);
    expect(checkBuildingPlacement(game, 'park', 5, 5).obstacle).toBe('A building is in the way');
    const treasury = game.treasury;
    demolish(game, { x: 4, y: 4 }, { x: 5, y: 5 });
    expect(game.buildings).toEqual([]);
    expect(game.treasury).toBe(treasury);
    expect(placeBuilding(game, 'park', 5, 5)).toEqual({ ok: true });
  });

  it('burn out after 2 months', () => {
    const game = grassGame();
    placeBuilding(game, 'taxOffice', 4, 4);
    setOnFire(game, game.buildings[0]);
    runTicks(game, FIRE_BURN_TICKS - 1);
    expect(isBurning(game, ruinsIn(game)[0])).toBe(true);
    tick(game);
    expect(isBurning(game, ruinsIn(game)[0])).toBe(false);
  });
});

describe('fire spread', () => {
  it('sets a neighbouring house alight within a month', () => {
    const game = grassGame();
    const burning = occupiedHouse(game, 4, 4);
    const neighbour = occupiedHouse(game, 6, 4);
    setOnFire(game, burning);
    runTicks(game, TICKS_PER_MONTH / 4);
    expect(monthsOf(neighbour.fireRisk)).toBeGreaterThan(2 * 60 / 4);
    runTicks(game, TICKS_PER_MONTH);
    expect(ruinsIn(game)).toHaveLength(8);
  });

  it('spares a house two tiles away and buildings that cannot burn', () => {
    const game = grassGame();
    const burning = occupiedHouse(game, 4, 4);
    const fountain = (placeBuilding(game, 'fountain', 6, 4), buildingAt(game, 6, 4));
    const farHouse = occupiedHouse(game, 4, 7);
    setOnFire(game, burning);
    runTicks(game, FIRE_BURN_TICKS);
    expect(fountain.fireRisk).toBe(0);
    expect(game.buildings).toContain(fountain);
    expect(monthsOf(farHouse.fireRisk)).toBeCloseTo((8 * (FIRE_BURN_TICKS + 1)) / TICKS_PER_MONTH);
  });

  it('stops once the fire burns out', () => {
    const game = grassGame();
    const burning = occupiedHouse(game, 4, 4);
    setOnFire(game, burning);
    runTicks(game, FIRE_BURN_TICKS);
    const neighbour = occupiedHouse(game, 6, 4);
    runTicks(game, TICKS_PER_MONTH);
    expect(monthsOf(neighbour.fireRisk)).toBe(8);
  });
});

describe('a Maintenance Office', () => {
  function staffedOffice(): GameState {
    const game = grassGame();
    placeRoad(game, { x: 0, y: 10 }, { x: 19, y: 10 });
    occupiedHouse(game, 18, 18, 20);
    placeBuilding(game, 'maintenanceOffice', 0, 11);
    return game;
  }

  function ticksToWalk(tiles: number): number {
    return Math.ceil(tiles / WALKER_TILES_PER_TICK);
  }

  it('sends a superintendent once staffed and rested', () => {
    const game = staffedOffice();
    runTicks(game, ROAMER_REST_TICKS);
    expect(game.roamers).toMatchObject([{ kind: 'superintendent', homeId: game.buildings[1].id }]);
    expect(ROAMER_SPECS.superintendent.range).toBe(44);
  });

  it('resets both risks of buildings within 2 tiles of his road', () => {
    const game = staffedOffice();
    const beside = occupiedHouse(game, 4, 11);
    placeBuilding(game, 'fountain', 8, 7);
    const twoAway = buildingAt(game, 8, 7);
    const threeAway = occupiedHouse(game, 12, 13);
    for (const building of [beside, twoAway, threeAway]) Object.assign(building, { fireRisk: 9000, collapseRisk: 9000 });
    runTicks(game, ROAMER_REST_TICKS + ticksToWalk(15));
    expect(beside.fireRisk).toBeLessThan(1000);
    expect(twoAway.collapseRisk).toBeLessThan(1000);
    expect(threeAway.fireRisk).toBeGreaterThan(9000);
  });

  it('has his superintendent put out fires he passes', () => {
    const game = staffedOffice();
    placeBuilding(game, 'taxOffice', 8, 8);
    setOnFire(game, buildingAt(game, 8, 8));
    runTicks(game, ROAMER_REST_TICKS + ticksToWalk(10));
    expect(ruinsIn(game)).toHaveLength(4);
    expect(ruinsIn(game).some((r) => isBurning(game, r))).toBe(false);
  });

  it('keeps a street of houses standing for years', () => {
    const game = staffedOffice();
    for (let x = 2; x < 14; x += 2) occupiedHouse(game, x, 8);
    runTicks(game, 3 * 12 * TICKS_PER_MONTH);
    expect(ruinsIn(game).filter((r) => r.y < 10)).toEqual([]);
  });
});

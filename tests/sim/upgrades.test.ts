import { describe, expect, it } from 'vitest';
import { TICKS_PER_MONTH } from '../../src/sim/clock';
import { placeBuilding, placeRoad } from '../../src/sim/commands';
import { houseTax } from '../../src/sim/economy';
import { workforce } from '../../src/sim/labor';
import { BUILDING_SPECS } from '../../src/sim/buildings';
import { farmLoadsPerYear, granaryCapacity } from '../../src/sim/food';
import { baysOf, slotsUsed, storehouseSpace } from '../../src/sim/storehouse';
import type { Building, GameState } from '../../src/sim/state';
import { tick } from '../../src/sim/tick';
import { productionReport } from '../../src/sim/production';
import { roundTripMonths } from '../../src/sim/trade';
import { UPGRADES, UPGRADE_NAMES, buyUpgrade, hasUpgrade } from '../../src/sim/upgrades';
import { grassGame, meadowGame, placeHouse, placedScholars, runTicks, setMeadow, supplyScholars } from './helpers';

function untilMonthEnd(game: GameState): void {
  while (game.tick % TICKS_PER_MONTH !== TICKS_PER_MONTH - 1) tick(game);
  tick(game);
}

function owning(game: GameState, ...upgrades: (typeof UPGRADES)[number][]): GameState {
  game.worksOfArt += upgrades.length;
  for (const upgrade of upgrades) expect(buyUpgrade(game, upgrade)).toEqual({ ok: true });
  return game;
}

describe('buying an upgrade', () => {
  it('spends one Work of Art and keeps the upgrade', () => {
    const game = grassGame();
    game.worksOfArt = 2;
    expect(buyUpgrade(game, 'democracy')).toEqual({ ok: true });
    expect(game.worksOfArt).toBe(1);
    expect(hasUpgrade(game, 'democracy')).toBe(true);
    expect(hasUpgrade(game, 'plutocracy')).toBe(false);
  });

  it('needs a Work of Art', () => {
    const game = grassGame();
    expect(buyUpgrade(game, 'democracy')).toEqual({ ok: false, reason: 'Needs a Work of Art' });
    expect(hasUpgrade(game, 'democracy')).toBe(false);
  });

  it('happens once', () => {
    const game = owning(grassGame(), 'democracy');
    game.worksOfArt = 1;
    expect(buyUpgrade(game, 'democracy')).toEqual({ ok: false, reason: 'Already owned' });
    expect(game.worksOfArt).toBe(1);
  });

  it('offers eight, each costing one Work of Art', () => {
    expect(UPGRADES.map((u) => UPGRADE_NAMES[u])).toEqual([
      'The Lyceum',
      'Works and Days',
      "Demeter's Furrows",
      'Daukos',
      'Arcadian Mules',
      'Kerameikos',
      'Ekklesia',
      'Laws of Solon',
    ]);
  });
});

describe('Lyceum', () => {
  it('makes a Work of Art of 75 pages', () => {
    const { game, scholars } = placedScholars();
    owning(game, 'lyceum');
    supplyScholars(scholars);
    scholars.pages = 70;
    untilMonthEnd(game);
    expect(game.worksOfArt).toBe(1);
    expect(scholars.pages).toBe(3);
  });
});

describe('Crop rotation', () => {
  it('raises a full harvest from 8 loads to 10', () => {
    const game = grassGame(30);
    placeRoad(game, { x: 0, y: 15 }, { x: 29, y: 15 });
    setMeadow(game, 2, 12, 3, 3);
    placeBuilding(game, 'wheatFarm', 2, 12);
    const farm = game.buildings[0];
    owning(game, 'cropRotation');
    runTicks(game, 6 * TICKS_PER_MONTH - 1);
    farm.growth = 1;
    tick(game);
    expect(farm.food).toBe(1000);
  });
});

describe('Democracy', () => {
  it('puts 60% of residents to work', () => {
    const game = grassGame();
    placeRoad(game, { x: 0, y: 10 }, { x: 19, y: 10 });
    placeHouse(game, 0, 18);
    game.buildings[0].residents = 100;
    expect(workforce(game)).toBe(52);
    owning(game, 'democracy');
    expect(workforce(game)).toBe(60);
  });
});

describe('Plutocracy', () => {
  it('raises taxes by a quarter', () => {
    const game = grassGame();
    placeRoad(game, { x: 0, y: 10 }, { x: 19, y: 10 });
    placeHouse(game, 2, 8);
    const house = game.buildings[0];
    house.residents = 8;
    expect(houseTax(game, house)).toBeCloseTo(8 * 0.09);
    owning(game, 'plutocracy');
    expect(houseTax(game, house)).toBeCloseTo(8 * 0.09 * 1.25);
  });
});

describe('Pack mules', () => {
  it('speeds caravans from 40 km a month to 60', () => {
    const game = grassGame();
    expect(roundTripMonths(game, 'sparta')).toBe(9);
    owning(game, 'packMules');
    expect(roundTripMonths(game, 'sparta')).toBe(6);
  });
});

describe('Open fields', () => {
  it('lets a farm stand on a single meadow tile', () => {
    const game = grassGame();
    setMeadow(game, 5, 5, 1, 1);
    expect(placeBuilding(game, 'wheatFarm', 3, 3)).toEqual({ ok: false, reason: 'A wheat farm needs meadow' });
    owning(game, 'openFields');
    expect(placeBuilding(game, 'wheatFarm', 3, 3)).toEqual({ ok: true });
  });

  it('still needs one meadow tile', () => {
    const game = owning(grassGame(), 'openFields');
    expect(placeBuilding(game, 'wheatFarm', 3, 3)).toEqual({ ok: false, reason: 'A wheat farm needs meadow on one of its tiles' });
  });
});

describe('Amphoras', () => {
  function storehouseGame(): { game: GameState; storehouse: Building } {
    const game = grassGame();
    placeRoad(game, { x: 0, y: 10 }, { x: 19, y: 10 });
    placeBuilding(game, 'storehouse', 2, 7);
    return { game, storehouse: game.buildings[0] };
  }

  it('makes a storehouse slot of oil or olives hold 6 loads', () => {
    const { game, storehouse } = storehouseGame();
    storehouse.oil = 600;
    storehouse.olives = 500;
    storehouse.fleece = 500;
    expect(slotsUsed(game, storehouse)).toBe(6);
    owning(game, 'amphoras');
    expect(slotsUsed(game, storehouse)).toBe(4);
    expect(baysOf(game, storehouse).map((bay) => [bay.good, bay.loads, bay.capacity])).toEqual([
      ['fleece', 4, 4],
      ['fleece', 1, 4],
      ['olives', 5, 6],
      ['oil', 6, 6],
    ]);
  });

  it('gives an oil cart room for 6 loads in a slot', () => {
    const { game, storehouse } = storehouseGame();
    storehouse.marble = 7 * 400;
    storehouse.oil = 400;
    expect(storehouseSpace(game, storehouse, 'oil')).toBe(0);
    owning(game, 'amphoras');
    expect(storehouseSpace(game, storehouse, 'oil')).toBe(200);
    expect(storehouseSpace(game, storehouse, 'marble')).toBe(0);
  });

  it('makes a granary hold 48 loads', () => {
    const game = grassGame();
    expect(granaryCapacity(game)).toBe(3200);
    owning(game, 'amphoras');
    expect(granaryCapacity(game)).toBe(4800);
  });
});

describe('Carrots', () => {
  function carrotGame(): GameState {
    const game = grassGame(30);
    placeRoad(game, { x: 0, y: 15 }, { x: 29, y: 15 });
    placeHouse(game, 0, 28);
    game.buildings[0].residents = 100;
    setMeadow(game, 2, 12, 3, 3);
    return game;
  }

  it('unlocks the Carrot Farm, the Wheat Farm’s twin', () => {
    const game = carrotGame();
    expect(placeBuilding(game, 'carrotFarm', 2, 12)).toEqual({ ok: false, reason: 'Unlocked by the Carrots upgrade' });
    owning(game, 'carrots');
    expect(placeBuilding(game, 'carrotFarm', 2, 12)).toEqual({ ok: true });
    const { name, ...rest } = BUILDING_SPECS.carrotFarm;
    const { name: wheat, ...wheatRest } = BUILDING_SPECS.wheatFarm;
    expect([name, wheat]).toEqual(['Carrot Farm', 'Wheat Farm']);
    expect(rest).toEqual(wheatRest);
  });

  it('needs meadow', () => {
    const game = owning(carrotGame(), 'carrots');
    expect(placeBuilding(game, 'carrotFarm', 10, 2)).toEqual({ ok: false, reason: 'A carrot farm needs meadow' });
  });

  it('harvests on the first of January, not in July', () => {
    const game = owning(carrotGame(), 'carrots');
    placeBuilding(game, 'carrotFarm', 2, 12);
    const farm = game.buildings[1];
    runTicks(game, 6 * TICKS_PER_MONTH - 1);
    farm.growth = 1;
    tick(game);
    expect(farm.food).toBe(0);
    expect(farm.growth).toBeGreaterThan(1);
    runTicks(game, 6 * TICKS_PER_MONTH - 1);
    expect(farm.food).toBe(0);
    farm.growth = 1;
    tick(game);
    expect(farm.food).toBe(800);
    expect(farm.growth).toBe(0);
  });

  it('sends its harvest to a granary by cart', () => {
    const game = owning(carrotGame(), 'carrots');
    placeBuilding(game, 'carrotFarm', 2, 12);
    placeBuilding(game, 'granary', 10, 11);
    const [, farm, granary] = game.buildings;
    farm.food = 800;
    tick(game);
    expect(game.carriers[0]).toMatchObject({ kind: 'carrotCart', homeId: farm.id, destinationId: granary.id, food: 400 });
  });

  it('yields 10 loads with Crop rotation and needs one meadow tile with Open fields', () => {
    const game = owning(grassGame(), 'carrots', 'openFields', 'cropRotation');
    setMeadow(game, 5, 5, 1, 1);
    expect(placeBuilding(game, 'carrotFarm', 3, 3)).toEqual({ ok: true });
    expect(farmLoadsPerYear(game)).toBe(10);
  });
});

describe('the Production chapter', () => {
  it('counts what a farm could make with Crop rotation', () => {
    const game = owning(meadowGame(40), 'carrots', 'cropRotation');
    placeRoad(game, { x: 0, y: 15 }, { x: 39, y: 15 });
    placeHouse(game, 0, 30);
    game.buildings[0].residents = 60;
    placeBuilding(game, 'carrotFarm', 10, 12);
    runTicks(game, TICKS_PER_MONTH);
    expect(productionReport(game).goods.find((g) => g.good === 'food')?.possible).toBeCloseTo(1000 / 12);
  });
});

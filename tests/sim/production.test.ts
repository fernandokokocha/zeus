import { describe, expect, it } from 'vitest';
import { BUILDING_SPECS, type BuildingType } from '../../src/sim/buildings';
import { TICKS_PER_MONTH } from '../../src/sim/clock';
import { demolish, placeBuilding, placeRoad, placeSheep } from '../../src/sim/commands';
import { UNITS_PER_LOAD } from '../../src/sim/food';
import { CASTING_TICKS } from '../../src/sim/materials';
import { PRESSING_TICKS, OIL_LOADS_PER_YEAR } from '../../src/sim/olives';
import { WEAVING_TICKS } from '../../src/sim/cloth';
import { copyingTicks } from '../../src/sim/scrolls';
import { setIndustryOpen } from '../../src/sim/labor';
import { productionReport, productionStatus, type GoodReport } from '../../src/sim/production';
import { materialNeeded } from '../../src/sim/sanctuaries';
import type { GameState, Good } from '../../src/sim/state';
import { tick } from '../../src/sim/tick';
import { grassGame, meadowGame, placeHouse, runTicks, setMeadow, setTerrain } from './helpers';

const loads = (count: number) => count * UNITS_PER_LOAD;

function town(people = 200, size = 40): GameState {
  const game = grassGame(size);
  placeRoad(game, { x: 0, y: 15 }, { x: size - 1, y: 15 });
  placeHouse(game, 0, size - 2);
  game.buildings[0].residents = people;
  return game;
}

function place(game: GameState, type: BuildingType, x: number, y: number) {
  expect(placeBuilding(game, type, x, y)).toEqual({ ok: true });
  return game.buildings[game.buildings.length - 1];
}

function until(game: GameState, done: () => boolean): void {
  for (let i = 0; i < 6 * TICKS_PER_MONTH && !done(); i++) tick(game);
  expect(done()).toBe(true);
}

function runMaintained(game: GameState, months: number): void {
  for (let month = 0; month < months; month++) {
    for (const building of game.buildings) Object.assign(building, { fireRisk: 0, collapseRisk: 0 });
    runTicks(game, TICKS_PER_MONTH);
  }
}

function untilMonthEnds(game: GameState): void {
  do tick(game);
  while (game.tick % TICKS_PER_MONTH !== 0);
}

function row(game: GameState, good: Good): GoodReport {
  const found = productionReport(game).goods.find((g) => g.good === good);
  if (!found) throw new Error(`No row for ${good}`);
  return found;
}

describe('the production report', () => {
  it('has a row per good, in the order goods are made', () => {
    expect(productionReport(grassGame()).goods.map(({ name }) => name)).toEqual([
      'Food', 'Fleece', 'Olives', 'Oil', 'Fine cloth', 'Papyrus', 'Scrolls', 'Wood', 'Marble', 'Bronze', 'Sculptures', 'Armor',
    ]);
  });

  it('starts empty and idle', () => {
    expect(row(grassGame(), 'oil')).toEqual({
      good: 'oil', name: 'Oil', made: 0, possible: 0, used: 0, wanted: 0, stock: 0, status: 'idle',
    });
  });

  it('changes only when a month is settled', () => {
    const game = town();
    const press = place(game, 'olivePress', 10, 13);
    press.olives = loads(1);
    runTicks(game, PRESSING_TICKS);
    expect(press.oil).toBe(loads(1));
    expect(row(game, 'oil').made).toBe(loads(1));
    const settled = productionReport(game);
    press.olives = loads(1);
    runTicks(game, TICKS_PER_MONTH - 1);
    expect(press.oil).toBe(loads(1));
    expect(productionReport(game)).toEqual(settled);
  });
});

describe('what was made', () => {
  it('counts the harvest', () => {
    const game = town();
    setMeadow(game, 2, 12, 3, 3);
    place(game, 'wheatFarm', 2, 12);
    runTicks(game, 6 * TICKS_PER_MONTH);
    expect(row(game, 'food').made).toBe(loads(4));
  });

  it('counts the fleece a shepherd brings home', () => {
    const game = meadowGame(30);
    placeRoad(game, { x: 0, y: 15 }, { x: 29, y: 15 });
    placeHouse(game, 0, 28);
    game.buildings[0].residents = 100;
    const shed = place(game, 'cardingShed', 2, 13);
    placeSheep(game, { x: 10, y: 10 });
    until(game, () => shed.fleece > 0);
    untilMonthEnds(game);
    expect(row(game, 'fleece').made).toBe(loads(1));
  });

  it('counts the wood a lumberjack brings home', () => {
    const game = town();
    setTerrain(game, 10, 10, 'forest');
    const mill = place(game, 'timberMill', 2, 13);
    until(game, () => mill.wood > 0);
    untilMonthEnds(game);
    expect(row(game, 'wood').made).toBe(loads(1));
  });

  it('counts the oil pressed and the olives it took', () => {
    const game = town();
    const press = place(game, 'olivePress', 10, 13);
    press.olives = loads(1);
    runTicks(game, PRESSING_TICKS);
    expect(row(game, 'oil').made).toBe(loads(1));
    expect(row(game, 'olives').used).toBe(loads(1));
  });

  it('counts the cloth woven and the fleece it took', () => {
    const game = town();
    const weaver = place(game, 'weaver', 10, 13);
    weaver.fleece = loads(1);
    runTicks(game, WEAVING_TICKS);
    expect(row(game, 'cloth').made).toBe(loads(1));
    expect(row(game, 'fleece').used).toBe(loads(1));
  });

it('counts the scrolls copied and the papyrus and fleece they took', () => {
  const game = town();
  const scriptorium = place(game, 'scriptorium', 10, 13);
  Object.assign(scriptorium, { papyrus: loads(3), fleece: loads(10) });
  runTicks(game, 3 * copyingTicks('papyrus') + 10 * copyingTicks('fleece'));
  expect(row(game, 'scrolls').made).toBe(loads(1));
  expect(row(game, 'papyrus').used).toBe(loads(3));
  expect(row(game, 'fleece').used).toBe(loads(10));
});

it('counts the sculptures cast and the bronze they took', () => {
    const game = town();
    const studio = place(game, 'sculptureStudio', 10, 13);
    studio.bronze = loads(4);
    runTicks(game, CASTING_TICKS);
    expect(row(game, 'sculptures').made).toBe(loads(1));
    expect(row(game, 'bronze').used).toBe(loads(4));
  });

  it('forgets a month twelve months later', () => {
    const game = town();
    const press = place(game, 'olivePress', 10, 13);
    press.olives = loads(1);
    runMaintained(game, PRESSING_TICKS / TICKS_PER_MONTH + 11);
    expect(row(game, 'oil').made).toBe(loads(1));
    runMaintained(game, 1);
    expect(row(game, 'oil').made).toBe(0);
  });
});

describe('what the buildings could make', () => {
  it('is each building’s full-staff rate for every month it stood', () => {
    const game = town(0);
    place(game, 'olivePress', 10, 13);
    runMaintained(game, 3);
    expect(row(game, 'oil').possible).toBeCloseTo(loads(OIL_LOADS_PER_YEAR) / 4);
    runMaintained(game, 9);
    place(game, 'olivePress', 14, 13);
    runMaintained(game, 12);
    expect(row(game, 'oil').possible).toBeCloseTo(2 * loads(OIL_LOADS_PER_YEAR));
  });

  it.each<[BuildingType, Good, number]>([
    ['wheatFarm', 'food', 8],
    ['cardingShed', 'fleece', 8],
    ['growersLodge', 'olives', 20],
    ['olivePress', 'oil', 6],
    ['weaver', 'cloth', 6],
    ['scriptorium', 'scrolls', 6],
    ['timberMill', 'wood', 13],
    ['masonryShop', 'marble', 12],
    ['foundry', 'bronze', 13],
    ['sculptureStudio', 'sculptures', 6],
    ['armory', 'armor', 6],
  ])('is %s: %s, %i loads a year', (type, good, perYear) => {
    const game = meadowGame(40);
    placeRoad(game, { x: 0, y: 15 }, { x: 39, y: 15 });
    place(game, type, 10, 15 - BUILDING_SPECS[type].height);
    runMaintained(game, 12);
    expect(row(game, good).possible).toBeCloseTo(loads(perYear));
  });
});

describe('what was used and wanted', () => {
  it('is what houses ate, against what they needed', () => {
    const game = grassGame();
    placeHouse(game, 2, 2);
    placeHouse(game, 4, 2);
    Object.assign(game.buildings[0], { level: 'shack', residents: 16, food: 100 });
    Object.assign(game.buildings[1], { level: 'shack', residents: 16, food: 1 });
    runTicks(game, TICKS_PER_MONTH);
    expect(row(game, 'food')).toMatchObject({ used: 4 + 1, wanted: 4 + 4 });
  });

  it('is what workshops took in, against their full-rate intake', () => {
    const game = town(0);
    place(game, 'olivePress', 10, 13);
    place(game, 'weaver', 14, 13);
    place(game, 'sculptureStudio', 18, 13);
    place(game, 'scriptorium', 22, 13);
    runMaintained(game, 12);
    expect(row(game, 'olives')).toMatchObject({ used: 0, wanted: expect.closeTo(loads(6)) });
    expect(row(game, 'fleece')).toMatchObject({ used: 0, wanted: expect.closeTo(loads(6)) });
    expect(row(game, 'bronze')).toMatchObject({ used: 0, wanted: expect.closeTo(loads(24)) });
    expect(row(game, 'papyrus')).toMatchObject({ used: 0, wanted: expect.closeTo(loads(24)) });
  });

  it('counts a sanctuary’s initial marble and its deliveries, and wants what it still needs', () => {
    const game = town(400, 60);
    const storehouse = place(game, 'storehouse', 2, 12);
    storehouse.marble = loads(13);
    storehouse.wood = loads(2);
    place(game, 'hephaestusSanctuary', 20, 16);
    runTicks(game, 2 * TICKS_PER_MONTH);
    expect(row(game, 'marble')).toMatchObject({ used: loads(13), wanted: materialNeeded('hephaestusSanctuary', 'marble') });
    expect(row(game, 'wood')).toMatchObject({ used: loads(2), wanted: materialNeeded('hephaestusSanctuary', 'wood') });
    expect(row(game, 'sculptures')).toMatchObject({ used: 0, wanted: materialNeeded('hephaestusSanctuary', 'sculptures') });
  });
});

describe('the stock', () => {
  it('is what granaries and storehouses hold now', () => {
    const game = town();
    const granary = place(game, 'granary', 2, 11);
    const first = place(game, 'storehouse', 8, 12);
    const second = place(game, 'storehouse', 12, 12);
    const press = place(game, 'olivePress', 16, 13);
    granary.food = loads(3);
    first.oil = loads(1);
    second.oil = loads(2);
    press.oil = loads(1);
    expect(row(game, 'food').stock).toBe(loads(3));
    expect(row(game, 'oil').stock).toBe(loads(3));
    demolish(game, { x: 12, y: 12 }, { x: 12, y: 12 });
    expect(row(game, 'oil').stock).toBe(loads(1));
  });
});

describe('productionStatus', () => {
  it('is idle when nothing was made or wanted', () => {
    expect(productionStatus({ made: 0, used: 0, wanted: 0 })).toBe('idle');
  });

  it('is short when less was used than wanted, even with plenty made', () => {
    expect(productionStatus({ made: 900, used: 300, wanted: 400 })).toBe('short');
    expect(productionStatus({ made: 0, used: 0, wanted: 400 })).toBe('short');
  });

  it('is surplus when more was made than wanted', () => {
    expect(productionStatus({ made: 500, used: 400, wanted: 400 })).toBe('surplus');
    expect(productionStatus({ made: 500, used: 0, wanted: 0 })).toBe('surplus');
  });

  it('is enough when what was wanted was used and made', () => {
    expect(productionStatus({ made: 400, used: 400, wanted: 400 })).toBe('enough');
  });
});

describe('a closed industry', () => {
  it('books nothing it could make or would take in', () => {
    const game = town();
    place(game, 'olivePress', 10, 13);
    setIndustryOpen(game, 'olivePress', false);
    runMaintained(game, 2);
    expect(row(game, 'oil').possible).toBe(0);
    expect(row(game, 'olives').wanted).toBe(0);
  });
});

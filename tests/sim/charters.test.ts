import { describe, expect, it } from 'vitest';
import { HEALTHY_AND_WELL_FED_MONTHS, LEARNED_CITY_MONTHS, WELL_DRESSED_MONTHS, tallyHealthyAndWellFed, tallyLearnedCity, tallyWellDressed } from '../../src/sim/charters';
import { FLEECE_PER_HOUSE_PER_MONTH, OIL_PER_HOUSE_PER_MONTH, monthlyUse } from '../../src/sim/food';
import { HOUSE_LEVELS } from '../../src/sim/housing';
import { TICKS_PER_MONTH } from '../../src/sim/clock';
import { tick } from '../../src/sim/tick';
import type { Building, GameState } from '../../src/sim/state';
import { fallSick, heal } from '../../src/sim/sickness';
import { grassGame, placeHouse, placedGuild, placedScholars, supplyGuild } from './helpers';

const PLENTY = 10;

function addTownhouse(game: GameState, x: number, y: number): Building {
  placeHouse(game, x, y);
  const house = game.buildings[game.buildings.length - 1];
  Object.assign(house, { level: 'townhouse', residents: HOUSE_LEVELS.townhouse.capacity, fleece: PLENTY, oil: PLENTY });
  return house;
}

function cityWithTownhouse(): { game: GameState; house: Building } {
  const game = grassGame();
  return { game, house: addTownhouse(game, 4, 4) };
}

describe('the Well dressed charter', () => {
  it('starts at zero months, with no reset and no permit', () => {
    const game = grassGame();
    expect(game.wellDressed).toEqual({ months: 0, reset: null });
    expect(game.permits.tradersGuild).toBe(0);
  });

  it('counts a month in which every Townhouse keeps fleece and oil', () => {
    const { game } = cityWithTownhouse();
    tallyWellDressed(game);
    tallyWellDressed(game);
    expect(game.wellDressed).toEqual({ months: 2, reset: null });
  });

  it(`grants a Traders' Guild permit after ${WELL_DRESSED_MONTHS} months and starts again`, () => {
    const { game } = cityWithTownhouse();
    game.wellDressed.months = WELL_DRESSED_MONTHS - 1;
    tallyWellDressed(game);
    expect(game.permits.tradersGuild).toBe(1);
    expect(game.wellDressed).toEqual({ months: 0, reset: null });
    expect(game.notices).toEqual([
      { id: 1, tick: 0, text: "Charter complete: Well dressed. A Traders' Guild permit is granted", at: null },
    ]);
  });

  it('grants another permit for every further streak', () => {
    const { game } = cityWithTownhouse();
    game.permits.tradersGuild = 1;
    game.wellDressed.months = WELL_DRESSED_MONTHS - 1;
    tallyWellDressed(game);
    expect(game.permits.tradersGuild).toBe(2);
  });

  it('resets when a Townhouse runs out of oil, naming it and the good', () => {
    const { game, house } = cityWithTownhouse();
    game.tick = 90;
    game.wellDressed.months = 10;
    house.oil = OIL_PER_HOUSE_PER_MONTH;
    tallyWellDressed(game);
    expect(game.wellDressed).toEqual({ months: 0, reset: { tick: 90, cause: 'Townhouse at 4,4 ran out of oil' } });
    expect(game.permits.tradersGuild).toBe(0);
  });

  it('resets when a Townhouse has no fleece left', () => {
    const { game, house } = cityWithTownhouse();
    house.fleece = 0;
    tallyWellDressed(game);
    expect(game.wellDressed.reset).toEqual({ tick: 0, cause: 'Townhouse at 4,4 ran out of fleece' });
  });

  it('keeps counting while the month leaves fleece and oil in the stock', () => {
    const { game, house } = cityWithTownhouse();
    Object.assign(house, { fleece: FLEECE_PER_HOUSE_PER_MONTH + 1, oil: OIL_PER_HOUSE_PER_MONTH + 1 });
    tallyWellDressed(game);
    expect(game.wellDressed).toEqual({ months: 1, reset: null });
  });

  it('resets when a lower house that wears fleece runs out of it', () => {
    const { game } = cityWithTownhouse();
    placeHouse(game, 8, 4);
    Object.assign(game.buildings[1], { level: 'homestead', residents: 32, fleece: 0 });
    tallyWellDressed(game);
    expect(game.wellDressed.reset).toEqual({ tick: 0, cause: 'Homestead at 8,4 ran out of fleece' });
  });

  it('resets when an Apartment runs out of oil', () => {
    const { game } = cityWithTownhouse();
    placeHouse(game, 8, 4);
    Object.assign(game.buildings[1], { level: 'apartment', residents: 48, fleece: PLENTY, oil: 0 });
    tallyWellDressed(game);
    expect(game.wellDressed.reset).toEqual({ tick: 0, cause: 'Apartment at 8,4 ran out of oil' });
  });

  it('is not reset by houses without a good they never use', () => {
    const { game } = cityWithTownhouse();
    placeHouse(game, 8, 4);
    placeHouse(game, 12, 4);
    Object.assign(game.buildings[1], { level: 'tenement', residents: 40, fleece: PLENTY, oil: 0 });
    Object.assign(game.buildings[2], { level: 'hovel', residents: 24, fleece: 0, oil: 0 });
    tallyWellDressed(game);
    expect(game.wellDressed).toEqual({ months: 1, reset: null });
  });

  it('resets a running count in a month with no Townhouse', () => {
    const game = grassGame();
    placeHouse(game, 8, 4);
    Object.assign(game.buildings[0], { level: 'apartment', residents: 40, fleece: PLENTY, oil: PLENTY });
    game.wellDressed.months = 10;
    tallyWellDressed(game);
    expect(game.wellDressed).toEqual({ months: 0, reset: { tick: 0, cause: 'no Townhouse in the city' } });
  });

  it('leaves a zero count and its last reset alone in a month with no Townhouse', () => {
    const game = grassGame();
    const reset = { tick: 30, cause: 'Townhouse at 4,4 ran out of oil' };
    game.wellDressed = { months: 0, reset };
    tallyWellDressed(game);
    expect(game.wellDressed).toEqual({ months: 0, reset });
  });

  it("counts a Traders' Guild as a Townhouse", () => {
    const { game, guild } = placedGuild();
    for (const house of game.buildings.filter((b) => b.type === 'house')) house.residents = 0;
    supplyGuild(guild);
    tallyWellDressed(game);
    expect(game.wellDressed).toEqual({ months: 1, reset: null });
  });

  it("is reset by a Traders' Guild running out of oil", () => {
    const { game, guild } = placedGuild();
    supplyGuild(guild);
    guild.oil = 0;
    tallyWellDressed(game);
    expect(game.wellDressed.reset).toEqual({ tick: game.tick, cause: "Traders' Guild at 3,12 ran out of oil" });
  });
});

const FAR_FUTURE = 1_000_000;

function cover(house: Building): void {
  Object.assign(house.coveredUntil, { philosophy: FAR_FUTURE, athletics: FAR_FUTURE, drama: FAR_FUTURE });
}

function learnedCity(): { game: GameState; house: Building } {
  const { game, house } = cityWithTownhouse();
  cover(house);
  return { game, house };
}

describe("the Learned city charter", () => {
  it("starts at zero months, with no reset and no permit", () => {
    const game = grassGame();
    expect(game.learnedCity).toEqual({ months: 0, reset: null });
    expect(game.permits.scholarsHouse).toBe(0);
  });

  it("counts a month in which every Townhouse has philosophy, athletics and drama", () => {
    const { game } = learnedCity();
    tallyLearnedCity(game);
    tallyLearnedCity(game);
    expect(game.learnedCity).toEqual({ months: 2, reset: null });
  });

  it(`grants a Scholars' House permit after ${LEARNED_CITY_MONTHS} months and starts again`, () => {
    const { game } = learnedCity();
    game.learnedCity.months = LEARNED_CITY_MONTHS - 1;
    tallyLearnedCity(game);
    expect(game.permits.scholarsHouse).toBe(1);
    expect(game.permits.tradersGuild).toBe(0);
    expect(game.learnedCity).toEqual({ months: 0, reset: null });
    expect(game.notices).toEqual([
      { id: 1, tick: 0, text: "Charter complete: Learned city. A Scholars' House permit is granted", at: null },
    ]);
  });

  it("resets when a Townhouse misses a culture, naming it and the culture", () => {
    const { game, house } = learnedCity();
    game.tick = 90;
    game.learnedCity.months = 10;
    house.coveredUntil.drama = 90;
    tallyLearnedCity(game);
    expect(game.learnedCity).toEqual({ months: 0, reset: { tick: 90, cause: "Townhouse at 4,4 missed drama" } });
    expect(game.permits.scholarsHouse).toBe(0);
  });

  it("names the first culture missed when several are", () => {
    const { game, house } = learnedCity();
    house.coveredUntil.athletics = 0;
    house.coveredUntil.drama = 0;
    tallyLearnedCity(game);
    expect(game.learnedCity.reset).toEqual({ tick: 0, cause: "Townhouse at 4,4 missed athletics" });
  });

  it("is not reset by lower houses without culture", () => {
    const { game } = learnedCity();
    placeHouse(game, 8, 4);
    Object.assign(game.buildings[1], { level: "apartment", residents: 40 });
    tallyLearnedCity(game);
    expect(game.learnedCity).toEqual({ months: 1, reset: null });
  });

  it("resets a running count in a month with no Townhouse", () => {
    const game = grassGame();
    game.learnedCity.months = 10;
    tallyLearnedCity(game);
    expect(game.learnedCity).toEqual({ months: 0, reset: { tick: 0, cause: "no Townhouse in the city" } });
  });

  it("counts a Traders' Guild as a Townhouse, and is reset by one missing a culture", () => {
    const { game, guild } = placedGuild();
    for (const house of game.buildings.filter((b) => b.type === "house")) house.residents = 0;
    cover(guild);
    tallyLearnedCity(game);
    expect(game.learnedCity).toEqual({ months: 1, reset: null });
    guild.coveredUntil.philosophy = 0;
    tallyLearnedCity(game);
    expect(game.learnedCity.reset).toEqual({ tick: game.tick, cause: "Traders' Guild at 3,12 missed philosophy" });
  });

it("is tallied at the end of every month", () => {
  const { game } = learnedCity();
  for (let i = 0; i < TICKS_PER_MONTH; i++) tick(game);
  expect(game.learnedCity).toEqual({ months: 1, reset: null });
});

  it("is not affected by Well dressed, nor Well dressed by it", () => {
    const { game, house } = learnedCity();
    house.oil = 0;
    tallyLearnedCity(game);
    expect(game.learnedCity).toEqual({ months: 1, reset: null });
    house.oil = PLENTY;
    house.coveredUntil.drama = 0;
    tallyWellDressed(game);
    expect(game.wellDressed).toEqual({ months: 1, reset: null });
  });
});

function fedCity(): { game: GameState; house: Building } {
  const { game, house } = cityWithTownhouse();
  house.food = PLENTY * monthlyUse(house, 'food');
  return { game, house };
}

describe('the Healthy and well fed charter', () => {
  it('starts at zero months, with no reset and no permit', () => {
    const game = grassGame();
    expect(game.healthyAndWellFed).toEqual({ months: 0, reset: null });
    expect(game.permits.warriorsHouse).toBe(0);
  });

  it('counts a month in which every Townhouse keeps food and stays healthy', () => {
    const { game } = fedCity();
    tallyHealthyAndWellFed(game);
    tallyHealthyAndWellFed(game);
    expect(game.healthyAndWellFed).toEqual({ months: 2, reset: null });
  });

  it(`grants a Warriors' House permit after ${HEALTHY_AND_WELL_FED_MONTHS} months and starts again`, () => {
    const { game } = fedCity();
    game.healthyAndWellFed.months = HEALTHY_AND_WELL_FED_MONTHS - 1;
    tallyHealthyAndWellFed(game);
    expect(game.permits).toEqual({ tradersGuild: 0, scholarsHouse: 0, warriorsHouse: 1 });
    expect(game.healthyAndWellFed).toEqual({ months: 0, reset: null });
    expect(game.notices).toEqual([
      { id: 1, tick: 0, text: "Charter complete: Healthy and well fed. A Warriors' House permit is granted", at: null },
    ]);
  });

  it('resets when a Townhouse runs out of food, naming it', () => {
    const { game, house } = fedCity();
    game.tick = 90;
    game.healthyAndWellFed.months = 10;
    house.food = monthlyUse(house, 'food');
    tallyHealthyAndWellFed(game);
    expect(game.healthyAndWellFed).toEqual({ months: 0, reset: { tick: 90, cause: 'Townhouse at 4,4 ran out of food' } });
  });

  it('resets when a Townhouse falls sick', () => {
    const { game, house } = fedCity();
    game.healthyAndWellFed.months = 10;
    fallSick(game, house);
    tallyHealthyAndWellFed(game);
    expect(game.healthyAndWellFed).toEqual({ months: 0, reset: { tick: 0, cause: 'Townhouse at 4,4 fell sick' } });
  });

  it('resets for a Townhouse that fell sick this month even if a healer cured it', () => {
    const { game, house } = fedCity();
    game.tick = TICKS_PER_MONTH;
    fallSick(game, house);
    heal(house);
    game.tick = 2 * TICKS_PER_MONTH;
    tallyHealthyAndWellFed(game);
    expect(game.healthyAndWellFed.reset).toEqual({ tick: game.tick, cause: 'Townhouse at 4,4 fell sick' });
  });

  it('does not count again a cured onset from before the last tally', () => {
    const { game, house } = fedCity();
    game.tick = TICKS_PER_MONTH - 1;
    fallSick(game, house);
    heal(house);
    game.tick = 2 * TICKS_PER_MONTH;
    tallyHealthyAndWellFed(game);
    expect(game.healthyAndWellFed).toEqual({ months: 1, reset: null });
  });

  it('resets every month a Townhouse stays sick', () => {
    const { game, house } = fedCity();
    fallSick(game, house);
    game.tick = 5 * TICKS_PER_MONTH;
    tallyHealthyAndWellFed(game);
    expect(game.healthyAndWellFed.reset).toEqual({ tick: game.tick, cause: 'Townhouse at 4,4 fell sick' });
  });

  it('names food first when a Townhouse is both hungry and sick', () => {
    const { game, house } = fedCity();
    house.food = 0;
    fallSick(game, house);
    tallyHealthyAndWellFed(game);
    expect(game.healthyAndWellFed.reset?.cause).toBe('Townhouse at 4,4 ran out of food');
  });

  it('resets when a lower house runs out of food', () => {
    const { game } = fedCity();
    placeHouse(game, 8, 4);
    Object.assign(game.buildings[1], { level: 'shack', residents: 16, food: 0 });
    tallyHealthyAndWellFed(game);
    expect(game.healthyAndWellFed.reset?.cause).toBe('Shack at 8,4 ran out of food');
  });

  it('resets when a lower house falls sick', () => {
    const { game } = fedCity();
    placeHouse(game, 8, 4);
    const shack = game.buildings[1];
    Object.assign(shack, { level: 'shack', residents: 16 });
    shack.food = PLENTY * monthlyUse(shack, 'food');
    fallSick(game, shack);
    tallyHealthyAndWellFed(game);
    expect(game.healthyAndWellFed.reset?.cause).toBe('Shack at 8,4 fell sick');
  });

  it('is not reset by a Hut, which never eats', () => {
    const { game } = fedCity();
    placeHouse(game, 8, 4);
    Object.assign(game.buildings[1], { level: 'hut', residents: 8, food: 0 });
    tallyHealthyAndWellFed(game);
    expect(game.healthyAndWellFed).toEqual({ months: 1, reset: null });
  });

  it('resets a running count in a month with no Townhouse', () => {
    const game = grassGame();
    game.healthyAndWellFed.months = 10;
    tallyHealthyAndWellFed(game);
    expect(game.healthyAndWellFed).toEqual({ months: 0, reset: { tick: 0, cause: 'no Townhouse in the city' } });
  });

  it("counts a Scholars' House as a Townhouse, and is reset by it falling sick", () => {
    const { game, scholars } = placedScholars();
    scholars.food = PLENTY * monthlyUse(scholars, 'food');
    tallyHealthyAndWellFed(game);
    expect(game.healthyAndWellFed).toEqual({ months: 1, reset: null });
    fallSick(game, scholars);
    tallyHealthyAndWellFed(game);
    expect(game.healthyAndWellFed.reset?.cause).toBe(`Scholars' House at ${scholars.x},${scholars.y} fell sick`);
  });

  it('is tallied at the end of every month', () => {
    const { game } = fedCity();
    for (let i = 0; i < TICKS_PER_MONTH; i++) tick(game);
    expect(game.healthyAndWellFed).toEqual({ months: 1, reset: null });
  });
});

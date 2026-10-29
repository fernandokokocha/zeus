import { describe, expect, it } from 'vitest';
import { WELL_DRESSED_MONTHS, tallyWellDressed } from '../../src/sim/charters';
import { FLEECE_PER_HOUSE_PER_MONTH, OIL_PER_HOUSE_PER_MONTH } from '../../src/sim/food';
import { HOUSE_LEVELS } from '../../src/sim/housing';
import type { Building, GameState } from '../../src/sim/state';
import { grassGame, placeHouse, placedGuild, supplyGuild } from './helpers';

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

  it('is not reset by lower houses without fleece or oil', () => {
    const { game } = cityWithTownhouse();
    placeHouse(game, 8, 4);
    Object.assign(game.buildings[1], { level: 'apartment', residents: 40 });
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

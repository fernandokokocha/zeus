import { describe, expect, it } from 'vitest';
import { TICKS_PER_MONTH } from '../../src/sim/clock';
import { placeBuilding } from '../../src/sim/commands';
import { LEARNED_CITY, WELL_DRESSED } from '../../src/sim/charters';
import { charterText, permitLines } from '../../src/ui/charters';
import { GUILD_BLOCK, guildBlock } from '../sim/helpers';

const month = (count: number) => count * TICKS_PER_MONTH;

describe('charterText', () => {
  it('shows the count out of 24 before anything reset it', () => {
    expect(charterText(WELL_DRESSED, { months: 0, reset: null }, month(5))).toBe('Well dressed: 0 / 24 months');
  });

  it('says how long ago it reset and why', () => {
    const reset = { tick: month(40), cause: 'Townhouse at 40,22 ran out of oil' };
    expect(charterText(WELL_DRESSED, { months: 9, reset }, month(42) + 10)).toBe(
      'Well dressed: 9 / 24 months, reset 2 months ago (Townhouse at 40,22 ran out of oil)',
    );
  });

  it('says "this month" and "1 month ago"', () => {
    const reset = { tick: month(40), cause: 'no Townhouse in the city' };
    expect(charterText(WELL_DRESSED, { months: 0, reset }, month(40))).toBe('Well dressed: 0 / 24 months, reset this month (no Townhouse in the city)');
    expect(charterText(WELL_DRESSED, { months: 1, reset }, month(41))).toBe('Well dressed: 1 / 24 months, reset 1 month ago (no Townhouse in the city)');
  });

  it('shows Learned city and the culture that reset it', () => {
    const reset = { tick: month(40), cause: 'Townhouse at 31,18 missed drama' };
    expect(charterText(LEARNED_CITY, { months: 3, reset }, month(43))).toBe(
      'Learned city: 3 / 24 months, reset 3 months ago (Townhouse at 31,18 missed drama)',
    );
  });
});

describe('permitLines', () => {
  it('lists the permits of every elite type', () => {
    expect(permitLines({ tradersGuild: 1, scholarsHouse: 2 })).toEqual(["Traders' Guild permits: 1", "Scholars' House permits: 2"]);
  });

  it('counts only the unspent ones once a guild is placed', () => {
    const { game } = guildBlock();
    game.permits.tradersGuild = 2;
    placeBuilding(game, 'tradersGuild', GUILD_BLOCK.x, GUILD_BLOCK.y);
    expect(permitLines(game.permits)).toEqual(["Traders' Guild permits: 1", "Scholars' House permits: 0"]);
  });
});

import { describe, expect, it } from 'vitest';
import { TICKS_PER_MONTH } from '../../src/sim/clock';
import { placeBuilding } from '../../src/sim/commands';
import { HEALTHY_AND_WELL_FED, WELL_DRESSED } from '../../src/sim/charters';
import { charterReport, monthsText, permitLines, resetText } from '../../src/ui/charters';
import { GUILD_BLOCK, grassGame, guildBlock } from '../sim/helpers';

const month = (count: number) => count * TICKS_PER_MONTH;

describe('charterReport', () => {
  it('lists every condition, ticked when the city meets it right now', () => {
    expect(charterReport(grassGame(), HEALTHY_AND_WELL_FED).conditions).toEqual([
      { label: 'The city has a staffed Infirmary', met: false },
      { label: 'At least 1000 people live in the city', met: false },
      { label: 'No house runs out of food', met: true },
      { label: 'No house falls sick', met: true },
    ]);
  });

  it('carries the count, the months it takes, the permit it grants and the last reset', () => {
    const game = grassGame();
    const reset = { tick: 30, cause: 'Townhouse at 4,4 ran out of oil' };
    game.wellDressed = { months: 9, reset };
    expect(charterReport(game, WELL_DRESSED)).toMatchObject({ name: 'Well dressed', grants: "Traders' Guild", months: 9, total: 24, reset });
  });
});

describe('monthsText', () => {
  it('shows the count out of the months the charter takes', () => {
    expect(monthsText(9, 24)).toBe('9 / 24 months');
  });
});

describe('resetText', () => {
  it('says how long ago it reset and why', () => {
    const reset = { tick: month(40), cause: 'Townhouse at 40,22 ran out of oil' };
    expect(resetText(reset, month(42) + 10)).toBe('Reset 2 months ago: Townhouse at 40,22 ran out of oil');
  });

  it('says "this month" and "1 month ago"', () => {
    const reset = { tick: month(40), cause: 'no Townhouse in the city' };
    expect(resetText(reset, month(40))).toBe('Reset this month: no Townhouse in the city');
    expect(resetText(reset, month(41))).toBe('Reset 1 month ago: no Townhouse in the city');
  });
});

describe('permitLines', () => {
  it('lists the permits of every elite type', () => {
    expect(permitLines({ tradersGuild: 1, scholarsHouse: 2, warriorsHouse: 3 })).toEqual([
      "Traders' Guild permits: 1",
      "Scholars' House permits: 2",
      "Warriors' House permits: 3",
    ]);
  });

  it('counts only the unspent ones once a guild is placed', () => {
    const { game } = guildBlock();
    game.permits.tradersGuild = 2;
    placeBuilding(game, 'tradersGuild', GUILD_BLOCK.x, GUILD_BLOCK.y);
    expect(permitLines(game.permits)).toEqual([
      "Traders' Guild permits: 1",
      "Scholars' House permits: 0",
      "Warriors' House permits: 0",
    ]);
  });
});

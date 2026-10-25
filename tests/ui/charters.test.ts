import { describe, expect, it } from 'vitest';
import { TICKS_PER_MONTH } from '../../src/sim/clock';
import { placeBuilding } from '../../src/sim/commands';
import { permitsText, wellFedText } from '../../src/ui/charters';
import { GUILD_BLOCK, guildBlock } from '../sim/helpers';

const month = (count: number) => count * TICKS_PER_MONTH;

describe('wellFedText', () => {
  it('shows the count out of 24 before anything reset it', () => {
    expect(wellFedText({ months: 0, reset: null }, month(5))).toBe('Well fed: 0 / 24 months');
  });

  it('says how long ago it reset and which house went hungry', () => {
    const reset = { tick: month(40), house: 'Hovel at 52,40' };
    expect(wellFedText({ months: 14, reset }, month(43) + 10)).toBe(
      'Well fed: 14 / 24 months, reset 3 months ago (Hovel at 52,40 went hungry)',
    );
  });

  it('says "this month" and "1 month ago"', () => {
    const reset = { tick: month(40), house: 'Shack at 4,4' };
    expect(wellFedText({ months: 0, reset }, month(40))).toBe('Well fed: 0 / 24 months, reset this month (Shack at 4,4 went hungry)');
    expect(wellFedText({ months: 1, reset }, month(41))).toBe('Well fed: 1 / 24 months, reset 1 month ago (Shack at 4,4 went hungry)');
  });
});

describe('permitsText', () => {
  it("counts the Traders' Guild permits", () => {
    expect(permitsText(1)).toBe("Traders' Guild permits: 1");
  });

  it('counts only the unspent ones once a guild is placed', () => {
    const { game } = guildBlock();
    game.guildPermits = 2;
    placeBuilding(game, 'tradersGuild', GUILD_BLOCK.x, GUILD_BLOCK.y);
    expect(permitsText(game.guildPermits)).toBe("Traders' Guild permits: 1");
  });
});

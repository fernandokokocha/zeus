import { describe, expect, it } from 'vitest';
import { demolish, placeRoad } from '../../src/sim/commands';
import { GOODS } from '../../src/sim/flows';
import { raiseGuild } from '../../src/sim/guild';
import { LEVEL_CHANGE_TICKS } from '../../src/sim/housing';
import { describeTile } from '../../src/sim/inspect';
import { catchFire } from '../../src/sim/safety';
import type { Building, GameState } from '../../src/sim/state';
import {
  PALACE_DELIVERS,
  PARTNERS,
  PARTNER_CARAVANS,
  TRADE_GOODS,
  openRoute,
  routeStatus,
  worldReport,
  type Partner,
} from '../../src/sim/trade';
import { placedGuild, runTicks, supplyGuild } from './helpers';

const PALACE_TILE = { x: 1, y: 6 };
const SECOND_GUILD = { type: 'tradersGuild', x: 13, y: 12, rotation: 0 } as const;

function tradingTown(): { game: GameState; guild: Building } {
  const town = placedGuild();
  placeRoad(town.game, { x: 10, y: 6 }, { x: 10, y: 15 });
  return town;
}

function opened(partner: Partner = 'kerynthos'): { game: GameState; guild: Building } {
  const town = tradingTown();
  const result = openRoute(town.game, town.guild.id, partner);
  if (!result.ok) throw new Error(result.reason);
  return town;
}

function guildLines(game: GameState, guild: Building): string[] {
  return describeTile(game, guild.x, guild.y).lines;
}

describe('the partner cities', () => {
  it('buy every good the city makes, except that cloth is bought from no one', () => {
    const partners = Object.values(PARTNERS);
    expect(GOODS.filter((good) => !partners.some((p) => p.buys.includes(good)))).toEqual([]);
    expect(partners.filter((p) => p.sells.includes('cloth'))).toEqual([]);
    expect(TRADE_GOODS.cloth.wePay).toBeNull();
  });

  it('price every good they buy and sell', () => {
    for (const partner of Object.values(PARTNERS)) {
      for (const good of partner.sells) expect(TRADE_GOODS[good].wePay).toBeGreaterThan(TRADE_GOODS[good].theyPay);
    }
  });
});

describe('opening a route', () => {
  it('ties the guild to the partner with a notice at the guild', () => {
    const { game, guild } = opened('kerynthos');
    expect(game.routes).toEqual([{ partner: 'kerynthos', guildId: guild.id }]);
    expect(game.notices.at(-1)).toMatchObject({ text: 'Trade route to Kerynthos opened. A monument can be raised.', at: { x: 3, y: 12 } });
  });

  it('earns a trade-route monument for the first route to a partner', () => {
    const { game } = opened('argyra');
    expect(game.monumentsToPlace).toEqual(['tradeRoute']);
  });

  it('earns nothing when a route to that partner was opened before', () => {
    const { game, guild } = opened('argyra');
    demolish(game, guild, guild);
    const second = raiseGuild(game, SECOND_GUILD);
    expect(openRoute(game, second.id, 'argyra')).toEqual({ ok: true });
    expect(game.monumentsToPlace).toEqual(['tradeRoute']);
    expect(game.notices.at(-1)?.text).toBe('Trade route to Argyra opened');
  });

  it('is free', () => {
    const { game, guild } = tradingTown();
    const treasury = game.treasury;
    openRoute(game, guild.id, 'melanthos');
    expect(game.treasury).toBe(treasury);
  });

  it('gives a guild one route only', () => {
    const { game, guild } = opened('kerynthos');
    expect(openRoute(game, guild.id, 'argyra')).toEqual({ ok: false, reason: 'This guild already trades with Kerynthos' });
  });

  it('gives a partner one guild only', () => {
    const { game } = opened('kerynthos');
    const second = raiseGuild(game, SECOND_GUILD);
    expect(openRoute(game, second.id, 'kerynthos')).toEqual({ ok: false, reason: 'Kerynthos already trades with a guild' });
  });

  it('needs a Palace with a road to the Main Road', () => {
    const noRoad = placedGuild();
    const reason = 'Opening a route needs a Palace with a road to the Main Road';
    expect(openRoute(noRoad.game, noRoad.guild.id, 'kerynthos')).toEqual({ ok: false, reason });

    const cutOff = placedGuild();
    placeRoad(cutOff.game, { x: 10, y: 6 }, { x: 10, y: 14 });
    expect(openRoute(cutOff.game, cutOff.guild.id, 'kerynthos')).toEqual({ ok: false, reason });

    const noPalace = tradingTown();
    demolish(noPalace.game, PALACE_TILE, PALACE_TILE);
    expect(openRoute(noPalace.game, noPalace.guild.id, 'kerynthos')).toEqual({ ok: false, reason });
  });
});

describe('the Palace while a route is open', () => {
  it("can't be demolished, though the rest of the area is", () => {
    const { game } = opened();
    expect(demolish(game, { x: 1, y: 6 }, { x: 10, y: 6 })).toEqual({ ok: false, reason: PALACE_DELIVERS });
    expect(game.buildings.some((b) => b.type === 'palace')).toBe(true);
    expect(game.roads[6 * game.size + 10]).toBe(false);
  });

  it('can be demolished once no route is open', () => {
    const { game, guild } = opened();
    demolish(game, guild, guild);
    expect(demolish(game, PALACE_TILE, PALACE_TILE)).toEqual({ ok: true });
    expect(game.buildings.some((b) => b.type === 'palace')).toBe(false);
  });
});

describe('a route closes when its guild goes', () => {
  it('when the guild is demolished, freeing the partner', () => {
    const { game, guild } = opened('kerynthos');
    demolish(game, guild, guild);
    expect(game.routes).toEqual([]);
    expect(worldReport(game).find((p) => p.partner === 'kerynthos')?.available).toBe(true);
  });

  it('when the guild burns', () => {
    const { game, guild } = opened();
    catchFire(game, guild);
    expect(game.routes).toEqual([]);
  });

  it('when the guild breaks up, saying so in its notice', () => {
    const { game, guild } = opened('kerynthos');
    supplyGuild(guild);
    guild.cloth = 0;
    runTicks(game, LEVEL_CHANGE_TICKS);
    expect(game.routes).toEqual([]);
    expect(game.notices.at(-1)?.text).toBe(
      "The Traders' Guild at 3,12 broke up: it lacked cloth. Its permit is lost and its route to Kerynthos closes",
    );
  });
});

describe("the guild's route", () => {
  it('can be opened while a partner is free and the Palace reaches the Main Road', () => {
    const { game, guild } = tradingTown();
    expect(routeStatus(game, guild)).toEqual({ line: 'Trade route: none yet', canOpen: true });
    expect(guildLines(game, guild)).toContain('Trade route: none yet');
    expect(describeTile(game, guild.x, guild.y).openRoute).toBe(guild.id);
  });

  it('names its partner once open', () => {
    const { game, guild } = opened('halikeia');
    expect(routeStatus(game, guild)).toEqual({ line: 'Trade route: Halikeia, 8-month round trip', canOpen: false });
    expect(describeTile(game, guild.x, guild.y).openRoute).toBeUndefined();
  });

  it('says what stops it opening', () => {
    const { game, guild } = placedGuild();
    expect(routeStatus(game, guild)).toEqual({ line: 'Trade route: none, needs a Palace with a road to the Main Road', canOpen: false });
  });

  it('says when every partner already trades', () => {
    const { game } = tradingTown();
    game.routes = (Object.keys(PARTNERS) as Partner[]).map((partner) => ({ partner, guildId: 999 }));
    const second = raiseGuild(game, SECOND_GUILD);
    expect(routeStatus(game, second)).toEqual({ line: 'Trade route: none, every partner already trades with a guild', canOpen: false });
  });
});

describe("the yard's inspector", () => {
  it('waits for a route', () => {
    const { game } = tradingTown();
    expect(describeTile(game, 3, 17).lines).toContain('Trade Yard: trade opens with a route');
  });

  it('names the partner once the route is open', () => {
    const { game } = opened('melanthos');
    expect(describeTile(game, 3, 17).lines).toContain('Trade Yard: trading with Melanthos');
  });
});

describe('the world report', () => {
  it('lists each partner with its goods, prices, caravans and route', () => {
    const { game } = opened('argyra');
    const [melanthos, , argyra] = worldReport(game);
    expect(melanthos).toEqual({
      partner: 'melanthos',
      name: 'Melanthos',
      roundTripMonths: 3,
      buys: [
        { good: 'fleece', name: 'Fleece', load: 6, price: 20 },
        { good: 'olives', name: 'Olives', load: 8, price: 12 },
      ],
      sells: [
        { good: 'food', name: 'Food', load: 8, price: 15 },
        { good: 'wood', name: 'Wood', load: 6, price: 22 },
      ],
      caravansHome: PARTNER_CARAVANS,
      route: 'Available',
      available: true,
    });
    expect(argyra).toMatchObject({ route: "Open, to the Traders' Guild at 3,12", available: false });
  });
});

import { describe, expect, it } from 'vitest';
import { demolish, placeRoad } from '../../src/sim/commands';
import { GOODS } from '../../src/sim/flows';
import { raiseElite } from '../../src/sim/elites';
import { LEVEL_CHANGE_TICKS } from '../../src/sim/housing';
import { describeTile } from '../../src/sim/inspect';
import { catchFire } from '../../src/sim/safety';
import type { Building, GameState, Good } from '../../src/sim/state';
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

function opened(partner: Partner = 'argos'): { game: GameState; guild: Building } {
  const town = tradingTown();
  const result = openRoute(town.game, town.guild.id, partner);
  if (!result.ok) throw new Error(result.reason);
  return town;
}

function guildLines(game: GameState, guild: Building): string[] {
  return describeTile(game, guild.x, guild.y).lines;
}

describe('the partner cities', () => {
  it('buy every good the city makes but papyrus and scrolls, and nobody sells cloth', () => {
    const partners = Object.values(PARTNERS);
    expect(GOODS.filter((good) => !partners.some((p) => (p.buys as Good[]).includes(good)))).toEqual(['papyrus', 'scrolls']);
    expect(partners.filter((p) => p.sells.includes('cloth'))).toEqual([]);
    expect(TRADE_GOODS.cloth.wePay).toBeNull();
  });

  it('sell papyrus only from Corinth, 4 loads a caravan at 60 dr a load', () => {
    expect(Object.values(PARTNERS).filter((p) => p.sells.includes('papyrus'))).toEqual([PARTNERS.corinth]);
    expect(TRADE_GOODS.papyrus).toEqual({ caravanLoad: 4, theyPay: null, wePay: 60 });
  });

  it('never deal in scrolls', () => {
    expect(Object.keys(TRADE_GOODS)).not.toContain('scrolls');
  });

  it('sell what their lands are known for', () => {
    expect(PARTNERS.thebes.sells).toContain('food');
    expect(PARTNERS.corinth.sells).toContain('bronze');
    expect(PARTNERS.argos.sells).toContain('sculptures');
    expect(PARTNERS.sparta.sells).toContain('marble');
  });

  it('price every good they buy and sell', () => {
    for (const partner of Object.values(PARTNERS)) {
      for (const good of partner.sells) expect(TRADE_GOODS[good].wePay).toBeGreaterThan(TRADE_GOODS[good].theyPay ?? 0);
    }
  });
});

describe('opening a route', () => {
  it('ties the guild to the partner with a notice at the guild', () => {
    const { game, guild } = opened('argos');
    expect(game.routes).toEqual([{ partner: 'argos', guildId: guild.id }]);
    expect(game.notices.at(-1)).toMatchObject({ text: 'Trade route to Argos opened. A monument can be raised.', at: { x: 3, y: 12 } });
  });

  it('earns a trade-route monument for the first route to a partner', () => {
    const { game } = opened('corinth');
    expect(game.monumentsToPlace).toEqual(['tradeRoute']);
  });

  it('earns nothing when a route to that partner was opened before', () => {
    const { game, guild } = opened('corinth');
    demolish(game, guild, guild);
    const second = raiseElite(game, SECOND_GUILD);
    expect(openRoute(game, second.id, 'corinth')).toEqual({ ok: true });
    expect(game.monumentsToPlace).toEqual(['tradeRoute']);
    expect(game.notices.at(-1)?.text).toBe('Trade route to Corinth opened');
  });

  it('is free', () => {
    const { game, guild } = tradingTown();
    const treasury = game.treasury;
    openRoute(game, guild.id, 'thebes');
    expect(game.treasury).toBe(treasury);
  });

  it('gives a guild one route only', () => {
    const { game, guild } = opened('argos');
    expect(openRoute(game, guild.id, 'corinth')).toEqual({ ok: false, reason: 'This guild already trades with Argos' });
  });

  it('gives a partner one guild only', () => {
    const { game } = opened('argos');
    const second = raiseElite(game, SECOND_GUILD);
    expect(openRoute(game, second.id, 'argos')).toEqual({ ok: false, reason: 'Argos already trades with a guild' });
  });

  it('needs a Palace with a road to the Main Road', () => {
    const noRoad = placedGuild();
    const reason = 'Opening a route needs a Palace with a road to the Main Road';
    expect(openRoute(noRoad.game, noRoad.guild.id, 'argos')).toEqual({ ok: false, reason });

    const cutOff = placedGuild();
    placeRoad(cutOff.game, { x: 10, y: 6 }, { x: 10, y: 14 });
    expect(openRoute(cutOff.game, cutOff.guild.id, 'argos')).toEqual({ ok: false, reason });

    const noPalace = tradingTown();
    demolish(noPalace.game, PALACE_TILE, PALACE_TILE);
    expect(openRoute(noPalace.game, noPalace.guild.id, 'argos')).toEqual({ ok: false, reason });
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
    const { game, guild } = opened('argos');
    demolish(game, guild, guild);
    expect(game.routes).toEqual([]);
    expect(worldReport(game).find((p) => p.partner === 'argos')?.available).toBe(true);
  });

  it('when the guild burns', () => {
    const { game, guild } = opened();
    catchFire(game, guild);
    expect(game.routes).toEqual([]);
  });

  it('when the guild breaks up, saying so in its notice', () => {
    const { game, guild } = opened('argos');
    supplyGuild(guild);
    guild.cloth = 0;
    runTicks(game, LEVEL_CHANGE_TICKS);
    expect(game.routes).toEqual([]);
    expect(game.notices.at(-1)?.text).toBe(
      "The Traders' Guild at 3,12 broke up: it lacked cloth. Its permit is lost and its route to Argos closes",
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
    const { game, guild } = opened('sparta');
    expect(routeStatus(game, guild)).toEqual({ line: 'Trade route: Sparta, 9-month round trip', canOpen: false });
    expect(describeTile(game, guild.x, guild.y).openRoute).toBeUndefined();
  });

  it('says what stops it opening', () => {
    const { game, guild } = placedGuild();
    expect(routeStatus(game, guild)).toEqual({ line: 'Trade route: none, needs a Palace with a road to the Main Road', canOpen: false });
  });

  it('says when every partner already trades', () => {
    const { game } = tradingTown();
    game.routes = (Object.keys(PARTNERS) as Partner[]).map((partner) => ({ partner, guildId: 999 }));
    const second = raiseElite(game, SECOND_GUILD);
    expect(routeStatus(game, second)).toEqual({ line: 'Trade route: none, every partner already trades with a guild', canOpen: false });
  });
});

describe("the yard's inspector", () => {
  it('waits for a route', () => {
    const { game } = tradingTown();
    expect(describeTile(game, 3, 17).lines).toContain('Trade Yard: trade opens with a route');
  });

  it('names the partner once the route is open', () => {
    const { game } = opened('thebes');
    expect(describeTile(game, 3, 17).lines).toContain('Trade Yard: trading with Thebes');
  });
});

describe('the world report', () => {
  it('lists each partner with its goods, prices, caravans and route', () => {
    const { game } = opened('corinth');
    const [thebes, corinth] = worldReport(game);
    expect(thebes).toEqual({
      partner: 'thebes',
      name: 'Thebes',
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
    expect(corinth).toMatchObject({ route: "Open, to the Traders' Guild at 3,12", available: false });
  });
});

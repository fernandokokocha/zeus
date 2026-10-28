import { adjacentRoadTiles, type Result } from './commands';
import { postNotice } from './notices';
import { findRoadPath } from './pathfinding';
import { GOOD_TITLES } from './production';
import { buildingById, type Building, type GameState, type Good } from './state';

export type Partner = 'melanthos' | 'kerynthos' | 'argyra' | 'halikeia';

export interface PartnerSpec {
  name: string;
  roundTripMonths: number;
  buys: Good[];
  sells: Good[];
}

export const PARTNERS: Record<Partner, PartnerSpec> = {
  melanthos: { name: 'Melanthos', roundTripMonths: 3, buys: ['fleece', 'olives'], sells: ['food', 'wood'] },
  kerynthos: { name: 'Kerynthos', roundTripMonths: 5, buys: ['food', 'wood', 'marble'], sells: ['fleece', 'olives', 'oil'] },
  argyra: { name: 'Argyra', roundTripMonths: 5, buys: ['oil', 'cloth', 'sculptures'], sells: ['marble', 'bronze'] },
  halikeia: { name: 'Halikeia', roundTripMonths: 8, buys: ['cloth', 'bronze', 'oil'], sells: ['sculptures', 'wood'] },
};

export interface TradeGoodSpec {
  caravanLoad: number;
  theyPay: number;
  wePay: number | null;
}

export const TRADE_GOODS: Record<Good, TradeGoodSpec> = {
  food: { caravanLoad: 8, theyPay: 10, wePay: 15 },
  olives: { caravanLoad: 8, theyPay: 12, wePay: 18 },
  fleece: { caravanLoad: 6, theyPay: 20, wePay: 30 },
  wood: { caravanLoad: 6, theyPay: 15, wePay: 22 },
  marble: { caravanLoad: 6, theyPay: 25, wePay: 38 },
  oil: { caravanLoad: 4, theyPay: 25, wePay: 38 },
  bronze: { caravanLoad: 4, theyPay: 35, wePay: 52 },
  cloth: { caravanLoad: 4, theyPay: 45, wePay: null },
  sculptures: { caravanLoad: 2, theyPay: 120, wePay: 180 },
};

export const PARTNER_CARAVANS = 2;
export const PALACE_DELIVERS = 'Trade caravans deliver to the Palace';
const NEEDS_PALACE = 'needs a Palace with a road to the Main Road';
const NO_PARTNER_LEFT = 'every partner already trades with a guild';

export interface Route {
  partner: Partner;
  guildId: number;
}

export interface TradeOffer {
  good: Good;
  name: string;
  load: number;
  price: number;
}

export interface PartnerView {
  partner: Partner;
  name: string;
  roundTripMonths: number;
  buys: TradeOffer[];
  sells: TradeOffer[];
  caravansHome: number;
  route: string;
  available: boolean;
}

export function routeOf(state: GameState, guild: Building): Route | null {
  return state.routes.find((r) => r.guildId === guild.id) ?? null;
}

function routeTo(state: GameState, partner: Partner): Route | null {
  return state.routes.find((r) => r.partner === partner) ?? null;
}

function palaceReachesMainRoad(state: GameState): boolean {
  const palace = state.buildings.find((b) => b.type === 'palace');
  if (palace === undefined) return false;
  const mainRoad = state.mainRoad.flatMap((paved, i) => (paved ? [{ x: i % state.size, y: Math.floor(i / state.size) }] : []));
  return adjacentRoadTiles(state, palace).some((from) => findRoadPath(state, from, mainRoad) !== null);
}

function tradingGuild(state: GameState, route: Route): Building {
  const guild = buildingById(state, route.guildId);
  if (guild === undefined) throw new Error(`The route to ${route.partner} has no guild`);
  return guild;
}

function routeObstacle(state: GameState, guild: Building, partner: Partner): string | null {
  const own = routeOf(state, guild);
  if (own) return `This guild already trades with ${PARTNERS[own.partner].name}`;
  if (routeTo(state, partner)) return `${PARTNERS[partner].name} already trades with a guild`;
  if (!palaceReachesMainRoad(state)) return `Opening a route ${NEEDS_PALACE}`;
  return null;
}

export function openRoute(state: GameState, guildId: number, partner: Partner): Result {
  const guild = buildingById(state, guildId);
  if (guild === undefined || guild.type !== 'tradersGuild') throw new Error(`Building ${guildId} is not a Traders' Guild`);
  const obstacle = routeObstacle(state, guild, partner);
  if (obstacle) return { ok: false, reason: obstacle };
  state.routes.push({ partner, guildId });
  const first = !state.partnersTraded.includes(partner);
  if (first) {
    state.partnersTraded.push(partner);
    state.monumentsToPlace.push('tradeRoute');
  }
  postNotice(state, `Trade route to ${PARTNERS[partner].name} opened${first ? '. A monument can be raised.' : ''}`, guild);
  state.version++;
  return { ok: true };
}

export function routeStatus(state: GameState, guild: Building): { line: string; canOpen: boolean } {
  const route = routeOf(state, guild);
  if (route) {
    const { name, roundTripMonths } = PARTNERS[route.partner];
    return { line: `Trade route: ${name}, ${roundTripMonths}-month round trip`, canOpen: false };
  }
  if (state.routes.length === Object.keys(PARTNERS).length) return { line: `Trade route: none, ${NO_PARTNER_LEFT}`, canOpen: false };
  if (!palaceReachesMainRoad(state)) return { line: `Trade route: none, ${NEEDS_PALACE}`, canOpen: false };
  return { line: 'Trade route: none yet', canOpen: true };
}

function offers(goods: Good[], price: (spec: TradeGoodSpec) => number | null): TradeOffer[] {
  return goods.map((good) => {
    const paid = price(TRADE_GOODS[good]);
    if (paid === null) throw new Error(`${good} has no price`);
    return { good, name: GOOD_TITLES[good], load: TRADE_GOODS[good].caravanLoad, price: paid };
  });
}

export function worldReport(state: GameState): PartnerView[] {
  return (Object.keys(PARTNERS) as Partner[]).map((partner) => {
    const { name, roundTripMonths, buys, sells } = PARTNERS[partner];
    const route = routeTo(state, partner);
    return {
      partner,
      name,
      roundTripMonths,
      buys: offers(buys, (spec) => spec.theyPay),
      sells: offers(sells, (spec) => spec.wePay),
      caravansHome: PARTNER_CARAVANS,
      route: route === null ? 'Available' : `Open, to the Traders' Guild at ${tradingGuild(state, route).x},${tradingGuild(state, route).y}`,
      available: route === null,
    };
  });
}

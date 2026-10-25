import { describe, expect, it } from 'vitest';
import { houseAppeal } from '../../src/sim/appeal';
import { BUILDING_SPECS, footprintDistance } from '../../src/sim/buildings';
import { TICKS_PER_MONTH } from '../../src/sim/clock';
import { demolish, placeBuilding, placeRoad } from '../../src/sim/commands';
import { LEVEL_CHANGE_TICKS, TRADERS_GUILD } from '../../src/sim/housing';
import { laborSummary } from '../../src/sim/labor';
import { canBurn, catchFire } from '../../src/sim/safety';
import { population } from '../../src/sim/settlers';
import type { Building, GameState } from '../../src/sim/state';
import { tick } from '../../src/sim/tick';
import { GUILD_BLOCK, GUILD_LOTS, guildBlock, guildOf, placedGuild, runTicks, supplyGuild } from './helpers';

const FAR = 1_000_000;

function blockLots(game: GameState): Building[] {
  return game.buildings.filter((b) => b.type === 'house' && footprintDistance({ ...GUILD_BLOCK, type: 'tradersGuild', rotation: 0 }, b) === 0);
}

function untilMonthEnd(game: GameState): void {
  while (game.tick % TICKS_PER_MONTH !== TICKS_PER_MONTH - 1) tick(game);
  tick(game);
}

const NOT_A_BLOCK = "A Traders' Guild goes over four Townhouses forming a 4×4 block";

describe("placing a Traders' Guild", () => {
  it('replaces four Townhouses forming a 4×4 block, for 100 dr and a permit', () => {
    const { game } = guildBlock();
    const before = game.treasury;
    expect(placeBuilding(game, 'tradersGuild', GUILD_BLOCK.x, GUILD_BLOCK.y)).toEqual({ ok: true });
    expect(blockLots(game)).toEqual([]);
    expect(guildOf(game)).toMatchObject({ x: GUILD_BLOCK.x, y: GUILD_BLOCK.y, residents: TRADERS_GUILD.merchants });
    expect(game.treasury).toBe(before - 100);
    expect(game.guildPermits).toBe(0);
    expect(BUILDING_SPECS.tradersGuild).toMatchObject({ width: 4, height: 4, cost: 100 });
  });

  it('keeps 20 merchants, and every resident when the four held fewer', () => {
    expect(TRADERS_GUILD.merchants).toBe(20);
    const { game, houses } = guildBlock();
    houses.forEach((h) => (h.residents = 4));
    placeBuilding(game, 'tradersGuild', GUILD_BLOCK.x, GUILD_BLOCK.y);
    expect(guildOf(game).residents).toBe(16);
  });

  it("keeps the four houses' stocks and their latest water and culture", () => {
    const { game, houses } = guildBlock();
    houses.forEach((h, i) => {
      Object.assign(h, { food: 40, fleece: 6, oil: 5 });
      h.coveredUntil.water = 100 + i;
      h.coveredUntil.drama = 50;
    });
    placeBuilding(game, 'tradersGuild', GUILD_BLOCK.x, GUILD_BLOCK.y);
    const guild = guildOf(game);
    expect(guild).toMatchObject({ food: 160, fleece: 24, oil: 20, cloth: 0 });
    expect(guild.coveredUntil).toMatchObject({ water: 103, drama: 50, philosophy: 0 });
  });

  it('needs a permit', () => {
    const { game } = guildBlock();
    game.guildPermits = 0;
    expect(placeBuilding(game, 'tradersGuild', GUILD_BLOCK.x, GUILD_BLOCK.y)).toEqual({
      ok: false,
      reason: "No Traders' Guild permit: complete the Well fed charter",
    });
  });

  it('needs all four houses to be Townhouses', () => {
    const { game, houses } = guildBlock();
    houses[2].level = 'apartment';
    expect(placeBuilding(game, 'tradersGuild', GUILD_BLOCK.x, GUILD_BLOCK.y)).toEqual({ ok: false, reason: NOT_A_BLOCK });
  });

  it('needs four houses, not three and an empty plot', () => {
    const { game } = guildBlock();
    demolish(game, GUILD_LOTS[3], GUILD_LOTS[3]);
    expect(placeBuilding(game, 'tradersGuild', GUILD_BLOCK.x, GUILD_BLOCK.y)).toEqual({ ok: false, reason: NOT_A_BLOCK });
  });

  it('needs the block exactly, not straddling it', () => {
    const { game } = guildBlock();
    expect(placeBuilding(game, 'tradersGuild', GUILD_BLOCK.x + 1, GUILD_BLOCK.y)).toEqual({ ok: false, reason: NOT_A_BLOCK });
  });

  it('needs its nearest tile within 4 tiles of the Main Road', () => {
    expect(TRADERS_GUILD.mainRoadRange).toBe(4);
    const near = guildBlock(19).game;
    expect(placeBuilding(near, 'tradersGuild', GUILD_BLOCK.x, GUILD_BLOCK.y)).toEqual({ ok: true });
    const far = guildBlock(20).game;
    expect(placeBuilding(far, 'tradersGuild', GUILD_BLOCK.x, GUILD_BLOCK.y)).toEqual({
      ok: false,
      reason: "A Traders' Guild must be within 4 tiles of the Main Road",
    });
  });

  it('needs appeal 25 over the block', () => {
    const { game } = guildBlock();
    demolish(game, { x: 1, y: 13 }, { x: 1, y: 13 });
    expect(placeBuilding(game, 'tradersGuild', GUILD_BLOCK.x, GUILD_BLOCK.y)).toEqual({ ok: false, reason: 'Needs appeal 25 here (has 22)' });
  });

  it('houses merchants who work there: they neither take jobs nor fill them', () => {
    const { game } = placedGuild();
    expect(population(game)).toBe(60);
    expect(laborSummary(game)).toMatchObject({ workforce: 20, jobs: 0 });
  });

  it('pays no tax', () => {
    const { game, guild } = placedGuild();
    placeRoad(game, { x: 1, y: 5 }, { x: 9, y: 5 });
    supplyGuild(guild);
    guild.coveredUntil.tax = FAR;
    untilMonthEnd(game);
    expect(game.lastMonth.taxes).toBe(0);
  });

  it('can burn like a house, leaving ruins', () => {
    const { game, guild } = placedGuild();
    expect(canBurn(guild)).toBe(true);
    catchFire(game, guild);
    expect(game.buildings.filter((b) => b.type === 'ruins')).toHaveLength(16);
  });
});

describe("a Traders' Guild's needs", () => {
  it('are a Townhouse\'s needs plus fine cloth, culture 45 and appeal 25', () => {
    expect(TRADERS_GUILD.needs).toEqual(['food', 'water', 'fleece', 'oil', 'cloth']);
    expect(TRADERS_GUILD).toMatchObject({ culture: 45, appeal: 25 });
  });

  it('uses 5 food, 2 fleece, 2 oil and 8 cloth a month', () => {
    const { game, guild } = placedGuild();
    supplyGuild(guild);
    Object.assign(guild, { food: 100, fleece: 100, oil: 100, cloth: 100 });
    untilMonthEnd(game);
    expect(guild).toMatchObject({ food: 95, fleece: 98, oil: 98, cloth: 92 });
  });

  it('is stocked with 3 months of cloth by a cloth peddler', () => {
    const { game, guild } = placedGuild();
    supplyGuild(guild);
    guild.cloth = 0;
    placeBuilding(game, 'agora', 10, 18);
    placeBuilding(game, 'clothVendor', 10, 18);
    const vendor = game.buildings.find((b) => b.type === 'clothVendor')!;
    vendor.cloth = 400;
    for (let i = 0; i < TICKS_PER_MONTH && guild.cloth === 0; i++) tick(game);
    expect(guild.cloth).toBe(24);
    expect(vendor.cloth).toBe(376);
  });

  it('is covered by water carriers', () => {
    const { game, guild } = placedGuild();
    supplyGuild(guild);
    guild.coveredUntil.water = 0;
    placeBuilding(game, 'fountain', 8, 15);
    for (let i = 0; i < TICKS_PER_MONTH && guild.coveredUntil.water === 0; i++) tick(game);
    expect(guild.coveredUntil.water).toBeGreaterThan(game.tick);
  });

  it('resets Well fed when it goes hungry', () => {
    const { game, guild } = placedGuild();
    supplyGuild(guild);
    guild.food = 0;
    untilMonthEnd(game);
    expect(game.wellFed.reset).toEqual({ tick: game.tick, house: "Traders' Guild at 3,12" });
  });
});

describe("a Traders' Guild's demotion", () => {
  it('breaks it into four vacant lots a month after placement without cloth', () => {
    const { game, guild } = placedGuild();
    supplyGuild(guild);
    guild.cloth = 0;
    runTicks(game, LEVEL_CHANGE_TICKS - 1);
    expect(guildOf(game)).toBe(guild);
    tick(game);
    expect(game.buildings.some((b) => b.type === 'tradersGuild')).toBe(false);
    const lots = blockLots(game);
    expect(lots.map(({ x, y, residents }) => ({ x, y, residents }))).toEqual(GUILD_LOTS.map((lot) => ({ ...lot, residents: 0 })));
  });

  it('does not refund the lots or the permit', () => {
    const { game, guild } = placedGuild();
    const before = game.treasury;
    runTicks(game, LEVEL_CHANGE_TICKS);
    expect(game.buildings.some((b) => b.id === guild.id)).toBe(false);
    expect(game.treasury).toBe(before);
    expect(game.guildPermits).toBe(0);
  });

  it('is stopped by cloth arriving within the month', () => {
    const { game, guild } = placedGuild();
    supplyGuild(guild);
    guild.cloth = 0;
    runTicks(game, LEVEL_CHANGE_TICKS / 2);
    guild.cloth = 24;
    tick(game);
    expect(guild.pendingTicks).toBe(0);
    runTicks(game, LEVEL_CHANGE_TICKS);
    expect(guildOf(game)).toBe(guild);
  });

  it('never comes to a fully supplied guild', () => {
    const { game, guild } = placedGuild();
    supplyGuild(guild);
    runTicks(game, 2 * LEVEL_CHANGE_TICKS);
    expect(guildOf(game)).toBe(guild);
    expect(guild.pendingTicks).toBe(0);
  });

  it('comes when the appeal falls below 25', () => {
    const { game, guild } = placedGuild();
    supplyGuild(guild);
    expect(houseAppeal(game, guild)).toBe(27);
    demolish(game, { x: 1, y: 13 }, { x: 1, y: 13 });
    runTicks(game, LEVEL_CHANGE_TICKS);
    expect(game.buildings.some((b) => b.type === 'tradersGuild')).toBe(false);
  });

  it('posts a notice at its place naming what it lacked', () => {
    const { game, guild } = placedGuild();
    supplyGuild(guild);
    Object.assign(guild, { cloth: 0, oil: 0 });
    runTicks(game, LEVEL_CHANGE_TICKS);
    expect(game.notices.at(-1)).toMatchObject({
      text: "The Traders' Guild at 3,12 broke up: it lacked oil, cloth. Its permit is lost",
      at: { x: 3, y: 12 },
    });
  });

  it('names missing culture and appeal with what it had', () => {
    const { game, guild } = placedGuild();
    supplyGuild(guild);
    guild.coveredUntil.athletics = 0;
    demolish(game, { x: 1, y: 13 }, { x: 1, y: 13 });
    runTicks(game, LEVEL_CHANGE_TICKS);
    expect(game.notices.at(-1)?.text).toBe(
      "The Traders' Guild at 3,12 broke up: it lacked culture 45 (has 25), appeal 25 (has 22). Its permit is lost",
    );
  });
});

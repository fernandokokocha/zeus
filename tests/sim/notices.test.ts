import { describe, expect, it } from 'vitest';
import { TICKS_PER_MONTH } from '../../src/sim/clock';
import { placeBuilding, placeRoad } from '../../src/sim/commands';
import { UNITS_PER_LOAD } from '../../src/sim/food';
import { LEVEL_CHANGE_TICKS } from '../../src/sim/housing';
import { NOTICE_LOG_LIMIT, postNotice } from '../../src/sim/notices';
import { RISK_LIMIT, catchFire } from '../../src/sim/safety';
import { SANCTUARY_WORK } from '../../src/sim/sanctuaries';
import type { GameState } from '../../src/sim/state';
import { tick } from '../../src/sim/tick';
import { guildBlock, grassGame, placeHouse, runTicks } from './helpers';

const loads = (count: number) => count * UNITS_PER_LOAD;

function texts(game: GameState): string[] {
  return game.notices.map((n) => n.text);
}

describe('notices', () => {
  it('start empty', () => {
    expect(grassGame().notices).toEqual([]);
  });

  it('are posted when a building catches fire, with its tile and the tick', () => {
    const game = grassGame();
    placeBuilding(game, 'taxOffice', 4, 4);
    runTicks(game, 3);
    catchFire(game, game.buildings[0]);
    expect(game.notices).toEqual([{ id: 1, tick: 3, text: 'Fire! The Tax Office at 4,4 is burning', at: { x: 4, y: 4 } }]);
  });

  it('name a burning house by its level', () => {
    const game = grassGame();
    placeHouse(game, 4, 4);
    Object.assign(game.buildings[0], { level: 'hovel', residents: 20 });
    catchFire(game, game.buildings[0]);
    expect(texts(game)).toEqual(['Fire! The Hovel at 4,4 is burning']);
  });

  it('are posted for each building a fire spreads to', () => {
    const game = grassGame();
    placeBuilding(game, 'taxOffice', 4, 4);
    placeBuilding(game, 'taxOffice', 6, 4);
    game.buildings[1].fireRisk = RISK_LIMIT * TICKS_PER_MONTH;
    tick(game);
    catchFire(game, game.buildings[0]);
    tick(game);
    expect(texts(game)).toEqual(['Fire! The Tax Office at 4,4 is burning', 'Fire! The Tax Office at 6,4 is burning']);
  });

  it('are posted when a building collapses', () => {
    const game = grassGame();
    placeBuilding(game, 'fountain', 4, 4);
    runTicks(game, 7.5 * TICKS_PER_MONTH);
    expect(texts(game)).toEqual(['The Fountain at 4,4 collapsed']);
  });

  it('are posted when a house devolves, naming both levels', () => {
    const game = grassGame();
    placeHouse(game, 4, 4);
    Object.assign(game.buildings[0], { level: 'shack', residents: 16 });
    runTicks(game, LEVEL_CHANGE_TICKS);
    expect(game.buildings[0].level).toBe('hut');
    expect(game.notices).toMatchObject([{ text: 'Shack at 4,4 devolved to a Hut', at: { x: 4, y: 4 } }]);
  });

  it('say "an Apartment" when a Townhouse devolves', () => {
    const game = grassGame();
    placeHouse(game, 4, 4);
    Object.assign(game.buildings[0], { level: 'townhouse', residents: 60 });
    runTicks(game, LEVEL_CHANGE_TICKS);
    expect(texts(game)).toEqual(['Townhouse at 4,4 devolved to an Apartment']);
  });

  it('are not posted when a house evolves', () => {
    const game = grassGame();
    placeHouse(game, 4, 4);
    Object.assign(game.buildings[0], { residents: 8, food: loads(1) });
    runTicks(game, LEVEL_CHANGE_TICKS);
    expect(game.buildings[0].level).toBe('shack');
    expect(game.notices).toEqual([]);
  });

  it('are posted once when a sanctuary is finished', () => {
    const game = grassGame(60);
    placeRoad(game, { x: 0, y: 30 }, { x: 59, y: 30 });
    placeHouse(game, 0, 58);
    game.buildings[0].residents = 400;
    placeBuilding(game, 'storehouse', 2, 27);
    game.buildings[1].marble = loads(13);
    placeBuilding(game, 'hephaestusSanctuary', 20, 31);
    placeBuilding(game, 'artisansGuild', 8, 28);
    const site = game.buildings[2];
    Object.assign(site, { marble: loads(48), wood: loads(14), sculptures: loads(6), production: SANCTUARY_WORK - 1 });
    runTicks(game, 4 * TICKS_PER_MONTH);
    expect(game.notices).toMatchObject([{ text: 'The Forge of Hephaestus is finished', at: { x: 20, y: 31 } }]);
  });

  it(`keep the ${NOTICE_LOG_LIMIT} newest, with rising ids`, () => {
    const game = grassGame();
    for (let i = 1; i <= NOTICE_LOG_LIMIT + 2; i++) postNotice(game, `Notice ${i}`, { x: 0, y: 0 });
    expect(game.notices).toHaveLength(NOTICE_LOG_LIMIT);
    expect(game.notices[0]).toMatchObject({ id: 3, text: 'Notice 3' });
    expect(game.notices.at(-1)).toMatchObject({ id: NOTICE_LOG_LIMIT + 2 });
  });
});

describe('the guild site notice', () => {
  const siteNotices = (game: GameState) => game.notices.filter((n) => n.text.startsWith("A Traders' Guild can now be placed"));

  it('is posted at the block the first time a guild can be placed there', () => {
    const { game } = guildBlock();
    tick(game);
    expect(siteNotices(game)).toMatchObject([{ text: "A Traders' Guild can now be placed at 3,12", at: { x: 3, y: 12 } }]);
  });

  it('is posted once per block, even when the block stops and starts qualifying', () => {
    const { game } = guildBlock();
    runTicks(game, 3);
    game.guildPermits = 0;
    tick(game);
    game.guildPermits = 1;
    runTicks(game, 3);
    expect(siteNotices(game)).toHaveLength(1);
  });

  it('waits for a permit', () => {
    const { game } = guildBlock();
    game.guildPermits = 0;
    runTicks(game, 3);
    expect(siteNotices(game)).toEqual([]);
    game.guildPermits = 1;
    tick(game);
    expect(siteNotices(game)).toHaveLength(1);
  });
});

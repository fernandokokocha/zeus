import { describe, expect, it } from 'vitest';
import { BUILDING_SPECS } from '../../src/sim/buildings';
import { TICKS_PER_MONTH } from '../../src/sim/clock';
import { demolish, placeBuilding, placeRoad } from '../../src/sim/commands';
import { FLEECE_KEPT_FOR_VENDORS } from '../../src/sim/cloth';
import { UNITS_PER_LOAD } from '../../src/sim/food';
import { PAGES_PER_SCROLL, SCRIPTORIUM_INPUT_CAPACITY, SCRIPTORIUM_SCROLL_CAPACITY, SCROLLS_PER_YEAR, copyingTicks } from '../../src/sim/scrolls';
import type { Building, GameState } from '../../src/sim/state';
import { tick } from '../../src/sim/tick';
import { WALKER_TILES_PER_TICK } from '../../src/sim/walking';
import { grassGame, placeHouse, runTicks } from './helpers';

const PAPYRUS_LOAD_TICKS = TICKS_PER_MONTH / 2;
const FLEECE_LOAD_TICKS = TICKS_PER_MONTH / 20;
const SCROLL_TICKS = 4 * PAPYRUS_LOAD_TICKS;

function scrollTown(people = 100): { game: GameState; storehouse: Building; scriptorium: Building } {
  const game = grassGame(30);
  placeRoad(game, { x: 0, y: 15 }, { x: 29, y: 15 });
  placeHouse(game, 0, 28);
  game.buildings[0].residents = people;
  placeBuilding(game, 'storehouse', 10, 12);
  placeBuilding(game, 'scriptorium', 20, 13);
  const [, storehouse, scriptorium] = game.buildings;
  return { game, storehouse, scriptorium };
}

function kindsOut(game: GameState): string[] {
  return game.carriers.map((c) => c.kind).sort();
}

function untilCarriersGone(game: GameState): void {
  for (let i = 0; i < 1000 && game.carriers.length > 0; i++) tick(game);
}

describe('a scriptorium', () => {
  it('is a 2×2 workshop of 12 workers for 50 dr', () => {
    const { game } = scrollTown();
    const before = game.treasury;
    expect(placeBuilding(game, 'scriptorium', 24, 13)).toEqual({ ok: true });
    expect(game.treasury).toBe(before - 50);
    expect(BUILDING_SPECS.scriptorium).toMatchObject({ width: 2, height: 2, workers: 12 });
  });

  it('copies a load of papyrus in half a month and a load of fleece in a twentieth of one', () => {
    expect(copyingTicks('papyrus')).toBe(PAPYRUS_LOAD_TICKS);
    expect(copyingTicks('fleece')).toBe(FLEECE_LOAD_TICKS);
  });

  it('makes 6 scrolls a year at full staff', () => {
    expect(SCROLLS_PER_YEAR).toBe(6);
    expect(SCROLL_TICKS * SCROLLS_PER_YEAR).toBe(12 * TICKS_PER_MONTH);
  });

  it('turns a papyrus load into 10 of the 40 pages of a scroll', () => {
    const { game, scriptorium } = scrollTown();
    scriptorium.papyrus = 100;
    runTicks(game, PAPYRUS_LOAD_TICKS - 1);
    expect(scriptorium).toMatchObject({ papyrus: 100, pages: 0 });
    tick(game);
    expect(scriptorium).toMatchObject({ papyrus: 0, pages: 10 });
    expect(PAGES_PER_SCROLL).toBe(40);
  });

  it('turns a fleece load into one page', () => {
    const { game, scriptorium } = scrollTown();
    scriptorium.fleece = 100;
    runTicks(game, FLEECE_LOAD_TICKS);
    expect(scriptorium).toMatchObject({ fleece: 0, pages: 1 });
  });

  it('makes a scroll from 4 loads of papyrus', () => {
    const { game, scriptorium } = scrollTown();
    scriptorium.papyrus = 400;
    runTicks(game, SCROLL_TICKS - 1);
    expect(scriptorium.scrolls).toBe(0);
    tick(game);
    expect(scriptorium).toMatchObject({ papyrus: 0, pages: 0, scrolls: 100 });
  });

  it('makes a scroll from 40 loads of fleece', () => {
    const { game, scriptorium } = scrollTown();
    scriptorium.fleece = 4000;
    runTicks(game, SCROLL_TICKS);
    expect(scriptorium).toMatchObject({ fleece: 0, pages: 0, scrolls: 100 });
  });

  it('adds papyrus and fleece pages to the same scroll', () => {
    const { game, scriptorium } = scrollTown();
    Object.assign(scriptorium, { papyrus: 300, fleece: 1000 });
    runTicks(game, SCROLL_TICKS);
    expect(scriptorium).toMatchObject({ papyrus: 0, fleece: 0, pages: 0, scrolls: 100 });
  });

  it('copies papyrus before fleece', () => {
    const { game, scriptorium } = scrollTown();
    Object.assign(scriptorium, { papyrus: 100, fleece: 100 });
    runTicks(game, PAPYRUS_LOAD_TICKS);
    expect(scriptorium).toMatchObject({ papyrus: 0, fleece: 100, pages: 10 });
    runTicks(game, FLEECE_LOAD_TICKS);
    expect(scriptorium).toMatchObject({ fleece: 0, pages: 11 });
  });

  it('takes twice as long at half staff', () => {
    const { game, scriptorium } = scrollTown(35);
    scriptorium.papyrus = 100;
    tick(game);
    expect(scriptorium.workers).toBe(6);
    runTicks(game, 2 * PAPYRUS_LOAD_TICKS - 2);
    expect(scriptorium.pages).toBe(0);
    tick(game);
    expect(scriptorium.pages).toBe(10);
  });

  it('does nothing without workers', () => {
    const { game, scriptorium } = scrollTown(20);
    scriptorium.papyrus = 100;
    runTicks(game, PAPYRUS_LOAD_TICKS);
    expect(scriptorium).toMatchObject({ workers: 0, papyrus: 100, pages: 0 });
  });

  it('stops while 4 scrolls wait for a cart', () => {
    const { game, scriptorium } = scrollTown();
    demolish(game, { x: 10, y: 12 }, { x: 10, y: 12 });
    Object.assign(scriptorium, { papyrus: 100, scrolls: SCRIPTORIUM_SCROLL_CAPACITY });
    runTicks(game, PAPYRUS_LOAD_TICKS);
    expect(scriptorium).toMatchObject({ papyrus: 100, pages: 0, production: 0 });
  });
});

describe("a scriptorium's buyer", () => {
  it('fetches 4 loads of papyrus from the storehouse', () => {
    const { game, storehouse, scriptorium } = scrollTown();
    storehouse.papyrus = 1000;
    tick(game);
    expect(game.carriers.find((c) => c.kind === 'papyrusBuyer')).toMatchObject({ homeId: scriptorium.id, destinationId: storehouse.id });
    for (let i = 0; i < 600 && scriptorium.papyrus === 0; i++) tick(game);
    expect(scriptorium.papyrus).toBe(SCRIPTORIUM_INPUT_CAPACITY);
    expect(storehouse.papyrus).toBe(1000 - SCRIPTORIUM_INPUT_CAPACITY);
  });

  it('fetches fleece only while no storehouse has papyrus', () => {
    const { game, storehouse, scriptorium } = scrollTown();
    Object.assign(storehouse, { papyrus: 100, fleece: 1000 });
    tick(game);
    expect(kindsOut(game)).toEqual(['papyrusBuyer']);
    untilCarriersGone(game);
    expect(scriptorium.papyrus).toBe(100);
    tick(game);
    expect(kindsOut(game)).toEqual(['scriptoriumFleeceBuyer']);
    untilCarriersGone(game);
    expect(scriptorium.fleece).toBeGreaterThan(0);
    expect(storehouse.fleece).toBeLessThan(1000);
  });

  it('is out for one good at a time', () => {
    const { game, storehouse } = scrollTown();
    storehouse.fleece = 1000;
    tick(game);
    expect(kindsOut(game)).toEqual(['scriptoriumFleeceBuyer']);
    storehouse.papyrus = 1000;
    for (let i = 0; i < 1000 && game.carriers.length > 0; i++) {
      tick(game);
      expect(kindsOut(game)).not.toContain('papyrusBuyer');
    }
  });

  it('fetches no more than 4 loads of papyrus and fleece together', () => {
    const { game, storehouse, scriptorium } = scrollTown();
    storehouse.refused = ['scrolls'];
    storehouse.papyrus = 1000;
    Object.assign(scriptorium, { fleece: 300, scrolls: SCRIPTORIUM_SCROLL_CAPACITY });
    tick(game);
    untilCarriersGone(game);
    expect(scriptorium).toMatchObject({ papyrus: 100, fleece: 300 });
    expect(storehouse.papyrus).toBe(900);
  });

  it('leaves 4 loads of fleece in the storehouse for fleece vendors', () => {
    const { game, storehouse } = scrollTown();
    storehouse.fleece = FLEECE_KEPT_FOR_VENDORS;
    runTicks(game, 10);
    expect(game.carriers).toEqual([]);
  });

  it('waits for a storehouse with papyrus or fleece', () => {
    const { game } = scrollTown();
    runTicks(game, 10);
    expect(game.carriers).toEqual([]);
  });
});

describe("a scriptorium's cart pusher", () => {
  it('takes the scrolls to the nearest storehouse', () => {
    const { game, storehouse, scriptorium } = scrollTown();
    scriptorium.scrolls = 400;
    tick(game);
    expect(game.carriers[0]).toMatchObject({ kind: 'scrollCart', homeId: scriptorium.id, destinationId: storehouse.id, scrolls: 400 });
    runTicks(game, Math.ceil(12 / WALKER_TILES_PER_TICK));
    expect(storehouse.scrolls).toBe(400);
  });

  it('stays home while no storehouse takes scrolls', () => {
    const { game, storehouse, scriptorium } = scrollTown();
    storehouse.refused = ['scrolls'];
    scriptorium.scrolls = UNITS_PER_LOAD;
    runTicks(game, 10);
    expect(game.carriers).toEqual([]);
  });
});

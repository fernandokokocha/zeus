import { describe, expect, it } from 'vitest';
import { demolish, placeBuilding, placeRoad } from '../../src/sim/commands';
import { TICKS_PER_MONTH } from '../../src/sim/clock';
import { ROAMER_REST_TICKS } from '../../src/sim/roamers';
import type { GameState } from '../../src/sim/state';
import { describeTile } from '../../src/sim/inspect';
import { SETTLER_SPAWN_INTERVAL_TICKS } from '../../src/sim/settlers';
import { grassGame, placeHouse, runTicks, setTerrain } from './helpers';

describe('describeTile', () => {
  it('describes buildable terrain', () => {
    expect(describeTile(grassGame(), 4, 4)).toEqual({ title: 'Grass', lines: ['Tile 4, 4', 'Buildable'] });
  });

  it('describes unbuildable terrain', () => {
    const game = grassGame();
    setTerrain(game, 4, 4, 'marble');
    expect(describeTile(game, 4, 4)).toEqual({ title: 'Marble', lines: ['Tile 4, 4', 'Not buildable'] });
  });

  it('describes a road', () => {
    const game = grassGame();
    placeRoad(game, { x: 4, y: 4 }, { x: 4, y: 4 });
    expect(describeTile(game, 4, 4)).toEqual({ title: 'Road', lines: ['Tile 4, 4'] });
  });

  it('describes a vacant lot from any of its tiles', () => {
    const game = grassGame();
    placeHouse(game, 2, 2);
    expect(describeTile(game, 3, 3)).toEqual({
      title: 'Vacant Lot',
      lines: ['Tile 2, 2', 'Residents 0/8', 'No road access: settlers cannot reach it'],
    });
  });

  it("says when a lot's road does not lead to the entry", () => {
    const game = grassGame();
    placeHouse(game, 2, 2);
    placeRoad(game, { x: 2, y: 1 }, { x: 2, y: 1 });
    expect(describeTile(game, 2, 2).lines).toContain('Its road does not connect to the entry');
  });

  it('says when a lot is waiting for settlers, and when they are on the way', () => {
    const game = grassGame();
    placeHouse(game, 2, 8);
    expect(describeTile(game, 2, 8).lines).toContain('Waiting for settlers');
    runTicks(game, SETTLER_SPAWN_INTERVAL_TICKS);
    expect(describeTile(game, 2, 8).lines).toContain('Settlers on the way');
  });

  it('describes a Hut and what its next level needs', () => {
    const game = grassGame();
    placeHouse(game, 2, 8);
    runTicks(game, 2 * SETTLER_SPAWN_INTERVAL_TICKS);
    expect(describeTile(game, 2, 8)).toEqual({
      title: 'Hut',
      lines: ['Tile 2, 8', 'Residents 8/8', 'No water carrier has passed', 'No tax collector has passed', 'Needs for Shack: food'],
    });
  });

  it('describes a settler on the road tile it stands on', () => {
    const game = grassGame();
    placeHouse(game, 2, 8);
    runTicks(game, SETTLER_SPAWN_INTERVAL_TICKS);
    expect(describeTile(game, 0, 10)).toEqual({
      title: 'Settler',
      lines: ['Carrying 8 people', 'Heading to Vacant Lot at 2, 8'],
    });
  });
});

describe('describeTile for services', () => {
  function town(): GameState {
    const game = grassGame();
    placeRoad(game, { x: 0, y: 10 }, { x: 19, y: 10 });
    placeHouse(game, 2, 8);
    game.buildings[0].residents = 8;
    return game;
  }

  it('says when a Hut has water and pays tax', () => {
    const game = town();
    placeBuilding(game, 'palace', 6, 4);
    game.buildings[0].coveredUntil = { water: TICKS_PER_MONTH, tax: TICKS_PER_MONTH };
    expect(describeTile(game, 2, 8).lines).toEqual([
      'Tile 2, 8',
      'Residents 8/8',
      'Has water',
      'Pays 0.72 dr tax a month',
      'Needs for Shack: food',
    ]);
  });

  it('says when a registered house has no palace to pay', () => {
    const game = town();
    game.buildings[0].coveredUntil.tax = TICKS_PER_MONTH;
    expect(describeTile(game, 2, 8).lines).toContain('No palace to collect its tax');
  });

  it('describes a staffed fountain and its carrier', () => {
    const game = town();
    placeBuilding(game, 'fountain', 6, 11);
    runTicks(game, 1);
    expect(describeTile(game, 7, 12)).toEqual({
      title: 'Fountain',
      lines: ['Tile 6, 11', 'Workers 4/4', 'Water Carrier getting ready'],
    });
    runTicks(game, ROAMER_REST_TICKS);
    expect(describeTile(game, 6, 11).lines).toContain('Water Carrier out in the streets');
  });

  it('says when a building has no workers or no road', () => {
    const game = grassGame();
    placeBuilding(game, 'taxOffice', 2, 11);
    placeBuilding(game, 'fountain', 6, 14);
    runTicks(game, 1);
    expect(describeTile(game, 2, 11).lines).toEqual(['Tile 2, 11', 'Workers 0/8', 'No workers: does not work']);
    expect(describeTile(game, 6, 14).lines).toEqual(['Tile 6, 14', 'No road access: does not work']);
  });

  it("shows last month's taxes and wages on the Palace", () => {
    const game = town();
    placeBuilding(game, 'palace', 6, 4);
    game.lastMonth = { taxes: 12.5, wages: 3 };
    expect(describeTile(game, 6, 4)).toEqual({
      title: 'Palace',
      lines: ['Tile 6, 4', 'Taxes last month: 12.5 dr', 'Wages last month: 3 dr'],
    });
  });

  it('describes a roaming walker', () => {
    const game = town();
    placeBuilding(game, 'fountain', 0, 11);
    runTicks(game, ROAMER_REST_TICKS);
    expect(describeTile(game, 0, 10)).toEqual({
      title: 'Water Carrier',
      lines: ['From the Fountain at 0, 11', 'Walked 0 of 27 tiles'],
    });
    game.roamers[0].returning = true;
    expect(describeTile(game, 0, 10).lines).toContain('Returning home');
  });
});

describe('describeTile after a demolition while paused', () => {
  it('describes a settler whose lot was just demolished', () => {
    const game = grassGame();
    placeHouse(game, 4, 8);
    runTicks(game, SETTLER_SPAWN_INTERVAL_TICKS);
    demolish(game, { x: 4, y: 8 }, { x: 4, y: 8 });
    expect(describeTile(game, 0, 10)).toEqual({
      title: 'Settler',
      lines: ['Carrying 8 people', 'Looking for another lot'],
    });
  });

  it('removes roamers along with their home', () => {
    const game = grassGame();
    placeHouse(game, 2, 8);
    game.buildings[0].residents = 8;
    placeBuilding(game, 'fountain', 0, 11);
    runTicks(game, ROAMER_REST_TICKS);
    demolish(game, { x: 0, y: 11 }, { x: 0, y: 11 });
    expect(game.roamers).toEqual([]);
    expect(describeTile(game, 0, 10).title).toBe('Road');
  });
});

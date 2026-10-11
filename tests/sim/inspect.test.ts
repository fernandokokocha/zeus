import { describe, expect, it } from 'vitest';
import { demolish, placeBuilding, placeRoad, placeRoadblock, placeSheep } from '../../src/sim/commands';
import { SHEARING_REST_TICKS, sheepTile } from '../../src/sim/sheep';
import { TICKS_PER_MONTH } from '../../src/sim/clock';
import { ROAMER_REST_TICKS } from '../../src/sim/roamers';
import type { Building, GameState } from '../../src/sim/state';
import { describeTile } from '../../src/sim/inspect';
import { SETTLER_SPAWN_INTERVAL_TICKS } from '../../src/sim/settlers';
import { walkerTile } from '../../src/sim/walking';
import { grassGame, placeHouse, runTicks, setMeadow, setTerrain } from './helpers';

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
      lines: [
        'Tile 2, 8',
        'Residents 8/8',
        'Appeal 0',
        'No food',
        'No water carrier has passed',
        'No culture has passed',
        'No tax collector has passed',
        'Needs for Shack: food',
      ],
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
    Object.assign(game.buildings[0].coveredUntil, { water: TICKS_PER_MONTH, tax: TICKS_PER_MONTH });
    expect(describeTile(game, 2, 8).lines).toEqual([
      'Tile 2, 8',
      'Residents 8/8',
      'Appeal 16',
      'No food',
      'Water: 50% left',
      'No culture has passed',
      'Pays 0.72 dr tax a month',
      'Needs for Shack: food',
    ]);
  });

  it('shows the water running down until the next carrier', () => {
    const game = town();
    game.buildings[0].coveredUntil.water = TICKS_PER_MONTH;
    game.tick = TICKS_PER_MONTH / 2;
    expect(describeTile(game, 2, 8).lines).toContain('Water: 25% left');
    game.tick = TICKS_PER_MONTH - 1;
    expect(describeTile(game, 2, 8).lines).toContain('Water: 1% left');
    game.tick = TICKS_PER_MONTH;
    expect(describeTile(game, 2, 8).lines).toContain('No water carrier has passed');
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

describe('describeTile for a roadblock', () => {
  it('says what it stops', () => {
    const game = grassGame();
    placeRoadblock(game, { x: 4, y: 10 });
    expect(describeTile(game, 4, 10)).toEqual({
      title: 'Roadblock',
      lines: ['Tile 4, 10', 'Stops roaming walkers; settlers pass'],
    });
  });
});

describe('describeTile for food and appeal', () => {
  function street(): { game: GameState; house: Building } {
    const game = grassGame(30);
    placeRoad(game, { x: 0, y: 15 }, { x: 29, y: 15 });
    placeHouse(game, 2, 13);
    const house = game.buildings[0];
    house.residents = 8;
    return { game, house };
  }

  it('shows what keeps a Hut from becoming a Shack', () => {
    const { game, house } = street();
    placeBuilding(game, 'taxOffice', 5, 11);
    house.food = 3;
    expect(describeTile(game, 2, 13).lines).toEqual(expect.arrayContaining(['Appeal -2', 'Food: 3 units', 'Needs for Shack: appeal 0 (has -2)']));
    house.food = 0;
    expect(describeTile(game, 2, 13).lines).toContain('Needs for Shack: food, appeal 0 (has -2)');
  });

  it("shows how long a Shack's food lasts", () => {
    const { game, house } = street();
    Object.assign(house, { level: 'shack', residents: 16, food: 6 });
    const lines = describeTile(game, 2, 13).lines;
    expect(lines).toContain('Food: 6 units (1.5 months)');
  });

  it('describes a farm, its crop and its cart', () => {
    const { game } = street();
    game.buildings[0].residents = 100;
    setMeadow(game, 6, 12, 3, 3);
    placeBuilding(game, 'wheatFarm', 6, 12);
    placeBuilding(game, 'granary', 14, 11);
    const farm = game.buildings[1];
    farm.growth = 0.426;
    runTicks(game, 1);
    expect(describeTile(game, 7, 13)).toEqual({
      title: 'Wheat Farm',
      lines: ['Tile 6, 12', 'Workers 10/10', 'Crop 43% grown, harvest in July', 'Cart Pusher at the farm'],
    });
    farm.food = 600;
    runTicks(game, 1);
    expect(describeTile(game, 7, 13).lines).toEqual(expect.arrayContaining(['Harvest waiting: 2 loads', 'Cart Pusher out with a load']));
    expect(describeTile(game, game.carriers[0].path[0].x, 15)).toEqual({
      title: 'Cart Pusher',
      lines: ['From the Wheat Farm at 6, 12', 'Carrying 4 loads to the Granary at 14, 11'],
    });
  });

  it('describes a granary', () => {
    const { game } = street();
    placeBuilding(game, 'granary', 14, 11);
    game.buildings[1].food = 1250;
    expect(describeTile(game, 14, 11).lines).toContain('Wheat: 12.5 of 32 loads');
  });

  it('describes an agora, its vendor and the buyer', () => {
    const { game } = street();
    game.buildings[0].residents = 100;
    placeBuilding(game, 'agora', 10, 16);
    expect(describeTile(game, 11, 18).lines).toEqual(['Tile 10, 16', 'No vendors yet: place one on a free spot']);
    placeBuilding(game, 'foodVendor', 10, 16);
    placeBuilding(game, 'granary', 20, 11);
    expect(describeTile(game, 12, 18).lines).toEqual(['Tile 10, 16', 'Vendors: Food Vendor']);
    runTicks(game, 1);
    expect(describeTile(game, 10, 17)).toEqual({
      title: 'Food Vendor',
      lines: ['Tile 10, 16', 'Workers 4/4', 'Stock: 0 of 800 units', 'Peddler waits for food', 'Buyer waits for a granary with wheat'],
    });
    game.buildings[3].food = 1000;
    runTicks(game, 1);
    expect(describeTile(game, 10, 15)).toEqual({
      title: 'Buyer',
      lines: ['From the Food Vendor at 10, 16', 'Fetching wheat from the Granary at 20, 11'],
    });
    game.carriers[0].returning = true;
    game.carriers[0].food = 400;
    expect(describeTile(game, 10, 15).lines).toContain('Bringing home 400 units');
  });

  it('describes a decoration by its appeal', () => {
    const game = grassGame();
    placeBuilding(game, 'flowerGarden', 4, 4);
    expect(describeTile(game, 5, 5)).toEqual({ title: 'Flower Garden', lines: ['Tile 4, 4', 'Appeal 8, 7, 6 by distance'] });
  });
});

describe('describeTile for culture', () => {
  function street(): { game: GameState; house: Building } {
    const game = grassGame(30);
    placeRoad(game, { x: 0, y: 15 }, { x: 29, y: 15 });
    placeHouse(game, 2, 13);
    const house = game.buildings[0];
    house.residents = 100;
    return { game, house };
  }

  function lastBuilding(game: GameState): Building {
    return game.buildings[game.buildings.length - 1];
  }

  it('shows the culture a house has and what keeps a Shack from becoming a Hovel', () => {
    const { game, house } = street();
    Object.assign(house, { level: 'shack', residents: 16, food: 6 });
    placeBuilding(game, 'podium', 5, 13);
    const lines = describeTile(game, 2, 13).lines;
    expect(lines).toContain('No culture has passed');
    expect(lines).toContain('Needs for Hovel: water, culture 15 (has 0), appeal 10 (has 1)');
    Object.assign(house.coveredUntil, { water: TICKS_PER_MONTH, philosophy: TICKS_PER_MONTH, drama: TICKS_PER_MONTH });
    expect(describeTile(game, 2, 13).lines).toEqual(
      expect.arrayContaining(['Culture 40: philosophy, drama', 'Needs for Hovel: appeal 10 (has 1)']),
    );
  });

  it('shows no next level for a Tenement', () => {
    const { game, house } = street();
    Object.assign(house, { level: 'tenement', residents: 40, food: 6 });
    const { title, lines } = describeTile(game, 2, 13);
    expect(title).toBe('Tenement');
    expect(lines.some((line) => line.startsWith('Needs'))).toBe(false);
  });

  it('describes a college and its philosopher on the way', () => {
    const { game } = street();
    placeBuilding(game, 'college', 6, 12);
    runTicks(game, 1);
    expect(describeTile(game, 7, 13)).toEqual({
      title: 'College',
      lines: ['Tile 6, 12', 'Workers 12/12', 'Philosopher waits for a staffed Podium'],
    });
    placeBuilding(game, 'podium', 16, 13);
    runTicks(game, 1);
    expect(describeTile(game, 7, 13).lines).toContain('Philosopher in training');
    runTicks(game, ROAMER_REST_TICKS);
    expect(describeTile(game, 7, 13).lines).toContain('Philosopher on the way to the Podium at 16, 13');
    const { x, y } = walkerTile(game.trainees[0]);
    expect(describeTile(game, x, y)).toEqual({
      title: 'Philosopher',
      lines: ['From the College at 6, 12', 'Heading to the Podium at 16, 13'],
    });
    demolish(game, { x: 16, y: 13 }, { x: 16, y: 13 });
    expect(describeTile(game, x, y).lines).toContain('Looking for another Podium');
  });

  it('describes a podium with and without a philosopher', () => {
    const { game } = street();
    placeBuilding(game, 'podium', 16, 13);
    const podium = lastBuilding(game);
    runTicks(game, 1);
    expect(describeTile(game, 16, 13)).toEqual({
      title: 'Podium',
      lines: ['Tile 16, 13', 'Workers 4/4', 'No philosophers here: a College sends them', 'Philosopher waits for one to arrive'],
    });
    podium.performingUntil = game.tick + TICKS_PER_MONTH * 1.5;
    expect(describeTile(game, 16, 13).lines).toEqual([
      'Tile 16, 13',
      'Workers 4/4',
      'Philosophers here for 1.5 more months',
      'Philosopher getting ready',
    ]);
  });

  it('describes a gymnasium and its athlete', () => {
    const { game } = street();
    placeBuilding(game, 'gymnasium', 16, 12);
    runTicks(game, ROAMER_REST_TICKS);
    expect(describeTile(game, 17, 13)).toEqual({
      title: 'Gymnasium',
      lines: ['Tile 16, 12', 'Workers 7/7', 'Athlete out in the streets'],
    });
  });
});

describe('describeTile for fleece', () => {
  const LONG = 10 * TICKS_PER_MONTH;

  function street(): { game: GameState; house: Building } {
    const game = grassGame(30);
    placeRoad(game, { x: 0, y: 15 }, { x: 29, y: 15 });
    placeHouse(game, 2, 13);
    const house = game.buildings[0];
    house.residents = 100;
    return { game, house };
  }

  function lastBuilding(game: GameState): Building {
    return game.buildings[game.buildings.length - 1];
  }

  it("shows a Hovel's fleece and what keeps it from becoming a Homestead", () => {
    const { game, house } = street();
    Object.assign(house, { level: 'hovel', residents: 24, food: 50 });
    Object.assign(house.coveredUntil, { water: LONG, philosophy: LONG });
    placeBuilding(game, 'flowerGarden', 2, 11);
    placeBuilding(game, 'flowerGarden', 4, 13);
    const lines = describeTile(game, 2, 13).lines;
    expect(lines).toContain('No fleece');
    expect(lines).toContain('Needs for Homestead: fleece');
    house.fleece = 6;
    expect(describeTile(game, 2, 13).lines).toEqual(expect.arrayContaining(['Fleece: 6 units', 'Ready to become a Homestead']));
  });

  it("shows how long a Homestead's fleece lasts and leaves fleece off a Shack", () => {
    const { game, house } = street();
    Object.assign(house, { level: 'homestead', residents: 32, food: 50, fleece: 6 });
    expect(describeTile(game, 2, 13).lines).toContain('Fleece: 6 units (3 months)');
    Object.assign(house, { level: 'shack', residents: 16 });
    expect(describeTile(game, 2, 13).lines.some((line) => line.includes('leece'))).toBe(false);
  });

  it('describes a storehouse by its fleece and slots', () => {
    const { game } = street();
    placeBuilding(game, 'storehouse', 10, 12);
    const storehouse = lastBuilding(game);
    runTicks(game, 1);
    expect(describeTile(game, 11, 13)).toEqual({ title: 'Storehouse', lines: ['Tile 10, 12', 'Workers 12/12', 'Empty: 8 slots of 4 loads'] });
    storehouse.fleece = 600;
    expect(describeTile(game, 11, 13).lines).toContain('Fleece: 6 loads in 2 of 8 slots');
  });

  it('describes a carding shed, its shepherd and its cart', () => {
    const { game } = street();
    placeBuilding(game, 'cardingShed', 6, 13);
    const shed = lastBuilding(game);
    runTicks(game, 1);
    expect(describeTile(game, 6, 13)).toEqual({
      title: 'Carding Shed',
      lines: ['Tile 6, 13', 'Workers 8/8', 'Shepherd waits for a sheep with a full fleece within 40 tiles', 'Cart Pusher at the shed'],
    });
    setMeadow(game, 7, 5, 7, 7);
    placeSheep(game, { x: 10, y: 8 });
    expect(describeTile(game, 6, 13).lines).toContain('Shepherd resting');
    runTicks(game, SHEARING_REST_TICKS);
    const at = sheepTile(game.sheep[0]);
    expect(describeTile(game, 6, 13).lines).toContain(`Shepherd out to shear the sheep at ${at.x}, ${at.y}`);
    const { x, y } = walkerTile(game.shepherds[0]);
    expect(describeTile(game, x, y)).toEqual({
      title: 'Shepherd',
      lines: ['From the Carding Shed at 6, 13', `Going to shear the sheep at ${at.x}, ${at.y}`],
    });
    game.shepherds[0].returning = true;
    game.shepherds[0].fleece = 100;
    expect(describeTile(game, x, y).lines).toContain('Bringing 1 load of fleece home');
    expect(describeTile(game, 6, 13).lines).toContain('Shepherd bringing fleece home');
    shed.fleece = 400;
    game.shepherds = [];
    expect(describeTile(game, 6, 13).lines).toEqual(
      expect.arrayContaining(['Fleece waiting: 4 loads', 'Shepherd waits: the shed is full', 'Cart Pusher waits for a storehouse with room']),
    );
  });

  it('describes a sheep', () => {
    const { game } = street();
    setMeadow(game, 7, 5, 7, 7);
    placeSheep(game, { x: 10, y: 8 });
    expect(describeTile(game, 10, 8)).toEqual({ title: 'Sheep', lines: ['Grazing near 10, 8', 'Full fleece: ready to shear'] });
    game.sheep[0].fleece = 0.426;
    expect(describeTile(game, 10, 8).lines).toContain('Fleece 43% grown');
  });

  it('describes a fleece vendor and its buyer', () => {
    const { game } = street();
    placeBuilding(game, 'agora', 10, 16);
    placeBuilding(game, 'fleeceVendor', 10, 16);
    placeBuilding(game, 'storehouse', 20, 12);
    runTicks(game, 1);
    expect(describeTile(game, 10, 17)).toEqual({
      title: 'Fleece Vendor',
      lines: ['Tile 10, 16', 'Workers 4/4', 'Stock: 0 of 800 units', 'Fleece Peddler waits for fleece', 'Buyer waits for a storehouse with fleece'],
    });
    lastBuilding(game).fleece = 1000;
    runTicks(game, 1);
    expect(describeTile(game, 10, 15)).toEqual({
      title: 'Buyer',
      lines: ['From the Fleece Vendor at 10, 16', 'Fetching fleece from the Storehouse at 20, 12'],
    });
  });
});

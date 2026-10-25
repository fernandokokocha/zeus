import { describe, expect, it } from 'vitest';
import { demolish, placeBuilding, placeOliveTrees, placeRoad, placeRoadblock, placeSheep } from '../../src/sim/commands';
import { gatheringRestTicks } from '../../src/sim/materials';
import { PICKING_REST_TICKS } from '../../src/sim/olives';
import { SHEARING_REST_TICKS, sheepTile } from '../../src/sim/sheep';
import { TICKS_PER_MONTH } from '../../src/sim/clock';
import { ROAMER_REST_TICKS } from '../../src/sim/roamers';
import { tileIndex, type Building, type GameState } from '../../src/sim/state';
import { describeTile, inspectTile, type Meter } from '../../src/sim/inspect';
import { FIRE_BURN_TICKS, RISK_LIMIT, catchFire } from '../../src/sim/safety';
import { SETTLER_SPAWN_INTERVAL_TICKS } from '../../src/sim/settlers';
import { walkerTile } from '../../src/sim/walking';
import { grassGame, mainRoadGame, placeHouse, runTicks, setMeadow, setTerrain } from './helpers';

function meter(game: GameState, x: number, y: number, label: string): Meter {
  const found = describeTile(game, x, y).meters.find((m) => m.label === label);
  if (!found) throw new Error(`No ${label} meter at ${x}, ${y}`);
  return found;
}

describe('describeTile', () => {
  it('describes buildable terrain', () => {
    expect(describeTile(grassGame(), 4, 4)).toEqual({ title: 'Grass', meters: [], lines: ['Tile 4, 4', 'Buildable'] });
  });

  it('describes unbuildable terrain', () => {
    const game = grassGame();
    setTerrain(game, 4, 4, 'marble');
    expect(describeTile(game, 4, 4)).toEqual({ title: 'Marble', meters: [], lines: ['Tile 4, 4', 'Not buildable'] });
  });

  it('describes a road', () => {
    const game = grassGame();
    placeRoad(game, { x: 4, y: 4 }, { x: 4, y: 4 });
    expect(describeTile(game, 4, 4)).toEqual({ title: 'Road', meters: [], lines: ['Tile 4, 4'] });
  });

  it('describes the Main Road', () => {
    const game = mainRoadGame();
    expect(describeTile(game, 3, 10)).toEqual({ title: 'Main Road', meters: [], lines: ['Tile 3, 10', 'Paved; cannot be demolished'] });
  });

  it('describes a vacant lot from any of its tiles', () => {
    const game = grassGame();
    placeHouse(game, 2, 2);
    expect(describeTile(game, 3, 3)).toEqual({
      title: 'Vacant Lot',
      meters: [],
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
      meters: [
        { label: 'Food', fill: 0, value: 'None', need: 'missing' },
        { label: 'Water', fill: 0, value: 'None', need: null },
        { label: 'Fleece', fill: 0, value: 'None', need: null },
        { label: 'Oil', fill: 0, value: 'None', need: null },
        { label: 'Culture', fill: 0, value: 'None', need: null },
      ],
      lines: [
        'Tile 2, 8',
        'Residents 8/8',
        'Appeal 0',
        'No tax collector has passed',
        'Needs for Shack: food',
        'Fire risk 1%',
      ],
    });
  });

  it('describes a settler on the road tile it stands on', () => {
    const game = grassGame();
    placeHouse(game, 2, 8);
    runTicks(game, SETTLER_SPAWN_INTERVAL_TICKS);
    expect(describeTile(game, 0, 10)).toEqual({
      title: 'Settler',
      meters: [],
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
      'Pays 0.72 dr tax a month',
      'Needs for Shack: food',
      'Fire risk 0%',
    ]);
    expect(meter(game, 2, 8, 'Water')).toEqual({ label: 'Water', fill: 0.25, value: '25% left', need: null });
  });

it('says when a house is about to change level', () => {
  const game = town();
  game.buildings[0].food = 100;
  runTicks(game, TICKS_PER_MONTH / 2);
  expect(describeTile(game, 2, 8).lines).toContain('Becoming a Shack in 0.5 months');
  game.buildings[0].food = 0;
  game.buildings[0].level = 'shack';
  runTicks(game, TICKS_PER_MONTH / 4);
  expect(describeTile(game, 2, 8).lines).toContain('Falling back to a Hut in 0.8 months');
});

it('shows the water running down until the next carrier', () => {
    const game = town();
    game.buildings[0].coveredUntil.water = TICKS_PER_MONTH;
    game.tick = TICKS_PER_MONTH / 2;
    expect(meter(game, 2, 8, 'Water').value).toBe('13% left');
    game.tick = TICKS_PER_MONTH - 1;
    expect(meter(game, 2, 8, 'Water').value).toBe('1% left');
    game.tick = TICKS_PER_MONTH;
    expect(meter(game, 2, 8, 'Water')).toMatchObject({ fill: 0, value: 'None' });
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
      meters: [],
      lines: ['Tile 6, 11', 'Workers 4/4', 'Water Carrier getting ready', 'Collapse risk 0%'],
    });
    runTicks(game, ROAMER_REST_TICKS);
    expect(describeTile(game, 6, 11).lines).toContain('Water Carrier out in the streets');
  });

  it('says when a building has no workers or no road', () => {
    const game = grassGame();
    placeBuilding(game, 'taxOffice', 2, 11);
    placeBuilding(game, 'fountain', 6, 14);
    runTicks(game, 1);
    expect(describeTile(game, 2, 11).lines).toEqual(['Tile 2, 11', 'Workers 0/8', 'No workers: does not work', 'Fire risk 0%']);
    expect(describeTile(game, 6, 14).lines).toEqual(['Tile 6, 14', 'No road access: does not work', 'Collapse risk 0%']);
  });

  it("shows last month's taxes and wages on the Palace", () => {
    const game = town();
    placeBuilding(game, 'palace', 6, 4);
    game.lastMonth = { taxes: 12.5, wages: 3 };
    expect(describeTile(game, 6, 4)).toEqual({
      title: 'Palace',
      meters: [],
      lines: ['Tile 6, 4', 'Taxes last month: 12.5 dr', 'Wages last month: 3 dr'],
    });
  });

  it('describes a roaming walker', () => {
    const game = town();
    placeBuilding(game, 'fountain', 0, 11);
    runTicks(game, ROAMER_REST_TICKS);
    expect(describeTile(game, 0, 10)).toEqual({
      title: 'Water Carrier',
      meters: [],
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
      meters: [],
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
      meters: [],
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
    placeBuilding(game, 'granary', 4, 11);
    house.food = 3;
    expect(describeTile(game, 2, 13).lines).toEqual(expect.arrayContaining(['Appeal -11', 'Needs for Shack: appeal -10 (has -11)']));
    expect(meter(game, 2, 13, 'Food')).toMatchObject({ value: '3 units', need: 'met' });
    house.food = 0;
    expect(describeTile(game, 2, 13).lines).toContain('Needs for Shack: food, appeal -10 (has -11)');
  });

  it("shows how long a Shack's food lasts", () => {
    const { game, house } = street();
    Object.assign(house, { level: 'shack', residents: 16, food: 6 });
    expect(meter(game, 2, 13, 'Food')).toEqual({ label: 'Food', fill: 6 / 12, value: '6 units (1.5 months)', need: 'met' });
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
      meters: [],
      lines: ['Tile 6, 12', 'Workers 10/10', 'Crop 43% grown, harvest in July', 'Cart Pusher at the farm', 'Fire risk 0%'],
    });
    farm.food = 600;
    runTicks(game, 1);
    expect(describeTile(game, 7, 13).lines).toEqual(expect.arrayContaining(['Harvest waiting: 2 loads', 'Cart Pusher out with a load']));
    expect(describeTile(game, game.carriers[0].path[0].x, 15)).toEqual({
      title: 'Cart Pusher',
      meters: [],
      lines: ['From the Wheat Farm at 6, 12', 'Carrying 4 loads to the Granary at 14, 11'],
    });
  });

  it('describes a granary', () => {
    const { game } = street();
    placeBuilding(game, 'granary', 14, 11);
    game.buildings[1].food = 1250;
    expect(describeTile(game, 14, 11).meters).toEqual([{ label: 'Wheat', fill: 1250 / 3200, value: '12.5 of 32 loads', need: null }]);
  });

  it('describes an agora, its vendor and the buyer', () => {
    const { game } = street();
    game.buildings[0].residents = 100;
    placeBuilding(game, 'agora', 10, 16);
    expect(describeTile(game, 11, 18).lines).toEqual(['Tile 10, 16', 'No vendors yet: place one on a free spot', 'Collapse risk 0%']);
    placeBuilding(game, 'foodVendor', 10, 16);
    placeBuilding(game, 'granary', 20, 11);
    expect(describeTile(game, 11, 18)).toEqual({
      title: 'Agora',
      meters: [{ label: 'Food Vendor', fill: 0, value: '0 of 8 loads', need: null }],
      lines: ['Tile 10, 16', 'Collapse risk 0%'],
    });
    runTicks(game, 1);
    expect(describeTile(game, 10, 17)).toEqual({
      title: 'Food Vendor',
      meters: [{ label: 'Food', fill: 0, value: '0 of 8 loads', need: null }],
      lines: ['Tile 10, 16', 'Workers 4/4', 'Peddler waits for food', 'Buyer waits for a granary with wheat'],
    });
    game.buildings[3].food = 1000;
    runTicks(game, 1);
    expect(describeTile(game, 10, 15)).toEqual({
      title: 'Buyer',
      meters: [],
      lines: ['From the Food Vendor at 10, 16', 'Fetching wheat from the Granary at 20, 11'],
    });
    game.carriers[0].returning = true;
    game.carriers[0].food = 400;
    expect(describeTile(game, 10, 15).lines).toContain('Bringing home 400 units');
  });

  it("shows the stock of each of an agora's vendors", () => {
    const { game } = street();
    placeBuilding(game, 'agora', 10, 16);
    placeBuilding(game, 'foodVendor', 10, 16);
    placeBuilding(game, 'fleeceVendor', 10, 18);
    Object.assign(game.buildings[2], { food: 400 });
    Object.assign(game.buildings[3], { fleece: 800 });
    expect(describeTile(game, 11, 21).meters).toEqual([
      { label: 'Food Vendor', fill: 0.5, value: '4 of 8 loads', need: null },
      { label: 'Fleece Vendor', fill: 1, value: '8 of 8 loads', need: null },
    ]);
  });

  it('describes a decoration by its appeal', () => {
    const game = grassGame();
    placeBuilding(game, 'flowerGarden', 4, 4);
    expect(describeTile(game, 5, 5)).toEqual({ title: 'Flower Garden', meters: [], lines: ['Tile 4, 4', 'Appeal 8, 7, 6 by distance'] });
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
    expect(meter(game, 2, 13, 'Culture')).toEqual({ label: 'Culture', fill: 0, value: 'None', need: 'missing' });
    expect(describeTile(game, 2, 13).lines).toContain('Needs for Hovel: water, culture 15 (has 0)');
    Object.assign(house.coveredUntil, { water: TICKS_PER_MONTH, philosophy: TICKS_PER_MONTH, drama: TICKS_PER_MONTH });
    expect(meter(game, 2, 13, 'Culture')).toEqual({ label: 'Culture', fill: 40 / 60, value: '40: philosophy, drama', need: 'met' });
    expect(describeTile(game, 2, 13).lines).toContain('Ready to become a Hovel');
  });

  it('shows no next level for a Townhouse', () => {
    const { game, house } = street();
    Object.assign(house, { level: 'townhouse', residents: 60, food: 6 });
    const { title, lines } = describeTile(game, 2, 13);
    expect(title).toBe('Townhouse');
    expect(lines.some((line) => line.startsWith('Needs'))).toBe(false);
  });

  it('describes a college and its philosopher on the way', () => {
    const { game } = street();
    placeBuilding(game, 'college', 6, 12);
    runTicks(game, 1);
    expect(describeTile(game, 7, 13)).toEqual({
      title: 'College',
      meters: [],
      lines: ['Tile 6, 12', 'Workers 12/12', 'Philosopher waits for a staffed Podium', 'Collapse risk 0%'],
    });
    placeBuilding(game, 'podium', 16, 13);
    runTicks(game, 1);
    expect(describeTile(game, 7, 13).lines).toContain('Philosopher in training');
    runTicks(game, ROAMER_REST_TICKS);
    expect(describeTile(game, 7, 13).lines).toContain('Philosopher on the way to the Podium at 16, 13');
    const { x, y } = walkerTile(game.trainees[0]);
    expect(describeTile(game, x, y)).toEqual({
      title: 'Philosopher',
      meters: [],
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
      meters: [],
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
      meters: [],
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
    expect(meter(game, 2, 13, 'Fleece')).toMatchObject({ value: 'None', need: 'missing' });
    expect(describeTile(game, 2, 13).lines).toContain('Needs for Homestead: fleece');
    house.fleece = 6;
    expect(meter(game, 2, 13, 'Fleece')).toMatchObject({ value: '6 units', need: 'met' });
    expect(describeTile(game, 2, 13).lines).toContain('Ready to become a Homestead');
  });

  it("shows how long a Homestead's fleece lasts and that a Shack does not need it yet", () => {
    const { game, house } = street();
    Object.assign(house, { level: 'homestead', residents: 32, food: 50, fleece: 6 });
    expect(meter(game, 2, 13, 'Fleece')).toEqual({ label: 'Fleece', fill: 1, value: '6 units (3 months)', need: 'met' });
    Object.assign(house, { level: 'shack', residents: 16, fleece: 0 });
    expect(meter(game, 2, 13, 'Fleece')).toEqual({ label: 'Fleece', fill: 0, value: 'None', need: null });
  });

  it('describes a storehouse by its fleece and slots', () => {
    const { game } = street();
    placeBuilding(game, 'storehouse', 10, 12);
    const storehouse = lastBuilding(game);
    runTicks(game, 1);
    expect(describeTile(game, 11, 13).lines).toEqual(['Tile 10, 12', 'Workers 12/12', 'Fire risk 0%']);
    expect(describeTile(game, 11, 13).meters).toEqual([
      { label: 'Slots', fill: 0, value: '0 of 8 slots of 4 loads', need: null },
      { label: 'Fleece', fill: 0, value: 'None', need: null },
      { label: 'Olives', fill: 0, value: 'None', need: null },
      { label: 'Oil', fill: 0, value: 'None', need: null },
      { label: 'Wood', fill: 0, value: 'None', need: null },
      { label: 'Marble', fill: 0, value: 'None', need: null },
      { label: 'Bronze', fill: 0, value: 'None', need: null },
      { label: 'Sculptures', fill: 0, value: 'None', need: null },
    ]);
    storehouse.fleece = 600;
    expect(meter(game, 11, 13, 'Slots')).toMatchObject({ fill: 2 / 8, value: '2 of 8 slots of 4 loads' });
    expect(meter(game, 11, 13, 'Fleece')).toEqual({ label: 'Fleece', fill: 600 / 3200, value: '6 loads in 2 slots', need: null });
  });

  it('describes a carding shed, its shepherd and its cart', () => {
    const { game } = street();
    placeBuilding(game, 'cardingShed', 6, 13);
    const shed = lastBuilding(game);
    runTicks(game, 1);
    expect(describeTile(game, 6, 13)).toEqual({
      title: 'Carding Shed',
      meters: [],
      lines: ['Tile 6, 13', 'Workers 8/8', 'Shepherd waits for a sheep with a full fleece within 40 tiles', 'Cart Pusher at the shed', 'Fire risk 0%'],
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
      meters: [],
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
    expect(describeTile(game, 10, 8)).toEqual({ title: 'Sheep', meters: [], lines: ['Grazing near 10, 8', 'Full fleece: ready to shear'] });
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
      meters: [{ label: 'Fleece', fill: 0, value: '0 of 8 loads', need: null }],
      lines: ['Tile 10, 16', 'Workers 4/4', 'Fleece Peddler waits for fleece', 'Buyer waits for a storehouse with fleece'],
    });
    lastBuilding(game).fleece = 1000;
    runTicks(game, 1);
    expect(describeTile(game, 10, 15)).toEqual({
      title: 'Buyer',
      meters: [],
      lines: ['From the Fleece Vendor at 10, 16', 'Fetching fleece from the Storehouse at 20, 12'],
    });
  });
});

describe('describeTile for olive oil', () => {
  const LONG = 10 * TICKS_PER_MONTH;

  function street(): { game: GameState; house: Building } {
    const game = grassGame(30);
    placeRoad(game, { x: 0, y: 15 }, { x: 29, y: 15 });
    placeHouse(game, 2, 13);
    const house = game.buildings[0];
    house.residents = 100;
    setMeadow(game, 7, 5, 7, 7);
    return { game, house };
  }

  function lastBuilding(game: GameState): Building {
    return game.buildings[game.buildings.length - 1];
  }

  it("shows a Tenement's oil and what keeps it from becoming an Apartment", () => {
    const { game, house } = street();
    Object.assign(house, { level: 'tenement', residents: 40, food: 50, fleece: 6 });
    Object.assign(house.coveredUntil, { water: LONG, philosophy: LONG, athletics: LONG });
    const lines = describeTile(game, 2, 13).lines;
    expect(meter(game, 2, 13, 'Oil')).toMatchObject({ value: 'None', need: 'missing' });
    expect(lines.find((line) => line.startsWith('Needs for Apartment'))).toMatch(/^Needs for Apartment: oil, appeal 20/);
    house.oil = 6;
    expect(meter(game, 2, 13, 'Oil')).toMatchObject({ value: '6 units', need: 'met' });
    Object.assign(house, { level: 'apartment', residents: 48 });
    expect(meter(game, 2, 13, 'Oil')).toMatchObject({ value: '6 units (3 months)', need: 'met' });
  });

  it('describes an olive tree', () => {
    const { game } = street();
    placeOliveTrees(game, { x: 10, y: 8 }, { x: 10, y: 8 });
    expect(describeTile(game, 10, 8)).toEqual({ title: 'Olive Tree', meters: [], lines: ['Tile 10, 8', 'Appeal 1 by distance', 'Ripe: ready to pick'] });
    lastBuilding(game).growth = 0.426;
    expect(describeTile(game, 10, 8).lines).toContain('Olives 43% grown');
  });

  it("describes a growers' lodge, its grower and its cart", () => {
    const { game } = street();
    placeBuilding(game, 'growersLodge', 6, 13);
    const lodge = lastBuilding(game);
    runTicks(game, 1);
    expect(describeTile(game, 6, 13)).toEqual({
      title: "Growers' Lodge",
      meters: [],
      lines: ['Tile 6, 13', 'Workers 12/12', 'Grower waits for a ripe olive tree within 20 tiles', 'Cart Pusher at the lodge', 'Fire risk 0%'],
    });
    placeOliveTrees(game, { x: 10, y: 8 }, { x: 10, y: 8 });
    expect(describeTile(game, 6, 13).lines).toContain('Grower resting');
    runTicks(game, PICKING_REST_TICKS);
    expect(describeTile(game, 6, 13).lines).toContain('Grower out to pick the olive tree at 10, 8');
    expect(describeTile(game, 10, 8).lines).toContain('A grower is on the way');
    const { x, y } = walkerTile(game.growers[0]);
    expect(describeTile(game, x, y)).toEqual({
      title: 'Grower',
      meters: [],
      lines: ["From the Growers' Lodge at 6, 13", 'Going to pick the olive tree at 10, 8'],
    });
    game.growers[0].returning = true;
    game.growers[0].olives = 100;
    expect(describeTile(game, x, y).lines).toContain('Bringing 1 load of olives home');
    expect(describeTile(game, 6, 13).lines).toContain('Grower bringing olives home');
    lodge.olives = 400;
    game.growers = [];
    expect(describeTile(game, 6, 13).lines).toEqual(
      expect.arrayContaining(['Olives waiting: 4 loads', 'Grower waits: the lodge is full', 'Cart Pusher waits for an olive press or storehouse with room']),
    );
  });

  it('describes an olive press by its olives, oil and pressing', () => {
    const { game } = street();
    placeBuilding(game, 'olivePress', 6, 13);
    const press = lastBuilding(game);
    runTicks(game, 1);
    expect(describeTile(game, 6, 13)).toEqual({
      title: 'Olive Press',
      meters: [],
      lines: ['Tile 6, 13', 'Workers 12/12', 'Olives: 0 of 4 loads', 'Waits for olives', 'Cart Pusher at the press', 'Buyer waits for a storehouse with olives', 'Collapse risk 0%'],
    });
    Object.assign(press, { olives: 200, production: 300 });
    expect(describeTile(game, 6, 13).lines).toEqual(expect.arrayContaining(['Olives: 2 of 4 loads', 'Pressing: 50% of a load']));
    press.oil = 400;
    expect(describeTile(game, 6, 13).lines).toEqual(
      expect.arrayContaining(['Oil waiting: 4 loads', 'Full of oil: waits for its cart', 'Cart Pusher waits for a storehouse with room']),
    );
  });

  it('describes a storehouse by each good it holds', () => {
    const { game } = street();
    placeBuilding(game, 'storehouse', 10, 12);
    Object.assign(lastBuilding(game), { fleece: 600, oil: 100 });
    runTicks(game, 1);
    expect(meter(game, 11, 13, 'Slots').value).toBe('3 of 8 slots of 4 loads');
    expect(meter(game, 11, 13, 'Fleece').value).toBe('6 loads in 2 slots');
    expect(meter(game, 11, 13, 'Oil').value).toBe('1 load in 1 slot');
  });

it('describes olives in a storehouse and a press buyer fetching them', () => {
  const { game } = street();
  placeBuilding(game, 'storehouse', 10, 12);
  lastBuilding(game).olives = 800;
  placeBuilding(game, 'olivePress', 20, 13);
  runTicks(game, 1);
  expect(meter(game, 11, 13, 'Olives').value).toBe('8 loads in 2 slots');
  expect(describeTile(game, 20, 13).lines).toContain('Buyer out fetching olives');
});

  it('describes a timber mill, its lumberjack and the tree he fells', () => {
    const { game } = street();
    placeBuilding(game, 'timberMill', 6, 13);
    const mill = lastBuilding(game);
    runTicks(game, 1);
    expect(describeTile(game, 6, 13)).toEqual({
      title: 'Timber Mill',
      meters: [],
      lines: ['Tile 6, 13', 'Workers 12/12', 'Lumberjack waits for forest within 20 tiles', 'Cart Pusher at the mill', 'Fire risk 0%'],
    });
    setTerrain(game, 10, 8, 'forest');
    expect(describeTile(game, 6, 13).lines).toContain('Lumberjack resting');
    runTicks(game, gatheringRestTicks('timberMill'));
    expect(describeTile(game, 6, 13).lines).toContain('Lumberjack out to fell the tree at 10, 8');
    const { x, y } = walkerTile(game.gatherers[0]);
    expect(describeTile(game, x, y)).toEqual({ title: 'Lumberjack', meters: [], lines: ['From the Timber Mill at 6, 13', 'Going to fell the tree at 10, 8'] });
    Object.assign(game.gatherers[0], { returning: true, load: 100 });
    expect(describeTile(game, x, y).lines).toContain('Bringing 1 load of wood home');
    expect(describeTile(game, 6, 13).lines).toContain('Lumberjack bringing wood home');
    game.gatherers = [];
    mill.wood = 400;
    expect(describeTile(game, 6, 13).lines).toEqual(
      expect.arrayContaining(['Wood waiting: 4 loads', 'Lumberjack waits: the mill is full', 'Cart Pusher waits for a storehouse with room']),
    );
    game.felledUntil[tileIndex(game, 10, 8)] = game.tick + 3 * TICKS_PER_MONTH;
    expect(describeTile(game, 10, 8)).toEqual({ title: 'Forest', meters: [], lines: ['Tile 10, 8', 'Not buildable', 'Felled: grows back in 3 months'] });
  });

  it('describes a masonry shop and a foundry by what they gather', () => {
    const { game } = street();
    placeBuilding(game, 'masonryShop', 6, 13);
    placeBuilding(game, 'foundry', 9, 13);
    runTicks(game, 1);
    expect(describeTile(game, 6, 13).lines).toContain('Quarryman waits for marble within 20 tiles');
    expect(describeTile(game, 9, 13).lines).toContain('Miner waits for copper ore within 20 tiles');
    setTerrain(game, 12, 8, 'copper');
    runTicks(game, gatheringRestTicks('foundry'));
    expect(describeTile(game, 9, 13).lines).toContain('Miner out to dig the copper ore at 12, 8');
  });

  it('describes a sculpture studio by its bronze, sculptures and casting', () => {
    const { game } = street();
    placeBuilding(game, 'sculptureStudio', 6, 13);
    const studio = lastBuilding(game);
    runTicks(game, 1);
    expect(describeTile(game, 6, 13)).toEqual({
      title: 'Sculpture Studio',
      meters: [],
      lines: [
        'Tile 6, 13',
        'Workers 12/12',
        'Bronze: 0 of 8 loads',
        'Waits for 4 loads of bronze',
        'Cart Pusher at the studio',
        'Buyer waits for a storehouse with bronze',
        'Collapse risk 0%',
      ],
    });
    Object.assign(studio, { bronze: 500, production: 300 });
    expect(describeTile(game, 6, 13).lines).toEqual(expect.arrayContaining(['Bronze: 5 of 8 loads', 'Casting: 50% of a sculpture']));
    studio.sculptures = 400;
    expect(describeTile(game, 6, 13).lines).toEqual(expect.arrayContaining(['Sculptures waiting: 4', 'Full of sculptures: waits for its cart']));
  });

  it("describes an artisans' guild", () => {
    const { game } = street();
    placeBuilding(game, 'artisansGuild', 6, 13);
    runTicks(game, 1);
    expect(describeTile(game, 6, 13)).toEqual({
      title: "Artisans' Guild",
      meters: [],
      lines: ['Tile 6, 13', 'Workers 25/25', 'Artisans wait for a sanctuary to build', 'Fire risk 0%'],
    });
  });

  it('describes an oil vendor', () => {
    const { game } = street();
    placeBuilding(game, 'agora', 10, 16);
    placeBuilding(game, 'oilVendor', 10, 16);
    runTicks(game, 1);
    expect(describeTile(game, 10, 17)).toEqual({
      title: 'Oil Vendor',
      meters: [{ label: 'Oil', fill: 0, value: '0 of 8 loads', need: null }],
      lines: ['Tile 10, 16', 'Workers 4/4', 'Oil Peddler waits for oil', 'Buyer waits for a storehouse with oil'],
    });
  });
});

describe('the inspector on safety', () => {
  function street(): GameState {
    const game = grassGame(30);
    placeRoad(game, { x: 0, y: 15 }, { x: 29, y: 15 });
    placeHouse(game, 2, 13);
    game.buildings[0].residents = 8;
    return game;
  }

  it("shows a house's fire risk", () => {
    const game = street();
    game.buildings[0].fireRisk = 0.25 * RISK_LIMIT * TICKS_PER_MONTH;
    expect(describeTile(game, 2, 13).lines.at(-1)).toBe('Fire risk 25%');
  });

  it("shows a workplace's fire and collapse risks, and none for a Park", () => {
    const game = street();
    placeBuilding(game, 'granary', 6, 11);
    Object.assign(game.buildings[1], { fireRisk: 0.5 * RISK_LIMIT * TICKS_PER_MONTH, collapseRisk: 0.1 * RISK_LIMIT * TICKS_PER_MONTH });
    expect(describeTile(game, 6, 11).lines.slice(-2)).toEqual(['Fire risk 50%', 'Collapse risk 10%']);
    placeBuilding(game, 'park', 12, 12);
    expect(describeTile(game, 12, 12).lines.join()).not.toMatch(/risk/);
  });

  it('describes burning ruins and rubble', () => {
    const game = street();
    placeBuilding(game, 'taxOffice', 6, 13);
    catchFire(game, game.buildings[1]);
    runTicks(game, 1);
    expect(describeTile(game, 7, 14)).toEqual({ title: 'Ruins', meters: [], lines: ['Tile 7, 14', 'On fire: a superintendent puts it out'] });
    runTicks(game, FIRE_BURN_TICKS);
    expect(describeTile(game, 7, 14)).toEqual({ title: 'Ruins', meters: [], lines: ['Tile 7, 14', 'Clear it with the demolish tool'] });
  });

  it('describes a Maintenance Office and its superintendent', () => {
    const game = street();
    placeBuilding(game, 'maintenanceOffice', 0, 16);
    runTicks(game, 1);
    expect(describeTile(game, 0, 16)).toEqual({
      title: 'Maintenance Office',
      meters: [],
      lines: ['Tile 0, 16', 'Workers 4/5', 'Superintendent getting ready'],
    });
    runTicks(game, 2 * ROAMER_REST_TICKS);
    const { x, y } = walkerTile(game.roamers[0]);
    expect(describeTile(game, x, y)).toEqual({
      title: 'Superintendent',
      meters: [],
      lines: ['From the Maintenance Office at 0, 16', `Walked ${game.roamers[0].step} of 44 tiles`],
    });
  });
});

describe('describeTile for sanctuaries', () => {
  function site(): { game: GameState; storehouse: Building; forge: Building } {
    const game = grassGame(40);
    placeRoad(game, { x: 0, y: 15 }, { x: 39, y: 15 });
    placeHouse(game, 0, 38);
    game.buildings[0].residents = 400;
    placeBuilding(game, 'storehouse', 2, 12);
    const storehouse = game.buildings[1];
    storehouse.marble = 1300;
    expect(placeBuilding(game, 'hephaestusSanctuary', 20, 16)).toEqual({ ok: true });
    return { game, storehouse, forge: game.buildings[2] };
  }

  it('describes a site by its stage, materials and what it waits for', () => {
    const { game, forge } = site();
    runTicks(game, 1);
    expect(describeTile(game, 21, 17)).toEqual({
      title: 'Forge of Hephaestus',
      meters: [],
      lines: [
        'Tile 20, 16',
        'Under construction: 0 of 5 stages built',
        'Marble: 13 of 48 loads',
        'Wood: 0 of 14 loads',
        'Sculptures: 0 of 6',
        'Waits for wood, sculptures to start the next stage',
      ],
    });
    Object.assign(forge, { wood: 600, sculptures: 400, production: 4 });
    expect(describeTile(game, 21, 17).lines).toEqual(
      expect.arrayContaining(['Under construction: 1 of 5 stages built', 'Waits for marble to start the next stage']),
    );
    Object.assign(forge, { marble: 2000, production: 5 });
    expect(describeTile(game, 21, 17).lines).toContain('Artisans at work: 1 of 4 visits for the next stage');
  });

  it('describes a finished sanctuary by the god it honors and its workers', () => {
    const { game, forge } = site();
    forge.production = 20;
    runTicks(game, 1);
    expect(describeTile(game, 21, 17)).toEqual({ title: 'Forge of Hephaestus', meters: [], lines: ['Tile 20, 16', 'Workers 60/60', 'Finished: honors Hephaestus'] });
  });

  it("describes a guild's artisan and the site he goes to build", () => {
    const { game, forge } = site();
    placeBuilding(game, 'artisansGuild', 8, 13);
    runTicks(game, 1);
    expect(describeTile(game, 8, 13).lines).toContain('Artisans wait for materials at a sanctuary');
    Object.assign(forge, { wood: 300, sculptures: 200 });
    expect(describeTile(game, 8, 13).lines).toContain('Artisan getting ready');
    runTicks(game, ROAMER_REST_TICKS);
    expect(describeTile(game, 8, 13).lines).toContain('Artisan on the way to the Forge of Hephaestus at 20, 16');
    const { x, y } = walkerTile(game.artisans[0]);
    expect(describeTile(game, x, y)).toEqual({ title: 'Artisan', meters: [], lines: ["From the Artisans' Guild at 8, 13", 'Going to build the Forge of Hephaestus at 20, 16'] });
  });

  it("shows a storehouse's supply cart only while it is out", () => {
    const { game, storehouse } = site();
    runTicks(game, 1);
    expect(describeTile(game, 3, 13).lines).not.toContain('Cart Pusher out with a load');
    storehouse.wood = 400;
    runTicks(game, 1);
    expect(describeTile(game, 3, 13).lines).toContain('Cart Pusher out with a load');
    const { x, y } = walkerTile(game.carriers[0]);
    expect(describeTile(game, x, y).lines).toContain('Carrying 4 loads to the Forge of Hephaestus at 20, 16');
  });
});

describe('inspectTile', () => {
  function town(): GameState {
    const game = grassGame();
    placeRoad(game, { x: 0, y: 10 }, { x: 19, y: 10 });
    placeHouse(game, 2, 8);
    game.buildings[0].residents = 8;
    return game;
  }

  it('keeps describing a building as time passes', () => {
    const game = town();
    game.buildings[0].coveredUntil.water = TICKS_PER_MONTH;
    const look = inspectTile(game, 2, 8);
    runTicks(game, TICKS_PER_MONTH / 2);
    expect(look().description.meters.find((m) => m.label === 'Water')).toMatchObject({ value: '13% left' });
  });

  it('describes the ground once the building is gone', () => {
    const game = town();
    const look = inspectTile(game, 2, 8);
    demolish(game, { x: 2, y: 8 }, { x: 2, y: 8 });
    expect(look().description.title).toBe('Grass');
  });

  it('follows a walker off the tile it was inspected on', () => {
    const game = town();
    placeBuilding(game, 'fountain', 0, 11);
    runTicks(game, ROAMER_REST_TICKS);
    const look = inspectTile(game, 0, 10);
    const carrier = game.roamers[0];
    while (walkerTile(carrier).x === 0) runTicks(game, 1);
    expect(game.roamers).toContain(carrier);
    expect(look().description).toMatchObject({ title: 'Water Carrier', lines: ['From the Fountain at 0, 11', 'Walked 0 of 27 tiles'] });
  });

  it('describes the tile again once the walker is gone', () => {
    const game = town();
    placeBuilding(game, 'fountain', 0, 11);
    runTicks(game, ROAMER_REST_TICKS);
    const look = inspectTile(game, 0, 10);
    game.roamers = [];
    expect(look().description.title).toBe('Road');
  });
  it('highlights every tile of an inspected building', () => {
    const look = inspectTile(town(), 3, 9);
    expect(look().tiles).toEqual([{ x: 2, y: 8 }, { x: 3, y: 8 }, { x: 2, y: 9 }, { x: 3, y: 9 }]);
  });

  it('highlights the inspected ground tile', () => {
    expect(inspectTile(town(), 5, 5)().tiles).toEqual([{ x: 5, y: 5 }]);
  });

  it('highlights the tile under the followed walker', () => {
    const game = town();
    placeBuilding(game, 'fountain', 0, 11);
    runTicks(game, ROAMER_REST_TICKS);
    const look = inspectTile(game, 0, 10);
    const carrier = game.roamers[0];
    while (walkerTile(carrier).x === 0) runTicks(game, 1);
    expect(look().tiles).toEqual([walkerTile(carrier)]);
  });

  it('highlights the inspected tile once the building is gone', () => {
    const game = town();
    const look = inspectTile(game, 3, 9);
    demolish(game, { x: 2, y: 8 }, { x: 2, y: 8 });
    expect(look().tiles).toEqual([{ x: 3, y: 9 }]);
  });
});

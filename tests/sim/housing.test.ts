import { describe, expect, it } from 'vitest';
import { houseAppeal } from '../../src/sim/appeal';
import { TICKS_PER_MONTH } from '../../src/sim/clock';
import { demolish, placeBuilding, placeHouses, placeOliveTrees, placeRoad, placeRoadblock, placeSheep } from '../../src/sim/commands';
import { LEVEL_CHANGE_TICKS, houseCapacity } from '../../src/sim/housing';
import { SETTLER_SPAWN_INTERVAL_TICKS } from '../../src/sim/settlers';
import type { Building, GameState } from '../../src/sim/state';
import { tick } from '../../src/sim/tick';
import { grassGame, placeHouse, runTicks, runTicksWithoutSickness, setMeadow } from './helpers';

function street(): { game: GameState; house: Building } {
  const game = grassGame();
  placeRoad(game, { x: 0, y: 10 }, { x: 19, y: 10 });
  placeHouse(game, 2, 8);
  const house = game.buildings[0];
  house.residents = 8;
  return { game, house };
}

function shackOn(game: GameState, house: Building): void {
  Object.assign(house, { level: 'shack', residents: 16, food: 5 });
}

describe('a Hut', () => {
  it('becomes a Shack with food and appeal -10', () => {
    const { game, house } = street();
    placeBuilding(game, 'granary', 4, 6);
    placeBuilding(game, 'park', 1, 11);
    house.food = 1;
    expect(houseAppeal(game, house)).toBe(-10);
    runTicks(game, LEVEL_CHANGE_TICKS);
    expect(house.level).toBe('shack');
  });

  it('stays a Hut without food', () => {
    const { game, house } = street();
    runTicks(game, LEVEL_CHANGE_TICKS);
    expect(house.level).toBe('hut');
  });

  it('stays a Hut at appeal -11', () => {
    const { game, house } = street();
    placeBuilding(game, 'granary', 4, 6);
    house.food = 1;
    expect(houseAppeal(game, house)).toBe(-11);
    runTicks(game, LEVEL_CHANGE_TICKS);
    expect(house.level).toBe('hut');
  });

  it('draws settlers to fill its 16 places once a Shack', () => {
    const { game, house } = street();
    house.food = 100;
    runTicks(game, LEVEL_CHANGE_TICKS + 6 * SETTLER_SPAWN_INTERVAL_TICKS);
    expect(house.residents).toBe(16);
  });
});

describe('a Shack', () => {
  it('keeps its level at appeal -11', () => {
    const { game, house } = street();
    shackOn(game, house);
    placeBuilding(game, 'granary', 4, 6);
    expect(houseAppeal(game, house)).toBe(-11);
    runTicks(game, LEVEL_CHANGE_TICKS);
    expect(house.level).toBe('shack');
  });

  it('falls back to a Hut at appeal -12 or below, sending away residents above 8', () => {
    const { game, house } = street();
    shackOn(game, house);
    placeBuilding(game, 'granary', 4, 6);
    placeBuilding(game, 'taxOffice', 0, 6);
    expect(houseAppeal(game, house)).toBeLessThanOrEqual(-12);
    runTicks(game, LEVEL_CHANGE_TICKS);
    expect(house.level).toBe('hut');
    expect(house.residents).toBe(8);
  });

  it('falls back to a Hut when its food runs out', () => {
    const { game, house } = street();
    shackOn(game, house);
    house.food = 0;
    runTicks(game, LEVEL_CHANGE_TICKS);
    expect(house.level).toBe('hut');
    expect(house.residents).toBe(8);
  });
});

describe('a city with the whole food chain', () => {
  it('turns its huts into Shacks after the July harvest', () => {
    const game = grassGame(30);
    placeRoad(game, { x: 0, y: 15 }, { x: 29, y: 15 });
    placeHouses(game, { x: 0, y: 13 }, { x: 15, y: 14 });
    placeBuilding(game, 'agora', 0, 16);
    placeBuilding(game, 'foodVendor', 0, 16);
    placeBuilding(game, 'granary', 18, 16);
    setMeadow(game, 24, 16, 3, 3);
    placeBuilding(game, 'wheatFarm', 24, 16);
    placeBuilding(game, 'maintenanceOffice', 4, 16);
    const houses = game.buildings.filter((b) => b.type === 'house');

    runTicksWithoutSickness(game, 6 * TICKS_PER_MONTH);
    expect(houses.every((h) => h.level === 'hut')).toBe(true);
    runTicksWithoutSickness(game, 2 * TICKS_PER_MONTH + LEVEL_CHANGE_TICKS);
    expect(houses.filter((h) => h.level === 'shack').length).toBeGreaterThanOrEqual(6);
  });
});

describe('a Shack on its way to a Hovel', () => {
  const LONG = 10 * TICKS_PER_MONTH;

  function servedShack(): { game: GameState; house: Building } {
    const { game, house } = street();
    shackOn(game, house);
    Object.assign(house.coveredUntil, { water: LONG, philosophy: LONG });
    return { game, house };
  }

  it('becomes a Hovel with food, water, 15 culture and appeal 0', () => {
    const { game, house } = servedShack();
    expect(houseAppeal(game, house)).toBe(0);
    runTicks(game, LEVEL_CHANGE_TICKS);
    expect(house.level).toBe('hovel');
    expect(houseCapacity(house)).toBe(24);
  });

  it('stays a Shack at appeal -1', () => {
    const { game, house } = servedShack();
    placeBuilding(game, 'storehouse', 2, 2);
    expect(houseAppeal(game, house)).toBe(-1);
    runTicks(game, LEVEL_CHANGE_TICKS);
    expect(house.level).toBe('shack');
  });

  it('stays a Shack without water', () => {
    const { game, house } = servedShack();
    house.coveredUntil.water = 0;
    runTicks(game, LEVEL_CHANGE_TICKS);
    expect(house.level).toBe('shack');
  });

  it('stays a Shack without culture', () => {
    const { game, house } = servedShack();
    house.coveredUntil.philosophy = 0;
    runTicks(game, LEVEL_CHANGE_TICKS);
    expect(house.level).toBe('shack');
  });
});

describe('a Hovel', () => {
  const LONG = 10 * TICKS_PER_MONTH;

  function hovelOn(house: Building): void {
    Object.assign(house, { level: 'hovel', residents: 24, food: 50 });
    Object.assign(house.coveredUntil, { water: LONG, athletics: LONG });
  }

  it('keeps its level at appeal -1', () => {
    const { game, house } = street();
    hovelOn(house);
    placeBuilding(game, 'taxOffice', 5, 6);
    placeBuilding(game, 'column', 1, 11);
    expect(houseAppeal(game, house)).toBe(-1);
    runTicks(game, LEVEL_CHANGE_TICKS);
    expect(house.level).toBe('hovel');
  });

  it('falls back to a Shack at appeal -2, sending away residents above 16', () => {
    const { game, house } = street();
    hovelOn(house);
    placeBuilding(game, 'taxOffice', 5, 6);
    expect(houseAppeal(game, house)).toBe(-2);
    runTicks(game, LEVEL_CHANGE_TICKS);
    expect(house.level).toBe('shack');
    expect(house.residents).toBe(16);
  });

  it('falls back to a Shack when its water runs out', () => {
    const { game, house } = street();
    hovelOn(house);
    house.coveredUntil.water = 0;
    runTicks(game, LEVEL_CHANGE_TICKS);
    expect(house.level).toBe('shack');
  });

  it('falls back to a Shack when no culture has passed for 2 months', () => {
    const { game, house } = street();
    hovelOn(house);
    house.coveredUntil.athletics = 2 * TICKS_PER_MONTH;
    runTicks(game, 2 * TICKS_PER_MONTH - 1);
    expect(house.level).toBe('hovel');
    runTicks(game, LEVEL_CHANGE_TICKS);
    expect(house.level).toBe('shack');
  });
});

describe('a city with food, water and athletes', () => {
  it('turns its Shacks into Hovels', () => {
    const game = grassGame(40);
    placeRoad(game, { x: 0, y: 20 }, { x: 39, y: 20 });
    placeHouses(game, { x: 0, y: 18 }, { x: 11, y: 19 });
    for (let x = 0; x < 12; x += 2) placeBuilding(game, 'flowerGarden', x, 16);
    placeHouses(game, { x: 9, y: 21 }, { x: 12, y: 22 });
    placeBuilding(game, 'maintenanceOffice', 3, 21);
    placeRoadblock(game, { x: 14, y: 20 });
    placeBuilding(game, 'agora', 0, 21);
    placeBuilding(game, 'foodVendor', 0, 21);
    placeBuilding(game, 'granary', 28, 21);
    setMeadow(game, 32, 21, 6, 3);
    placeBuilding(game, 'wheatFarm', 32, 21);
    placeBuilding(game, 'wheatFarm', 35, 21);
    placeBuilding(game, 'fountain', 12, 18);
    placeBuilding(game, 'gymnasium', 6, 21);
    const houses = game.buildings.filter((b) => b.type === 'house');

    runTicksWithoutSickness(game, 6 * TICKS_PER_MONTH);
    expect(houses.some((h) => h.level === 'hovel')).toBe(false);
    runTicksWithoutSickness(game, 4 * TICKS_PER_MONTH + LEVEL_CHANGE_TICKS);
    expect(houses.filter((h) => h.level === 'hovel').length).toBeGreaterThanOrEqual(4);
  });
});

describe('a Hovel on its way to a Homestead', () => {
  const LONG = 10 * TICKS_PER_MONTH;

  function servedHovel(): { game: GameState; house: Building } {
    const { game, house } = street();
    Object.assign(house, { level: 'hovel', residents: 24, food: 50, fleece: 6 });
    Object.assign(house.coveredUntil, { water: LONG, philosophy: LONG });
    placeBuilding(game, 'flowerGarden', 2, 6);
    placeBuilding(game, 'park', 4, 8);
    return { game, house };
  }

  it('becomes a Homestead of 32 with fleece and appeal 10', () => {
    const { game, house } = servedHovel();
    expect(houseAppeal(game, house)).toBe(10);
    runTicks(game, LEVEL_CHANGE_TICKS);
    expect(house.level).toBe('homestead');
    expect(houseCapacity(house)).toBe(32);
  });

  it('stays a Hovel without fleece', () => {
    const { game, house } = servedHovel();
    house.fleece = 0;
    runTicks(game, LEVEL_CHANGE_TICKS);
    expect(house.level).toBe('hovel');
  });
});

describe('a Homestead', () => {
  const LONG = 10 * TICKS_PER_MONTH;

  function homestead(cultures: ('philosophy' | 'athletics' | 'drama')[]): { game: GameState; house: Building } {
    const { game, house } = street();
    Object.assign(house, { level: 'homestead', residents: 32, food: 50, fleece: 6 });
    house.coveredUntil.water = LONG;
    for (const culture of cultures) house.coveredUntil[culture] = LONG;
    placeBuilding(game, 'flowerGarden', 2, 6);
    return { game, house };
  }

  it('uses 2 units of fleece a month', () => {
    const { game, house } = homestead(['philosophy']);
    runTicks(game, TICKS_PER_MONTH);
    expect(house.fleece).toBe(4);
  });

  it('falls back to a Hovel when its fleece runs out, sending away residents above 24', () => {
    const { game, house } = homestead(['philosophy']);
    house.fleece = 2;
    runTicks(game, TICKS_PER_MONTH - 1);
    expect(house.level).toBe('homestead');
    runTicks(game, LEVEL_CHANGE_TICKS);
    expect(house.level).toBe('hovel');
    expect(house.residents).toBe(24);
  });

  it('becomes a Tenement of 40 with 35 culture and appeal 10', () => {
    const { game, house } = homestead(['philosophy', 'athletics']);
    placeBuilding(game, 'park', 4, 8);
    expect(houseAppeal(game, house)).toBe(10);
    runTicks(game, LEVEL_CHANGE_TICKS);
    expect(house.level).toBe('tenement');
    expect(houseCapacity(house)).toBe(40);
  });

  it('stays a Homestead with 15 culture', () => {
    const { game, house } = homestead(['philosophy']);
    placeBuilding(game, 'park', 4, 8);
    runTicks(game, LEVEL_CHANGE_TICKS);
    expect(house.level).toBe('homestead');
  });

  it('stays a Homestead at appeal 9', () => {
    const { game, house } = homestead(['philosophy', 'athletics']);
    placeBuilding(game, 'park', 5, 8);
    expect(houseAppeal(game, house)).toBe(9);
    runTicks(game, LEVEL_CHANGE_TICKS);
    expect(house.level).toBe('homestead');
  });
});

describe('a Tenement', () => {
  const LONG = 10 * TICKS_PER_MONTH;

  function tenement(): { game: GameState; house: Building } {
    const { game, house } = street();
    Object.assign(house, { level: 'tenement', residents: 40, food: 50, fleece: 6 });
    Object.assign(house.coveredUntil, { water: LONG, philosophy: LONG, athletics: LONG });
    placeBuilding(game, 'flowerGarden', 2, 6);
    placeBuilding(game, 'taxOffice', 0, 5);
    return { game, house };
  }

  it('keeps its level at appeal 6', () => {
    const { game, house } = tenement();
    expect(houseAppeal(game, house)).toBe(6);
    runTicks(game, LEVEL_CHANGE_TICKS);
    expect(house.level).toBe('tenement');
  });

  it('falls back to a Homestead at appeal 5, sending away residents above 32', () => {
    const { game, house } = tenement();
    placeBuilding(game, 'cardingShed', 6, 7);
    expect(houseAppeal(game, house)).toBe(5);
    runTicks(game, LEVEL_CHANGE_TICKS);
    expect(house.level).toBe('homestead');
    expect(house.residents).toBe(32);
  });

  it('falls back to a Homestead when its culture drops below 35', () => {
    const { game, house } = tenement();
    house.coveredUntil.athletics = 0;
    runTicks(game, LEVEL_CHANGE_TICKS);
    expect(house.level).toBe('homestead');
  });
});

describe('a city of Hovels with sheep', () => {
  it('turns them into Homesteads', () => {
    const LONG = 20 * TICKS_PER_MONTH;
    const game = grassGame(40);
    placeRoad(game, { x: 0, y: 20 }, { x: 39, y: 20 });
    placeHouses(game, { x: 0, y: 18 }, { x: 11, y: 19 });
    for (let x = 0; x < 12; x += 2) placeBuilding(game, 'flowerGarden', x, 16);
    placeHouses(game, { x: 9, y: 21 }, { x: 12, y: 22 });
    placeBuilding(game, 'maintenanceOffice', 3, 21);
    placeRoadblock(game, { x: 14, y: 20 });
    const houses = game.buildings.filter((b) => b.type === 'house');
    for (const house of houses) {
      Object.assign(house, { level: 'hovel', residents: 24, food: 50 });
      Object.assign(house.coveredUntil, { water: LONG, philosophy: LONG });
    }
    placeBuilding(game, 'agora', 0, 21);
    placeBuilding(game, 'fleeceVendor', 0, 21);
    placeBuilding(game, 'storehouse', 20, 21);
    placeBuilding(game, 'cardingShed', 24, 18);
    setMeadow(game, 16, 26, 16, 8);
    for (const x of [20, 24, 28]) placeSheep(game, { x, y: 30 });

    runTicks(game, TICKS_PER_MONTH);
    expect(houses.some((h) => h.level === 'homestead')).toBe(false);
    runTicks(game, 3 * TICKS_PER_MONTH + LEVEL_CHANGE_TICKS);
    expect(houses.filter((h) => h.level === 'homestead').length).toBeGreaterThanOrEqual(4);
  });
});

describe('a Tenement on its way to an Apartment', () => {
  const LONG = 10 * TICKS_PER_MONTH;

  function servedTenement(): { game: GameState; house: Building } {
    const { game, house } = street();
    Object.assign(house, { level: 'tenement', residents: 40, food: 50, fleece: 6, oil: 6 });
    Object.assign(house.coveredUntil, { water: LONG, philosophy: LONG, athletics: LONG });
    for (const x of [0, 2, 4]) placeBuilding(game, 'flowerGarden', x, 6);
    placeBuilding(game, 'taxOffice', 5, 8);
    return { game, house };
  }

  it('becomes an Apartment of 48 with oil and appeal 20', () => {
    const { game, house } = servedTenement();
    expect(houseAppeal(game, house)).toBe(20);
    runTicks(game, LEVEL_CHANGE_TICKS);
    expect(house.level).toBe('apartment');
    expect(houseCapacity(house)).toBe(48);
  });

  it('stays a Tenement without oil', () => {
    const { game, house } = servedTenement();
    house.oil = 0;
    runTicks(game, LEVEL_CHANGE_TICKS);
    expect(house.level).toBe('tenement');
  });

  it('stays a Tenement at appeal 19', () => {
    const { game, house } = servedTenement();
    placeBuilding(game, 'storehouse', 2, 2);
    expect(houseAppeal(game, house)).toBe(19);
    runTicks(game, LEVEL_CHANGE_TICKS);
    expect(house.level).toBe('tenement');
  });
});

describe('an Apartment', () => {
  const LONG = 10 * TICKS_PER_MONTH;

  function apartment(): { game: GameState; house: Building } {
    const { game, house } = street();
    Object.assign(house, { level: 'apartment', residents: 48, food: 50, fleece: 6, oil: 6 });
    Object.assign(house.coveredUntil, { water: LONG, philosophy: LONG, athletics: LONG });
    for (const x of [0, 2, 4]) placeBuilding(game, 'flowerGarden', x, 6);
    placeBuilding(game, 'taxOffice', 5, 8);
    placeBuilding(game, 'olivePress', 6, 11);
    placeBuilding(game, 'cardingShed', 0, 11);
    return { game, house };
  }

  it('uses 2 units of oil a month', () => {
    const { game, house } = apartment();
    runTicks(game, TICKS_PER_MONTH);
    expect(house.oil).toBe(4);
  });

  it('falls back to a Tenement when its oil runs out, sending away residents above 40', () => {
    const { game, house } = apartment();
    house.oil = 2;
    runTicks(game, TICKS_PER_MONTH - 1);
    expect(house.level).toBe('apartment');
    runTicks(game, LEVEL_CHANGE_TICKS);
    expect(house.level).toBe('tenement');
    expect(house.residents).toBe(40);
  });

  it('keeps its level at appeal 16', () => {
    const { game, house } = apartment();
    expect(houseAppeal(game, house)).toBe(16);
    runTicks(game, LEVEL_CHANGE_TICKS);
    expect(house.level).toBe('apartment');
  });

  it('falls back to a Tenement at appeal 15', () => {
    const { game, house } = apartment();
    placeBuilding(game, 'storehouse', 2, 2);
    expect(houseAppeal(game, house)).toBe(15);
    runTicks(game, LEVEL_CHANGE_TICKS);
    expect(house.level).toBe('tenement');
  });

});

describe('an Apartment on its way to a Townhouse', () => {
  const LONG = 10 * TICKS_PER_MONTH;

  function servedApartment(): { game: GameState; house: Building } {
    const { game, house } = street();
    Object.assign(house, { level: 'apartment', residents: 48, food: 50, fleece: 6, oil: 6 });
    Object.assign(house.coveredUntil, { water: LONG, philosophy: LONG, athletics: LONG, drama: LONG });
    for (const x of [0, 2, 4]) placeBuilding(game, 'flowerGarden', x, 6);
    placeBuilding(game, 'flowerGarden', 4, 8);
    return { game, house };
  }

  it('becomes a Townhouse of 60 with 45 culture and appeal 30', () => {
    const { game, house } = servedApartment();
    placeBuilding(game, 'park', 1, 11);
    placeBuilding(game, 'storehouse', 2, 2);
    expect(houseAppeal(game, house)).toBe(30);
    runTicks(game, LEVEL_CHANGE_TICKS);
    expect(house.level).toBe('townhouse');
    expect(houseCapacity(house)).toBe(60);
  });

  it('stays an Apartment at appeal 29', () => {
    const { game, house } = servedApartment();
    expect(houseAppeal(game, house)).toBe(29);
    runTicks(game, LEVEL_CHANGE_TICKS);
    expect(house.level).toBe('apartment');
  });

  it('stays an Apartment with 35 culture', () => {
    const { game, house } = servedApartment();
    placeBuilding(game, 'park', 1, 11);
    placeBuilding(game, 'storehouse', 2, 2);
    house.coveredUntil.drama = 0;
    runTicks(game, LEVEL_CHANGE_TICKS);
    expect(house.level).toBe('apartment');
  });
});

describe('a Townhouse', () => {
  const LONG = 10 * TICKS_PER_MONTH;

  function townhouse(): { game: GameState; house: Building } {
    const { game, house } = street();
    Object.assign(house, { level: 'townhouse', residents: 60, food: 50, fleece: 6, oil: 6 });
    Object.assign(house.coveredUntil, { water: LONG, athletics: LONG, drama: LONG });
    for (const x of [0, 2, 4]) placeBuilding(game, 'flowerGarden', x, 6);
    placeBuilding(game, 'flowerGarden', 4, 8);
    return { game, house };
  }

  it('houses 60 and keeps its level with 45 culture above appeal 25', () => {
    const { game, house } = townhouse();
    expect(houseAppeal(game, house)).toBe(29);
    runTicks(game, LEVEL_CHANGE_TICKS);
    expect(house.level).toBe('townhouse');
    expect(houseCapacity(house)).toBe(60);
  });

  it('falls back to an Apartment below appeal 26, sending away residents above 48', () => {
    const { game, house } = townhouse();
    demolish(game, { x: 4, y: 8 }, { x: 4, y: 8 });
    expect(houseAppeal(game, house)).toBe(22);
    runTicks(game, LEVEL_CHANGE_TICKS);
    expect(house.level).toBe('apartment');
    expect(house.residents).toBe(48);
  });

  it('falls back to an Apartment when its culture drops below 45', () => {
    const { game, house } = townhouse();
    house.coveredUntil.drama = 0;
    house.coveredUntil.philosophy = LONG;
    runTicks(game, LEVEL_CHANGE_TICKS);
    expect(house.level).toBe('apartment');
  });
});

describe('a city of Tenements with an olive grove', () => {
  it('turns them into Apartments', () => {
    const LONG = 20 * TICKS_PER_MONTH;
    const game = grassGame(40);
    placeRoad(game, { x: 0, y: 20 }, { x: 39, y: 20 });
    placeHouses(game, { x: 0, y: 18 }, { x: 11, y: 19 });
    for (const y of [14, 16]) for (let x = 0; x < 12; x += 2) placeBuilding(game, 'flowerGarden', x, y);
    const houses = game.buildings.filter((b) => b.type === 'house');
    for (const house of houses) {
      Object.assign(house, { level: 'tenement', residents: 40, food: 200, fleece: 50 });
      Object.assign(house.coveredUntil, { water: LONG, philosophy: LONG, athletics: LONG });
    }
    placeBuilding(game, 'agora', 0, 21);
    placeBuilding(game, 'oilVendor', 0, 21);
    placeBuilding(game, 'storehouse', 20, 21);
    placeBuilding(game, 'growersLodge', 24, 18);
    placeBuilding(game, 'olivePress', 28, 18);
    setMeadow(game, 16, 25, 16, 8);
    placeOliveTrees(game, { x: 18, y: 26 }, { x: 25, y: 29 });

    expect(houses.filter((h) => houseAppeal(game, h) >= 30).length).toBeGreaterThanOrEqual(4);

    runTicks(game, 2 * TICKS_PER_MONTH);
    expect(houses.some((h) => h.level === 'apartment')).toBe(false);
    runTicks(game, 3 * TICKS_PER_MONTH + LEVEL_CHANGE_TICKS);
    expect(houses.filter((h) => h.level === 'apartment').length).toBeGreaterThanOrEqual(4);
  });
});

describe('a house changing level', () => {
  it('waits a month of meeting the next level before it changes', () => {
    const { game, house } = street();
    house.food = 100;
    runTicks(game, LEVEL_CHANGE_TICKS - 1);
    expect(house.level).toBe('hut');
    tick(game);
    expect(house.level).toBe('shack');
  });

  it('keeps its level through a short lapse in what it needs', () => {
    const LONG = 10 * TICKS_PER_MONTH;
    const { game, house } = street();
    Object.assign(house, { level: 'hovel', residents: 24, food: 50 });
    Object.assign(house.coveredUntil, { water: 0, athletics: LONG });
    runTicks(game, LEVEL_CHANGE_TICKS - 1);
    house.coveredUntil.water = LONG;
    runTicks(game, LEVEL_CHANGE_TICKS);
    expect(house.level).toBe('hovel');
  });
});

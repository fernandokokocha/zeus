import type { BuildingType, Rotation } from './buildings';
import { TICKS_PER_MONTH } from './clock';
import { footprint, placeBuilding, placeHouses, placeRoad, placeRoadblock, vendorSpotAt } from './commands';
import { GRANARY_CAPACITY, UNITS_PER_LOAD, VENDOR_CAPACITY, houseStockTarget } from './food';
import { HOUSE_LEVELS } from './housing';
import { assignWorkers } from './labor';
import { MAP_SIZE } from './map';
import type { Point } from './point';
import { COVERAGE_MONTHS } from './roamers';
import { PERFORMANCE_TICKS } from './schools';
import { newGameState, tileIndex, type Building, type Coverage, type GameState, type HouseGood, type PeddledGood } from './state';
import type { Terrain } from './terrain';
import { UPGRADES } from './upgrades';

export const START_CITIES = ['scholars', 'upgrades'] as const;
export type StartCity = (typeof START_CITIES)[number];

const MAIN_ROAD_Y = 50;
const STARTING_FUNDS = 50_000;
const UPGRADES_CITY_WORKS_OF_ART = UPGRADES.length;
const HOUSE_GOODS: HouseGood[] = ['food', 'fleece', 'oil'];

export const SCHOLARS_CITY = {
  blocks: [12, 16, 20].map((x) => ({ x, y: 41 })),
  site: { x: 20, y: 41, rotation: 0 as Rotation },
  roadblock: { x: 10, y: 47 },
};

export function isStartCity(name: string): name is StartCity {
  return (START_CITIES as readonly string[]).includes(name);
}

export function startCity(name: StartCity): GameState {
  return START_CITY_BUILDERS[name]();
}

const START_CITY_BUILDERS: Record<StartCity, () => GameState> = { scholars: scholarsCity, upgrades: upgradesCity };

function flatMap(): GameState {
  const terrain = new Array<Terrain>(MAP_SIZE * MAP_SIZE).fill('grass');
  const mainRoad = Array.from({ length: MAP_SIZE }, (_, x) => ({ x, y: MAIN_ROAD_Y }));
  return newGameState(MAP_SIZE, terrain, mainRoad);
}

function scholarsCity(): GameState {
  const state = flatMap();
  state.treasury = STARTING_FUNDS;
  layDistrictRoads(state);
  for (const block of SCHOLARS_CITY.blocks) townhouseBlock(state, block);
  districtServices(state);
  supplyChain(state);
  state.permits.scholarsHouse = 1;
  assignWorkers(state);
  return state;
}

function upgradesCity(): GameState {
  const state = scholarsCity();
  state.worksOfArt = UPGRADES_CITY_WORKS_OF_ART;
  return state;
}

function road(state: GameState, from: Point, to: Point): void {
  ensure(placeRoad(state, from, to));
}

function layDistrictRoads(state: GameState): void {
  road(state, { x: 10, y: 40 }, { x: 28, y: 40 });
  road(state, { x: 10, y: 45 }, { x: 24, y: 45 });
  road(state, { x: 10, y: 40 }, { x: 10, y: MAIN_ROAD_Y - 1 });
  road(state, { x: 24, y: 40 }, { x: 24, y: 45 });
  ensure(placeRoadblock(state, SCHOLARS_CITY.roadblock));
}

function townhouseBlock(state: GameState, corner: Point): void {
  ensure(placeHouses(state, corner, { x: corner.x + 3, y: corner.y + 3 }));
  for (const lot of [corner, { x: corner.x + 2, y: corner.y }, { x: corner.x, y: corner.y + 2 }, { x: corner.x + 2, y: corner.y + 2 }]) {
    const house = buildingAt(state, lot);
    Object.assign(house, { level: 'townhouse', residents: HOUSE_LEVELS.townhouse.capacity });
    for (const good of HOUSE_GOODS) house[good] = houseStockTarget(house, good);
    for (const service of Object.keys(COVERAGE_MONTHS) as Coverage[]) house.coveredUntil[service] = COVERAGE_MONTHS[service] * TICKS_PER_MONTH;
  }
}

function districtServices(state: GameState): void {
  place(state, 'palace', 11, 34);
  place(state, 'theater', 20, 35);
  place(state, 'podium', 25, 38);
  place(state, 'flowerGarden', 25, 41);
  place(state, 'maintenanceOffice', 25, 43);
  const agora = place(state, 'agora', 11, 46, 1);
  vendors(state, agora, [
    ['foodVendor', 'food'],
    ['fleeceVendor', 'fleece'],
    ['oilVendor', 'oil'],
  ]);
  vendors(state, place(state, 'agora', 27, 34, 0), [['scrollVendor', 'scrolls']]);
  place(state, 'fountain', 17, 46);
  place(state, 'gymnasium', 24, 46);
  place(state, 'infirmary', 29, 38);
  for (const venue of state.buildings.filter((b) => b.type === 'theater' || b.type === 'podium')) venue.performingUntil = PERFORMANCE_TICKS;
}

function vendors(state: GameState, agora: Building, stalls: [BuildingType, PeddledGood][]): void {
  const spots = new Map<number, Point>();
  for (const tile of footprint(agora)) {
    const spot = vendorSpotAt(state, tile);
    if (spot) spots.set(tileIndex(state, spot.x, spot.y), spot);
  }
  const free = [...spots.values()];
  stalls.forEach(([type, good], i) => {
    place(state, type, free[i].x, free[i].y)[good] = VENDOR_CAPACITY;
  });
}

function supplyChain(state: GameState): void {
  for (const x of [12, 16]) place(state, 'granary', x, 51).food = GRANARY_CAPACITY;
  Object.assign(place(state, 'storehouse', 20, 51), { fleece: 16 * UNITS_PER_LOAD, oil: 16 * UNITS_PER_LOAD });
  Object.assign(place(state, 'storehouse', 23, 51), { fleece: 8 * UNITS_PER_LOAD, oil: 8 * UNITS_PER_LOAD });
  place(state, 'storehouse', 6, 51).scrolls = 8 * UNITS_PER_LOAD;
  place(state, 'maintenanceOffice', 26, 51);
  place(state, 'college', 28, 51);
  place(state, 'dramaSchool', 31, 51);
  place(state, 'maintenanceOffice', 34, 51);
  for (const x of [40, 43, 46, 49, 52]) {
    for (let dy = 0; dy < 3; dy++) for (let dx = 0; dx < 3; dx++) state.terrain[tileIndex(state, x + dx, 51 + dy)] = 'meadow';
    place(state, 'wheatFarm', x, 51);
  }
  place(state, 'maintenanceOffice', 55, 51);
}

function place(state: GameState, type: BuildingType, x: number, y: number, rotation: Rotation = 0): Building {
  ensure(placeBuilding(state, type, x, y, rotation));
  return buildingAt(state, { x, y });
}

function buildingAt(state: GameState, at: Point): Building {
  const id = state.buildingIdAt[tileIndex(state, at.x, at.y)];
  const building = state.buildings.find((b) => b.id === id && b.x === at.x && b.y === at.y);
  if (!building) throw new Error(`No building starts at ${at.x},${at.y}`);
  return building;
}

function ensure(result: { ok: true } | { ok: false; reason: string }): void {
  if (!result.ok) throw new Error(result.reason);
}

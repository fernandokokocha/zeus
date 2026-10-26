import type { BuildingType, Rotation } from './buildings';
import type { WellFed } from './charters';
import type { HouseLevel } from './housing';
import { DEFAULT_SEED, MAP_SIZE, generateTerrain } from './map';
import { clampPoint, type Point } from './point';
import type { Terrain } from './terrain';
import { STARTING_TREASURY } from './treasury';

export type Speed = 0 | 1 | 2 | 4;
export type PlayingSpeed = Exclude<Speed, 0>;

export type HouseGood = 'food' | 'fleece' | 'oil';
export type Material = 'wood' | 'marble' | 'bronze';
export type PeddledGood = HouseGood | 'cloth';
export type Good = HouseGood | 'olives' | Material | 'sculptures' | 'cloth';
export type Culture = 'philosophy' | 'athletics' | 'drama';
export type Service = 'water' | 'tax' | 'goods' | Culture | 'maintenance';
export type Coverage = Exclude<Service, 'goods' | 'maintenance'>;

export interface Building {
  id: number;
  type: BuildingType;
  x: number;
  y: number;
  rotation: Rotation;
  residents: number;
  workers: number;
  walkerRest: number;
  coveredUntil: Record<Coverage, number>;
  level: HouseLevel;
  pendingLevel: HouseLevel | null;
  pendingTicks: number;
  food: number;
  fleece: number;
  olives: number;
  oil: number;
  wood: number;
  marble: number;
  bronze: number;
  sculptures: number;
  cloth: number;
  refused: Good[];
  growth: number;
  production: number;
  performingUntil: number;
  fireRisk: number;
  collapseRisk: number;
  burningUntil: number;
}

export interface Walk {
  path: Point[];
  step: number;
  progress: number;
}

export interface Settler extends Walk {
  id: number;
  destinationId: number;
  people: number;
}

export type RoamerKind = 'waterCarrier' | 'taxCollector' | 'peddler' | 'philosopher' | 'athlete' | 'actor' | 'superintendent';

export interface Roamer extends Walk {
  id: number;
  kind: RoamerKind;
  homeId: number;
  returning: boolean;
}

export type TraineeKind = 'philosopherTrainee' | 'actorTrainee';

export interface Trainee extends Walk {
  id: number;
  kind: TraineeKind;
  homeId: number;
  destinationId: number;
}

export interface Sheep extends Walk {
  id: number;
  home: Point;
  fleece: number;
  grazeRest: number;
}

export interface Shepherd extends Walk {
  id: number;
  homeId: number;
  sheepId: number;
  fleece: number;
  returning: boolean;
}

export interface Grower extends Walk {
  id: number;
  homeId: number;
  treeId: number;
  olives: number;
  returning: boolean;
}

export interface Gatherer extends Walk {
  id: number;
  homeId: number;
  good: Material;
  site: Point;
  load: number;
  returning: boolean;
}

export interface Artisan extends Walk {
  id: number;
  homeId: number;
  destinationId: number;
}

export type CarrierKind =
  | 'cartPusher'
  | 'buyer'
  | 'fleeceCart'
  | 'fleeceBuyer'
  | 'oliveCart'
  | 'oilCart'
  | 'oliveBuyer'
  | 'oilBuyer'
  | 'woodCart'
  | 'marbleCart'
  | 'bronzeCart'
  | 'sculptureCart'
  | 'bronzeBuyer'
  | 'weaverBuyer'
  | 'clothCart'
  | 'clothBuyer'
  | 'marbleSupply'
  | 'woodSupply'
  | 'sculptureSupply';

export interface Carrier extends Walk {
  id: number;
  kind: CarrierKind;
  homeId: number;
  destinationId: number;
  food: number;
  fleece: number;
  olives: number;
  oil: number;
  wood: number;
  marble: number;
  bronze: number;
  sculptures: number;
  cloth: number;
  returning: boolean;
}

export interface Notice {
  id: number;
  tick: number;
  text: string;
  at: Point | null;
}

export interface GameState {
  size: number;
  terrain: Terrain[];
  roads: boolean[];
  mainRoad: boolean[];
  roadblocks: boolean[];
  buildings: Building[];
  buildingIdAt: number[];
  nextBuildingId: number;
  settlers: Settler[];
  nextSettlerId: number;
  roamers: Roamer[];
  nextRoamerId: number;
  carriers: Carrier[];
  nextCarrierId: number;
  trainees: Trainee[];
  nextTraineeId: number;
  sheep: Sheep[];
  nextSheepId: number;
  shepherds: Shepherd[];
  nextShepherdId: number;
  growers: Grower[];
  nextGrowerId: number;
  gatherers: Gatherer[];
  nextGathererId: number;
  felledUntil: number[];
  artisans: Artisan[];
  nextArtisanId: number;
  notices: Notice[];
  nextNoticeId: number;
  wellFed: WellFed;
  guildPermits: number;
  announcedGuildSites: number[];
  rngState: number;
  entry: Point;
  treasury: number;
  lastMonth: { taxes: number; wages: number };
  tick: number;
  speed: Speed;
  lastPlayedSpeed: PlayingSpeed;
  speedBeforeInspection: Speed | null;
  version: number;
}

export const NO_BUILDING = 0;

export function newGameState(size: number, terrain: Terrain[], mainRoad: Point[]): GameState {
  const onMainRoad = new Array<boolean>(size * size).fill(false);
  for (const p of mainRoad) onMainRoad[p.y * size + p.x] = true;
  return {
    size,
    terrain,
    roads: [...onMainRoad],
    mainRoad: onMainRoad,
    roadblocks: new Array<boolean>(size * size).fill(false),
    buildings: [],
    buildingIdAt: new Array<number>(size * size).fill(NO_BUILDING),
    nextBuildingId: 1,
    settlers: [],
    nextSettlerId: 1,
    roamers: [],
    nextRoamerId: 1,
    carriers: [],
    nextCarrierId: 1,
    trainees: [],
    nextTraineeId: 1,
    sheep: [],
    nextSheepId: 1,
    shepherds: [],
    nextShepherdId: 1,
    growers: [],
    nextGrowerId: 1,
    gatherers: [],
    nextGathererId: 1,
    felledUntil: new Array<number>(size * size).fill(0),
    artisans: [],
    nextArtisanId: 1,
    notices: [],
    nextNoticeId: 1,
    wellFed: { months: 0, reset: null },
    guildPermits: 0,
    announcedGuildSites: [],
    rngState: DEFAULT_SEED,
    entry: mainRoad[0],
    treasury: STARTING_TREASURY,
    lastMonth: { taxes: 0, wages: 0 },
    tick: 0,
    speed: 1,
    lastPlayedSpeed: 1,
    speedBeforeInspection: null,
    version: 0,
  };
}

export function createGame(seed = DEFAULT_SEED): GameState {
  const { terrain, mainRoad } = generateTerrain(seed);
  return newGameState(MAP_SIZE, terrain, mainRoad);
}

export function tileIndex(state: GameState, x: number, y: number): number {
  return y * state.size + x;
}

export function inBounds(state: GameState, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < state.size && y < state.size;
}

export function clampToMap(state: GameState, p: Point): Point {
  return clampPoint(p, state.size);
}

export function buildingById(state: GameState, id: number): Building | undefined {
  return state.buildings.find((b) => b.id === id);
}

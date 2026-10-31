import type { BuildingType, Rotation } from './buildings';
import type { CharterCount } from './charters';
import { emptyFlows, type FlowBook } from './flows';
import type { EliteType, HouseLevel } from './housing';
import type { MonumentKind } from './monuments';
import { defaultIndustrySettings, type IndustrySettings } from './industries';
import { DEFAULT_SEED, MAP_SIZE, generateTerrain } from './map';
import { clampPoint, type Point } from './point';
import type { RoadUpgrade } from './road-upgrades';
import type { Terrain } from './terrain';
import type { Upgrade } from './upgrades';
import type { Partner, Route } from './trade';
import { emptyTradeYear, type TradeBooks } from './trade-books';
import { STARTING_TREASURY, emptyAccounts, type Books } from './treasury';

export type Speed = 0 | 1 | 2 | 4;
export type PlayingSpeed = Exclude<Speed, 0>;

export type HouseGood = 'food' | 'fleece' | 'oil';
export type Material = 'wood' | 'marble' | 'bronze';
export type PeddledGood = HouseGood | 'cloth' | 'scrolls' | 'armor';
export type Good = HouseGood | 'olives' | Material | 'sculptures' | 'cloth' | 'papyrus' | 'scrolls' | 'armor';
export type TradeGood = Exclude<Good, 'scrolls' | 'armor'>;
export type Culture = 'philosophy' | 'athletics' | 'drama';
export type Service = 'water' | 'tax' | 'goods' | Culture | 'maintenance' | 'health';
export type Coverage = Exclude<Service, 'goods' | 'maintenance' | 'health'>;

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
  started: boolean;
  food: number;
  fleece: number;
  olives: number;
  oil: number;
  wood: number;
  marble: number;
  bronze: number;
  sculptures: number;
  cloth: number;
  papyrus: number;
  scrolls: number;
  armor: number;
  refused: Good[];
  growth: number;
  production: number;
  pages: number;
  hoplites: number;
  performingUntil: number;
  fireRisk: number;
  collapseRisk: number;
  diseaseRisk: number;
  sick: boolean;
  fellSickAt: number | null;
  burningUntil: number;
  taxPaid: number[];
  monument: MonumentKind | null;
  tradeSlots: TradeSlot[];
}

export type TradeSlot = { trade: 'export'; good: TradeGood } | { trade: 'import'; good: TradeGood; loads: number } | null;

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

export type RoamerKind = 'waterCarrier' | 'taxCollector' | 'peddler' | 'philosopher' | 'athlete' | 'actor' | 'superintendent' | 'healer';

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
  | 'carrotCart'
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
  | 'papyrusBuyer'
  | 'scriptoriumFleeceBuyer'
  | 'scrollCart'
  | 'scrollBuyer'
  | 'armoryBuyer'
  | 'armorCart'
  | 'armorBuyer'
  | 'marbleSupply'
  | 'woodSupply'
  | 'sculptureSupply'
  | 'foodExport'
  | 'fleeceExport'
  | 'oliveExport'
  | 'oilExport'
  | 'woodExport'
  | 'marbleExport'
  | 'bronzeExport'
  | 'sculptureExport'
  | 'clothExport'
  | 'foodUnload'
  | 'fleeceUnload'
  | 'oliveUnload'
  | 'oilUnload'
  | 'woodUnload'
  | 'marbleUnload'
  | 'bronzeUnload'
  | 'sculptureUnload'
  | 'clothUnload'
  | 'papyrusUnload';

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
  papyrus: number;
  scrolls: number;
  armor: number;
  returning: boolean;
}

export type CaravanTrip = 'out' | 'away' | 'home' | 'merchants';

export interface Caravan extends Walk {
  id: number;
  guildId: number;
  partner: Partner;
  good: Good;
  loads: number;
  drachmas: number;
  trip: CaravanTrip;
  backAt: number;
  waiting: boolean;
}

export type ForeignTrip = 'coming' | 'in' | 'back' | 'going';

export interface ForeignCaravan extends Walk {
  id: number;
  partner: Partner;
  yardId: number;
  slot: number;
  good: Good;
  loads: number;
  cost: number;
  trip: ForeignTrip;
  dueAt: number;
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
  roadUpgrades: (RoadUpgrade | null)[];
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
  caravans: Caravan[];
  nextCaravanId: number;
  foreignCaravans: ForeignCaravan[];
  nextForeignCaravanId: number;
  notices: Notice[];
  nextNoticeId: number;
  wellDressed: CharterCount;
  learnedCity: CharterCount;
  healthyAndWellFed: CharterCount;
  permits: Record<EliteType, number>;
  monumentsToPlace: MonumentKind[];
  worksOfArt: number;
  upgrades: Upgrade[];
  crowdedCityEarned: boolean;
  announcedEliteSites: Record<EliteType, number[]>;
  routes: Route[];
  partnersTraded: Partner[];
  rngState: number;
  entry: Point;
  treasury: number;
  accounts: Books;
  plagueDeaths: { thisYear: number; lastYear: number };
  tradeBooks: TradeBooks;
  populationHistory: number[];
  flows: FlowBook;
  industries: IndustrySettings;
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
    roadUpgrades: new Array<RoadUpgrade | null>(size * size).fill(null),
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
    caravans: [],
    nextCaravanId: 1,
    foreignCaravans: [],
    nextForeignCaravanId: 1,
    notices: [],
    nextNoticeId: 1,
    wellDressed: { months: 0, reset: null },
    learnedCity: { months: 0, reset: null },
    healthyAndWellFed: { months: 0, reset: null },
    permits: { tradersGuild: 0, scholarsHouse: 0, warriorsHouse: 0 },
    monumentsToPlace: [],
    worksOfArt: 0,
    upgrades: [],
    crowdedCityEarned: false,
    announcedEliteSites: { tradersGuild: [], scholarsHouse: [], warriorsHouse: [] },
    routes: [],
    partnersTraded: [],
    rngState: DEFAULT_SEED,
    entry: mainRoad[0],
    treasury: STARTING_TREASURY,
    accounts: { thisYear: emptyAccounts(), lastYear: emptyAccounts() },
    plagueDeaths: { thisYear: 0, lastYear: 0 },
    tradeBooks: { thisYear: emptyTradeYear(), lastYear: emptyTradeYear() },
    populationHistory: [0],
    flows: { thisMonth: emptyFlows(), months: [] },
    industries: defaultIndustrySettings(),
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

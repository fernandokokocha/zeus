import type { BuildingType } from '../sim/buildings';
import { cropStage, UNITS_PER_LOAD } from '../sim/food';
import { houseLevel } from '../sim/housing';
import { isRipe } from '../sim/olives';
import { isBurning } from '../sim/safety';
import { builtStages, isFinished } from '../sim/sanctuaries';
import { isPerforming } from '../sim/schools';
import type { Building, GameState } from '../sim/state';
import { VENDOR_GOODS } from './agora-models';
import { baysOf } from './storehouse-models';

type Look = (building: Building, state: GameState) => unknown[];

const loads = (units: number) => Math.floor(units / UNITS_PER_LOAD);
const staffed: Look = (b) => [b.workers > 0];
const unchanging: Look = () => [];
const vendor: Look = (b) => [b.workers > 0, loads(b[VENDOR_GOODS[b.type]])];
const performing: Look = (b, state) => [isPerforming(state, b)];
const sanctuary: Look = (b) => [builtStages(b), isFinished(b), b.marble, b.wood, b.sculptures];

const LOOKS: Record<BuildingType, Look> = {
  house: (b) => [houseLevel(b)],
  fountain: staffed,
  taxOffice: staffed,
  palace: unchanging,
  wheatFarm: (b) => [cropStage(b), b.workers > 0, b.food > 0],
  granary: (b) => [loads(b.food)],
  agora: unchanging,
  foodVendor: vendor,
  park: unchanging,
  column: unchanging,
  flowerGarden: unchanging,
  college: staffed,
  podium: performing,
  gymnasium: staffed,
  dramaSchool: staffed,
  theater: performing,
  storehouse: (b) => [b.workers > 0, ...baysOf(b).map((bay) => `${bay.good}${bay.loads}`)],
  fleeceVendor: vendor,
  cardingShed: (b) => [b.fleece > 0],
  oliveTree: (b) => [isRipe(b)],
  growersLodge: (b) => [b.olives > 0],
  olivePress: (b) => [b.olives > 0, loads(b.oil)],
  oilVendor: vendor,
  weaver: (b) => [b.workers > 0, b.fleece > 0, loads(b.cloth)],
  timberMill: (b) => [b.workers > 0, loads(b.wood)],
  masonryShop: (b) => [b.workers > 0, loads(b.marble)],
  foundry: (b) => [b.workers > 0, loads(b.bronze)],
  sculptureStudio: (b) => [b.workers > 0, loads(b.bronze), loads(b.sculptures)],
  artisansGuild: staffed,
  maintenanceOffice: staffed,
  demeterSanctuary: sanctuary,
  athenaSanctuary: sanctuary,
  hephaestusSanctuary: sanctuary,
  ruins: (b, state) => [isBurning(state, b)],
};

export function lookKey(building: Building, state: GameState): string {
  return [building.type, building.rotation, ...LOOKS[building.type](building, state)].join('/');
}

import type { BuildingType } from '../sim/buildings';
import { cropStage, UNITS_PER_LOAD } from '../sim/food';
import { isMissingNeed } from '../sim/elites';
import { houseLevel } from '../sim/housing';
import { isRipe } from '../sim/olives';
import { isBurning } from '../sim/safety';
import { builtStages, isFinished } from '../sim/sanctuaries';
import { isPerforming } from '../sim/schools';
import type { Building, GameState } from '../sim/state';
import { VENDOR_GOODS } from './agora-models';
import { baysOf } from '../sim/storehouse';

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
  carrotFarm: (b) => [cropStage(b), b.workers > 0, b.food > 0],
  granary: (b) => [loads(b.food)],
  agora: unchanging,
  foodVendor: vendor,
  park: unchanging,
  column: unchanging,
  flowerGarden: unchanging,
  monument: unchanging,
  college: staffed,
  podium: performing,
  gymnasium: staffed,
  dramaSchool: staffed,
  theater: performing,
  storehouse: (b, state) => [b.workers > 0, ...baysOf(state, b).map((bay) => `${bay.good}${bay.loads}`)],
  fleeceVendor: vendor,
  cardingShed: (b) => [b.fleece > 0],
  oliveTree: (b) => [isRipe(b)],
  growersLodge: (b) => [b.olives > 0],
  olivePress: (b) => [b.olives > 0, loads(b.oil)],
  oilVendor: vendor,
  clothVendor: vendor,
  scrollVendor: vendor,
  armsVendor: vendor,
  armory: (b) => [b.workers > 0, loads(b.bronze), loads(b.armor)],
  weaver: (b) => [b.workers > 0, b.fleece > 0, loads(b.cloth)],
  scriptorium: (b) => [b.workers > 0, b.papyrus > 0, b.fleece > 0, loads(b.scrolls)],
  timberMill: (b) => [b.workers > 0, loads(b.wood)],
  masonryShop: (b) => [b.workers > 0, loads(b.marble)],
  foundry: (b) => [b.workers > 0, loads(b.bronze)],
  sculptureStudio: (b) => [b.workers > 0, loads(b.bronze), loads(b.sculptures)],
  artisansGuild: staffed,
  maintenanceOffice: staffed,
  infirmary: staffed,
  demeterSanctuary: sanctuary,
  athenaSanctuary: sanctuary,
  hephaestusSanctuary: sanctuary,
  tradersGuild: (b) => [b.residents > 0, isMissingNeed(b)],
  tradeYard: unchanging,
  scholarsHouse: (b) => [isMissingNeed(b)],
  library: (b) => [b.workers > 0],
  ruins: (b, state) => [isBurning(state, b)],
};

export function lookKey(building: Building, state: GameState): string {
  return [building.type, building.rotation, ...LOOKS[building.type](building, state)].join('/');
}

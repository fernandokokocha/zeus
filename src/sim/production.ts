import type { BuildingType } from './buildings';
import { MONTHS_PER_YEAR } from './clock';
import { CLOTH_LOADS_PER_YEAR } from './cloth';
import { isClosed, isIndustry, type Industry } from './industries';
import { GOODS, emptyFlows, recordFlow, type GoodFlow } from './flows';
import { UNITS_PER_LOAD, WHEAT_LOADS_PER_YEAR } from './food';
import { BRONZE_PER_SCULPTURE, SCULPTURES_PER_YEAR, WORKSHOP_SPECS } from './materials';
import { OIL_LOADS_PER_YEAR, OLIVES_PER_PICKING, PICKINGS_PER_YEAR } from './olives';
import { SANCTUARY_MATERIALS, isSanctuary, stillNeeded } from './sanctuaries';
import { FLEECE_PER_SHEARING, SHEARINGS_PER_YEAR } from './sheep';
import type { GameState, Good } from './state';

interface Yearly {
  good: Good;
  perYear: number;
}

interface IndustrySpec {
  makes: Yearly;
  takes: Yearly | null;
}

const INDUSTRY_SPECS: Record<Industry, IndustrySpec> = {
  wheatFarm: { makes: { good: 'food', perYear: WHEAT_LOADS_PER_YEAR * UNITS_PER_LOAD }, takes: null },
  cardingShed: { makes: { good: 'fleece', perYear: SHEARINGS_PER_YEAR * FLEECE_PER_SHEARING }, takes: null },
  growersLodge: { makes: { good: 'olives', perYear: PICKINGS_PER_YEAR * OLIVES_PER_PICKING }, takes: null },
  olivePress: {
    makes: { good: 'oil', perYear: OIL_LOADS_PER_YEAR * UNITS_PER_LOAD },
    takes: { good: 'olives', perYear: OIL_LOADS_PER_YEAR * UNITS_PER_LOAD },
  },
  weaver: {
    makes: { good: 'cloth', perYear: CLOTH_LOADS_PER_YEAR * UNITS_PER_LOAD },
    takes: { good: 'fleece', perYear: CLOTH_LOADS_PER_YEAR * UNITS_PER_LOAD },
  },
  timberMill: { makes: { good: 'wood', perYear: WORKSHOP_SPECS.timberMill.loadsPerYear * UNITS_PER_LOAD }, takes: null },
  masonryShop: { makes: { good: 'marble', perYear: WORKSHOP_SPECS.masonryShop.loadsPerYear * UNITS_PER_LOAD }, takes: null },
  foundry: { makes: { good: 'bronze', perYear: WORKSHOP_SPECS.foundry.loadsPerYear * UNITS_PER_LOAD }, takes: null },
  sculptureStudio: {
    makes: { good: 'sculptures', perYear: SCULPTURES_PER_YEAR * UNITS_PER_LOAD },
    takes: { good: 'bronze', perYear: SCULPTURES_PER_YEAR * BRONZE_PER_SCULPTURE },
  },
};

export const GOOD_TITLES: Record<Good, string> = {
  food: 'Food',
  fleece: 'Fleece',
  olives: 'Olives',
  oil: 'Oil',
  cloth: 'Fine cloth',
  wood: 'Wood',
  marble: 'Marble',
  bronze: 'Bronze',
  sculptures: 'Sculptures',
};

const STOCK_HOLDERS: BuildingType[] = ['granary', 'storehouse'];

export type ProductionStatus = 'surplus' | 'enough' | 'short' | 'idle';

export interface GoodReport extends GoodFlow {
  good: Good;
  name: string;
  stock: number;
  status: ProductionStatus;
}

export interface ProductionReport {
  goods: GoodReport[];
}

export function closeProductionMonth(state: GameState): void {
  for (const building of state.buildings) {
    if (!isIndustry(building.type) || isClosed(state, building)) continue;
    const { makes, takes } = INDUSTRY_SPECS[building.type];
    recordFlow(state, 'possible', makes.good, makes.perYear / MONTHS_PER_YEAR);
    if (takes) recordFlow(state, 'wanted', takes.good, takes.perYear / MONTHS_PER_YEAR);
  }
  state.flows.months = [...state.flows.months, state.flows.thisMonth].slice(-MONTHS_PER_YEAR);
  state.flows.thisMonth = emptyFlows();
}

export function productionStatus({ made, used, wanted }: Pick<GoodFlow, 'made' | 'used' | 'wanted'>): ProductionStatus {
  if (made === 0 && wanted === 0) return 'idle';
  if (used < wanted) return 'short';
  if (made > wanted) return 'surplus';
  return 'enough';
}

function stillToBuild(state: GameState, good: Good): number {
  const material = SANCTUARY_MATERIALS.find((m) => m === good);
  if (!material) return 0;
  return state.buildings.reduce((sum, b) => sum + (isSanctuary(b.type) ? stillNeeded(b.type, b, material) : 0), 0);
}

function stock(state: GameState, good: Good): number {
  return state.buildings.filter((b) => STOCK_HOLDERS.includes(b.type)).reduce((sum, b) => sum + b[good], 0);
}

function lastTwelveMonths(state: GameState, good: Good): GoodFlow {
  const total = { made: 0, possible: 0, used: 0, wanted: 0 };
  for (const month of state.flows.months) {
    for (const kind of Object.keys(total) as (keyof GoodFlow)[]) total[kind] += month[good][kind];
  }
  return total;
}

export function productionReport(state: GameState): ProductionReport {
  return {
    goods: GOODS.map((good) => {
      const flow = lastTwelveMonths(state, good);
      flow.wanted += stillToBuild(state, good);
      return { good, name: GOOD_TITLES[good], ...flow, stock: stock(state, good), status: productionStatus(flow) };
    }),
  };
}

import { BUILDING_SPECS, type BuildingType } from '../sim/buildings';

export interface PopulationReport {
  history: number[];
  levels: { name: string; houses: number; people: number }[];
  blockers: { reason: string; houses: number }[];
}

export type ProductionStatus = 'surplus' | 'enough' | 'short' | 'idle';

export interface ProductionReport {
  goods: { name: string; made: number; possible: number; used: number; wanted: number; stock: number; status: ProductionStatus }[];
}

export type Priority = 0 | 1 | 2 | 3;

export interface PrioritiesReport {
  workers: number;
  jobs: number;
  industries: { name: string; buildings: number; workers: number; jobs: number; priority: Priority; open: boolean }[];
}

const SAMPLE_MONTHS = 40;

function samplePopulationHistory(): number[] {
  return Array.from({ length: SAMPLE_MONTHS }, (_, month) => {
    const growth = 1480 / (1 + Math.exp(-(month - 16) / 4.5));
    const dip = month >= 27 && month <= 30 ? 140 : 0;
    return Math.round(growth - dip);
  });
}

export const SAMPLE_POPULATION: PopulationReport = {
  history: samplePopulationHistory(),
  levels: [
    { name: 'Hut', houses: 2, people: 14 },
    { name: 'Shack', houses: 3, people: 41 },
    { name: 'Hovel', houses: 6, people: 132 },
    { name: 'Homestead', houses: 9, people: 271 },
    { name: 'Tenement', houses: 8, people: 306 },
    { name: 'Apartment', houses: 7, people: 322 },
    { name: 'Townhouse', houses: 6, people: 348 },
    { name: "Traders' Guild", houses: 1, people: 20 },
  ],
  blockers: [
    { reason: 'needs: oil', houses: 7 },
    { reason: 'needs: culture 35', houses: 6 },
    { reason: 'needs: appeal 30', houses: 4 },
    { reason: 'needs: fleece', houses: 3 },
    { reason: 'needs: water', houses: 2 },
  ],
};

export const SAMPLE_PRODUCTION: ProductionReport = {
  goods: [
    { name: 'Food', made: 2160, possible: 2880, used: 1980, wanted: 2040, stock: 640, status: 'short' },
    { name: 'Fleece', made: 46, possible: 48, used: 38, wanted: 38, stock: 14, status: 'surplus' },
    { name: 'Olives', made: 30, possible: 40, used: 30, wanted: 36, stock: 0, status: 'short' },
    { name: 'Oil', made: 30, possible: 36, used: 29, wanted: 34, stock: 3, status: 'short' },
    { name: 'Fine cloth', made: 12, possible: 12, used: 11, wanted: 12, stock: 2, status: 'enough' },
    { name: 'Wood', made: 18, possible: 24, used: 6, wanted: 6, stock: 21, status: 'surplus' },
    { name: 'Marble', made: 14, possible: 30, used: 14, wanted: 22, stock: 0, status: 'short' },
    { name: 'Bronze', made: 0, possible: 0, used: 0, wanted: 0, stock: 0, status: 'idle' },
    { name: 'Sculptures', made: 0, possible: 0, used: 0, wanted: 0, stock: 0, status: 'idle' },
  ],
};

function industry(type: BuildingType, buildings: number, workers: number, priority: Priority, open = true) {
  return { name: BUILDING_SPECS[type].name, buildings, workers, jobs: buildings * BUILDING_SPECS[type].workers, priority, open };
}

export const SAMPLE_PRIORITIES: PrioritiesReport = {
  workers: 640,
  jobs: 712,
  industries: [
    industry('wheatFarm', 8, 80, 1),
    industry('cardingShed', 2, 16, 0),
    industry('growersLodge', 2, 24, 2),
    industry('olivePress', 2, 24, 2),
    industry('weaver', 1, 12, 0),
    industry('timberMill', 2, 4, 0),
    industry('masonryShop', 2, 0, 3),
    industry('foundry', 1, 0, 0, false),
    industry('sculptureStudio', 1, 0, 0, false),
  ],
};

import { BUILDING_SPECS, type BuildingType } from '../sim/buildings';

export type Priority = 0 | 1 | 2 | 3;

export interface PrioritiesReport {
  workers: number;
  jobs: number;
  industries: { name: string; buildings: number; workers: number; jobs: number; priority: Priority; open: boolean }[];
}

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

import { fountainHouse, springWall, tieredFountain } from '../render/fountain-models';
import { type DesignOption, withoutAndWithWorkers } from './options';

export const FOUNTAIN_OPTIONS: DesignOption[] = [
  { name: 'A · Fountain house', build: () => fountainHouse(true), variants: withoutAndWithWorkers(fountainHouse) },
  { name: 'B · Tiered basin', build: () => tieredFountain(true), variants: withoutAndWithWorkers(tieredFountain) },
  { name: 'C · Spring wall', build: () => springWall(true), variants: withoutAndWithWorkers(springWall) },
];

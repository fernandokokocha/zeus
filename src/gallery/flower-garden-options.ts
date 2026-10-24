import { bakedOnce } from '../render/bake';
import { fourBeds, lemonTerrace, pergolaWalk } from '../render/flower-garden-models';
import type { DesignOption } from './options';

export const FLOWER_GARDEN_OPTIONS: DesignOption[] = [
  { name: 'A · Four beds', build: bakedOnce(fourBeds) },
  { name: 'B · Pergola walk', build: bakedOnce(pergolaWalk) },
  { name: 'C · Lemon terrace', build: bakedOnce(lemonTerrace) },
];

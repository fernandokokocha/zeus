import { bakedOnce } from '../render/bake';
import { cypressSquare, hermInARoseRing, planeTreeShade } from '../render/park-models';
import type { DesignOption } from './options';

export const PARK_OPTIONS: DesignOption[] = [
  { name: 'A · Cypress square', build: bakedOnce(cypressSquare) },
  { name: 'B · Herm in a rose ring', build: bakedOnce(hermInARoseRing) },
  { name: 'C · Plane tree shade', build: bakedOnce(planeTreeShade) },
];

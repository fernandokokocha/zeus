import { hasService } from './roamers';
import type { Building, Culture, GameState } from './state';

export const CULTURE_POINTS: Record<Culture, number> = { philosophy: 15, athletics: 20, drama: 25 };

const CULTURES = Object.keys(CULTURE_POINTS) as Culture[];

export const MAX_CULTURE_POINTS = CULTURES.reduce((sum, culture) => sum + CULTURE_POINTS[culture], 0);

export function culturesPassed(state: GameState, house: Building): Culture[] {
  return CULTURES.filter((culture) => hasService(state, house, culture));
}

export function culturePoints(state: GameState, house: Building): number {
  return culturesPassed(state, house).reduce((sum, culture) => sum + CULTURE_POINTS[culture], 0);
}

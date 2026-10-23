import type { Building } from '../sim/state';
import { bakedOnce } from './bake';
import type { FigureParts } from './kit/figure';
import { tileHash } from './palette';

const PHASE_SPREAD = 20;

export function bakedFigure(build: () => FigureParts): () => FigureParts {
  const legs = bakedOnce(() => build().legs);
  const torso = bakedOnce(() => build().torso);
  const head = bakedOnce(() => build().head);
  const arm = build().arm ? bakedOnce(() => build().arm!) : undefined;
  return () => ({ legs: legs(), torso: torso(), head: head(), arm: arm?.() });
}

export function staffPhase(building: Building): number {
  return tileHash(building.x, building.y) * PHASE_SPREAD;
}

import * as THREE from 'three';
import { COLORS, cone, cylinder, flat } from './kit';
import { type FigureParts, FIGURE, at, head, legs, rod, torso } from './figure';

const GUARD = { tunic: COLORS.aegean, shieldFace: 0xd9a441 };
const SPEAR_HAND = at(0.07, 0.0, 0.1);
const SHIELD_HAND = at(0.07, 0.03, -0.09);

export function guard(): FigureParts {
  const upper = torso(GUARD.tunic, [SPEAR_HAND, SHIELD_HAND]);
  upper.add(rod(at(0.07, -0.2, 0.1), at(0.07, 0.42, 0.1), 0.008, COLORS.timber));
  upper.add(cone(0.016, 0.06, flat(FIGURE.bronze), 0.07, 0.42, 0.1, 6));
  const shield = new THREE.Group();
  shield.add(cylinder(0.1, 0.1, 0.02, flat(FIGURE.bronze), 0, 0, 0, 16));
  shield.add(cylinder(0.075, 0.075, 0.024, flat(GUARD.shieldFace), 0, 0, 0, 16));
  shield.rotation.x = Math.PI / 2;
  shield.position.set(0.05, 0.02, -0.12);
  upper.add(shield);
  return { legs: legs(), torso: upper, head: head('helmet') };
}

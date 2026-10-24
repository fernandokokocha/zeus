import * as THREE from 'three';
import type { Building } from '../sim/state';
import { bakedOnce } from './bake';
import { variantIndexAt } from './palette';
import { FLOWER, bordered, bloomMass, lemonTreeInPot, pergola, raisedBed, stripedAlongX, tieredFountain, whiteTerrace } from './kit/flower-garden';
import { flowerPot } from './kit/garden';
import { cypress, statue } from './kit/luxury';
import { marbleStairs } from './kit/palace';
import { PARK_GROUND, clippedBush, gravelDisc, gravelPatch, marbleBench, parkLawnPlot } from './kit/park';

const PLOT = 2;
const PATH = 0.26;
const QUADRANT_BED = 0.62;
const QUADRANT_BED_HEIGHT = 0.07;
const TERRACE_TOP = 0.22;

export function fourBeds(): THREE.Object3D {
  const group = new THREE.Group();
  group.add(parkLawnPlot(PLOT, PLOT));
  group.add(gravelPatch(0.04, (PLOT - PATH) / 2, PLOT - 0.08, PATH));
  group.add(gravelPatch((PLOT - PATH) / 2, 0.04, PATH, PLOT - 0.08));
  group.add(gravelDisc(PLOT / 2, PLOT / 2, 0.36));
  const beds: [number, number, number, number][] = [
    [0.16, 0.16, FLOWER.red, FLOWER.yellow],
    [1.22, 0.16, FLOWER.violet, FLOWER.white],
    [0.16, 1.22, FLOWER.yellow, FLOWER.red],
    [1.22, 1.22, FLOWER.pink, FLOWER.violet],
  ];
  beds.forEach(([x0, z0, outer, inner], i) => {
    group.add(raisedBed(x0, z0, QUADRANT_BED, QUADRANT_BED, PARK_GROUND, QUADRANT_BED_HEIGHT, bordered(x0, z0, QUADRANT_BED, QUADRANT_BED, 0.2, outer, inner), i + 1));
  });
  group.add(tieredFountain(PLOT / 2, PLOT / 2, 0.26));
  for (const [x, z] of [[0.09, 0.09], [1.91, 0.09], [0.09, 1.91], [1.91, 1.91]]) group.add(cypress(x, z, 0.55));
  return group;
}

export function pergolaWalk(): THREE.Object3D {
  const group = new THREE.Group();
  group.add(parkLawnPlot(PLOT, PLOT));
  group.add(gravelPatch(0.04, 0.72, PLOT - 0.08, 0.56));
  const borderColours = [FLOWER.red, FLOWER.yellow, FLOWER.violet, FLOWER.white, FLOWER.pink];
  group.add(raisedBed(0.1, 0.1, 1.8, 0.52, PARK_GROUND, 0.06, stripedAlongX(0.1, 1.8, borderColours), 11));
  group.add(raisedBed(0.1, 1.38, 1.8, 0.52, PARK_GROUND, 0.06, stripedAlongX(0.1, 1.8, [...borderColours].reverse()), 12));
  group.add(pergola(0.24, 0.8, 1.76, 1.2, 0.55, [0.24, 0.75, 1.25, 1.76], 13));
  group.add(marbleBench(1.0, 1.0, 0.46));
  group.add(flowerPot(0.12, PARK_GROUND, 1.0, FLOWER.red), flowerPot(1.88, PARK_GROUND, 1.0, FLOWER.red));
  return group;
}

export function lemonTerrace(): THREE.Object3D {
  const group = new THREE.Group();
  group.add(parkLawnPlot(PLOT, PLOT));
  group.add(whiteTerrace(0.1, 0.1, 1.8, 0.85, TERRACE_TOP));
  const steps = 3;
  group.add(marbleStairs(1.0, 0.97, 0.4, steps, (TERRACE_TOP - PARK_GROUND) / steps, 0.07, PARK_GROUND));
  group.add(gravelPatch(0.8, 1.18, 0.4, 0.78));
  const hero = statue(1.0, 0.36);
  hero.position.y = TERRACE_TOP;
  hero.scale.setScalar(1.8);
  group.add(hero);
  [0.3, 0.62, 1.38, 1.7].forEach((x, i) => group.add(lemonTreeInPot(x, 0.5, TERRACE_TOP, 21 + i)));
  for (const x of [0.25, 1.75]) {
    const bush = clippedBush(x, 0.22, 0.07);
    bush.position.y = TERRACE_TOP - PARK_GROUND;
    group.add(bush);
  }
  const spill = stripedAlongX(0.14, 1.72, [FLOWER.pink, FLOWER.pink, FLOWER.white, FLOWER.pink, FLOWER.pink]);
  group.add(bloomMass(0.14, 0.78, 0.62, 0.12, TERRACE_TOP, spill, 22));
  group.add(bloomMass(1.24, 0.78, 0.62, 0.12, TERRACE_TOP, spill, 23));
  group.add(raisedBed(0.14, 1.12, 0.6, 0.38, PARK_GROUND, 0.13, () => FLOWER.red, 24));
  group.add(raisedBed(0.14, 1.5, 0.6, 0.38, PARK_GROUND, 0.06, () => FLOWER.yellow, 25));
  group.add(raisedBed(1.26, 1.12, 0.6, 0.38, PARK_GROUND, 0.13, () => FLOWER.violet, 26));
  group.add(raisedBed(1.26, 1.5, 0.6, 0.38, PARK_GROUND, 0.06, () => FLOWER.orange, 27));
  return group;
}

const GARDENS = [fourBeds, pergolaWalk, lemonTerrace].map((garden) => bakedOnce(garden));

export function flowerGardenModel(garden: Building): THREE.Object3D {
  return GARDENS[variantIndexAt(garden.x, garden.y, GARDENS.length)]();
}

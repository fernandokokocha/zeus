import * as THREE from 'three';
import { handcart, hideTent, journeyLoad, leanToHut, tripodPot } from './kit/camp';
import { blueDoor, poorCube, roughWall, tidyWalls, whiteCottage, windowHole } from './kit/cottage';
import { goat, grainBasket, hen, plankOnStones, raisedGranary, sack, threshingFloor } from './kit/food';
import {
  COLORS, basket, cylinder, flat, lotGround, path, scaled, shrubAt, sphere, surface, tippedJar, wattleFence, woodpile,
} from './kit/kit';
import { bucket, cistern, wateredBeds } from './kit/water';

export function hutModel(): THREE.Object3D {
  const group = new THREE.Group();
  group.add(lotGround());
  group.add(path([[0.55, 0.85], [0.9, 1.3], [1.0, 1.92]], 0.15));

  group.add(leanToHut(0.14, 0.14, 0.82, 0.64));
  group.add(hideTent(1.48, 0.5));
  group.add(tripodPot(0.95, 1.05));
  group.add(handcart(1.48, 1.42, -0.5, journeyLoad()));

  for (const [x, z, c] of [[1.12, 0.28, COLORS.hide], [1.06, 0.4, 0x8a6a45]]) group.add(scaled(sphere(0.07, flat(c), x, 0.09, z), 1.2, 0.75, 1));
  const bedroll = cylinder(0.04, 0.04, 0.24, surface('hide'), 0, 0, 0, 10);
  bedroll.rotation.z = Math.PI / 2;
  bedroll.position.set(1.8, 0.07, 1.0);
  group.add(bedroll);

  group.add(wattleFence([[0.1, 1.86], [0.1, 0.95]], 9));
  group.add(tippedJar(0.3, 1.25, 1.2));
  group.add(basket(0.45, 1.55, null));
  group.add(woodpile(0.3, 1.0, 0));
  group.add(shrubAt(1.85, 1.85, 0.9, 11), shrubAt(0.55, 1.85, 0.7, 12));
  return group;
}

export function shackModel(): THREE.Object3D {
  const group = new THREE.Group();
  group.add(lotGround());
  const x0 = 0.14;
  const z0 = 0.14;
  const w = 0.86;
  const d = 0.68;
  const front = z0 + d;
  group.add(poorCube(x0, z0, w, d, 0.5, 'whitewash'));
  group.add(blueDoor(x0 + 0.26, front, 0.08, 0.5));
  group.add(windowHole(x0 + 0.64, front, 0.3));
  group.add(path([[x0 + 0.26, front + 0.05], [0.42, 1.4], [0.46, 1.92]], 0.15));

  group.add(raisedGranary(1.55, 0.36));
  group.add(sack(1.25, 0.34, 0.4), sack(1.3, 0.5, 1.1));
  group.add(threshingFloor(1.34, 1.26, 0.36));
  group.add(grainBasket(1.12, 0.9));
  group.add(plankOnStones(0.3, 1.2, 1.4, 3));
  group.add(goat(1.72, 1.72, 2.6));
  group.add(cylinder(0.01, 0.01, 0.12, flat(COLORS.timber), 1.86, 0.03, 1.62, 4));
  group.add(hen(0.86, 1.58, 0.9));

  group.add(roughWall([[0.12, 1.88], [0.32, 1.88]], 580));
  group.add(roughWall([[0.6, 1.88], [1.88, 1.88]], 600));
  return group;
}

export function hovelModel(): THREE.Object3D {
  const group = new THREE.Group();
  group.add(lotGround());
  group.add(whiteCottage(0.14, 0.14, 0.9, 0.7, 0.26, 0.68));
  group.add(poorCube(1.1, 0.14, 0.56, 0.5, 0.42, 'whitewash'));
  group.add(windowHole(1.38, 0.64, 0.24));
  group.add(path([[0.4, 0.88], [0.44, 1.4], [0.48, 1.92]], 0.15));

  group.add(cistern(1.5, 0.96, 0.46, 0.34));
  group.add(bucket(1.2, 0.03, 0.9, true), bucket(1.24, 0.03, 1.02, false));
  group.add(wateredBeds(0.7, 1.26, 0.56, 3));

  group.add(threshingFloor(1.5, 1.52, 0.24));
  group.add(raisedGranary(1.78, 0.48));
  group.add(sack(1.82, 0.76, 0.4));
  group.add(plankOnStones(0.24, 1.2, 1.4, 3));
  group.add(goat(0.3, 1.7, 0.4));
  group.add(tidyWalls(0.32, 0.6, 1.2));
  return group;
}

import * as THREE from 'three';
import {
  COLORS, basket, box, campfire, cone, cylinder, flat, jar, lotGround, log, path, shrubAt, stone,
  stoneRing, surface, tippedJar, wattleFence, woodpile,
} from '../render/kit/kit';
import { blueDoor, brushwood, cube, doorway, frontWindow, gatePost, pergola, sideWindow, steppingStones, stoneWall } from '../render/kit/cottage';
import { domeOven } from '../render/kit/food';
import { hutModel } from '../render/house-models';
import type { DesignOption } from './options';

function roundHut(): THREE.Object3D {
  const group = new THREE.Group();
  group.add(lotGround());
  const cx = 0.72;
  const cz = 0.72;
  const wallTop = 0.43;
  group.add(path([[cx + 0.42, cz + 0.42], [1.25, 1.45], [1.35, 1.92]], 0.16));
  group.add(stoneRing(cx, cz, 0.47, 26, 0.045, 10));
  group.add(cylinder(0.44, 0.46, wallTop - 0.03, surface('mudBrick'), cx, 0.03, cz, 28));
  group.add(cylinder(0.445, 0.445, 0.07, surface('whitewash'), cx, wallTop - 0.1, cz, 28));
  group.add(cylinder(0.448, 0.448, 0.022, flat(COLORS.aegean), cx, wallTop - 0.125, cz, 28));
  group.add(cone(0.62, 0.34, surface('thatch'), cx, wallTop - 0.02, cz, 24));
  group.add(cone(0.46, 0.3, surface('thatch'), cx, wallTop + 0.11, cz, 22));
  group.add(cone(0.28, 0.24, surface('thatch'), cx, wallTop + 0.25, cz, 18));
  group.add(cylinder(0.05, 0.06, 0.05, flat(0x7a5a2e), cx, wallTop + 0.42, cz, 8));
  group.add(cylinder(0.012, 0.012, 0.16, flat(COLORS.timber), cx, wallTop + 0.42, cz, 5));

  const door = doorway(0.18, 0.28, 0.9);
  const facing = Math.PI / 4;
  door.position.set(cx + Math.sin(facing) * 0.44, 0.03, cz + Math.cos(facing) * 0.44);
  door.rotation.y = facing;
  group.add(door);
  group.add(stone(0.07, cx + Math.sin(facing) * 0.56, 0.03, cz + Math.cos(facing) * 0.56, 77, 0xb8ad9a));
  for (const a of [-0.9, 2.1]) {
    group.add(box(0.06, 0.05, 0.03, flat(COLORS.dark), cx + Math.sin(a) * 0.445, wallTop - 0.2, cz + Math.cos(a) * 0.445).rotateY(a));
  }

  group.add(wattleFence([[0.14, 1.3], [0.14, 0.14], [1.86, 0.14], [1.86, 0.85]], 3));
  group.add(campfire(1.48, 0.55, true));
  group.add(stone(0.05, 1.32, 0.05, 0.62, 31), stone(0.05, 1.62, 0.05, 0.72, 32));
  group.add(woodpile(0.35, 1.6, 0.2));
  group.add(tippedJar(1.6, 1.3, 0.6));
  group.add(basket(1.75, 1.55, null));
  group.add(jar(1.72, 0.03, 1.15, 0.8));

  for (const x of [1.55, 1.85]) group.add(cylinder(0.014, 0.016, 0.34, flat(COLORS.timber), x, 0.03, 1.0, 5));
  group.add(log(0.34, 0.01, 1.7, 0.36, 1.0, 0));
  const hide = box(0.24, 0.2, 0.012, surface('hide'), 1.7, 0.17, 1.0);
  group.add(hide);
  group.add(shrubAt(1.82, 1.84, 1, 4), shrubAt(0.22, 0.24, 0.8, 5));
  return group;
}

function cottage(): THREE.Object3D {
  const group = new THREE.Group();
  group.add(lotGround());
  const x0 = 0.18;
  const z0 = 0.18;
  const w = 1.08;
  const d = 0.82;
  const wallTop = 0.58;
  const front = z0 + d;
  const right = x0 + w;

  group.add(cube(x0, z0, w, d, wallTop));
  group.add(blueDoor(x0 + 0.3, front));
  group.add(frontWindow(x0 + 0.82, front));
  group.add(sideWindow(right, z0 + d / 2 - 0.1));
  group.add(box(0.36, 0.08, 0.1, surface('whitewash'), x0 + 0.72, 0.03, front + 0.07));

  group.add(box(0.32, 0.012, 0.22, surface('thatch'), x0 + 0.35, wallTop + 0.055, z0 + 0.3));
  group.add(stone(0.03, x0 + 0.2, wallTop + 0.075, z0 + 0.22, 61), stone(0.03, x0 + 0.5, wallTop + 0.075, z0 + 0.38, 62));
  group.add(jar(x0 + 0.85, wallTop + 0.055, z0 + 0.22, 0.75));

  const px0 = right + 0.12;
  const px1 = 1.86;
  const pz0 = 0.22;
  const pz1 = 0.95;
  group.add(pergola(px0, px1, pz0, pz1, brushwood));
  group.add(domeOven(px0 + 0.22, pz0 + 0.25, false));
  group.add(basket(px1 - 0.15, pz1 - 0.2, null));
  group.add(tippedJar(px0 + 0.1, pz1 - 0.12, 2.6));
  group.add(woodpile(px1 - 0.12, pz0 + 0.45, Math.PI / 2));

  group.add(stoneWall(0.12, 1.88, 0.5, 1.88, 0.14));
  group.add(stoneWall(0.78, 1.88, 1.88, 1.88, 0.14));
  group.add(stoneWall(1.88, 1.1, 1.88, 1.88, 0.14));
  group.add(gatePost(0.5, 1.88), gatePost(0.78, 1.88));
  group.add(steppingStones([[0.48, 1.18], [0.55, 1.42], [0.62, 1.66]], 81));
  group.add(shrubAt(1.5, 1.5, 1.1, 7), shrubAt(0.25, 1.6, 0.8, 8));
  return group;
}

export const HUT_OPTIONS: DesignOption[] = [
  {
    name: 'A · Round thatched hut',
    notes: [
      'Mud-brick tholos on a fieldstone ring, three-tier straw roof',
      'Whitewash band with an Aegean-blue stripe, blue door left ajar',
      'Smoking hearth, woodpile, a hide drying on a rack',
      'An empty jar lying on its side and an empty basket: no food, no water yet',
    ],
    build: roundHut,
  },
  {
    name: 'B · Whitewashed stone cottage',
    notes: [
      'Cycladic cube: rubble plinth, lime-washed walls, flat earth roof with beam ends',
      'Blue door and open blue shutters, whitewashed bench by the door',
      'Brushwood pergola over a cold clay oven',
      'Yard walls with whitewash coping; empty jar and basket under the pergola',
    ],
    build: cottage,
  },
  {
    name: 'C · Settlers’ camp',
    notes: [
      'Newly arrived family: a lean-to mud hut plus a striped hide tent',
      'Cook-pot on a tripod over the fire, bedroll and bundles',
      'Handcart still loaded from the journey',
      'Empty jar and basket: nothing to eat or drink stored yet',
    ],
    build: hutModel,
  },
];

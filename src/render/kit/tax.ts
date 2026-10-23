import * as THREE from 'three';
import { type FigureParts, at, head, legs, rod, torso } from './figure';
import { COLORS, box, cylinder, flat, scaled, sphere, surface } from './kit';
import { PALACE, polishedGold, sparkle } from './palace';

export const TAX = {
  tunic: 0x1d4e8c,
  wax: 0x3a3226,
  bronze: 0xb08040,
  iron: 0x4a4c50,
  chest: 0x5a3a20,
  plank: 0xa07a4a,
};

const BASE = 0.03;
const COIN = 0.012;

export function coinStack(x: number, y: number, z: number, coins: number): THREE.Mesh {
  return cylinder(0.026, 0.026, COIN * coins, polishedGold, x, y, z, 10);
}

const HEAP_COINS = [[-0.08, 0.035, 0.03, 0.4], [0.02, 0.06, -0.01, -0.3], [0.09, 0.03, 0.04, 0.6], [-0.02, 0.05, 0.05, 0.2]];
const SPILLED_COINS = [[0.06, 0.14, 0.1], [0.14, 0.13, 0.05], [-0.04, 0.16, 0.0], [0.2, 0.06, 0.08]];

function looseCoin(x: number, y: number, z: number, tilt: number): THREE.Mesh {
  const coin = cylinder(0.026, 0.026, 0.008, polishedGold, 0, 0, 0, 12);
  coin.position.set(x, y, z);
  coin.rotation.set(tilt, tilt * 2, tilt * 0.5);
  return coin;
}

export function strongbox(x: number, z: number, open: boolean, turn = 0, size = 1): THREE.Object3D {
  const group = new THREE.Group();
  const [w, h, d] = [0.28, 0.15, 0.18];
  group.add(box(w, h, d, flat(TAX.chest), 0, BASE, 0));
  for (const dx of [-0.09, 0.09]) group.add(box(0.025, h + 0.005, d + 0.01, flat(TAX.iron), dx, BASE, 0));
  if (open) {
    group.add(scaled(sphere(1, polishedGold, 0, BASE + h, 0), w * 0.5, 0.075, d * 0.46));
    HEAP_COINS.forEach(([cx, cy, cz, tilt]) => group.add(looseCoin(cx, BASE + h + cy, cz, tilt)));
    SPILLED_COINS.forEach(([cx, cz, tilt]) => group.add(looseCoin(cx, BASE + 0.008, cz, tilt)));
    group.add(coinStack(-w / 2 - 0.06, BASE, d / 2 + 0.02, 4));
    for (const [sx, sy, sz] of [[-0.06, 0.07, 0.02], [0.07, 0.05, -0.01], [0.13, 0.0, 0.11]]) group.add(sparkle(sx, BASE + h + sy, sz, 0.018));
    const lid = new THREE.Group();
    lid.add(box(w, 0.025, d, flat(TAX.chest), 0, 0, -d / 2));
    lid.position.set(0, BASE + h, -d / 2);
    lid.rotation.x = -1.3;
    group.add(lid);
  } else {
    group.add(box(w + 0.01, 0.035, d + 0.01, flat(TAX.chest), 0, BASE + h, 0));
    group.add(box(0.04, 0.05, 0.01, flat(TAX.iron), 0, BASE + h - 0.03, d / 2 + 0.005));
  }
  group.position.set(x, 0, z);
  group.rotation.y = turn;
  group.scale.setScalar(size);
  return group;
}

export function balanceScale(x: number, y: number, z: number): THREE.Object3D {
  const group = new THREE.Group();
  const bronze = TAX.bronze;
  group.add(cylinder(0.03, 0.035, 0.012, flat(bronze), x, y, z, 10));
  group.add(rod(at(x, y, z), at(x, y + 0.16, z), 0.006, bronze));
  group.add(rod(at(x - 0.1, y + 0.16, z), at(x + 0.1, y + 0.16, z), 0.005, bronze));
  for (const side of [-1, 1]) {
    group.add(rod(at(x + side * 0.1, y + 0.16, z), at(x + side * 0.1, y + 0.07, z), 0.002, bronze));
    group.add(cylinder(0.04, 0.025, 0.012, flat(bronze), x + side * 0.1, y + 0.06, z, 10));
  }
  group.add(coinStack(x - 0.1, y + 0.072, z, 2));
  return group;
}

export const TABLE_TOP = 0.24;

export function countingTable(x: number, z: number, w: number, counting: boolean): THREE.Object3D {
  const group = new THREE.Group();
  for (const dx of [-w / 2 + 0.04, w / 2 - 0.04]) group.add(box(0.04, TABLE_TOP - BASE, 0.18, flat(COLORS.timber), x + dx, BASE, z));
  group.add(box(w, 0.03, 0.24, flat(TAX.plank), x, TABLE_TOP, z));
  if (!counting) return group;
  const top = TABLE_TOP + 0.03;
  group.add(balanceScale(x - w / 2 + 0.15, top, z - 0.03));
  [[0.02, 4], [0.08, 6], [0.14, 3]].forEach(([dx, coins]) => group.add(coinStack(x + dx, top, z + 0.05, coins)));
  group.add(box(0.12, 0.012, 0.09, flat(TAX.wax), x + w / 2 - 0.1, top, z - 0.04));
  return group;
}

export function taxStele(x: number, z: number): THREE.Object3D {
  const group = new THREE.Group();
  group.add(box(0.2, 0.06, 0.12, surface('rubble'), x, BASE, z));
  group.add(box(0.15, 0.4, 0.05, flat(PALACE.marble), x, BASE + 0.06, z));
  group.add(box(0.17, 0.03, 0.06, flat(COLORS.aegean), x, BASE + 0.46, z));
  for (let i = 0; i < 5; i++) group.add(box(0.1 - (i % 2) * 0.02, 0.008, 0.005, flat(TAX.wax), x, BASE + 0.14 + i * 0.05, z + 0.027));
  return group;
}

export function awning(x0: number, z0: number, x1: number, z1: number, high: number, low: number): THREE.Object3D {
  const group = new THREE.Group();
  for (const [x, z, h] of [[x0, z0, high], [x1, z0, high], [x0, z1, low], [x1, z1, low]]) {
    group.add(cylinder(0.016, 0.018, h - BASE, flat(COLORS.timber), x, BASE, z, 6));
  }
  const length = Math.hypot(z1 - z0, high - low) + 0.06;
  const pitch = Math.atan2(high - low, z1 - z0);
  const stripes = 6;
  const width = (x1 - x0 + 0.08) / stripes;
  for (let i = 0; i < stripes; i++) {
    const stripe = box(width, 0.015, length, flat(i % 2 ? COLORS.whitewash : COLORS.aegean), 0, 0, 0);
    stripe.position.set(x0 - 0.04 + width * (i + 0.5), (high + low) / 2, (z0 + z1) / 2);
    stripe.rotation.x = pitch;
    group.add(stripe);
  }
  return group;
}

export function ironDoor(x: number, front: number, base: number): THREE.Object3D {
  const group = new THREE.Group();
  group.add(box(0.26, 0.4, 0.02, flat(TAX.chest), x, base, front + 0.01));
  for (const y of [0.08, 0.2, 0.32]) group.add(box(0.27, 0.025, 0.025, flat(TAX.iron), x, base + y, front + 0.02));
  group.add(box(0.34, 0.05, 0.03, flat(COLORS.deepAegean), x, base + 0.4, front + 0.015));
  for (const side of [-1, 1]) group.add(box(0.04, 0.45, 0.03, flat(COLORS.deepAegean), x + side * 0.15, base, front + 0.015));
  return group;
}

export function barredWindow(x: number, front: number, sill: number): THREE.Object3D {
  const group = new THREE.Group();
  group.add(box(0.12, 0.08, 0.02, flat(COLORS.dark), x, sill, front + 0.005));
  for (const dx of [-0.03, 0, 0.03]) group.add(box(0.01, 0.08, 0.01, flat(TAX.iron), x + dx, sill, front + 0.02));
  return group;
}

export function clerk(): FigureParts {
  const hands = [at(0.1, 0.05, 0.04), at(0.1, 0.07, -0.05)];
  const upper = torso(TAX.tunic, hands);
  const tablet = box(0.015, 0.1, 0.14, flat(TAX.plank), 0.115, 0.02, -0.005);
  tablet.rotation.z = 0.5;
  upper.add(tablet);
  return { legs: legs(), torso: upper, head: head('bare') };
}

import * as THREE from 'three';
import { type FigureParts, at, head, legs, torso } from './figure';
import { CLOTH, clothBolt } from './cloth';
import { FOOD, loaf, sack } from './food';
import { COLORS, box, cylinder, flat, scaled, sphere } from './kit';
import { amphora } from './oil';
import { polishedGold, sparkle } from './palace';

export type Good = 'food' | 'fleece' | 'oil' | 'cloth';

export const MARKET = {
  trim: { food: 0xc0643b, fleece: COLORS.aegean, oil: 0x7f8f2e, cloth: CLOTH.dyed } as Record<Good, number>,
  linen: 0xe6d6ae,
  tunic: COLORS.deepAegean,
  plank: 0xa07a4a,
  wicker: 0xb08a4a,
  fleece: 0xeee4cb,
  oil: 0xc9a83a,
  olive: 0x4a4a2a,
  produce: { pomegranate: 0xb8322a, orange: 0xe08a2a, fig: FOOD.fig, greens: 0x6f9a3a, grain: FOOD.wheat },
};

const BASE = 0.03;
const PILE_SPACING = 0.15;

export function seller(): FigureParts {
  return { legs: legs(), torso: torso(MARKET.tunic, [at(0.11, 0.0, 0.07), at(0.11, 0.0, -0.07)]), head: head('bare') };
}

function fleeceBundle(x: number, z: number, turn: number): THREE.Object3D {
  const group = new THREE.Group();
  const roll = cylinder(0.06, 0.06, 0.16, flat(MARKET.fleece), 0, 0, 0, 10);
  roll.rotation.z = Math.PI / 2;
  roll.position.y = BASE + 0.06;
  group.add(roll);
  group.add(box(0.02, 0.125, 0.125, flat(COLORS.timber), 0, BASE, 0));
  group.position.set(x, 0, z);
  group.rotation.y = turn;
  return group;
}

function storedLoad(good: Good, x: number, z: number, i: number): THREE.Object3D {
  const turn = (i % 3) * 0.4 - 0.3;
  if (good === 'food') return sack(x, z, turn);
  if (good === 'fleece') return fleeceBundle(x, z, turn);
  if (good === 'cloth') return clothBolt(x, BASE, z, turn);
  return amphora(x, z);
}

export function stockPile(good: Good, x0: number, z0: number, loads: number, rows: number): THREE.Object3D {
  const group = new THREE.Group();
  for (let i = 0; i < loads; i++) {
    group.add(storedLoad(good, x0 + Math.floor(i / rows) * PILE_SPACING, z0 + (i % rows) * PILE_SPACING, i));
  }
  return group;
}

export function wickerBasket(x: number, z: number, filling: number, y = BASE): THREE.Object3D {
  const group = new THREE.Group();
  group.add(cylinder(0.08, 0.06, 0.09, flat(MARKET.wicker), x, y, z, 12));
  group.add(scaled(sphere(0.072, flat(filling), x, y + 0.09, z), 1, 0.45, 1));
  return group;
}

function heap(x: number, y: number, z: number, w: number, d: number, color: number): THREE.Object3D {
  const group = new THREE.Group();
  group.add(scaled(sphere(0.5, flat(color), x, y, z), w, 0.09, d));
  for (const [dx, dz] of [[-0.25, -0.2], [0.2, -0.25], [0, 0.22], [-0.2, 0.25], [0.25, 0.15]]) {
    group.add(sphere(0.022, flat(color), x + dx * w, y + 0.03, z + dz * d));
  }
  return group;
}

const FOLDED_CLOTH = [CLOTH.dyed, COLORS.aegean, CLOTH.band, 0xf2efe6];

const TIERS = [0.3, 0.22, 0.14];
const TIER_DEPTH = 0.13;

function tierTops(x: number): [number, number][] {
  return TIERS.map((h, i) => [x - TIER_DEPTH + i * TIER_DEPTH, BASE + h]);
}

export function tieredStand(x: number, z0: number, z1: number): THREE.Object3D {
  const group = new THREE.Group();
  const length = z1 - z0;
  for (const [tx, top] of tierTops(x)) group.add(box(TIER_DEPTH, top - BASE, length, flat(MARKET.plank), tx, BASE, (z0 + z1) / 2));
  for (const z of [z0 + 0.03, z1 - 0.03]) group.add(box(TIER_DEPTH * 3, 0.32, 0.03, flat(COLORS.timber), x, BASE, z));
  return group;
}

export function standGoods(good: Good, x: number, z0: number, z1: number): THREE.Object3D {
  const group = new THREE.Group();
  const slots = Math.floor((z1 - z0) / 0.2);
  const slotZ = (i: number) => z0 + 0.1 + i * ((z1 - z0 - 0.2) / Math.max(1, slots - 1));
  tierTops(x).forEach(([tx, top], tier) => {
    for (let i = 0; i < slots; i++) {
      const z = slotZ(i);
      const k = tier * slots + i;
      if (good === 'food') {
        const colors = Object.values(MARKET.produce);
        if (tier === 0 && i % 2 === 0) for (const dz of [-0.04, 0.04]) group.add(loaf(tx, top, z + dz));
        else group.add(heap(tx, top + 0.01, z, 0.12, 0.17, colors[k % colors.length]));
      } else if (good === 'fleece') {
        for (let layer = 0; layer < 2; layer++) group.add(scaled(sphere(0.5, flat(MARKET.fleece), tx, top + 0.025 + layer * 0.04, z), 0.11, 0.06, 0.15));
      } else if (good === 'cloth') {
        for (let layer = 0; layer < 3; layer++) group.add(box(0.11, 0.022, 0.15, flat(FOLDED_CLOTH[(k + layer) % FOLDED_CLOTH.length]), tx, top + layer * 0.022, z));
      } else if (tier === 0) {
        group.add(scaled(amphora(0, 0), 0.6, 0.6, 0.6).translateX(tx).translateY(top - BASE).translateZ(z));
      } else {
        group.add(cylinder(0.05, 0.04, 0.05, flat(0xb0603a), tx, top, z, 10));
        group.add(cylinder(0.045, 0.045, 0.004, flat(tier === 1 ? MARKET.oil : MARKET.olive), tx, top + 0.05, z, 10));
      }
    }
  });
  return group;
}

export function frontBaskets(good: Good, x: number, zs: number[]): THREE.Object3D {
  const group = new THREE.Group();
  const fillings: Record<Good, number[]> = {
    food: [MARKET.produce.orange, MARKET.produce.greens, MARKET.produce.grain, MARKET.produce.pomegranate],
    fleece: [MARKET.fleece],
    oil: [MARKET.olive, 0x6a7a3a, MARKET.olive],
    cloth: [CLOTH.dyed, CLOTH.band],
  };
  zs.forEach((z, i) => group.add(wickerBasket(x, z, fillings[good][i % fillings[good].length])));
  return group;
}

const cloths = new Map<number, THREE.Material>();
const STRIPES = 9;
const STRIP_SEGMENTS = 3;
const STRIPE_TINTS = [0.3, 0.6];
const SAG = { ridge: 0.04, eaves: 0.07, belly: 0.03, wrinkle: 0.01 };
const OVERHANG = { out: 0.08, drop: 0.04 };
const SCALLOP = 0.045;

function cloth(color: number): THREE.Material {
  if (!cloths.has(color)) cloths.set(color, new THREE.MeshLambertMaterial({ color, side: THREE.DoubleSide }));
  return cloths.get(color)!;
}

function clothHeight(u: number, v: number, eaves: number, ridge: number): number {
  const along = Math.sin(Math.PI * v);
  const wrinkle = SAG.wrinkle * Math.sin(v * Math.PI * 9) * (1 - u);
  return eaves + (ridge - eaves) * u - along * (SAG.ridge * u + SAG.eaves * (1 - u)) - SAG.belly * Math.sin(Math.PI * u) + wrinkle;
}

function clothStrip(eaveX: number, ridgeX: number, eaves: number, ridge: number, z0: number, z1: number, v0: number, v1: number, material: THREE.Material): THREE.Mesh {
  const [nu, nv] = [6, STRIP_SEGMENTS];
  const positions: number[] = [];
  for (let j = 0; j <= nv; j++) {
    for (let i = 0; i <= nu; i++) {
      const [u, v] = [i / nu, v0 + ((v1 - v0) * j) / nv];
      positions.push(eaveX + (ridgeX - eaveX) * u, clothHeight(u, v, eaves, ridge), z0 + (z1 - z0) * v);
    }
  }
  const index: number[] = [];
  for (let j = 0; j < nv; j++) {
    for (let i = 0; i < nu; i++) {
      const a = j * (nu + 1) + i;
      index.push(a, a + nu + 1, a + 1, a + 1, a + nu + 1, a + nu + 2);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(index);
  geometry.computeVertexNormals();
  return new THREE.Mesh(geometry, material);
}

function clothSlope(eaveX: number, ridgeX: number, eaves: number, ridge: number, z0: number, z1: number, trim: number): THREE.Object3D {
  const group = new THREE.Group();
  const [light, dark] = STRIPE_TINTS.map((tint) => cloth(new THREE.Color(MARKET.linen).lerp(new THREE.Color(trim), tint).getHex()));
  for (let k = 0; k < STRIPES; k++) {
    group.add(clothStrip(eaveX, ridgeX, eaves, ridge, z0, z1, k / STRIPES, (k + 1) / STRIPES, k % 2 ? dark : light));
  }
  return group;
}

function scallops(x: number, eaves: number, z0: number, z1: number, trim: number): THREE.Object3D {
  const group = new THREE.Group();
  const count = Math.round((z1 - z0) / (SCALLOP * 2));
  for (let k = 0; k < count; k++) {
    const v = (k + 0.5) / count;
    const flap = new THREE.Mesh(new THREE.CircleGeometry(SCALLOP, 8, Math.PI, Math.PI), cloth(trim));
    flap.rotation.y = Math.PI / 2;
    flap.position.set(x, clothHeight(0, v, eaves, eaves) + 0.005, z0 + (z1 - z0) * v);
    group.add(flap);
  }
  return group;
}

export function clothTent(x0: number, z0: number, x1: number, z1: number, eaves: number, ridge: number, trim: number): THREE.Object3D {
  const group = new THREE.Group();
  const cx = (x0 + x1) / 2;
  const [cz0, cz1] = [z0 - 0.06, z1 + 0.06];
  for (const eaveX of [x0 - OVERHANG.out, x1 + OVERHANG.out]) {
    group.add(clothSlope(eaveX, cx, eaves - OVERHANG.drop, ridge, cz0, cz1, trim));
    group.add(scallops(eaveX, eaves - OVERHANG.drop, cz0, cz1, trim));
  }
  for (const [x, h] of [[x0, eaves], [x1, eaves], [cx, ridge]]) {
    for (const z of [z0, z1]) group.add(cylinder(0.016, 0.018, h - BASE, flat(COLORS.timber), x, BASE, z, 6));
  }
  return group;
}

function facingX(mesh: THREE.Mesh, x: number, y: number, z: number): THREE.Mesh {
  mesh.rotation.z = Math.PI / 2;
  mesh.position.set(x, y, z);
  return mesh;
}

function emblemSymbol(good: Good, x: number, y: number, z: number, r: number): THREE.Object3D {
  const group = new THREE.Group();
  if (good === 'food') {
    const bowl = new THREE.Mesh(new THREE.SphereGeometry(r * 0.72, 18, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), polishedGold);
    bowl.scale.set(0.35, 0.7, 1);
    bowl.position.set(x, y - r * 0.05, z);
    group.add(bowl);
    group.add(box(r * 0.2, r * 0.08, r * 1.5, polishedGold, x, y - r * 0.08, z));
    group.add(box(r * 0.2, r * 0.1, r * 0.5, polishedGold, x, y - r * 0.56, z));
    for (const [dy, dz, size, color] of [
      [0.12, -0.38, 0.2, MARKET.produce.orange], [0.16, 0, 0.24, MARKET.produce.fig], [0.12, 0.38, 0.2, MARKET.produce.greens],
      [0.38, -0.18, 0.18, MARKET.produce.greens], [0.4, 0.2, 0.18, MARKET.produce.orange],
    ]) {
      group.add(scaled(sphere(r * size, flat(color), x, y + r * dy, z + r * dz), 0.5, 1, 1));
    }
  } else if (good === 'fleece') {
    for (const [dy, dz] of [[0, 0], [0.22, -0.22], [0.22, 0.22], [-0.22, -0.2], [-0.22, 0.2], [0.05, -0.38], [0.05, 0.38]]) {
      group.add(sphere(r * 0.2, flat(MARKET.fleece), x, y + dy * r, z + dz * r));
    }
  } else if (good === 'cloth') {
    for (const dy of [-0.32, 0, 0.32]) {
      const bolt = cylinder(r * 0.15, r * 0.15, r * 1.1, flat(CLOTH.dyed), 0, 0, 0, 12);
      bolt.rotation.x = Math.PI / 2;
      bolt.position.set(x, y + dy * r, z);
      group.add(bolt);
    }
  } else {
    const jarShape = amphora(0, 0, 0);
    jarShape.traverse((node) => node instanceof THREE.Mesh && (node.material = polishedGold));
    jarShape.scale.set(r, r * 3.2, r * 3.2);
    jarShape.position.set(x, y - r * 0.55, z);
    group.add(jarShape);
  }
  return group;
}

export function emblem(good: Good, x: number, y: number, z: number, r: number): THREE.Object3D {
  const group = new THREE.Group();
  group.add(box(0.04, y - BASE, 0.04, flat(COLORS.timber), x - r * 0.15, BASE, z));
  group.add(facingX(cylinder(r, r, r * 0.12, flat(MARKET.trim[good]), 0, 0, 0, 24), x, y, z));
  const rim = new THREE.Mesh(new THREE.TorusGeometry(r, r * 0.11, 8, 28), polishedGold);
  rim.rotation.y = Math.PI / 2;
  rim.position.set(x + r * 0.03, y, z);
  group.add(rim);
  group.add(emblemSymbol(good, x + r * 0.12, y, z, r * 0.8));
  group.add(sparkle(x + r * 0.15, y + r * 0.7, z - r * 0.6, r * 0.14));
  return group;
}

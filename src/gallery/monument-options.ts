import * as THREE from 'three';
import { at, rod } from '../render/kit/figure';
import { COLORS, box, cone, cylinder, flat, surface } from '../render/kit/kit';
import { CROWDED_CITY, type Emblem, TRADE_ROUTE, friezeAround, monumentSteps } from '../render/kit/monument';
import { PALACE, entablature, evenly, marbleColumn, marbleStairs, palaceGround, polishedGold } from '../render/kit/palace';
import { SCULPTURE } from '../render/kit/sculpture';
import { fastRoadMeshes } from '../render/road-looks';
import { newGameState } from '../sim/state';
import type { Terrain } from '../sim/terrain';
import type { DesignOption } from './options';

const SIZE = 3;
const C = SIZE / 2;
const APRON = 0.03;
const FRIEZE = 0.32;

function crowned(emblem: Emblem, x: number, y: number, z: number, scale: number): THREE.Object3D {
  const crown = emblem.crown();
  crown.position.set(x, y, z);
  crown.scale.setScalar(scale);
  return crown;
}

function moulding(w: number, d: number, y: number): THREE.Group {
  const g = new THREE.Group();
  g.add(box(w + 0.06, 0.04, d + 0.06, flat(PALACE.marble), C, y, C));
  g.add(box(w + 0.1, 0.035, d + 0.1, flat(COLORS.aegean), C, y + 0.04, C));
  g.add(box(w + 0.14, 0.05, d + 0.14, flat(PALACE.marble), C, y + 0.075, C));
  return g;
}

function pedestal(emblem: Emblem, w: number, d: number, base: number, height: number): { pedestal: THREE.Group; top: number } {
  const g = new THREE.Group();
  g.add(box(w + 0.12, 0.08, d + 0.12, flat(PALACE.marble), C, base, C));
  g.add(box(w, height - 0.08, d, surface('whitewash'), C, base + 0.08, C));
  g.add(friezeAround(emblem, C, C, w, d, base + height - FRIEZE - 0.04, FRIEZE));
  g.add(moulding(w, d, base + height));
  return { pedestal: g, top: base + height + 0.125 };
}

function tripod(x: number, z: number, base: number): THREE.Group {
  const g = new THREE.Group();
  const height = 0.42;
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    g.add(rod(at(x + Math.cos(a) * 0.09, base, z + Math.sin(a) * 0.09), at(x + Math.cos(a) * 0.05, base + height, z + Math.sin(a) * 0.05), 0.012, SCULPTURE.bronze));
  }
  g.add(cylinder(0.1, 0.05, 0.08, polishedGold, x, base + height - 0.02, z, 12));
  for (const side of [-1, 1]) {
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.008, 5, 10), polishedGold);
    handle.position.set(x + side * 0.08, base + height + 0.08, z);
    g.add(handle);
  }
  return g;
}

function victoryStatue(emblem: Emblem): THREE.Object3D {
  const g = new THREE.Group();
  g.add(palaceGround(SIZE, SIZE));
  const { steps, top } = monumentSteps(C, C, [2.85, 2.6, 2.35], 0.07, APRON);
  g.add(steps);
  const { pedestal: base, top: crown } = pedestal(emblem, 1.5, 1.5, top, 0.9);
  g.add(base);
  g.add(crowned(emblem, C, crown, C, 2.2));
  for (const dx of [-1, 1]) for (const dz of [-1, 1]) g.add(tripod(C + dx * 1.0, C + dz * 1.0, top));
  return g;
}

const LYSICRATES = { podium: 1.5, drum: 0.5, columns: 8 };

function choregic(emblem: Emblem): THREE.Object3D {
  const g = new THREE.Group();
  g.add(palaceGround(SIZE, SIZE));
  const { steps, top } = monumentSteps(C, C, [2.8, 2.5], 0.08, APRON);
  g.add(steps);
  const { pedestal: podium, top: podiumTop } = pedestal(emblem, LYSICRATES.podium, LYSICRATES.podium, top, 0.75);
  g.add(podium);
  const drumHeight = 0.75;
  g.add(cylinder(LYSICRATES.drum, LYSICRATES.drum, drumHeight, surface('whitewash'), C, podiumTop, C, 24));
  for (let i = 0; i < LYSICRATES.columns; i++) {
    const a = (i / LYSICRATES.columns) * Math.PI * 2;
    const x = C + Math.cos(a) * (LYSICRATES.drum + 0.04);
    const z = C + Math.sin(a) * (LYSICRATES.drum + 0.04);
    g.add(cylinder(0.055, 0.065, drumHeight - 0.08, flat(PALACE.marble), x, podiumTop, z, 10));
    g.add(cylinder(0.085, 0.06, 0.08, flat(PALACE.gold), x, podiumTop + drumHeight - 0.08, z, 10));
  }
  const eaves = podiumTop + drumHeight;
  g.add(cylinder(LYSICRATES.drum + 0.12, LYSICRATES.drum + 0.12, 0.06, flat(PALACE.marble), C, eaves, C, 24));
  g.add(cylinder(LYSICRATES.drum + 0.125, LYSICRATES.drum + 0.125, 0.05, flat(COLORS.aegean), C, eaves + 0.06, C, 24));
  g.add(cylinder(LYSICRATES.drum + 0.15, LYSICRATES.drum + 0.15, 0.05, flat(PALACE.marble), C, eaves + 0.11, C, 24));
  g.add(cone(LYSICRATES.drum + 0.12, 0.22, flat(PALACE.marble), C, eaves + 0.16, C, 24));
  g.add(crowned(emblem, C, eaves + 0.3, C, 1.5));
  return g;
}

const MAUSOLEUM = { podium: 2.1, height: 0.75, colonnade: 1.8, columns: 4, columnHeight: 0.6, tiers: 6, tierRise: 0.07 };

function mausoleum(emblem: Emblem): THREE.Object3D {
  const g = new THREE.Group();
  g.add(palaceGround(SIZE, SIZE));
  const { steps, top } = monumentSteps(C, C, [2.8], 0.08, APRON);
  g.add(steps);
  const { pedestal: podium, top: floor } = pedestal(emblem, MAUSOLEUM.podium, MAUSOLEUM.podium, top, MAUSOLEUM.height);
  g.add(podium);
  const half = MAUSOLEUM.colonnade / 2;
  g.add(box(MAUSOLEUM.colonnade - 0.5, MAUSOLEUM.columnHeight, MAUSOLEUM.colonnade - 0.5, surface('whitewash'), C, floor, C));
  for (const x of evenly(C - half, C + half, MAUSOLEUM.columns)) {
    for (const z of evenly(C - half, C + half, MAUSOLEUM.columns)) {
      const onEdge = [x, z].some((v) => Math.abs(v - C) > half - 0.01);
      if (onEdge) g.add(marbleColumn(x, z, MAUSOLEUM.columnHeight, floor));
    }
  }
  const lintel = floor + MAUSOLEUM.columnHeight;
  const beam = MAUSOLEUM.colonnade + 0.2;
  g.add(entablature(C - beam / 2, C - beam / 2, beam, beam, lintel));
  const roofBase = lintel + 0.2;
  for (let i = 0; i < MAUSOLEUM.tiers; i++) {
    const side = beam - 0.05 - i * 0.24;
    g.add(box(side, MAUSOLEUM.tierRise, side, flat(i % 2 ? PALACE.marble : PALACE.ground), C, roofBase + i * MAUSOLEUM.tierRise, C));
  }
  g.add(crowned(emblem, C, roofBase + MAUSOLEUM.tiers * MAUSOLEUM.tierRise, C, 1.6));
  return g;
}

const ALTAR = { back: 0.25, front: 2.75, width: 2.6, height: 0.55, court: 1.75, wing: 0.55, stairs: 1.4 };

function greatAltar(emblem: Emblem): THREE.Object3D {
  const g = new THREE.Group();
  g.add(palaceGround(SIZE, SIZE));
  const { steps, top } = monumentSteps(C, C, [2.9], 0.06, APRON);
  g.add(steps);
  const x0 = C - ALTAR.width / 2;
  const span = ALTAR.front - ALTAR.back;
  const middle = (ALTAR.front + ALTAR.back) / 2;
  const blockDepth = ALTAR.court - ALTAR.back;
  g.add(box(ALTAR.width, ALTAR.height, blockDepth, surface('whitewash'), C, top, ALTAR.back + blockDepth / 2));
  const friezeY = top + ALTAR.height - FRIEZE - 0.05;
  for (const side of [-1, 1]) {
    const x = C + side * (ALTAR.width / 2 - ALTAR.wing / 2);
    const wingDepth = ALTAR.front - ALTAR.court;
    g.add(box(ALTAR.wing, ALTAR.height, wingDepth, surface('whitewash'), x, top, ALTAR.court + wingDepth / 2));
    const front = emblem.relief(ALTAR.wing - 0.08, FRIEZE);
    front.position.set(x, friezeY, ALTAR.front);
    g.add(front);
    const flank = emblem.relief(span - 0.12, FRIEZE);
    flank.position.set(C + side * (ALTAR.width / 2), friezeY, middle);
    flank.rotation.y = side * (Math.PI / 2);
    g.add(flank);
  }
  const back = emblem.relief(ALTAR.width - 0.12, FRIEZE);
  back.position.set(C, friezeY, ALTAR.back);
  back.rotation.y = Math.PI;
  g.add(back);
  g.add(marbleStairs(C, ALTAR.court, ALTAR.stairs, 7, ALTAR.height / 7, 0.14, top));
  const floor = top + ALTAR.height;
  const colonnadeHeight = 0.5;
  const ring: [number, number][] = [
    ...evenly(x0 + 0.12, x0 + ALTAR.width - 0.12, 7).map((x): [number, number] => [x, ALTAR.back + 0.12]),
    ...evenly(ALTAR.back + 0.5, ALTAR.front - 0.12, 4).flatMap((z): [number, number][] => [[x0 + 0.12, z], [x0 + ALTAR.width - 0.12, z]]),
  ];
  for (const [x, z] of ring) g.add(marbleColumn(x, z, colonnadeHeight, floor));
  const roof = floor + colonnadeHeight;
  g.add(box(ALTAR.width + 0.04, 0.04, 0.34, flat(COLORS.aegean), C, roof, ALTAR.back + 0.12));
  g.add(box(ALTAR.width, 0.08, 0.3, surface('whitewash'), C, roof + 0.04, ALTAR.back + 0.12));
  for (const side of [-1, 1]) {
    const x = C + side * (ALTAR.width / 2 - 0.12);
    g.add(box(0.34, 0.04, span - 0.3, flat(COLORS.aegean), x, roof, middle + 0.15));
    g.add(box(0.3, 0.08, span - 0.3, surface('whitewash'), x, roof + 0.04, middle + 0.15));
  }
  g.add(crowned(emblem, C, floor, (ALTAR.back + ALTAR.court) / 2 + 0.25, 1.9));
  return g;
}

const PATCH = 5;
const CROSSING = 3;

function atCrossroads(body: (emblem: Emblem) => THREE.Object3D, emblem: Emblem): () => THREE.Object3D {
  return () => {
    const state = newGameState(PATCH, new Array<Terrain>(PATCH * PATCH).fill('grass'), []);
    for (let t = 0; t < PATCH; t++) {
      for (const i of [CROSSING * PATCH + t, t * PATCH + CROSSING]) {
        state.roads[i] = true;
        state.roadUpgrades[i] = 'fast';
      }
    }
    const scene = new THREE.Group();
    scene.add(...fastRoadMeshes(state));
    scene.add(body(emblem));
    return scene;
  };
}

function option(name: string, body: (emblem: Emblem) => THREE.Object3D): DesignOption {
  return {
    name,
    build: atCrossroads(body, CROWDED_CITY),
    variants: [
      { label: '1,000 citizens', build: atCrossroads(body, CROWDED_CITY) },
      { label: 'Trade route, same body', build: atCrossroads(body, TRADE_ROUTE) },
    ],
  };
}

export const MONUMENT_OPTIONS: DesignOption[] = [
  option('Victory statue with tripods', victoryStatue),
  option('Choregic monument (Lysicrates)', choregic),
  option('Mausoleum (Halicarnassus)', mausoleum),
  option('Great Altar (Pergamon)', greatAltar),
];

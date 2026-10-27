import * as THREE from 'three';
import { appealMap } from '../sim/appeal';
import type { Point } from '../sim/point';
import { canBeOrnate, type RoadUpgrade } from '../sim/road-upgrades';
import { inBounds, tileIndex, type GameState } from '../sim/state';
import { PALETTE, tileHash } from './palette';

const ROAD_HEIGHT = 0.02;
const LAYER = 0.004;

const HINT_OUTER = 0.94;
const HINT_INNER = 0.8;
const hintGeometry = frameGeometry(HINT_OUTER, HINT_INNER);
const hintMaterial = new THREE.MeshBasicMaterial({ color: PALETTE.upgradableHint, transparent: true, opacity: 0.55, depthWrite: false });

const tileGeometry = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
const ornateJointMaterial = new THREE.MeshLambertMaterial({ color: PALETTE.ornateJoint });
const FLAGSTONES_PER_SIDE = 2;
const FLAGSTONE_GAP = 0.05;
const FLAGSTONE_HEIGHT = 0.02;
const FLAGSTONE_SHADE_SPREAD = 0.06;
const flagstoneGeometry = new THREE.BoxGeometry(1 / FLAGSTONES_PER_SIDE - FLAGSTONE_GAP, FLAGSTONE_HEIGHT, 1 / FLAGSTONES_PER_SIDE - FLAGSTONE_GAP);
const flagstoneMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
const CURB_WIDTH = 0.12;
const CURB_HEIGHT = 0.04;
const curbGeometry = new THREE.BoxGeometry(1, CURB_HEIGHT, CURB_WIDTH);
const curbMaterial = new THREE.MeshLambertMaterial({ color: PALETTE.aegeanBlue });
const INLAY_SIZE = 0.06;
const INLAY_OFFSETS = [-0.33, 0, 0.33];
const inlayGeometry = new THREE.BoxGeometry(INLAY_SIZE, LAYER, INLAY_SIZE).rotateY(Math.PI / 4);
const inlayMaterial = new THREE.MeshLambertMaterial({ color: PALETTE.marbleFace });

const fastStoneMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
const FAST_SHADE_SPREAD = 0.08;
const GROOVE_OFFSET = 0.19;
const GROOVE_WIDTH = 0.07;
const grooveGeometry = new THREE.BoxGeometry(1, LAYER, GROOVE_WIDTH);
const grooveMaterial = new THREE.MeshLambertMaterial({ color: PALETTE.wheelGroove });

const SIDES: { step: Point; rotation: number }[] = [
  { step: { x: 0, y: -1 }, rotation: 0 },
  { step: { x: 0, y: 1 }, rotation: 0 },
  { step: { x: -1, y: 0 }, rotation: Math.PI / 2 },
  { step: { x: 1, y: 0 }, rotation: Math.PI / 2 },
];

function frameGeometry(outer: number, inner: number): THREE.BufferGeometry {
  const square = (half: number) => [
    new THREE.Vector2(-half, -half),
    new THREE.Vector2(half, -half),
    new THREE.Vector2(half, half),
    new THREE.Vector2(-half, half),
  ];
  const shape = new THREE.Shape(square(outer / 2));
  shape.holes.push(new THREE.Path(square(inner / 2).reverse()));
  return new THREE.ShapeGeometry(shape).rotateX(-Math.PI / 2);
}

interface Instance {
  matrix: THREE.Matrix4;
  color?: THREE.Color;
}

function instanced(geometry: THREE.BufferGeometry, material: THREE.Material, instances: Instance[]): THREE.InstancedMesh {
  const mesh = new THREE.InstancedMesh(geometry, material, instances.length);
  instances.forEach(({ matrix, color }, n) => {
    mesh.setMatrixAt(n, matrix);
    if (color) mesh.setColorAt(n, color);
  });
  return mesh;
}

function at(x: number, y: number, z: number, turn = 0): THREE.Matrix4 {
  return new THREE.Matrix4().makeRotationY(turn).setPosition(x, y, z);
}

function shaded(hex: number, x: number, z: number, spread: number): THREE.Color {
  return new THREE.Color(hex).offsetHSL(0, 0, (tileHash(x, z) - 0.5) * spread);
}

function tilesOf(state: GameState, kind: RoadUpgrade): Point[] {
  return state.roadUpgrades.flatMap((upgrade, i) => (upgrade === kind ? [{ x: i % state.size, y: Math.floor(i / state.size) }] : []));
}

function isRoadAt(state: GameState, x: number, y: number): boolean {
  return inBounds(state, x, y) && state.roads[tileIndex(state, x, y)];
}

export function upgradableTiles(state: GameState): Point[] {
  const appeal = appealMap(state);
  return state.roads.flatMap((road, i) => {
    const p = { x: i % state.size, y: Math.floor(i / state.size) };
    return road && canBeOrnate(state, p, appeal) ? [p] : [];
  });
}

export function hintMesh(tiles: Point[]): THREE.InstancedMesh {
  return instanced(hintGeometry, hintMaterial, tiles.map((p) => ({ matrix: at(p.x + 0.5, ROAD_HEIGHT + LAYER, p.y + 0.5) })));
}

export function ornateRoadMeshes(state: GameState): THREE.InstancedMesh[] {
  const tiles = tilesOf(state, 'ornate');
  const flagstones: Instance[] = [];
  const curbs: Instance[] = [];
  const inlays: Instance[] = [];
  for (const p of tiles) {
    for (let sy = 0; sy < FLAGSTONES_PER_SIDE; sy++) {
      for (let sx = 0; sx < FLAGSTONES_PER_SIDE; sx++) {
        const x = p.x + (sx + 0.5) / FLAGSTONES_PER_SIDE;
        const z = p.y + (sy + 0.5) / FLAGSTONES_PER_SIDE;
        flagstones.push({ matrix: at(x, ROAD_HEIGHT + FLAGSTONE_HEIGHT / 2, z), color: shaded(PALETTE.marbleFace, x, z, FLAGSTONE_SHADE_SPREAD) });
      }
    }
    for (const { step, rotation } of SIDES) {
      if (isRoadAt(state, p.x + step.x, p.y + step.y)) continue;
      const edge = 0.5 - CURB_WIDTH / 2;
      const cx = p.x + 0.5 + step.x * edge;
      const cz = p.y + 0.5 + step.y * edge;
      curbs.push({ matrix: at(cx, ROAD_HEIGHT + CURB_HEIGHT / 2, cz, rotation) });
      for (const offset of INLAY_OFFSETS) {
        const along = step.x === 0 ? { x: offset, z: 0 } : { x: 0, z: offset };
        inlays.push({ matrix: at(cx + along.x, ROAD_HEIGHT + CURB_HEIGHT + LAYER / 2, cz + along.z) });
      }
    }
  }
  return [
    instanced(tileGeometry, ornateJointMaterial, tiles.map((p) => ({ matrix: at(p.x + 0.5, ROAD_HEIGHT, p.y + 0.5) }))),
    instanced(flagstoneGeometry, flagstoneMaterial, flagstones),
    instanced(curbGeometry, curbMaterial, curbs),
    instanced(inlayGeometry, inlayMaterial, inlays),
  ];
}

type Side = 'north' | 'south' | 'west' | 'east';

const SIDE_STEPS: Record<Side, Point> = { north: { x: 0, y: -1 }, south: { x: 0, y: 1 }, west: { x: -1, y: 0 }, east: { x: 1, y: 0 } };
const ALONG_X = 0;
const ALONG_Z = Math.PI / 2;
const TURNS: { sides: [Side, Side]; rotation: number }[] = [
  { sides: ['north', 'west'], rotation: 0 },
  { sides: ['south', 'west'], rotation: Math.PI / 2 },
  { sides: ['south', 'east'], rotation: Math.PI },
  { sides: ['north', 'east'], rotation: -Math.PI / 2 },
];
const TURN_SEGMENTS = 10;
const turnGeometries = [0.5 - GROOVE_OFFSET, 0.5 + GROOVE_OFFSET].map((radius) =>
  new THREE.RingGeometry(radius - GROOVE_WIDTH / 2, radius + GROOVE_WIDTH / 2, TURN_SEGMENTS, 1, -Math.PI / 2, Math.PI / 2)
    .rotateX(-Math.PI / 2)
    .translate(-0.5, 0, -0.5),
);

function wheelRuns(state: GameState, p: Point): { straights: number[]; turns: number[] } {
  const joins = (side: Side) => isRoadAt(state, p.x + SIDE_STEPS[side].x, p.y + SIDE_STEPS[side].y);
  const straights = [
    ...(joins('west') && joins('east') ? [ALONG_X] : []),
    ...(joins('north') && joins('south') ? [ALONG_Z] : []),
  ];
  const turns = TURNS.filter(({ sides }) => sides.every(joins)).map(({ rotation }) => rotation);
  if (straights.length > 0 || turns.length > 0) return { straights, turns };
  return { straights: [joins('north') || joins('south') ? ALONG_Z : ALONG_X], turns: [] };
}

export function fastRoadMeshes(state: GameState): THREE.InstancedMesh[] {
  const tiles = tilesOf(state, 'fast');
  const grooves: Instance[] = [];
  const turns: Instance[] = [];
  for (const p of tiles) {
    const runs = wheelRuns(state, p);
    for (const direction of runs.straights) {
      for (const side of [-1, 1]) {
        const offset = side * GROOVE_OFFSET;
        const [dx, dz] = direction === ALONG_X ? [0, offset] : [offset, 0];
        grooves.push({ matrix: at(p.x + 0.5 + dx, ROAD_HEIGHT + LAYER, p.y + 0.5 + dz, direction) });
      }
    }
    for (const rotation of runs.turns) turns.push({ matrix: at(p.x + 0.5, ROAD_HEIGHT + LAYER * 1.5, p.y + 0.5, rotation) });
  }
  return [
    instanced(
      tileGeometry,
      fastStoneMaterial,
      tiles.map((p) => ({ matrix: at(p.x + 0.5, ROAD_HEIGHT, p.y + 0.5), color: shaded(PALETTE.fastStone, p.x, p.y, FAST_SHADE_SPREAD) })),
    ),
    instanced(grooveGeometry, grooveMaterial, grooves),
    ...turnGeometries.map((geometry) => instanced(geometry, grooveMaterial, turns)),
  ];
}

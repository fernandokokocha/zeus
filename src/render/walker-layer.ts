import * as THREE from 'three';
import type { CarrierKind, GameState, RoamerKind, TraineeKind, Walk } from '../sim/state';
import { WALKER_TILES_PER_TICK, walkerPosition } from '../sim/walking';
import { PALETTE } from './palette';

const BOB_HEIGHT = 0.06;
const FIGURE_SCALE = 1.7;
const BOB_STEPS_PER_TILE = 2;
const START_CAPACITY = 64;

interface Part {
  geometry: THREE.BufferGeometry;
  color: number;
}

type Figure = 'settler' | RoamerKind | CarrierKind | TraineeKind;

function body(tunic: number): Part[] {
  return [
    { geometry: new THREE.CylinderGeometry(0.06, 0.09, 0.26, 8).translate(0, 0.13, 0), color: tunic },
    { geometry: new THREE.SphereGeometry(0.06, 10, 8).translate(0, 0.32, 0), color: PALETTE.skin },
  ];
}

const jar = new THREE.LatheGeometry(
  [[0, 0], [0.04, 0.01], [0.065, 0.06], [0.06, 0.11], [0.03, 0.15], [0.04, 0.17]].map(([r, y]) => new THREE.Vector2(r, y)),
  10,
);

const philosopher: Part[] = [
  { geometry: new THREE.CylinderGeometry(0.06, 0.1, 0.28, 8).translate(0, 0.14, 0), color: PALETTE.philosopherRobe },
  { geometry: new THREE.SphereGeometry(0.06, 10, 8).translate(0, 0.33, 0), color: PALETTE.skin },
  { geometry: new THREE.SphereGeometry(0.04, 8, 6).scale(1, 1.3, 0.8).translate(0, 0.28, 0.04), color: PALETTE.beard },
  { geometry: new THREE.CylinderGeometry(0.025, 0.025, 0.14, 8).rotateZ(Math.PI / 2).translate(0.02, 0.19, 0.09), color: PALETTE.scroll },
];

const actor: Part[] = [
  ...body(PALETTE.actorRobe),
  { geometry: new THREE.SphereGeometry(0.05, 10, 8).scale(1, 1.25, 0.5).translate(0, 0.32, 0.05), color: PALETTE.mask },
];

const FIGURES: Record<Figure, Part[]> = {
  settler: [
    ...body(PALETTE.tunic),
    { geometry: new THREE.BoxGeometry(0.14, 0.14, 0.1).translate(0, 0.2, -0.1), color: PALETTE.bundle },
  ],
  waterCarrier: [
    ...body(PALETTE.carrierTunic),
    { geometry: jar.clone().rotateZ(-0.35).translate(0.09, 0.27, 0), color: PALETTE.carrierJar },
  ],
  taxCollector: [
    ...body(PALETTE.clerkTunic),
    { geometry: new THREE.BoxGeometry(0.12, 0.09, 0.02).rotateX(-0.6).translate(0, 0.2, 0.09), color: PALETTE.tablet },
    { geometry: new THREE.SphereGeometry(0.04, 8, 6).translate(0.09, 0.1, 0), color: PALETTE.coins },
  ],
  peddler: [
    ...body(PALETTE.peddlerTunic),
    { geometry: new THREE.CylinderGeometry(0.09, 0.07, 0.06, 10).translate(0, 0.41, 0), color: PALETTE.reed },
    { geometry: new THREE.SphereGeometry(0.045, 8, 6).scale(1.3, 0.8, 1).translate(0.02, 0.45, 0), color: PALETTE.bread },
  ],
  buyer: [
    ...body(PALETTE.buyerTunic),
    { geometry: new THREE.CylinderGeometry(0.07, 0.05, 0.08, 10).translate(0.1, 0.12, 0.02), color: PALETTE.reed },
  ],
philosopher,
philosopherTrainee: philosopher,
athlete: [
  { geometry: new THREE.CylinderGeometry(0.06, 0.07, 0.24, 8).translate(0, 0.15, 0), color: PALETTE.skin },
  { geometry: new THREE.CylinderGeometry(0.075, 0.08, 0.07, 8).translate(0, 0.07, 0), color: PALETTE.loincloth },
  { geometry: new THREE.SphereGeometry(0.06, 10, 8).translate(0, 0.33, 0), color: PALETTE.skin },
  { geometry: new THREE.CylinderGeometry(0.06, 0.06, 0.015, 12).rotateZ(Math.PI / 2).translate(0.1, 0.16, 0), color: PALETTE.bronze },
],
actor,
actorTrainee: actor,
fleeceCart: [
    ...body(PALETTE.cartTunic),
    { geometry: new THREE.BoxGeometry(0.2, 0.08, 0.24).translate(0, 0.1, 0.22), color: PALETTE.trunk },
    { geometry: new THREE.CylinderGeometry(0.06, 0.06, 0.26, 10).rotateZ(Math.PI / 2).translate(0, 0.06, 0.24), color: PALETTE.doorway },
    { geometry: new THREE.BoxGeometry(0.16, 0.1, 0.18).translate(0, 0.19, 0.22), color: PALETTE.wool },
  ],
  fleeceBuyer: [
    ...body(PALETTE.fleeceBuyerTunic),
    { geometry: new THREE.SphereGeometry(0.07, 8, 6).scale(1.3, 0.8, 1).translate(0, 0.26, -0.08), color: PALETTE.wool },
  ],
cartPusher: [
    ...body(PALETTE.cartTunic),
    { geometry: new THREE.BoxGeometry(0.2, 0.08, 0.24).translate(0, 0.1, 0.22), color: PALETTE.trunk },
    { geometry: new THREE.CylinderGeometry(0.06, 0.06, 0.26, 10).rotateZ(Math.PI / 2).translate(0, 0.06, 0.24), color: PALETTE.doorway },
    { geometry: new THREE.BoxGeometry(0.15, 0.08, 0.16).translate(0, 0.18, 0.22), color: PALETTE.sack },
  ],
};

function createFigureSet(parts: Part[], group: THREE.Group): { show(walks: Walk[], ticksAhead: number): void } {
  let capacity = 0;
  let meshes: THREE.InstancedMesh[] = [];
  const matrix = new THREE.Matrix4();
  const rotation = new THREE.Quaternion();
  const position = new THREE.Vector3();
  const scale = new THREE.Vector3(FIGURE_SCALE, FIGURE_SCALE, FIGURE_SCALE);
  const up = new THREE.Vector3(0, 1, 0);

  function allocate(size: number): void {
    for (const mesh of meshes) {
      mesh.dispose();
      group.remove(mesh);
    }
    capacity = size;
    meshes = parts.map((part) => {
      const mesh = new THREE.InstancedMesh(part.geometry, new THREE.MeshLambertMaterial({ color: part.color }), size);
      mesh.frustumCulled = false;
      return mesh;
    });
    group.add(...meshes);
  }

  return {
    show(walks, ticksAhead) {
      if (walks.length > capacity) allocate(Math.max(START_CAPACITY, 2 * walks.length));
      walks.forEach((walk, i) => {
        const at = walkerPosition(walk, ticksAhead * WALKER_TILES_PER_TICK);
        const travelled = Math.abs(at.x) + Math.abs(at.y);
        const bob = Math.abs(Math.sin(travelled * Math.PI * BOB_STEPS_PER_TILE)) * BOB_HEIGHT;
        position.set(at.x + 0.5, bob, at.y + 0.5);
        rotation.setFromAxisAngle(up, Math.atan2(at.facing.x, at.facing.y));
        matrix.compose(position, rotation, scale);
        for (const mesh of meshes) mesh.setMatrixAt(i, matrix);
      });
      for (const mesh of meshes) {
        mesh.count = walks.length;
        mesh.instanceMatrix.needsUpdate = true;
      }
    },
  };
}

export function createWalkerLayer(): { group: THREE.Group; sync(state: GameState, ticksAhead: number): void } {
  const group = new THREE.Group();
  const sets = Object.fromEntries(
    (Object.keys(FIGURES) as Figure[]).map((figure) => [figure, createFigureSet(FIGURES[figure], group)]),
  ) as Record<Figure, ReturnType<typeof createFigureSet>>;

  return {
    group,
    sync(state, ticksAhead) {
      sets.settler.show(state.settlers, ticksAhead);
      for (const kind of ['waterCarrier', 'taxCollector', 'peddler', 'philosopher', 'athlete', 'actor'] as const) {
        sets[kind].show(state.roamers.filter((r) => r.kind === kind), ticksAhead);
      }
      for (const kind of ['cartPusher', 'buyer', 'fleeceCart', 'fleeceBuyer'] as const) {
        sets[kind].show(state.carriers.filter((c) => c.kind === kind), ticksAhead);
      }
      for (const kind of ['philosopherTrainee', 'actorTrainee'] as const) {
        sets[kind].show(state.trainees.filter((t) => t.kind === kind), ticksAhead);
      }
    },
  };
}

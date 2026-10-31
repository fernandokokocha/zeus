import * as THREE from 'three';
import type { CaravanTrip, CarrierKind, GameState, Good, Material, RoamerKind, TraineeKind, Walk } from '../sim/state';
import { CARRIER_SPECS } from '../sim/carriers';
import { SERVING_WALKERS, type Overlay } from '../sim/overlays';
import { ROAMER_SPECS } from '../sim/roamers';
import { FULL_FLEECE } from '../sim/sheep';
import { walkerPosition, walkerSpeed } from '../sim/walking';
import { PALETTE, PARTNER_COLORS } from './palette';
import type { Partner } from '../sim/trade';
import { FADED_OPACITY } from './world-layer';
import { awningCartPeddler } from './peddler-models';
import { FIGURE_SCALE, body, cart, jar, mergedByColour, type Part } from './kit/walker';

const BOB_HEIGHT = 0.06;
const BOB_STEPS_PER_TILE = 2;
const START_CAPACITY = 64;

type YardCart = Extract<CarrierKind, `${string}Export` | `${string}Unload`>;

type Figure =
  | 'settler'
  | 'artisan'
  | RoamerKind
  | Exclude<CarrierKind, YardCart>
  | CaravanFigure
  | ForeignFigure
  | TraineeKind
  | 'papyrusCart'
  | 'shepherd'
  | 'shepherdWithFleece'
  | 'grower'
  | 'growerWithOlives'
  | GathererFigure
  | SheepCoat;

type GathererFigure = 'lumberjack' | 'lumberjackWithLog' | 'quarryman' | 'quarrymanWithBlock' | 'miner' | 'minerWithOre';

const GATHERER_FIGURES: Record<Material, { empty: GathererFigure; laden: GathererFigure }> = {
  wood: { empty: 'lumberjack', laden: 'lumberjackWithLog' },
  marble: { empty: 'quarryman', laden: 'quarrymanWithBlock' },
  bronze: { empty: 'miner', laden: 'minerWithOre' },
};

type CaravanFigure = 'caravanLaden' | 'caravanWithChest' | 'caravanUnladen';

type ForeignFigure = `${Partner}Caravan` | `${Partner}CaravanBare`;

const PARTNERS_DRAWN = Object.keys(PARTNER_COLORS) as Partner[];

const CARAVAN_FIGURES: Record<Exclude<CaravanTrip, 'away'>, CaravanFigure> = {
  out: 'caravanLaden',
  home: 'caravanWithChest',
  merchants: 'caravanUnladen',
};

const YARD_CARTS: Record<Good, Figure> = {
  food: 'cartPusher',
  fleece: 'fleeceCart',
  olives: 'oliveCart',
  oil: 'oilCart',
  wood: 'woodCart',
  marble: 'marbleCart',
  bronze: 'bronzeCart',
  sculptures: 'sculptureCart',
  cloth: 'clothCart',
  papyrus: 'papyrusCart',
  scrolls: 'scrollCart',
  armor: 'armorCart',
};

function carrierFigure(kind: CarrierKind): Figure {
  const { home, good } = CARRIER_SPECS[kind];
  return home === 'tradeYard' ? YARD_CARTS[good] : (kind as Exclude<CarrierKind, YardCart>);
}

const CARRIER_FIGURES = [...new Set((Object.keys(CARRIER_SPECS) as CarrierKind[]).map(carrierFigure))];

export function donkey(load: Part[]): Part[] {
  const leg = (x: number, z: number): Part => ({ geometry: new THREE.CylinderGeometry(0.014, 0.012, 0.12, 6).translate(x, 0.06, z), color: PALETTE.donkey });
  return [
    { geometry: new THREE.BoxGeometry(0.1, 0.1, 0.24).translate(0.14, 0.17, -0.06), color: PALETTE.donkey },
    { geometry: new THREE.BoxGeometry(0.06, 0.07, 0.11).rotateX(-0.5).translate(0.14, 0.26, 0.09), color: PALETTE.donkey },
    { geometry: new THREE.BoxGeometry(0.045, 0.045, 0.05).translate(0.14, 0.24, 0.15), color: PALETTE.donkeyMuzzle },
    { geometry: new THREE.ConeGeometry(0.012, 0.06, 5).translate(0.125, 0.33, 0.07), color: PALETTE.donkey },
    { geometry: new THREE.ConeGeometry(0.012, 0.06, 5).translate(0.155, 0.33, 0.07), color: PALETTE.donkey },
    leg(0.11, -0.15),
    leg(0.17, -0.15),
    leg(0.11, 0.03),
    leg(0.17, 0.03),
    ...load,
  ];
}

export function merchantIn(cloak: number): Part[] {
  return [
    ...body(PALETTE.merchantTunic),
    { geometry: new THREE.CylinderGeometry(0.065, 0.095, 0.16, 8, 1, true, Math.PI, Math.PI).translate(0, 0.18, 0), color: cloak },
  ];
}

const merchant = merchantIn(PALETTE.merchantCloak);

export const packSacks: Part[] = [
  { geometry: new THREE.SphereGeometry(0.05, 8, 6).scale(0.8, 1, 1.2).translate(0.075, 0.2, -0.06), color: PALETTE.sack },
  { geometry: new THREE.SphereGeometry(0.05, 8, 6).scale(0.8, 1, 1.2).translate(0.205, 0.2, -0.06), color: PALETTE.sack },
  { geometry: new THREE.BoxGeometry(0.09, 0.06, 0.1).translate(0.14, 0.25, -0.06), color: PALETTE.merchantCloak },
];

const moneyChest: Part[] = [
  { geometry: new THREE.BoxGeometry(0.1, 0.07, 0.12).translate(0.14, 0.255, -0.06), color: PALETTE.moneyChest },
  { geometry: new THREE.BoxGeometry(0.104, 0.015, 0.124).translate(0.14, 0.27, -0.06), color: PALETTE.coins },
];

type SheepCoat = 'shornSheep' | 'halfGrownSheep' | 'woollySheep';

const HALF_GROWN = 0.5;

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

function sheep(coat: number, size: number): Part[] {
  const leg = (x: number, z: number) => ({
    geometry: new THREE.CylinderGeometry(0.014, 0.014, 0.1, 6).translate(x, 0.05, z),
    color: PALETTE.sheepFace,
  });
  return [
    { geometry: new THREE.SphereGeometry(0.1, 10, 8).scale(0.8 * size, 0.7 * size, 1.1 * size).translate(0, 0.15, 0), color: coat },
    { geometry: new THREE.SphereGeometry(0.04, 8, 6).scale(0.9, 1, 1.3).translate(0, 0.19, 0.08 + 0.06 * size), color: PALETTE.sheepFace },
    leg(-0.04, -0.06),
    leg(0.04, -0.06),
    leg(-0.04, 0.06),
    leg(0.04, 0.06),
  ];
}

const shepherd: Part[] = [
  ...body(PALETTE.shepherdTunic),
  { geometry: new THREE.CylinderGeometry(0.012, 0.012, 0.44, 6).translate(0.1, 0.22, 0.03), color: PALETTE.trunk },
  { geometry: new THREE.TorusGeometry(0.03, 0.01, 6, 10, Math.PI).translate(0.07, 0.44, 0.03), color: PALETTE.trunk },
];

const grower: Part[] = [
  ...body(PALETTE.growerTunic),
  { geometry: new THREE.CylinderGeometry(0.07, 0.05, 0.08, 10).translate(0.1, 0.12, 0), color: PALETTE.reed },
];

const oliveHeap = (x: number, y: number, z: number, size: number): Part => ({
  geometry: new THREE.SphereGeometry(0.06 * size, 8, 6).scale(1.2, 0.6, 1.2).translate(x, y, z),
  color: PALETTE.olive,
});

const logOnShoulder: Part = {
  geometry: new THREE.CylinderGeometry(0.035, 0.035, 0.34, 8).rotateX(Math.PI / 2).translate(0.07, 0.3, 0),
  color: PALETTE.log,
};

const marbleChunk = (x: number, y: number, z: number, size: number): Part => ({
  geometry: new THREE.BoxGeometry(0.12 * size, 0.09 * size, 0.1 * size).translate(x, y, z),
  color: PALETTE.marble,
});

const oreLump = (x: number, y: number, z: number, size: number): Part => ({
  geometry: new THREE.DodecahedronGeometry(0.05 * size).translate(x, y, z),
  color: PALETTE.ore,
});

const ingot = (x: number, y: number, z: number): Part => ({
  geometry: new THREE.BoxGeometry(0.11, 0.035, 0.05).translate(x, y, z),
  color: PALETTE.bronze,
});

function tool(head: THREE.BufferGeometry): Part[] {
  return [
    { geometry: new THREE.CylinderGeometry(0.01, 0.01, 0.3, 6).rotateZ(0.4).translate(0.1, 0.2, 0.04), color: PALETTE.trunk },
    { geometry: head.translate(0.16, 0.33, 0.04), color: PALETTE.axeHead },
  ];
}

const lumberjack: Part[] = [...body(PALETTE.lumberjackTunic), ...tool(new THREE.BoxGeometry(0.03, 0.08, 0.06))];
const quarryman: Part[] = [...body(PALETTE.quarrymanTunic), ...tool(new THREE.BoxGeometry(0.12, 0.025, 0.025).rotateZ(-0.4))];
const miner: Part[] = [...body(PALETTE.minerTunic), ...tool(new THREE.BoxGeometry(0.12, 0.025, 0.025).rotateZ(-0.4))];

const statuette: Part[] = [
  { geometry: new THREE.CylinderGeometry(0.035, 0.045, 0.16, 8).translate(0, 0.22, 0.22), color: PALETTE.bronze },
  { geometry: new THREE.SphereGeometry(0.035, 8, 6).translate(0, 0.33, 0.22), color: PALETTE.bronze },
];

const woodCart = cart([
  { geometry: new THREE.CylinderGeometry(0.035, 0.035, 0.24, 8).rotateX(Math.PI / 2).translate(-0.05, 0.17, 0.22), color: PALETTE.log },
  { geometry: new THREE.CylinderGeometry(0.035, 0.035, 0.24, 8).rotateX(Math.PI / 2).translate(0.05, 0.17, 0.22), color: PALETTE.log },
]);
const marbleCart = cart([marbleChunk(0, 0.19, 0.22, 1.3)]);
const sculptureCart = cart(statuette);

const clothBoltPart = (y: number, z: number): Part => ({
  geometry: new THREE.CylinderGeometry(0.04, 0.04, 0.2, 10).rotateZ(Math.PI / 2).translate(0, y, z),
  color: PALETTE.cloth,
});

const scrollPart = (x: number, y: number, z: number): Part => ({
  geometry: new THREE.CylinderGeometry(0.025, 0.025, 0.16, 8).rotateZ(Math.PI / 2).translate(x, y, z),
  color: PALETTE.scrollSheet,
});

const shieldPart = (y: number, z: number): Part => ({
  geometry: new THREE.CylinderGeometry(0.07, 0.07, 0.02, 12).rotateX(Math.PI / 2).translate(0, y, z),
  color: PALETTE.armorShield,
});

const papyrusPart = (y: number, z: number): Part => ({
  geometry: new THREE.CylinderGeometry(0.035, 0.035, 0.2, 8).rotateZ(Math.PI / 2).translate(0, y, z),
  color: PALETTE.papyrusReed,
});

const smallAmphora = (x: number, y: number, z: number): Part => ({ geometry: jar.clone().translate(x, y, z), color: PALETTE.terracotta });

const FIGURES: Record<Figure, Part[]> = {
  superintendent: [
    ...body(PALETTE.superintendentTunic),
    { geometry: new THREE.CylinderGeometry(0.075, 0.075, 0.03, 10).translate(0, 0.38, 0), color: PALETTE.reed },
    { geometry: new THREE.CylinderGeometry(0.05, 0.04, 0.08, 10).translate(0.1, 0.1, 0), color: PALETTE.bronze },
    { geometry: new THREE.CylinderGeometry(0.045, 0.045, 0.005, 10).translate(0.1, 0.14, 0), color: PALETTE.water },
  ],
  healer: [
    ...body(PALETTE.healerRobe),
    { geometry: new THREE.CylinderGeometry(0.05, 0.04, 0.05, 10).translate(0.1, 0.12, 0), color: PALETTE.reed },
    { geometry: new THREE.SphereGeometry(0.04, 8, 6).translate(0.1, 0.16, 0), color: PALETTE.herbs },
  ],
  grower,
  growerWithOlives: [...grower, oliveHeap(0.1, 0.16, 0, 0.9)],
  oliveCart: cart([oliveHeap(0, 0.16, 0.22, 1.4)]),
  oilCart: cart([smallAmphora(-0.05, 0.14, 0.18), smallAmphora(0.05, 0.14, 0.27)]),
  oliveBuyer: [
    ...body(PALETTE.oliveBuyerTunic),
    { geometry: new THREE.CylinderGeometry(0.07, 0.05, 0.08, 10).translate(0.1, 0.12, 0.02), color: PALETTE.reed },
    oliveHeap(0.1, 0.17, 0.02, 0.9),
  ],
  oilBuyer: [...body(PALETTE.oilBuyerTunic), smallAmphora(0.1, 0.06, 0.02)],
  lumberjack,
  lumberjackWithLog: [...body(PALETTE.lumberjackTunic), logOnShoulder],
  quarryman,
  quarrymanWithBlock: [...body(PALETTE.quarrymanTunic), marbleChunk(0, 0.38, 0, 1)],
  miner,
  minerWithOre: [...body(PALETTE.minerTunic), oreLump(0, 0.38, 0, 1.2)],
  woodCart,
  marbleCart,
  bronzeCart: cart([ingot(-0.04, 0.155, 0.2), ingot(0.04, 0.155, 0.26), oreLump(0, 0.2, 0.23, 0.6)]),
  sculptureCart,
  clothCart: cart([clothBoltPart(0.18, 0.18), clothBoltPart(0.18, 0.26), { geometry: new THREE.CylinderGeometry(0.043, 0.043, 0.03, 10).rotateZ(Math.PI / 2).translate(0, 0.18, 0.18), color: PALETTE.clothBand }]),
  weaverBuyer: [
    ...body(PALETTE.weaverBuyerTunic),
    { geometry: new THREE.CylinderGeometry(0.09, 0.07, 0.06, 10).translate(0, 0.41, 0), color: PALETTE.reed },
    { geometry: new THREE.SphereGeometry(0.075, 8, 6).scale(1.2, 0.7, 1.2).translate(0, 0.46, 0), color: PALETTE.wool },
  ],
  woodSupply: woodCart,
  marbleSupply: marbleCart,
  sculptureSupply: sculptureCart,
  bronzeBuyer: [...body(PALETTE.bronzeBuyerTunic), ingot(0.1, 0.12, 0.02)],
clothBuyer: [...body(PALETTE.clothBuyerTunic), clothBoltPart(0.2, -0.09)],
papyrusBuyer: [...body(PALETTE.scribeBuyerTunic), papyrusPart(0.2, -0.09)],
scriptoriumFleeceBuyer: [
  ...body(PALETTE.scribeBuyerTunic),
  { geometry: new THREE.SphereGeometry(0.07, 8, 6).scale(1.3, 0.8, 1).translate(0, 0.26, -0.08), color: PALETTE.wool },
],
scrollBuyer: [...body(PALETTE.scribeBuyerTunic), scrollPart(0.2, 0.2, -0.09)],
scrollCart: cart([scrollPart(0, 0.17, 0.18), scrollPart(0, 0.17, 0.24), scrollPart(0, 0.21, 0.21)]),
papyrusCart: cart([papyrusPart(0.17, 0.19), papyrusPart(0.17, 0.26)]),
armoryBuyer: [...body(PALETTE.armoryBuyerTunic), ingot(0.1, 0.12, 0.02)],
armorCart: cart([shieldPart(0.19, 0.18), shieldPart(0.19, 0.26)]),
armorBuyer: [...body(PALETTE.armorBuyerTunic), shieldPart(0.24, -0.1)],
  artisan: [...body(PALETTE.artisanTunic), ...tool(new THREE.BoxGeometry(0.08, 0.05, 0.05))],
  shepherd,
  shepherdWithFleece: [
    ...shepherd,
    { geometry: new THREE.SphereGeometry(0.08, 8, 6).scale(1.2, 0.8, 1).translate(0, 0.26, -0.09), color: PALETTE.wool },
  ],
  shornSheep: sheep(PALETTE.shornWool, 0.8),
  halfGrownSheep: sheep(PALETTE.wool, 1),
  woollySheep: sheep(PALETTE.wool, 1.25),
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
  peddler: awningCartPeddler(),
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
  fleeceCart: cart([{ geometry: new THREE.BoxGeometry(0.16, 0.1, 0.18).translate(0, 0.19, 0.22), color: PALETTE.wool }]),
  fleeceBuyer: [
    ...body(PALETTE.fleeceBuyerTunic),
    { geometry: new THREE.SphereGeometry(0.07, 8, 6).scale(1.3, 0.8, 1).translate(0, 0.26, -0.08), color: PALETTE.wool },
  ],
  cartPusher: cart([{ geometry: new THREE.BoxGeometry(0.15, 0.08, 0.16).translate(0, 0.18, 0.22), color: PALETTE.sack }]),
  carrotCart: cart([{ geometry: new THREE.BoxGeometry(0.15, 0.06, 0.16).translate(0, 0.17, 0.22), color: PALETTE.carrot }]),
  caravanLaden: [...merchant, ...donkey(packSacks)],
  caravanWithChest: [...merchant, ...donkey(moneyChest)],
  caravanUnladen: [...merchant, ...donkey([])],
  ...foreignFigures(),
};

function foreignFigures(): Record<ForeignFigure, Part[]> {
  return Object.fromEntries(
    PARTNERS_DRAWN.flatMap((partner) => {
      const trader = merchantIn(PARTNER_COLORS[partner]);
      return [
        [`${partner}Caravan`, [...trader, ...donkey(packSacks)]],
        [`${partner}CaravanBare`, [...trader, ...donkey([])]],
      ];
    }),
  ) as Record<ForeignFigure, Part[]>;
}

interface FigureSet {
  show(walks: Walk[], lookAhead: (walk: Walk) => number): void;
  fade(faded: boolean): void;
}

function createFigureSet(figure: Part[], group: THREE.Group): FigureSet {
  const parts = mergedByColour(figure);
  let capacity = 0;
  let isFaded = false;
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
    applyFade();
  }

  function applyFade(): void {
    for (const mesh of meshes) {
      const material = mesh.material as THREE.MeshLambertMaterial;
      material.transparent = isFaded;
      material.opacity = isFaded ? FADED_OPACITY : 1;
      material.depthWrite = !isFaded;
      material.needsUpdate = true;
    }
  }

  return {
    show(walks, lookAhead) {
      if (walks.length > capacity) allocate(Math.max(START_CAPACITY, 2 * walks.length));
      walks.forEach((walk, i) => {
        const at = walkerPosition(walk, lookAhead(walk));
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
    fade(faded) {
      if (faded === isFaded) return;
      isFaded = faded;
      applyFade();
    },
  };
}

export function createWalkerLayer(): { group: THREE.Group; sync(state: GameState, ticksAhead: number, overlay: Overlay | null): void } {
  const group = new THREE.Group();
  const sets = Object.fromEntries(
    (Object.keys(FIGURES) as Figure[]).map((figure) => [figure, createFigureSet(FIGURES[figure], group)]),
  ) as Record<Figure, FigureSet>;
  let fadedFor: Overlay | null = null;

  function fadeFor(overlay: Overlay | null): void {
    if (overlay === fadedFor) return;
    fadedFor = overlay;
    const serving = new Set<string>(overlay ? SERVING_WALKERS[overlay] : Object.keys(FIGURES));
    for (const figure of Object.keys(FIGURES) as Figure[]) sets[figure].fade(!serving.has(figure));
  }

  return {
    group,
    sync(state, ticksAhead, overlay) {
      fadeFor(overlay);
      const ahead = (walk: Walk) => ticksAhead * walkerSpeed(state, walk);
      sets.settler.show(state.settlers, ahead);
      sets.artisan.show(state.artisans, ahead);
      for (const kind of Object.keys(ROAMER_SPECS) as RoamerKind[]) {
        sets[kind].show(state.roamers.filter((r) => r.kind === kind), ahead);
      }
      for (const figure of CARRIER_FIGURES) {
        sets[figure].show(state.carriers.filter((c) => carrierFigure(c.kind) === figure), ahead);
      }
      for (const trip of Object.keys(CARAVAN_FIGURES) as (keyof typeof CARAVAN_FIGURES)[]) {
        sets[CARAVAN_FIGURES[trip]].show(state.caravans.filter((c) => c.trip === trip), ahead);
      }
      for (const partner of PARTNERS_DRAWN) {
        const theirs = state.foreignCaravans.filter((c) => c.partner === partner);
        sets[`${partner}Caravan`].show(theirs.filter((c) => c.trip === 'in'), ahead);
        sets[`${partner}CaravanBare`].show(theirs.filter((c) => c.trip === 'back'), ahead);
      }
      for (const good of Object.keys(GATHERER_FIGURES) as Material[]) {
        const { empty, laden } = GATHERER_FIGURES[good];
        const gatherers = state.gatherers.filter((g) => g.good === good);
        sets[empty].show(gatherers.filter((g) => g.load === 0), ahead);
        sets[laden].show(gatherers.filter((g) => g.load > 0), ahead);
      }
      for (const kind of ['philosopherTrainee', 'actorTrainee'] as const) {
        sets[kind].show(state.trainees.filter((t) => t.kind === kind), ahead);
      }
      sets.shepherd.show(state.shepherds.filter((s) => s.fleece === 0), ahead);
      sets.shepherdWithFleece.show(state.shepherds.filter((s) => s.fleece > 0), ahead);
      sets.grower.show(state.growers.filter((g) => g.olives === 0), ahead);
      sets.growerWithOlives.show(state.growers.filter((g) => g.olives > 0), ahead);
      const coat = (fleece: number): SheepCoat => (fleece >= FULL_FLEECE ? 'woollySheep' : fleece >= HALF_GROWN ? 'halfGrownSheep' : 'shornSheep');
      for (const kind of ['shornSheep', 'halfGrownSheep', 'woollySheep'] as const) {
        sets[kind].show(state.sheep.filter((s) => coat(s.fleece) === kind), ahead);
      }
    },
  };
}

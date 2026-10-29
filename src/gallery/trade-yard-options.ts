import * as THREE from 'three';
import { PARTNER_COLORS, PALETTE } from '../render/palette';
import { tentedBays, type YardBay } from '../render/trade-yard-models';
import { figureModel } from '../render/kit/walker';
import { donkey, merchantIn, packSacks } from '../render/walker-layer';
import { COLORS } from '../render/kit/kit';
import type { DesignOption } from './options';

type Build = (staffed: boolean, bays: (YardBay | null)[]) => THREE.Object3D;

const OURS = COLORS.aegean;
const THEIRS = PARTNER_COLORS.corinth;
const bay = (good: YardBay['good'], loads: number, flag: number): YardBay => ({ good, loads, flag });

const EMPTY = [bay('fleece', 0, OURS), bay('oil', 0, OURS), bay('marble', 0, THEIRS), null];
const EXPORTS = [bay('fleece', 6, OURS), bay('oil', 4, OURS), bay('cloth', 4, OURS), bay('sculptures', 2, OURS)];
const IMPORTS = [bay('food', 8, THEIRS), bay('marble', 6, THEIRS), bay('bronze', 4, THEIRS), bay('wood', 6, THEIRS)];
const LOADING = [bay('fleece', 2, OURS), bay('oil', 4, OURS), bay('marble', 6, THEIRS), bay('food', 3, THEIRS)];

const WEST = -Math.PI / 2;

function caravan(x: number): THREE.Object3D {
  const figure = figureModel([...merchantIn(PALETTE.merchantCloak), ...donkey(packSacks)]);
  figure.position.set(x, 0, -0.5);
  figure.rotation.y = WEST;
  return figure;
}

function facingGalleryRoad(yard: THREE.Object3D): THREE.Object3D {
  const turned = new THREE.Group();
  turned.add(yard);
  turned.rotation.y = Math.PI;
  turned.position.set(4, 0, 2);
  const placedOnLot = new THREE.Group();
  placedOnLot.add(turned);
  return placedOnLot;
}

const show = (yard: THREE.Object3D, ...walkers: THREE.Object3D[]) => {
  yard.add(...walkers);
  return facingGalleryRoad(yard);
};

const option = (name: string, build: Build): DesignOption => ({
  name,
  build: () => show(build(true, EXPORTS)),
  variants: [
    { label: 'No workers · slots set, empty', build: () => show(build(false, EMPTY)) },
    { label: 'Export slots full', build: () => show(build(true, EXPORTS)) },
    { label: 'Import slots full', build: () => show(build(true, IMPORTS)) },
    { label: 'A caravan loading out front', build: () => show(build(true, LOADING), caravan(1.2), caravan(1.75)) },
  ],
});

export const TRADE_YARD_OPTIONS: DesignOption[] = [
  option('A · Tented bays', tentedBays),
];

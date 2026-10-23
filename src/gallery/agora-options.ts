import * as THREE from 'three';
import { AGORA_VENDOR_SPOTS } from '../sim/buildings';
import { agoraFloor, emblemStall } from '../render/agora-models';
import type { Good } from '../render/kit/market';
import type { DesignOption } from './options';

const GOODS: Good[] = ['food', 'fleece', 'oil'];
const FULL = 8;
const LOW = 2;

function market(vendors: boolean, staffed: boolean, loads: number): THREE.Object3D {
  const group = new THREE.Group();
  group.add(agoraFloor());
  if (!vendors) return group;
  AGORA_VENDOR_SPOTS.forEach((spot, i) => {
    const stall = emblemStall(GOODS[i], staffed, loads);
    stall.position.set(spot.x, 0, spot.y);
    group.add(stall);
  });
  return group;
}

export const AGORA_OPTIONS: DesignOption[] = [
  {
    name: 'Emblem tents',
    notes: [
      'Soft linen ridge tents that sag between the poles, striped with a light tint of the vendor’s colour and fringed in it',
      'Each tent is crowned with a big gold-rimmed sign: a bowl of food on red, a white fleece on blue, a gold amphora on olive',
      'Staffed: a seller at a tiered stand heaped with goods — fruit, loaves and greens; white wool; jugs, olives and little amphorae — baskets in front',
      'Stock is stacked beside the stand, one sack, fleece roll or amphora per load',
    ],
    build: () => market(true, true, FULL),
    variants: [
      { label: 'Agora, no vendors yet', build: () => market(false, false, 0) },
      { label: 'Food, fleece, oil vendors — no workers, full stock', build: () => market(true, false, FULL) },
      { label: 'Staffed, low stock', build: () => market(true, true, LOW) },
      { label: 'Staffed, full stock', build: () => market(true, true, FULL) },
    ],
  },
];

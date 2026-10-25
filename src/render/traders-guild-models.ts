import * as THREE from 'three';
import { BUILDING_SPECS } from '../sim/buildings';
import { bakedOnce } from './bake';
import { steps, volume, windowsFront, windowsSide } from './kit/blocks';
import { CLOTH, clothBolt } from './kit/cloth';
import { blueDoor } from './kit/cottage';
import { posedFigure } from './kit/figure';
import { BLOOM, flowerPot, paving } from './kit/garden';
import { COLORS, box, cylinder, flat, surface } from './kit/kit';
import { cypress, fountain } from './kit/luxury';
import { seller } from './kit/market';
import { amphoraRow } from './kit/oil';
import { bakedFigure } from './staff';

const { width: W, height: D } = BUILDING_SPECS.tradersGuild;
const BACK = { x0: 0.3, z0: 0.25, w: 3.4, d: 1.05, top: 1.9 };
const WING = { z0: 1.3, w: 0.85, d: 1.45, top: 1.25 };
const WINGS_X = [0.3, W - 0.3 - WING.w];
const COLONNADE = { z: 3.35, height: 0.95, depth: 0.42, columns: 8 };
const AWNING = { height: 0.78, depth: 0.38, tilt: 0.3 };
const DISPLAY = { z: 3.25, xs: [0.85, 1.55, 2.45, 3.15] };
const MERCHANT = { x: 2.0, z: 3.0 };
const FACING_ROAD = 0;

function colonnade(): THREE.Object3D {
  const group = new THREE.Group();
  const { z, height, depth, columns } = COLONNADE;
  const x0 = 0.3;
  const x1 = W - 0.3;
  for (let i = 0; i < columns; i++) {
    const x = x0 + 0.08 + (i * (x1 - x0 - 0.16)) / (columns - 1);
    group.add(cylinder(0.05, 0.055, height, surface('whitewash'), x, 0.04, z + depth / 2, 12));
    group.add(box(0.12, 0.04, 0.12, surface('whitewash'), x, 0.04 + height - 0.04, z + depth / 2));
  }
  group.add(box(x1 - x0, 0.08, depth + 0.1, surface('whitewash'), (x0 + x1) / 2, 0.04 + height, z + depth / 2));
  group.add(box(x1 - x0, 0.06, 0.03, flat(COLORS.aegean), (x0 + x1) / 2, 0.04 + height + 0.01, z + depth + 0.065));
  return group;
}

function awnings(spread: boolean): THREE.Object3D {
  const group = new THREE.Group();
  for (const x0 of WINGS_X) {
    const x = x0 + WING.w / 2;
    const front = WING.z0 + WING.d;
    if (spread) {
      const cloth = box(WING.w - 0.06, 0.015, AWNING.depth, flat(CLOTH.dyed), x, AWNING.height, front + AWNING.depth / 2);
      cloth.rotation.x = AWNING.tilt;
      group.add(cloth);
      group.add(box(WING.w - 0.06, 0.05, 0.012, flat(CLOTH.band), x, AWNING.height - 0.1, front + AWNING.depth));
    } else {
      const rolled = cylinder(0.035, 0.035, WING.w - 0.06, flat(CLOTH.dyed), 0, 0, 0, 10);
      rolled.rotation.z = Math.PI / 2;
      rolled.position.set(x, AWNING.height + 0.04, front + 0.04);
      group.add(rolled);
    }
  }
  return group;
}

function clothDisplay(stocked: boolean): THREE.Object3D {
  const group = new THREE.Group();
  for (const x of DISPLAY.xs) {
    group.add(box(0.42, 0.18, 0.2, flat(COLORS.timber), x, 0.04, DISPLAY.z));
    if (stocked) group.add(clothBolt(x, 0.22, DISPLAY.z - 0.05, 0), clothBolt(x, 0.22, DISPLAY.z + 0.05, 0), clothBolt(x, 0.3, DISPLAY.z, 0));
  }
  return group;
}

function crates(): THREE.Object3D {
  const group = new THREE.Group();
  for (const [x, z, y] of [[3.35, 0.05, 0.04], [3.6, 0.05, 0.04], [3.47, 0.05, 0.24]]) {
    group.add(box(0.22, 0.2, 0.2, flat(COLORS.timber), x, y, 1.45 + z));
  }
  return group;
}

function guildShell(supplied: boolean): THREE.Object3D {
  const group = new THREE.Group();
  group.add(paving(0.08, 0.08, W - 0.16, D - 0.16));
  volume(group, BACK.x0, BACK.z0, BACK.w, BACK.d, BACK.top);
  windowsFront(group, [0.7, 1.3, 2.7, 3.3], BACK.z0 + BACK.d, [0.55, 1.25]);
  for (const x0 of WINGS_X) {
    volume(group, x0, WING.z0, WING.w, WING.d, WING.top);
    windowsFront(group, [x0 + 0.25, x0 + 0.6], WING.z0 + WING.d, [0.4]);
    windowsSide(group, x0 + WING.w, [WING.z0 + 0.4, WING.z0 + 1.05], [0.5]);
  }
  group.add(blueDoor(W / 2, BACK.z0 + BACK.d, 0.1, 0.5));
  steps(group, W / 2, BACK.z0 + BACK.d, 0.4);
  group.add(fountain(W / 2, 2.2, 0.32));
  group.add(flowerPot(1.4, 0.04, 1.6, BLOOM.red), flowerPot(2.6, 0.04, 1.6, BLOOM.pink));
  group.add(cypress(1.35, 2.75, 0.5), cypress(2.65, 2.75, 0.5));
  group.add(colonnade());
  group.add(awnings(supplied));
  group.add(clothDisplay(supplied));
  group.add(amphoraRow(0.2, 1.45, 0.2, 2.6, 5));
  group.add(crates());
  return group;
}

const shells = { supplied: bakedOnce(() => guildShell(true)), wanting: bakedOnce(() => guildShell(false)) };
const bakedMerchant = bakedFigure(seller);

export function tradersGuildModel(occupied: boolean, missingNeed: boolean): THREE.Object3D {
  const shell = missingNeed ? shells.wanting() : shells.supplied();
  if (occupied) shell.add(posedFigure(MERCHANT.x, MERCHANT.z, FACING_ROAD, 0, bakedMerchant(), 'rest'));
  return shell;
}

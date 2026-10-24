import * as THREE from 'three';
import { PALETTE } from '../palette';
import { lumpy, mottled, painted, pointHash, type FacePainter } from './rocks';

const LIT_FACING = 0.45;
const SHADE_FACING = -0.2;
const TRUNK_SIDES = 5;
const STUMP_SIDES = 7;
const HEARTWOOD = 0.5;
const CHIP_SIZE = 0.05;

export function foliage(lit: number, mid: number, shade: number): FacePainter {
  return mottled((_, normal) => (normal.y > LIT_FACING ? lit : normal.y < SHADE_FACING ? shade : mid));
}

export function crownClump(radius: number, seed: number, stretch: [number, number, number], at: [number, number, number]): THREE.BufferGeometry {
  return lumpy(new THREE.IcosahedronGeometry(radius, 0), radius * 0.22, seed)
    .scale(...stretch)
    .rotateY(seed)
    .translate(...at);
}

export function trunk(bottomRadius: number, topRadius: number, height: number, lean: number, turn: number, base: [number, number] = [0, 0]): THREE.BufferGeometry {
  return painted(
    new THREE.CylinderGeometry(topRadius, bottomRadius, height, TRUNK_SIDES, 1, true)
      .translate(0, height / 2, 0)
      .rotateZ(lean)
      .rotateY(turn)
      .translate(base[0], 0, base[1]),
    mottled(() => PALETTE.pineBark),
  );
}

export function topOfTrunk(height: number, lean: number, turn: number, base: [number, number] = [0, 0]): [number, number, number] {
  const top = new THREE.Vector3(0, height, 0).applyAxisAngle(new THREE.Vector3(0, 0, 1), lean).applyAxisAngle(new THREE.Vector3(0, 1, 0), turn);
  return [top.x + base[0], top.y, top.z + base[1]];
}

const cutFace = (centre: THREE.Vector3, normal: THREE.Vector3, middle: THREE.Vector3, radius: number) =>
  normal.y > LIT_FACING ? (centre.distanceTo(middle) < radius * HEARTWOOD ? PALETTE.stumpRing : PALETTE.stumpCut) : PALETTE.pineBark;

export function stump(radius: number, height: number, seed: number, at: [number, number] = [0, 0]): THREE.BufferGeometry[] {
  const middle = new THREE.Vector3(at[0], height, at[1]);
  const side = new THREE.CylinderGeometry(radius * 0.92, radius * 1.15, height, STUMP_SIDES, 1, true).translate(0, height / 2, 0);
  const top = new THREE.RingGeometry(radius * HEARTWOOD * 0.6, radius * 0.92, STUMP_SIDES, 1).rotateX(-Math.PI / 2).translate(0, height, 0);
  const heart = new THREE.CircleGeometry(radius * HEARTWOOD * 0.6, STUMP_SIDES).rotateX(-Math.PI / 2).translate(0, height, 0);
  const paint: FacePainter = mottled((c, n) => cutFace(c, n, middle, radius));
  return [side, top, heart].map((g) => painted(lumpy(g, radius * 0.06, seed).rotateY(seed).translate(at[0], 0, at[1]), paint));
}

export function woodChips(seed: number, count: number, spread: number, at: [number, number] = [0, 0]): THREE.BufferGeometry[] {
  return Array.from({ length: count }, (_, i) => {
    const place = new THREE.Vector3(seed, i, 0);
    const angle = pointHash(place, seed) * Math.PI * 2;
    const distance = spread * (0.6 + pointHash(place, seed + 1) * 0.4);
    return painted(
      new THREE.TetrahedronGeometry(CHIP_SIZE)
        .scale(1.4, 0.4, 0.8)
        .rotateY(angle)
        .translate(at[0] + Math.cos(angle) * distance, CHIP_SIZE * 0.3, at[1] + Math.sin(angle) * distance),
      () => PALETTE.stumpCut,
    );
  });
}

export function cypressSpire(radius: number, height: number, seed: number, sides: number, at: [number, number]): THREE.BufferGeometry {
  const profile = [
    [0.01, 0],
    [0.75, 0.08],
    [1, 0.3],
    [0.85, 0.55],
    [0.5, 0.8],
    [0.01, 1],
  ].map(([r, y]) => new THREE.Vector2(r * radius, y * height));
  return painted(
    lumpy(new THREE.LatheGeometry(profile, sides), radius * 0.12, seed).rotateY(seed).translate(at[0], 0, at[1]),
    foliage(PALETTE.cypressLit, PALETTE.cypress, PALETTE.cypress),
  );
}

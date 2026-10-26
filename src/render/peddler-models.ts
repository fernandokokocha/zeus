import * as THREE from 'three';
import { COLORS } from './kit/kit';
import { body, jar, type Part } from './kit/walker';
import { PALETTE } from './palette';

const box = (w: number, h: number, d: number, x: number, y: number, z: number, color: number): Part => ({
  geometry: new THREE.BoxGeometry(w, h, d).translate(x, y, z),
  color,
});

const ball = (r: number, x: number, y: number, z: number, color: number): Part => ({
  geometry: new THREE.SphereGeometry(r, 8, 6).translate(x, y, z),
  color,
});

const pole = (x: number, z: number, from: number, to: number): Part => ({
  geometry: new THREE.CylinderGeometry(0.008, 0.008, to - from, 5).translate(x, (from + to) / 2, z),
  color: PALETTE.trunk,
});

const wheel = (x: number, y: number, z: number, radius: number, width: number): Part => ({
  geometry: new THREE.CylinderGeometry(radius, radius, width, 12).rotateZ(Math.PI / 2).translate(x, y, z),
  color: PALETTE.doorway,
});

const loaf = (x: number, y: number, z: number): Part => ({
  geometry: new THREE.SphereGeometry(0.035, 8, 6).scale(1.4, 0.7, 1).translate(x, y, z),
  color: PALETTE.bread,
});

const amphora = (x: number, y: number, z: number, scale: number): Part => ({
  geometry: jar.clone().scale(scale, scale, scale).translate(x, y, z),
  color: PALETTE.terracotta,
});

export function awningCartPeddler(): Part[] {
  const bed = 0.13;
  return [
    ...body(COLORS.whitewash),
    box(0.22, 0.07, 0.26, 0, 0.1, 0.24, COLORS.whitewash),
    box(0.23, 0.015, 0.27, 0, 0.135, 0.24, COLORS.aegean),
    wheel(0, 0.055, 0.24, 0.055, 0.25),
    loaf(-0.05, bed + 0.03, 0.19),
    ball(0.025, 0.04, bed + 0.03, 0.18, PALETTE.fruit),
    ball(0.025, 0.06, bed + 0.03, 0.22, PALETTE.fruit),
    ball(0.03, -0.04, bed + 0.03, 0.29, PALETTE.greens),
    amphora(0.05, bed, 0.3, 0.6),
    pole(-0.1, 0.12, bed, 0.36),
    pole(0.1, 0.12, bed, 0.36),
    pole(-0.1, 0.36, bed, 0.36),
    pole(0.1, 0.36, bed, 0.36),
    box(0.26, 0.02, 0.3, 0, 0.37, 0.24, COLORS.aegean),
    box(0.27, 0.025, 0.06, 0, 0.385, 0.24, COLORS.whitewash),
  ];
}


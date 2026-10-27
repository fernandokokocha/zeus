import * as THREE from 'three';
import { at, rod } from './figure';
import { COLORS, box, cylinder, flat, sphere } from './kit';
import { PALACE, polishedGold } from './palace';
import { SCULPTURE } from './sculpture';

export interface Emblem {
  crown: () => THREE.Object3D;
  relief: (width: number, height: number) => THREE.Object3D;
}

const RELIEF_DEPTH = 0.03;
const CARVING = 0.014;
const FRONT = RELIEF_DEPTH / 2 + CARVING / 2;
const RELIEF_ROW = 0.2;
const DRUM = { radius: 0.3, height: 0.08 };

function reliefPanel(width: number, height: number): THREE.Group {
  const group = new THREE.Group();
  group.add(box(width, height, RELIEF_DEPTH, flat(COLORS.aegean), 0, 0, 0));
  return group;
}

function carved(w: number, h: number, x: number, y: number): THREE.Mesh {
  return box(w, h, CARVING, flat(PALACE.marble), x, y, FRONT);
}

function emblemDrum(): THREE.Group {
  const group = new THREE.Group();
  group.add(cylinder(DRUM.radius, DRUM.radius + 0.02, DRUM.height, flat(PALACE.marble), 0, 0, 0, 20));
  group.add(cylinder(DRUM.radius + 0.025, DRUM.radius + 0.025, 0.03, flat(COLORS.aegean), 0, 0.025, 0, 20));
  return group;
}

function crowdRelief(width: number, height: number): THREE.Object3D {
  const panel = reliefPanel(width, height);
  const rows = Math.max(1, Math.round(height / RELIEF_ROW));
  const rowHeight = (height - 0.04) / rows;
  const figure = rowHeight * 0.85;
  const step = figure * 0.42;
  const count = Math.floor((width - 0.06) / step);
  for (let row = 0; row < rows; row++) {
    const y = 0.02 + row * rowHeight;
    const shift = row % 2 ? step / 2 : 0;
    for (let i = 0; i < count - (row % 2); i++) {
      const x = -width / 2 + 0.03 + step * (i + 0.5) + shift;
      panel.add(carved(figure * 0.3, figure * 0.62, x, y));
      panel.add(sphere(figure * 0.14, flat(PALACE.marble), x, y + figure * 0.78, FRONT));
    }
  }
  return panel;
}

function bronzeCitizen(height: number, armsUp: boolean): THREE.Group {
  const group = new THREE.Group();
  const hip = height * 0.42;
  const shoulder = height * 0.74;
  const bronze = flat(SCULPTURE.bronze);
  for (const side of [-1, 1]) group.add(rod(at(side * height * 0.06, 0, 0), at(side * height * 0.04, hip, 0), height * 0.05, SCULPTURE.bronze));
  group.add(cylinder(height * 0.09, height * 0.13, shoulder - hip + 0.02, bronze, 0, hip - 0.01, 0, 8));
  group.add(sphere(height * 0.1, bronze, 0, shoulder + height * 0.12, 0));
  for (const side of [-1, 1]) {
    const hand = armsUp ? at(side * height * 0.2, height * 1.05, 0) : at(side * height * 0.16, hip, height * 0.06);
    group.add(rod(at(side * height * 0.1, shoulder, 0), hand, height * 0.04, SCULPTURE.bronze));
  }
  return group;
}

function muralCrown(radius: number, height: number): THREE.Group {
  const group = new THREE.Group();
  group.add(cylinder(radius, radius * 0.9, height, polishedGold, 0, 0, 0, 16));
  const towers = 6;
  for (let i = 0; i < towers; i++) {
    const a = (i / towers) * Math.PI * 2;
    group.add(box(radius * 0.42, height * 0.6, radius * 0.42, polishedGold, Math.cos(a) * radius * 0.95, height, Math.sin(a) * radius * 0.95));
  }
  return group;
}

const CROWD = { ring: 7, radius: 0.2, citizen: 0.3, leader: 0.42 };

function crowdCrown(): THREE.Object3D {
  const group = emblemDrum();
  for (let i = 0; i < CROWD.ring; i++) {
    const a = (i / CROWD.ring) * Math.PI * 2;
    const citizen = bronzeCitizen(CROWD.citizen, i % 2 === 0);
    citizen.position.set(Math.cos(a) * CROWD.radius, DRUM.height, Math.sin(a) * CROWD.radius);
    citizen.rotation.y = Math.PI / 2 - a;
    group.add(citizen);
  }
  group.add(bronzeCitizen(CROWD.leader, true).translateY(DRUM.height));
  group.add(muralCrown(0.08, 0.06).translateY(DRUM.height + CROWD.leader * 1.05));
  return group;
}

export const CROWDED_CITY: Emblem = { crown: crowdCrown, relief: crowdRelief };

function waves(panel: THREE.Group, width: number, y: number): void {
  for (let x = -width / 2 + 0.06; x < width / 2 - 0.03; x += 0.08) {
    const crest = sphere(0.022, flat(PALACE.marble), x, y, FRONT);
    crest.scale.set(1, 0.6, 0.5);
    panel.add(crest);
  }
}

function carvedShip(panel: THREE.Group, x: number, y: number, size: number): void {
  panel.add(carved(size, size * 0.14, x, y));
  for (const side of [-1, 1]) {
    const end = carved(size * 0.08, size * 0.24, x + side * size * 0.5, y + size * 0.02);
    end.rotation.z = side * -0.5;
    panel.add(end);
  }
  panel.add(carved(size * 0.03, size * 0.6, x, y + size * 0.14));
  panel.add(carved(size * 0.5, size * 0.36, x, y + size * 0.3));
}

function tradeRelief(width: number, height: number): THREE.Object3D {
  const panel = reliefPanel(width, height);
  const rows = Math.max(1, Math.round(height / (RELIEF_ROW * 2)));
  const rowHeight = (height - 0.04) / rows;
  for (let row = 0; row < rows; row++) {
    const y = 0.02 + row * rowHeight;
    waves(panel, width, y + rowHeight * 0.12);
    const ships = Math.max(1, Math.floor(width / (rowHeight * 2)));
    const size = Math.min(rowHeight * 0.95, width / ships - 0.08);
    for (let s = 0; s < ships; s++) carvedShip(panel, -width / 2 + (width / ships) * (s + 0.5), y + rowHeight * 0.2, size);
  }
  return panel;
}

const SHIP = { length: 0.5, beam: 0.14, hull: 0.08 };

function tradeCrown(): THREE.Object3D {
  const group = emblemDrum();
  const ship = new THREE.Group();
  ship.add(box(SHIP.length, SHIP.hull, SHIP.beam, polishedGold, 0, 0, 0));
  for (const side of [-1, 1]) {
    const end = box(0.06, 0.16, SHIP.beam * 0.7, polishedGold, side * SHIP.length * 0.52, 0.02, 0);
    end.rotation.z = side * -0.45;
    ship.add(end);
  }
  ship.add(cylinder(0.012, 0.012, 0.36, flat(COLORS.timber), 0, SHIP.hull, 0, 6));
  ship.add(box(0.3, 0.22, 0.015, flat(PALACE.marble), 0, SHIP.hull + 0.1, 0.01));
  ship.add(box(0.3, 0.04, 0.017, flat(COLORS.aegean), 0, SHIP.hull + 0.2, 0.01));
  ship.position.y = DRUM.height + 0.02;
  ship.rotation.y = Math.PI / 4;
  group.add(ship);
  return group;
}

export const TRADE_ROUTE: Emblem = { crown: tradeCrown, relief: tradeRelief };

export function friezeAround(emblem: Emblem, cx: number, cz: number, w: number, d: number, y: number, height: number): THREE.Group {
  const group = new THREE.Group();
  const MARGIN = 0.12;
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    const facesZ = i % 2 === 0;
    const face = emblem.relief((facesZ ? w : d) - MARGIN, height);
    const half = (facesZ ? d : w) / 2;
    face.position.set(cx + Math.sin(a) * half, y, cz + Math.cos(a) * half);
    face.rotation.y = a;
    group.add(face);
  }
  return group;
}

export function monumentSteps(cx: number, cz: number, widths: number[], rise: number, base: number): { steps: THREE.Group; top: number } {
  const steps = new THREE.Group();
  widths.forEach((w, i) => steps.add(box(w, rise, w, flat(PALACE.marble), cx, base + i * rise, cz)));
  return { steps, top: base + widths.length * rise };
}

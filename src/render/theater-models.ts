import * as THREE from 'three';
import { BUILDING_SPECS } from '../sim/buildings';
import type { Building } from '../sim/state';
import { bakedOnce } from './bake';
import { blueDoor } from './kit/cottage';
import { actor, tragedian } from './kit/drama-school';
import { type FigureParts, posedFigure } from './kit/figure';
import { COLORS, box, flat, surface } from './kit/kit';
import { cypress, lawn } from './kit/luxury';
import { evenly, marbleColumn, palaceGround } from './kit/palace';
import { tiledRoof } from './kit/roofs';
import { type Cavea, THEATER, audience, cavea, caveaRim, chorusRing, garland, hangingCloth, mast, orchestra } from './kit/theater';
import { bakedFigure, staffPhase } from './staff';

const { width: W, height: D } = BUILDING_SPECS.theater;
const BASE = 0.03;
const CLOSED = 0;
const OPEN = 1.2;
const TOWARD_THE_SEATS = Math.PI / 2;
const CHORUS = 6;

interface Performer {
  x: number;
  z: number;
  turn: number;
}

const troupe = () => [tragedian(), actor()];

export function withPerformers(shell: THREE.Object3D, phase: number, parts: FigureParts[]): THREE.Object3D {
  SEMICIRCLE_PERFORMERS.forEach((p, i) => {
    shell.add(posedFigure(p.x, p.z, p.turn, phase + i * 3, parts[i], 'declaim'));
  });
  return shell;
}

const SEMICIRCLE: Cavea = { cx: W / 2, cz: 2.8, inner: 1.0, outer: 2.3, tiers: 7, riser: 0.09, from: Math.PI, to: 2 * Math.PI, aisles: 5 };
const SKENE = { x0: 1.0, x1: 4.0, z0: 3.8, z1: 4.35, top: 0.5 };
const PROSKENION = { z0: 3.55, height: 0.2, columns: 8 };
const PARODOS_X = [0.55, W - 0.55];
const SEMICIRCLE_PERFORMERS: Performer[] = [
  { x: 2.05, z: 3.3, turn: TOWARD_THE_SEATS },
  { x: 2.95, z: 3.3, turn: TOWARD_THE_SEATS },
];

function marbleSkene(group: THREE.Group, performing: boolean): void {
  const { x0, x1, z0, z1, top } = SKENE;
  const walls = surface('whitewash');
  const middle = (x0 + x1) / 2;
  group.add(box(x1 - x0, top, z1 - z0, walls, middle, BASE, (z0 + z1) / 2));
  group.add(box(x1 - x0 + 0.03, 0.05, z1 - z0 + 0.03, flat(COLORS.aegean), middle, top - 0.05, (z0 + z1) / 2));
  group.add(tiledRoof(x0 - 0.05, z0 - 0.05, x1 - x0 + 0.1, z1 - z0 + 0.1, top + BASE, 0.16));
  group.add(box(x1 - x0, PROSKENION.height, z0 - PROSKENION.z0, walls, middle, BASE, (PROSKENION.z0 + z0) / 2));
  for (const x of evenly(x0 + 0.1, x1 - 0.1, PROSKENION.columns)) group.add(marbleColumn(x, PROSKENION.z0, PROSKENION.height, BASE));
  group.add(blueDoor(middle, z1, BASE, performing ? OPEN : CLOSED));
  if (performing) for (const x of [x0 + 0.5, x1 - 0.5]) group.add(hangingCloth(x, top - 0.02, z1 + 0.01, 0.42, 0.34, 0, COLORS.aegean));
}

function parodosGate(group: THREE.Group, x: number, performing: boolean): void {
  const walls = surface('whitewash');
  const [z0, z1] = [SEMICIRCLE.cz + 0.12, PROSKENION.z0 - 0.05];
  for (const z of [z0, z1]) group.add(box(0.12, 0.5, 0.1, walls, x, BASE, z));
  group.add(box(0.14, 0.08, z1 - z0 + 0.12, walls, x, BASE + 0.5, (z0 + z1) / 2));
  group.add(box(0.15, 0.03, z1 - z0 + 0.14, flat(COLORS.aegean), x, BASE + 0.46, (z0 + z1) / 2));
  if (performing) {
    const garlandSide = x < W / 2 ? x - 0.08 : x + 0.08;
    const along = garland(0, z1 - z0, 0, 0, 0.1, 9);
    along.rotation.y = -Math.PI / 2;
    along.position.set(garlandSide, BASE + 0.45, z0);
    group.add(along);
  }
}

export function whiteSemicircleShell(performing: boolean): THREE.Object3D {
  const group = new THREE.Group();
  group.add(palaceGround(W, D));
  group.add(lawn(0.1, SKENE.z1 + 0.05, W - 0.2, D - SKENE.z1 - 0.15));
  group.add(cavea(SEMICIRCLE, [surface('whitewash'), flat(THEATER.marbleShade)]));
  group.add(caveaRim(SEMICIRCLE, 0.1, 0.1));
  group.add(orchestra(SEMICIRCLE.cx, SEMICIRCLE.cz, 0.8));
  marbleSkene(group, performing);
  for (const x of PARODOS_X) parodosGate(group, x, performing);
  for (const x of [0.3, W - 0.3]) group.add(cypress(x, D - 0.3, 0.5));
  for (const x of [0.55, W - 0.55]) group.add(mast(x, D - 0.55, 1.0, performing, COLORS.aegean));
  if (performing) {
    group.add(audience(SEMICIRCLE, 11));
    group.add(chorusRing(SEMICIRCLE.cx, SEMICIRCLE.cz, 0.38, CHORUS, 'tragic'));
  }
  return group;
}

export function whiteSemicircle(performing: boolean): THREE.Object3D {
  const shell = whiteSemicircleShell(performing);
  return performing ? withPerformers(shell, 0, troupe()) : shell;
}

const shells = { idle: bakedOnce(() => whiteSemicircleShell(false)), performing: bakedOnce(() => whiteSemicircleShell(true)) };
const bakedTragedian = bakedFigure(tragedian);
const bakedActor = bakedFigure(actor);

export function theaterModel(theater: Building, performing: boolean): THREE.Object3D {
  if (!performing) return shells.idle();
  return withPerformers(shells.performing(), staffPhase(theater), [bakedTragedian(), bakedActor()]);
}

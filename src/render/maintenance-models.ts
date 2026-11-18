import * as THREE from 'three';
import type { Building } from '../sim/state';
import { bakedOnce } from './bake';
import { blueDoor, windowHole } from './kit/cottage';
import { type FigureParts, posedFigure } from './kit/figure';
import { COLORS, box, flat, jar, lotGround, surface } from './kit/kit';
import { MAINTENANCE, ladder, lashedStand, lookout, pole, sailShade } from './kit/maintenance';
import { bakedFigure, staffPhase } from './staff';

const CLOSED = 0;
const OPEN = 1.2;
const FACING_THE_CAMERA = -Math.PI / 4;
const STAND = { cx: 0.6, cz: 0.6, height: 1.2 };
const DECK = STAND.height + 0.035;
const SHED = { x0: 0.95, z0: 0.9, w: 0.85, d: 0.72, low: 0.42, high: 0.6 };

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

function shedOffice(staffed: boolean): THREE.Object3D {
  const { x0, z0, w, d, low, high } = SHED;
  const [cx, cz, front] = [x0 + w / 2, z0 + d / 2, z0 + d];
  const group = new THREE.Group();
  group.add(box(w + 0.06, 0.05, d + 0.06, surface('rubble'), cx, 0.03, cz));
  const wall = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(d, 0), new THREE.Vector2(d, high), new THREE.Vector2(0, low)]);
  const walls = new THREE.Mesh(new THREE.ExtrudeGeometry(wall, { depth: w, bevelEnabled: false }), surface('whitewash'));
  walls.rotation.y = -Math.PI / 2;
  walls.position.set(x0 + w, 0.08, z0);
  group.add(walls);
  group.add(box(w + 0.012, 0.1, d + 0.012, flat(COLORS.aegean), cx, 0.08, cz));
  const pitch = Math.atan2(high - low, d);
  const roof = new THREE.Group();
  for (let i = 0; i < 6; i++) {
    const shade = i % 2 ? MAINTENANCE.plank : COLORS.timber;
    roof.add(box((w + 0.16) / 6 - 0.008, 0.035, Math.hypot(d, high - low) + 0.16, flat(shade), -(w + 0.16) / 2 + ((w + 0.16) / 6) * (i + 0.5), 0, 0));
  }
  roof.position.set(cx, 0.08 + (low + high) / 2, cz);
  roof.rotation.x = -pitch;
  group.add(roof);
  group.add(blueDoor(x0 + 0.26, front, 0.08, staffed ? OPEN : CLOSED));
  group.add(windowHole(x0 + w - 0.2, front, 0.32));
  return group;
}

function storageJars(spots: [number, number][]): THREE.Object3D {
  const group = new THREE.Group();
  for (const [i, [x, z]] of spots.entries()) group.add(jar(x, 0.03, z, 0.85 + (i % 2) * 0.15, MAINTENANCE.glaze));
  return group;
}

function maintenanceShell(staffed: boolean): THREE.Object3D {
  const { cx, cz, height } = STAND;
  const group = new THREE.Group();
  group.add(lotGround(surface('rubble')));
  group.add(shedOffice(staffed));
  group.add(lashedStand(cx, cz, 0.62, 0.44, height));
  group.add(pole(v(cx - 0.24, DECK, cz - 0.24), v(cx - 0.24, DECK + 1.1, cz - 0.24), 0.016));
  group.add(pole(v(cx + 0.24, DECK, cz - 0.24), v(cx + 0.24, DECK + 1.1, cz - 0.24), 0.016));
  group.add(sailShade([v(cx - 0.3, DECK + 1.08, cz - 0.26), v(cx + 0.3, DECK + 1.08, cz - 0.26), v(cx + 0.34, DECK + 0.82, cz + 0.32), v(cx - 0.34, DECK + 0.82, cz + 0.32)], 0.06));
  group.add(pole(v(cx - 0.34, DECK + 0.82, cz + 0.32), v(cx - 0.3, DECK + 0.05, cz + 0.24), 0.005, MAINTENANCE.rope));
  group.add(pole(v(cx + 0.34, DECK + 0.82, cz + 0.32), v(cx + 0.3, DECK + 0.05, cz + 0.24), 0.005, MAINTENANCE.rope));
  group.add(ladder(cx + 0.05, cz + 0.55, height + 0.05, 0.32, 0));
  group.add(storageJars([[0.3, 1.45], [0.45, 1.6], [0.3, 1.72], [1.85, 0.6]]));
  return group;
}

function withWatchman(shell: THREE.Object3D, phase: number, parts: FigureParts): THREE.Object3D {
  const watchman = posedFigure(STAND.cx + 0.08, STAND.cz + 0.1, FACING_THE_CAMERA, phase, parts, 'lookout');
  watchman.position.y += DECK;
  shell.add(watchman);
  return shell;
}

export function maintenanceOffice(staffed: boolean): THREE.Object3D {
  const shell = maintenanceShell(staffed);
  return staffed ? withWatchman(shell, 0, lookout()) : shell;
}

const shells = { staffed: bakedOnce(() => maintenanceShell(true)), empty: bakedOnce(() => maintenanceShell(false)) };
const bakedWatchman = bakedFigure(lookout);

export function maintenanceOfficeModel(office: Building): THREE.Object3D {
  if (office.workers === 0) return shells.empty();
  return withWatchman(shells.staffed(), staffPhase(office), bakedWatchman());
}

import * as THREE from 'three';
import { windowsSide } from '../render/kit/blocks';
import { blueDoor, frontWindow, sideWindow, terraceBlock } from '../render/kit/cottage';
import { posedFigure } from '../render/kit/figure';
import { portico } from '../render/kit/garden';
import { lotGround, surface } from '../render/kit/kit';
import { amphora } from '../render/kit/oil';
import { tiledRoof } from '../render/kit/roofs';
import { awning, barredWindow, clerk, countingTable, ironDoor, strongbox, taxStele } from '../render/kit/tax';
import { treasury } from '../render/tax-models';
import { type DesignOption, withoutAndWithWorkers } from './options';

const CLOSED = 0;
const OPEN = 1.2;
const FACING_THE_ROAD = -Math.PI / 2;

function countingPorch(staffed: boolean): THREE.Object3D {
  const group = new THREE.Group();
  group.add(lotGround(surface('rubble')));
  group.add(terraceBlock(0.15, 0.15, 1.25, 0.8, 0.9));
  group.add(tiledRoof(0.11, 0.11, 1.33, 0.88, 0.93, 0.32));
  group.add(blueDoor(0.38, 0.95, 0.12, staffed ? OPEN : CLOSED));
  group.add(frontWindow(1.15, 0.95, 0.45));
  group.add(sideWindow(1.4, 0.55, 0.45));
  group.add(portico(0.15, 0.95, 1.4, 1.25, 0.82, [[0.2, 1.22], [0.8, 1.22], [1.35, 1.22]]));
  group.add(countingTable(0.9, 1.62, 0.5, staffed));
  if (staffed) group.add(posedFigure(0.9, 1.4, FACING_THE_ROAD, 0, clerk(), 'rest'));
  group.add(strongbox(1.65, 1.35, staffed, -0.3));
  group.add(amphora(1.75, 0.5), amphora(1.62, 0.42));
  group.add(taxStele(1.7, 1.78));
  return group;
}

function strongroomAndBooth(staffed: boolean): THREE.Object3D {
  const group = new THREE.Group();
  group.add(lotGround(surface('rubble')));
  group.add(terraceBlock(0.15, 0.15, 0.85, 0.85, 1.4));
  group.add(ironDoor(0.58, 1.0, 0.12));
  group.add(barredWindow(0.58, 1.0, 1.05));
  windowsSide(group, 1.0, [0.58], [1.05]);
  group.add(terraceBlock(1.05, 0.15, 0.8, 0.6, 0.95));
  group.add(blueDoor(1.45, 0.75, 0.12, staffed ? OPEN : CLOSED));
  group.add(awning(1.05, 0.8, 1.85, 1.3, 0.92, 0.8));
  group.add(countingTable(1.45, 1.62, 0.55, staffed));
  if (staffed) group.add(posedFigure(1.45, 1.4, FACING_THE_ROAD, 0, clerk(), 'rest'));
  group.add(strongbox(0.35, 1.3, staffed, 0.2));
  group.add(taxStele(0.25, 1.75));
  return group;
}

export const TAX_OPTIONS: DesignOption[] = [
  {
    name: 'A · Counting porch',
    notes: [
      'A white office under red tiles with a blue-posted porch; the clerk counts coins at a table in front of it',
      'Staffed: coin stacks, a bronze balance and a wax tablet on the table, the strongbox open and full of gold, door open',
      'Empty: bare table, strongbox locked, door shut. A tax notice stone stands by the road',
    ],
    build: () => countingPorch(true),
    variants: withoutAndWithWorkers(countingPorch),
  },
  {
    name: 'B · Strongroom and booth',
    notes: [
      'A tall windowless strongroom with an iron-banded door and barred window — where the money is kept',
      'Beside it a low office with a blue-and-white striped awning, the counting table in front of it',
      'Staffed: clerk at the table with coins and scales, strongbox open. Empty: bare table, box locked',
    ],
    build: () => strongroomAndBooth(true),
    variants: withoutAndWithWorkers(strongroomAndBooth),
  },
  {
    name: 'C · Little treasury',
    notes: [
      'A tiny marble treasury with two columns and the Palace’s blue-and-gold pediment: it works for the Palace',
      'Paved forecourt between cypresses, a tax notice stone by the road',
      'Staffed: the clerk stands by an open strongbox of gold with his tablet; door open. Empty: box locked, nobody there',
    ],
    build: () => treasury(true),
    variants: withoutAndWithWorkers(treasury),
  },
];

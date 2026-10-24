import * as THREE from 'three';
import { painted, vertexColoured } from './kit/rocks';
import { crownClump, cypressSpire, foliage, stump, topOfTrunk, trunk, woodChips } from './kit/trees';
import { PALETTE } from './palette';

const pineCrown = foliage(PALETTE.pineNeedlesLit, PALETTE.pineNeedles, PALETTE.pineNeedlesShade);
const oakCrown = foliage(PALETTE.holmOakLit, PALETTE.holmOak, PALETTE.holmOakShade);

const UMBRELLA_HEIGHT = 0.78;
const UMBRELLA_LEAN = 0.22;
const UMBRELLA_TURN = 0.6;
const UMBRELLA_FORK = 0.38;
const UMBRELLA_BRANCH = 0.32;
const UMBRELLA_BRANCH_LEAN = -0.8;

function umbrellaPine(): THREE.Mesh {
  const [x, y, z] = topOfTrunk(UMBRELLA_HEIGHT, UMBRELLA_LEAN, UMBRELLA_TURN);
  const [forkX, forkY, forkZ] = topOfTrunk(UMBRELLA_FORK, UMBRELLA_LEAN, UMBRELLA_TURN);
  const [branchX, branchY, branchZ] = topOfTrunk(UMBRELLA_BRANCH, UMBRELLA_BRANCH_LEAN, UMBRELLA_TURN);
  return vertexColoured([
    trunk(0.075, 0.04, UMBRELLA_HEIGHT, UMBRELLA_LEAN, UMBRELLA_TURN),
    trunk(0.04, 0.025, UMBRELLA_BRANCH, UMBRELLA_BRANCH_LEAN, UMBRELLA_TURN, [forkX, forkZ]).translate(0, forkY, 0),
    painted(crownClump(0.34, 1, [1.3, 0.4, 1.15], [x, y + 0.04, z]), pineCrown),
    painted(crownClump(0.22, 2, [1.25, 0.45, 1.1], [x + 0.2, y + 0.12, z - 0.16]), pineCrown),
    painted(crownClump(0.22, 3, [1.3, 0.42, 1.2], [forkX + branchX, forkY + branchY + 0.03, forkZ + branchZ]), pineCrown),
  ]);
}

function cypressPair(): THREE.Mesh {
  return vertexColoured([
    trunk(0.045, 0.04, 0.14, 0, 0, [-0.12, 0.06]),
    cypressSpire(0.2, 1.55, 11, 6, [-0.12, 0.06]).translate(0, 0.1, 0),
    trunk(0.04, 0.035, 0.12, 0, 0, [0.2, -0.16]),
    cypressSpire(0.15, 1.1, 12, 5, [0.2, -0.16]).translate(0, 0.08, 0),
  ]);
}

function holmOak(): THREE.Mesh {
  return vertexColoured([
    trunk(0.1, 0.06, 0.4, 0.08, 1.8),
    trunk(0.045, 0.03, 0.26, 0.7, 1.8).translate(0, 0.24, 0),
    painted(crownClump(0.38, 21, [1.05, 0.78, 1], [0, 0.7, 0]), oakCrown),
    painted(crownClump(0.26, 22, [1, 0.85, 1], [0.26, 0.6, 0.18]), oakCrown),
    painted(crownClump(0.25, 23, [1, 0.85, 1], [-0.26, 0.58, 0.14]), oakCrown),
    painted(crownClump(0.24, 24, [1, 0.8, 1], [0.05, 0.9, -0.18]), oakCrown),
  ]);
}

const STONE_PINE_STEMS: [number, number, number][] = [
  [0.3, -0.08, 0.6],
  [-0.25, 0.08, 2.6],
  [0.12, 0.02, 4.4],
];

function stonePineBush(): THREE.Mesh {
  return vertexColoured([
    ...STONE_PINE_STEMS.map(([lean, offset, turn]) => trunk(0.05, 0.035, 0.4, lean, turn, [offset, -offset * 1.5])),
    painted(crownClump(0.44, 31, [1.15, 0.3, 1.1], [0, 0.5, 0]), pineCrown),
    painted(crownClump(0.26, 32, [1.1, 0.35, 1], [-0.16, 0.6, -0.12]), pineCrown),
    painted(crownClump(0.22, 33, [1.2, 0.45, 1.1], [0.28, 0.4, 0.22]), pineCrown),
  ]);
}

const youngPine = (height: number, seed: number, at: [number, number]): THREE.BufferGeometry[] => [
  trunk(0.04, 0.025, height, 0.05, seed, at),
  painted(crownClump(0.2, seed, [1, 0.6, 1], [at[0], height * 0.45, at[1]]), pineCrown),
  painted(crownClump(0.15, seed + 1, [1, 0.7, 1], [at[0], height * 0.72, at[1]]), pineCrown),
  painted(crownClump(0.09, seed + 2, [1, 1.1, 1], [at[0], height * 0.97, at[1]]), pineCrown),
];

function youngPines(): THREE.Mesh {
  return vertexColoured([...youngPine(1.0, 41, [-0.2, 0.18]), ...youngPine(0.72, 44, [0.2, -0.16])]);
}

export const FOREST_TREES: (() => THREE.Mesh)[] = [umbrellaPine, cypressPair, holmOak, stonePineBush, youngPines];

export const FOREST_STUMPS: (() => THREE.Mesh)[] = [
  () => vertexColoured([...stump(0.09, 0.1, 1), ...woodChips(1, 4, 0.22)]),
  () => vertexColoured([...stump(0.06, 0.08, 2, [-0.12, 0.06]), ...stump(0.055, 0.07, 3, [0.2, -0.16]), ...woodChips(2, 3, 0.16)]),
  () => vertexColoured([...stump(0.12, 0.12, 4), ...woodChips(4, 5, 0.24)]),
  () => vertexColoured([...STONE_PINE_STEMS.map(([, offset], i) => stump(0.06, 0.08, 5 + i, [offset, -offset * 1.5])).flat(), ...woodChips(5, 3, 0.24)]),
  () => vertexColoured([...stump(0.055, 0.07, 6, [-0.2, 0.18]), ...stump(0.045, 0.06, 7, [0.2, -0.16]), ...woodChips(6, 3, 0.16)]),
];

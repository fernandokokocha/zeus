import * as THREE from 'three';
import { block, boulder, groundedStone, lumpy, lumpyStone, mottled, painted, pointHash, sliced, vertexColoured, veinedStone, type FacePainter } from './kit/rocks';
import { PALETTE } from './palette';

const VEIN_SPACING = 0.24;
const VEIN_WIDTH = 0.14;
const BASE_HEIGHT = 0.05;
const CUT_FACE = 0.85;

const marbleFace = (seed: number, base: number = PALETTE.marbleFace): FacePainter =>
  mottled(groundedStone(veinedStone(base, PALETTE.marbleVein, seed, VEIN_SPACING, VEIN_WIDTH), PALETTE.marbleBase, BASE_HEIGHT));

const withCutFaces = (stone: FacePainter, isCut: (normal: THREE.Vector3) => boolean, cut: number = PALETTE.marbleCut): FacePainter =>
  (centroid, normal) => (isCut(normal) ? cut : stone(centroid, normal));

const onGround = (geometry: THREE.BufferGeometry) => sliced(geometry, 'y', 0, 'above');

function splitBoulder(): THREE.Mesh {
  const whole = boulder(11, 0.16).scale(0.44, 0.42, 0.4).translate(0, 0.27, 0);
  const half = (keep: 'above' | 'below', side: number) =>
    onGround(sliced(whole.clone(), 'x', 0, keep).rotateZ(-side * 0.1).translate(side * 0.05, 0, 0).rotateY(0.5));
  const cutFace = withCutFaces(marbleFace(3), (n) => Math.abs(n.y) < 0.5 && Math.abs(n.x * 0.88 - n.z * 0.48) > CUT_FACE);
  return vertexColoured([
    painted(half('below', -1), cutFace),
    painted(half('above', 1), cutFace),
    painted(onGround(boulder(5).scale(0.09, 0.07, 0.08).translate(0.3, 0.03, -0.28)), marbleFace(4, PALETTE.marbleCream)),
  ]);
}

function steppedLedge(): THREE.Mesh {
  const step = (width: number, depth: number, level: number, back: number, seed: number): THREE.BufferGeometry =>
    painted(
      block(width, 0.2, depth, 0.02, seed).translate(0, 0.1 + level * 0.19, -back).rotateY(0.35),
      withCutFaces(marbleFace(seed), (n) => n.y > CUT_FACE),
    );
  return vertexColoured([
    step(0.84, 0.74, 0, 0, 21),
    step(0.64, 0.5, 1, 0.1, 22),
    step(0.4, 0.3, 2, 0.18, 23),
    painted(block(0.14, 0.1, 0.12, 0.015, 24).rotateY(0.6).translate(0.3, 0.05, 0.36), withCutFaces(marbleFace(24), (n) => n.y > CUT_FACE)),
  ]);
}

function blockCluster(): THREE.Mesh {
  const piece = (size: [number, number, number], at: [number, number], turn: number, tilt: number, seed: number): THREE.BufferGeometry =>
    painted(
      onGround(block(...size, 0.025, seed).rotateZ(tilt).translate(0, size[1] / 2, 0).rotateY(turn).translate(at[0], 0, at[1])),
      withCutFaces(marbleFace(seed), (n) => n.y > CUT_FACE),
    );
  return vertexColoured([
    piece([0.36, 0.3, 0.32], [-0.1, -0.06], 0.4, 0, 31),
    piece([0.22, 0.4, 0.22], [0.14, -0.22], -0.2, 0.06, 32),
    piece([0.28, 0.22, 0.26], [0.2, 0.16], -0.35, 0.12, 33),
    piece([0.2, 0.15, 0.22], [-0.24, 0.24], 0.9, -0.1, 34),
    piece([0.13, 0.1, 0.13], [0.36, -0.06], 0.3, 0.2, 35),
  ]);
}

function crackedSlab(): THREE.Mesh {
  const slab = lumpy(new THREE.BoxGeometry(0.88, 0.26, 0.72, 4, 2, 4), 0.02, 41).translate(0, 0.1, 0).rotateY(0.8);
  const half = (keep: 'above' | 'below', side: number) => onGround(sliced(slab.clone(), 'x', 0.04, keep).translate(side * 0.03, 0, 0).rotateY(-0.8));
  const crackFace = withCutFaces(marbleFace(42), (n) => Math.abs(n.y) < 0.4 && Math.abs(n.x * 0.7 + n.z * 0.72) > CUT_FACE, PALETTE.marbleVein);
  return vertexColoured([
    painted(half('below', -1), crackFace),
    painted(half('above', 1).translate(0, 0.02, 0), crackFace),
    painted(onGround(boulder(43).scale(0.08, 0.06, 0.07).translate(-0.36, 0.03, 0.3)), marbleFace(44, PALETTE.marbleCream)),
    painted(onGround(boulder(45).scale(0.06, 0.05, 0.06).translate(0.4, 0.02, -0.12)), marbleFace(46, PALETTE.marbleCream)),
  ]);
}

function pinnacle(): THREE.Mesh {
  return vertexColoured([
    painted(onGround(boulder(51, 0.14).scale(0.36, 0.17, 0.32).translate(0, 0.08, 0)), marbleFace(52, PALETTE.marbleCream)),
    painted(onGround(boulder(53, 0.12).scale(0.2, 0.42, 0.18).rotateZ(0.08).translate(-0.04, 0.4, -0.02)), marbleFace(54)),
    painted(onGround(boulder(55, 0.15).scale(0.14, 0.2, 0.13).translate(0.2, 0.14, 0.14)), marbleFace(56)),
  ]);
}

const TOP_FACING = 0.55;
const SIDE_FACING = 0.5;

const rockShade = (normal: THREE.Vector3) => (normal.y > TOP_FACING ? PALETTE.oreRock : PALETTE.oreRockShadow);

function speckled(seed: number, malachiteShare: number, copperShare: number): FacePainter {
  return (centre, normal) => {
    const roll = pointHash(centre, seed);
    if (roll < malachiteShare) return PALETTE.malachite;
    if (roll < malachiteShare + copperShare) return PALETTE.copperVein;
    return rockShade(normal);
  };
}

const nugget = (radius: number, x: number, y: number, z: number) =>
  painted(new THREE.IcosahedronGeometry(radius, 0).translate(x, y, z), () => PALETTE.copperGlint);

function veinedMound(): THREE.Mesh {
  const bands = veinedStone(PALETTE.oreRock, PALETTE.copperVein, 1, 0.13, 0.28);
  const veins: FacePainter = mottled((c, normal) => (bands(c, normal) === PALETTE.copperVein ? PALETTE.copperVein : rockShade(normal)));
  return vertexColoured([
    painted(lumpyStone(0.31, 1, 0.14, 2).scale(1.2, 0.62, 1.05).translate(0, 0.06, 0), veins),
    painted(lumpyStone(0.07, 2, 0.2).translate(0.3, 0.03, 0.18), speckled(2, 0, 0.2)),
    painted(lumpyStone(0.05, 3, 0.2).translate(-0.28, 0.02, 0.24), speckled(3, 0, 0)),
  ]);
}

const CRUST_FACING = 0.5;

function malachiteCrags(): THREE.Mesh {
  const crust = speckled(4, 0, 0.12);
  const crusted: FacePainter = mottled((c, normal) => (normal.y > CRUST_FACING ? PALETTE.malachite : crust(c, normal)));
  const crag = (radius: number, height: number, seed: number, tilt: number, x: number, z: number) =>
    painted(lumpyStone(radius, seed, 0.22).scale(1, height, 0.85).rotateZ(tilt).rotateY(seed).translate(x, radius * height * 0.75, z), crusted);
  return vertexColoured([
    crag(0.18, 1.7, 5, 0.12, -0.08, -0.06),
    crag(0.15, 1.35, 6, -0.3, 0.15, 0.04),
    crag(0.13, 1.15, 7, 0.35, -0.06, 0.18),
    painted(lumpyStone(0.06, 8, 0.2).translate(0.2, 0.02, -0.18), crusted),
  ]);
}

function glintingRubble(): THREE.Mesh {
  const stones: [number, number, number, number][] = [
    [0, 0.1, 0, 0.13],
    [0.17, 0.05, 0.06, 0.1],
    [-0.15, 0.05, 0.1, 0.1],
    [0.05, 0.05, -0.18, 0.1],
    [-0.12, 0.04, -0.14, 0.09],
    [0.12, 0.04, 0.2, 0.08],
    [-0.04, 0.04, 0.24, 0.08],
    [0.26, 0.03, -0.12, 0.07],
    [-0.27, 0.03, -0.02, 0.07],
  ];
  return vertexColoured([
    ...stones.map(([x, y, z, r], i) => painted(lumpyStone(r, 10 + i, 0.25).scale(1, 0.75, 1).translate(x, y, z), mottled(speckled(10 + i, 0.06, 0)))),
    nugget(0.05, 0.08, 0.17, 0.06),
    nugget(0.04, -0.1, 0.11, 0.02),
    nugget(0.045, 0.1, 0.1, -0.1),
    nugget(0.035, -0.06, 0.08, 0.18),
    nugget(0.035, 0.22, 0.07, 0.15),
  ]);
}

const CLEFT_TURN = Math.PI / 4;
const CLEFT_AXIS = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), CLEFT_TURN);

function crackedOreBoulder(): THREE.Mesh {
  const half = (side: number, seed: number) => {
    const cut: FacePainter = mottled((_, normal) => (normal.dot(CLEFT_AXIS) * side < -SIDE_FACING ? PALETTE.copperVein : rockShade(normal)));
    return painted(lumpyStone(0.24, seed, 0.12, 1).scale(0.62, 0.85, 1).translate(side * 0.12, 0.14, 0).rotateY(CLEFT_TURN), cut);
  };
  return vertexColoured([
    half(1, 20),
    half(-1, 21),
    nugget(0.08, 0, 0.12, 0),
    nugget(0.05, 0.03, 0.24, 0.03),
    painted(lumpyStone(0.06, 22, 0.2).translate(0.2, 0.02, 0.24), speckled(22, 0.2, 0.2)),
  ]);
}

function stoneCluster(): THREE.Mesh {
  const flats: [number, number, number][] = [
    [-0.12, -0.1, 0.19],
    [0.17, -0.12, 0.16],
    [0.14, 0.17, 0.15],
    [-0.17, 0.18, 0.13],
    [0.02, 0.03, 0.14],
  ];
  return vertexColoured(
    flats.map(([x, z, r], i) =>
      painted(lumpyStone(r, 30 + i, 0.2).scale(1.1, 0.5 + i * 0.08, 0.95).rotateY(i).translate(x, r * 0.25, z), mottled(speckled(30 + i, 0.08, 0.12))),
    ),
  );
}

export const MARBLE_OUTCROPS: (() => THREE.Mesh)[] = [splitBoulder, steppedLedge, blockCluster, crackedSlab, pinnacle];

export const COPPER_DEPOSITS: (() => THREE.Mesh)[] = [veinedMound, malachiteCrags, glintingRubble, crackedOreBoulder, stoneCluster];

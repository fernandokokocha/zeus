import * as THREE from 'three';
import { bakedOnce } from './bake';
import { doricShaft, goldBand, goldEagle, ionicShaft, laurelRing, pavedSquare, roundSteps, sphinx, squareBlueBand, squareSteps, victoryWreath } from './kit/column';

const STEP_RISE = 0.05;

export function doricVotive(): THREE.Object3D {
  const group = new THREE.Group();
  group.add(pavedSquare());
  const { steps, top } = squareSteps([0.66, 0.52, 0.38], STEP_RISE);
  group.add(steps);
  group.add(doricShaft(top, 1.0, 0.1).shaft);
  return group;
}

export function ionicSphinx(): THREE.Object3D {
  const group = new THREE.Group();
  group.add(pavedSquare());
  const { steps, top } = squareSteps([0.6, 0.46, 0.3, 0.26, 0.26, 0.28], STEP_RISE);
  group.add(steps);
  group.add(squareBlueBand(top - 0.09, 0.27));
  const { shaft, top: capital } = ionicShaft(top, 1.0, 0.075);
  group.add(shaft);
  group.add(sphinx(capital));
  return group;
}

export function laurelVotive(): THREE.Object3D {
  const group = new THREE.Group();
  group.add(pavedSquare());
  const { steps, top } = roundSteps([0.4, 0.34], STEP_RISE);
  group.add(steps);
  group.add(laurelRing(top, 0.2, 10));
  const { shaft, top: capital } = doricShaft(top, 1.05, 0.075);
  group.add(shaft);
  group.add(goldBand(top + 0.18, 0.08));
  group.add(victoryWreath(top + 0.85, 0.075));
  group.add(goldEagle(capital));
  return group;
}

export const columnModel = bakedOnce(doricVotive);

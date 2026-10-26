import * as THREE from 'three';
import { shackModel } from '../render/house-models';
import { cart, figureModel, type Part } from '../render/kit/walker';
import { PALETTE } from '../render/palette';
import { awningCartPeddler } from '../render/peddler-models';
import type { DesignOption } from './options';

const cartPusher = cart([{ geometry: new THREE.BoxGeometry(0.15, 0.08, 0.16).translate(0, 0.18, 0.22), color: PALETTE.sack }]);

function onTheRoad(peddler: Part[]): THREE.Object3D {
  const scene = new THREE.Group();
  scene.add(shackModel());
  const walker = figureModel(peddler);
  walker.position.set(2.5, 0, 2.5);
  walker.rotation.y = -Math.PI / 2;
  scene.add(walker);
  const pusher = figureModel(cartPusher);
  pusher.position.set(1.2, 0, 2.5);
  pusher.rotation.y = -Math.PI / 2;
  scene.add(pusher);
  return scene;
}

export const PEDDLER_OPTIONS: DesignOption[] = [
  { name: 'Awning cart', build: () => onTheRoad(awningCartPeddler()) },
];

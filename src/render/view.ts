import * as THREE from 'three';
import { PALETTE } from './palette';

const ELEVATION = Math.PI / 6;
const ISO_DIRECTION = new THREE.Vector3(
  Math.cos(ELEVATION) * Math.SQRT1_2,
  Math.sin(ELEVATION),
  Math.cos(ELEVATION) * Math.SQRT1_2,
);
const CAMERA_DISTANCE = 200;
const VISIBLE_WORLD_HEIGHT = 30;

export interface View {
  canvas: HTMLCanvasElement;
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  target: THREE.Vector3;
}

export function createView(canvas: HTMLCanvasElement, target: THREE.Vector3): View {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(PALETTE.sky);
  scene.add(new THREE.HemisphereLight(0xfff4e0, 0x6b5a40, 1.5));
  const sun = new THREE.DirectionalLight(0xfff1d6, 2);
  sun.position.set(-30, 60, 20);
  scene.add(sun);

  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1000);
  const view = { canvas, renderer, scene, camera, target };
  resizeView(view);
  placeCamera(view);
  return view;
}

export function resizeView(view: View): void {
  const width = view.canvas.clientWidth;
  const height = view.canvas.clientHeight;
  view.renderer.setSize(width, height, false);
  const halfHeight = VISIBLE_WORLD_HEIGHT / 2;
  const halfWidth = (halfHeight * width) / height;
  view.camera.left = -halfWidth;
  view.camera.right = halfWidth;
  view.camera.top = halfHeight;
  view.camera.bottom = -halfHeight;
  view.camera.updateProjectionMatrix();
}

export function placeCamera(view: View): void {
  view.camera.position.copy(view.target).addScaledVector(ISO_DIRECTION, CAMERA_DISTANCE);
  view.camera.lookAt(view.target);
}

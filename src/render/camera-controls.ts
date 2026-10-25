import * as THREE from 'three';
import type { Point } from '../sim/point';
import { placeCamera, type View } from './view';

const KEY_PAN_PIXELS_PER_SECOND = 700;
const ZOOM_PER_WHEEL_PIXEL = 0.00075;
const MIN_ZOOM = 0.4;
const MAX_ZOOM = 4;
const MIDDLE_BUTTON = 1;
const TILE_CENTRE = 0.5;
const SCREEN_RIGHT_ON_GROUND = new THREE.Vector3(1, 0, -1).normalize();
const SCREEN_UP_ON_GROUND = new THREE.Vector3(-1, 0, -1).normalize();
const GROUND_STRETCH_ALONG_SCREEN_UP = 1 / Math.sin(Math.PI / 6);

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export function attachCameraControls(view: View, mapSize: number): { update(dt: number): void; focus(tile: Point): void } {
  const { canvas, camera, target } = view;
  const held = new Set<string>();
  let dragFrom: { x: number; y: number } | null = null;

  function pan(dxPixels: number, dyPixels: number): void {
    const worldPerPixel = (camera.top - camera.bottom) / camera.zoom / canvas.clientHeight;
    target.addScaledVector(SCREEN_RIGHT_ON_GROUND, -dxPixels * worldPerPixel);
    target.addScaledVector(SCREEN_UP_ON_GROUND, dyPixels * worldPerPixel * GROUND_STRETCH_ALONG_SCREEN_UP);
    target.x = clamp(target.x, 0, mapSize);
    target.z = clamp(target.z, 0, mapSize);
    placeCamera(view);
  }

  window.addEventListener('keydown', (e) => held.add(e.key.toLowerCase()));
  window.addEventListener('keyup', (e) => held.delete(e.key.toLowerCase()));
  window.addEventListener('blur', () => held.clear());

  canvas.addEventListener('mousedown', (e) => {
    if (e.button !== MIDDLE_BUTTON) return;
    e.preventDefault();
    dragFrom = { x: e.clientX, y: e.clientY };
  });
  window.addEventListener('mousemove', (e) => {
    if (!dragFrom) return;
    pan(e.clientX - dragFrom.x, e.clientY - dragFrom.y);
    dragFrom = { x: e.clientX, y: e.clientY };
  });
  window.addEventListener('mouseup', (e) => {
    if (e.button === MIDDLE_BUTTON) dragFrom = null;
  });

  canvas.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      const factor = Math.exp(-e.deltaY * ZOOM_PER_WHEEL_PIXEL);
      camera.zoom = clamp(camera.zoom * factor, MIN_ZOOM, MAX_ZOOM);
      camera.updateProjectionMatrix();
    },
    { passive: false },
  );

  return {
    update(dt) {
      const step = KEY_PAN_PIXELS_PER_SECOND * dt;
      let dx = 0;
      let dy = 0;
      if (held.has('a') || held.has('arrowleft')) dx += step;
      if (held.has('d') || held.has('arrowright')) dx -= step;
      if (held.has('w') || held.has('arrowup')) dy += step;
      if (held.has('s') || held.has('arrowdown')) dy -= step;
      if (dx !== 0 || dy !== 0) pan(dx, dy);
    },
    focus(tile) {
      target.x = tile.x + TILE_CENTRE;
      target.z = tile.y + TILE_CENTRE;
      placeCamera(view);
    },
  };
}

import * as THREE from 'three';
import './style.css';
import { attachCameraControls } from './render/camera-controls';
import { createGhostLayer } from './render/ghost-layer';
import { createHighlightLayer } from './render/highlight-layer';
import { createOverlayLayer } from './render/overlay-layer';
import { createTerrainLayer } from './render/terrain-layer';
import { createView, resizeView } from './render/view';
import { createWalkerLayer } from './render/walker-layer';
import { createWorldLayer } from './render/world-layer';
import { TICKS_PER_SECOND } from './sim/clock';
import { tick } from './sim/tick';
import { createGame } from './sim/state';
import { byId } from './ui/dom';
import { createInspector } from './ui/inspector';
import { createMapModes } from './ui/map-modes';
import { attachToolInput } from './ui/tool-input';
import { createToolbar } from './ui/toolbar';
import { createTopbar } from './ui/topbar';

const MAX_TICKS_PER_FRAME = 40;
const MAX_FRAME_SECONDS = 0.25;
const START_VIEW_OFFSET = 15;

const state = createGame();
const view = createView(
  byId<HTMLCanvasElement>('view'),
  new THREE.Vector3(state.entry.x + START_VIEW_OFFSET, 0, state.entry.y),
);
const terrain = createTerrainLayer();
view.scene.add(terrain.group);
const world = createWorldLayer();
view.scene.add(world.group);
const walkers = createWalkerLayer();
view.scene.add(walkers.group);
const overlay = createOverlayLayer(state.size);
view.scene.add(overlay.mesh);
const ghost = createGhostLayer(state.size);
view.scene.add(ghost.mesh);
const highlight = createHighlightLayer(state.size);
view.scene.add(highlight.mesh);

const controls = attachCameraControls(view, state.size);
const topbar = createTopbar(state);
const inspector = createInspector(state, highlight);
const mapModes = createMapModes();
const input = attachToolInput({
  view,
  state,
  ghost,
  inspector,
  topbar,
  toolbar: createToolbar(() => input.toolChanged()),
});
window.addEventListener('resize', () => resizeView(view));

let last = performance.now();
let pendingTicks = 0;

function frame(now: number): void {
  const dt = Math.min((now - last) / 1000, MAX_FRAME_SECONDS);
  last = now;
  controls.update(dt);

  pendingTicks += dt * state.speed * TICKS_PER_SECOND;
  let ticks = 0;
  while (pendingTicks >= 1 && ticks < MAX_TICKS_PER_FRAME) {
    tick(state);
    pendingTicks--;
    ticks++;
  }
  if (ticks === MAX_TICKS_PER_FRAME) pendingTicks = 0;

  terrain.sync(state);
  world.sync(state);
  walkers.sync(state, state.speed > 0 ? pendingTicks : 0);
  overlay.sync(state, mapModes.shown());
  topbar.update();
  inspector.refresh();
  view.renderer.render(view.scene, view.camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

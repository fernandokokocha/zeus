import * as THREE from 'three';
import { PALETTE, TERRAIN_COLORS } from '../render/palette';
import { HUT_OPTIONS } from './hut-options';
import { SHACK_OPTIONS } from './shack-options';
import { HOVEL_OPTIONS } from './hovel-options';
import { bake } from '../render/bake';
import type { DesignSet } from './options';

const SETS: Record<string, DesignSet> = {
  hut: { title: 'Hut', needs: 'Level 1 · 8 people · needs nothing — fresh settlers', options: HUT_OPTIONS, chosen: 2 },
  shack: { title: 'Shack', needs: 'Level 2 · 16 people · needs food', options: SHACK_OPTIONS, chosen: 2, previous: HUT_OPTIONS[2] },
  hovel: { title: 'Hovel', needs: 'Level 3 · 24 people · needs food and water', options: HOVEL_OPTIONS, chosen: 1, previous: SHACK_OPTIONS[2] },
};

const ELEVATION = Math.PI / 6;
const ISO = new THREE.Vector3(Math.cos(ELEVATION) * Math.SQRT1_2, Math.sin(ELEVATION), Math.cos(ELEVATION) * Math.SQRT1_2);
const GAME_PIXELS_PER_TILE = 30;
const MAX_ZOOM = 4;

function scene(): THREE.Scene {
  const s = new THREE.Scene();
  s.background = new THREE.Color(PALETTE.sky);
  s.add(new THREE.HemisphereLight(0xfff4e0, 0x6b5a40, 1.5));
  const sun = new THREE.DirectionalLight(0xfff1d6, 2);
  sun.position.set(-30, 60, 20);
  s.add(sun);
  return s;
}

function ground(x: number, z: number, w: number, d: number, color: number, lift = 0): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, 0.02, d), new THREE.MeshLambertMaterial({ color }));
  mesh.position.set(x + w / 2, -0.01 + lift, z + d / 2);
  return mesh;
}

function renderer(canvas: HTMLCanvasElement): THREE.WebGLRenderer {
  const r = new THREE.WebGLRenderer({ canvas, antialias: true });
  r.setPixelRatio(window.devicePixelRatio);
  r.setSize(canvas.clientWidth, canvas.clientHeight, false);
  return r;
}

function camera(width: number, height: number, target: THREE.Vector3, pixelsPerUnit: number): THREE.OrthographicCamera {
  const halfW = width / pixelsPerUnit / 2;
  const halfH = height / pixelsPerUnit / 2;
  const cam = new THREE.OrthographicCamera(-halfW, halfW, halfH, -halfH, 0.1, 500);
  cam.position.copy(target).addScaledVector(ISO, 100);
  cam.lookAt(target);
  return cam;
}

function closeUp(canvas: HTMLCanvasElement, build: () => THREE.Object3D): void {
  const r = renderer(canvas);
  const s = scene();
  s.add(ground(-3, -3, 9, 9, TERRAIN_COLORS.grass));
  s.add(ground(-3, 2, 9, 1, PALETTE.road, 0.005));
  const pivot = new THREE.Group();
  pivot.position.set(1, 0, 1);
  const model = build();
  model.position.set(-1, 0, -1);
  pivot.add(model);
  s.add(pivot);
  const cam = camera(canvas.clientWidth, canvas.clientHeight, new THREE.Vector3(1, 0.35, 1), GAME_PIXELS_PER_TILE * MAX_ZOOM);
  const draw = () => r.render(s, cam);
  let dragX: number | null = null;
  canvas.addEventListener('pointerdown', (e) => (dragX = e.clientX));
  window.addEventListener('pointerup', () => (dragX = null));
  window.addEventListener('pointermove', (e) => {
    if (dragX === null) return;
    pivot.rotation.y += (e.clientX - dragX) * 0.01;
    dragX = e.clientX;
    draw();
  });
  draw();
}

function strip(canvas: HTMLCanvasElement, set: DesignSet): void {
  const r = renderer(canvas);
  r.setScissorTest(true);
  const s = scene();
  s.add(ground(-20, -20, 60, 60, TERRAIN_COLORS.grass));
  s.add(ground(-20, 2, 60, 1, PALETTE.road, 0.005));
  const row = set.previous ? [set.previous, ...set.options] : set.options;
  row.forEach((option, i) => {
    for (let copy = 0; copy < 2; copy++) {
      const model = bake(option.build());
      model.position.set(i * 5 + copy * 2, 0, 0);
      s.add(model);
    }
  });
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const halves = [{ zoom: 1, x: 0 }, { zoom: 2, x: width / 2 }];
  for (const { zoom, x } of halves) {
    const cam = camera(width / 2, height, new THREE.Vector3(row.length * 2.5 - 0.5, 0, 1.5), GAME_PIXELS_PER_TILE * zoom);
    r.setViewport(x, 0, width / 2, height);
    r.setScissor(x, 0, width / 2, height);
    r.render(s, cam);
  }
}

const level = new URLSearchParams(location.search).get('level') ?? 'hut';
const set = SETS[level];
const stripCaption = set.previous ? 'Chosen previous level first, then the options' : 'The options';
document.getElementById('nav')!.innerHTML = Object.entries(SETS).map(([key, s]) => `<a href="?level=${key}">${s.title}</a>`).join('');
document.getElementById('title')!.textContent = `${set.title} — 3 options`;
document.getElementById('needs')!.textContent = `${set.needs}. Close-ups are at max game zoom; drag to rotate.`;
const cards = document.getElementById('cards')!;
set.options.forEach((option, i) => {
  const card = document.createElement('div');
  card.className = i === set.chosen ? 'card chosen' : 'card';
  card.innerHTML = `<canvas></canvas><h2>${option.name}</h2><ul>${option.notes.map((n) => `<li>${n}</li>`).join('')}</ul>`;
  cards.append(card);
  closeUp(card.querySelector('canvas')!, option.build);
});
document.getElementById('strip-caption')!.textContent = `${stripCaption}, at default game zoom (left) and 2× (right)`;
strip(document.getElementById('strip') as HTMLCanvasElement, set);

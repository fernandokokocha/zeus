import * as THREE from 'three';
import { PALETTE, TERRAIN_COLORS } from '../render/palette';
import { HUT_OPTIONS } from './hut-options';
import { SHACK_OPTIONS } from './shack-options';
import { HOVEL_OPTIONS } from './hovel-options';
import { HOMESTEAD_OPTIONS } from './homestead-options';
import { TENEMENT_OPTIONS } from './tenement-options';
import { APARTMENT_OPTIONS } from './apartment-options';
import { TOWNHOUSE_OPTIONS } from './townhouse-options';
import { FARM_OPTIONS } from './farm-options';
import { bake } from '../render/bake';
import type { Animate } from '../render/kit/farm';
import type { DesignSet } from './options';

const SETS: Record<string, DesignSet> = {
  hut: { title: 'Hut', needs: 'Level 1 · 8 people · needs nothing — fresh settlers', options: HUT_OPTIONS, chosen: 2 },
  shack: { title: 'Shack', needs: 'Level 2 · 16 people · needs food', options: SHACK_OPTIONS, chosen: 2, previous: HUT_OPTIONS[2] },
  hovel: { title: 'Hovel', needs: 'Level 3 · 24 people · needs food and water', options: HOVEL_OPTIONS, chosen: 1, previous: SHACK_OPTIONS[2] },
  homestead: { title: 'Homestead', needs: 'Level 4 · 32 people · needs food, water and fleece', options: HOMESTEAD_OPTIONS, chosen: 2, previous: HOVEL_OPTIONS[1] },
  tenement: { title: 'Tenement', needs: 'Level 5 · 40 people · needs food, water, fleece and more culture and appeal', options: TENEMENT_OPTIONS, chosen: 2, previous: HOMESTEAD_OPTIONS[2] },
  apartment: { title: 'Apartment', needs: 'Level 6 · 48 people · needs food, water, fleece and oil', options: APARTMENT_OPTIONS, chosen: 0, previous: TENEMENT_OPTIONS[2] },
  townhouse: { title: 'Townhouse', needs: 'Level 7 · 60 people · needs food, water, fleece, oil and top culture and appeal', options: TOWNHOUSE_OPTIONS, chosen: 1, previous: APARTMENT_OPTIONS[0] },
  wheatFarm: { title: 'Wheat Farm', needs: '3×3 · 10 workers · every growth stage, without and with workers', options: FARM_OPTIONS, chosen: 0, size: 3 },
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

function closeUp(canvas: HTMLCanvasElement, build: () => THREE.Object3D, size: number): void {
  const r = renderer(canvas);
  const s = scene();
  const half = size / 2;
  s.add(ground(-3, -3, size + 7, size + 7, TERRAIN_COLORS.grass));
  s.add(ground(-3, size, size + 7, 1, PALETTE.road, 0.005));
  const pivot = new THREE.Group();
  pivot.position.set(half, 0, half);
  const model = build();
  model.position.set(-half, 0, -half);
  pivot.add(model);
  s.add(pivot);
  const cam = camera(canvas.clientWidth, canvas.clientHeight, new THREE.Vector3(half, 0.35, half), GAME_PIXELS_PER_TILE * MAX_ZOOM);
  const draw = () => r.render(s, cam);
  const animations: Animate[] = [];
  model.traverse((node) => node.userData.animate && animations.push(node.userData.animate));
  if (animations.length) {
    const tick = (ms: number) => {
      for (const animate of animations) animate(ms / 1000);
      draw();
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
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
  const size = set.size ?? 2;
  s.add(ground(-20, size, 60, 1, PALETTE.road, 0.005));
  const row = set.previous ? [set.previous, ...set.options] : set.options;
  let rowEnd = 0;
  row.forEach((option) => {
    const builds = option.variants?.map((v) => v.build) ?? [option.build, option.build];
    builds.forEach((build) => {
      const model = bake(build());
      model.position.set(rowEnd, 0, 0);
      s.add(model);
      rowEnd += size;
    });
    rowEnd += 1;
  });
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const halves = [{ zoom: 1, x: 0 }, { zoom: 2, x: width / 2 }];
  for (const { zoom, x } of halves) {
    const cam = camera(width / 2, height, new THREE.Vector3(rowEnd / 2 - 0.5, 0, size / 2 + 0.5), GAME_PIXELS_PER_TILE * zoom);
    r.setViewport(x, 0, width / 2, height);
    r.setScissor(x, 0, width / 2, height);
    r.render(s, cam);
  }
}

const level = new URLSearchParams(location.search).get('level') ?? 'hut';
const set = SETS[level];
const stripCaption = set.previous ? 'Chosen previous level first, then the options' : 'The options';
document.getElementById('nav')!.innerHTML = Object.entries(SETS).map(([key, s]) => `<a href="?level=${key}">${s.title}</a>`).join('');
const count = set.options.length;
document.getElementById('title')!.textContent = `${set.title} — ${count} option${count > 1 ? 's' : ''}`;
document.getElementById('needs')!.textContent = `${set.needs}. Close-ups are at max game zoom; drag to rotate.`;
const cards = document.getElementById('cards')!;
if (set.options.some((o) => o.variants)) cards.classList.add('single');
set.options.forEach((option, i) => {
  const card = document.createElement('div');
  card.className = i === set.chosen ? 'card chosen' : 'card';
  const variants = option.variants ?? [{ label: '', build: option.build }];
  const canvases = option.variants
    ? `<div class="variants">${variants.map((v) => `<figure><canvas></canvas><figcaption>${v.label}</figcaption></figure>`).join('')}</div>`
    : '<canvas></canvas>';
  card.innerHTML = `${canvases}<h2>${option.name}</h2><ul>${option.notes.map((n) => `<li>${n}</li>`).join('')}</ul>`;
  cards.append(card);
  card.querySelectorAll('canvas').forEach((canvas, v) => closeUp(canvas, variants[v].build, set.size ?? 2));
});
document.getElementById('strip-caption')!.textContent = `${stripCaption}, at default game zoom (left) and 2× (right)`;
strip(document.getElementById('strip') as HTMLCanvasElement, set);
